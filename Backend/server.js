const Sentry = require('@sentry/node');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '.env') });

// Validate critical security environment constraints in production
if (process.env.NODE_ENV === 'production') {
    if (process.env.DISABLE_RATE_LIMIT === 'true') {
        throw new Error('DISABLE_RATE_LIMIT blocked in production');
    }
    if (!process.env.REDIS_URL) {
        console.error('FATAL: REDIS_URL required in production for rate limiting');
        throw new Error('REDIS_URL required in production for rate limiting');
    }
}

const redisConfig = require('./config/redis');
const { redisClient, waitForRedisReady } = redisConfig;
const os = require('os');
const fs = require('fs');

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
const { ensureDemoAds } = require('./scripts/ensure_demo_ads');
const { buildCorsOptions } = require('./utils/corsPolicy');
const { buildHelmetOptions } = require('./utils/cspConfig');
const { rejectNoSqlOperators, validationErrorHandler } = require('./utils/securityValidation');
const {
    registrationIpLimiter,
    verificationIpLimiter
} = require('./utils/abuseGuards');
const { ensureDefaultPackages } = require('./utils/packageCatalog');
const { reconcilePendingPayments } = require('./jobs/paymentReconciliation');

// Load env vars (always resolve from this file's directory)
dotenv.config({ path: path.join(__dirname, '.env') });

// ── JWT Secret Validation ────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    logger.error('❌ CRITICAL ERROR: JWT_SECRET environment variable is not defined.');
    process.exit(1);
}
if (process.env.NODE_ENV === 'production' && (JWT_SECRET === 'mobilaz_super_secret_jwt_key_2024_change_in_production' || JWT_SECRET === 'airyphone_super_secret_jwt_key_2024_change_in_production' || JWT_SECRET.length < 32)) {
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
}

// ── 2FA Secret Validation ────────────────────────────────
const { validateTotpConfig } = require('./utils/totp');
try {
    validateTotpConfig();
} catch (error) {
    logger.error(`❌ CRITICAL SECURITY ERROR: ${error.message}`);
    process.exit(1);
}

// ── Connect to Database & Auto-Seed Admin ────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || 'mobilim.az@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Mobilim.az!090803';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.error('❌ CRITICAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are not defined.');
    process.exit(1);
}

async function seedAdmin() {
    try {
        const adminsToEnsure = [
            {
                email: 'mobilim.az@gmail.com',
                password: 'Mobilim.az!090803',
                name: 'Admin',
                lastName: 'Mobilim.az'
            }
        ];

        if (ADMIN_EMAIL && ADMIN_EMAIL.trim().toLowerCase() !== 'mobilim.az@gmail.com') {
            adminsToEnsure.push({
                email: ADMIN_EMAIL.trim().toLowerCase(),
                password: ADMIN_PASSWORD,
                name: 'Admin',
                lastName: 'Mobil'
            });
        }

        for (const adm of adminsToEnsure) {
            const cleanEmail = adm.email.trim().toLowerCase();
            const salt   = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(adm.password, salt);

            const existing = await User.findOne({ email: cleanEmail });
            if (existing) {
                existing.role = 'admin';
                existing.status = 'active';
                existing.isVerified = true;
                existing.password = hashed;
                existing.twoFactorEnabled = false;
                existing.loginAttempts = 0;
                existing.lockUntil = null;
                await existing.save();
                logger.info('✅ Admin account updated & verified: ' + cleanEmail);
            } else {
                await User.create({
                    name:     adm.name,
                    lastName: adm.lastName,
                    email:    cleanEmail,
                    password: hashed,
                    role:     'admin',
                    status:   'active',
                    isVerified: true,
                    twoFactorEnabled: false
                });
                logger.info('✅ Admin account seeded: ' + cleanEmail);
            }
        }
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
        const schedulerTasks = [
            expirePromotions().catch(err => logger.error('Expiry check failed:', err.message)),
            expireAds().catch(err => logger.error('Ad expiry check failed:', err.message)),
            notifyExpiringAds().catch(err => logger.error('Ad expiry warning check failed:', err.message)),
            expireUnverifiedUsers().catch(err => logger.error('Unverified expiry check failed:', err.message))
        ];

        if (process.env.CLEANUP_ORPHANS === 'true' && process.env.NODE_ENV === 'production') {
            schedulerTasks.push(
                cleanupOrphanedUploads().catch(err => logger.error('Upload cleanup failed:', err.message))
            );
        }

        await Promise.all(schedulerTasks);
    } finally {
        await lock.release();
    }
};

connectDB().then(async () => {
    await seedAdmin();
    await ensureDefaultPackages();
    await ensureDemoAds();
    if (process.env.DISABLE_IN_PROCESS_SCHEDULER !== 'true') {
        setTimeout(runScheduledExpiryChecks, 5000);
        setInterval(runScheduledExpiryChecks, Number(process.env.EXPIRY_CHECK_INTERVAL_MS || 60 * 60 * 1000));

        if (process.env.PAYMENT_RECONCILIATION_ENABLED !== 'false') {
            setInterval(reconcilePendingPayments, 5 * 60 * 1000);
            console.log('✅ Payment reconciliation enabled (5min)');
        }
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

// Helper to identify verified authenticated admin requests to exempt them from rate limits
const isAdminRequest = (req) => {
    return Boolean(req.user && req.user.role === 'admin' && req.user.isVerified);
};

// ── Rate Limiters ─────────────────────────────────────────
const { RedisStore } = require('rate-limit-redis');

function createServerLimiterStore(prefix) {
    if (!redisClient) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Redis client not ready - fail closed, do not fallback to memory in production');
        }
        return undefined;
    }

    if (process.env.NODE_ENV !== 'production' && redisClient.status !== 'ready') return undefined;

    try {
        return new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`Redis server rate-limit store initialization failed: ${error.message}`);
        }
        return undefined;
    }
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
    store: createServerLimiterStore('rl:global:'),
    passOnStoreError: false,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isAdminRequest(req) || req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1' || process.env.NODE_ENV !== 'production',
    message: { message: 'Çox sayda sorğu göndərildi. Zəhmət olmasa bir az gözləyin.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 30,                    // max 30 login/register attempts per 15min
    store: createServerLimiterStore('rl:auth:'),
    passOnStoreError: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çox sayda giriş cəhdi. 15 dəqiqə sonra yenidən cəhd edin.' }
});

const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 15,                     // max 15 requests per 15 minutes
    store: createServerLimiterStore('rl:strict:'),
    passOnStoreError: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Çox sayda sorğu göndərildi. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.' }
});

const passwordResetLimiter = rateLimit({
    windowMs: Number(process.env.PASSWORD_RESET_RATE_WINDOW_MS || 60 * 60 * 1000),
    max: Number(process.env.PASSWORD_RESET_RATE_LIMIT || 5),
    store: createServerLimiterStore('rl:reset:'),
    passOnStoreError: false,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Əgər bu email qeydiyyatdan keçibsə, sıfırlama linki göndəriləcək' }
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.UPLOAD_RATE_LIMIT || 20),
    store: createServerLimiterStore('rl:upload:'),
    passOnStoreError: false,
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

// Serve uploaded files and default assets statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Fallback for missing uploads on ephemeral disks (e.g. Render restart)
app.use('/uploads', (req, res) => {
    const defaultSvg = path.join(__dirname, '../Front end/assets/images/default-ad.svg');
    if (fs.existsSync(defaultSvg)) {
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.sendFile(defaultSvg);
    }
    return res.redirect(302, '/assets/images/default-ad.svg');
});
app.use('/images', express.static(path.join(__dirname, '../Front end/images')));
app.use('/assets', express.static(path.join(__dirname, '../Front end/assets')));
app.use('/Photo', express.static(path.join(__dirname, '../Front end/Photo')));
app.use('/photo', express.static(path.join(__dirname, '../Front end/Photo')));
app.use('/Front end', express.static(path.join(__dirname, '../Front end')));
app.use('/Frontend', express.static(path.join(__dirname, '../Front end')));
app.use(express.static(path.join(__dirname, '../Front end')));

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

app.get('/api/categories', (req, res) => {
    res.json({
        data: [
            { _id: 'phone', name: 'Telefonlar' },
            { _id: 'tablet', name: 'Planşetlər' },
            { _id: 'headphone', name: 'Qulaqcıqlar' },
            { _id: 'accessory', name: 'Telefon aksessuarları' }
        ]
    });
});

// ── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/api/health-detailed', (req, res) => {
    const isRedisReady = redisConfig.isReady;
    res.json({
        redis: isRedisReady ? 'connected' : 'disconnected',
        rateLimiterStore: redisConfig.isReady ? 'redis' : (process.env.NODE_ENV === 'production' ? 'redis-required' : 'memory'),
        workers: os.cpus().length,
        pid: process.pid,
        uptime: process.uptime()
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'Mobilim.az API v1.0',
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

// ── Static Files Serving ─────────────────────────────────
const frontendDir = path.join(__dirname, '..', 'Front end');
const frontendAltDir = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendDir));
app.use('/Frontend', express.static(frontendAltDir));
app.use('/Front%20end', express.static(frontendDir));
app.use('/Front end', express.static(frontendDir));

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
const startServer = async () => {
    if (process.env.NODE_ENV === 'production') {
        await waitForRedisReady(Number(process.env.REDIS_STARTUP_TIMEOUT_MS || 10000));
    }
    server.listen(PORT, '0.0.0.0', () => {
        logger.info(`🚀 Server running on http://localhost:${PORT}`);
        if (typeof process.send === 'function') {
            process.send('ready');
        }
    });
};

startServer().catch((error) => {
    logger.error('Fatal server startup error; HTTP listener was not started', { error: error.message });
    process.exit(1);
});

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
