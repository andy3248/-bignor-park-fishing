// Booking System JavaScript - Standalone (no modules)
// Note: Requires lakes-standalone.js to be loaded first

let currentUser = null;
let bookings = [];
let selectedDate = null;
let selectedLake = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const STORAGE_KEY = 'bignor_park_bookings';

console.log('[Booking] Script loading...');

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Booking] DOM loaded, initializing...');

    // Check if user is logged in
    const currentUserData = localStorage.getItem('currentUser') || localStorage.getItem('tempUserData');
    if (!currentUserData) {
        alert('Please log in to access the booking system.');
        window.location.href = 'index.html';
        return;
    }

    // Initialize booking system
    initializeBookingSystem();
    loadUserData();
    loadBookingsFromStorage();
    checkBookingRestriction();
    loadActiveBooking();
    initializeCalendar();
    setupEventListeners();
    initializeDateInputs();
    updateBookingStatuses();
    restoreToggleState();

    // Update booking statuses every minute
    setInterval(updateBookingStatuses, 60000);

    // Update availability every 30 seconds if date selected
    setInterval(function() {
        if (selectedDate) {
            loadBookingsFromStorage();
            updateLakeAvailability(formatDate(selectedDate));
        }
    }, 30000);

    console.log('[Booking] Initialization complete');
});

// Load user data
function loadUserData() {
    console.log('[Booking] Loading user data...');
    let currentUserData = localStorage.getItem('currentUser');
    
    if (!currentUserData) {
        currentUserData = localStorage.getItem('tempUserData');
    }
    
    if (currentUserData) {
        try {
            currentUser = JSON.parse(currentUserData);
        } catch (e) {
            const userEmail = currentUserData;
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            currentUser = users.find(user => user.email === userEmail);
        }
        
        if (currentUser) {
            const userNameDisplay = document.getElementById('userNameDisplay');
            if (userNameDisplay) {
                userNameDisplay.textContent = currentUser.fullName || 'Member';
            }
            console.log('[Booking] User loaded:', currentUser.email);
        }
    }
}

// Load bookings from localStorage
function loadBookingsFromStorage() {
    try {
        const storedBookings = localStorage.getItem(STORAGE_KEY);
        bookings = storedBookings ? JSON.parse(storedBookings) : [];
        console.log(`[Booking] Loaded ${bookings.length} bookings`);
    } catch (error) {
        console.error('[Booking] Error loading bookings:', error);
        bookings = [];
    }
}

// Save bookings to localStorage
function saveBookingsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
        console.log('[Booking] Bookings saved');
    } catch (error) {
        console.error('[Booking] Error saving bookings:', error);
    }
}

// Initialize calendar
function initializeCalendar() {
    // Set current month as active
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    
    // Update the active month button
    const monthButtons = document.querySelectorAll('.month-btn');
    monthButtons.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.month) === currentMonth) {
            btn.classList.add('active');
        }
    });
    
    setupMonthSelector();
    updateCalendar();
}

// Setup month selector
function setupMonthSelector() {
    const monthButtons = document.querySelectorAll('.month-btn');
    monthButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            monthButtons.forEach(b => b.classList.remove('active'));
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
            const isAvailable = checkDateAvailability(currentDate);
            const isToday = currentDate.getTime() === today.getTime();
            
            if (isToday) dayElement.classList.add('today');
            
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
    
    console.log('[Booking] Calendar updated');
}

// Check if date is available
function checkDateAvailability(date) {
    const dateString = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    return LAKES.some(lake => {
        const lakeBookings = dateBookings.filter(b => b.lake === lake.slug || b.lake === lake.legacySlug).length;
        return lakeBookings < lake.capacity;
    });
}

// Select a date
function selectDate(date) {
    console.log('[Booking] Date selected:', date);
    selectedDate = new Date(date);
    const dateString = formatDate(selectedDate);
    
    // Update display
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');
    const confirmDateDisplay = document.getElementById('confirmDateDisplay');
    if (selectedDateDisplay) {
        selectedDateDisplay.textContent = formatDateDisplay(selectedDate);
    }
    if (confirmDateDisplay) {
        confirmDateDisplay.textContent = formatDateDisplay(selectedDate);
    }
    
    // Show lake availability
    const lakeAvailability = document.getElementById('lakeAvailability');
    if (lakeAvailability) {
        lakeAvailability.style.display = 'block';
        lakeAvailability.scrollIntoView({ behavior: 'smooth' });
    }
    
    updateLakeAvailability(dateString);
    localStorage.setItem('tempSelectedDate', selectedDate.toISOString());
}

// Update lake availability
function updateLakeAvailability(dateString) {
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    LAKES.forEach(lake => {
        const lakeBookings = dateBookings.filter(b =>
            b.lake === lake.slug || b.lake === lake.legacySlug
        ).length;

        const legacySlug = lake.legacySlug || lake.slug;
        const statusEl = document.getElementById(`${legacySlug}Status`);
        const slotsEl = document.getElementById(`${legacySlug}Slots`);
        const capitalizedSlug = legacySlug.charAt(0).toUpperCase() + legacySlug.slice(1);
        const btnEl = document.getElementById(`book${capitalizedSlug}Btn`);

        if (!statusEl || !slotsEl || !btnEl) return;
        
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
    console.log('[Booking] Lake selected:', lake);
    
    if (!selectedDate) {
        const tempDate = localStorage.getItem('tempSelectedDate');
        if (tempDate) {
            selectedDate = new Date(tempDate);
        } else {
            return;
        }
    }
    
    selectedLake = lake;
    localStorage.setItem('tempSelectedLake', selectedLake);
    
    const lakeName = getLakeName(lake);
    const selectedLakeDisplay = document.getElementById('selectedLakeDisplay');
    if (selectedLakeDisplay) {
        selectedLakeDisplay.textContent = lakeName;
    }
    
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.style.display = 'block';
        bookingForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Confirm booking
function confirmBooking() {
    console.log('[Booking] Confirming booking...');
    
    if (!selectedDate) {
        const tempDate = localStorage.getItem('tempSelectedDate');
        if (tempDate) selectedDate = new Date(tempDate);
    }
    
    if (!selectedLake) {
        const tempLake = localStorage.getItem('tempSelectedLake');
        if (tempLake) selectedLake = tempLake;
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
    
    if (checkBookingRestriction()) {
        alert('You have an active booking restriction. Please wait before making another booking.');
        return;
    }
    
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    const lakeBookings = dateBookings.filter(b => b.lake === selectedLake).length;
    const maxSlots = getLakeCapacity(selectedLake);
    
    if (lakeBookings >= maxSlots) {
        alert('Sorry, this lake is no longer available for the selected date.');
        return;
    }
    
    const newBooking = {
        id: Date.now().toString(),
        userId: currentUser.email,
        userName: currentUser.fullName || currentUser.email,
        lake: selectedLake,
        lakeName: getLakeName(selectedLake),
        date: dateString,
        notes: notes,
        status: 'upcoming',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    saveBookingsToStorage();
    setLastBookingTime();
    checkBookingRestriction();
    loadActiveBooking();
    
    if (selectedDate) {
        updateLakeAvailability(dateString);
    }
    
    resetBooking();
    alert('✅ Booking confirmed successfully!');
    console.log('[Booking] Booking confirmed:', newBooking.id);
}

// Reset booking
function resetBooking() {
    selectedDate = null;
    selectedLake = null;
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
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Lake booking buttons
    LAKES.forEach(lake => {
        const legacySlug = lake.legacySlug || lake.slug;
        const capitalizedSlug = legacySlug.charAt(0).toUpperCase() + legacySlug.slice(1);
        const btnEl = document.getElementById(`book${capitalizedSlug}Btn`);
        if (btnEl) {
            btnEl.addEventListener('click', () => bookLake(legacySlug));
        }
    });

    // Confirm and Cancel buttons
    const confirmBookingBtn = document.getElementById('confirmBookingBtn');
    const cancelBookingBtn = document.getElementById('cancelBookingBtn');
    if (confirmBookingBtn) confirmBookingBtn.addEventListener('click', confirmBooking);
    if (cancelBookingBtn) cancelBookingBtn.addEventListener('click', resetBooking);

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Back to Home button
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    // Switch to booking tab
    const switchToBookingTabBtns = document.querySelectorAll('.switch-to-booking-tab');
    switchToBookingTabBtns.forEach(btn => {
        btn.addEventListener('click', switchToBookingTab);
    });

    console.log('[Booking] Event listeners attached');
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
    
    const restrictionNotice = document.getElementById('restrictionNotice');
    if (restrictionNotice) {
        restrictionNotice.style.display = 'none';
    }
    
    return false;
}

// Get last booking time
function getLastBookingTime() {
    if (!currentUser) return null;
    const time = localStorage.getItem(`lastBookingTime_${currentUser.email}`);
    return time ? new Date(parseInt(time)) : null;
}

// Set last booking time
function setLastBookingTime() {
    if (!currentUser) return;
    localStorage.setItem(`lastBookingTime_${currentUser.email}`, Date.now().toString());
}

// Load active booking
function loadActiveBooking() {
    const activeBookingContent = document.getElementById('activeBookingContent');
    if (!activeBookingContent) return;

    if (!currentUser) {
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <h4>No Active Booking</h4>
                <p>Please log in to view your active bookings.</p>
            </div>
        `;
        return;
    }

    // Update statuses before loading
    updateBookingStatuses();

    // Reload bookings from storage to get latest data
    loadBookingsFromStorage();

    const userBookings = bookings.filter(booking => booking.userId === currentUser.email);

    // Find active booking (not cancelled and not expired)
    const activeBooking = userBookings.find(booking => {
        if (booking.status === 'cancelled' || booking.status === 'completed') return false;

        const now = new Date();
        const bookingStart = new Date(booking.date + 'T00:00:00');
        const bookingEnd = new Date(bookingStart.getTime() + (24 * 60 * 60 * 1000)); // +24 hours

        // Only show if booking hasn't expired (within 24 hours from start)
        return now < bookingEnd;
    });

    if (!activeBooking) {
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <h4>No Active Booking</h4>
                <p>You don't have any active bookings at the moment.</p>
                <p>Go to the Calendar Booking tab to make a new booking.</p>
            </div>
        `;
        return;
    }

    const bookingDate = new Date(activeBooking.date + 'T00:00:00');
    const createdDate = new Date(activeBooking.createdAt);
    const bookingEnd = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));

    // Calculate time remaining
    const now = new Date();
    const timeRemaining = bookingEnd - now;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

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
                        <span class="status-badge upcoming">Active</span>
                    </div>
                </div>
                <div class="booking-detail">
                    <div class="booking-detail-label">Time Remaining</div>
                    <div class="booking-detail-value">${hoursRemaining}h ${minutesRemaining}m</div>
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
                    Cancel Booking
                </button>
            </div>
        </div>
    `;
}

// Cancel active booking
function cancelActiveBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking?')) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
            booking.status = 'cancelled';
            saveBookingsToStorage();
            
            if (currentUser) {
                localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
            }
            
            checkBookingRestriction();
            loadActiveBooking();
            
            if (selectedDate) {
                updateLakeAvailability(formatDate(selectedDate));
            }
            
            alert('Booking cancelled successfully. You can now make a new booking.');
        }
    }
}

// Update booking statuses with 24hr expiration
function updateBookingStatuses() {
    const now = new Date();
    let updated = false;

    bookings.forEach(booking => {
        if (booking.status === 'cancelled') return;

        const bookingStart = new Date(booking.date + 'T00:00:00');
        const bookingEnd = new Date(bookingStart.getTime() + (24 * 60 * 60 * 1000)); // +24 hours

        // Check if booking has expired (24 hours after start date)
        if (now >= bookingEnd && booking.status === 'upcoming') {
            booking.status = 'completed';
            updated = true;
            console.log(`[Booking] Booking ${booking.id} expired after 24hrs`);
        }
    });

    if (updated) {
        saveBookingsToStorage();
        loadActiveBooking(); // Refresh active booking display
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

// Logout
function logout() {
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
        localStorage.setItem('tempUserData', currentUserData);
    }
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Switch to booking tab
function switchToBookingTab() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    const calendarBtn = document.querySelector('.tab-btn[data-tab="calendar-booking"]');
    const calendarPane = document.getElementById('calendar-booking');
    
    if (calendarBtn) calendarBtn.classList.add('active');
    if (calendarPane) calendarPane.classList.add('active');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize booking system
function initializeBookingSystem() {
    console.log('[Booking] Initializing system...');
    loadBookingsFromStorage();
    
    if (!selectedDate) {
        selectedDate = new Date();
        selectedDate.setHours(0, 0, 0, 0);
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
    }
}

// Initialize date inputs
function initializeDateInputs() {
    const dateInput = document.getElementById('booking-date');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }
    
    const allDateInputs = document.querySelectorAll('input[type="date"]');
    allDateInputs.forEach(input => {
        if (!input.value) {
            input.valueAsDate = new Date();
        }
    });
}

// Toggle active booking content
function toggleActiveBookingContent() {
    const content = document.getElementById('activeBookingContent');
    const toggleBtn = document.getElementById('toggleActiveBookingBtn');
    const toggleIcon = document.getElementById('toggleIcon');
    const toggleText = document.getElementById('toggleText');

    if (!content || !toggleBtn) return;

    const isCollapsed = content.style.display === 'none';

    if (isCollapsed) {
        // Expand
        content.style.display = 'block';
        toggleIcon.style.transform = 'rotate(0deg)';
        toggleText.textContent = 'Collapse';
        localStorage.setItem('activeBookingCollapsed', 'false');
    } else {
        // Collapse
        content.style.display = 'none';
        toggleIcon.style.transform = 'rotate(180deg)';
        toggleText.textContent = 'Expand';
        localStorage.setItem('activeBookingCollapsed', 'true');
    }
}

// Restore toggle state on load
function restoreToggleState() {
    const isCollapsed = localStorage.getItem('activeBookingCollapsed') === 'true';
    if (isCollapsed) {
        const content = document.getElementById('activeBookingContent');
        const toggleIcon = document.getElementById('toggleIcon');
        const toggleText = document.getElementById('toggleText');

        if (content) content.style.display = 'none';
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
        if (toggleText) toggleText.textContent = 'Expand';
    }
}

// Expose functions to window
window.confirmBooking = confirmBooking;
window.resetBooking = resetBooking;
window.logout = logout;
window.cancelActiveBooking = cancelActiveBooking;
window.switchToBookingTab = switchToBookingTab;
window.bookLake = bookLake;
window.selectDate = selectDate;
window.toggleActiveBookingContent = toggleActiveBookingContent;

console.log('[Booking] Script loaded successfully');

