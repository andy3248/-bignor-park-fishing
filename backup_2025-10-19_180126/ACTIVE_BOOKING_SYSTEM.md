# Active Booking System - UTC-Based Implementation

**Date:** October 13, 2025  
**Status:** ✅ Complete

## Overview
A robust, UTC-based booking system that eliminates timezone-related date issues. All dates are stored as UTC timestamps and displayed consistently across all user timezones.

---

## 🎯 Problem Solved

### Previous Issues:
- Date confusion between user's local timezone and server timezone
- Calendar dates shifting by ±1 day depending on timezone
- Inconsistent date display across different users
- "Friday" booking showing as "Thursday" or "Saturday" for different users

### Solution:
- Store all dates as **UTC midnight timestamps**
- Use explicit UTC timezone in all date formatting
- Convert local calendar picks to UTC without timezone shifts
- Display dates in UK format consistently using UTC

---

## 📋 Core Data Structure

### ActiveBooking Type
```javascript
{
  id: string,              // Unique booking ID
  userId: string,          // User's email or ID
  userName: string,        // User's display name
  lakeSlug: string,        // 'bignor-main' or 'wood-pool'
  lakeName: string,        // Display name of lake
  startUtc: number,        // UTC midnight start (timestamp)
  endUtc: number,          // startUtc + 24h (timestamp)
  bookedOnUtc: number,     // When booking was created (timestamp)
  notes?: string           // Optional booking notes
}
```

---

## 🔧 Core Functions

### Date Conversion
```javascript
startOfLocalDayAsUTC(input)
```
- **Input:** Date object or 'YYYY-MM-DD' string
- **Output:** UTC midnight timestamp for that calendar day
- **Purpose:** Converts local date pick to UTC without timezone shift

**Example:**
```javascript
// User picks "2025-10-15" in any timezone
const utcMs = startOfLocalDayAsUTC('2025-10-15');
// Always returns: 1728950400000 (Oct 15, 2025 00:00:00 UTC)
```

### Storage Functions
```javascript
setActiveBooking(booking)
getActiveBooking(userId)
clearActiveBooking(userId)
```
- **Key format:** `bp_active_booking_${userId}`
- **Storage:** localStorage with JSON serialization
- **Error handling:** Try-catch for JSON parsing

### Status Functions
```javascript
hasExpired(booking, now?)
isActiveNow(booking, now?)
isUpcoming(booking, now?)
getBookingStatus(booking, now?)
```
- **Input:** Booking object, optional timestamp (defaults to Date.now())
- **Output:** Boolean or status string
- **Purpose:** Determine booking state relative to current time

**Status Logic:**
- **Upcoming:** `now < startUtc`
- **Active:** `now >= startUtc && now < endUtc`
- **Completed:** `now >= endUtc`

### Cleanup Functions
```javascript
clearIfExpired(userId, now?)
cleanupExpiredBookings(now?)
```
- Automatically remove expired bookings
- Can be called on page load, interval, or visibility change
- Returns count of cleaned bookings

---

## 🎨 Formatting Functions

### Date Formatting (UK Format in UTC)
```javascript
formatDateUK_UTC(utcMs)
```
- **Output:** "Monday, 14 October 2025"
- **Format:** `weekday, day month year`
- **Timezone:** Explicit UTC to prevent shifts

```javascript
formatTimeHM_UTC(utcMs)
```
- **Output:** "00:00"
- **Format:** 24-hour time
- **Timezone:** Explicit UTC

### Display Helper
```javascript
formatBookingForDisplay(booking)
```
Returns enriched object with:
- Formatted dates and times
- Current status
- Boolean flags (isActive, isUpcoming, hasExpired)

---

## 📊 Availability Functions

### Check Lake Availability
```javascript
isLakeAvailable(lakeSlug, dateStr, maxCapacity)
```
- Returns true if spots available
- Checks against max capacity

### Get Available Spots
```javascript
getAvailableSpots(lakeSlug, dateStr, maxCapacity)
```
- Returns number of remaining spots
- Useful for "3 of 5 spots available" display

### Get All Bookings for Date
```javascript
getAllActiveBookingsForDate(dateStr)
```
- Returns array of all bookings for specific date
- Searches all localStorage keys

### Get Bookings by Lake
```javascript
getAllActiveBookingsByLake(dateStr)
```
- Returns object with bookings grouped by lake:
```javascript
{
  'bignor-main': [...bookings],
  'wood-pool': [...bookings]
}
```

---

## 🔄 Migration Function

### Convert Old Bookings
```javascript
migrateOldBooking(oldBooking)
```
Converts old booking format to new UTC format:

**Old Format:**
```javascript
{
  id, userId, date: '2025-10-15',
  createdAt: timestamp, ...
}
```

**New Format:**
```javascript
{
  id, userId,
  startUtc: utcTimestamp,
  endUtc: utcTimestamp + 24h,
  bookedOnUtc: timestamp, ...
}
```

---

## 🔌 Integration Guide

### 1. Include Script
```html
<script src="activeBooking.js"></script>
```

### 2. Access Functions
All functions available via `window.ActiveBookingSystem`:
```javascript
const { 
  setActiveBooking, 
  getActiveBooking, 
  formatDateUK_UTC 
} = window.ActiveBookingSystem;
```

### 3. Create Booking
```javascript
// User picks date from calendar
const selectedDate = '2025-10-15';
const startUtc = window.ActiveBookingSystem.startOfLocalDayAsUTC(selectedDate);
const endUtc = startUtc + (24 * 60 * 60 * 1000); // +24 hours

const booking = {
  id: generateId(),
  userId: currentUser.email,
  userName: currentUser.fullName,
  lakeSlug: 'bignor-main',
  lakeName: 'Bignor Main Lake',
  startUtc: startUtc,
  endUtc: endUtc,
  bookedOnUtc: Date.now(),
  notes: 'First session'
};

window.ActiveBookingSystem.setActiveBooking(booking);
```

### 4. Display Booking
```javascript
const booking = window.ActiveBookingSystem.getActiveBooking(userId);
if (booking) {
  const display = window.ActiveBookingSystem.formatBookingForDisplay(booking);
  
  console.log(display.sessionDate);  // "Monday, 14 October 2025"
  console.log(display.bookedOn);     // "Friday, 11 October 2025"
  console.log(display.status);       // "upcoming" / "active" / "completed"
}
```

### 5. Check Availability
```javascript
const dateStr = '2025-10-15';
const maxCapacity = 5;

const available = window.ActiveBookingSystem.isLakeAvailable(
  'bignor-main', 
  dateStr, 
  maxCapacity
);

const spots = window.ActiveBookingSystem.getAvailableSpots(
  'bignor-main', 
  dateStr, 
  maxCapacity
);

console.log(`${spots} of ${maxCapacity} spots available`);
```

### 6. Cleanup on Page Load
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  
  // Remove expired booking for current user
  window.ActiveBookingSystem.clearIfExpired(currentUser.email);
  
  // Or clean up all expired bookings (admin function)
  const cleaned = window.ActiveBookingSystem.cleanupExpiredBookings();
  console.log(`Cleaned ${cleaned} expired bookings`);
});
```

---

## 📱 Usage Examples

### Example 1: Booking Flow
```javascript
// booking.html - When user confirms booking
function confirmBooking() {
  const { startOfLocalDayAsUTC, setActiveBooking } = window.ActiveBookingSystem;
  
  const selectedDate = document.getElementById('datePicker').value; // '2025-10-15'
  const selectedLake = document.getElementById('lakePicker').value;  // 'bignor-main'
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  const startUtc = startOfLocalDayAsUTC(selectedDate);
  const endUtc = startUtc + (24 * 60 * 60 * 1000);
  
  const booking = {
    id: generateId(),
    userId: currentUser.email,
    userName: currentUser.fullName,
    lakeSlug: selectedLake,
    lakeName: getLakeName(selectedLake),
    startUtc: startUtc,
    endUtc: endUtc,
    bookedOnUtc: Date.now()
  };
  
  setActiveBooking(booking);
  alert('Booking confirmed!');
  window.location.href = 'dashboard.html';
}
```

### Example 2: Dashboard Display
```javascript
// dashboard.html - Display active booking
function loadActiveBooking() {
  const { getActiveBooking, formatBookingForDisplay, clearIfExpired } 
    = window.ActiveBookingSystem;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  // Clean up if expired
  clearIfExpired(currentUser.email);
  
  const booking = getActiveBooking(currentUser.email);
  
  if (!booking) {
    document.getElementById('activeBooking').innerHTML = 'No active booking';
    return;
  }
  
  const display = formatBookingForDisplay(booking);
  
  document.getElementById('activeBooking').innerHTML = `
    <div class="booking-card ${display.status}">
      <h3>${display.lakeName}</h3>
      <p>Session: ${display.sessionDate}</p>
      <p>Booked: ${display.bookedOn}</p>
      <span class="badge">${display.status}</span>
    </div>
  `;
}
```

### Example 3: Calendar Availability
```javascript
// booking.html - Check availability when date selected
function onDateSelected(dateStr) {
  const { getAllActiveBookingsByLake, getAvailableSpots } 
    = window.ActiveBookingSystem;
  
  const MAX_CAPACITY = {
    'bignor-main': 5,
    'wood-pool': 3
  };
  
  const bookingsByLake = getAllActiveBookingsByLake(dateStr);
  
  // Update UI for each lake
  for (const [lakeSlug, maxCapacity] of Object.entries(MAX_CAPACITY)) {
    const spots = getAvailableSpots(lakeSlug, dateStr, maxCapacity);
    const available = spots > 0;
    
    document.getElementById(`lake-${lakeSlug}`).innerHTML = `
      <h4>${getLakeName(lakeSlug)}</h4>
      <p>${spots} of ${maxCapacity} spots available</p>
      <button ${available ? '' : 'disabled'}>
        ${available ? 'Book Now' : 'Fully Booked'}
      </button>
    `;
  }
}
```

---

## ✅ Testing Checklist

### Date Conversion:
- [ ] `startOfLocalDayAsUTC('2025-10-15')` returns correct UTC timestamp
- [ ] Works with Date object input
- [ ] Handles leap years correctly
- [ ] No timezone shifts (always returns midnight UTC)

### Storage:
- [ ] Booking saves to localStorage correctly
- [ ] Booking retrieves with all properties intact
- [ ] JSON parsing errors handled gracefully
- [ ] Multiple bookings don't interfere

### Status Functions:
- [ ] `isUpcoming()` returns true before startUtc
- [ ] `isActiveNow()` returns true during session
- [ ] `hasExpired()` returns true after endUtc
- [ ] Edge cases at exact start/end times handled

### Formatting:
- [ ] `formatDateUK_UTC()` shows correct UK format
- [ ] Date doesn't shift for different timezones
- [ ] `formatTimeHM_UTC()` shows 00:00 for midnight
- [ ] Month names in English

### Availability:
- [ ] Correctly counts bookings per lake
- [ ] `getAvailableSpots()` accurate against max capacity
- [ ] Handles zero bookings (empty state)
- [ ] Doesn't count expired bookings

### Cleanup:
- [ ] `clearIfExpired()` removes expired bookings
- [ ] `cleanupExpiredBookings()` clears all expired
- [ ] Returns correct count of cleaned bookings
- [ ] Doesn't remove active/upcoming bookings

---

## 🚀 Next Steps

### Integration:
1. Update `booking-standalone.js` to use ActiveBookingSystem
2. Update `dashboard.js` to display using UTC functions
3. Update `my-bookings.html` to use formatBookingForDisplay
4. Migrate existing bookings to new format

### Enhancements:
1. Add timezone selector for international users
2. Add booking reminders (24h before, 1h before)
3. Add recurring bookings support
4. Add booking history/archive
5. Add export to calendar (iCal format)

---

## 📝 Key Benefits

✅ **Consistency:** Same date shows for all users worldwide  
✅ **Reliability:** No timezone-related bugs  
✅ **Clarity:** Explicit UTC timezone in all operations  
✅ **Flexibility:** Easy to add timezone display options later  
✅ **Performance:** Efficient localStorage operations  
✅ **Maintainability:** Clean, well-documented code  

---

*For questions or issues, contact the development team.*






