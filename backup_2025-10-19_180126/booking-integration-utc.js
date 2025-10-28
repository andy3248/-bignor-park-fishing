// Booking Integration - UTC System
// This file shows how to integrate activeBooking.js into your booking flow

// Simple UUID generator (no npm required)
function generateUUID() {
  return 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Generate booking ID (alias for generateUUID for compatibility)
function generateBookingId() {
  return generateUUID();
}

// Get the ActiveBooking system
const {
  startOfLocalDayAsUTC,
  setActiveBooking,
  getActiveBooking,
  clearActiveBooking,
  formatDateUK_UTC,
  isLakeAvailable,
  getAvailableSpots,
  getAllActiveBookingsByLake,
  formatBookingForDisplay,
  clearIfExpired
} = window.ActiveBookingSystem;

// Lake configuration
const LAKES = {
  'bignor-main': {
    slug: 'bignor-main',
    name: 'Bignor Main Lake',
    maxCapacity: 5,
    pricePerDay: 50
  },
  'wood-pool': {
    slug: 'wood-pool',
    name: 'Wood Pool',
    maxCapacity: 3,
    pricePerDay: 40
  }
};

// Get lake info by slug
function getLakeInfo(lakeSlug) {
  return LAKES[lakeSlug] || null;
}

// Create a new booking
function createBooking(selectedDate, lakeSlug, currentUser, notes = '') {
  try {
    // Validate inputs
    if (!selectedDate || !lakeSlug || !currentUser) {
      throw new Error('Missing required booking information');
    }

    const lake = getLakeInfo(lakeSlug);
    if (!lake) {
      throw new Error('Invalid lake selected');
    }

    // Check if user already has an active booking
    const existingBooking = getActiveBooking(currentUser.email);
    if (existingBooking) {
      // Clear if expired
      clearIfExpired(currentUser.email);
      const stillExists = getActiveBooking(currentUser.email);
      if (stillExists) {
        throw new Error('You already have an active booking');
      }
    }

    // Check availability
    const available = isLakeAvailable(lakeSlug, selectedDate, lake.maxCapacity);
    if (!available) {
      const spots = getAvailableSpots(lakeSlug, selectedDate, lake.maxCapacity);
      throw new Error(`${lake.name} is fully booked for this date (${spots} spots available)`);
    }

    // Calculate UTC timestamps
    const startUtc = startOfLocalDayAsUTC(selectedDate);
    const endUtc = startUtc + (24 * 60 * 60 * 1000); // +24 hours

    // Create booking object
    const booking = {
      id: generateUUID(),
      userId: currentUser.email,
      userName: currentUser.fullName || currentUser.name || currentUser.email,
      lakeSlug: lake.slug,
      lakeName: lake.name,
      startUtc: startUtc,
      endUtc: endUtc,
      bookedOnUtc: Date.now(),
      notes: notes || ''
    };

    // Save booking
    setActiveBooking(booking);

    // Also save to legacy bookings array for compatibility
    saveLegacyBooking(booking);

    console.log('✅ Booking created successfully:', booking);
    return {
      success: true,
      booking: booking,
      message: `Booking confirmed for ${formatDateUK_UTC(startUtc)} at ${lake.name}`
    };

  } catch (error) {
    console.error('❌ Booking error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Save to legacy format for backward compatibility
function saveLegacyBooking(booking) {
  try {
    const stored = localStorage.getItem('bignor_park_bookings');
    const bookings = stored ? JSON.parse(stored) : [];

    // Convert UTC booking to legacy format
    const legacyBooking = {
      id: booking.id,
      userId: booking.userId,
      userName: booking.userName,
      lake: booking.lakeSlug,
      lakeName: booking.lakeName,
      date: new Date(booking.startUtc).toISOString().split('T')[0], // 'YYYY-MM-DD'
      createdAt: booking.bookedOnUtc,
      status: 'upcoming',
      notes: booking.notes
    };

    bookings.push(legacyBooking);
    localStorage.setItem('bignor_park_bookings', JSON.stringify(bookings));
    
    console.log('💾 Legacy booking saved for compatibility');
  } catch (error) {
    console.error('⚠️ Error saving legacy booking:', error);
  }
}

// Get user's current booking with formatted display
function getUserBooking(userEmail) {
  // Clear if expired first
  clearIfExpired(userEmail);
  
  const booking = getActiveBooking(userEmail);
  if (!booking) {
    return null;
  }

  return formatBookingForDisplay(booking);
}

// Cancel a booking
function cancelBooking(userEmail) {
  try {
    const booking = getActiveBooking(userEmail);
    if (!booking) {
      return {
        success: false,
        error: 'No booking found to cancel'
      };
    }

    // Remove from active bookings
    clearActiveBooking(userEmail);

    // Update legacy bookings array
    const stored = localStorage.getItem('bignor_park_bookings');
    if (stored) {
      let bookings = JSON.parse(stored);
      bookings = bookings.filter(b => 
        !(b.userId === userEmail && b.id === booking.id)
      );
      localStorage.setItem('bignor_park_bookings', JSON.stringify(bookings));
    }

    // Clear booking restriction
    localStorage.removeItem(`lastBookingTime_${userEmail}`);

    console.log('✅ Booking cancelled successfully');
    return {
      success: true,
      message: 'Booking cancelled successfully'
    };

  } catch (error) {
    console.error('❌ Cancel error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Check availability for all lakes on a specific date
function checkAvailabilityForDate(dateStr) {
  const availability = {};

  for (const [slug, lake] of Object.entries(LAKES)) {
    const spots = getAvailableSpots(slug, dateStr, lake.maxCapacity);
    const bookings = getAllActiveBookingsByLake(dateStr)[slug] || [];

    availability[slug] = {
      lakeName: lake.name,
      maxCapacity: lake.maxCapacity,
      availableSpots: spots,
      bookedSpots: lake.maxCapacity - spots,
      isAvailable: spots > 0,
      bookings: bookings.map(b => ({
        userName: b.userName,
        bookedOn: formatDateUK_UTC(b.bookedOnUtc)
      }))
    };
  }

  return availability;
}

// Update calendar day colors based on availability
function updateCalendarAvailability(dateStr, dayElement) {
  const availability = checkAvailabilityForDate(dateStr);
  
  // Check if any lake has availability
  const anyAvailable = Object.values(availability).some(a => a.isAvailable);
  const allFull = Object.values(availability).every(a => !a.isAvailable);

  // Remove old classes
  dayElement.classList.remove('available', 'limited', 'full');

  if (allFull) {
    dayElement.classList.add('full'); // Red
    dayElement.title = 'Fully booked';
  } else if (anyAvailable) {
    const totalAvailable = Object.values(availability)
      .reduce((sum, a) => sum + a.availableSpots, 0);
    
    if (totalAvailable <= 2) {
      dayElement.classList.add('limited'); // Yellow/Orange
      dayElement.title = `${totalAvailable} spots remaining`;
    } else {
      dayElement.classList.add('available'); // Green
      dayElement.title = `${totalAvailable} spots available`;
    }
  }
}

// Display availability for selected date
function displayAvailabilityInfo(dateStr, containerElement) {
  const availability = checkAvailabilityForDate(dateStr);
  const formattedDate = formatDateUK_UTC(startOfLocalDayAsUTC(dateStr));

  let html = `<h3>Availability for ${formattedDate}</h3>`;
  html += '<div class="availability-grid">';

  for (const [slug, info] of Object.entries(availability)) {
    const statusClass = info.isAvailable ? 'available' : 'full';
    const buttonDisabled = info.isAvailable ? '' : 'disabled';

    html += `
      <div class="lake-availability-card ${statusClass}">
        <h4>${info.lakeName}</h4>
        <div class="capacity-display">
          <span class="spots">${info.availableSpots}</span>
          <span class="separator">/</span>
          <span class="total">${info.maxCapacity}</span>
        </div>
        <p class="capacity-label">
          ${info.availableSpots === 0 ? 'Fully Booked' : 
            info.availableSpots === 1 ? '1 spot available' : 
            `${info.availableSpots} spots available`}
        </p>
        ${info.bookings.length > 0 ? `
          <details class="bookings-list">
            <summary>${info.bookings.length} booking${info.bookings.length > 1 ? 's' : ''}</summary>
            <ul>
              ${info.bookings.map(b => `<li>${b.userName}</li>`).join('')}
            </ul>
          </details>
        ` : ''}
        <button 
          class="book-btn" 
          onclick="handleBookNow('${slug}', '${dateStr}')"
          ${buttonDisabled}>
          ${info.isAvailable ? 'Book Now' : 'Fully Booked'}
        </button>
      </div>
    `;
  }

  html += '</div>';
  containerElement.innerHTML = html;
}

// Handle "Book Now" button click
function handleBookNow(lakeSlug, dateStr) {
  // Get current user
  const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
  if (!currentUserData) {
    alert('Please log in to make a booking');
    window.location.href = 'index.html';
    return;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(currentUserData);
  } catch (e) {
    alert('Error loading user data. Please log in again.');
    window.location.href = 'index.html';
    return;
  }

  // Show confirmation dialog with booking details
  const lake = getLakeInfo(lakeSlug);
  const formattedDate = formatDateUK_UTC(startOfLocalDayAsUTC(dateStr));

  const confirmed = confirm(
    `Confirm Booking:\n\n` +
    `Lake: ${lake.name}\n` +
    `Date: ${formattedDate}\n` +
    `Duration: 24 hours\n` +
    `Price: £${lake.pricePerDay}\n\n` +
    `Proceed with booking?`
  );

  if (!confirmed) {
    return;
  }

  // Create the booking
  const result = createBooking(dateStr, lakeSlug, currentUser);

  if (result.success) {
    alert('✅ ' + result.message);
    
    // Refresh the page or redirect to dashboard
    const shouldRefresh = confirm('View your booking on the dashboard?');
    if (shouldRefresh) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.reload();
    }
  } else {
    alert('❌ Booking failed: ' + result.error);
  }
}

// Initialize booking system on page load
function initializeBookingSystem() {
  console.log('🎣 Initializing UTC Booking System...');

  // Clean up expired bookings
  const { cleanupExpiredBookings } = window.ActiveBookingSystem;
  const cleaned = cleanupExpiredBookings();
  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired bookings`);
  }

  // Check if user is logged in
  const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
  if (currentUserData) {
    try {
      const currentUser = JSON.parse(currentUserData);
      
      // Clear user's expired booking if any
      clearIfExpired(currentUser.email);
      
      // Check if user has an active booking
      const booking = getUserBooking(currentUser.email);
      if (booking) {
        console.log('📋 User has active booking:', booking);
      }
    } catch (e) {
      console.error('Error checking user booking:', e);
    }
  }

  console.log('✅ Booking System initialized');
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBookingSystem);
} else {
  initializeBookingSystem();
}

// Legacy addBooking function for backward compatibility
// This function maintains the old interface while using the new UTC system
function addBooking(bookingDetails) {
  // bookingDetails should include lake, date, session, durationHours, bookingId
  try {
    // Validate required fields
    if (!bookingDetails.lake || !bookingDetails.date) {
      throw new Error('Missing required booking information (lake, date)');
    }

    // Get current user
    const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
    if (!currentUserData) {
      throw new Error('User not logged in');
    }

    const currentUser = JSON.parse(currentUserData);
    
    // Convert lake to proper slug format
    let lakeSlug = bookingDetails.lake;
    if (lakeSlug === 'bignor') lakeSlug = 'bignor-main';
    if (lakeSlug === 'wood') lakeSlug = 'wood-pool';

    // Get lake info
    const lake = getLakeInfo(lakeSlug);
    if (!lake) {
      throw new Error('Invalid lake selected');
    }

    // Check if user already has an active booking
    const existingBooking = getActiveBooking(currentUser.email);
    if (existingBooking) {
      clearIfExpired(currentUser.email);
      const stillExists = getActiveBooking(currentUser.email);
      if (stillExists) {
        throw new Error('You already have an active booking');
      }
    }

    // Check availability
    const available = isLakeAvailable(lakeSlug, bookingDetails.date, lake.maxCapacity);
    if (!available) {
      const spots = getAvailableSpots(lakeSlug, bookingDetails.date, lake.maxCapacity);
      throw new Error(`${lake.name} is fully booked for this date (${spots} spots available)`);
    }

    // Calculate UTC timestamps
    const startUtc = startOfLocalDayAsUTC(bookingDetails.date);
    const endUtc = startUtc + (24 * 60 * 60 * 1000); // 24 hours (or use durationHours if provided)

    // Create booking object in new format
    const booking = {
      id: bookingDetails.bookingId || generateBookingId(),
      userId: currentUser.email,
      userName: currentUser.fullName || currentUser.name || currentUser.email,
      lakeSlug: lakeSlug,
      lakeName: lake.name,
      startUtc: startUtc,
      endUtc: endUtc,
      bookedOnUtc: Date.now(),
      notes: bookingDetails.notes || ''
    };

    // Save using new system
    setActiveBooking(booking);
    
    // Also save to legacy format for compatibility
    saveLegacyBooking(booking);

    // Also save in simple activeBooking format for backward compatibility
    const simpleBooking = {
      lake: booking.lakeSlug,
      date: new Date(booking.startUtc).toISOString().split('T')[0], // YYYY-MM-DD format
      session: bookingDetails.session || 'full-day',
      durationHours: bookingDetails.durationHours || 24,
      endTime: new Date(booking.endUtc).toISOString(),
      bookingId: booking.id,
      createdAt: new Date(booking.bookedOnUtc).toISOString(),
      notes: booking.notes
    };
    localStorage.setItem('activeBooking', JSON.stringify(simpleBooking));

    // Call renderActiveBooking if it exists
    if (typeof renderActiveBooking === 'function') {
      renderActiveBooking(booking);
    } else if (typeof window.ActiveBookingCard !== 'undefined' && window.ActiveBookingCard.render) {
      // Use the ActiveBookingCard system if available
      const container = document.getElementById('activeBookingContent') || document.querySelector('[data-active-booking-card]');
      if (container) {
        window.ActiveBookingCard.render(booking.userId, container);
      }
    }

    console.log('✅ Legacy addBooking completed successfully:', booking);
    return {
      success: true,
      booking: booking,
      message: `Booking confirmed for ${formatDateUK_UTC(startUtc)} at ${lake.name}`
    };

  } catch (error) {
    console.error('❌ Legacy addBooking error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Unified loadActiveBooking function that works with both systems
function loadActiveBooking() {
  console.log('loadActiveBooking called');
  
  // First, try to get current user
  const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
  if (!currentUserData) {
    console.log('No currentUser, showing no booking message');
    return null;
  }

  let currentUser;
  try {
    currentUser = JSON.parse(currentUserData);
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }

  // Try the simple activeBooking format first (your original system)
  const simpleBooking = loadSimpleActiveBooking();
  if (simpleBooking) {
    console.log('Found simple active booking:', simpleBooking);
    return simpleBooking;
  }

  // Try the UTC-based system
  if (window.ActiveBookingSystem) {
    // Clear if expired first
    window.ActiveBookingSystem.clearIfExpired(currentUser.email);
    
    const utcBooking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
    if (utcBooking) {
      console.log('Found UTC active booking:', utcBooking);
      return utcBooking;
    }
  }

  console.log('No active booking found');
  return null;
}

// Load from simple activeBooking format (your original system)
function loadSimpleActiveBooking() {
  const raw = localStorage.getItem('activeBooking');
  if (!raw) return null;
  
  try {
    const booking = JSON.parse(raw);
    
    // Check expiration (24 hours from createdAt or endTime)
    const created = new Date(booking.createdAt);
    const now = new Date();
    const twentyFourHoursLater = new Date(created.getTime() + 24 * 60 * 60 * 1000);
    
    if (now > twentyFourHoursLater) {
      localStorage.removeItem('activeBooking');
      return null;
    }
    
    // Optional: also ensure endTime hasn't passed
    if (booking.endTime && new Date(booking.endTime) < now) {
      localStorage.removeItem('activeBooking');
      return null;
    }
    
    return booking;
  } catch (e) {
    console.error('Error parsing simple active booking:', e);
    localStorage.removeItem('activeBooking');
    return null;
  }
}

// Enhanced renderActiveBooking function with cancel functionality
function renderActiveBooking(booking) {
  const container = document.getElementById('active-booking-info');
  if (!container) {
    console.warn('Container active-booking-info not found');
    return;
  }

  if (!booking) {
    container.innerHTML = `
      <h4>No Active Booking</h4>
      <p>You don't have any active bookings at the moment.</p>
    `;
    return;
  }

  // Check if it's a UTC booking or simple booking
  if (booking.startUtc) {
    // UTC booking - convert to display format
    const display = formatBookingForDisplay(booking);
    const endTime = new Date(booking.endUtc);
    
    container.innerHTML = `
      <h4>Active Booking</h4>
      <p>Lake: ${escapeHtml(display.lakeName)}</p>
      <p>Date: ${escapeHtml(display.sessionDate)}</p>
      <p>Session: ${escapeHtml(booking.session || 'full-day')}</p>
      <p>Ends: ${endTime.toLocaleString()}</p>
      ${booking.notes ? `<p>Notes: ${escapeHtml(booking.notes)}</p>` : ''}
      <button id="cancel-booking">Cancel Booking</button>
    `;
  } else {
    // Simple booking format
    const endTime = booking.endTime ? new Date(booking.endTime) : new Date(new Date(booking.date + 'T00:00:00').getTime() + (24 * 60 * 60 * 1000));
    
    container.innerHTML = `
      <h4>Active Booking</h4>
      <p>Lake: ${escapeHtml(booking.lake)}</p>
      <p>Date: ${escapeHtml(booking.date)}</p>
      <p>Session: ${escapeHtml(booking.session)}</p>
      <p>Ends: ${endTime.toLocaleString()}</p>
      ${booking.notes ? `<p>Notes: ${escapeHtml(booking.notes)}</p>` : ''}
      <button id="cancel-booking">Cancel Booking</button>
    `;
  }

  // Add cancel booking functionality
  const cancelButton = document.getElementById('cancel-booking');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      cancelActiveBooking();
    });
  }
}

// Cancel active booking function
function cancelActiveBooking() {
  // Get current user
  const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
  
  if (currentUserData) {
    try {
      const currentUser = JSON.parse(currentUserData);
      
      // Clear from UTC system
      if (window.ActiveBookingSystem) {
        window.ActiveBookingSystem.clearActiveBooking(currentUser.email);
      }
      
      // Clear from legacy bookings array
      const stored = localStorage.getItem('bignor_park_bookings');
      if (stored) {
        let bookings = JSON.parse(stored);
        bookings = bookings.filter(b => b.userId !== currentUser.email);
        localStorage.setItem('bignor_park_bookings', JSON.stringify(bookings));
      }
      
      // Clear booking restriction
      localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
    } catch (e) {
      console.error('Error getting user data for cancellation:', e);
    }
  }
  
  // Clear simple activeBooking format
  localStorage.removeItem('activeBooking');
  
  // Re-render with null to show "no booking" state
  renderActiveBooking(null);
  
  console.log('✅ Booking cancelled successfully');
}

// HTML escape function for security
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export functions for global use
if (typeof window !== 'undefined') {
  window.BookingIntegration = {
    createBooking,
    getUserBooking,
    cancelBooking,
    checkAvailabilityForDate,
    updateCalendarAvailability,
    displayAvailabilityInfo,
    handleBookNow,
    getLakeInfo,
    addBooking, // Add the legacy function
    generateBookingId, // Export the ID generator
    renderActiveBooking, // Export the render function
    loadActiveBooking, // Export the unified load function
    loadSimpleActiveBooking, // Export the simple load function
    cancelActiveBooking, // Export the cancel function
    escapeHtml, // Export the escape function
    startActiveBookingWatcher, // Export the watcher function
    initializeActiveBookingDisplay, // Export the init function
    LAKES
  };

  // Also make functions globally available for backward compatibility
  window.addBooking = addBooking;
  window.generateBookingId = generateBookingId;
  window.renderActiveBooking = renderActiveBooking;
  window.loadActiveBooking = loadActiveBooking;
  window.cancelActiveBooking = cancelActiveBooking;
  window.escapeHtml = escapeHtml;
  window.startActiveBookingWatcher = startActiveBookingWatcher;
  window.initializeActiveBookingDisplay = initializeActiveBookingDisplay;

  console.log('[BookingIntegration] UTC Booking Integration loaded');
}

// Render active booking card (Yellowave style)
function renderActiveBookingCard() {
  const container = document.getElementById('activeBookingContent');
  if (!container) {
    console.log('[BookingIntegration] activeBookingContent container not found');
    return;
  }
  
  try {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.email) {
      console.log('[BookingIntegration] No current user found');
      if (window.BookingCard) {
        window.BookingCard.renderNoBookingState(container);
      }
      return;
    }
    
    // Check UTC booking system first
    let booking = null;
    if (window.ActiveBookingSystem && window.ActiveBookingSystem.getActiveBooking) {
      booking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
      
      // Clear if expired
      if (booking && window.ActiveBookingSystem.clearIfExpired) {
        window.ActiveBookingSystem.clearIfExpired(currentUser.email);
        booking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
      }
    }
    
    // Fallback to simple system
    if (!booking) {
      booking = loadSimpleActiveBooking();
    }
    
    // Render the card
    if (window.BookingCard) {
      if (booking) {
        console.log('[BookingIntegration] Rendering booking card:', booking);
        window.BookingCard.renderBookingCard(booking, container);
      } else {
        console.log('[BookingIntegration] No active booking found');
        window.BookingCard.renderNoBookingState(container);
      }
    } else {
      console.error('[BookingIntegration] BookingCard component not loaded');
    }
    
  } catch (error) {
    console.error('[BookingIntegration] Error rendering booking card:', error);
  }
}

// Active booking watcher system
function startActiveBookingWatcher() {
  console.log('Starting active booking watcher...');
  
  // Check every minute to keep UI in sync
  setInterval(() => {
    const current = loadActiveBooking();
    renderActiveBooking(current);
    
    // Also update the card if on booking page
    if (document.getElementById('activeBookingContent')) {
      renderActiveBookingCard();
    }
    
    // Update dropdown status if function exists
    if (window.UserDropdown && window.UserDropdown.updateBookingStatus) {
      window.UserDropdown.updateBookingStatus();
    }
  }, 60 * 1000);
}

// Initialize on page load
function initializeActiveBookingDisplay() {
  console.log('Initializing active booking display...');
  
  // Load and display current booking
  const current = loadActiveBooking();
  renderActiveBooking(current);
  
  // Render booking card if container exists
  if (document.getElementById('activeBookingContent')) {
    renderActiveBookingCard();
  }
  
  // Start the watcher
  startActiveBookingWatcher();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeActiveBookingDisplay);
} else {
  // DOM already loaded
  initializeActiveBookingDisplay();
}

// Export renderActiveBookingCard for manual calls
window.renderActiveBookingCard = renderActiveBookingCard;





