# Active Booking Card Component - Usage Guide

**Date:** October 13, 2025  
**Purpose:** Display user's active fishing session in a beautiful, feature-rich card

---

## 📋 Quick Start

### Step 1: Include Required Files
```html
<!-- CSS -->
<link rel="stylesheet" href="activeBookingCard.css">

<!-- JavaScript (in order) -->
<script src="activeBooking.js"></script>
<script src="booking-integration-utc.js"></script>
<script src="activeBookingCard.js"></script>
```

### Step 2: Add Container Element
```html
<div class="active-booking-container">
  <div id="myBookingCard" data-active-booking-card data-user-id="user@email.com"></div>
</div>
```

**That's it!** The card auto-initializes and displays the user's booking.

---

## 🎯 Usage Methods

### Method 1: Auto-Initialize (Recommended)
Add `data-active-booking-card` attribute:

```html
<div data-active-booking-card data-user-id="user@email.com"></div>
```

The component automatically:
- Finds all elements with the attribute
- Reads the `data-user-id`
- Renders the booking card
- Auto-refreshes for active sessions

### Method 2: Manual Render
Call the render function directly:

```javascript
const container = document.getElementById('myBookingCard');
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

window.ActiveBookingCard.render(currentUser.email, container);
```

### Method 3: Dynamic User
Render based on logged-in user:

```javascript
function renderUserBooking() {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const container = document.getElementById('bookingCard');
  window.ActiveBookingCard.render(user.email, container);
}

// Call on page load
document.addEventListener('DOMContentLoaded', renderUserBooking);
```

---

## 🎨 Card Features

### Status Indicators
The card adapts based on booking status:

**1. Upcoming Booking (Yellow/Gold)**
- Shows "UPCOMING" badge
- Displays "Starts in X days" countdown
- Yellow gradient header
- Cancel button enabled

**2. Active Session (Green)**
- Shows "ACTIVE NOW" badge with pulsing indicator
- Live progress bar showing session completion
- Elapsed/remaining time display
- Auto-refreshes every minute
- "Session Information" button

**3. Completed Session (Gray)**
- Shows "COMPLETED" badge
- Grayed out appearance
- No action buttons
- Historical reference only

**4. No Booking (Empty State)**
- Friendly message
- Large "Book a Session" button
- Links to booking page

### Interactive Elements

**Cancel Button** (Upcoming bookings)
```javascript
// Automatically wired up in the component
// Shows confirmation dialog
// Removes booking from storage
// Refreshes card to show "No Booking" state
```

**Session Information** (Active bookings)
```javascript
// Shows popup with:
// - Emergency contacts
// - Fishing rules
// - Session guidelines
```

**Progress Bar** (Active sessions)
- Visual indicator of session completion
- Shows percentage complete
- Displays elapsed and remaining time
- Updates every minute automatically

---

## 🔧 Complete Example

### dashboard.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - Bignor Park</title>
    <link rel="stylesheet" href="index-clean.css">
    <link rel="stylesheet" href="activeBookingCard.css">
</head>
<body>
    <header class="main-header">
        <h1>Welcome to Your Dashboard</h1>
    </header>

    <main>
        <!-- Active Booking Section -->
        <section class="py-6 flex justify-center">
            <div class="active-booking-container">
                <h2 style="text-align: center; margin-bottom: 20px;">
                    🎣 Your Current Session
                </h2>
                <div id="activeBooking" 
                     data-active-booking-card 
                     data-user-id=""></div>
            </div>
        </section>

        <!-- Other dashboard content -->
    </main>

    <!-- Scripts -->
    <script src="activeBooking.js"></script>
    <script src="booking-integration-utc.js"></script>
    <script src="activeBookingCard.js"></script>
    <script>
        // Set user ID dynamically
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            document.getElementById('activeBooking').setAttribute('data-user-id', currentUser.email);
            // Re-initialize to pick up the new user ID
            window.ActiveBookingCard.initialize();
        } else {
            window.location.href = 'index.html';
        }
    </script>
</body>
</html>
```

---

## 📊 Card Layout Breakdown

### Header Section
```
┌─────────────────────────────────────────────┐
│ 🎣 Your Fishing Session [UPCOMING]   [LOGO]│ ← Teal/Yellow/Green gradient
└─────────────────────────────────────────────┘
```
- Session title with emoji
- Status badge
- Fishing logo (right side)
- Pulsing indicator for active sessions

### Lake Banner
```
┌─────────────────────────────────────────────┐
│ Bignor Main Lake                            │ ← Gray gradient
│ Bignor Park Carp Fishery                    │
└─────────────────────────────────────────────┘
```

### Details Grid (2x2)
```
┌──────────────────────┬──────────────────────┐
│ 📅 Session Date      │ ⏰ Start Time        │
│ Monday, 14 Oct 2025  │ 00:00 UTC            │
├──────────────────────┼──────────────────────┤
│ ⏱️ Duration          │ 👤 Booked On         │
│ 24 Hours             │ Friday, 11 Oct 2025  │
└──────────────────────┴──────────────────────┘
```

### Time Until / Progress
```
Upcoming: ┌───────────────────────────────────┐
          │ ⏰ Starts in 2 days, 5 hours      │ ← Yellow banner
          └───────────────────────────────────┘

Active:   ┌───────────────────────────────────┐
          │ Session Progress        45%       │ ← Green banner
          │ ████████░░░░░░░░░░░░              │
          │ 11h 30m elapsed  ←→ 12h 30m left  │
          └───────────────────────────────────┘
```

### Notes (if present)
```
┌─────────────────────────────────────────────┐
│ 📝 First session of the season!             │
└─────────────────────────────────────────────┘
```

### Actions
```
┌──────────────────────┬──────────────────────┐
│  ❌ Cancel Booking   │  ℹ️ View Details     │
└──────────────────────┴──────────────────────┘
```

### Footer
```
┌─────────────────────────────────────────────┐
│ Booking ID: #BK1234AB                       │
└─────────────────────────────────────────────┘
```

---

## 🎨 Customization

### Change Colors
Edit `activeBookingCard.css`:

```css
/* Header gradient for upcoming bookings */
.active-booking-card.upcoming .booking-card-header {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

/* Border color for upcoming bookings */
.active-booking-card.upcoming {
  border-color: #YOUR_COLOR;
}
```

### Customize Progress Bar
```css
.progress-fill {
  background: linear-gradient(90deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Card Width
```css
.active-booking-container {
  max-width: 900px; /* Change from default 800px */
}
```

---

## 🔄 Auto-Refresh

For **active sessions**, the card automatically:
1. Updates every 60 seconds
2. Recalculates progress percentage
3. Updates elapsed/remaining time
4. Checks if session has ended

**Manual refresh:**
```javascript
const userId = 'user@email.com';
const container = document.getElementById('myCard');
window.ActiveBookingCard.render(userId, container);
```

---

## 🎯 Event Handlers

### Cancel Booking Handler
Built-in confirmation and cleanup:

```javascript
// In activeBookingCard.js
function handleCancelBooking(userId) {
  // Shows confirmation dialog
  // Calls BookingIntegration.cancelBooking()
  // Shows success toast
  // Refreshes card
}
```

### Custom Handler Example
```javascript
// Override the default handler
window.handleCancelBooking = function(userId) {
  // Your custom logic here
  if (!confirm('Custom confirmation message?')) {
    return;
  }
  
  const result = window.BookingIntegration.cancelBooking(userId);
  if (result.success) {
    alert('Custom success message!');
    // Refresh
    window.ActiveBookingCard.render(userId, container);
  }
};
```

---

## 📱 Responsive Design

The card automatically adapts to screen size:

**Desktop (> 768px)**
- Full 2x2 details grid
- Horizontal action buttons
- Large header with logo

**Tablet (768px)**
- 2x2 grid maintained
- Slightly smaller padding

**Mobile (< 768px)**
- Single column details (1x4)
- Stacked action buttons
- Compact header

**Small Mobile (< 480px)**
- Reduced font sizes
- Tighter spacing
- Full-width buttons

---

## 🆘 Troubleshooting

### Card Not Showing
```javascript
// Check if booking exists
const booking = window.ActiveBookingSystem?.getActiveBooking('user@email.com');
console.log('Booking:', booking); // null means no booking

// Check if scripts loaded
console.log('Systems loaded:', {
  activeBooking: !!window.ActiveBookingSystem,
  integration: !!window.BookingIntegration,
  card: !!window.ActiveBookingCard
});
```

### Progress Bar Not Updating
```javascript
// Check if auto-refresh is working
// Should see console logs every minute for active sessions
```

### Styling Issues
```javascript
// Verify CSS is loaded
const styles = document.querySelector('link[href*="activeBookingCard.css"]');
console.log('CSS loaded:', !!styles);
```

---

## 🎓 Advanced Usage

### Multiple Cards on One Page
```html
<!-- Dashboard -->
<div data-active-booking-card data-user-id="user1@email.com"></div>

<!-- Admin Panel -->
<div data-active-booking-card data-user-id="user2@email.com"></div>
<div data-active-booking-card data-user-id="user3@email.com"></div>
```

### Programmatic Control
```javascript
// Create booking, then show card
const result = window.BookingIntegration.createBooking(date, lake, user);
if (result.success) {
  // Wait briefly for storage to sync
  setTimeout(() => {
    window.ActiveBookingCard.render(user.email, container);
  }, 100);
}
```

### Custom Empty State
```javascript
// Modify renderNoBookingState() in activeBookingCard.js
// Or check for null booking and render custom HTML:
const booking = window.ActiveBookingSystem.getActiveBooking(userId);
if (!booking) {
  container.innerHTML = '<div>Your custom empty state HTML</div>';
  return;
}
```

---

## ✅ Best Practices

1. **Always include all 3 scripts** in the correct order
2. **Use data attributes** for auto-initialization
3. **Check user authentication** before rendering
4. **Let auto-refresh run** for active sessions
5. **Test all three states** (upcoming/active/completed)
6. **Handle edge cases** (expired bookings, no user)
7. **Style consistently** with your site theme
8. **Test mobile** responsive behavior

---

## 📦 Complete File List

```
activeBookingCard.js       (15KB) - Component logic
activeBookingCard.css      (12KB) - Styling
activeBookingCard-demo.html        - Demo page
ACTIVE_BOOKING_CARD_GUIDE.md       - This guide
```

### Dependencies:
```
activeBooking.js           - UTC booking system
booking-integration-utc.js - Integration layer
```

---

## 🎉 Summary

The ActiveBookingCard component provides:

✅ **Beautiful design** - Professional, modern card layout  
✅ **Status-aware** - Adapts to upcoming/active/completed  
✅ **Real-time updates** - Auto-refreshes for active sessions  
✅ **Interactive** - Cancel, view details, session info  
✅ **Responsive** - Works on all screen sizes  
✅ **Easy integration** - Just add data attribute  
✅ **Fully featured** - Progress bar, countdown, notes  
✅ **No dependencies** - Pure vanilla JavaScript  

**Perfect for any fishing app dashboard!** 🎣✨

---

*For more information, see the demo page: `activeBookingCard-demo.html`*
























