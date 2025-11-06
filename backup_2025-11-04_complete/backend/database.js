/**
 * Database Connection and Query Utilities
 * Bignor Park Fishing App
 * 
 * This module handles all database connections and provides
 * utility functions for common database operations.
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Create connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon and most cloud PostgreSQL
    },
    max: 20, // Maximum number of connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1);
});

/**
 * Execute a query with error handling
 * @param {string} text - SQL query
 * @param {array} params - Query parameters
 * @returns {Promise<object>} Query result
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('❌ Database query error:', error);
        throw error;
    }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<PoolClient>}
 */
async function getClient() {
    const client = await pool.connect();
    return client;
}

// ============================================
// USER QUERIES
// ============================================

/**
 * Find user by email
 */
async function findUserByEmail(email) {
    const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    return result.rows[0];
}

/**
 * Create new user
 */
async function createUser(userData) {
    const { email, passwordHash, firstName, lastName, phone, isAdmin } = userData;
    const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, first_name, last_name, is_admin, created_at`,
        [email.toLowerCase(), passwordHash, firstName, lastName, phone, isAdmin || false]
    );
    return result.rows[0];
}

/**
 * Update user profile
 */
async function updateUser(userId, updates) {
    const { firstName, lastName, phone, profilePictureUrl } = updates;
    const result = await query(
        `UPDATE users 
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             phone = COALESCE($4, phone),
             profile_picture_url = COALESCE($5, profile_picture_url)
         WHERE id = $1
         RETURNING id, email, first_name, last_name, phone, profile_picture_url`,
        [userId, firstName, lastName, phone, profilePictureUrl]
    );
    return result.rows[0];
}

/**
 * Update last login timestamp
 */
async function updateLastLogin(userId) {
    await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
    );
}

// ============================================
// LAKE QUERIES
// ============================================

/**
 * Get all active lakes
 */
async function getAllLakes() {
    const result = await query(
        'SELECT * FROM lakes WHERE is_active = TRUE ORDER BY name'
    );
    return result.rows;
}

/**
 * Get lake by ID
 */
async function getLakeById(lakeId) {
    const result = await query(
        'SELECT * FROM lakes WHERE id = $1',
        [lakeId]
    );
    return result.rows[0];
}

/**
 * Get lake by name
 */
async function getLakeByName(lakeName) {
    const result = await query(
        'SELECT * FROM lakes WHERE name = $1',
        [lakeName.toLowerCase()]
    );
    return result.rows[0];
}

// ============================================
// BOOKING QUERIES
// ============================================

/**
 * Check lake availability for a specific date
 */
async function checkLakeAvailability(lakeId, bookingDate) {
    const result = await query(
        `SELECT * FROM check_lake_availability($1, $2)`,
        [lakeId, bookingDate]
    );
    return result.rows[0];
}

/**
 * Create new booking
 */
async function createBooking(bookingData) {
    const {
        bookingId,
        userId,
        lakeId,
        userEmail,
        userName,
        lakeName,
        bookingDate,
        startTime,
        endTime,
        notes
    } = bookingData;

    const result = await query(
        `INSERT INTO bookings 
         (booking_id, user_id, lake_id, user_email, user_name, lake_name, 
          booking_date, start_time, end_time, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
         RETURNING *`,
        [bookingId, userId, lakeId, userEmail, userName, lakeName, 
         bookingDate, startTime, endTime, notes]
    );
    return result.rows[0];
}

/**
 * Get user's active booking
 */
async function getUserActiveBooking(userEmail) {
    const result = await query(
        `SELECT * FROM bookings 
         WHERE user_email = $1 
           AND status = 'active'
           AND end_time > CURRENT_TIMESTAMP
         ORDER BY start_time DESC
         LIMIT 1`,
        [userEmail]
    );
    return result.rows[0];
}

/**
 * Get all user bookings
 */
async function getUserBookings(userEmail, limit = 50) {
    const result = await query(
        `SELECT * FROM bookings 
         WHERE user_email = $1 
         ORDER BY start_time DESC
         LIMIT $2`,
        [userEmail, limit]
    );
    return result.rows;
}

/**
 * Get booking by ID
 */
async function getBookingById(bookingId) {
    const result = await query(
        'SELECT * FROM bookings WHERE booking_id = $1',
        [bookingId]
    );
    return result.rows[0];
}

/**
 * Cancel booking
 */
async function cancelBooking(bookingId) {
    const result = await query(
        `UPDATE bookings 
         SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
         WHERE booking_id = $1
         RETURNING *`,
        [bookingId]
    );
    return result.rows[0];
}

/**
 * Get all bookings for a date range (admin)
 */
async function getBookingsByDateRange(startDate, endDate) {
    const result = await query(
        `SELECT * FROM bookings 
         WHERE booking_date BETWEEN $1 AND $2
         ORDER BY booking_date, lake_name`,
        [startDate, endDate]
    );
    return result.rows;
}

/**
 * Get lake bookings for a specific date
 */
async function getLakeBookingsForDate(lakeId, bookingDate) {
    const result = await query(
        `SELECT * FROM bookings 
         WHERE lake_id = $1 
           AND booking_date = $2
           AND status = 'active'`,
        [lakeId, bookingDate]
    );
    return result.rows;
}

/**
 * Expire old bookings (run periodically)
 */
async function expireOldBookings() {
    const result = await query('SELECT expire_old_bookings()');
    return result.rows[0].expire_old_bookings;
}

/**
 * Get booking statistics (admin)
 */
async function getBookingStats() {
    const result = await query(`
        SELECT 
            COUNT(*) FILTER (WHERE status = 'active' AND start_time <= CURRENT_TIMESTAMP AND end_time > CURRENT_TIMESTAMP) as active_now,
            COUNT(*) FILTER (WHERE status = 'active' AND start_time > CURRENT_TIMESTAMP) as upcoming,
            COUNT(*) FILTER (WHERE status = 'active') as total_active,
            COUNT(*) FILTER (WHERE status = 'completed') as total_completed,
            COUNT(*) FILTER (WHERE status = 'cancelled') as total_cancelled
        FROM bookings
    `);
    return result.rows[0];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Test database connection
 */
async function testConnection() {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database connection test successful:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
}

/**
 * Close all connections (for graceful shutdown)
 */
async function closePool() {
    await pool.end();
    console.log('🔌 Database connection pool closed');
}

// Export all functions
module.exports = {
    query,
    getClient,
    pool,
    
    // User functions
    findUserByEmail,
    createUser,
    updateUser,
    updateLastLogin,
    
    // Lake functions
    getAllLakes,
    getLakeById,
    getLakeByName,
    
    // Booking functions
    checkLakeAvailability,
    createBooking,
    getUserActiveBooking,
    getUserBookings,
    getBookingById,
    cancelBooking,
    getBookingsByDateRange,
    getLakeBookingsForDate,
    expireOldBookings,
    getBookingStats,
    
    // Utilities
    testConnection,
    closePool
};


