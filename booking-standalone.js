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
    
    // Load bookings asynchronously
    loadBookingsFromStorage().then(() => {
        checkBookingRestriction();
        loadActiveBooking();
        
        // Render bookings table if user is logged in
        if (currentUser && currentUser.email) {
            renderBookingsTable(currentUser.email);
        }
    });
    
    initializeCalendar();
    setupEventListeners();
    initializeDateInputs();
    updateBookingStatuses();
    restoreToggleState();

    // Update booking statuses every minute
    setInterval(updateBookingStatuses, 60000);

    // Update availability every 30 seconds if date selected
    setInterval(async function() {
        if (selectedDate) {
            await loadBookingsFromStorage();
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

// Load bookings from API (with localStorage fallback)
async function loadBookingsFromStorage() {
    try {
        // Try to load from API first
        if (typeof BignorAPI !== 'undefined' && BignorAPI.bookings) {
            console.log('[Booking] Loading bookings from API...');
            const response = await BignorAPI.bookings.getMyBookings(100);
            
            if (response && response.data) {
                bookings = response.data.map(b => ({
                    id: b.id,
                    userId: b.user_id,
                    userName: b.user_name || 'Member',
                    lake: b.lake_id === 1 ? 'bignor' : 'wood',
                    lakeName: b.lake_id === 1 ? 'Bignor Main Lake' : 'Wood Pool',
                    date: b.date,
                    createdAt: b.created_at,
                    status: b.status, // Keep original status from API
                    notes: b.notes || ''
                }));
                
                console.log(`[Booking] Loaded ${bookings.length} bookings from API`);
                
                // Also save to localStorage as backup
                localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
                return;
            }
        }
        
        // Fallback to localStorage if API fails
        console.log('[Booking] Loading bookings from localStorage (API unavailable)');
        const storedBookings = localStorage.getItem(STORAGE_KEY);
        bookings = storedBookings ? JSON.parse(storedBookings) : [];
        console.log(`[Booking] Loaded ${bookings.length} bookings from localStorage`);
    } catch (error) {
        console.error('[Booking] Error loading bookings:', error);
        // Try localStorage as fallback
        try {
            const storedBookings = localStorage.getItem(STORAGE_KEY);
            bookings = storedBookings ? JSON.parse(storedBookings) : [];
            console.log(`[Booking] Loaded ${bookings.length} bookings from localStorage (API error)`);
        } catch (e) {
            console.error('[Booking] Error loading from localStorage:', e);
            bookings = [];
        }
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
    
    // Convert lake to lake_id for API
    const lakeId = selectedLake === 'bignor' ? 1 : 2;
    
    try {
        // Use API to create booking
        if (typeof BignorAPI !== 'undefined' && BignorAPI.bookings) {
            console.log('[Booking] Creating booking via API...');
            
            const bookingData = {
                lake_id: lakeId,
                date: dateString,
                notes: notes || ''
            };
            
            const response = await BignorAPI.bookings.createBooking(bookingData);
            console.log('[Booking] API response:', response);
            
            if (response && response.data) {
                // Success! Convert API response to local format
                const newBooking = {
                    id: response.data.id,
                    userId: response.data.user_id,
                    userName: response.data.user_name || currentUser.fullName || currentUser.email,
                    lake: selectedLake,
                    lakeName: getLakeName(selectedLake),
                    date: response.data.date,
                    notes: response.data.notes || '',
                    status: response.data.status,
                    createdAt: response.data.created_at
                };
                
                // Update local bookings array
                await loadBookingsFromStorage();
                
                // Update booking restriction
                checkBookingRestriction();
                
                // Reload active booking
                await loadActiveBooking();
                
                // Update availability
                if (selectedDate) {
                    await loadBookingsFromStorage();
                    updateLakeAvailability(dateString);
                }
                
                // Reset form
                resetBooking();
                
                // Show success modal
                showBookingSuccessModal(newBooking);
                console.log('[Booking] Booking confirmed via API:', newBooking.id);
                
                // Reload active booking display and table
                setTimeout(async function() {
                    await loadActiveBooking();
                    renderBookingsTable(currentUser.email);
                }, 200);
                
                return;
            }
        }
        
        // Fallback to localStorage if API is unavailable
        console.log('[Booking] API unavailable, using localStorage fallback');
        
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
        checkBookingRestriction();
        loadActiveBooking();
        
        if (selectedDate) {
            updateLakeAvailability(dateString);
        }
        
        resetBooking();
        showBookingSuccessModal(newBooking);
        console.log('[Booking] Booking confirmed (localStorage):', newBooking.id);
        
        setTimeout(function() {
            renderBookingsTable(currentUser.email);
        }, 200);
        
    } catch (error) {
        console.error('[Booking] Error confirming booking via API:', error);
        
        // Handle specific API errors with better messages
        if (error.status === 409 || error.message?.includes('already have an active booking')) {
            // User already has an active booking - show helpful message
            const errorMsg = error.data?.message || error.message || 'You already have an active booking';
            alert(errorMsg + '\n\nPlease cancel your existing booking first or wait for it to complete.');
            
            // Refresh active booking display so they can see it
            await loadActiveBooking();
            
            // Switch to active booking tab
            const activeTabBtn = document.querySelector('.tab-btn[data-tab="active"]');
            if (activeTabBtn) {
                activeTabBtn.click();
            }
        } else {
            alert(error.message || 'There was an error confirming your booking. Please check if the backend server is running and try again.');
        }
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
async function cancelActiveBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    try {
        // Use API to cancel booking
        if (typeof BignorAPI !== 'undefined' && BignorAPI.bookings) {
            console.log('[Booking] Cancelling booking via API:', bookingId);
            
            const response = await BignorAPI.bookings.cancelBooking(bookingId);
            console.log('[Booking] Cancel API response:', response);
            
            // Remove booking restriction
            if (currentUser) {
                localStorage.removeItem(`lastBookingTime_${currentUser.email}`);
            }
            
            // Reload bookings from API
            await loadBookingsFromStorage();
            
            // Update booking restriction
            checkBookingRestriction();
            
            // Reload active booking
            await loadActiveBooking();
            
            // Update availability
            if (selectedDate) {
                await loadBookingsFromStorage();
                updateLakeAvailability(formatDate(selectedDate));
            }
            
            alert('Booking cancelled successfully. You can now make a new booking.');
            
            // Refresh bookings table
            setTimeout(function() {
                renderBookingsTable(currentUser.email);
            }, 200);
            
            return;
        }
        
        // Fallback to localStorage if API unavailable
        console.log('[Booking] API unavailable, using localStorage fallback for cancel');
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
    } catch (error) {
        console.error('[Booking] Error cancelling booking:', error);
        alert(error.message || 'There was an error cancelling your booking. Please try again.');
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

