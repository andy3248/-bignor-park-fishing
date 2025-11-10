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
    loadBookingsFromStorage().then(() => {
        checkBookingRestriction();
        loadActiveBooking();
    });
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
    
    // Render bookings table if user is logged in
    if (currentUser && currentUser.email) {
        setTimeout(function() {
            renderBookingsTable(currentUser.email);
        }, 500);
    }
    
    // Start auto-refresh for bookings table
    startBookingsTableAutoRefresh();

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

// Load bookings from API
async function loadBookingsFromStorage() {
    try {
        console.log('[Booking] Loading bookings from API...');
        
        // Check if BignorAPI is available
        if (!window.BignorAPI) {
            console.error('[Booking] BignorAPI not available yet, will retry...');
            bookings = [];
            return;
        }
        
        // Get all active bookings from API
        const response = await BignorAPI.bookings.getMyBookings(100);
        const apiBookings = response.bookings || [];
        
        // Map API format to frontend format
        bookings = apiBookings.map(b => ({
            id: b.bookingId || b.id,
            userId: currentUser?.email || '',
            user_id: currentUser?.id,
            userName: currentUser?.fullName || `${currentUser?.firstName} ${currentUser?.lastName}`,
            lake: getLakeIdFromName(b.lakeName), // Convert lake name back to ID
            lakeName: b.lakeName,
            date: b.bookingDate, // API uses bookingDate, frontend expects date
            bookingDate: b.bookingDate,
            notes: b.notes || '',
            status: b.status, // Keep original status ('active', 'upcoming', 'completed', 'cancelled')
            createdAt: b.createdAt
        }));
        
        console.log(`[Booking] Loaded ${bookings.length} bookings from API:`, bookings);
    } catch (error) {
        console.error('[Booking] Error loading bookings from API:', error);
        bookings = [];
    }
}

// Helper function to convert lake name to ID
function getLakeIdFromName(lakeName) {
    const lakeMap = {
        'Bignor Lake': '1',
        'Fox Lake': '2',
        'Syndicate Lake': '3'
    };
    return lakeMap[lakeName] || '1';
}

// Helper function to convert lake slug to numeric ID for API
function getLakeIdFromSlug(slug) {
    const slugToId = {
        // Bignor Main Lake
        'bignor': 1,
        'bignor-main': 1,
        '1': 1,
        // Wood Pool (Fox Lake in database)
        'wood': 2,
        'wood-pool': 2,
        'fox': 2,
        '2': 2,
        // Syndicate Lake
        'syndicate': 3,
        '3': 3
    };
    
    const id = slugToId[slug];
    console.log('[Booking] Converting slug "' + slug + '" → Lake ID:', id);
    return id || null;
}

// Helper function to get API-compatible lake name
function getApiLakeName(slug) {
    const lakeNames = {
        'bignor': 'Bignor Lake',
        'bignor-main': 'Bignor Lake',
        '1': 'Bignor Lake',
        'wood': 'Fox Lake',
        'wood-pool': 'Fox Lake',
        'fox': 'Fox Lake',
        '2': 'Fox Lake',
        'syndicate': 'Syndicate Lake',
        '3': 'Syndicate Lake'
    };
    
    return lakeNames[slug] || getLakeName(slug);
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
async function confirmBooking() {
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
    
    // Check lake availability from current data
    const dateBookings = bookings.filter(booking => 
        booking.date === dateString && booking.status !== 'cancelled'
    );
    
    const lakeBookings = dateBookings.filter(b => b.lake === selectedLake).length;
    const maxSlots = getLakeCapacity(selectedLake);
    
    if (lakeBookings >= maxSlots) {
        alert('Sorry, this lake is no longer available for the selected date.');
        return;
    }
    
    // Create booking via API
    try {
        console.log('[Booking] Creating booking via API...');
        
        // Check if BignorAPI is available
        if (!window.BignorAPI) {
            throw new Error('API client not available. Please refresh the page.');
        }
        
        // Convert lake slug to ID
        const lakeId = getLakeIdFromSlug(selectedLake);
        const lakeName = getApiLakeName(selectedLake);
        
        if (!lakeId) {
            throw new Error('Invalid lake selection. Please try again.');
        }
        
        console.log('[Booking] Creating booking with:');
        console.log('  - Lake Slug:', selectedLake);
        console.log('  - Lake ID:', lakeId);
        console.log('  - Lake Name:', lakeName);
        console.log('  - Date:', dateString);
        console.log('  - Notes:', notes || '(none)');
        
        // Call API to create booking
        const response = await BignorAPI.bookings.createBooking({
            lakeId: lakeId,
            lakeName: lakeName,
            bookingDate: dateString,
            notes: notes || ''
        });
        
        console.log('[Booking] Booking created successfully via API:', response);
        
        // Set booking restriction AFTER successful booking
        setLastBookingTime();
        console.log('[Booking] Set last booking time');
        
        // Reload bookings from API to get updated list
        await loadBookingsFromStorage();
        
        // Update restrictions and active booking display
        checkBookingRestriction();
        await loadActiveBooking();
        
        // Update lake availability display to reflect the new booking
        if (selectedDate) {
            updateLakeAvailability(dateString);
        }
        
        // Reset form
        resetBooking();
        
        // Show the booking success modal with the new booking details
        const newBooking = {
            id: response.booking.id || response.booking.bookingId,
            userId: currentUser.email,
            userName: currentUser.fullName || currentUser.email,
            lake: selectedLake,
            lakeName: getLakeName(selectedLake),
            date: dateString,
            notes: notes,
            status: 'upcoming',
            createdAt: response.booking.createdAt || new Date().toISOString()
        };
        showBookingSuccessModal(newBooking);
        console.log('[Booking] Booking confirmed:', newBooking.id);
        
        // Reload active booking display and table
        setTimeout(function() {
            const container = document.getElementById('activeBookingContent');
            if (container && window.ActiveBookingSystem) {
                const booking = window.ActiveBookingSystem.getActiveBooking(currentUser.email);
                if (booking && window.renderActiveBookingCard) {
                    renderActiveBookingCard(currentUser.email, container);
                }
            }
            // Refresh bookings table
            renderBookingsTable(currentUser.email);
        }, 200);
        
    } catch (error) {
        console.error('[Booking] Error confirming booking via API:', error);
        alert(error.message || 'There was an error confirming your booking. Please check if the backend server is running and try again.');
    }
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
// Check if user already has booking for specific lake+date combo
function checkBookingRestriction() {
    if (!currentUser || !selectedLake || !selectedDate) return false;
    
    const dateString = formatDate(selectedDate);
    
    // Check if this user already booked THIS lake on THIS date
    const existingBooking = bookings.find(booking => 
        booking.userId === currentUser.email &&
        booking.lake === selectedLake &&
        booking.date === dateString &&
        booking.status !== 'cancelled'
    );
    
    if (existingBooking) {
        const restrictionNotice = document.getElementById('restrictionNotice');
        const restrictionMessage = document.getElementById('restrictionMessage');
        
        if (restrictionNotice && restrictionMessage) {
            const lakeName = getLakeName(selectedLake);
            restrictionMessage.textContent = `You have already booked ${lakeName} for ${dateString}. You can book a different date or different lake.`;
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
async function loadActiveBooking() {
    console.log('[Booking] loadActiveBooking called');
    console.log('[Booking] currentUser:', currentUser);
    
    const activeBookingContent = document.getElementById('activeBookingContent');
    if (!activeBookingContent) {
        console.log('[Booking] activeBookingContent element not found');
        return;
    }

    if (!currentUser) {
        console.log('[Booking] No currentUser, showing no booking message');
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <h4>No Active Booking</h4>
                <p>Please log in to view your active bookings.</p>
            </div>
        `;
        return;
    }

    // Reload bookings from API to ensure we have latest data
    await loadBookingsFromStorage();
    console.log('[Booking] bookings array:', bookings);

    // Find the user's active booking (API returns bookings for current user, but check both userId and user_id)
    const userBookings = bookings.filter(booking => 
        booking.userId === currentUser.email || booking.user_id === currentUser.id
    );
    
    // Find active booking - check for 'active' or 'upcoming' status (API returns 'active', we map to 'upcoming')
    const activeBooking = userBookings.find(booking => 
        booking.status === 'active' || booking.status === 'upcoming'
    );
    
    console.log('[Booking] User bookings:', userBookings);
    console.log('[Booking] Active booking:', activeBooking);

    if (!activeBooking) {
        console.log('[Booking] No active booking found');
        activeBookingContent.innerHTML = `
            <div class="no-active-booking">
                <h4>No Active Booking</h4>
                <p>You don't have any active bookings at the moment.</p>
                <p>Go to the Calendar Booking tab to make a new booking.</p>
            </div>
        `;
        return;
    }

    console.log('[Booking] Rendering active booking:', activeBooking);

    // Fix date parsing to avoid timezone issues
    const bookingDate = new Date(activeBooking.date + 'T00:00:00');
    const createdDate = activeBooking.createdAt ? new Date(activeBooking.createdAt) : new Date();

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
                    Cancel Booking
                </button>
            </div>
        </div>
    `;
}

// Cancel active booking
async function cancelActiveBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This will lift your booking restriction and allow you to make a new booking immediately.')) {
        return;
    }
    
    try {
        console.log('[Booking] Cancelling booking via API:', bookingId);
        
        // Check if BignorAPI is available
        if (!window.BignorAPI) {
            throw new Error('API client not available. Please refresh the page.');
        }
        
        // Call API to cancel booking
        await BignorAPI.bookings.cancelBooking(bookingId);
        
        console.log('[Booking] Booking cancelled successfully via API');
        
        // Reset the booking restriction when cancelling
        if (currentUser) {
            localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
        }
        
        // Reload bookings from API to get updated list
        await loadBookingsFromStorage();
        
        // Update restrictions and active booking display
        checkBookingRestriction();
        await loadActiveBooking();
        
        // Update lake availability display to reflect the cancelled booking
        if (selectedDate) {
            updateLakeAvailability(formatDate(selectedDate));
        }
        
        alert('Booking cancelled successfully. You can now make a new booking.');
        
    } catch (error) {
        console.error('[Booking] Error cancelling booking:', error);
        alert(error.message || 'There was an error cancelling your booking. Please check if the backend server is running and try again.');
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
        loadActiveBooking().catch(err => console.error('[Booking] Error refreshing active booking:', err)); // Refresh active booking display
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

// ============================================
// BOOKING SUCCESS MODAL FUNCTIONS
// ============================================

function showBookingSuccessModal(booking) {
    const modal = document.getElementById('bookingSuccessModal');
    if (!modal) {
        console.error('[Modal] Modal element not found');
        return;
    }
    
    // Populate modal with booking details - Yellowave style
    const modalLakeName = document.getElementById('modalLakeName');
    const modalDate = document.getElementById('modalDate');
    const modalStartTime = document.getElementById('modalStartTime');
    const modalLakeDescription = document.getElementById('modalLakeDescription');
    const modalBookingId = document.getElementById('modalBookingId');
    
    // Lake name
    const lakeName = booking.lakeName || getLakeName(booking.lake);
    if (modalLakeName) modalLakeName.textContent = lakeName;
    
    // Format date nicely (e.g., "Fri 24 Oct 2025")
    if (modalDate) {
        const dateObj = new Date(booking.date + 'T00:00:00');
        modalDate.textContent = dateObj.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
    
    // Start time
    if (modalStartTime) modalStartTime.textContent = '00:00 UTC';
    
    // Lake description
    if (modalLakeDescription) {
        modalLakeDescription.textContent = 'Bignor Park Carp Fishery';
    }
    
    // Booking ID
    if (modalBookingId) modalBookingId.textContent = booking.id;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Add escape key listener
    document.addEventListener('keydown', handleModalEscape);
}

function closeBookingModal() {
    const modal = document.getElementById('bookingSuccessModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleModalEscape);
    
    // Booking status removed from dropdown - not needed
    // if (window.UserDropdown && window.UserDropdown.updateBookingStatus) {
    //     window.UserDropdown.updateBookingStatus();
    // }
}

function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeBookingModal();
    }
}

// ============================================
// BOOKINGS TABLE FUNCTIONS
// ============================================

function renderBookingsTable(userEmail) {
    const container = document.getElementById('activeBookingContent');
    if (!container) {
        console.error('[Table] Container not found');
        return;
    }
    
    // Get all bookings for this user
    const userBookings = bookings.filter(b => b.userId === userEmail && b.status !== 'cancelled');
    
    // Filter out expired bookings - AUTO REMOVAL
    const now = Date.now();
    const activeBookings = userBookings.filter(booking => {
        if (booking.endUtc) {
            return booking.endUtc > now;
        }
        // For legacy bookings without endUtc, keep them for 24 hours
        const bookingDate = new Date(booking.date);
        const bookingEnd = bookingDate.getTime() + (24 * 60 * 60 * 1000);
        return bookingEnd > now;
    });
    
    // Clean up expired bookings from storage
    if (activeBookings.length < userBookings.length) {
        cleanupExpiredBookingsFromStorage(userEmail);
    }
    
    if (activeBookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h4>No Active Bookings</h4>
                <p>You don't have any active bookings at the moment.</p>
                <p>Use the Calendar Booking tab to make a reservation.</p>
            </div>
        `;
        return;
    }
    
    // Build card-based layout with full width and logos
    let cardsHTML = `
        <div class="bookings-cards-container">
            <div class="bookings-header">
                <h3>Your Bookings</h3>
                <span class="bookings-count">${activeBookings.length} Active</span>
            </div>
    `;
    
    // Add card for each booking
    activeBookings.forEach(booking => {
        const bookingDate = new Date(booking.date);
        const startUtc = booking.startUtc || bookingDate.getTime();
        const endUtc = booking.endUtc || (startUtc + (24 * 60 * 60 * 1000));
        
        // Determine status
        let status = 'upcoming';
        let statusLabel = 'Upcoming';
        let statusIcon = '📅';
        
        if (now >= startUtc && now < endUtc) {
            status = 'active';
            statusLabel = 'Active Now';
            statusIcon = '🎣';
        } else if (now < startUtc) {
            status = 'upcoming';
            statusLabel = 'Upcoming';
            statusIcon = '📅';
        }
        
        const lakeName = booking.lakeName || getLakeName(booking.lake);
        const notes = booking.notes || 'No notes';
        const startTime = new Date(startUtc).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
        
        // Calculate time remaining
        const timeRemaining = calculateTimeRemaining(endUtc);
        
        // Build horizontal stripe card with logo on left
        cardsHTML += `
            <div class="booking-stripe-card ${status}">
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
                        <span class="stripe-status-badge ${status}">${statusLabel}</span>
                    </div>
                    
                    <div class="stripe-details-grid">
                        <div class="stripe-detail-item">
                            <span class="stripe-label">Date</span>
                            <span class="stripe-value">${booking.date}</span>
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
                            <span class="stripe-value ${status === 'active' ? 'active-time' : ''}">${timeRemaining}</span>
                        </div>
                    </div>
                    
                    ${notes !== 'No notes' ? `
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
    });
    
    cardsHTML += `</div>`;
    
    container.innerHTML = cardsHTML;
}

// Helper function to calculate time remaining
function calculateTimeRemaining(endUtc) {
    const now = Date.now();
    const remaining = endUtc - now;
    
    if (remaining <= 0) {
        return 'Expired';
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Helper function to cleanup expired bookings from storage
function cleanupExpiredBookingsFromStorage(userEmail) {
    const now = Date.now();
    
    // Clean from bookings array
    bookings = bookings.filter(booking => {
        if (booking.userId !== userEmail || booking.status === 'cancelled') {
            return true; // Keep other users' bookings and cancelled ones
        }
        
        // Check if expired
        if (booking.endUtc) {
            return booking.endUtc > now;
        }
        
        const bookingDate = new Date(booking.date);
        const bookingEnd = bookingDate.getTime() + (24 * 60 * 60 * 1000);
        return bookingEnd > now;
    });
    
    saveBookingsToStorage();
    
    // Also clean from UTC system
    if (window.ActiveBookingSystem && userEmail) {
        window.ActiveBookingSystem.clearIfExpired(userEmail);
    }
    
    console.log('✅ Expired bookings cleaned up');
}

// REMOVED - Cancel button functionality no longer needed
// Bookings now auto-expire based on end date
function cancelBookingFromTable(bookingId) {
    // This function is deprecated - bookings auto-expire now
    console.warn('Cancel function called but is deprecated - bookings auto-expire');
    return;
    
    // IMPORTANT: Reload bookings from storage to get updated list
    loadBookingsFromStorage();
    
    // Refresh the table
    renderBookingsTable(currentUser.email);
    
    // Update lake availability for the cancelled booking's date
    if (bookingDate) {
        updateLakeAvailability(bookingDate);
    }
    
    // Also update current selected date if it exists
    if (selectedDate) {
        const currentDateString = formatDate(selectedDate);
        updateLakeAvailability(currentDateString);
    }
    
    // Clear any booking restriction for this user
    checkBookingRestriction();
    
    alert('✅ Booking cancelled successfully. You can now book this lake on this date again.');
}

// Auto-refresh bookings table every 60 seconds
function startBookingsTableAutoRefresh() {
    setInterval(function() {
        if (currentUser && document.getElementById('activeBookingContent')) {
            renderBookingsTable(currentUser.email);
        }
    }, 60000); // 60 seconds
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
window.showBookingSuccessModal = showBookingSuccessModal;
window.closeBookingModal = closeBookingModal;
window.renderBookingsTable = renderBookingsTable;
window.cancelBookingFromTable = cancelBookingFromTable;

console.log('[Booking] Script loaded successfully');

