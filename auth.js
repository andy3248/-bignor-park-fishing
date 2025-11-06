/**
 * Authentication Module - API-based
 * Handles login, signup, and authentication using the backend API
 * Requires: api-client.js to be loaded first
 */

// Password toggle functionality
function togglePassword(inputId) {
    const passwordInput = document.getElementById(inputId);
    const eyeIcon = document.getElementById(inputId + '-eye');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Check if user is authenticated
async function checkAuth() {
    const token = BignorAPI.getToken();
    if (!token) {
        return null;
    }
    
    try {
        const response = await BignorAPI.auth.getCurrentUser();
        return response.user;
    } catch (error) {
        console.error('Auth check failed:', error);
        BignorAPI.removeToken();
        return null;
    }
}

// Store user session info (for backward compatibility with existing pages)
function storeUserSession(user) {
    const session = {
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        profilePictureUrl: user.profilePictureUrl,
        role: user.isAdmin ? 'admin' : 'member',
        isAdmin: user.isAdmin,
        loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('currentUser', JSON.stringify(session));
    
    if (user.isAdmin) {
        localStorage.setItem('adminSession', JSON.stringify(session));
    }
}

// Login form handler - API-based
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const fishingCode = document.getElementById('fishingCode').value.trim();
        
        // Disable form during submission
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        try {
            let response;
            
            // Check if this is an admin login attempt (no fishing code or empty)
            if (!fishingCode || fishingCode === '') {
                // Try admin login
                response = await BignorAPI.auth.adminLogin({
                    email,
                    password
                });
                
                // Log the login activity
                logUserLoginActivity(email, response.user.firstName + ' ' + response.user.lastName, 'admin', true);
                
                // Store session
                storeUserSession(response.user);
                
                showMessage('Admin login successful! Redirecting...', 'success');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1500);
                
            } else {
                // Member login with fishing code
                response = await BignorAPI.auth.login({
                    email,
                    password,
                    fishingCode
                });
                
                // Log the login activity
                logUserLoginActivity(email, response.user.firstName + ' ' + response.user.lastName, 'member', true);
                
                // Store session
                storeUserSession(response.user);
                
                showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to home page
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Log failed login attempt
            logUserLoginActivity(email, 'Unknown', fishingCode ? 'member' : 'admin', false);
            
            // Show error message
            let errorMessage = 'Login failed. Please try again.';
            if (error.data && error.data.message) {
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
            
            // Re-enable form
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// Signup form handler - API-based
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('signupPassword').value;
        const fishingCode = document.getElementById('signupFishingCode')?.value.trim() || '';
        const terms = document.getElementById('terms').checked;
        
        // Validate terms acceptance
        if (!terms) {
            showMessage('Please accept the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        // Enhanced password validation function
        function validatePasswordStrength(password) {
            if (password.length < 6) {
                return { valid: false, message: 'Password must be at least 6 characters long!' };
            }
            return { valid: true };
        }
        
        // Validate password strength
        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.valid) {
            showMessage(passwordCheck.message, 'error');
            return;
        }
        
        // Split full name into first and last name
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];
        
        // Disable form during submission
        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Creating account...';
        
        try {
            const response = await BignorAPI.auth.signup({
                email,
                password,
                firstName,
                lastName,
                phone: phone || null,
                fishingCode
            });
            
            // Store session
            storeUserSession(response.user);
            
            showMessage('Account created successfully! Redirecting...', 'success');
            
            // Redirect to home page after 2 seconds
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
            
        } catch (error) {
            console.error('Signup error:', error);
            
            // Show error message
            let errorMessage = 'Signup failed. Please try again.';
            if (error.data && error.data.message) {
                errorMessage = error.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
            
            // Re-enable form
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 4 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        messageDiv.style.transform = 'translateX(100%)';
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 4000);
}

// Log user login activity
function logUserLoginActivity(email, fullName, userType, success) {
    try {
        const loginLog = {
            email: email,
            fullName: fullName,
            userType: userType, // 'admin' or 'member'
            success: success,
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            platform: navigator.platform
        };
        
        // Get existing logs
        let logs = JSON.parse(localStorage.getItem('login_activity_log') || '[]');
        
        // Add new log
        logs.unshift(loginLog);
        
        // Keep only last 200 logs
        if (logs.length > 200) {
            logs = logs.slice(0, 200);
        }
        
        // Save back to localStorage
        localStorage.setItem('login_activity_log', JSON.stringify(logs));
        
        console.log('[LoginLog] Activity logged:', email, success ? 'SUCCESS' : 'FAILED');
    } catch (error) {
        console.error('[LoginLog] Error logging activity:', error);
    }
}

// Clear any existing user session when landing on login page
// This ensures clean state for new login
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    BignorAPI.removeToken();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('tempUserData');
}

// Export functions for use in other scripts
window.BignorAuth = {
    checkAuth,
    storeUserSession,
    togglePassword,
    showMessage,
    logUserLoginActivity
}; 