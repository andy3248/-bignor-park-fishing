// Admin Calendar - Booking Management System

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;

// Get initials from name (helper function)
function getInitials(name) {
    if (!name) return 'U';
    if (name.includes('@')) return name.charAt(0).toUpperCase();
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Initialize calendar
function initializeCalendar() {
    console.log('=== INITIALIZING ADMIN CALENDAR ===');
    console.log('All bookings:', localStorage.getItem('allBookings'));
    console.log('Current user bookings:', Object.keys(localStorage).filter(k => k.includes('activeBooking')));
    renderCalendar(currentYear, currentMonth);
}

// Render calendar for given year and month
function renderCalendar(year, month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update month/year display
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Calculate calendar data
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const container = document.getElementById('calendarDatesContainer');
    container.innerHTML = '';
    
    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = daysInPrevMonth - i;
        const cell = createDateCell(year, month - 1, dayNum, true);
        container.appendChild(cell);
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = createDateCell(year, month, day, false);
        container.appendChild(cell);
    }
    
    // Next month's leading days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        const cell = createDateCell(year, month + 1, day, true);
        container.appendChild(cell);
    }
}

// Create individual date cell
function createDateCell(year, month, day, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'calendar-date-cell';
    
    if (isOtherMonth) {
        cell.classList.add('other-month');
    }
    
    // Normalize month
    let normalizedMonth = month;
    let normalizedYear = year;
    if (month < 0) {
        normalizedMonth = 11;
        normalizedYear--;
    } else if (month > 11) {
        normalizedMonth = 0;
        normalizedYear++;
    }
    
    const dateStr = `${normalizedYear}-${String(normalizedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check if date is past, today, or future
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const cellDate = new Date(dateStr + 'T12:00:00');
    const todayDate = new Date(todayStr + 'T12:00:00');
    
    if (cellDate < todayDate) {
        cell.classList.add('past-date');
    } else if (cellDate > todayDate) {
        cell.classList.add('future-date');
    } else {
        cell.classList.add('today');
    }
    
    // Date number
    const dateNum = document.createElement('div');
    dateNum.className = 'date-number';
    dateNum.textContent = day;
    cell.appendChild(dateNum);
    
    // Get bookings for this date
    if (!isOtherMonth) {
        const bookings = getBookingsForDate(dateStr);
        const counts = getBookingCountsForDate(dateStr);
        
        console.log(`Date ${dateStr}: Found ${bookings.length} bookings`, bookings);
        
        if (bookings.length > 0) {
            const bookingsContainer = document.createElement('div');
            bookingsContainer.className = 'date-bookings-list';
            
            // Show first 3 bookings
            const displayBookings = bookings.slice(0, 3);
            displayBookings.forEach(booking => {
                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const user = users.find(u => u.email === booking.userEmail);
                const userName = user ? (user.fullName || user.email) : booking.userEmail;
                const initials = getInitials(userName);
                const lakeName = booking.lakeName || booking.lake || '';
                const isMainLake = lakeName.includes('Main') || lakeName.includes('Bignor');
                
                console.log(`Creating booking item for ${userName}, lake: ${lakeName}, initials: ${initials}`);
                
                const bookingItem = document.createElement('div');
                bookingItem.className = `date-booking-item ${isMainLake ? 'main-lake' : 'wood-pool'}`;
                bookingItem.innerHTML = `
                    <span class="booking-initials">${initials}</span>
                    <span class="booking-name">${userName.split(' ')[0] || userName.substring(0, 8)}</span>
                `;
                bookingsContainer.appendChild(bookingItem);
            });
            
            // Show count if more than 3
            if (bookings.length > 3) {
                const moreItem = document.createElement('div');
                moreItem.className = 'date-booking-more';
                moreItem.textContent = `+${bookings.length - 3} more`;
                bookingsContainer.appendChild(moreItem);
            }
            
            cell.appendChild(bookingsContainer);
            cell.classList.add('has-bookings');
        }
        
        // Add click handler
        cell.addEventListener('click', () => openDateModal(dateStr));
        cell.style.cursor = 'pointer';
    }
    
    return cell;
}

// Get booking counts for a specific date
function getBookingCountsForDate(dateStr) {
    const counts = {
        mainLake: 0,
        woodPool: 0
    };
    
    try {
        // Get all bookings from localStorage
        const allBookings = JSON.parse(localStorage.getItem('allBookings') || '[]');
        
        allBookings.forEach(booking => {
            if (booking.date === dateStr) {
                const lakeName = booking.lakeName || booking.lake || '';
                if (lakeName.includes('Main') || lakeName.includes('Bignor')) {
                    counts.mainLake++;
                } else if (lakeName.includes('Wood') || lakeName.includes('Pool')) {
                    counts.woodPool++;
                }
            }
        });
        
    } catch (error) {
        console.error('Error getting booking counts:', error);
    }
    
    return counts;
}

// Get all bookings for a specific date
function getBookingsForDate(dateStr) {
    try {
        const allBookings = JSON.parse(localStorage.getItem('allBookings') || '[]');
        console.log('All bookings in system:', allBookings);
        console.log('Filtering for date:', dateStr);
        const filtered = allBookings.filter(booking => {
            console.log(`Comparing booking.date "${booking.date}" with "${dateStr}"`);
            return booking.date === dateStr;
        });
        console.log('Filtered bookings:', filtered);
        return filtered;
    } catch (error) {
        console.error('Error getting bookings for date:', error);
        return [];
    }
}

// Open modal with date's bookings
function openDateModal(dateStr) {
    selectedDate = dateStr;
    const bookings = getBookingsForDate(dateStr);
    
    // Format date for display
    const date = new Date(dateStr + 'T12:00:00');
    const formattedDate = date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    document.getElementById('selectedDateDisplay').textContent = formattedDate;
    
    const container = document.getElementById('modalBookingsContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; padding: 40px; color: #6c757d;">
                No bookings for this date.
            </p>
        `;
    } else {
        container.innerHTML = bookings.map(booking => createBookingCard(booking)).join('');
    }
    
    // Load maintenance reports for this date
    const maintenanceReports = getMaintenanceForDate(dateStr);
    const maintenanceContainer = document.getElementById('modalMaintenanceContainer');
    
    if (maintenanceReports.length > 0) {
        maintenanceContainer.innerHTML = maintenanceReports.map(report => createMaintenanceCardInModal(report)).join('');
    } else {
        maintenanceContainer.innerHTML = '<p class="no-maintenance">No maintenance reports for this date.</p>';
    }
    
    document.getElementById('dateBookingsModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Create booking card HTML
function createBookingCard(booking) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === booking.userEmail);
    
    const userName = user ? (user.fullName || user.email) : booking.userEmail;
    const userEmail = booking.userEmail;
    const initials = getInitials(userName);
    
    const lakeName = booking.lakeName || booking.lake || 'Unknown Lake';
    const lakeClass = lakeName.includes('Main') ? 'main-lake' : 'wood-pool';
    
    const startTime = booking.startUtc ? new Date(booking.startUtc).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    }) : '00:00';
    
    return `
        <div class="booking-detail-card">
            <div class="booking-user-info">
                <div class="user-avatar">${initials}</div>
                <div class="user-details">
                    <strong>${userName}</strong>
                    <span>${userEmail}</span>
                </div>
            </div>
            <div class="booking-lake-info">
                <span class="lake-badge-modal ${lakeClass}">${lakeName}</span>
                <span class="time-info">${startTime} UTC - 24hrs</span>
            </div>
            ${booking.notes ? `<div class="booking-notes-display"><strong>Notes:</strong> ${booking.notes}</div>` : ''}
            <button class="cancel-booking-btn" onclick="cancelUserBooking('${booking.id}', '${userEmail}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Cancel Booking
            </button>
        </div>
    `;
}

// Cancel user booking
function cancelUserBooking(bookingId, userEmail) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Remove from allBookings
        let allBookings = JSON.parse(localStorage.getItem('allBookings') || '[]');
        allBookings = allBookings.filter(b => b.id !== bookingId);
        localStorage.setItem('allBookings', JSON.stringify(allBookings));
        
        // Remove from user's active booking if it matches
        const activeBookingKey = `activeBooking_${userEmail}`;
        const activeBooking = localStorage.getItem(activeBookingKey);
        if (activeBooking) {
            try {
                const parsed = JSON.parse(activeBooking);
                if (parsed.id === bookingId) {
                    localStorage.removeItem(activeBookingKey);
                }
            } catch (e) {}
        }
        
        // Clear ActiveBookingSystem if it exists
        if (window.ActiveBookingSystem && window.ActiveBookingSystem.clearBooking) {
            window.ActiveBookingSystem.clearBooking(userEmail);
        }
        
        // Refresh calendar
        renderCalendar(currentYear, currentMonth);
        
        // Refresh modal
        if (selectedDate) {
            openDateModal(selectedDate);
        }
        
        alert('Booking cancelled successfully!');
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking. Please try again.');
    }
}

// Close date modal
function closeDateModal() {
    document.getElementById('dateBookingsModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    selectedDate = null;
}

// Navigate to previous month
function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentYear, currentMonth);
}

// Navigate to next month
function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar(currentYear, currentMonth);
}

// Get maintenance reports for a specific date
function getMaintenanceForDate(dateStr) {
    try {
        const allReports = JSON.parse(localStorage.getItem('maintenanceReports') || '[]');
        return allReports.filter(report => report.date === dateStr);
    } catch (error) {
        console.error('Error getting maintenance reports:', error);
        return [];
    }
}

// Create maintenance card HTML for modal
function createMaintenanceCardInModal(report) {
    const date = new Date(report.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const statusClass = report.status || 'completed';
    const statusText = statusClass.charAt(0).toUpperCase() + statusClass.slice(1).replace('-', ' ');
    
    return `
        <div class="maintenance-card-modal ${statusClass}">
            <div class="maintenance-modal-header">
                <div class="maintenance-modal-date">${formattedDate}</div>
                <div class="maintenance-modal-status ${statusClass}">${statusText}</div>
            </div>
            <h4 class="maintenance-modal-title">${report.lake} - ${report.title}</h4>
            <p class="maintenance-modal-description">${report.description}</p>
        </div>
    `;
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('dateBookingsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDateModal();
            }
        });
    }
});

