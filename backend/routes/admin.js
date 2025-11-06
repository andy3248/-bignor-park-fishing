/**
 * Admin Routes
 * Administrative functions and reports
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All admin routes require authentication and admin privileges
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================
// GET /api/admin/bookings - Get all bookings
// ============================================

router.get('/bookings', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        
        let bookings;
        
        if (startDate && endDate) {
            bookings = await db.getBookingsByDateRange(startDate, endDate);
        } else {
            // Get recent bookings (last 90 days)
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 90);
            
            bookings = await db.getBookingsByDateRange(
                start.toISOString().split('T')[0],
                end.toISOString().split('T')[0]
            );
        }
        
        // Filter by status if provided
        if (status) {
            bookings = bookings.filter(b => b.status === status);
        }
        
        res.json({
            bookings: bookings.map(b => ({
                id: b.booking_id,
                bookingId: b.booking_id,
                userId: b.user_id,
                userName: b.user_name,
                userEmail: b.user_email,
                lakeName: b.lake_name,
                bookingDate: b.booking_date,
                startTime: b.start_time,
                endTime: b.end_time,
                status: b.status,
                notes: b.notes,
                createdAt: b.created_at,
                cancelledAt: b.cancelled_at
            })),
            count: bookings.length
        });
        
    } catch (error) {
        console.error('Admin get bookings error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get bookings'
        });
    }
});

// ============================================
// GET /api/admin/bookings/stats - Get booking statistics
// ============================================

router.get('/bookings/stats', async (req, res) => {
    try {
        const stats = await db.getBookingStats();
        
        res.json({
            stats: {
                activeNow: parseInt(stats.active_now) || 0,
                upcoming: parseInt(stats.upcoming) || 0,
                totalActive: parseInt(stats.total_active) || 0,
                totalCompleted: parseInt(stats.total_completed) || 0,
                totalCancelled: parseInt(stats.total_cancelled) || 0
            }
        });
        
    } catch (error) {
        console.error('Admin get booking stats error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get booking statistics'
        });
    }
});

// ============================================
// DELETE /api/admin/bookings/:bookingId - Cancel any booking (admin)
// ============================================

router.delete('/bookings/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        
        const booking = await db.getBookingById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Booking not found'
            });
        }
        
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'This booking is already cancelled'
            });
        }
        
        const cancelledBooking = await db.cancelBooking(bookingId);
        
        res.json({
            message: 'Booking cancelled successfully',
            booking: {
                id: cancelledBooking.booking_id,
                bookingId: cancelledBooking.booking_id,
                userName: cancelledBooking.user_name,
                lakeName: cancelledBooking.lake_name,
                status: cancelledBooking.status,
                cancelledAt: cancelledBooking.cancelled_at
            }
        });
        
    } catch (error) {
        console.error('Admin cancel booking error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to cancel booking'
        });
    }
});

// ============================================
// GET /api/admin/users - Get all users
// ============================================

router.get('/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                id, email, first_name, last_name, phone, 
                profile_picture_url, is_admin, is_active, 
                created_at, last_login
            FROM users
            ORDER BY created_at DESC
        `);
        
        res.json({
            users: result.rows.map(u => ({
                id: u.id,
                email: u.email,
                firstName: u.first_name,
                lastName: u.last_name,
                phone: u.phone,
                profilePictureUrl: u.profile_picture_url,
                isAdmin: u.is_admin,
                isActive: u.is_active,
                createdAt: u.created_at,
                lastLogin: u.last_login
            })),
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get users'
        });
    }
});

// ============================================
// GET /api/admin/users/:id - Get specific user
// ============================================

router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        // Get user's bookings
        const userBookings = await db.query(
            'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
            [id]
        );
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                profilePictureUrl: user.profile_picture_url,
                isAdmin: user.is_admin,
                isActive: user.is_active,
                createdAt: user.created_at,
                lastLogin: user.last_login
            },
            bookings: userBookings.rows.map(b => ({
                id: b.booking_id,
                lakeName: b.lake_name,
                bookingDate: b.booking_date,
                status: b.status,
                createdAt: b.created_at
            })),
            bookingCount: userBookings.rows.length
        });
        
    } catch (error) {
        console.error('Admin get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user'
        });
    }
});

// ============================================
// PUT /api/admin/users/:id - Update user (admin)
// ============================================

router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { isAdmin, isActive } = req.body;
        
        const updates = [];
        const values = [id];
        let paramCount = 2;
        
        if (isAdmin !== undefined) {
            updates.push(`is_admin = $${paramCount}`);
            values.push(isAdmin);
            paramCount++;
        }
        
        if (isActive !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            values.push(isActive);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'No updates provided'
            });
        }
        
        const result = await db.query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1 
             RETURNING id, email, first_name, last_name, is_admin, is_active`,
            values
        );
        
        const user = result.rows[0];
        
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        res.json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                isAdmin: user.is_admin,
                isActive: user.is_active
            }
        });
        
    } catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update user'
        });
    }
});

// ============================================
// POST /api/admin/users - Create new user (admin)
// ============================================

router.post('/users', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, isAdmin } = req.body;
        
        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, first name, and last name are required'
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 6 characters'
            });
        }
        
        // Check if user already exists
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User with this email already exists'
            });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user
        const newUser = await db.createUser({
            email: email.toLowerCase().trim(),
            passwordHash,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone ? phone.trim() : null,
            isAdmin: isAdmin || false
        });
        
        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                isAdmin: newUser.is_admin,
                createdAt: newUser.created_at
            }
        });
        
    } catch (error) {
        console.error('Admin create user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create user'
        });
    }
});

// ============================================
// POST /api/admin/expire-bookings - Manually trigger booking expiration
// ============================================

router.post('/expire-bookings', async (req, res) => {
    try {
        const expiredCount = await db.expireOldBookings();
        
        res.json({
            message: 'Booking expiration completed',
            expiredCount
        });
        
    } catch (error) {
        console.error('Admin expire bookings error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to expire bookings'
        });
    }
});

// ============================================
// GET /api/admin/dashboard - Dashboard statistics
// ============================================

router.get('/dashboard', async (req, res) => {
    try {
        // Get booking stats
        const bookingStats = await db.getBookingStats();
        
        // Get user count
        const userCount = await db.query('SELECT COUNT(*) FROM users');
        
        // Get recent bookings
        const recentBookings = await db.query(`
            SELECT * FROM bookings 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        // Get lakes
        const lakes = await db.getAllLakes();
        
        res.json({
            stats: {
                totalUsers: parseInt(userCount.rows[0].count),
                totalLakes: lakes.length,
                activeBookings: parseInt(bookingStats.total_active) || 0,
                upcomingBookings: parseInt(bookingStats.upcoming) || 0,
                completedBookings: parseInt(bookingStats.total_completed) || 0,
                cancelledBookings: parseInt(bookingStats.total_cancelled) || 0
            },
            recentBookings: recentBookings.rows.map(b => ({
                id: b.booking_id,
                userName: b.user_name,
                lakeName: b.lake_name,
                bookingDate: b.booking_date,
                status: b.status,
                createdAt: b.created_at
            }))
        });
        
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get dashboard data'
        });
    }
});

module.exports = router;

