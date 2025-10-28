/**
 * Bookings Store - Persist bookings and restrictions using localStorage
 * Provides centralized booking management for the fishing app
 */

// ============================================================================
// Constants
// ============================================================================

export const MAX_PER_LAKE = {
  'bignor-main': 3,
  'wood-pool': 2
};

const STORAGE_KEY = 'bignor_park_bookings';

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Load all bookings from localStorage, sorted by start date
 * @returns {Array} Array of bookings sorted by start date (earliest first)
 */
export function loadBookings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    
    // Validate that we got an array
    if (!Array.isArray(parsed)) {
      console.warn('Bookings data is not an array, resetting storage');
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Validate and filter bookings
    const validBookings = parsed.filter((booking) => {
      // Check required fields
      if (!booking.id || !booking.lakeSlug || !booking.user || 
          !booking.start || !booking.end || !booking.createdAt) {
        console.warn('Invalid booking found, skipping:', booking);
        return false;
      }

      // Validate lake slug
      if (booking.lakeSlug !== 'bignor-main' && booking.lakeSlug !== 'wood-pool') {
        console.warn('Invalid lakeSlug, skipping:', booking);
        return false;
      }

      // Validate user object
      if (!booking.user.id || !booking.user.name) {
        console.warn('Invalid user data, skipping:', booking);
        return false;
      }

      return true;
    });

    // Sort by start date (earliest first)
    return validBookings.sort((a, b) => a.start - b.start);

  } catch (error) {
    console.error('Error loading bookings from localStorage:', error);
    // If storage is corrupted, clear it and return empty array
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

/**
 * Save bookings array to localStorage
 * @param {Array} list - Array of bookings to persist
 */
export function saveBookings(list) {
  try {
    const json = JSON.stringify(list);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (error) {
    console.error('Error saving bookings to localStorage:', error);
    // Handle quota exceeded or other storage errors
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded. Some bookings may not be saved.');
    }
  }
}

/**
 * Add a new booking and persist to storage
 * @param {Object} booking - The booking to add
 */
export function addBooking(booking) {
  const bookings = loadBookings();
  
  // Check if booking with same ID already exists
  const existingIndex = bookings.findIndex(b => b.id === booking.id);
  if (existingIndex !== -1) {
    console.warn('Booking with ID already exists, replacing:', booking.id);
    bookings[existingIndex] = booking;
  } else {
    bookings.push(booking);
  }
  
  saveBookings(bookings);
}

/**
 * Get all active bookings (current or future)
 * @param {number} now - Timestamp to check against (defaults to current time)
 * @returns {Array} Array of active bookings
 */
export function activeBookings(now = Date.now()) {
  const bookings = loadBookings();
  return bookings.filter(booking => {
    // Booking is active if:
    // - It has started (start <= now)
    // - It hasn't ended yet (end > now)
    return booking.start <= now && booking.end > now;
  });
}

/**
 * Get active bookings grouped by lake
 * @param {number} now - Timestamp to check against (defaults to current time)
 * @returns {Object} Object with bookings grouped by lake slug
 */
export function activeByLake(now = Date.now()) {
  const active = activeBookings(now);
  
  const grouped = {
    'bignor-main': [],
    'wood-pool': []
  };

  active.forEach(booking => {
    grouped[booking.lakeSlug].push(booking);
  });

  return grouped;
}

/**
 * Remove all expired bookings from storage
 * A booking is expired if its end time has passed
 */
export function clearExpired() {
  const now = Date.now();
  const bookings = loadBookings();
  
  const activeOnly = bookings.filter(booking => booking.end > now);
  
  // Only save if something changed
  if (activeOnly.length !== bookings.length) {
    console.log(`Cleared ${bookings.length - activeOnly.length} expired booking(s)`);
    saveBookings(activeOnly);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a lake has reached its maximum capacity at a given time
 * @param {string} lakeSlug - The lake to check
 * @param {number} timestamp - The time to check (defaults to now)
 * @returns {boolean} true if the lake is at capacity
 */
export function isLakeAtCapacity(lakeSlug, timestamp = Date.now()) {
  const active = activeByLake(timestamp);
  return active[lakeSlug].length >= MAX_PER_LAKE[lakeSlug];
}

/**
 * Get available spots for a lake at a given time
 * @param {string} lakeSlug - The lake to check
 * @param {number} timestamp - The time to check (defaults to now)
 * @returns {number} Number of available spots
 */
export function getAvailableSpots(lakeSlug, timestamp = Date.now()) {
  const active = activeByLake(timestamp);
  const current = active[lakeSlug].length;
  const max = MAX_PER_LAKE[lakeSlug];
  return Math.max(0, max - current);
}

/**
 * Get all bookings for a specific user
 * @param {string} userId - The user ID to filter by
 * @returns {Array} Array of bookings for the user
 */
export function getBookingsByUser(userId) {
  const bookings = loadBookings();
  return bookings.filter(booking => booking.user.id === userId);
}

/**
 * Get all future bookings (not yet started)
 * @param {number} now - Timestamp to check against (defaults to current time)
 * @returns {Array} Array of future bookings
 */
export function futureBookings(now = Date.now()) {
  const bookings = loadBookings();
  return bookings.filter(booking => booking.start > now);
}

/**
 * Delete a booking by ID
 * @param {string} bookingId - The ID of the booking to delete
 * @returns {boolean} true if booking was found and deleted
 */
export function deleteBooking(bookingId) {
  const bookings = loadBookings();
  const filtered = bookings.filter(b => b.id !== bookingId);
  
  if (filtered.length < bookings.length) {
    saveBookings(filtered);
    return true;
  }
  
  return false;
}

/**
 * Check for booking conflicts (overlapping time periods on same lake)
 * @param {Object} newBooking - The booking to check for conflicts
 * @returns {Array} Array of conflicting bookings
 */
export function findConflicts(newBooking) {
  const bookings = loadBookings();
  
  return bookings.filter(existing => {
    // Skip checking against itself
    if (existing.id === newBooking.id) return false;
    
    // Only check same lake
    if (existing.lakeSlug !== newBooking.lakeSlug) return false;
    
    // Check if time ranges overlap
    // Two ranges overlap if: start1 < end2 AND start2 < end1
    return newBooking.start < existing.end && existing.start < newBooking.end;
  });
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the bookings store - clear expired bookings on load
 * Call this when your app starts
 */
export function initBookingsStore() {
  clearExpired();
  console.log('Bookings store initialized');
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Clear expired bookings when page loads
  clearExpired();
}









