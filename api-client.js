/**
 * API Client for Bignor Park Fishing App
 * Handles all communication with the backend API
 */

// API Configuration - Automatically detects environment
const API_CONFIG = {
    // Automatically uses production API if on Render, localhost otherwise
    baseURL: window.location.hostname.includes('onrender.com') 
        ? 'https://bignor-park-fishing.onrender.com/api'  // PRODUCTION
        : 'http://localhost:3000/api',                    // LOCAL DEVELOPMENT
    timeout: 10000
};

// Token management
const TOKEN_KEY = 'bignor_auth_token';

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// HTTP request helper
async function request(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    // Add authorization header if token exists
    const token = getToken();
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add body if present
    if (options.body && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        
        // Parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        // Handle errors
        if (!response.ok) {
            const error = new Error(data.message || 'An error occurred');
            error.status = response.status;
            error.data = data;
            throw error;
        }
        
        return data;
    } catch (error) {
        // Network error or parsing error
        if (!error.status) {
            console.error('Network error:', error);
            throw new Error('Unable to connect to server. Please check your internet connection.');
        }
        throw error;
    }
}

// ============================================
// AUTHENTICATION API
// ============================================

const authAPI = {
    /**
     * Sign up new user
     */
    async signup(userData) {
        const response = await request('/auth/signup', {
            method: 'POST',
            body: userData
        });
        
        if (response.token) {
            setToken(response.token);
        }
        
        return response;
    },
    
    /**
     * Login user (member)
     */
    async login(credentials) {
        const response = await request('/auth/login', {
            method: 'POST',
            body: credentials
        });
        
        if (response.token) {
            setToken(response.token);
        }
        
        return response;
    },
    
    /**
     * Login admin (no fishing code required)
     */
    async adminLogin(credentials) {
        const response = await request('/auth/admin-login', {
            method: 'POST',
            body: credentials
        });
        
        if (response.token) {
            setToken(response.token);
        }
        
        return response;
    },
    
    /**
     * Get current user
     */
    async getCurrentUser() {
        return await request('/auth/me');
    },
    
    /**
     * Logout
     */
    async logout() {
        try {
            await request('/auth/logout', { method: 'POST' });
        } finally {
            removeToken();
            localStorage.removeItem('currentUser'); // Clean up old localStorage
        }
    },
    
    /**
     * Verify token
     */
    async verifyToken() {
        try {
            return await request('/auth/verify', { method: 'POST' });
        } catch (error) {
            removeToken();
            throw error;
        }
    }
};

// ============================================
// BOOKING API
// ============================================

const bookingAPI = {
    /**
     * Create new booking
     */
    async createBooking(bookingData) {
        return await request('/bookings', {
            method: 'POST',
            body: bookingData
        });
    },
    
    /**
     * Get user's bookings
     */
    async getMyBookings(limit = 50) {
        return await request(`/bookings/my?limit=${limit}`);
    },
    
    /**
     * Get user's active booking
     */
    async getActiveBooking() {
        return await request('/bookings/active');
    },
    
    /**
     * Get specific booking
     */
    async getBooking(bookingId) {
        return await request(`/bookings/${bookingId}`);
    },
    
    /**
     * Cancel booking
     */
    async cancelBooking(bookingId) {
        return await request(`/bookings/${bookingId}`, {
            method: 'DELETE'
        });
    },
    
    /**
     * Check lake availability
     */
    async checkAvailability(lakeId, date) {
        return await request(`/bookings/check-availability/${lakeId}/${date}`);
    }
};

// ============================================
// LAKE API
// ============================================

const lakeAPI = {
    /**
     * Get all lakes
     */
    async getAllLakes() {
        return await request('/lakes');
    },
    
    /**
     * Get specific lake
     */
    async getLake(lakeId) {
        return await request(`/lakes/${lakeId}`);
    },
    
    /**
     * Get lake availability for specific date
     */
    async getLakeAvailability(lakeId, date) {
        return await request(`/lakes/${lakeId}/availability/${date}`);
    },
    
    /**
     * Get lake availability for date range
     */
    async getLakeAvailabilityRange(lakeId, startDate, endDate) {
        return await request(`/lakes/${lakeId}/availability?startDate=${startDate}&endDate=${endDate}`);
    }
};

// ============================================
// USER API
// ============================================

const userAPI = {
    /**
     * Get user profile
     */
    async getProfile() {
        return await request('/users/profile');
    },
    
    /**
     * Update user profile
     */
    async updateProfile(updates) {
        return await request('/users/profile', {
            method: 'PUT',
            body: updates
        });
    },
    
    /**
     * Change password
     */
    async changePassword(currentPassword, newPassword) {
        return await request('/users/password', {
            method: 'PUT',
            body: { currentPassword, newPassword }
        });
    }
};

// ============================================
// ADMIN API
// ============================================

const adminAPI = {
    /**
     * Get all bookings (admin)
     */
    async getAllBookings(filters = {}) {
        const params = new URLSearchParams(filters);
        return await request(`/admin/bookings?${params}`);
    },
    
    /**
     * Get booking statistics
     */
    async getBookingStats() {
        return await request('/admin/bookings/stats');
    },
    
    /**
     * Cancel any booking (admin)
     */
    async cancelBooking(bookingId) {
        return await request(`/admin/bookings/${bookingId}`, {
            method: 'DELETE'
        });
    },
    
    /**
     * Get all users
     */
    async getAllUsers() {
        return await request('/admin/users');
    },
    
    /**
     * Get specific user
     */
    async getUser(userId) {
        return await request(`/admin/users/${userId}`);
    },
    
    /**
     * Update user (admin)
     */
    async updateUser(userId, updates) {
        return await request(`/admin/users/${userId}`, {
            method: 'PUT',
            body: updates
        });
    },
    
    /**
     * Create new user (admin)
     */
    async createUser(userData) {
        return await request('/admin/users', {
            method: 'POST',
            body: userData
        });
    },
    
    /**
     * Expire old bookings
     */
    async expireBookings() {
        return await request('/admin/expire-bookings', {
            method: 'POST'
        });
    },
    
    /**
     * Get dashboard statistics
     */
    async getDashboard() {
        return await request('/admin/dashboard');
    }
};

// ============================================
// HEALTH CHECK
// ============================================

async function checkHealth() {
    return await request('/health');
}

// Export API
window.BignorAPI = {
    auth: authAPI,
    bookings: bookingAPI,
    lakes: lakeAPI,
    users: userAPI,
    admin: adminAPI,
    health: checkHealth,
    
    // Config
    config: API_CONFIG,
    
    // Token management
    getToken,
    setToken,
    removeToken
};

// Log initialization
console.log('✅ Bignor Park API Client initialized');
console.log(`📡 API Base URL: ${API_CONFIG.baseURL}`);

