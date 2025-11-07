// Admin Login Logs Management

// Check admin authentication
if (!isAdmin()) {
    alert('Access denied. Admin privileges required.');
    window.location.href = '../index.html';
}

// Load admin name
document.addEventListener('DOMContentLoaded', function() {
    const adminUser = JSON.parse(localStorage.getItem('currentUser'));
    if (adminUser) {
        document.getElementById('adminName').textContent = adminUser.fullName;
    }
    
    // Load and display logs
    loadLogs();
    
    // Auto-refresh every 30 seconds
    setInterval(loadLogs, 30000);
});

// Load all login logs
function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('login_activity_log') || '[]');
    
    // Update stats
    updateStats(logs);
    
    // Display logs
    displayLogs(logs);
}

// Update statistics
function updateStats(logs) {
    const totalLogins = logs.length;
    const successfulLogins = logs.filter(log => log.success).length;
    const failedLogins = logs.filter(log => !log.success).length;
    
    document.getElementById('totalLogins').textContent = totalLogins;
    document.getElementById('successfulLogins').textContent = successfulLogins;
    document.getElementById('failedLogins').textContent = failedLogins;
}

// Display logs in table
function displayLogs(logs) {
    const tbody = document.getElementById('logsTableBody');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No login logs available</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp);
        const formattedDate = timestamp.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const formattedTime = timestamp.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusBadge = log.success 
            ? '<span class="status-badge success">Success</span>'
            : '<span class="status-badge failed">Failed</span>';
        
        const userTypeBadge = log.userType === 'admin'
            ? '<span class="user-type-badge admin">Admin</span>'
            : '<span class="user-type-badge member">Member</span>';
        
        // Extract browser name
        const browserName = getBrowserName(log.browser);
        
        return `
            <tr class="${log.success ? '' : 'failed-attempt'}">
                <td>
                    <div class="timestamp-cell">
                        <div class="date">${formattedDate}</div>
                        <div class="time">${formattedTime}</div>
                    </div>
                </td>
                <td><span class="email-cell">${escapeHtml(log.email)}</span></td>
                <td>${escapeHtml(log.fullName)}</td>
                <td>${userTypeBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <div class="browser-cell">
                        <div class="browser-name">${browserName}</div>
                        <div class="platform">${log.platform || 'Unknown'}</div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter logs based on criteria
function filterLogs() {
    const searchEmail = document.getElementById('searchEmail').value.toLowerCase();
    const filterUserType = document.getElementById('filterUserType').value;
    const filterSuccess = document.getElementById('filterSuccess').value;
    
    const allLogs = JSON.parse(localStorage.getItem('login_activity_log') || '[]');
    
    const filteredLogs = allLogs.filter(log => {
        // Email search
        if (searchEmail && !log.email.toLowerCase().includes(searchEmail)) {
            return false;
        }
        
        // User type filter
        if (filterUserType !== 'all' && log.userType !== filterUserType) {
            return false;
        }
        
        // Success filter
        if (filterSuccess !== 'all' && log.success.toString() !== filterSuccess) {
            return false;
        }
        
        return true;
    });
    
    // Update stats and display
    updateStats(filteredLogs);
    displayLogs(filteredLogs);
}

// Export logs to CSV
function exportLogs() {
    const logs = JSON.parse(localStorage.getItem('login_activity_log') || '[]');
    
    if (logs.length === 0) {
        alert('No logs to export');
        return;
    }
    
    // Create CSV content
    const headers = ['Timestamp', 'Email', 'Full Name', 'User Type', 'Status', 'Browser', 'Platform'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
        const row = [
            log.timestamp,
            `"${log.email}"`,
            `"${log.fullName}"`,
            log.userType,
            log.success ? 'Success' : 'Failed',
            `"${log.browser || ''}"`,
            log.platform || ''
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `login_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[AdminLogs] Exported', logs.length, 'logs');
}

// Get browser name from user agent
function getBrowserName(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'Internet Explorer';
    
    return 'Other';
}

// Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

console.log('[AdminLogs] Login logs module loaded');





