// Active Booking Card Component - Yellowave Style
// Displays booking information in a card format with persistence

(function() {
    'use strict';
    
    // Format date to display format (e.g., "Saturday 11 October 2025")
    function formatBookingDate(utcTimestamp) {
        const date = new Date(utcTimestamp);
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }
    
    // Format date to short format (e.g., "11 Oct 2025")
    function formatShortDate(utcTimestamp) {
        const date = new Date(utcTimestamp);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }
    
    // Calculate time remaining until booking expires
    function calculateTimeRemaining(endUtc) {
        const now = Date.now();
        const remaining = endUtc - now;
        
        if (remaining <= 0) {
            return { expired: true, text: 'Expired' };
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return { expired: false, text: `${hours}h ${minutes}m remaining` };
        } else {
            return { expired: false, text: `${minutes}m remaining` };
        }
    }
    
    // Determine booking status based on dates
    function getBookingStatus(startUtc, endUtc) {
        const now = Date.now();
        
        if (now >= endUtc) {
            return { status: 'COMPLETED', color: '#6b7280', bgColor: '#f3f4f6' };
        } else if (now >= startUtc && now < endUtc) {
            return { status: 'ACTIVE', color: '#22c55e', bgColor: '#dcfce7' };
        } else {
            return { status: 'UPCOMING', color: '#3b82f6', bgColor: '#dbeafe' };
        }
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    // Render the booking info card
    function renderBookingCard(booking, containerElement) {
        if (!containerElement) {
            console.error('[BookingCard] Container element not found');
            return;
        }
        
        if (!booking) {
            renderNoBookingState(containerElement);
            return;
        }
        
        const statusInfo = getBookingStatus(booking.startUtc, booking.endUtc);
        const timeRemaining = calculateTimeRemaining(booking.endUtc);
        const bookingDate = formatBookingDate(booking.startUtc);
        const bookedOnDate = formatShortDate(booking.bookedOnUtc);
        
        const cardHTML = `
            <div class="booking-info-card" data-booking-id="${escapeHtml(booking.id)}">
                <div class="booking-card-header">
                    <div class="booking-card-title-section">
                        <img src="carp-logo.png" alt="Lake Logo" class="booking-card-logo">
                        <div class="booking-card-title-text">
                            <h4>${escapeHtml(booking.lakeName || 'Bignor Main Lake')}</h4>
                            <span class="status-badge" style="background: ${statusInfo.bgColor}; color: ${statusInfo.color};">
                                ${statusInfo.status}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="booking-card-body">
                    <div class="booking-date-display">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span class="booking-date-text">${bookingDate}</span>
                    </div>
                    
                    <div class="booking-detail-grid">
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">LAKE</span>
                            <span class="booking-detail-value">${escapeHtml(booking.lakeName || 'Bignor Main Lake')}</span>
                        </div>
                        
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">STATUS</span>
                            <span class="booking-detail-value">${statusInfo.status}</span>
                        </div>
                        
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">BOOKED ON</span>
                            <span class="booking-detail-value">${bookedOnDate}</span>
                        </div>
                        
                        <div class="booking-detail-item">
                            <span class="booking-detail-label">TIME REMAINING</span>
                            <span class="booking-detail-value ${timeRemaining.expired ? 'expired' : ''}">${timeRemaining.text}</span>
                        </div>
                    </div>
                    
                    ${booking.notes ? `
                        <div class="booking-notes-section">
                            <span class="booking-notes-label">ADDITIONAL NOTES</span>
                            <p class="booking-notes-text">${escapeHtml(booking.notes)}</p>
                        </div>
                    ` : `
                        <div class="booking-notes-section">
                            <span class="booking-notes-label">ADDITIONAL NOTES</span>
                            <p class="booking-notes-text no-notes">No additional notes provided</p>
                        </div>
                    `}
                    
                    <div class="booking-card-actions">
                        <button class="cancel-booking-btn" onclick="window.BookingCard.cancelBooking('${escapeHtml(booking.id)}', '${escapeHtml(booking.userId)}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                            Cancel Booking
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        containerElement.innerHTML = cardHTML;
    }
    
    // Render "No Booking" state
    function renderNoBookingState(containerElement) {
        if (!containerElement) return;
        
        const noBookingHTML = `
            <div class="no-booking-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="no-booking-icon">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h4>No Active Booking</h4>
                <p>You don't have any active bookings at the moment.</p>
                <button class="create-booking-btn" onclick="document.querySelector('[data-tab=\\'calendar-booking\\']').click();">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Create New Booking
                </button>
            </div>
        `;
        
        containerElement.innerHTML = noBookingHTML;
    }
    
    // Cancel booking handler
    function cancelBooking(bookingId, userId) {
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }
        
        try {
            // Use the UTC booking system to clear
            if (window.ActiveBookingSystem && window.ActiveBookingSystem.clearActiveBooking) {
                window.ActiveBookingSystem.clearActiveBooking(userId);
            }
            
            // Also clear from legacy system
            const bookingsKey = 'bignor_park_bookings';
            const stored = localStorage.getItem(bookingsKey);
            if (stored) {
                const bookings = JSON.parse(stored);
                const filtered = bookings.filter(b => b.id !== bookingId);
                localStorage.setItem(bookingsKey, JSON.stringify(filtered));
            }
            
            // Refresh the display
            const container = document.getElementById('activeBookingContent');
            if (container) {
                renderNoBookingState(container);
            }
            
            // Update dropdown if function exists
            if (window.UserDropdown && window.UserDropdown.updateBookingStatus) {
                window.UserDropdown.updateBookingStatus();
            }
            
            // Show success message
            alert('Booking cancelled successfully');
            
            // Reload the page to refresh all displays
            setTimeout(() => {
                window.location.reload();
            }, 500);
            
        } catch (error) {
            console.error('[BookingCard] Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    }
    
    // Export functions to window for global access
    window.BookingCard = {
        renderBookingCard: renderBookingCard,
        renderNoBookingState: renderNoBookingState,
        formatBookingDate: formatBookingDate,
        formatShortDate: formatShortDate,
        calculateTimeRemaining: calculateTimeRemaining,
        getBookingStatus: getBookingStatus,
        cancelBooking: cancelBooking
    };
    
    console.log('[BookingCard] Component initialized');
    
})();




