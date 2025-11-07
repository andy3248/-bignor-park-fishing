/**
 * Booking Routes
 * Create, view, and manage fishing bookings
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate unique booking ID
 */
function generateBookingId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BKG-${timestamp}-${random}`;
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    return date.toISOString().split('T')[0];
}

/**
 * Validate booking date (must be in the future)
 */
function validateBookingDate(dateString) {
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return bookingDate >= today;
}

// All booking routes require authentication
router.use(authenticateToken);

// ============================================
// POST /api/bookings - Create new booking
// ============================================

router.post('/', async (req, res) => {
    try {
        const { lakeId, lakeName, bookingDate, notes } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userName = `${req.user.firstName} ${req.user.lastName}`;
        
        // Validation
        if (!lakeId || !bookingDate) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Lake ID and booking date are required'
            });
        }
        
        // Validate date is in the future
        if (!validateBookingDate(bookingDate)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Booking date must be today or in the future'
            });
        }
        
        // Check if lake exists
        const lake = await db.getLakeById(lakeId);
        if (!lake) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Lake not found'
            });
        }
        
        if (!lake.is_active) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'This lake is currently unavailable for booking'
            });
        }
        
        // Check if user already has an active booking
        const existingBooking = await db.getUserActiveBooking(userEmail);
        if (existingBooking) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'You already have an active booking',
                booking: {
                    id: existingBooking.booking_id,
                    lakeName: existingBooking.lake_name,
                    bookingDate: existingBooking.booking_date,
                    startTime: existingBooking.start_time
                }
            });
        }
        
        // Check lake availability
        const availability = await db.checkLakeAvailability(lakeId, bookingDate);
        if (!availability.is_available) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'This lake is fully booked for the selected date',
                availableSpots: availability.available_spots
            });
        }
        
        // Calculate start and end times (midnight to midnight UTC)
        const startTime = new Date(bookingDate + 'T00:00:00Z');
        const endTime = new Date(bookingDate + 'T23:59:59Z');
        
        // Generate booking ID
        const bookingId = generateBookingId();
        
        // Create booking
        const booking = await db.createBooking({
            bookingId,
            userId,
            lakeId,
            userEmail,
            userName,
            lakeName: lakeName || lake.display_name,
            bookingDate: formatDate(bookingDate),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            notes: notes || null
        });
        
        res.status(201).json({
            message: 'Booking created successfully',
            booking: {
                id: booking.booking_id,
                bookingId: booking.booking_id,
                lakeName: booking.lake_name,
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                notes: booking.notes,
                createdAt: booking.created_at
            }
        });
        
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create booking'
        });
    }
});

// ============================================
// GET /api/bookings/my - Get current user's bookings
// ============================================

router.get('/my', async (req, res) => {
    try {
        const userEmail = req.user.email;
        const limit = parseInt(req.query.limit) || 50;
        
        const bookings = await db.getUserBookings(userEmail, limit);
        
        res.json({
            bookings: bookings.map(b => ({
                id: b.booking_id,
                bookingId: b.booking_id,
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
        console.error('Get user bookings error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get bookings'
        });
    }
});

// ============================================
// GET /api/bookings/active - Get user's active booking
// ============================================

router.get('/active', async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        const booking = await db.getUserActiveBooking(userEmail);
        
        if (!booking) {
            return res.json({
                booking: null,
                message: 'No active booking found'
            });
        }
        
        res.json({
            booking: {
                id: booking.booking_id,
                bookingId: booking.booking_id,
                lakeName: booking.lake_name,
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                notes: booking.notes,
                createdAt: booking.created_at
            }
        });
        
    } catch (error) {
        console.error('Get active booking error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get active booking'
        });
    }
});

// ============================================
// GET /api/bookings/:bookingId - Get specific booking
// ============================================

router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userEmail = req.user.email;
        
        const booking = await db.getBookingById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Booking not found'
            });
        }
        
        // Users can only view their own bookings (unless admin)
        if (booking.user_email !== userEmail && !req.user.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only view your own bookings'
            });
        }
        
        res.json({
            booking: {
                id: booking.booking_id,
                bookingId: booking.booking_id,
                userName: booking.user_name,
                userEmail: booking.user_email,
                lakeName: booking.lake_name,
                bookingDate: booking.booking_date,
                startTime: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                notes: booking.notes,
                createdAt: booking.created_at,
                cancelledAt: booking.cancelled_at
            }
        });
        
    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get booking'
        });
    }
});

// ============================================
// DELETE /api/bookings/:bookingId - Cancel booking
// ============================================

router.delete('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userEmail = req.user.email;
        
        const booking = await db.getBookingById(bookingId);
        
        if (!booking) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Booking not found'
            });
        }
        
        // Users can only cancel their own bookings (unless admin)
        if (booking.user_email !== userEmail && !req.user.isAdmin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only cancel your own bookings'
            });
        }
        
        // Check if already cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'This booking is already cancelled'
            });
        }
        
        // Cancel the booking
        const cancelledBooking = await db.cancelBooking(bookingId);
        
        res.json({
            message: 'Booking cancelled successfully',
            booking: {
                id: cancelledBooking.booking_id,
                bookingId: cancelledBooking.booking_id,
                status: cancelledBooking.status,
                cancelledAt: cancelledBooking.cancelled_at
            }
        });
        
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to cancel booking'
        });
    }
});

// ============================================
// GET /api/bookings/check-availability/:lakeId/:date
// ============================================

router.get('/check-availability/:lakeId/:date', async (req, res) => {
    try {
        const { lakeId, date } = req.params;
        
        // Validate date format
        if (!validateBookingDate(date)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid date or date is in the past'
            });
        }
        
        // Check if lake exists
        const lake = await db.getLakeById(lakeId);
        if (!lake) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Lake not found'
            });
        }
        
        // Get availability
        const availability = await db.checkLakeAvailability(lakeId, date);
        
        res.json({
            lakeId,
            lakeName: lake.display_name,
            date,
            maxAnglers: lake.max_anglers,
            availableSpots: availability.available_spots,
            isAvailable: availability.is_available,
            bookedSpots: lake.max_anglers - availability.available_spots
        });
        
    } catch (error) {
        console.error('Check availability error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to check availability'
        });
    }
});

module.exports = router;

