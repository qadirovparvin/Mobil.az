const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const connectDB = require('./config/db');
const User     = require('./models/User');
const Message  = require('./models/Message');

// Load env vars (always resolve from this file's directory)
dotenv.config({ path: path.join(__dirname, '.env') });

// ── Connect to Database & Auto-Seed Admin ────────────────
const ADMIN_EMAIL    = 'mobil@gmail.com';
const ADMIN_PASSWORD = 'Mobil.az!1921021418';

async function seedAdmin() {
    try {
        const exists = await User.findOne({ email: ADMIN_EMAIL });
        if (exists) {
            console.log('ℹ️  Admin account already exists — skipping seed.');
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
            status:   'active'
        });
        console.log('✅ Admin account seeded: ' + ADMIN_EMAIL);
    } catch (err) {
        console.error('❌ Admin seed failed:', err.message);
    }
}

connectDB().then(seedAdmin);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// ── Middlewares ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/user',          require('./routes/userRoutes'));
app.use('/api/ads',           require('./routes/adRoutes'));
app.use('/api/stores',        require('./routes/storeRoutes'));
app.use('/api/wallet',        require('./routes/walletRoutes'));
app.use('/api/messages',      require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload',        require('./routes/uploadRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));

// ── Health Check ──────────────────────────────────────────
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

// ── 404 Handler ───────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} tapılmadı` });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Server xətası',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ── Socket.io Chat Logic ──────────────────────────────────
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a personal room using the user's MongoDB ID
    socket.on('join_chat', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('send_message', async (data) => {
        try {
            const { sender, recipient, ad, text } = data;
            
            // 1. Save to Database first
            const newMessage = await Message.create({ sender, recipient, ad, text });
            const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name lastName avatar');

            // 2. Broadcast to recipient's room
            io.to(recipient).emit('receive_message', populatedMsg);
            
            // 3. Emit back to sender as well (so it syncs across their own tabs)
            io.to(sender).emit('receive_message', populatedMsg);
            
        } catch (error) {
            console.error("Socket error saving message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
