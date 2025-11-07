// Admin Authentication Module

// Admin credentials (In production, this should be handled server-side)
const ADMIN_ACCOUNTS = [
    {
        email: 'admin@bignorpark.com',
        password: 'admin123', // In production, use hashed passwords
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

// Login admin
function loginAdmin(email, password) {
    const admin = ADMIN_ACCOUNTS.find(acc =>
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
        logLoginActivity(admin.email, admin.fullName, 'admin', true);
        
        console.log('[Admin] Login successful:', admin.email);
        return true;
    }

    // Log failed login attempt
    logLoginActivity(email, 'Unknown', 'admin', false);
    
    console.log('[Admin] Login failed for:', email);
    return false;
}

// Log login activity
function logLoginActivity(email, fullName, userType, success) {
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

// Check if user is admin
function isAdmin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return currentUser && currentUser.role === 'admin';
}

// Require admin access (redirect if not admin)
function requireAdmin() {
    if (!isAdmin()) {
        alert('Access denied. Admin privileges required.');
        window.location.href = '../index.html';
        return false;
    }
    return true;
}

// Logout admin
function logoutAdmin() {
    localStorage.removeItem('adminSession');
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Get current admin
function getCurrentAdmin() {
    return JSON.parse(localStorage.getItem('adminSession') || 'null');
}

// Expose functions to window
window.loginAdmin = loginAdmin;
window.isAdmin = isAdmin;
window.requireAdmin = requireAdmin;
window.logoutAdmin = logoutAdmin;
window.getCurrentAdmin = getCurrentAdmin;
