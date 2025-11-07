// ActiveBookingCard.js - Display user's active booking in a beautiful card

/**
 * Renders an active booking card for the specified user
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

  // Get the booking
  const booking = window.ActiveBookingSystem?.getActiveBooking(userId);
  
  if (!booking) {
    renderNoBookingState(containerElement);
    return;
  }

  // Format the booking for display
  const display = window.ActiveBookingSystem.formatBookingForDisplay(booking);
  
  // Render the card
  renderBookingCard(booking, display, containerElement);
}

/**
 * Render the active booking card
 */
function renderBookingCard(booking, display, container) {
  const statusClass = display.status;
  const statusEmoji = display.isActive ? '🎣' : display.isUpcoming ? '📅' : '✅';
  const statusLabel = display.isActive ? 'ACTIVE NOW' : display.isUpcoming ? 'UPCOMING' : 'COMPLETED';

  // Calculate time until session (for upcoming bookings)
  let timeUntilHtml = '';
  if (display.isUpcoming) {
    const timeUntil = calculateTimeUntil(booking.startUtc);
    timeUntilHtml = `
      <div class="time-until">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>Starts in ${timeUntil}</span>
      </div>
    `;
  }

  // Calculate session progress (for active bookings)
  let progressHtml = '';
  if (display.isActive) {
    const progress = calculateProgress(booking.startUtc, booking.endUtc);
    progressHtml = `
      <div class="session-progress">
        <div class="progress-label">
          <span>Session Progress</span>
          <span class="progress-percent">${progress.percent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress.percent}%"></div>
        </div>
        <div class="progress-time">
          <span>${progress.elapsed} elapsed</span>
          <span>${progress.remaining} remaining</span>
        </div>
      </div>
    `;
  }

  // Calculate time remaining
  const now = Date.now();
  const startUtc = booking.startUtc || new Date(booking.date).getTime();
  const endUtc = booking.endUtc || (startUtc + (24 * 60 * 60 * 1000));
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
  const bookingDate = booking.date || display.sessionDate;
  
  // Use new stripe card design
  const html = `
    <div class="bookings-cards-container">
      <div class="bookings-header">
        <h3>Your Bookings</h3>
        <span class="bookings-count">1 Active</span>
      </div>
      <div class="booking-stripe-card ${statusClass}">
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
    </div>
  `;

  container.innerHTML = html;

  // Start auto-refresh for active bookings
  if (display.isActive) {
    startAutoRefresh(userId, container);
  }
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









