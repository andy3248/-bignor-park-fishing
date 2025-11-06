/**
 * Lakes Routes
 * Get lake information and availability
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

// Optional auth - some endpoints are public but may benefit from user context
router.use(optionalAuth);

// ============================================
// GET /api/lakes - Get all active lakes
// ============================================

router.get('/', async (req, res) => {
    try {
        const lakes = await db.getAllLakes();
        
        res.json({
            lakes: lakes.map(lake => ({
                id: lake.id,
                name: lake.name,
                displayName: lake.display_name,
                description: lake.description,
                maxAnglers: lake.max_anglers,
                imageUrl: lake.image_url,
                features: lake.features,
                isActive: lake.is_active
            })),
            count: lakes.length
        });
        
    } catch (error) {
        console.error('Get lakes error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get lakes'
        });
    }
});

// ============================================
// GET /api/lakes/:id - Get specific lake
// ============================================

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const lake = await db.getLakeById(id);
        
        if (!lake) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Lake not found'
            });
        }
        
        res.json({
            lake: {
                id: lake.id,
                name: lake.name,
                displayName: lake.display_name,
                description: lake.description,
                maxAnglers: lake.max_anglers,
                imageUrl: lake.image_url,
                features: lake.features,
                isActive: lake.is_active,
                createdAt: lake.created_at
            }
        });
        
    } catch (error) {
        console.error('Get lake error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get lake'
        });
    }
});

// ============================================
// GET /api/lakes/:id/availability/:date - Get lake availability for specific date
// ============================================

router.get('/:id/availability/:date', async (req, res) => {
    try {
        const { id, date } = req.params;
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }
        
        // Check if lake exists
        const lake = await db.getLakeById(id);
        if (!lake) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Lake not found'
            });
        }
        
        // Get availability
        const availability = await db.checkLakeAvailability(id, date);
        
        // Get bookings for this date to show who's booked
        const bookings = await db.getLakeBookingsForDate(id, date);
        
        res.json({
            lakeId: lake.id,
            lakeName: lake.display_name,
            date,
            maxAnglers: lake.max_anglers,
            availableSpots: availability.available_spots,
            isAvailable: availability.is_available,
            currentBookings: bookings.length,
            bookings: bookings.map(b => ({
                bookingId: b.booking_id,
                userName: b.user_name,
                bookingDate: b.booking_date,
                status: b.status
            }))
        });
        
    } catch (error) {
        console.error('Get lake availability error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get lake availability'
        });
    }
});

// ============================================
// GET /api/lakes/:id/availability - Get lake availability for multiple dates
// ============================================

router.get('/:id/availability', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        
        // Validate required query params
        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'startDate and endDate query parameters are required'
            });
        }
        
        // Check if lake exists
        const lake = await db.getLakeById(id);
        if (!lake) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Lake not found'
            });
        }
        
        // Get bookings for date range
        const bookings = await db.getBookingsByDateRange(startDate, endDate);
        
        // Filter bookings for this lake
        const lakeBookings = bookings.filter(b => b.lake_id === parseInt(id));
        
        // Group bookings by date
        const bookingsByDate = {};
        lakeBookings.forEach(booking => {
            const date = booking.booking_date.toISOString().split('T')[0];
            if (!bookingsByDate[date]) {
                bookingsByDate[date] = [];
            }
            bookingsByDate[date].push(booking);
        });
        
        // Calculate availability for each date
        const availabilityData = Object.keys(bookingsByDate).map(date => {
            const dateBookings = bookingsByDate[date];
            const bookedSpots = dateBookings.filter(b => b.status === 'active').length;
            const availableSpots = lake.max_anglers - bookedSpots;
            
            return {
                date,
                maxAnglers: lake.max_anglers,
                bookedSpots,
                availableSpots,
                isAvailable: availableSpots > 0
            };
        });
        
        res.json({
            lakeId: lake.id,
            lakeName: lake.display_name,
            startDate,
            endDate,
            availability: availabilityData
        });
        
    } catch (error) {
        console.error('Get lake availability range error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get lake availability'
        });
    }
});

module.exports = router;

