// Booking System JavaScript - Calendar Based
import { LAKES, getLake, getLakeName, getLakeCapacity } from './lakes.js';

let currentUser = null;
let bookings = [];
let selectedDate = null;
let selectedLake = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Bookings Store integration (for persistence)
// Note: If bookingsStore module is available, it will be used
let useBookingsStore = false;
let bookingsStoreModule = null;

// Try to import bookingsStore if available
try {
    // Dynamic import would go here when module is properly integrated
    // For now, we'll use localStorage directly but maintain compatibility
    useBookingsStore = typeof Storage !== 'undefined';
} catch (e) {
    console.log('BookingsStore module not available, using legacy storage');
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in (including temporary data for logout scenario)
    const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
    if (!currentUserData) {
        alert('Please log in to access the booking system.');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize booking system with persisted data
    initializeBookingSystem();
    
    loadUserData();
    loadBookingsFromStorage();
    checkBookingRestriction();
    loadActiveBooking();
    initializeCalendar();
    setupEventListeners();
    initializeDateInputs();
    updateBookingStatuses();
    
    // Update booking statuses every minute
    setInterval(updateBookingStatuses, 60000);
    
    // Update availability display every 30 seconds if a date is selected
    setInterval(function() {
        if (selectedDate) {
            loadBookingsFromStorage();
            updateLakeAvailability(formatDate(selectedDate));
        }
    }, 30000);
    
    // Refresh data when page becomes visible (but don't reset selections)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Only update restrictions, don't reload everything
            loadBookingsFromStorage();
            checkBookingRestriction();
            loadActiveBooking();
            
            // Update lake availability if a date is selected
            if (selectedDate) {
                updateLakeAvailability(formatDate(selectedDate));
            }
        }
    });
    
    // Add test functions to window for manual testing
    window.testBookingSystem = testBookingSystem;
    window.restoreBookingToUpcoming = restoreBookingToUpcoming;
    
    // Call test after everything is loaded
    setTimeout(testBookingSystem, 1000);
});

// Load user data from localStorage
function loadUserData() {
    console.log('loadUserData called');
    let currentUserData = localStorage.getItem('currentUser');
    
    // If no currentUser, check for tempUserData (for logout scenario)
    if (!currentUserData) {
        currentUserData = localStorage.getItem('tempUserData');
        console.log('No currentUser, checking tempUserData:', currentUserData);
    }
    
    console.log('currentUserData from localStorage:', currentUserData);
    
    if (currentUserData) {
        try {
            // Try to parse as JSON first (new format)
            currentUser = JSON.parse(currentUserData);
            console.log('currentUser parsed from JSON:', currentUser);
        } catch (e) {
            // If that fails, try the old format (email string)
            const userEmail = currentUserData;
            console.log('Trying old format with email:', userEmail);
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.log('users from localStorage:', users);
            currentUser = users.find(user => user.email === userEmail);
            console.log('currentUser found from users array:', currentUser);
        }
        
        if (currentUser) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = currentUser.fullName || 'Member';
            }
            console.log('User loaded successfully:', currentUser);
        } else {
            console.log('No user found');
        }
    } else {
        console.log('No currentUser in localStorage');
    }
}

// Reload all booking data
function reloadBookings() {
    console.log('reloadBookings called');
    console.log('Before reload - selectedDate:', selectedDate, 'selectedLake:', selectedLake);
    
    // Store current selections before reloading
    const currentSelectedDate = selectedDate;
    const currentSelectedLake = selectedLake;
    
    loadBookingsFromStorage();
    checkBookingRestriction();
    updateCalendar();
    
    // Restore selections after calendar update
    if (currentSelectedDate) {
        selectedDate = currentSelectedDate;
        console.log('Restored selectedDate:', selectedDate);
        // Update the display elements
        const selectedDateDisplay = document.getElementById('selectedDateDisplay');
        const confirmDateDisplay = document.getElementById('confirmDateDisplay');
        if (selectedDateDisplay) selectedDateDisplay.textContent = formatDateDisplay(currentSelectedDate);
        if (confirmDateDisplay) confirmDateDisplay.textContent = formatDateDisplay(currentSelectedDate);
        
        // Show lake availability section if date was selected
        const lakeAvailability = document.getElementById('lakeAvailability');
        if (lakeAvailability) {
            lakeAvailability.style.display = 'block';
            updateLakeAvailability(formatDate(currentSelectedDate));
        }
    }
    
    if (currentSelectedLake) {
        selectedLake = currentSelectedLake;
        console.log('Restored selectedLake:', selectedLake);
        // Update the lake display
        const selectedLakeDisplay = document.getElementById('selectedLakeDisplay');
        if (selectedLakeDisplay) {
            selectedLakeDisplay.textContent = getLakeName(currentSelectedLake);
        }
        
        // Show booking form if lake was selected
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.style.display = 'block';
        }
    }
    
    console.log('After reload - selectedDate:', selectedDate, 'selectedLake:', selectedLake);
}

// Storage key - must match bookingsContext.js
const STORAGE_KEY = 'bignor_park_bookings';

// Load bookings from localStorage
function loadBookingsFromStorage() {
    try {
        // Try new storage key first
        let storedBookings = localStorage.getItem(STORAGE_KEY);

        // Fall back to old key for backwards compatibility
        if (!storedBookings) {
            storedBookings = localStorage.getItem('bookings');
            // If found in old key, migrate to new key
            if (storedBookings) {
                localStorage.setItem(STORAGE_KEY, storedBookings);
                localStorage.removeItem('bookings');
                console.log('Migrated bookings from old storage key');
            }
        }

        console.log('Stored bookings from localStorage:', storedBookings);
        bookings = storedBookings ? JSON.parse(storedBookings) : [];
        console.log('Loaded bookings array:', bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = [];
    }
}

// Save bookings to localStorage
function saveBookingsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch (error) {
        console.error('Error saving bookings:', error);
    }
}

// Initialize calendar
function initializeCalendar() {
    setupMonthSelector();
    updateCalendar();
}

// Setup month selector
function setupMonthSelector() {
    const monthButtons = document.querySelectorAll('.month-btn');
    monthButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            monthButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            currentMonth = parseInt(this.dataset.month);
            updateCalendar();
        });
    });
}

// Update calendar display
function updateCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        if (currentDate.getMonth() !== currentMonth) {
            dayElement.classList.add('other-month');
        } else {
            const dateString = formatDate(currentDate);
            const isAvailable = checkDateAvailability(currentDate);
            const isToday = currentDate.getTime() === today.getTime();
            
            if (isToday) {
                dayElement.classList.add('today');
            }
            
            if (isAvailable) {
                dayElement.classList.add('available');
                dayElement.addEventListener('click', () => selectDate(currentDate));
            } else {
                dayElement.classList.add('unavailable');
            }
        }
        
        dayElement.textContent = currentDate.getDate();
        calendarDays.appendChild(dayElement);
    }
}

// Check if a date is available for booking
function checkDateAvailability(date) {
    const dateString = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Past dates are not available
    if (date < today) {
        return false;
    }
    
    // Check if there are any bookings for this date
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    // Calculate total capacity for all lakes
    const hasAvailability = LAKES.some(lake => {
        const lakeBookings = dateBookings.filter(b => b.lake === lake.slug).length;
        return lakeBookings < lake.capacity;
    });
    
    return hasAvailability;
}

// Select a date
function selectDate(date) {
    console.log('selectDate called with:', date);
    console.log('Date type:', typeof date);
    console.log('Date value:', date);
    
    selectedDate = new Date(date); // Ensure it's a proper Date object
    const dateString = formatDate(selectedDate);
    console.log('selectedDate set to:', selectedDate);
    console.log('dateString:', dateString);
    
    // Update selected date display
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const confirmDateDisplay = document.getElementById('confirmDateDisplay');
    if (selectedDateDisplay) {
        selectedDateDisplay.textContent = formatDateDisplay(selectedDate);
        console.log('Updated selectedDateDisplay:', selectedDateDisplay.textContent);
    }
    if (confirmDateDisplay) {
        confirmDateDisplay.textContent = formatDateDisplay(selectedDate);
        console.log('Updated confirmDateDisplay:', confirmDateDisplay.textContent);
    }
    
    // Show lake availability section
    const lakeAvailability = document.getElementById('lakeAvailability');
    if (lakeAvailability) {
        lakeAvailability.style.display = 'block';
        console.log('Showed lake availability section');
    }
    
    // Update lake availability
    updateLakeAvailability(dateString);
    
    // Scroll to lake availability section
    if (lakeAvailability) {
        lakeAvailability.scrollIntoView({ behavior: 'smooth' });
    }
    
    console.log('selectDate completed. selectedDate:', selectedDate, 'selectedLake:', selectedLake);
    
    // Store in localStorage to persist across page reloads
    if (selectedDate) {
        localStorage.setItem('tempSelectedDate', selectedDate.toISOString());
    }
}

// Update lake availability for selected date
function updateLakeAvailability(dateString) {
    console.log('updateLakeAvailability called for date:', dateString);
    console.log('Total bookings array:', bookings);
    
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    console.log('Bookings for this date:', dateBookings);
    
    // Update each lake dynamically
    LAKES.forEach(lake => {
        // Check bookings for both new slug and legacy slug
        const lakeBookings = dateBookings.filter(b =>
            b.lake === lake.slug || b.lake === lake.legacySlug
        ).length;
        console.log(`${lake.name} bookings:`, lakeBookings);

        // Use legacy slug for DOM element IDs
        const legacySlug = lake.legacySlug || lake.slug;
        const statusEl = document.getElementById(`${legacySlug}Status`);
        const slotsEl = document.getElementById(`${legacySlug}Slots`);
        const capitalizedSlug = legacySlug.charAt(0).toUpperCase() + legacySlug.slice(1);
        const btnEl = document.getElementById(`book${capitalizedSlug}Btn`);

        if (!statusEl || !slotsEl || !btnEl) {
            console.warn(`Elements not found for lake: ${lake.slug} (legacy: ${legacySlug})`);
            return;
        }
        
        const availableSlots = lake.capacity - lakeBookings;
        
        if (availableSlots > 0) {
            statusEl.textContent = 'Available';
            statusEl.className = 'availability-status available';
            slotsEl.textContent = `${availableSlots} of ${lake.capacity} spots available`;
            btnEl.disabled = false;
            btnEl.textContent = `Book ${lake.name}`;
        } else {
            statusEl.textContent = 'Full';
            statusEl.className = 'availability-status unavailable';
            slotsEl.textContent = `0 of ${lake.capacity} spots available`;
            btnEl.disabled = true;
            btnEl.textContent = 'Fully Booked';
        }
    });
}

// Book a lake
function bookLake(lake) {
    console.log('bookLake called with:', lake);
    console.log('selectedDate:', selectedDate);
    console.log('selectedDate type:', typeof selectedDate);
    
    if (!selectedDate) {
        console.log('No selectedDate, returning');
        // Try to restore from localStorage
        const tempDate = localStorage.getItem('tempSelectedDate');
        if (tempDate) {
            selectedDate = new Date(tempDate);
            console.log('Restored selectedDate from localStorage:', selectedDate);
        } else {
            console.log('No tempSelectedDate in localStorage either');
            return;
        }
    }
    
    selectedLake = lake;
    console.log('selectedLake set to:', selectedLake);
    
    // Store in localStorage
    localStorage.setItem('tempSelectedLake', selectedLake);
    
    const lakeName = getLakeName(lake);
    
    // Update display
    const selectedLakeDisplay = document.getElementById('selectedLakeDisplay');
    if (selectedLakeDisplay) {
        selectedLakeDisplay.textContent = lakeName;
        console.log('Updated selectedLakeDisplay:', selectedLakeDisplay.textContent);
    }
    
    // Show booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.style.display = 'block';
        bookingForm.scrollIntoView({ behavior: 'smooth' });
        console.log('Showed booking form');
    }
    
    console.log('bookLake completed. selectedDate:', selectedDate, 'selectedLake:', selectedLake);
}

// Confirm booking
function confirmBooking() {
    console.log('confirmBooking called');
    console.log('selectedDate:', selectedDate);
    console.log('selectedLake:', selectedLake);
    console.log('currentUser:', currentUser);
    
    // Try to restore from localStorage if values are missing
    if (!selectedDate) {
        const tempDate = localStorage.getItem('tempSelectedDate');
        if (tempDate) {
            selectedDate = new Date(tempDate);
            console.log('Restored selectedDate from localStorage:', selectedDate);
        }
    }
    
    if (!selectedLake) {
        const tempLake = localStorage.getItem('tempSelectedLake');
        if (tempLake) {
            selectedLake = tempLake;
            console.log('Restored selectedLake from localStorage:', selectedLake);
        }
    }
    
    if (!selectedDate || !selectedLake) {
        alert('Please select a date and lake before confirming your booking.');
        return;
    }
    
    if (!currentUser) {
        alert('User session not found. Please log in again.');
        window.location.href = 'index.html';
        return;
    }
    
    const notes = document.getElementById('bookingNotes').value;
    const dateString = formatDate(selectedDate);
    
    // Check if user already has a booking restriction
    console.log('Checking booking restriction...');
    if (checkBookingRestriction()) {
        alert('You have an active booking restriction. Please wait before making another booking.');
        return;
    }
    console.log('No booking restriction found');
    
    // Check if the selected lake is still available
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    const lakeBookings = dateBookings.filter(b => b.lake === selectedLake).length;
    const maxSlots = getLakeCapacity(selectedLake);
    
    if (lakeBookings >= maxSlots) {
        alert('Sorry, this lake is no longer available for the selected date. Please choose another date or lake.');
        return;
    }
    
    // Create new booking
    const newBooking = {
        id: Date.now().toString(),
        userId: currentUser.email,
        userName: currentUser.fullName,
        lake: selectedLake,
        lakeName: getLakeName(selectedLake),
        date: dateString,
        notes: notes,
        status: 'upcoming',
        createdAt: new Date().toISOString()
    };
    
    console.log('Created new booking:', newBooking);
    
    try {
        // Add to bookings array
        bookings.push(newBooking);
        console.log('Added booking to array. Total bookings:', bookings.length);
        
        // Save to localStorage
        saveBookingsToStorage();
        console.log('Saved bookings to localStorage');
        
        // Set booking restriction AFTER successful booking
        setLastBookingTime();
        console.log('Set last booking time');
        
        // Update restrictions and active booking display
        checkBookingRestriction();
        loadActiveBooking();
        
        // Update lake availability display to reflect the new booking
        if (selectedDate) {
            updateLakeAvailability(dateString);
        }
        
        // Reset form
        resetBooking();
        
        // Show success message
        alert('Booking confirmed successfully! You can now make another booking in 12 hours.');
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        alert('There was an error confirming your booking. Please try again.');
    }
}

// Reset booking process
function resetBooking() {
    selectedDate = null;
    selectedLake = null;
    
    // Clear localStorage
    localStorage.removeItem('tempSelectedDate');
    localStorage.removeItem('tempSelectedLake');
    
    const lakeAvailability = document.getElementById('lakeAvailability');
    const bookingForm = document.getElementById('bookingForm');
    const bookingNotes = document.getElementById('bookingNotes');
    
    if (lakeAvailability) lakeAvailability.style.display = 'none';
    if (bookingForm) bookingForm.style.display = 'none';
    if (bookingNotes) bookingNotes.value = '';
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.dataset.tab;
            
            // Remove active class from all tabs and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Lake booking buttons - attach event listeners using legacy slugs
    LAKES.forEach(lake => {
        const legacySlug = lake.legacySlug || lake.slug;
        const capitalizedSlug = legacySlug.charAt(0).toUpperCase() + legacySlug.slice(1);
        const btnEl = document.getElementById(`book${capitalizedSlug}Btn`);

        if (btnEl) {
            btnEl.addEventListener('click', () => bookLake(legacySlug));
            console.log(`Attached click listener to book${capitalizedSlug}Btn`);
        } else {
            console.warn(`Button not found: book${capitalizedSlug}Btn`);
        }
    });

    // Confirm and Cancel booking buttons
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const cancelBookingBtn = document.getElementById('cancelBookingBtn');

    if (confirmBookingBtn) {
        confirmBookingBtn.addEventListener('click', confirmBooking);
    }

    if (cancelBookingBtn) {
        cancelBookingBtn.addEventListener('click', resetBooking);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Back to Dashboard button
    const backToDashboardBtn = document.getElementById('backToDashboardBtn');
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    // Switch to booking tab buttons
    const switchToBookingTabBtns = document.querySelectorAll('.switch-to-booking-tab');
    switchToBookingTabBtns.forEach(btn => {
        btn.addEventListener('click', switchToBookingTab);
    });

    console.log('Event listeners setup complete');
}

// Check booking restriction
function checkBookingRestriction() {
    if (!currentUser) return false;
    
    const lastBookingTime = getLastBookingTime();
    if (!lastBookingTime) return false;
    
    const now = new Date();
    const timeDiff = now - lastBookingTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff < 12) {
        const hoursRemaining = Math.floor(12 - hoursDiff);
        const minutesRemaining = Math.floor((12 - hoursDiff - hoursRemaining) * 60);
        
        const restrictionNotice = document.getElementById('restrictionNotice');
        const restrictionMessage = document.getElementById('restrictionMessage');
        
        if (restrictionNotice && restrictionMessage) {
            restrictionMessage.textContent = `You can only make one booking every 12 hours. Please wait ${hoursRemaining} hours and ${minutesRemaining} minutes before making another booking.`;
            restrictionNotice.style.display = 'flex';
        }
        
        return true;
    }
    
    // Hide restriction notice if no restriction
    const restrictionNotice = document.getElementById('restrictionNotice');
    if (restrictionNotice) {
        restrictionNotice.style.display = 'none';
    }
    
    return false;
}

// Get last booking time for current user
function getLastBookingTime() {
    if (!currentUser) return null;
    const time = localStorage.getItem(`lastBookingTime_${currentUser.email}`);
    return time ? new Date(parseInt(time)) : null;
}

// Set last booking time for current user
function setLastBookingTime() {
    if (!currentUser) return;
    localStorage.setItem(`lastBookingTime_${currentUser.email}`, Date.now().toString());
}

// Load active booking for display
function loadActiveBooking() {
    console.log('loadActiveBooking called');
    console.log('currentUser:', currentUser);
    console.log('bookings array:', bookings);
    
    const activeBookingContent = document.getElementById('activeBookingContent');
    if (!activeBookingContent) {
        console.log('activeBookingContent element not found');
        return;
    }
    
    if (!currentUser) {
        console.log('No currentUser, showing no booking message');
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                </svg>
                <h4>No Active Booking</h4>
                <p>Please log in to view your active bookings.</p>
            </div>
        `;
        return;
    }
    
    // Find the user's active booking
    
    const userBookings = bookings.filter(booking => booking.userId === currentUser.email);
    const activeBooking = userBookings.find(booking => booking.status === 'upcoming');
    
    console.log('User bookings:', userBookings);
    console.log('Active booking:', activeBooking);
    
    if (!activeBooking) {
        console.log('No active booking found');
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                </svg>
                <h4>No Active Booking</h4>
                <p>You don't have any active bookings at the moment.</p>
                <p>Go to the Calendar Booking tab to make a new booking.</p>
            </div>
        `;
        return;
    }
    
    console.log('Rendering active booking:', activeBooking);
    
    // Fix date parsing to avoid timezone issues
    const bookingDate = new Date(activeBooking.date + 'T00:00:00');
    const createdDate = new Date(activeBooking.createdAt);
    
    activeBookingContent.innerHTML = `
        <div class="active-booking-card">
            <div class="booking-header">
                <img src="carp-logo.png" alt="Carp Logo" class="booking-logo">
                <h4>${activeBooking.lakeName}</h4>
            </div>
            
            <div class="booking-details-grid">
                <div class="booking-detail">
                    <div class="booking-detail-label">Date</div>
                    <div class="booking-detail-value">${formatDateDisplay(bookingDate)}</div>
                </div>
                <div class="booking-detail">
                    <div class="booking-detail-label">Lake</div>
                    <div class="booking-detail-value">${activeBooking.lakeName}</div>
                </div>
                <div class="booking-detail">
                    <div class="booking-detail-label">Status</div>
                    <div class="booking-detail-value">
                        <span class="status-badge upcoming">Upcoming</span>
                    </div>
                </div>
                <div class="booking-detail">
                    <div class="booking-detail-label">Booked On</div>
                    <div class="booking-detail-value">${formatDateDisplay(createdDate)}</div>
                </div>
            </div>
            
            <div class="booking-notes">
                <h5>Additional Notes</h5>
                <p class="${activeBooking.notes ? '' : 'no-notes'}">
                    ${activeBooking.notes || 'No additional notes provided'}
                </p>
            </div>
            
            <div class="active-booking-actions">
                <button class="cancel-active-booking-btn" onclick="cancelActiveBooking('${activeBooking.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"></path>
                    </svg>
                    Cancel Booking
                </button>
            </div>
        </div>
    `;
}

// Cancel active booking
function cancelActiveBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? This will lift your booking restriction and allow you to make a new booking immediately.')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            saveBookingsToStorage();
            
            // Reset the booking restriction when cancelling
            if (currentUser) {
                localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
            }
            
            // Update restrictions and active booking display
            checkBookingRestriction();
            loadActiveBooking();
            
            // Update lake availability display to reflect the cancelled booking
            if (selectedDate) {
                updateLakeAvailability(formatDate(selectedDate));
            }
            
            alert('Booking cancelled successfully. You can now make a new booking.');
        }
    }
}





// Cancel booking
function cancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            saveBookingsToStorage();
            
            // Reset the booking restriction when cancelling
            if (currentUser) {
                localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
            }
            
            // Update restrictions without resetting selections
            checkBookingRestriction();
            alert('Booking cancelled successfully. You can now make a new booking.');
        }
    }
}

// Update booking statuses
function updateBookingStatuses() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    let updated = false;
    
    bookings.forEach(booking => {
        // Fix date parsing to avoid timezone issues
        const bookingDate = new Date(booking.date + 'T00:00:00');
        const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate()); // Start of booking day
        
        // Only mark as completed if the booking date is before today (not today)
        if (booking.status === 'upcoming' && bookingDay < today) {
            booking.status = 'completed';
            updated = true;
            console.log(`Marking booking ${booking.id} as completed. Booking date: ${booking.date}, Today: ${today.toISOString().split('T')[0]}`);
        }
    });
    
    if (updated) {
        saveBookingsToStorage();
        console.log('Updated booking statuses and saved to storage');
    }
}

// Format date for storage
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Format date for display
function formatDateDisplay(date) {
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Logout function
function logout() {
    // Store current user data temporarily so it persists during logout
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
        localStorage.setItem('tempUserData', currentUserData);
    }
    
    // Remove currentUser but keep tempUserData for display
    localStorage.removeItem('currentUser');
    
    // Redirect to login page
    window.location.href = 'index.html';
} 

// Test function to check booking system state
function testBookingSystem() {
    console.log('=== BOOKING SYSTEM DEBUG ===');
    console.log('currentUser:', currentUser);
    console.log('bookings array:', bookings);
    console.log('selectedDate:', selectedDate);
    console.log('selectedLake:', selectedLake);
    
    if (currentUser) {
        const userBookings = bookings.filter(booking => booking.userId === currentUser.email);
        console.log('User bookings:', userBookings);
        const activeBooking = userBookings.find(booking => booking.status === 'upcoming');
        console.log('Active booking:', activeBooking);
    }
    
    // Check localStorage
    console.log('localStorage currentUser:', localStorage.getItem('currentUser'));
    console.log('localStorage bookings:', localStorage.getItem('bookings'));
    console.log('=== END DEBUG ===');
}

// Function to restore a booking to upcoming status (for testing)
function restoreBookingToUpcoming(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
        booking.status = 'upcoming';
        saveBookingsToStorage();
        loadActiveBooking();
        console.log(`Restored booking ${bookingId} to upcoming status`);
    }
}

// Switch to booking tab function
function switchToBookingTab() {
    // Get all tab buttons and panes
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Remove active class from all
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Activate calendar booking tab
    const calendarBtn = document.querySelector('.tab-btn[data-tab="calendar-booking"]');
    const calendarPane = document.getElementById('calendar-booking');
    
    if (calendarBtn) calendarBtn.classList.add('active');
    if (calendarPane) calendarPane.classList.add('active');
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize booking system - called on page mount/login
function initializeBookingSystem() {
    console.log('Initializing booking system...');
    
    // Load persisted bookings from storage
    loadBookingsFromStorage();
    
    // Set selectedDate to today if not already chosen
    if (!selectedDate) {
        selectedDate = new Date();
        selectedDate.setHours(0, 0, 0, 0); // Reset to start of day
        console.log('Selected date initialized to today:', formatDate(selectedDate));
        
        // Update calendar to show current month
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
    }
    
    // Get active bookings for the selected date
    const activeBookings = activeBookingsForDate(selectedDate);
    console.log(`Active bookings for ${formatDate(selectedDate)}:`, activeBookings);
    
    // Clear expired bookings
    clearExpiredBookings();
}

// Get active bookings for a specific date
function activeBookingsForDate(date) {
    if (!date) return [];
    
    const targetDateStr = formatDate(date);
    
    // Filter bookings that are active on the target date
    return bookings.filter(booking => {
        if (!booking || !booking.date) return false;
        
        // Check if booking date matches target date
        return booking.date === targetDateStr;
    });
}

// Format date for display (Saturday 11 October 2025)
function formatDateLong(timestamp) {
    if (!timestamp) return '';
    
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    
    // Use en-GB locale for proper date formatting
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

// Clear expired bookings from storage
function clearExpiredBookings() {
    const now = Date.now();
    const originalCount = bookings.length;

    // Filter out bookings that have ended
    bookings = bookings.filter(booking => {
        if (!booking.end) return true; // Keep if no end time
        return booking.end > now;
    });

    if (bookings.length < originalCount) {
        console.log(`Cleared ${originalCount - bookings.length} expired booking(s)`);
        saveBookingsToStorage();
    }
}

// Initialize date inputs to today's date
function initializeDateInputs() {
    // Find any date inputs in the page
    const dateInput = document.getElementById('booking-date');
    
    // Set to today's date if empty
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
        console.log('Date input initialized to today');
    }
    
    // Also initialize any other date inputs on the page
    const allDateInputs = document.querySelectorAll('input[type="date"]');
    allDateInputs.forEach(input => {
        if (!input.value) {
            input.valueAsDate = new Date();
        }
    });
}

// Expose functions to global scope for HTML onclick handlers
window.confirmBooking = confirmBooking;
window.resetBooking = resetBooking;
window.logout = logout;
window.cancelActiveBooking = cancelActiveBooking;
window.cancelBooking = cancelBooking;
window.testBookingSystem = testBookingSystem;
window.restoreBookingToUpcoming = restoreBookingToUpcoming;
window.togglePassword = togglePassword;
window.switchToBookingTab = switchToBookingTab;
window.activeBookingsForDate = activeBookingsForDate;
window.formatDateLong = formatDateLong;
window.clearExpiredBookings = clearExpiredBookings;

// Toggle password visibility function
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(`${fieldId}-eye`);
    
    if (field.type === 'password') {
        field.type = 'text';
        if (eyeIcon) {
            eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        }
    } else {
        field.type = 'password';
        if (eyeIcon) {
            eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
    }
}
 