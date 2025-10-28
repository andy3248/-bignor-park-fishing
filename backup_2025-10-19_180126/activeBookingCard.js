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

  const html = `
    <div class="active-booking-card ${statusClass}" data-booking-id="${booking.id}">
      <!-- Card Header -->
      <div class="booking-card-header">
        <div class="header-left">
          <div class="status-indicator ${statusClass}">
            <span class="status-pulse"></span>
          </div>
          <div class="header-text">
            <h3>${statusEmoji} Your Fishing Session</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
        </div>
        <div class="header-right">
          <img src="carp-logo.png" alt="Bignor Park" class="booking-logo">
        </div>
      </div>

      <!-- Lake Banner -->
      <div class="lake-banner">
        <div class="lake-info">
          <h4>${booking.lakeName}</h4>
          <p>Bignor Park Carp Fishery</p>
        </div>
      </div>

      <!-- Booking Details Grid -->
      <div class="booking-details-grid">
        <div class="detail-item">
          <div class="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <div class="detail-content">
            <span class="detail-label">Session Date</span>
            <span class="detail-value">${display.sessionDate}</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="detail-content">
            <span class="detail-label">Start Time</span>
            <span class="detail-value">${display.startTime} UTC</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10h-10V2z"></path>
            </svg>
          </div>
          <div class="detail-content">
            <span class="detail-label">Duration</span>
            <span class="detail-value">24 Hours</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="detail-content">
            <span class="detail-label">Booked On</span>
            <span class="detail-value">${display.bookedOn}</span>
          </div>
        </div>
      </div>

      ${timeUntilHtml}
      ${progressHtml}

      ${booking.notes ? `
        <div class="booking-notes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>${booking.notes}</span>
        </div>
      ` : ''}

      <!-- Card Actions -->
      <div class="booking-card-actions">
        ${display.isUpcoming ? `
          <button class="action-btn cancel-btn" onclick="handleCancelBooking('${booking.userId}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Cancel Booking
          </button>
          <button class="action-btn secondary-btn" onclick="openBookingDetails('${booking.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            View Details
          </button>
        ` : display.isActive ? `
          <button class="action-btn info-btn" onclick="showActiveSessionInfo()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Session Information
          </button>
        ` : ''}
      </div>

      <!-- Booking ID Footer -->
      <div class="booking-id-footer">
        <span>Booking ID: <strong>#${booking.id.substring(3, 11).toUpperCase()}</strong></span>
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






