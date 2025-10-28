// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadRecentActivity();

    // Refresh data every 30 seconds
    setInterval(loadDashboardData, 30000);
});

// Load dashboard statistics
function loadDashboardData() {
    try {
        // Get bookings
        const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
        const today = new Date().toISOString().split('T')[0];

        // Calculate today's bookings
        const todayBookings = bookings.filter(b => {
            if (b.status === 'cancelled') return false;

            const bookingStart = new Date(b.date + 'T00:00:00');
            const bookingEnd = new Date(bookingStart.getTime() + (24 * 60 * 60 * 1000));
            const now = new Date();

            // Check if booking is active today
            return b.date === today || (now >= bookingStart && now < bookingEnd);
        });

        document.getElementById('todayBookingsCount').textContent = todayBookings.length;

        // Count by lake
        const mainLakeBookings = todayBookings.filter(b =>
            b.lake === 'bignor' || b.lake === 'bignor-main' || b.lakeName === 'Bignor Main Lake'
        ).length;

        const woodPoolBookings = todayBookings.filter(b =>
            b.lake === 'wood' || b.lake === 'wood-pool' || b.lakeName === 'Wood Pool'
        ).length;

        document.getElementById('mainLakeCount').textContent = mainLakeBookings;
        document.getElementById('woodPoolCount').textContent = woodPoolBookings;

        // Count members
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        document.getElementById('totalMembersCount').textContent = users.length;

    } catch (error) {
        console.error('[Admin] Error loading dashboard data:', error);
    }
}

// Load recent activity
function loadRecentActivity() {
    try {
        const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');

        // Sort by creation time (most recent first)
        const recentBookings = bookings
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // Show last 10 activities

        const tableBody = document.getElementById('recentActivityTable');

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

    } catch (error) {
        console.error('[Admin] Error loading recent activity:', error);
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
    const bookingDate = new Date(booking.date + 'T00:00:00');
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
