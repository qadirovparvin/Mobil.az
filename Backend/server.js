const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const path    = require('path');
const connectDB = require('./config/db');

// Load env vars (always resolve from this file's directory)
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to Database
connectDB();

const app = express();

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
            notifications: '/api/notifications'
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
