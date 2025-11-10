# UTC Booking System - Integration Guide

**Date:** October 13, 2025  
**Purpose:** Step-by-step guide to integrate the UTC booking system into your fishing app

---

## 📋 Quick Start

### Step 1: Include Required Scripts
Add these scripts to your HTML pages **in this order**:

```html
<!-- In booking.html, dashboard.html, etc. -->
<script src="activeBooking.js"></script>
<script src="booking-integration-utc.js"></script>
```

### Step 2: That's It!
The system auto-initializes on page load. You can now use the booking functions.

---

## 🎯 Usage Examples

### Example 1: Create a Booking (Simple)
```javascript
// User selects date and lake from your UI
const selectedDate = '2025-10-15';  // From your calendar picker
const selectedLake = 'bignor-main'; // From lake selector
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Create booking
const result = window.BookingIntegration.createBooking(
  selectedDate,
  selectedLake,
  currentUser,
  'First session of the season!' // Optional notes
);

if (result.success) {
  alert(result.message);
  window.location.href = 'dashboard.html';
} else {
  alert('Error: ' + result.error);
}
```

### Example 2: Display Availability
```javascript
// When user selects a date on calendar
function onDateSelected(dateStr) {
  const container = document.getElementById('availabilityContainer');
  window.BookingIntegration.displayAvailabilityInfo(dateStr, container);
}

// HTML will be auto-generated showing:
// - Each lake with available spots
// - "X of Y spots available"
// - Book Now buttons (disabled if full)
```

### Example 3: Show User's Active Booking
```javascript
// On dashboard or profile page
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
const booking = window.BookingIntegration.getUserBooking(currentUser.email);

if (booking) {
  document.getElementById('activeBooking').innerHTML = `
    <div class="booking-card ${booking.status}">
      <h3>${booking.lakeName}</h3>
      <p><strong>Session:</strong> ${booking.sessionDate}</p>
      <p><strong>Booked:</strong> ${booking.bookedOn}</p>
      <span class="badge">${booking.status}</span>
      ${booking.isUpcoming ? '<button onclick="cancelMyBooking()">Cancel Booking</button>' : ''}
    </div>
  `;
} else {
  document.getElementById('activeBooking').innerHTML = 
    '<p>No active booking. <a href="booking.html">Book now</a></p>';
}
```

### Example 4: Cancel a Booking
```javascript
function cancelMyBooking() {
  if (!confirm('Are you sure you want to cancel your booking?')) {
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const result = window.BookingIntegration.cancelBooking(currentUser.email);

  if (result.success) {
    alert(result.message);
    location.reload();
  } else {
    alert('Error: ' + result.error);
  }
}
```

### Example 5: Update Calendar Day Colors
```javascript
// In your calendar rendering code
function renderCalendarDay(date) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  dayElement.textContent = date.getDate();
  
  // Add click handler
  dayElement.onclick = () => selectDate(dateStr);
  
  // Update availability styling (green/red)
  const dateStr = date.toISOString().split('T')[0];
  window.BookingIntegration.updateCalendarAvailability(dateStr, dayElement);
  
  return dayElement;
}
```

### Example 6: Check Availability Programmatically
```javascript
// Check if you can book a specific lake on a date
const dateStr = '2025-10-15';
const lakeSlug = 'bignor-main';

const availability = window.BookingIntegration.checkAvailabilityForDate(dateStr);
const lakeInfo = availability[lakeSlug];

console.log(`${lakeInfo.lakeName}: ${lakeInfo.availableSpots} spots available`);

if (lakeInfo.isAvailable) {
  console.log('✅ Can book!');
} else {
  console.log('❌ Fully booked');
}
```

---

## 🔧 Configuration

### Lake Settings
Edit in `booking-integration-utc.js`:

```javascript
const LAKES = {
  'bignor-main': {
    slug: 'bignor-main',
    name: 'Bignor Main Lake',
    maxCapacity: 5,        // ← Change capacity here
    pricePerDay: 50        // ← Change price here
  },
  'wood-pool': {
    slug: 'wood-pool',
    name: 'Wood Pool',
    maxCapacity: 3,
    pricePerDay: 40
  }
};
```

### Adding a New Lake
```javascript
const LAKES = {
  // ... existing lakes ...
  'new-lake': {
    slug: 'new-lake',
    name: 'New Lake Name',
    maxCapacity: 4,
    pricePerDay: 45
  }
};
```

---

## 🎨 Styling the UI

### Availability Display CSS
Add to your stylesheet:

```css
.availability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.lake-availability-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  text-align: center;
}

.lake-availability-card.available {
  border-color: #28a745;
  background: #f0fdf4;
}

.lake-availability-card.full {
  border-color: #dc3545;
  background: #fff5f5;
  opacity: 0.7;
}

.capacity-display {
  font-size: 2rem;
  font-weight: 700;
  color: #48d1cc;
  margin: 15px 0;
}

.lake-availability-card.full .capacity-display {
  color: #dc3545;
}

.book-btn {
  width: 100%;
  padding: 12px;
  background: #48d1cc;
  color: white;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
}

.book-btn:hover:not(:disabled) {
  background: #20b2aa;
}

.book-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

### Calendar Day Colors CSS
```css
.calendar-day.available {
  background: #d4edda;
  color: #155724;
  border: 2px solid #28a745;
}

.calendar-day.limited {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffc107;
}

.calendar-day.full {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #dc3545;
  cursor: not-allowed;
}

.calendar-day:hover:not(.full) {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
```

---

## 🔄 Migrating Existing Bookings

### Automatic Migration
The system automatically saves bookings in both formats:
- **New format:** `bp_active_booking_${userId}` (UTC timestamps)
- **Legacy format:** `bignor_park_bookings` array (YYYY-MM-DD strings)

### Manual Migration Script
If you have old bookings to convert:

```javascript
function migrateAllBookings() {
  const stored = localStorage.getItem('bignor_park_bookings');
  if (!stored) return;

  const oldBookings = JSON.parse(stored);
  let migrated = 0;

  oldBookings.forEach(oldBooking => {
    // Skip if already migrated or expired
    if (oldBooking.migrated) return;

    const dateStr = oldBooking.date;
    const startUtc = window.ActiveBookingSystem.startOfLocalDayAsUTC(dateStr);
    const endUtc = startUtc + (24 * 60 * 60 * 1000);

    const newBooking = {
      id: oldBooking.id,
      userId: oldBooking.userId,
      userName: oldBooking.userName,
      lakeSlug: oldBooking.lake,
      lakeName: oldBooking.lakeName,
      startUtc: startUtc,
      endUtc: endUtc,
      bookedOnUtc: oldBooking.createdAt || Date.now(),
      notes: oldBooking.notes || ''
    };

    window.ActiveBookingSystem.setActiveBooking(newBooking);
    oldBooking.migrated = true;
    migrated++;
  });

  // Save updated legacy bookings
  localStorage.setItem('bignor_park_bookings', JSON.stringify(oldBookings));
  
  console.log(`✅ Migrated ${migrated} bookings to UTC format`);
  return migrated;
}

// Run once
migrateAllBookings();
```

---

## 📱 Complete Integration Example

### booking.html (Complete Flow)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Book Your Session</title>
    <link rel="stylesheet" href="booking-styles.css">
</head>
<body>
    <h1>Book Your Fishing Session</h1>

    <!-- Calendar (simplified) -->
    <div id="calendar"></div>

    <!-- Availability Display -->
    <div id="availabilityContainer"></div>

    <!-- Scripts -->
    <script src="activeBooking.js"></script>
    <script src="booking-integration-utc.js"></script>
    <script>
        let selectedDate = null;

        // Render simple calendar
        function renderCalendar() {
            const calendar = document.getElementById('calendar');
            const today = new Date();
            
            // Render next 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';
                dayEl.textContent = date.getDate();
                dayEl.onclick = () => selectDate(dateStr, dayEl);
                
                // Update styling based on availability
                window.BookingIntegration.updateCalendarAvailability(dateStr, dayEl);
                
                calendar.appendChild(dayEl);
            }
        }

        // Handle date selection
        function selectDate(dateStr, element) {
            selectedDate = dateStr;
            
            // Update UI
            document.querySelectorAll('.calendar-day').forEach(el => {
                el.classList.remove('selected');
            });
            element.classList.add('selected');
            
            // Show availability
            const container = document.getElementById('availabilityContainer');
            window.BookingIntegration.displayAvailabilityInfo(dateStr, container);
        }

        // Initialize
        renderCalendar();
    </script>
</body>
</html>
```

---

## ✅ Testing Checklist

### Basic Functions:
- [ ] Create a booking for tomorrow
- [ ] View the booking on dashboard
- [ ] Cancel the booking
- [ ] Create booking again (should work after cancel)

### Availability:
- [ ] Calendar shows green for available days
- [ ] Calendar shows red when lake is full
- [ ] Availability info updates when date selected
- [ ] "Book Now" button disabled when full

### UTC Consistency:
- [ ] Booking created on Oct 15 shows as "October 15" (not 14 or 16)
- [ ] Date doesn't change when viewed in different timezone
- [ ] Time always shows as 00:00

### Edge Cases:
- [ ] Can't book same lake twice
- [ ] Expired bookings auto-cleanup
- [ ] Error messages show for invalid bookings
- [ ] Legacy bookings still visible

---

## 🚀 Next Steps

### Phase 1: Basic Integration (Now)
1. ✅ Add scripts to booking.html
2. ✅ Update "Book Now" button to use `handleBookNow()`
3. ✅ Display availability on date selection
4. ✅ Test basic booking flow

### Phase 2: Dashboard Integration
1. Update dashboard.html to show active booking using `getUserBooking()`
2. Add cancel button using `cancelBooking()`
3. Show booking status badge
4. Add countdown timer to session start

### Phase 3: Admin Features
1. Create admin page to view all bookings
2. Add ability to manually add/remove bookings
3. Export bookings to CSV
4. Generate booking reports

### Phase 4: Enhancements
1. Add email confirmation (requires backend)
2. Add booking reminders
3. Add waiting list for full dates
4. Add recurring bookings

---

## 🆘 Troubleshooting

### "User already has an active booking"
```javascript
// To reset a user's booking (testing only):
const userEmail = 'test@example.com';
window.ActiveBookingSystem.clearActiveBooking(userEmail);
```

### Dates showing wrong day
```javascript
// Verify UTC conversion:
const dateStr = '2025-10-15';
const utcMs = window.ActiveBookingSystem.startOfLocalDayAsUTC(dateStr);
console.log(new Date(utcMs).toISOString());
// Should show: "2025-10-15T00:00:00.000Z"
```

### Availability not updating
```javascript
// Force refresh:
window.location.reload();

// Or manually cleanup:
window.ActiveBookingSystem.cleanupExpiredBookings();
```

---

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Use `activeBooking-example.html` to test functions
3. Review `ACTIVE_BOOKING_SYSTEM.md` for detailed docs

---

**🎣 Happy Fishing!** 🐟
























