const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '.env') });

if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            nodeProfilingIntegration(),
        ],
        tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.1,
        profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE) : 0.1,
        beforeSend(event) {
            if (event.request) {
                if (event.request.headers && event.request.headers.authorization) {
                    event.request.headers.authorization = '[REDACTED]';
                }
                if (event.request.cookies) {
                    event.request.cookies = '[REDACTED]';
                }
                if (event.request.data) {
                    try {
                        let data = event.request.data;
                        let isString = typeof data === 'string';
                        if (isString) data = JSON.parse(data);
                        if (data.password) data.password = '[REDACTED]';
                        if (data.code) data.code = '[REDACTED]';
                        event.request.data = isString ? JSON.stringify(data) : data;
                    } catch (e) {}
                }
            }
            return event;
        }
    });
}

const { getTranslation } = require('./utils/translations');
const express       = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const http          = require('http');
const { Server }    = require('socket.io');
const cors          = require('cors');
const helmet        = require('helmet');
const path          = require('path');
const bcrypt        = require('bcryptjs');
const rateLimit     = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB     = require('./config/db');
const xssMiddleware = require('./middlewares/xssMiddleware');
const User          = require('./models/User');
const Message       = require('./models/Message');
const { isAccountAllowed, getAccountDeniedMessage } = require('./utils/accountSecurity');
const { validateChatMessagePayload } = require('./utils/chatSecurity');
const { validateChatParticipants } = require('./utils/chatGuards');
const { verifyAccessToken } = require('./utils/authSecurity');
const { buildCorsOptions } = require('./utils/corsPolicy');
const { buildHelmetOptions } = require('./utils/cspConfig');
const { rejectNoSqlOperators, validationErrorHandler } = require('./utils/securityValidation');
const {
    registrationIpLimiter,
    verificationIpLimiter
} = require('./utils/abuseGuards');
const { ensureDefaultPackages } = require('./utils/packageCatalog');

// Load env vars (always resolve from this file's directory)
dotenv.config({ path: path.join(__dirname, '.env') });

// ── JWT Secret Validation ────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is not defined.');
    process.exit(1);
}
if (process.env.NODE_ENV === 'production' && (JWT_SECRET === 'airyphone_super_secret_jwt_key_2024_change_in_production' || JWT_SECRET.length < 32)) {
    logger.error('❌ CRITICAL SECURITY ERROR: Weak or default JWT_SECRET is not allowed in production.');
    process.exit(1);
}
if (process.env.JWT_ACCESS_KEYS) {
    try {
        const parsedKeys = JSON.parse(process.env.JWT_ACCESS_KEYS);
        const activeKid = process.env.JWT_ACTIVE_KID || 'primary';
        if (!parsedKeys[activeKid] || parsedKeys[activeKid].length < 32) {
            logger.error('❌ CRITICAL SECURITY ERROR: Active JWT_ACCESS_KEYS entry is missing or weak.');
            process.exit(1);
        }
    } catch (error) {
        logger.error('❌ CRITICAL SECURITY ERROR: JWT_ACCESS_KEYS must be valid JSON.');
        process.exit(1);
    }
}
if (process.env.NODE_ENV === 'production') {
    if (!process.env.REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET.length < 32) {
        logger.error('❌ CRITICAL SECURITY ERROR: REFRESH_TOKEN_SECRET is required in production.');
        process.exit(1);
    }
    if (!/^[0-9a-f]{64}$/i.test(process.env.TWO_FACTOR_SECRET_ENCRYPTION_KEY || '')) {
        logger.error('❌ CRITICAL SECURITY ERROR: TWO_FACTOR_SECRET_ENCRYPTION_KEY must be a 32-byte hex key in production.');
        process.exit(1);
    }
}

// ── Connect to Database & Auto-Seed Admin ────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.error('❌ CRITICAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not defined.');
    process.exit(1);
}

async function seedAdmin() {
    try {
        const exists = await User.findOne({ email: ADMIN_EMAIL });
        if (exists) {
            logger.info('ℹ️  Admin account already exists — skipping seed.');
            return;
        }
        const salt   = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, salt);
        await User.create({
            name:     'Admin',
            lastName: 'Mobil',
            email:    ADMIN_EMAIL,
            password: hashed,
            role:     'admin',
            status:   'active',
            isVerified: true
        });
        logger.info('✅ Admin account seeded: ' + ADMIN_EMAIL);
    } catch (err) {
        logger.error('❌ Admin seed failed:', err.message);
    }
}

const { expirePromotions, expireUnverifiedUsers, expireAds, notifyExpiringAds } = require('./utils/expiryChecker');
const { acquireLock } = require('./utils/redisLock');
const { cleanupOrphanedUploads } = require('./utils/uploadCleanup');

// Distributed Scheduler Configuration:
// - Redis lock ('scheduler:expiry_checks') ensures only one instance executes this job concurrently.
// - Single-instance / Local development fallback: if Redis is not configured or offline, 
//   the lock acquisition will gracefully bypass and run the scheduled job locally.
// - In clustered production deployments, ensure a centralized Redis connection via REDIS_URL.
const runScheduledExpiryChecks = async () => {
    const lock = await acquireLock('scheduler:expiry_checks', 30000);
    if (!lock.acquired) {
        logger.info('[Scheduler] Expiry checks skipped: lock is already held by another instance.');
        return;
    }

    try {
        await Promise.all([
            expirePromotions().catch(err => logger.error('Expiry check failed:', err.message)),
            expireAds().catch(err => logger.error('Ad expiry check failed:', err.message)),
            notifyExpiringAds().catch(err => logger.error('Ad expiry warning check failed:', err.message)),
            expireUnverifiedUsers().catch(err => logger.error('Unverified expiry check failed:', err.message)),
            cleanupOrphanedUploads().catch(err => logger.error('Upload cleanup failed:', err.message))
        ]);
    } finally {
        await lock.release();
    }
};

connectDB().then(async () => {
    await seedAdmin();
    await ensureDefaultPackages();
    if (process.env.DISABLE_IN_PROCESS_SCHEDULER !== 'true') {
        setTimeout(runScheduledExpiryChecks, 5000);
        setInterval(runScheduledExpiryChecks, Number(process.env.EXPIRY_CHECK_INTERVAL_MS || 60 * 60 * 1000));
    } else {
        logger.info('In-process scheduler disabled; run expiryChecker jobs from an external scheduler.');
    }
});

const app = express();
const server = http.createServer(app);

if (process.env.TRUST_PROXY_HOPS) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
}

// ── CORS Configuration ────────────────────────────────────
const corsOptions = buildCorsOptions();

const io = new Server(server, { cors: corsOptions });
app.set('io', io);

// Helper to identify admin requests to exempt them from rate limits
const isAdminRequest = (req) => {
    const raw = req.body?.email || req.body?.identifier || req.user?.email || '';
    const email = String(raw).trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'mobil@gmail.com').toLowerCase();
    if (email === adminEmail || email === 'mobil@gmail.com') return true;
    if (req.user && (req.user.role === 'admin' || req.user.email?.toLowerCase() === 'mobil@gmail.com')) return true;
    return false;
};

// ── Rate Limiters ─────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAdminRequest(req),
    message: { message: 'Çox sayda sorğu göndərildi. Zəhmət olmasa bir az gözləyin.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 30,                    // max 30 login/register attempts per 15min
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAdminRequest(req),
    message: { message: 'Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən cəhd edin.' }
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 15,                     // max 15 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAdminRequest(req),
    message: { message: 'Çox sayda sorğu göndərildi. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.' }
});

const passwordResetLimiter = rateLimit({
    windowMs: Number(process.env.PASSWORD_RESET_RATE_WINDOW_MS || 60 * 60 * 1000),
    max: Number(process.env.PASSWORD_RESET_RATE_LIMIT || 5),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAdminRequest(req),
    message: { message: 'Əgər bu email qeydiyyatdan keçibsə, sıfırlama linki göndəriləcək' }
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.UPLOAD_RATE_LIMIT || 20),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çox sayda yükləmə sorğusu. Zəhmət olmasa bir az sonra yenidən cəhd edin.' }
});

// ── Middlewares ────────────────────────────────────────────
app.use(helmet(buildHelmetOptions()));
app.use(cors(corsOptions));

const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
    req.id = uuidv4();
    res.setHeader('X-Request-Id', req.id);
    next();
});

// Body parsers MUST come before route-specific rate limiters so req.body can be inspected
app.use(express.json({
    limit: process.env.JSON_BODY_LIMIT || '100kb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true, limit: process.env.URLENCODED_BODY_LIMIT || '100kb' }));
app.use(rejectNoSqlOperators);
app.use(mongoSanitize());
app.use(xssMiddleware);

app.use(globalLimiter);

// Specific strict rate limits for brute-force sensitive endpoints
// Note: /api/auth/login is managed by authRoutes with loginLimiter and admin bypass
app.post('/api/auth/register', registrationIpLimiter);
app.post('/api/auth/send-otp', verificationIpLimiter);
app.post('/api/auth/verify-otp', verificationIpLimiter);
app.post('/api/auth/forgot-password', passwordResetLimiter);
app.post('/api/auth/resend-reset', passwordResetLimiter);
app.post('/api/ads', strictLimiter);
app.post('/api/reports', strictLimiter);
app.post('/api/wallet/topup', strictLimiter);
app.post('/api/wallet/packages/purchase', strictLimiter);
app.post('/api/wallet/packages/payment-session', strictLimiter);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',          authLimiter, require('./routes/authRoutes'));
app.use('/api/user',          require('./routes/userRoutes'));
app.use('/api/ads',           require('./routes/adRoutes'));
app.use('/api/stores',        require('./routes/storeRoutes'));
app.use('/api/wallet',        require('./routes/walletRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports',       require('./routes/reportRoutes'));
app.use('/api/upload',        uploadLimiter, require('./routes/uploadRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/questions',     require('./routes/questionRoutes'));
app.use('/api/referral',      require('./routes/referralRoutes'));

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({
        message: 'AiryPhone API v1.0',
        status:  'running',
        endpoints: {
            auth:          '/api/auth',
            user:          '/api/user',
            ads:           '/api/ads',
            stores:        '/api/stores',
            wallet:        '/api/wallet',
            messages:      '/api/messages',
            notifications: '/api/notifications',
            upload:        '/api/upload'
        }
    });
});

app.use(validationErrorHandler);

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} tapılmadı` });
});

if (process.env.SENTRY_DSN && Sentry.setupExpressErrorHandler) {
    Sentry.setupExpressErrorHandler(app);
} else if (process.env.SENTRY_DSN && Sentry.Handlers && Sentry.Handlers.errorHandler) {
    app.use(Sentry.Handlers.errorHandler());
}

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
    const reqId = req.id || 'N/A';
    logger.error(`[${reqId}] ${err.stack || err.message}`, { reqId, method: req.method, url: req.originalUrl });

    if (res.headersSent) {
        return next(err);
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Sorğu ölçüsü icazə verilən limitdən böyükdür' });
    }

    let statusCode = err.status || 500;
    let message = err.message || 'Server xətası';

    // Sanitize MongoDB duplicate key errors
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Daxil edilən məlumat artıq mövcuddur';
    }

    // Sanitize Mongoose Validation Errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Sanitize CastErrors (invalid ObjectIds)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Axtarılan məlumat tapılmadı (Keçərsiz ID)';
    }

    logger.error(err.stack || err.message);
    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ── Socket.io Chat Logic ──────────────────────────────────
// Socket.io Middleware for Authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }
        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.id).select('_id status disabled isBlocked isBanned tokenVersion sessionVersion');
        if (!user || !isAccountAllowed(user)) {
            return next(new Error(`Authentication error: ${getAccountDeniedMessage(user)}`));
        }
        if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)
            || (decoded.sessionVersion || 0) !== (user.sessionVersion || 0)) {
            return next(new Error('Authentication error: Token revoked'));
        }

        socket.user = { id: user._id.toString() };
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

const socketMessageRateLimits = new Map();
const userSocketCounts = new Map();

io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.user.id})`);
    socketMessageRateLimits.set(socket.id, { count: 0, lastReset: Date.now() });

    const userId = socket.user.id;
    const currentCount = userSocketCounts.get(userId) || 0;
    userSocketCounts.set(userId, currentCount + 1);

    if (currentCount === 0) {
        User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() })
            .catch(err => logger.error("Error setting isOnline=true:", err));
        io.emit('user_status_change', { userId, isOnline: true, lastActive: new Date() });
    }

    // Join a personal room using the user's MongoDB ID
    socket.on('join_chat', (userId) => {
        if (userId !== socket.user.id) {
            logger.warn(`User ${socket.user.id} tried to join room ${userId}`);
            return;
        }
        socket.join(userId);
        logger.info(`User ${userId} joined room`);
    });

    socket.on('send_message', async (data) => {
        try {
            const rl = socketMessageRateLimits.get(socket.id);
            if (rl) {
                const now = Date.now();
                if (now - rl.lastReset > 5000) {
                    rl.count = 0;
                    rl.lastReset = now;
                }
                if (rl.count > 10) {
                    socket.emit('message_error', { message: 'Çox sürətli mesaj göndərirsiniz. Gözləyin.' });
                    return;
                }
                rl.count++;
            }

            const { recipient, ad, text } = data || {};
            const validation = validateChatMessagePayload({
                sender: socket.user.id,
                recipient,
                ad,
                text
            });
            if (!validation.valid) {
                socket.emit('message_error', { message: 'Mesaj düzgün formatda deyil' });
                return;
            }

            if (recipient === socket.user.id) {
                socket.emit('message_error', { message: 'Özünüzə mesaj göndərə bilməzsiniz' });
                return;
            }

            const chatCheck = await validateChatParticipants({
                senderId: socket.user.id,
                recipientId: recipient,
                adId: ad
            });
            if (!chatCheck.valid) {
                socket.emit('message_error', { message: chatCheck.message });
                return;
            }
            
            // 1. Save to Database first
            const newMessage = await Message.create({
                sender: socket.user.id,
                recipient,
                ad,
                text: validation.sanitizedText,
                isDelivered: false,
                isRead: false
            });
            const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name lastName avatar');

            // 2. Broadcast to recipient's room
            io.to(recipient).emit('receive_message', populatedMsg);
            
            // 3. Emit back to sender as well (so it syncs across their own tabs)
            io.to(socket.user.id).emit('receive_message', populatedMsg);
            
        } catch (error) {
            logger.error("Socket error saving message:", error);
        }
    });

    socket.on('mark_delivered', async (messageIds) => {
        try {
            if (!Array.isArray(messageIds) || messageIds.length === 0 || messageIds.length > 100) return;
            const valid = messageIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!valid) return;

            const now = new Date();
            await Message.updateMany(
                { _id: { $in: messageIds }, recipient: socket.user.id, isDelivered: false },
                { $set: { isDelivered: true, deliveredAt: now } }
            );
            
            // Fetch one to find sender, or loop
            const sample = await Message.findById(messageIds[0]);
            if (sample && sample.sender) {
                io.to(sample.sender.toString()).emit('messages_delivered', { messageIds, deliveredAt: now });
            }
        } catch (err) {
            logger.error("Socket mark_delivered error:", err);
        }
    });

    socket.on('mark_read', async (messageIds) => {
        try {
            if (!Array.isArray(messageIds) || messageIds.length === 0 || messageIds.length > 100) return;
            const valid = messageIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!valid) return;

            const now = new Date();
            await Message.updateMany(
                { _id: { $in: messageIds }, recipient: socket.user.id, isRead: false },
                { $set: { isRead: true, readAt: now, isDelivered: true, deliveredAt: now } } // also mark delivered if not already
            );
            
            const sample = await Message.findById(messageIds[0]);
            if (sample && sample.sender) {
                io.to(sample.sender.toString()).emit('messages_read', { messageIds, readAt: now });
            }
        } catch (err) {
            logger.error("Socket mark_read error:", err);
        }
    });

    socket.on('typing', ({ recipient, ad }) => {
        if (!recipient) return;
        io.to(recipient).emit('typing', { sender: socket.user.id, ad });
    });

    socket.on('stop_typing', ({ recipient, ad }) => {
        if (!recipient) return;
        io.to(recipient).emit('stop_typing', { sender: socket.user.id, ad });
    });

    socket.on('disconnect', () => {
        socketMessageRateLimits.delete(socket.id);
        logger.info(`Socket disconnected: ${socket.id}`);
        
        const count = (userSocketCounts.get(userId) || 1) - 1;
        if (count <= 0) {
            userSocketCounts.delete(userId);
            const now = new Date();
            User.findByIdAndUpdate(userId, { isOnline: false, lastActive: now })
                .catch(err => logger.error("Error setting isOnline=false:", err));
            io.emit('user_status_change', { userId, isOnline: false, lastActive: now });
        } else {
            userSocketCounts.set(userId, count);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => logger.info(`🚀 Server running on http://localhost:${PORT}`));

// ── Graceful Shutdown ─────────────────────────────────────
const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server...');
    server.close(async () => {
        logger.info('HTTP server closed.');
        try {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed.');
            
            const { redis } = require('./utils/redisClient');
            if (redis) {
                await redis.quit();
                logger.info('Redis connection closed.');
            }
            process.exit(0);
        } catch (err) {
            logger.error('Error during shutdown:', err);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
