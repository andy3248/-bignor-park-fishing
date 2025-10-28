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



// Initialize local storage for users if not exists
function initStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const fishingCode = document.getElementById('fishingCode').value;
        
        // Check if this is an admin login attempt (no fishing code or empty)
        if (!fishingCode || fishingCode.trim() === '') {
            // Try admin login
            const adminAccounts = [
                {
                    email: 'admin@bignorpark.com',
                    password: 'admin123',
                    fullName: 'Admin User',
                    role: 'admin'
                },
                {
                    email: 'michael@bignorpark.com',
                    password: 'michael123',
                    fullName: 'Michael Boyle',
                    role: 'admin'
                },
                {
                    email: 'ross-regencycarpets@hotmail.com',
                    password: 'Bignor4877',
                    fullName: 'Ross',
                    role: 'admin'
                }
            ];
            
            const admin = adminAccounts.find(acc =>
                acc.email.toLowerCase() === email.toLowerCase() &&
                acc.password === password
            );
            
            if (admin) {
                // Store admin session
                const adminSession = {
                    email: admin.email,
                    fullName: admin.fullName,
                    role: admin.role,
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(adminSession));
                localStorage.setItem('adminSession', JSON.stringify(adminSession));
                
                // Log the login activity
                logUserLoginActivity(admin.email, admin.fullName, 'admin', true);
                
                showMessage('Admin login successful! Redirecting...', 'success');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1500);
                return;
            }
            
            // If not admin, show error
            logUserLoginActivity(email, 'Unknown', 'admin', false);
            showMessage('Invalid credentials. Members must enter fishing code.', 'error');
            return;
        }
        
        // Verify fishing code for member login
        if (fishingCode !== '1187') {
            showMessage('Invalid fishing code. Access denied.', 'error');
            return;
        }
        
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Find user
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Clear any temporary user data
            localStorage.removeItem('tempUserData');
            
            // Store current user
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Log the login activity
            logUserLoginActivity(user.email, user.fullName, 'member', true);
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to home page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            // Log failed login attempt
            logUserLoginActivity(email, 'Unknown', 'member', false);
            showMessage('Invalid email or password.', 'error');
        }
    });
}

// Signup form handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('signupPassword').value;
        const terms = document.getElementById('terms').checked;
        
        // Validate terms acceptance
        if (!terms) {
            showMessage('Please accept the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        // Validate password strength
        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long!', 'error');
            return;
        }
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            showMessage('Email already registered!', 'error');
            return;
        }
        
        // Create user object
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            phone: phone || 'Not provided',
            password,
            createdAt: new Date().toISOString()
        };
        
        // Save user
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        showMessage('Account created successfully! Redirecting to login...', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
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

// Initialize storage on load
initStorage();

// Clear any existing user session when landing on login page
// This ensures clean state for new login
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData'); // Clear temporary user data too
} 