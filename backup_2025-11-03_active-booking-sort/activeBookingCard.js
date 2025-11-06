// ActiveBookingCard.js - Display user's active booking in a beautiful card

/**
 * Get all bookings for a user from both systems
 * @param {string} userId - User's email/ID
 * @returns {Array} Array of bookings
 */
function getAllUserBookings(userId) {
  const bookings = [];
  
  // Get from UTC booking system
  if (window.ActiveBookingSystem && window.ActiveBookingSystem.getActiveBooking) {
    const activeBooking = window.ActiveBookingSystem.getActiveBooking(userId);
    if (activeBooking) {
      bookings.push(activeBooking);
    }
  }
  
  // Get from legacy bookings system
  const bookingsKey = 'bignor_park_bookings';
  const stored = localStorage.getItem(bookingsKey);
  if (stored) {
    try {
      const allBookings = JSON.parse(stored);
      const userBookings = allBookings.filter(b => 
        b.userId === userId && 
        b.status !== 'cancelled'
      );
      
      // Convert legacy bookings to UTC format
      userBookings.forEach(booking => {
        // Skip if already added from UTC system
        if (bookings.some(b => b.id === booking.id)) return;
        
        // Convert date string to UTC timestamps
        const dateStr = booking.date; // e.g., "2025-11-05"
        const startUtc = new Date(dateStr + 'T00:00:00Z').getTime();
        const endUtc = startUtc + (24 * 60 * 60 * 1000);
        const bookedOnUtc = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
        
        bookings.push({
          id: booking.id,
          userId: booking.userId,
          userName: booking.userName || booking.userId,
          lakeSlug: booking.lakeId || 'bignor-main',
          lakeName: booking.lakeName || 'Bignor Main Lake',
          startUtc: startUtc,
          endUtc: endUtc,
          bookedOnUtc: bookedOnUtc,
          notes: booking.notes || ''
        });
      });
    } catch (error) {
      console.error('[ActiveBookingCard] Error reading legacy bookings:', error);
    }
  }
  
  return bookings;
}

/**
 * Determine booking status
 * @param {number} startUtc - Start timestamp
 * @param {number} endUtc - End timestamp
 * @returns {object} Status info
 */
function getBookingStatus(startUtc, endUtc) {
  const now = Date.now();
  
  if (now >= endUtc) {
    return { status: 'completed', isActive: false, isUpcoming: false, hasExpired: true };
  } else if (now >= startUtc && now < endUtc) {
    return { status: 'active', isActive: true, isUpcoming: false, hasExpired: false };
  } else {
    return { status: 'upcoming', isActive: false, isUpcoming: true, hasExpired: false };
  }
}

/**
 * Renders all active booking cards for the specified user (sorted by date, nearest first)
 * @param {string} userId - User's email/ID
 * @param {HTMLElement} containerElement - Element to render card into
 */
function renderActiveBookingCard(userId, containerElement) {
  if (!containerElement) {
    console.error('Container element not found');
    return;
  }

  // Clear if expired first
  if (window.ActiveBookingSystem) {
    window.ActiveBookingSystem.clearIfExpired(userId);
  }

  // Get all bookings
  const allBookings = getAllUserBookings(userId);
  
  // Filter to only show active and upcoming bookings
  const activeBookings = allBookings.filter(booking => {
    const status = getBookingStatus(booking.startUtc, booking.endUtc);
    return status.isActive || status.isUpcoming;
  });
  
  if (activeBookings.length === 0) {
    renderNoBookingState(containerElement);
    return;
  }

  // Sort by date - nearest date first (ascending order)
  activeBookings.sort((a, b) => a.startUtc - b.startUtc);
  
  // Render all bookings
  let html = `
    <div class="bookings-cards-container">
      <div class="bookings-header">
        <h3>Your Bookings</h3>
        <span class="bookings-count">${activeBookings.length} ${activeBookings.length === 1 ? 'Booking' : 'Bookings'}</span>
      </div>
  `;
  
  activeBookings.forEach((booking, index) => {
    const status = getBookingStatus(booking.startUtc, booking.endUtc);
    const display = window.ActiveBookingSystem ? 
      window.ActiveBookingSystem.formatBookingForDisplay(booking) : 
      { sessionDate: new Date(booking.startUtc).toLocaleDateString('en-GB', {
          weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
        })
      };
    
    html += renderSingleBookingCard(booking, status, display);
    
    // Start auto-refresh for the first active booking
    if (index === 0 && status.isActive) {
      startAutoRefresh(userId, containerElement);
    }
  });
  
  html += `</div>`;
  containerElement.innerHTML = html;
}

/**
 * Render a single booking card
 * @param {object} booking - Booking data
 * @param {object} status - Status info
 * @param {object} display - Display data
 * @returns {string} HTML string
 */
function renderSingleBookingCard(booking, status, display) {
  const statusClass = status.status;
  const statusLabel = status.isActive ? 'ACTIVE NOW' : status.isUpcoming ? 'UPCOMING' : 'COMPLETED';
  
  // Calculate time remaining
  const now = Date.now();
  const startUtc = booking.startUtc;
  const endUtc = booking.endUtc;
  const remaining = endUtc - now;
  let timeRemaining = 'Expired';
  
  if (remaining > 0) {
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      timeRemaining = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      timeRemaining = `${hours}h ${minutes}m`;
    } else {
      timeRemaining = `${minutes}m`;
    }
  }
  
  const startTime = new Date(startUtc).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
  
  const lakeName = booking.lakeName || 'Bignor Main Lake';
  const notes = booking.notes || '';
  const bookingDate = display.sessionDate || new Date(startUtc).toLocaleDateString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
  
  return `
      <div class="booking-stripe-card ${statusClass}" style="margin-bottom: 20px;">
        <div class="stripe-logo-section">
          <img src="carp-logo.png" alt="Bignor Park" class="stripe-logo">
          <div class="stripe-branding">
            <span class="stripe-brand-name">Bignor Park</span>
            <span class="stripe-brand-sub">Carp Fishery</span>
          </div>
        </div>
        
        <div class="stripe-divider"></div>
        
        <div class="stripe-content-section">
          <div class="stripe-header">
            <h3 class="stripe-lake-name">${lakeName}</h3>
            <span class="stripe-status-badge ${statusClass}">${statusLabel}</span>
          </div>
          
          <div class="stripe-details-grid">
            <div class="stripe-detail-item">
              <span class="stripe-label">Date</span>
              <span class="stripe-value">${bookingDate}</span>
            </div>
            
            <div class="stripe-detail-item">
              <span class="stripe-label">Start Time</span>
              <span class="stripe-value">${startTime} UTC</span>
            </div>
            
            <div class="stripe-detail-item">
              <span class="stripe-label">Duration</span>
              <span class="stripe-value">24 Hours</span>
            </div>
            
            <div class="stripe-detail-item">
              <span class="stripe-label">Time Remaining</span>
              <span class="stripe-value ${statusClass === 'active' ? 'active-time' : ''}">${timeRemaining}</span>
            </div>
          </div>
          
          ${notes ? `
          <div class="stripe-notes-section">
            <span class="stripe-label">Notes</span>
            <p class="stripe-notes-text">${notes}</p>
          </div>
          ` : ''}
          
          <div class="stripe-reference">
            <span class="stripe-ref-label">Booking Reference</span>
            <span class="stripe-ref-value">${booking.id}</span>
          </div>
        </div>
      </div>
  `;
}


/**
 * Render the no booking state
 */
function renderNoBookingState(container) {
  const html = `
    <div class="no-booking-card">
      <div class="no-booking-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <line x1="8" y1="14" x2="16" y2="14"></line>
          <line x1="8" y1="18" x2="12" y2="18"></line>
        </svg>
      </div>
      <h3>No Active Booking</h3>
      <p>You don't have an active fishing session. Book your next adventure!</p>
      <a href="booking.html" class="book-now-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
        Book a Session
      </a>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Calculate time until session starts
 */
function calculateTimeUntil(startUtc) {
  const now = Date.now();
  const diff = startUtc - now;

  if (diff <= 0) return 'Starting now';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Calculate session progress
 */
function calculateProgress(startUtc, endUtc) {
  const now = Date.now();
  const total = endUtc - startUtc;
  const elapsed = now - startUtc;
  const remaining = endUtc - now;

  const percent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));

  return {
    percent,
    elapsed: formatDuration(elapsed),
    remaining: formatDuration(remaining)
  };
}

/**
 * Format duration as "Xh Ym"
 */
function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Start auto-refresh for active session progress
 */
let refreshInterval = null;
function startAutoRefresh(userId, container) {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Refresh every minute
  refreshInterval = setInterval(() => {
    renderActiveBookingCard(userId, container);
  }, 60000); // 60 seconds
}

/**
 * Handle cancel booking button click
 */
function handleCancelBooking(userId) {
  if (!confirm('Are you sure you want to cancel your booking?\n\nThis action cannot be undone.')) {
    return;
  }

  const result = window.BookingIntegration?.cancelBooking(userId);

  if (result && result.success) {
    // Show success message
    if (window.ActiveBookingSystem) {
      const toast = document.createElement('div');
      toast.className = 'booking-toast success';
      toast.innerHTML = '✅ Booking cancelled successfully';
      document.body.appendChild(toast);
      
      setTimeout(() => toast.remove(), 3000);
    }

    // Refresh the card
    const container = document.querySelector('.active-booking-card')?.parentElement;
    if (container) {
      setTimeout(() => {
        renderActiveBookingCard(userId, container);
      }, 500);
    }
  } else {
    alert('Error cancelling booking: ' + (result?.error || 'Unknown error'));
  }
}

/**
 * Show booking details modal
 */
function openBookingDetails(bookingId) {
  alert('Booking details modal - Coming soon!\n\nBooking ID: ' + bookingId);
}

/**
 * Show active session info
 */
function showActiveSessionInfo() {
  const info = `
🎣 ACTIVE FISHING SESSION

Your session is currently in progress!

Important Information:
• Keep your fishing license visible
• Follow catch and release guidelines
• Respect other anglers on the lake
• Contact bailiffs for any issues

Emergency Contacts:
Liam Wadey: 07713 147857
Aaron Greenfield: 07816 674172

Have a great session!
  `;
  alert(info);
}

/**
 * Initialize ActiveBookingCard on elements with data-active-booking-card attribute
 */
function initializeActiveBookingCards() {
  const cards = document.querySelectorAll('[data-active-booking-card]');
  
  cards.forEach(card => {
    const userId = card.getAttribute('data-user-id');
    if (userId) {
      renderActiveBookingCard(userId, card);
    }
  });
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeActiveBookingCards);
} else {
  initializeActiveBookingCards();
}

// Export for global use
if (typeof window !== 'undefined') {
  window.ActiveBookingCard = {
    render: renderActiveBookingCard,
    initialize: initializeActiveBookingCards
  };

  console.log('[ActiveBookingCard] Component loaded successfully');
}









