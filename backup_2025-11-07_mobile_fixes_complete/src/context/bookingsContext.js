/**
 * Global Bookings Context - Vanilla JS implementation of React Context pattern
 * Provides centralized state management with automatic localStorage persistence
 * Mimics React Context and useEffect functionality for vanilla JavaScript
 */

// Import bookingsStore utilities (when using ES modules)
// For now, we'll implement similar functionality inline for compatibility

const STORAGE_KEY = 'bignor_park_bookings';
const USER_SESSION_KEY = 'currentUser';
const TEMP_USER_KEY = 'tempUserData';

/**
 * Global Bookings Context
 * Singleton pattern to manage app-wide booking state
 */
class BookingsContext {
    constructor() {
        // State
        this.bookings = [];
        this.currentUser = null;
        this.selectedDate = null;
        this.selectedLake = null;
        this.activeBooking = null;
        
        // Observers (like React component subscribers)
        this.observers = [];
        
        // Auto-initialize on creation
        this.initialize();
    }
    
    /**
     * Initialize the context - called on mount
     * Similar to useEffect([], []) in React
     */
    initialize() {
        console.log('[BookingsContext] Initializing...');
        
        // Load persisted bookings
        this.loadBookings();
        
        // Load user session
        this.loadUserSession();
        
        // Clear expired bookings
        this.clearExpired();
        
        // Set up auto-save listeners (like useEffect dependencies)
        this.setupAutoSave();
        
        // Set up visibility change listener (persist on page hide)
        this.setupVisibilityListener();
        
        console.log('[BookingsContext] Initialized', {
            bookings: this.bookings.length,
            user: this.currentUser?.fullName || 'None'
        });
    }
    
    /**
     * Load bookings from localStorage
     * Similar to bookingsStore.loadBookings()
     */
    loadBookings() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                this.bookings = [];
                return;
            }
            
            const parsed = JSON.parse(stored);
            
            if (!Array.isArray(parsed)) {
                console.warn('[BookingsContext] Invalid bookings data, resetting');
                localStorage.removeItem(STORAGE_KEY);
                this.bookings = [];
                return;
            }
            
            // Validate and filter bookings
            this.bookings = parsed.filter(booking => {
                if (!booking.id || !booking.date) return false;
                return true;
            });
            
            // Sort by start date if available, otherwise by date string
            this.bookings.sort((a, b) => {
                if (a.start && b.start) return a.start - b.start;
                return a.date.localeCompare(b.date);
            });
            
            console.log(`[BookingsContext] Loaded ${this.bookings.length} bookings`);
            
        } catch (error) {
            console.error('[BookingsContext] Error loading bookings:', error);
            localStorage.removeItem(STORAGE_KEY);
            this.bookings = [];
        }
    }
    
    /**
     * Save bookings to localStorage
     * Similar to bookingsStore.saveBookings()
     */
    saveBookings() {
        try {
            const json = JSON.stringify(this.bookings);
            localStorage.setItem(STORAGE_KEY, json);
            console.log(`[BookingsContext] Saved ${this.bookings.length} bookings`);
            
            // Notify observers (like React re-render)
            this.notifyObservers('bookings');
            
        } catch (error) {
            console.error('[BookingsContext] Error saving bookings:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Some bookings may not be saved.');
            }
        }
    }
    
    /**
     * Add a new booking
     * Similar to bookingsStore.addBooking()
     */
    addBooking(booking) {
        // Validate booking
        if (!booking.id || !booking.date) {
            console.error('[BookingsContext] Invalid booking:', booking);
            return false;
        }
        
        // Check if booking already exists
        const existingIndex = this.bookings.findIndex(b => b.id === booking.id);
        if (existingIndex !== -1) {
            console.warn('[BookingsContext] Updating existing booking:', booking.id);
            this.bookings[existingIndex] = booking;
        } else {
            this.bookings.push(booking);
        }
        
        // Auto-save (like useEffect watching dependencies)
        this.saveBookings();
        
        return true;
    }
    
    /**
     * Remove a booking by ID
     */
    removeBooking(bookingId) {
        const originalLength = this.bookings.length;
        this.bookings = this.bookings.filter(b => b.id !== bookingId);
        
        if (this.bookings.length < originalLength) {
            console.log(`[BookingsContext] Removed booking ${bookingId}`);
            this.saveBookings();
            return true;
        }
        
        return false;
    }
    
    /**
     * Clear expired bookings
     * Similar to bookingsStore.clearExpired()
     */
    clearExpired() {
        const now = Date.now();
        const originalLength = this.bookings.length;
        
        this.bookings = this.bookings.filter(booking => {
            if (!booking.end) return true; // Keep if no end time
            return booking.end > now;
        });
        
        if (this.bookings.length < originalLength) {
            console.log(`[BookingsContext] Cleared ${originalLength - this.bookings.length} expired booking(s)`);
            this.saveBookings();
        }
    }
    
    /**
     * Get active bookings (current or future)
     */
    getActiveBookings(now = Date.now()) {
        return this.bookings.filter(booking => {
            if (!booking.start || !booking.end) return true; // Keep if no timestamps
            return booking.start <= now && booking.end > now;
        });
    }
    
    /**
     * Get bookings for a specific date
     */
    getBookingsForDate(date) {
        const dateStr = this.formatDate(date);
        return this.bookings.filter(booking => booking.date === dateStr);
    }
    
    /**
     * Get bookings by lake
     */
    getBookingsByLake(lakeSlug) {
        return this.bookings.filter(booking => 
            booking.lake === lakeSlug || booking.lakeSlug === lakeSlug
        );
    }
    
    /**
     * Load user session from localStorage
     */
    loadUserSession() {
        try {
            let userData = localStorage.getItem(USER_SESSION_KEY);
            
            if (!userData) {
                userData = localStorage.getItem(TEMP_USER_KEY);
            }
            
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                } catch (e) {
                    // Handle old format (email string)
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    this.currentUser = users.find(u => u.email === userData);
                }
                
                console.log('[BookingsContext] User session loaded:', this.currentUser?.fullName);
            }
        } catch (error) {
            console.error('[BookingsContext] Error loading user session:', error);
        }
    }
    
    /**
     * Update user session
     */
    updateUserSession(user) {
        this.currentUser = user;
        
        if (user) {
            localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(USER_SESSION_KEY);
        }
        
        this.notifyObservers('user');
    }
    
    /**
     * Set selected date
     */
    setSelectedDate(date) {
        this.selectedDate = date;
        this.notifyObservers('selectedDate');
    }
    
    /**
     * Set selected lake
     */
    setSelectedLake(lake) {
        this.selectedLake = lake;
        this.notifyObservers('selectedLake');
    }
    
    /**
     * Set active booking
     */
    setActiveBooking(booking) {
        this.activeBooking = booking;
        this.notifyObservers('activeBooking');
    }
    
    /**
     * Subscribe to state changes (like React Context consumer)
     * @param {Function} callback - Called when state changes
     * @param {string[]} watchKeys - Keys to watch for changes (optional)
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback, watchKeys = null) {
        const observer = { callback, watchKeys };
        this.observers.push(observer);
        
        // Return unsubscribe function
        return () => {
            this.observers = this.observers.filter(obs => obs !== observer);
        };
    }
    
    /**
     * Notify observers of state changes (like React setState triggering re-render)
     */
    notifyObservers(changedKey) {
        this.observers.forEach(observer => {
            // If observer is watching specific keys, only notify if key matches
            if (observer.watchKeys && !observer.watchKeys.includes(changedKey)) {
                return;
            }
            
            try {
                observer.callback(changedKey, this.getState());
            } catch (error) {
                console.error('[BookingsContext] Error in observer callback:', error);
            }
        });
    }
    
    /**
     * Get current state (like React Context value)
     */
    getState() {
        return {
            bookings: this.bookings,
            currentUser: this.currentUser,
            selectedDate: this.selectedDate,
            selectedLake: this.selectedLake,
            activeBooking: this.activeBooking
        };
    }
    
    /**
     * Setup auto-save (like useEffect with dependencies)
     * Automatically persist when bookings or user changes
     */
    setupAutoSave() {
        // Save on bookings change (already handled in addBooking/removeBooking)
        
        // Periodic save every 30 seconds (like React useEffect with interval)
        setInterval(() => {
            this.clearExpired(); // Also clear expired bookings periodically
        }, 30000);
        
        console.log('[BookingsContext] Auto-save enabled');
    }
    
    /**
     * Setup visibility change listener
     * Save state when user navigates away or refreshes (like React useEffect cleanup)
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page is hidden, persist current state
                this.saveBookings();
                console.log('[BookingsContext] Persisted state on page hide');
            } else {
                // Page is visible again, reload fresh data
                this.loadBookings();
                this.loadUserSession();
                console.log('[BookingsContext] Reloaded state on page show');
            }
        });
        
        // Also save before unload
        window.addEventListener('beforeunload', () => {
            this.saveBookings();
        });
        
        console.log('[BookingsContext] Visibility listeners enabled');
    }
    
    /**
     * Format date to YYYY-MM-DD
     */
    formatDate(date) {
        if (!date) return '';
        
        const d = typeof date === 'string' ? new Date(date) : date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Debug: Log current state
     */
    debug() {
        console.log('[BookingsContext] Current State:', {
            bookings: this.bookings,
            currentUser: this.currentUser,
            selectedDate: this.selectedDate,
            selectedLake: this.selectedLake,
            activeBooking: this.activeBooking,
            observers: this.observers.length
        });
    }
}

// Create singleton instance (like React Context Provider)
const bookingsContext = new BookingsContext();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.BookingsContext = bookingsContext;
}

// Also export for ES modules
export default bookingsContext;

/**
 * Hook-like function to use the context (mimics React useContext)
 * Usage: const { bookings, currentUser } = useBookingsContext();
 */
export function useBookingsContext() {
    return bookingsContext.getState();
}

/**
 * Hook-like function to subscribe to changes (mimics React useEffect)
 * Usage: useBookingsEffect((key, state) => { console.log('State changed:', key); });
 */
export function useBookingsEffect(callback, watchKeys = null) {
    return bookingsContext.subscribe(callback, watchKeys);
}

console.log('[BookingsContext] Module loaded');























