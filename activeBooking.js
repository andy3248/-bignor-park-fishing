// ActiveBooking.js - UTC-based booking system to avoid timezone issues
// This ensures dates are stored and displayed consistently regardless of user timezone

// Given a Date or 'YYYY-MM-DD' picked locally, return UTC midnight for that calendar day
function startOfLocalDayAsUTC(input) {
  const d = typeof input === 'string' ? new Date(input + 'T00:00:00') : input;
  // Construct UTC midnight using date parts to avoid timezone shifts
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

// ActiveBooking type structure:
// {
//   id: string;
//   userId: string;
//   userName: string;
//   lakeSlug: 'bignor-main'|'wood-pool';
//   lakeName: string;
//   startUtc: number;         // UTC midnight start of the session day
//   endUtc: number;           // startUtc + 24h
//   bookedOnUtc: number;      // timestamp when user booked
//   notes?: string;
// }

const key = (userId) => `bp_active_booking_${userId}`;

function setActiveBooking(booking) {
  localStorage.setItem(key(booking.userId), JSON.stringify(booking));
}

function getActiveBooking(userId) {
  const raw = localStorage.getItem(key(userId));
  if (!raw) return null;
  try { 
    return JSON.parse(raw); 
  } catch { 
    return null; 
  }
}

function clearActiveBooking(userId) {
  localStorage.removeItem(key(userId));
}

function hasExpired(booking, now = Date.now()) {
  return now >= booking.endUtc;
}

function isActiveNow(booking, now = Date.now()) {
  return now >= booking.startUtc && now < booking.endUtc;
}

function isUpcoming(booking, now = Date.now()) {
  return now < booking.startUtc;
}

// Remove if expired (call on load / interval / visibilitychange)
function clearIfExpired(userId, now = Date.now()) {
  const booking = getActiveBooking(userId);
  if (booking && hasExpired(booking, now)) {
    clearActiveBooking(userId);
  }
}

// Formatting helpers – render the same calendar date regardless of viewer TZ
function formatDateUK_UTC(utcMs) {
  return new Date(utcMs).toLocaleDateString('en-GB', {
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function formatTimeHM_UTC(utcMs) {
  return new Date(utcMs).toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit', 
    timeZone: 'UTC' 
  });
}

// Get all active bookings for a specific date (for availability checking)
function getAllActiveBookingsForDate(dateStr) {
  const startUtc = startOfLocalDayAsUTC(dateStr);
  const endUtc = startUtc + 24 * 60 * 60 * 1000;
  
  const allBookings = [];
  
  // Iterate through all localStorage keys to find active bookings
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey && storageKey.startsWith('bp_active_booking_')) {
      const booking = JSON.parse(localStorage.getItem(storageKey));
      
      // Check if booking overlaps with the requested date
      if (booking.startUtc === startUtc) {
        allBookings.push(booking);
      }
    }
  }
  
  return allBookings;
}

// Get all active bookings grouped by lake
function getAllActiveBookingsByLake(dateStr) {
  const bookings = getAllActiveBookingsForDate(dateStr);
  
  return {
    'bignor-main': bookings.filter(b => b.lakeSlug === 'bignor-main'),
    'wood-pool': bookings.filter(b => b.lakeSlug === 'wood-pool')
  };
}

// Check if a lake is available for a specific date
function isLakeAvailable(lakeSlug, dateStr, maxCapacity) {
  const bookingsByLake = getAllActiveBookingsByLake(dateStr);
  const currentBookings = bookingsByLake[lakeSlug] || [];
  return currentBookings.length < maxCapacity;
}

// Get available spots for a lake on a specific date
function getAvailableSpots(lakeSlug, dateStr, maxCapacity) {
  const bookingsByLake = getAllActiveBookingsByLake(dateStr);
  const currentBookings = bookingsByLake[lakeSlug] || [];
  return Math.max(0, maxCapacity - currentBookings.length);
}

// Migration helper: Convert old booking format to new UTC format
function migrateOldBooking(oldBooking) {
  // If booking already has startUtc, it's already migrated
  if (oldBooking.startUtc) return oldBooking;
  
  // Convert old format to new format
  const dateStr = oldBooking.date; // Assuming format 'YYYY-MM-DD'
  const startUtc = startOfLocalDayAsUTC(dateStr);
  const endUtc = startUtc + 24 * 60 * 60 * 1000; // 24 hours
  const bookedOnUtc = oldBooking.createdAt || Date.now();
  
  return {
    id: oldBooking.id,
    userId: oldBooking.userId,
    userName: oldBooking.userName || 'Unknown',
    lakeSlug: oldBooking.lake || oldBooking.lakeSlug,
    lakeName: oldBooking.lakeName,
    startUtc: startUtc,
    endUtc: endUtc,
    bookedOnUtc: bookedOnUtc,
    notes: oldBooking.notes
  };
}

// Clean up expired bookings for all users
function cleanupExpiredBookings(now = Date.now()) {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const storageKey = localStorage.key(i);
    if (storageKey && storageKey.startsWith('bp_active_booking_')) {
      const booking = JSON.parse(localStorage.getItem(storageKey));
      if (hasExpired(booking, now)) {
        keysToRemove.push(storageKey);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  return keysToRemove.length; // Return count of cleaned bookings
}

// Get booking status text
function getBookingStatus(booking, now = Date.now()) {
  if (hasExpired(booking, now)) return 'completed';
  if (isActiveNow(booking, now)) return 'active';
  if (isUpcoming(booking, now)) return 'upcoming';
  return 'unknown';
}

// Format booking for display
function formatBookingForDisplay(booking) {
  const now = Date.now();
  return {
    id: booking.id,
    lakeName: booking.lakeName,
    sessionDate: formatDateUK_UTC(booking.startUtc),
    bookedOn: formatDateUK_UTC(booking.bookedOnUtc),
    status: getBookingStatus(booking, now),
    isActive: isActiveNow(booking, now),
    isUpcoming: isUpcoming(booking, now),
    hasExpired: hasExpired(booking, now),
    startTime: formatTimeHM_UTC(booking.startUtc),
    endTime: formatTimeHM_UTC(booking.endUtc)
  };
}

// Export all functions for use in other scripts
if (typeof window !== 'undefined') {
  window.ActiveBookingSystem = {
    // Core functions
    startOfLocalDayAsUTC,
    setActiveBooking,
    getActiveBooking,
    clearActiveBooking,
    hasExpired,
    isActiveNow,
    isUpcoming,
    clearIfExpired,
    
    // Formatting functions
    formatDateUK_UTC,
    formatTimeHM_UTC,
    
    // Availability functions
    getAllActiveBookingsForDate,
    getAllActiveBookingsByLake,
    isLakeAvailable,
    getAvailableSpots,
    
    // Utility functions
    migrateOldBooking,
    cleanupExpiredBookings,
    getBookingStatus,
    formatBookingForDisplay
  };
  
  console.log('[ActiveBooking] UTC-based booking system loaded successfully');
}









