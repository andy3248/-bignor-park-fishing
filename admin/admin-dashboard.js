// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're using the new calendar-based dashboard
    if (document.getElementById('calendarDatesContainer')) {
        console.log('[Admin] Using new calendar-based dashboard');
        return; // Skip old dashboard loading
    }
    
    loadDashboardData();
    loadRecentActivity();

    // Refresh data every 30 seconds
    setInterval(loadDashboardData, 30000);
});

// Load dashboard statistics from API
async function loadDashboardData() {
    // Check if elements exist (for old dashboard)
    if (!document.getElementById('todayBookingsCount')) {
        console.log('[Admin] Dashboard elements not found - using calendar view');
        return;
    }
    
    try {
        console.log('[Admin] Loading dashboard data from API...');
        
        // Get dashboard stats from API
        const response = await BignorAPI.admin.getDashboard();
        const stats = response.stats;
        
        // Update today's bookings count
        const todayBookings = stats.activeBookings + stats.upcomingBookings;
        document.getElementById('todayBookingsCount').textContent = todayBookings;

        // Get all bookings to count by lake
        const bookingsResponse = await BignorAPI.admin.getAllBookings({});
        const today = new Date().toISOString().split('T')[0];
        
        const todayBookingsList = bookingsResponse.bookings.filter(b => 
            b.bookingDate === today && b.status !== 'cancelled'
        );
        
        // Count by lake
        const mainLakeBookings = todayBookingsList.filter(b =>
            b.lakeName && b.lakeName.toLowerCase().includes('bignor')
        ).length;

        const woodPoolBookings = todayBookingsList.filter(b =>
            b.lakeName && (b.lakeName.toLowerCase().includes('wood') || b.lakeName.toLowerCase().includes('pool'))
        ).length;

        document.getElementById('mainLakeCount').textContent = mainLakeBookings;
        document.getElementById('woodPoolCount').textContent = woodPoolBookings;

        // Display total members
        document.getElementById('totalMembersCount').textContent = stats.totalUsers || 0;
        
        console.log('[Admin] Dashboard data loaded successfully');

    } catch (error) {
        console.error('[Admin] Error loading dashboard data from API:', error);
        // Show error in UI elements
        if (document.getElementById('todayBookingsCount')) {
            document.getElementById('todayBookingsCount').textContent = 'Error';
        }
    }
}

// Load recent activity from API
async function loadRecentActivity() {
    const tableBody = document.getElementById('recentActivityTable');
    if (!tableBody) {
        console.log('[Admin] Recent activity table not found - using calendar view');
        return;
    }
    
    try {
        console.log('[Admin] Loading recent activity from API...');
        
        // Get recent bookings from API
        const response = await BignorAPI.admin.getAllBookings({});
        const bookings = response.bookings || [];

        // Sort by creation time (most recent first)
        const recentBookings = bookings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // Show last 10 activities

        if (recentBookings.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #6c757d;">
                        No recent activity found
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = recentBookings.map(booking => {
            const createdDate = new Date(booking.createdAt);
            const timestamp = formatTimestamp(createdDate);
            const action = getActionText(booking);
            const statusBadge = getStatusBadge(booking.status);

            return `
                <tr>
                    <td>${timestamp}</td>
                    <td>${statusBadge}</td>
                    <td>${booking.userName || 'Unknown'}</td>
                    <td>${booking.lakeName || 'Unknown Lake'}</td>
                    <td>${action}</td>
                </tr>
            `;
        }).join('');
        
        console.log('[Admin] Recent activity loaded successfully');

    } catch (error) {
        console.error('[Admin] Error loading recent activity from API:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #e74c3c;">
                    <strong>Error loading recent activity</strong><br>
                    ${error.message || 'Unable to connect to server'}
                </td>
            </tr>
        `;
    }
}

// Format timestamp
function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get action text
function getActionText(booking) {
    const dateField = booking.bookingDate || booking.date;
    const bookingDate = new Date(dateField + 'T00:00:00');
    const dateStr = bookingDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    if (booking.status === 'cancelled') {
        return `Cancelled booking for ${dateStr}`;
    } else if (booking.status === 'completed') {
        return `Completed session on ${dateStr}`;
    } else {
        return `Booked ${booking.lakeName} for ${dateStr}`;
    }
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        'upcoming': '<span class="admin-badge info">Upcoming</span>',
        'active': '<span class="admin-badge warning">Active</span>',
        'completed': '<span class="admin-badge success">Completed</span>',
        'cancelled': '<span class="admin-badge danger">Cancelled</span>'
    };

    return badges[status] || '<span class="admin-badge">Unknown</span>';
}

// ============================================
// ADMIN BOOKING MANAGEMENT FUNCTIONS
// ============================================

// Render admin bookings table from API
async function renderAdminBookingsTable() {
    const container = document.getElementById('adminBookingsTableContainer');
    if (!container) {
        console.error('[Admin] Bookings container not found');
        return;
    }
    
    try {
        console.log('[Admin] Loading bookings for table from API...');
        
        // Get all bookings from API
        const response = await BignorAPI.admin.getAllBookings({});
        const allBookings = response.bookings || [];
        
        // Filter out expired and cancelled bookings
        const now = Date.now();
        const activeBookings = allBookings.filter(booking => {
            if (booking.status === 'cancelled') return false;
            
            // Check if booking date is in the future or today
            const bookingDate = new Date(booking.bookingDate + 'T00:00:00');
            const bookingEnd = bookingDate.getTime() + (24 * 60 * 60 * 1000);
            return bookingEnd > now;
        });
        
        // Sort by date (upcoming first)
        activeBookings.sort((a, b) => {
            const dateA = new Date(a.bookingDate);
            const dateB = new Date(b.bookingDate);
            return dateA - dateB;
        });
    
    if (activeBookings.length === 0) {
        container.innerHTML = `
            <div class="no-bookings-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 64px; height: 64px; stroke: #48d1cc; margin-bottom: 20px;">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <h4 style="color: #2c3e50; font-size: 1.2rem; margin: 0 0 10px 0;">No Active Bookings</h4>
                <p style="color: #6c757d; margin: 5px 0;">There are no active bookings at the moment.</p>
            </div>
        `;
        return;
    }
    
    // Build table HTML
    let tableHTML = `
        <div style="background: white; padding: 15px; margin-bottom: 15px; border-radius: 8px; border: 2px solid #48d1cc;">
            <strong style="color: #2c3e50; font-size: 1.1rem;">📊 ${activeBookings.length} Active Booking(s)</strong>
        </div>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Lake</th>
                    <th>User Name</th>
                    <th>Status</th>
                    <th>Start Time</th>
                    <th>Notes</th>
                    <th style="text-align: center;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Add rows for each booking
    activeBookings.forEach(booking => {
        const bookingDate = new Date(booking.bookingDate + 'T00:00:00');
        const startUtc = new Date(booking.startTime || booking.bookingDate + 'T00:00:00').getTime();
        const endUtc = new Date(booking.endTime || booking.bookingDate + 'T23:59:59').getTime();
        
        // Determine status
        let status = 'upcoming';
        let statusClass = 'info';
        let statusLabel = 'Upcoming';
        let statusIcon = '📅';
        
        if (now >= startUtc && now < endUtc) {
            status = 'active';
            statusClass = 'success';
            statusLabel = 'Active Now';
            statusIcon = '🎣';
        } else if (now < startUtc) {
            status = 'upcoming';
            statusClass = 'info';
            statusLabel = 'Upcoming';
            statusIcon = '📅';
        }
        
        const lakeName = booking.lakeName || 'Unknown Lake';
        const userName = booking.userName || 'Unknown User';
        const notes = booking.notes || '-';
        const startTime = new Date(startUtc).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC'
        });
        
        const bookingId = booking.bookingId || booking.id;
        
        tableHTML += `
            <tr>
                <td><strong>${booking.bookingDate}</strong></td>
                <td>${lakeName}</td>
                <td>${userName}</td>
                <td><span class="admin-badge ${statusClass}">${statusIcon} ${statusLabel}</span></td>
                <td>${startTime} UTC</td>
                <td>${notes}</td>
                <td style="text-align: center;">
                    <button class="admin-btn-danger-small" onclick="adminCancelBooking('${bookingId}', '${userName}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Cancel
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    console.log('[Admin] Bookings table rendered successfully');
    
    } catch (error) {
        console.error('[Admin] Error rendering bookings table:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e74c3c;">
                <strong>Error loading bookings</strong><br>
                ${error.message || 'Unable to connect to server'}
            </div>
        `;
    }
}

function getLakeNameAdmin(lakeSlug) {
    const lakeNames = {
        'bignor': 'Bignor Main Lake',
        'bignor-main': 'Bignor Main Lake',
        'wood': 'Wood Pool',
        'wood-pool': 'Wood Pool'
    };
    return lakeNames[lakeSlug] || lakeSlug;
}

// Open create booking modal
function openCreateBookingModal() {
    // Populate users dropdown
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userSelect = document.getElementById('adminSelectUser');
    
    if (!userSelect) return;
    
    userSelect.innerHTML = '<option value="">-- Choose a user --</option>';
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.email;
        option.textContent = `${user.fullName || user.email} (${user.email})`;
        userSelect.appendChild(option);
    });
    
    // Set minimum date to today
    const dateInput = document.getElementById('adminSelectDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
    
    // Show modal
    const modal = document.getElementById('createBookingModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close create booking modal
function closeCreateBookingModal() {
    const modal = document.getElementById('createBookingModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form
    document.getElementById('adminSelectUser').value = '';
    document.getElementById('adminSelectLake').value = '';
    document.getElementById('adminSelectDate').value = '';
    document.getElementById('adminBookingNotes').value = '';
}

// Admin create booking
function adminCreateBooking() {
    const userEmail = document.getElementById('adminSelectUser').value;
    const lake = document.getElementById('adminSelectLake').value;
    const date = document.getElementById('adminSelectDate').value;
    const notes = document.getElementById('adminBookingNotes').value;
    
    if (!userEmail || !lake || !date) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Get user details
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
        alert('User not found.');
        return;
    }
    
    // Check if user already has this lake+date booking
    const allBookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
    const existingBooking = allBookings.find(b =>
        b.userId === userEmail &&
        b.lake === lake &&
        b.date === date &&
        b.status !== 'cancelled'
    );
    
    if (existingBooking) {
        alert(`This user already has a booking for ${getLakeNameAdmin(lake)} on ${date}.`);
        return;
    }
    
    // Create booking
    const lakeName = getLakeNameAdmin(lake);
    const bookingDate = new Date(date);
    const startUtc = bookingDate.getTime();
    const endUtc = startUtc + (24 * 60 * 60 * 1000);
    
    const newBooking = {
        id: 'ADMIN-' + Date.now().toString(),
        userId: userEmail,
        userName: user.fullName || userEmail,
        lake: lake,
        lakeName: lakeName,
        date: date,
        notes: notes || 'Created by admin',
        status: 'upcoming',
        startUtc: startUtc,
        endUtc: endUtc,
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
    };
    
    // Save to storage
    allBookings.push(newBooking);
    localStorage.setItem('bignor_park_bookings', JSON.stringify(allBookings));
    
    // Also save to UTC system
    if (window.ActiveBookingSystem) {
        try {
            const utcBooking = {
                id: newBooking.id,
                userId: userEmail,
                userName: newBooking.userName,
                lakeSlug: lake === 'bignor' ? 'bignor-main' : 'wood-pool',
                lakeName: lakeName,
                startUtc: startUtc,
                endUtc: endUtc,
                bookedOnUtc: Date.now(),
                notes: notes || 'Created by admin'
            };
            
            window.ActiveBookingSystem.setActiveBooking(utcBooking);
            console.log('[Admin] Saved booking to UTC system:', utcBooking);
        } catch (error) {
            console.error('[Admin] Error saving to UTC system:', error);
        }
    }
    
    // Close modal
    closeCreateBookingModal();
    
    // Refresh tables
    renderAdminBookingsTable();
    loadDashboardData();
    loadRecentActivity();
    
    alert(`✅ Booking created successfully for ${user.fullName || userEmail}!\n\nLake: ${lakeName}\nDate: ${date}`);
}

// Admin cancel booking via API
async function adminCancelBooking(bookingId, userName) {
    if (!confirm(`Are you sure you want to cancel this booking for ${userName}?`)) {
        return;
    }
    
    try {
        console.log('[Admin] Cancelling booking via API:', bookingId);
        
        // Call API to cancel booking
        await BignorAPI.admin.cancelBooking(bookingId);
        
        console.log('[Admin] Booking cancelled successfully via API');
        
        // Refresh tables
        await renderAdminBookingsTable();
        await loadDashboardData();
        await loadRecentActivity();
        
        alert(`✅ Booking cancelled successfully for ${userName}.`);
        
    } catch (error) {
        console.error('[Admin] Error cancelling booking via API:', error);
        alert(error.message || '❌ Error cancelling booking. Please try again.');
    }
}

// Auto-refresh admin bookings table every 60 seconds
function startAdminBookingsAutoRefresh() {
    setInterval(function() {
        renderAdminBookingsTable();
        loadDashboardData();
    }, 60000); // 60 seconds
}

// Initialize admin bookings on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only run if old dashboard elements exist
    if (document.getElementById('adminBookingsTableContainer')) {
        setTimeout(function() {
            renderAdminBookingsTable();
            startAdminBookingsAutoRefresh();
        }, 500);
    }
});

// ============================================
// BACKUP EXPORT FUNCTION
// ============================================

function exportBackup() {
    try {
        // Collect all data from localStorage
        const backupData = {
            exportDate: new Date().toISOString(),
            exportedBy: getCurrentAdmin()?.fullName || 'Admin',
            version: '1.0',
            data: {
                users: JSON.parse(localStorage.getItem('users') || '[]'),
                bookings: JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]'),
                allBookings: JSON.parse(localStorage.getItem('allBookings') || '[]'),
                adminLoginLogs: JSON.parse(localStorage.getItem('adminLoginLogs') || '[]'),
                memberLoginLogs: JSON.parse(localStorage.getItem('memberLoginLogs') || '[]'),
                // Include any active bookings
                activeBookings: {}
            }
        };
        
        // Collect all activeBooking_ keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('activeBooking_')) {
                backupData.data.activeBookings[key] = JSON.parse(localStorage.getItem(key) || 'null');
            }
        }
        
        // Create JSON string
        const jsonString = JSON.stringify(backupData, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        a.download = `bignor-park-backup-${timestamp}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        alert(`✅ Backup exported successfully!\n\nFilename: bignor-park-backup-${timestamp}.json\n\nThis file contains:\n• ${backupData.data.users.length} users\n• ${backupData.data.bookings.length} bookings\n• Login logs\n• Active booking data\n\n⚠️ Store this backup file securely!`);
        
        // Log the export
        const logs = JSON.parse(localStorage.getItem('adminLoginLogs') || '[]');
        logs.unshift({
            timestamp: new Date().toISOString(),
            admin: getCurrentAdmin()?.fullName || 'Admin',
            action: 'Backup Export',
            success: true,
            message: `Exported ${backupData.data.users.length} users and ${backupData.data.bookings.length} bookings`
        });
        localStorage.setItem('adminLoginLogs', JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
        
    } catch (error) {
        console.error('[Admin] Error exporting backup:', error);
        alert('❌ Error exporting backup. Please try again.');
    }
}

// Expose functions to window
window.openCreateBookingModal = openCreateBookingModal;
window.closeCreateBookingModal = closeCreateBookingModal;
window.adminCreateBooking = adminCreateBooking;
window.adminCancelBooking = adminCancelBooking;
window.exportBackup = exportBackup;