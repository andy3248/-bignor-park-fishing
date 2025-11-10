// Booking System JavaScript

// Initialize bookings from localStorage with proper error handling
let bookings = [];

// Load bookings safely from localStorage
function loadBookingsFromStorage() {
    try {
        const storedBookings = localStorage.getItem('bookings');
        bookings = storedBookings ? JSON.parse(storedBookings) : [];
        console.log('Loaded bookings:', bookings.length);
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
    }
}

// Save bookings safely to localStorage
function saveBookingsToStorage() {
    try {
        localStorage.setItem('bookings', JSON.stringify(bookings));
        console.log('Saved bookings:', bookings.length);
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

// Get user-specific last booking time
function getLastBookingTime() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return null;
    return localStorage.getItem(`lastBookingTime_${currentUser.id}`);
}

// Set user-specific last booking time
function setLastBookingTime() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    localStorage.setItem(`lastBookingTime_${currentUser.id}`, Date.now().toString());
}

// Reload bookings from localStorage on page load
function reloadBookings() {
    loadBookingsFromStorage();
    updateCounters();
    checkBookingRestriction();
    loadBookings();
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing booking system...');
    
    // Load bookings first
    loadBookingsFromStorage();
    
    // Update counters on page load
    reloadBookings();
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
        bookingDateInput.setAttribute('min', today);
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Update statuses on load
    updateBookingStatuses();
    
    // Update restriction timer and reload bookings every minute
    setInterval(() => {
        checkBookingRestriction();
        reloadBookings();
    }, 60000);
    
    console.log('Booking system initialized');
});

// Set tomorrow's date
function setTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
        bookingDateInput.value = tomorrow.toISOString().split('T')[0];
        checkAvailability();
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Tab functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(tabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
            
            // Load bookings when switching tabs
            if (tabId === 'current' || tabId === 'past') {
                loadBookings();
            }
        });
    });

    // Check availability when date or lake changes
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
        bookingDateInput.addEventListener('change', checkAvailability);
    }
    
    document.querySelectorAll('input[name="lake"]').forEach(input => {
        input.addEventListener('change', checkAvailability);
    });
    
    // Booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);
    }
}

// Check availability when date or lake changes
function checkAvailability() {
    const date = document.getElementById('bookingDate')?.value;
    const lake = document.querySelector('input[name="lake"]:checked')?.value;
    const availabilityStatus = document.getElementById('availabilityStatus');
    
    if (!date || !lake || !availabilityStatus) return;
    
    availabilityStatus.classList.add('show');
    
    const lakeName = lake === 'bignor-main' ? 'Bignor Main Lake' : 'Wood Pool';
    const maxSlots = lake === 'wood-pool' ? 2 : 3;
    
    // Count current bookings for this lake and date (all users)
    const bookedSlots = bookings.filter(b => 
        b.date === date && 
        b.lake === lake && 
        b.status === 'upcoming'
    ).length;
    
    const availableSlots = maxSlots - bookedSlots;
    
    if (availableSlots <= 0) {
        availabilityStatus.classList.add('unavailable');
        availabilityStatus.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>${lakeName} is fully booked for this date</span>
        `;
    } else {
        availabilityStatus.classList.remove('unavailable');
        availabilityStatus.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${lakeName} is Available</span>
            <span style="margin-left: 10px;">${availableSlots} of ${maxSlots} spots remaining</span>
        `;
    }
}

// Booking form submission handler
function handleBookingSubmission(e) {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to make a booking');
        window.location.href = 'index.html';
        return;
    }
    
    // Check 12-hour restriction for current user
    const lastBookingTime = getLastBookingTime();
    if (lastBookingTime) {
        const timeSinceLastBooking = Date.now() - parseInt(lastBookingTime);
        const twelveHours = 12 * 60 * 60 * 1000;
        
        if (timeSinceLastBooking < twelveHours) {
            const remainingTime = twelveHours - timeSinceLastBooking;
            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
            const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            alert(`You can only make one booking every 12 hours. Please wait ${hours} hours and ${minutes} minutes.`);
            return;
        }
    }
    
    const formData = new FormData(e.target);
    const date = formData.get('date');
    const lake = formData.get('lake');
    
    // Check if lake is available (considering all users)
    const maxSlots = lake === 'wood-pool' ? 2 : 3;
    const bookedSlots = bookings.filter(b => 
        b.date === date && 
        b.lake === lake && 
        b.status === 'upcoming'
    ).length;
    
    if (bookedSlots >= maxSlots) {
        alert('Sorry, this lake is fully booked for the selected date.');
        return;
    }
    
    const booking = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        lake: lake,
        date: date,
        notes: formData.get('notes'),
        status: 'upcoming',
        createdAt: new Date().toISOString()
    };
    
    // Save booking
    bookings.push(booking);
    saveBookingsToStorage();
    setLastBookingTime();
    
    // Update counters and reload bookings
    reloadBookings();
    
    // Show success message
    alert('Booking confirmed! You will receive a confirmation email shortly.');
    
    // Reset form
    e.target.reset();
    checkBookingRestriction();
    
    // Switch to current bookings tab
    const currentTab = document.querySelector('[data-tab="current"]');
    if (currentTab) {
        currentTab.click();
    }
}

// Check booking restriction
function checkBookingRestriction() {
    const submitBtn = document.querySelector('.submit-booking-btn');
    const restrictionNotice = document.querySelector('.restriction-notice');
    
    if (!submitBtn || !restrictionNotice) return;
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const lastBookingTime = getLastBookingTime();
    if (lastBookingTime) {
        const timeSinceLastBooking = Date.now() - parseInt(lastBookingTime);
        const twelveHours = 12 * 60 * 60 * 1000;
        
        if (timeSinceLastBooking < twelveHours) {
            const remainingTime = twelveHours - timeSinceLastBooking;
            const hours = Math.floor(remainingTime / (60 * 60 * 1000));
            const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Booking Restricted
            `;
            
            const noticeText = restrictionNotice.querySelector('p');
            if (noticeText) {
                noticeText.textContent = 
                    `You can only make one booking every 12 hours. Please wait ${hours} hours and ${minutes} minutes before making another booking. This ensures fair access for all members.`;
            }
            restrictionNotice.style.display = 'flex';
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Book Session
            `;
            restrictionNotice.style.display = 'none';
        }
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Book Session
        `;
        restrictionNotice.style.display = 'none';
    }
}

// Update counters
function updateCounters() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    const activeBookings = userBookings.filter(b => b.status === 'upcoming').length;
    const totalSessions = userBookings.length; // Count all bookings, not just completed
    
    // Update counters with error handling
    const elements = {
        activeBookings: document.getElementById('activeBookings'),
        activeCount: document.getElementById('activeCount'),
        totalSessions: document.getElementById('totalSessions'),
        totalCount: document.getElementById('totalCount')
    };
    
    if (elements.activeBookings) elements.activeBookings.textContent = activeBookings;
    if (elements.activeCount) elements.activeCount.textContent = activeBookings;
    if (elements.totalSessions) elements.totalSessions.textContent = totalSessions;
    if (elements.totalCount) elements.totalCount.textContent = totalSessions;
    
    console.log(`Updated counters - Active: ${activeBookings}, Total: ${totalSessions}`);
}

// Load bookings
function loadBookings() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const userBookings = bookings.filter(b => b.userId === currentUser.id);
    const currentBookings = userBookings.filter(b => b.status === 'upcoming');
    const pastBookings = userBookings.filter(b => b.status === 'completed');
    
    console.log(`Loading bookings for user ${currentUser.fullName} - Current: ${currentBookings.length}, Past: ${pastBookings.length}`);
    
    // Update current bookings
    const currentList = document.getElementById('currentBookingsList');
    if (currentList) {
        if (currentBookings.length === 0) {
            currentList.innerHTML = '<p style="text-align: center; color: #666;">No upcoming bookings</p>';
        } else {
            currentList.innerHTML = currentBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-info">
                        <h5>
                            🎣 ${booking.lake === 'bignor-main' ? 'Bignor Main Lake' : 'Wood Pool'}
                            <span class="status-badge upcoming">24hr session</span>
                        </h5>
                        <div class="booking-details">
                            <span>📅 ${formatDate(booking.date)}</span>
                            <span>🕐 12:00 PM - 12:00 PM (+1 day)</span>
                            <span>Booked: ${formatDate(booking.createdAt)}</span>
                        </div>
                        ${booking.notes ? `<p style="margin-top: 10px; color: #666;">Notes: ${booking.notes}</p>` : ''}
                    </div>
                    <div class="booking-actions">
                        <button class="modify-btn" onclick="modifyBooking('${booking.id}')">
                            ✏️ Modify
                        </button>
                        <button class="cancel-booking-btn" onclick="cancelBooking('${booking.id}')">
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update past bookings
    const pastList = document.getElementById('pastBookingsList');
    if (pastList) {
        if (pastBookings.length === 0) {
            pastList.innerHTML = '<p style="text-align: center; color: #666;">No past bookings</p>';
        } else {
            pastList.innerHTML = pastBookings.map(booking => `
                <div class="booking-card">
                    <div class="booking-info">
                        <h5>
                            🎣 ${booking.lake === 'bignor-main' ? 'Bignor Main Lake' : 'Wood Pool'}
                            <span class="status-badge completed">Completed</span>
                        </h5>
                        <div class="booking-details">
                            <span>📅 ${formatDate(booking.date)}</span>
                            <span>🕐 12:00 PM - 12:00 PM (+1 day)</span>
                        </div>
                    </div>
                    <div class="booking-actions">
                        <button class="modify-btn" onclick="bookAgain('${booking.id}')">
                            🔄 Book Again
                        </button>
                        <button class="rate-btn" onclick="rateSession('${booking.id}')">
                            ⭐ Rate Session
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Cancel booking
function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        bookings = bookings.filter(b => b.id !== bookingId);
        saveBookingsToStorage();
        reloadBookings();
        alert('Booking cancelled successfully');
    }
}

// Modify booking
function modifyBooking(bookingId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        // Switch to new booking tab
        const newBookingTab = document.querySelector('[data-tab="new-booking"]');
        if (newBookingTab) {
            newBookingTab.click();
        }
        
        // Fill form with existing data
        const lakeInput = document.querySelector(`input[name="lake"][value="${booking.lake}"]`);
        if (lakeInput) lakeInput.checked = true;
        
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) dateInput.value = booking.date;
        
        const notesTextarea = document.querySelector('textarea[name="notes"]');
        if (notesTextarea) notesTextarea.value = booking.notes || '';
        
        // Remove old booking
        bookings = bookings.filter(b => b.id !== bookingId);
        saveBookingsToStorage();
        
        // Remove last booking time restriction for modification
        localStorage.removeItem(`lastBookingTime_${currentUser.id}`);
        checkBookingRestriction();
    }
}

// Book again
function bookAgain(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        // Switch to new booking tab
        const newBookingTab = document.querySelector('[data-tab="new-booking"]');
        if (newBookingTab) {
            newBookingTab.click();
        }
        
        // Fill form with same lake
        const lakeInput = document.querySelector(`input[name="lake"][value="${booking.lake}"]`);
        if (lakeInput) lakeInput.checked = true;
    }
}

// Rate session
function rateSession(bookingId) {
    const rating = prompt('Rate your fishing session (1-5 stars):');
    if (rating && rating >= 1 && rating <= 5) {
        alert(`Thank you for rating your session ${rating} stars!`);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Reset form
function resetForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) bookingForm.reset();
    
    const availabilityStatus = document.getElementById('availabilityStatus');
    if (availabilityStatus) availabilityStatus.classList.remove('show');
}

// Check and update booking statuses (move past bookings to completed)
function updateBookingStatuses() {
    const today = new Date().toISOString().split('T')[0];
    let updated = false;
    
    bookings.forEach(booking => {
        if (booking.status === 'upcoming' && booking.date < today) {
            booking.status = 'completed';
            updated = true;
        }
    });
    
    if (updated) {
        saveBookingsToStorage();
        reloadBookings();
    }
} 