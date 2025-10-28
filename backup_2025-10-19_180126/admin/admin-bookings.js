// Admin Bookings Management

let allBookings = [];
let filteredBookings = [];
let bookingToCancel = null;

document.addEventListener('DOMContentLoaded', function() {
    loadAllBookings();
});

// Load all bookings
function loadAllBookings() {
    try {
        const stored = localStorage.getItem('bignor_park_bookings');
        allBookings = stored ? JSON.parse(stored) : [];
        filteredBookings = [...allBookings];

        renderBookingsTable();
    } catch (error) {
        console.error('[Admin] Error loading bookings:', error);
    }
}

// Filter bookings
function filterBookings() {
    const dateFilter = document.getElementById('filterDate').value;
    const lakeFilter = document.getElementById('filterLake').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const userFilter = document.getElementById('filterUser').value.toLowerCase().trim();

    filteredBookings = allBookings.filter(booking => {
        // Date filter
        if (dateFilter && booking.date !== dateFilter) return false;

        // Lake filter
        if (lakeFilter !== 'all') {
            const lakeMatch =
                (lakeFilter === 'bignor' && (booking.lake === 'bignor' || booking.lake === 'bignor-main' || booking.lakeName === 'Bignor Main Lake')) ||
                (lakeFilter === 'wood' && (booking.lake === 'wood' || booking.lake === 'wood-pool' || booking.lakeName === 'Wood Pool'));

            if (!lakeMatch) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && booking.status !== statusFilter) return false;

        // User filter
        if (userFilter && !booking.userId.toLowerCase().includes(userFilter)) return false;

        return true;
    });

    renderBookingsTable();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterLake').value = 'all';
    document.getElementById('filterStatus').value = 'all';
    document.getElementById('filterUser').value = '';

    filteredBookings = [...allBookings];
    renderBookingsTable();
}

// Render bookings table
function renderBookingsTable() {
    const tableBody = document.getElementById('bookingsTableBody');
    const countSpan = document.getElementById('bookingsCount');

    countSpan.textContent = filteredBookings.length;

    if (filteredBookings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                    No bookings found matching the filters
                </td>
            </tr>
        `;
        return;
    }

    // Sort by date (most recent first)
    const sortedBookings = filteredBookings.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    tableBody.innerHTML = sortedBookings.map(booking => {
        const bookingDate = new Date(booking.date + 'T00:00:00');
        const createdDate = new Date(booking.createdAt);

        const dateStr = bookingDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const createdStr = createdDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusBadge = getStatusBadge(booking.status);
        const shortId = booking.id.substring(0, 8);

        return `
            <tr>
                <td><code>${shortId}</code></td>
                <td>
                    <div style="font-weight: 600; color: #2c3e50;">${booking.userName || 'Unknown'}</div>
                    <div style="font-size: 0.85rem; color: #6c757d;">${booking.userId}</div>
                </td>
                <td>${booking.lakeName || 'Unknown'}</td>
                <td>${dateStr}</td>
                <td>${createdStr}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="viewBookingDetails('${booking.id}')" class="admin-action-btn primary" title="View Details">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `
                        <button onclick="openCancelModal('${booking.id}')" class="admin-action-btn danger" title="Cancel Booking">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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

// View booking details
function viewBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) {
        alert('Booking not found');
        return;
    }

    const bookingDate = new Date(booking.date + 'T00:00:00');
    const createdDate = new Date(booking.createdAt);

    const details = `
Booking ID: ${booking.id}

User: ${booking.userName || 'Unknown'}
Email: ${booking.userId}

Lake: ${booking.lakeName}
Date: ${bookingDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Status: ${booking.status.toUpperCase()}

Created: ${createdDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
})}

Notes: ${booking.notes || 'No notes provided'}
    `.trim();

    alert(details);
}

// Open cancel modal
function openCancelModal(bookingId) {
    bookingToCancel = bookingId;
    document.getElementById('cancelModal').style.display = 'flex';
}

// Close cancel modal
function closeCancelModal() {
    bookingToCancel = null;
    document.getElementById('cancelModal').style.display = 'none';
}

// Confirm cancel booking
function confirmCancelBooking() {
    if (!bookingToCancel) return;

    try {
        const booking = allBookings.find(b => b.id === bookingToCancel);
        if (booking) {
            booking.status = 'cancelled';
            localStorage.setItem('bignor_park_bookings', JSON.stringify(allBookings));

            loadAllBookings();
            filterBookings();
            closeCancelModal();

            alert('Booking cancelled successfully');
        }
    } catch (error) {
        console.error('[Admin] Error cancelling booking:', error);
        alert('Error cancelling booking. Please try again.');
    }
}

// Expose functions to window
window.filterBookings = filterBookings;
window.clearFilters = clearFilters;
window.viewBookingDetails = viewBookingDetails;
window.openCancelModal = openCancelModal;
window.closeCancelModal = closeCancelModal;
window.confirmCancelBooking = confirmCancelBooking;
