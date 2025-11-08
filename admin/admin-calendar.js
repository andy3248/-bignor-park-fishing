// Admin Calendar - Booking Management System

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;
let allBookingsCache = []; // Cache for all bookings from API

// Load all bookings from API
async function loadAllBookings() {
    try {
        console.log('Loading all bookings from API...');
        const response = await BignorAPI.admin.getAllBookings({});
        allBookingsCache = response.bookings || [];
        console.log('Loaded', allBookingsCache.length, 'bookings from API');
        return allBookingsCache;
    } catch (error) {
        console.error('Error loading bookings from API:', error);
        allBookingsCache = [];
        return [];
    }
}

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

// Format name as "FirstName S." (helper function)
function formatNameWithInitial(name) {
    if (!name) return 'Unknown';
    if (name.includes('@')) return name.split('@')[0];
    
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        const firstName = parts[0];
        const surnameInitial = parts[parts.length - 1].charAt(0).toUpperCase();
        return `${firstName} ${surnameInitial}.`;
    }
    return name;
}

// Initialize calendar
async function initializeCalendar() {
    console.log('=== INITIALIZING ADMIN CALENDAR ===');
    // Load all bookings from API
    await loadAllBookings();
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
        
        console.log(`Date ${dateStr}: B:${counts.mainLake} W:${counts.woodPool}`, bookings);
        
        if (bookings.length > 0) {
            const badgesContainer = document.createElement('div');
            badgesContainer.className = 'date-count-badges';
            
            // Show Bignor Main count badge
            if (counts.mainLake > 0) {
                const bignorBadge = document.createElement('div');
                bignorBadge.className = 'lake-count-badge bignor-badge';
                bignorBadge.textContent = `B: ${counts.mainLake}`;
                badgesContainer.appendChild(bignorBadge);
            }
            
            // Show Wood Pool count badge
            if (counts.woodPool > 0) {
                const woodBadge = document.createElement('div');
                woodBadge.className = 'lake-count-badge wood-badge';
                woodBadge.textContent = `W: ${counts.woodPool}`;
                badgesContainer.appendChild(woodBadge);
            }
            
            cell.appendChild(badgesContainer);
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
        woodPool: 0,
        foxLake: 0,
        syndicateLake: 0
    };
    
    try {
        // Filter bookings from cache for the specific date
        const dateBookings = allBookingsCache.filter(booking => {
            const bookingDate = booking.bookingDate || booking.booking_date;
            return bookingDate === dateStr && booking.status !== 'cancelled';
        });
        
        // Count bookings by lake
        dateBookings.forEach(booking => {
            const lakeName = (booking.lakeName || booking.lake_name || '').toLowerCase();
            
            if (lakeName.includes('bignor')) {
                counts.mainLake++;
            } else if (lakeName.includes('fox')) {
                counts.foxLake++;
            } else if (lakeName.includes('syndicate')) {
                counts.syndicateLake++;
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
        console.log('Getting bookings for date:', dateStr);
        console.log('Total bookings in cache:', allBookingsCache.length);
        
        // Filter bookings for the specific date from cache
        const filtered = allBookingsCache.filter(booking => {
            const bookingDate = booking.bookingDate || booking.booking_date;
            return bookingDate === dateStr && booking.status !== 'cancelled';
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
    
    document.getElementById('dateBookingsModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Create booking card HTML - Admin-focused simplified design
function createBookingCard(booking) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === booking.userEmail || u.email === booking.userId);
    
    const fullName = user ? (user.fullName || user.email) : (booking.userName || booking.userEmail || booking.userId || 'Unknown');
    const userEmail = booking.userEmail || booking.userId;
    const displayName = formatNameWithInitial(fullName);
    const initials = getInitials(fullName);
    
    const lakeName = booking.lakeName || booking.lake || 'Unknown Lake';
    const lakeClass = lakeName.includes('Main') || lakeName.includes('Bignor') ? 'bignor-badge' : 'wood-badge';
    
    const startTime = booking.startUtc ? new Date(booking.startUtc).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
    }) : '12:00';
    
    const bookingId = booking.id.substring(0, 8);
    
    return `
        <div class="admin-booking-card">
            <div class="admin-booking-header">
                <div class="admin-user-avatar">${initials}</div>
                <div class="admin-user-info">
                    <div class="admin-user-name">${displayName}</div>
                    <div class="admin-user-email">${userEmail}</div>
                </div>
                <span class="admin-lake-badge ${lakeClass}">${lakeName}</span>
            </div>
            
            <div class="admin-booking-details">
                <div class="admin-detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span><strong>Time:</strong> ${startTime} UTC - 24 hours</span>
                </div>
                <div class="admin-detail-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><strong>Booking ID:</strong> ${bookingId}</span>
                </div>
                ${booking.notes ? `
                <div class="admin-detail-row notes-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span><strong>Maintenance Reports:</strong> ${booking.notes}</span>
                </div>
                ` : ''}
            </div>
            
            <button class="admin-cancel-btn" onclick="cancelUserBooking('${booking.id}', '${userEmail}')">
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

// Cancel user booking - Uses API to ensure cross-browser sync
async function cancelUserBooking(bookingId, userEmail) {
    if (!confirm('Are you sure you want to cancel this booking?\n\nThis will lift the booking restriction and allow the user to book immediately for this date/lake combination.')) {
        return;
    }
    
    try {
        console.log(`[Admin] Cancelling booking ${bookingId} for user ${userEmail} via API`);
        
        // Call API to cancel booking
        await BignorAPI.admin.cancelBooking(bookingId);
        
        console.log(`[Admin] ✅ Booking cancelled successfully via API. User can now rebook.`);
        
        // Reload bookings from API to get updated list
        await loadAllBookings();
        
        // Refresh calendar with new data
        renderCalendar(currentYear, currentMonth);
        
        // Refresh modal if it's open
        if (selectedDate) {
            openDateModal(selectedDate);
        }
        
        alert('✅ Booking cancelled successfully!\n\nThe user can now make a new booking for this date/lake combination.');
        
    } catch (error) {
        console.error('[Admin] Error cancelling booking via API:', error);
        alert(error.message || '❌ Error cancelling booking. Please try again.');
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

