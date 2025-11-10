/**
 * Example Implementation: Fix Session Persistence
 * 
 * This file shows how to update booking-standalone.js to use the API
 * instead of localStorage for cross-browser data persistence.
 * 
 * Replace the corresponding functions in booking-standalone.js with these versions.
 */

// ============================================
// 1. LOAD BOOKINGS FROM SERVER
// ============================================

/**
 * Load bookings from server API (with localStorage fallback)
 * Replace the existing loadBookingsFromStorage() function
 */
async function loadBookingsFromAPI() {
    console.log('[Booking] Loading bookings from server...');
    
    try {
        // Check if user is logged in
        if (!currentUser || !currentUser.email) {
            console.warn('[Booking] No user logged in');
            bookings = [];
            return;
        }
        
        // Load from server via API
        const response = await BignorAPI.bookings.getMyBookings(100);
        
        if (response && response.bookings) {
            bookings = response.bookings;
            
            // Update localStorage cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
            
            console.log(`[Booking] ✅ Loaded ${bookings.length} bookings from server`);
        } else {
            bookings = [];
        }
        
    } catch (error) {
        console.error('[Booking] ❌ Failed to load from server:', error);
        
        // Fallback to localStorage cache
        try {
            const storedBookings = localStorage.getItem(STORAGE_KEY);
            bookings = storedBookings ? JSON.parse(storedBookings) : [];
            console.log(`[Booking] 💾 Using cached bookings: ${bookings.length}`);
        } catch (cacheError) {
            console.error('[Booking] Cache read failed:', cacheError);
            bookings = [];
        }
    }
}

// ============================================
// 2. CREATE BOOKING VIA SERVER
// ============================================

/**
 * Create a new booking via server API (with localStorage cache)
 * Replace or update the existing booking creation logic
 */
async function createBookingViaAPI(bookingData) {
    console.log('[Booking] Creating booking via API...', bookingData);
    
    try {
        // Validate required fields
        if (!bookingData.lakeId || !bookingData.lakeName || !bookingData.bookingDate) {
            throw new Error('Missing required booking fields');
        }
        
        // Send to server
        const response = await BignorAPI.bookings.createBooking({
            lakeId: bookingData.lakeId,
            lakeName: bookingData.lakeName,
            bookingDate: bookingData.bookingDate,
            notes: bookingData.notes || ''
        });
        
        if (response && response.booking) {
            // Add to local array
            bookings.push(response.booking);
            
            // Update localStorage cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
            
            console.log('[Booking] ✅ Booking created successfully:', response.booking);
            
            return response.booking;
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('[Booking] ❌ Failed to create booking:', error);
        
        // Show error to user
        if (error.data && error.data.message) {
            alert(`Booking failed: ${error.data.message}`);
        } else {
            alert('Failed to create booking. Please try again.');
        }
        
        throw error;
    }
}

// ============================================
// 3. GET ACTIVE BOOKING FROM SERVER
// ============================================

/**
 * Get user's active booking from server
 * Replace the existing getActiveBooking logic
 */
async function getActiveBookingFromAPI() {
    console.log('[Booking] Getting active booking from server...');
    
    try {
        if (!currentUser || !currentUser.email) {
            return null;
        }
        
        const response = await BignorAPI.bookings.getActiveBooking();
        
        if (response && response.booking) {
            console.log('[Booking] ✅ Active booking found:', response.booking);
            return response.booking;
        } else {
            console.log('[Booking] No active booking');
            return null;
        }
        
    } catch (error) {
        console.error('[Booking] ❌ Failed to get active booking:', error);
        return null;
    }
}

// ============================================
// 4. CANCEL BOOKING VIA SERVER
// ============================================

/**
 * Cancel a booking via server API
 * Replace the existing cancelBooking logic
 */
async function cancelBookingViaAPI(bookingId) {
    console.log('[Booking] Canceling booking via API:', bookingId);
    
    try {
        // Confirm with user
        if (!confirm('Are you sure you want to cancel this booking?')) {
            return false;
        }
        
        // Cancel on server
        const response = await BignorAPI.bookings.cancelBooking(bookingId);
        
        if (response && response.success) {
            // Remove from local array
            bookings = bookings.filter(b => b.id !== bookingId);
            
            // Update localStorage cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
            
            console.log('[Booking] ✅ Booking canceled successfully');
            
            // Reload bookings to sync with server
            await loadBookingsFromAPI();
            
            alert('Booking canceled successfully!');
            return true;
        } else {
            throw new Error('Failed to cancel booking');
        }
        
    } catch (error) {
        console.error('[Booking] ❌ Failed to cancel booking:', error);
        
        if (error.data && error.data.message) {
            alert(`Cancel failed: ${error.data.message}`);
        } else {
            alert('Failed to cancel booking. Please try again.');
        }
        
        return false;
    }
}

// ============================================
// 5. CHECK LAKE AVAILABILITY FROM SERVER
// ============================================

/**
 * Check lake availability via server API
 * This ensures real-time availability across all browsers
 */
async function checkLakeAvailabilityViaAPI(lakeId, date) {
    console.log('[Booking] Checking availability via API:', lakeId, date);
    
    try {
        const response = await BignorAPI.bookings.checkAvailability(lakeId, date);
        
        if (response) {
            console.log('[Booking] ✅ Availability:', response);
            return {
                available: response.available,
                spotsRemaining: response.spotsRemaining,
                maxCapacity: response.maxCapacity
            };
        }
        
        return { available: false, spotsRemaining: 0 };
        
    } catch (error) {
        console.error('[Booking] ❌ Failed to check availability:', error);
        return { available: false, spotsRemaining: 0 };
    }
}

// ============================================
// 6. UPDATED INITIALIZATION
// ============================================

/**
 * Update the DOMContentLoaded event listener in booking-standalone.js
 * Replace the existing initialization code
 */
document.addEventListener('DOMContentLoaded', async function() {
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
    
    // Load bookings from SERVER (not localStorage)
    await loadBookingsFromAPI(); // ← Changed from loadBookingsFromStorage()
    
    checkBookingRestriction();
    
    // Load active booking from SERVER
    await loadActiveBookingFromServer(); // ← Add this new function
    
    initializeCalendar();
    setupEventListeners();
    initializeDateInputs();
    updateBookingStatuses();
    restoreToggleState();

    // Update booking statuses every minute
    setInterval(updateBookingStatuses, 60000);

    // Sync with server every 30 seconds
    setInterval(async function() {
        if (selectedDate) {
            await loadBookingsFromAPI(); // ← Sync with server
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

    console.log('[Booking] ✅ Initialization complete');
});

// ============================================
// 7. LOAD ACTIVE BOOKING FROM SERVER
// ============================================

/**
 * Load active booking from server and display it
 */
async function loadActiveBookingFromServer() {
    console.log('[Booking] Loading active booking from server...');
    
    try {
        const activeBooking = await getActiveBookingFromAPI();
        
        if (activeBooking) {
            // Display active booking
            const container = document.getElementById('activeBookingContent');
            if (container && window.renderActiveBookingCard) {
                renderActiveBookingCard(currentUser.email, container);
            }
        }
    } catch (error) {
        console.error('[Booking] Failed to load active booking:', error);
    }
}

// ============================================
// IMPLEMENTATION INSTRUCTIONS
// ============================================

/**
 * HOW TO IMPLEMENT:
 * 
 * 1. Open booking-standalone.js
 * 
 * 2. Replace these functions:
 *    - loadBookingsFromStorage()     → loadBookingsFromAPI()
 *    - saveBookingToStorage()        → createBookingViaAPI()
 *    - getActiveBooking()            → getActiveBookingFromAPI()
 *    - cancelBooking()               → cancelBookingViaAPI()
 *    - checkLakeAvailability()       → checkLakeAvailabilityViaAPI()
 * 
 * 3. Update the DOMContentLoaded event listener
 * 
 * 4. Find all places where these functions are called and update them to use async/await:
 *    
 *    Before:
 *    loadBookingsFromStorage();
 *    
 *    After:
 *    await loadBookingsFromAPI();
 * 
 * 5. Test thoroughly:
 *    - Create booking in Chrome
 *    - Open Firefox
 *    - Log in with same account
 *    - ✅ Booking should appear!
 * 
 * 6. Deploy to production
 */

// ============================================
// EXAMPLE: UPDATE BOOKING SUBMISSION
// ============================================

/**
 * Example of how to update the booking submission handler
 * Find the confirmBookingBtn click handler and update it like this:
 */
document.getElementById('confirmBookingBtn').addEventListener('click', async function(e) {
    e.preventDefault();
    
    if (!selectedDate || !selectedLake) {
        alert('Please select a date and lake');
        return;
    }
    
    // Disable button during submission
    this.disabled = true;
    this.textContent = 'Creating booking...';
    
    try {
        // Get form data
        const notes = document.getElementById('bookingNotes')?.value || '';
        
        // Create booking via API (not localStorage)
        const booking = await createBookingViaAPI({
            lakeId: selectedLake,
            lakeName: getLakeName(selectedLake),
            bookingDate: formatDate(selectedDate),
            notes: notes,
            userId: currentUser.id || currentUser.email,
            userEmail: currentUser.email,
            userName: currentUser.fullName || currentUser.email
        });
        
        // Show success modal
        showBookingSuccessModal(booking);
        
        // Reset form
        resetBookingForm();
        
        // Reload bookings from server
        await loadBookingsFromAPI();
        
    } catch (error) {
        console.error('Booking creation failed:', error);
        // Error already shown to user in createBookingViaAPI()
    } finally {
        // Re-enable button
        this.disabled = false;
        this.textContent = 'Confirm Booking';
    }
});

/**
 * That's it! Your bookings will now persist across browsers.
 * 
 * Remember:
 * - API is the source of truth
 * - localStorage is just a cache
 * - Always load from API on page load
 * - Always save to API when creating/updating
 */

