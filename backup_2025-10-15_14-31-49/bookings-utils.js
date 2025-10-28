// Booking utilities with type definitions

/**
 * @typedef {'bignor-main' | 'wood-pool'} LakeSlug
 * 
 * @typedef {Object} BookingUser
 * @property {string} id - User ID
 * @property {string} name - User name
 * @property {string} [avatar] - Optional avatar URL
 * 
 * @typedef {Object} Booking
 * @property {string} id - UUID for the booking
 * @property {LakeSlug} lakeSlug - Lake identifier
 * @property {BookingUser} user - User who made the booking
 * @property {number} start - Start time in milliseconds (epoch)
 * @property {number} end - End time in milliseconds (epoch)
 * @property {string} [peg] - Optional peg/spot identifier
 * @property {number} createdAt - Creation timestamp in milliseconds (epoch)
 * @property {string} [notes] - Optional booking notes
 * @property {'upcoming'|'completed'|'cancelled'} status - Booking status
 */

/**
 * Maximum anglers allowed per lake
 * @type {Record<LakeSlug, number>}
 */
export const MAX_BY_LAKE = {
    'bignor-main': 3,
    'wood-pool': 2
};

/**
 * Storage key for bookings in localStorage
 */
const STORAGE_KEY = 'bookings';

/**
 * Generate a simple UUID v4
 * @returns {string} UUID string
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Load bookings from localStorage
 * @returns {Booking[]} Array of bookings sorted by start time descending
 */
export function loadBookings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        
        const bookings = JSON.parse(stored);
        // Sort by start time descending (most recent first)
        return bookings.sort((a, b) => b.start - a.start);
    } catch (error) {
        console.error('Error loading bookings:', error);
        return [];
    }
}

/**
 * Save bookings to localStorage
 * @param {Booking[]} list - Array of bookings to save
 */
export function saveBookings(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

/**
 * Add a new booking
 * @param {Booking} booking - Booking to add
 */
export function addBooking(booking) {
    const bookings = loadBookings();
    bookings.push(booking);
    saveBookings(bookings);
}

/**
 * Get active bookings (currently ongoing)
 * @param {number} [now] - Current time in milliseconds (defaults to Date.now())
 * @returns {Booking[]} Array of active bookings
 */
export function activeBookings(now = Date.now()) {
    const bookings = loadBookings();
    return bookings.filter(b => 
        b.status === 'upcoming' && 
        b.start <= now && 
        now < b.end
    );
}

/**
 * Get active bookings grouped by lake
 * @param {number} [now] - Current time in milliseconds (defaults to Date.now())
 * @returns {Record<LakeSlug, Booking[]>} Active bookings by lake
 */
export function activeByLake(now = Date.now()) {
    const active = activeBookings(now);
    return {
        'bignor-main': active.filter(b => b.lakeSlug === 'bignor-main'),
        'wood-pool': active.filter(b => b.lakeSlug === 'wood-pool')
    };
}

/**
 * Get active booking for a specific user
 * @param {string} userId - User ID to check
 * @param {number} [now] - Current time in milliseconds (defaults to Date.now())
 * @returns {Booking|undefined} Active booking or undefined
 */
export function userActive(userId, now = Date.now()) {
    const active = activeBookings(now);
    return active.find(b => b.user.id === userId);
}

/**
 * Get upcoming bookings (not yet started)
 * @param {number} [now] - Current time in milliseconds (defaults to Date.now())
 * @returns {Booking[]} Array of upcoming bookings
 */
export function upcomingBookings(now = Date.now()) {
    const bookings = loadBookings();
    return bookings.filter(b => 
        b.status === 'upcoming' && 
        b.start > now
    );
}

/**
 * Get bookings for a specific date
 * @param {Date|number} date - Date to check
 * @returns {Booking[]} Bookings for that date
 */
export function bookingsForDate(date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const startOfDay = targetDate.getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;
    
    const bookings = loadBookings();
    return bookings.filter(b => 
        b.status !== 'cancelled' &&
        ((b.start >= startOfDay && b.start < endOfDay) ||
         (b.end > startOfDay && b.end <= endOfDay) ||
         (b.start <= startOfDay && b.end >= endOfDay))
    );
}

/**
 * Check if a lake is available on a specific date
 * @param {LakeSlug} lakeSlug - Lake to check
 * @param {Date|number} date - Date to check
 * @returns {boolean} True if lake has availability
 */
export function isLakeAvailable(lakeSlug, date) {
    const dateBookings = bookingsForDate(date);
    const lakeBookings = dateBookings.filter(b => b.lakeSlug === lakeSlug);
    return lakeBookings.length < MAX_BY_LAKE[lakeSlug];
}

/**
 * Get available spots for a lake on a specific date
 * @param {LakeSlug} lakeSlug - Lake to check
 * @param {Date|number} date - Date to check
 * @returns {number} Number of available spots
 */
export function availableSpots(lakeSlug, date) {
    const dateBookings = bookingsForDate(date);
    const lakeBookings = dateBookings.filter(b => b.lakeSlug === lakeSlug);
    return MAX_BY_LAKE[lakeSlug] - lakeBookings.length;
}

/**
 * Cancel a booking
 * @param {string} bookingId - ID of booking to cancel
 * @returns {boolean} True if cancelled successfully
 */
export function cancelBooking(bookingId) {
    const bookings = loadBookings();
    const booking = bookings.find(b => b.id === bookingId);
    
    if (!booking) return false;
    
    booking.status = 'cancelled';
    saveBookings(bookings);
    return true;
}

/**
 * Update booking statuses (mark completed bookings)
 * @param {number} [now] - Current time in milliseconds (defaults to Date.now())
 */
export function updateBookingStatuses(now = Date.now()) {
    const bookings = loadBookings();
    let updated = false;
    
    bookings.forEach(booking => {
        if (booking.status === 'upcoming' && booking.end <= now) {
            booking.status = 'completed';
            updated = true;
        }
    });
    
    if (updated) {
        saveBookings(bookings);
    }
}

/**
 * Get user's booking history
 * @param {string} userId - User ID
 * @returns {Booking[]} User's bookings
 */
export function userBookings(userId) {
    const bookings = loadBookings();
    return bookings.filter(b => b.user.id === userId);
}

/**
 * Migrate old booking format to new format
 * @param {Object} oldBooking - Old format booking
 * @returns {Booking} New format booking
 */
export function migrateBooking(oldBooking) {
    // Convert old lake format to new format
    let lakeSlug = oldBooking.lake;
    if (lakeSlug === 'bignor') lakeSlug = 'bignor-main';
    if (lakeSlug === 'wood') lakeSlug = 'wood-pool';
    
    // Convert date string to timestamps
    const dateStr = oldBooking.date || new Date().toISOString().split('T')[0];
    const start = new Date(dateStr + 'T12:00:00').getTime(); // Default to noon
    const end = start + 24 * 60 * 60 * 1000; // 24 hours later
    
    // Convert created timestamp
    const createdAt = oldBooking.createdAt 
        ? new Date(oldBooking.createdAt).getTime() 
        : Date.now();
    
    return {
        id: oldBooking.id || generateUUID(),
        lakeSlug,
        user: {
            id: oldBooking.userId || oldBooking.user?.id || 'unknown',
            name: oldBooking.userName || oldBooking.user?.name || 'Unknown User',
            avatar: oldBooking.user?.avatar
        },
        start,
        end,
        peg: oldBooking.peg,
        createdAt,
        notes: oldBooking.notes,
        status: oldBooking.status || 'upcoming'
    };
}

/**
 * Migrate all old bookings to new format
 */
export function migrateAllBookings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        
        const oldBookings = JSON.parse(stored);
        
        // Check if already migrated (new format has lakeSlug instead of lake)
        if (oldBookings.length > 0 && oldBookings[0].lakeSlug) {
            console.log('Bookings already migrated');
            return;
        }
        
        const newBookings = oldBookings.map(migrateBooking);
        saveBookings(newBookings);
        console.log(`Migrated ${newBookings.length} bookings to new format`);
    } catch (error) {
        console.error('Error migrating bookings:', error);
    }
}











