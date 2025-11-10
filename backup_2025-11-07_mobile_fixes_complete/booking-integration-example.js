/**
 * Example integration of new booking system
 * This shows how to update booking.js to use the new utilities
 */

import { 
    addBooking, 
    generateUUID, 
    loadBookings, 
    bookingsForDate,
    availableSpots,
    updateBookingStatuses,
    migrateAllBookings 
} from './bookings-utils.js';
import { normalizeLakeSlug, getLakeName, getLakeCapacity } from './lakes.js';

// ========================================
// INITIALIZATION
// ========================================

// Run migration on page load (safe to call multiple times)
document.addEventListener('DOMContentLoaded', function() {
    migrateAllBookings();
    
    // Continue with normal initialization
    loadUserData();
    initializeBookingSystem();
});

// ========================================
// EXAMPLE: CREATE NEW BOOKING
// ========================================

function createNewBooking() {
    // Get lake from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const rawLakeSlug = urlParams.get('lake');
    const lakeSlug = normalizeLakeSlug(rawLakeSlug); // Converts 'bignor' -> 'bignor-main'
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Create booking for selected date
    const selectedDate = new Date(selectedDateInput.value);
    const start = selectedDate.setHours(12, 0, 0, 0); // Noon start
    const end = start + 24 * 60 * 60 * 1000; // 24 hours later
    
    const booking = {
        id: generateUUID(),
        lakeSlug,
        user: {
            id: currentUser.email,
            name: currentUser.fullName,
            avatar: currentUser.avatar
        },
        start,
        end,
        peg: selectedPeg, // Optional peg number
        notes: document.getElementById('bookingNotes').value,
        status: 'upcoming',
        createdAt: Date.now()
    };
    
    // Add the booking
    addBooking(booking);
    
    console.log('Booking created:', booking);
    alert(`Booking confirmed for ${getLakeName(lakeSlug)}!`);
}

// ========================================
// EXAMPLE: CHECK AVAILABILITY
// ========================================

function updateLakeAvailabilityDisplay(date) {
    const dateBookings = bookingsForDate(date);
    
    // Update for each lake
    const bignorAvailable = availableSpots('bignor-main', date);
    const woodAvailable = availableSpots('wood-pool', date);
    
    // Update UI
    document.getElementById('bignorSlots').textContent = 
        `${bignorAvailable} of 3 spots available`;
    document.getElementById('woodSlots').textContent = 
        `${woodAvailable} of 2 spots available`;
    
    // Enable/disable booking buttons
    document.getElementById('bookBignorBtn').disabled = bignorAvailable === 0;
    document.getElementById('bookWoodBtn').disabled = woodAvailable === 0;
}

// ========================================
// EXAMPLE: LOAD USER'S BOOKINGS
// ========================================

function loadUserBookings() {
    import { userBookings, userActive } from './bookings-utils.js';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const userId = currentUser.email;
    
    // Get all user's bookings
    const allUserBookings = userBookings(userId);
    
    // Get user's active booking (if any)
    const activeBooking = userActive(userId);
    
    if (activeBooking) {
        displayActiveBooking(activeBooking);
    } else {
        displayNoActiveBooking();
    }
    
    // Display booking history
    displayBookingHistory(allUserBookings);
}

function displayActiveBooking(booking) {
    const lakeName = getLakeName(booking.lakeSlug);
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);
    
    const html = `
        <div class="active-booking-card">
            <h4>${lakeName}</h4>
            <p>Start: ${startDate.toLocaleString()}</p>
            <p>End: ${endDate.toLocaleString()}</p>
            ${booking.peg ? `<p>Peg: ${booking.peg}</p>` : ''}
            ${booking.notes ? `<p>Notes: ${booking.notes}</p>` : ''}
        </div>
    `;
    
    document.getElementById('activeBookingContent').innerHTML = html;
}

// ========================================
// EXAMPLE: UPDATE STATUSES
// ========================================

// Run periodically to mark completed bookings
setInterval(() => {
    updateBookingStatuses();
    
    // Reload display if needed
    const bookings = loadBookings();
    console.log('Updated booking statuses', bookings.length);
}, 60000); // Every minute

// ========================================
// EXAMPLE: CALENDAR DATE CLICK
// ========================================

function onDateSelected(date) {
    // Check availability for this date
    const bignorSlots = availableSpots('bignor-main', date);
    const woodSlots = availableSpots('wood-pool', date);
    
    console.log(`Date selected: ${date}`);
    console.log(`Bignor available: ${bignorSlots}`);
    console.log(`Wood Pool available: ${woodSlots}`);
    
    // Update UI
    updateLakeAvailabilityDisplay(date);
}

// ========================================
// EXAMPLE: LIVE FEED
// ========================================

function updateLiveFeed() {
    import { activeByLake } from './bookings-utils.js';
    
    const active = activeByLake();
    
    const liveFeedHtml = `
        <h3>Currently Fishing</h3>
        <div class="lake-section">
            <h4>Bignor Main Lake (${active['bignor-main'].length}/3)</h4>
            ${active['bignor-main'].map(b => `
                <div class="angler-card">
                    <span>${b.user.name}</span>
                    ${b.peg ? `<span>Peg ${b.peg}</span>` : ''}
                </div>
            `).join('')}
        </div>
        <div class="lake-section">
            <h4>Wood Pool (${active['wood-pool'].length}/2)</h4>
            ${active['wood-pool'].map(b => `
                <div class="angler-card">
                    <span>${b.user.name}</span>
                    ${b.peg ? `<span>Peg ${b.peg}</span>` : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    document.getElementById('liveFeedContainer').innerHTML = liveFeedHtml;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function displayNoActiveBooking() {
    document.getElementById('activeBookingContent').innerHTML = `
        <div class="no-active-booking">
            <p>No active booking at the moment</p>
        </div>
    `;
}

function displayBookingHistory(bookings) {
    const html = bookings.map(b => {
        const lakeName = getLakeName(b.lakeSlug);
        const date = new Date(b.start);
        return `
            <div class="booking-history-item ${b.status}">
                <span>${lakeName}</span>
                <span>${date.toLocaleDateString()}</span>
                <span class="status-badge ${b.status}">${b.status}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('bookingHistory').innerHTML = html;
}

// Export for use in HTML onclick handlers
window.createNewBooking = createNewBooking;
window.onDateSelected = onDateSelected;
window.updateLiveFeed = updateLiveFeed;




























