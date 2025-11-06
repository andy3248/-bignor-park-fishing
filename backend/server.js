/**
 * Bignor Park Fishing App - API Server
 * Main Express server with all routes and middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./database');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Increased for testing - reduce to 5 for production
    message: 'Too many login attempts, please try again later.'
});

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// IMPORT ROUTES
// ============================================

const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const lakeRoutes = require('./routes/lakes');

// ============================================
// HEALTH CHECK & ROOT
// ============================================

app.get('/', (req, res) => {
    res.json({
        message: 'Bignor Park Fishing API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            bookings: '/api/bookings/*',
            users: '/api/users/*',
            admin: '/api/admin/*',
            lakes: '/api/lakes/*'
        }
    });
});

app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await db.testConnection();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: dbConnected ? 'connected' : 'disconnected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lakes', lakeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        error: err.name || 'Internal Server Error',
        message: isDevelopment ? err.message : 'An error occurred',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER
// ============================================

async function startServer() {
    try {
        // Test database connection
        console.log('🔍 Testing database connection...');
        const dbConnected = await db.testConnection();
        
        if (!dbConnected) {
            throw new Error('Database connection failed');
        }
        
        // Start listening
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ═══════════════════════════════════════════');
            console.log(`   Bignor Park Fishing API Server`);
            console.log('   ═══════════════════════════════════════════');
            console.log(`   ✅ Server running on port ${PORT}`);
            console.log(`   🌐 API: http://localhost:${PORT}/api`);
            console.log(`   🏥 Health: http://localhost:${PORT}/api/health`);
            console.log(`   📊 Database: Connected`);
            console.log(`   🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('   ═══════════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await db.closePool();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await db.closePool();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;

