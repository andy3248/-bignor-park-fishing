# Date Formatting Guide

## Overview
This guide explains how to properly format dates in the booking system to avoid inverted or incorrect date displays.

## Booking Object Structure

```javascript
{
  id: string,
  lakeSlug: 'bignor-main' | 'wood-pool',
  user: {
    id: string,
    name: string,
    avatar?: string
  },
  start: number,      // Unix timestamp (milliseconds) - Session date
  end: number,        // Unix timestamp (milliseconds)
  createdAt: number,  // Unix timestamp (milliseconds) - Booking creation date
  date: string,       // Format: 'YYYY-MM-DD'
  peg?: string
}
```

## Important: Date Field Usage

### `booking.start` - Session Date
- **Use for**: The actual fishing session date
- **Display as**: "Saturday 11 October 2025"
- **Format function**: `formatDateLong(booking.start)`

### `booking.createdAt` - Booked On Date  
- **Use for**: When the user made the reservation
- **Display as**: "Booked on: Friday 10 October 2025"
- **Format function**: `formatDateLong(booking.createdAt)`

⚠️ **DO NOT** swap these values or the dates will appear inverted!

## Date Formatting Functions

### `formatDateLong(timestamp)`
Formats a Unix timestamp to long date format.

```javascript
// Example usage in ActiveBooking card
const sessionDate = formatDateLong(booking.start);
// Output: "Saturday 11 October 2025"

const bookedOnDate = formatDateLong(booking.createdAt);
// Output: "Friday 10 October 2025"
```

### Using `toLocaleDateString` with en-GB locale

```javascript
// Correct way to format dates
const sessionDate = new Date(booking.start).toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});
// Output: "Saturday, 11 October 2025"

const bookedOnDate = new Date(booking.createdAt).toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});
// Output: "Friday, 10 October 2025"
```

## ActiveBooking Card Example

```javascript
// In your ActiveBooking component/card rendering:

function renderActiveBookingCard(booking) {
  const sessionDate = formatDateLong(booking.start);
  const bookedOnDate = formatDateLong(booking.createdAt);
  const lakeName = getLakeName(booking.lakeSlug);
  
  return `
    <div class="booking-card">
      <div class="booking-header">
        <h3>${lakeName}</h3>
        <span class="session-date">${sessionDate}</span>
      </div>
      <div class="booking-meta">
        <p class="booked-on">Booked on: ${bookedOnDate}</p>
        ${booking.peg ? `<p class="peg">Peg: ${booking.peg}</p>` : ''}
      </div>
    </div>
  `;
}
```

## Common Mistakes to Avoid

### ❌ Wrong
```javascript
// Using booking.date for session display
const sessionDate = booking.date; // This is 'YYYY-MM-DD' format

// Swapping start and createdAt
const sessionDate = formatDateLong(booking.createdAt);  // WRONG!
const bookedOnDate = formatDateLong(booking.start);    // WRONG!

// Using wrong locale
const date = new Date(booking.start).toLocaleDateString('en-US');
// Gives MM/DD/YYYY format instead of DD/MM/YYYY
```

### ✅ Correct
```javascript
// Use start for session date
const sessionDate = formatDateLong(booking.start);

// Use createdAt for booking date
const bookedOnDate = formatDateLong(booking.createdAt);

// Use en-GB locale for proper formatting
const date = new Date(booking.start).toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric', 
  month: 'long',
  year: 'numeric'
});
```

## Testing Your Date Formatting

```javascript
// Test booking object
const testBooking = {
  id: 'test-123',
  lakeSlug: 'bignor-main',
  user: { id: 'u1', name: 'John Doe' },
  start: new Date('2025-10-11T09:00:00').getTime(),  // Saturday
  end: new Date('2025-10-11T17:00:00').getTime(),
  createdAt: new Date('2025-10-10T14:30:00').getTime(),  // Friday
  date: '2025-10-11'
};

// Test formatting
console.log('Session Date:', formatDateLong(testBooking.start));
// Should output: "Saturday 11 October 2025"

console.log('Booked On:', formatDateLong(testBooking.createdAt));
// Should output: "Friday 10 October 2025"
```

## Short Date Formats

For compact displays, use:

```javascript
// Short format (11 Oct 2025)
function formatDateShort(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Ultra-short format (11/10/25)
function formatDateCompact(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}
```

## Integration with bookingsStore

When creating a booking with bookingsStore:

```javascript
import { addBooking } from './src/utils/bookingsStore.js';

const newBooking = {
  id: generateId(),
  lakeSlug: 'bignor-main',
  user: {
    id: currentUser.id,
    name: currentUser.fullName,
    avatar: currentUser.avatar
  },
  start: sessionStartTimestamp,  // e.g., new Date('2025-10-11T09:00').getTime()
  end: sessionEndTimestamp,      // e.g., new Date('2025-10-11T17:00').getTime()
  createdAt: Date.now(),         // Current time when booking is created
  date: '2025-10-11',
  peg: selectedPeg
};

addBooking(newBooking);
```

## Summary

| Field | Purpose | Display Format |
|-------|---------|----------------|
| `start` | Session date/time | "Saturday 11 October 2025" |
| `createdAt` | Booking creation date | "Friday 10 October 2025" |
| `date` | Internal reference | "2025-10-11" (not for display) |

Always use `en-GB` locale for proper British date formatting (day before month).







