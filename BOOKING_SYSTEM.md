# Booking System Documentation

## Overview

The booking system has been refactored to use a more robust, type-safe structure with proper timestamps and UUIDs.

## Data Structure

### Booking Object

```typescript
{
  id: string;                          // UUID v4
  lakeSlug: 'bignor-main' | 'wood-pool'; // Lake identifier
  user: {
    id: string;                        // User ID
    name: string;                      // User full name
    avatar?: string;                   // Optional avatar URL
  };
  start: number;                       // Start time in ms (epoch)
  end: number;                         // End time in ms (epoch)
  peg?: string;                        // Optional peg/spot number
  createdAt: number;                   // Creation timestamp in ms
  notes?: string;                      // Optional booking notes
  status: 'upcoming' | 'completed' | 'cancelled';
}
```

## Lake Slugs

The system uses consistent lake identifiers:
- **`bignor-main`** - Bignor Main Lake (capacity: 3 anglers)
- **`wood-pool`** - Wood Pool (capacity: 2 anglers)

Legacy slugs (`bignor`, `wood`) are supported for backwards compatibility.

## Usage Examples

### 1. Creating a New Booking

```javascript
import { addBooking, generateUUID } from './bookings-utils.js';
import { normalizeLakeSlug } from './lakes.js';

// Get lake from URL
const urlParams = new URLSearchParams(window.location.search);
const lakeSlug = normalizeLakeSlug(urlParams.get('lake')) || 'bignor-main';

// Get current user
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Create booking
const start = Date.now();  // or specific date: new Date('2025-05-15T12:00:00').getTime()
const end = start + 24 * 60 * 60 * 1000; // 24 hours later

const booking = {
  id: generateUUID(),
  lakeSlug,
  user: {
    id: currentUser.email,  // or currentUser.id
    name: currentUser.fullName,
    avatar: currentUser.avatar
  },
  start,
  end,
  peg: 'A1',  // optional
  notes: 'Bringing two rods',  // optional
  status: 'upcoming',
  createdAt: Date.now()
};

addBooking(booking);
```

### 2. Checking Lake Availability

```javascript
import { isLakeAvailable, availableSpots } from './bookings-utils.js';

const date = new Date('2025-05-15');
const lakeSlug = 'bignor-main';

// Check if lake has any availability
if (isLakeAvailable(lakeSlug, date)) {
  const spots = availableSpots(lakeSlug, date);
  console.log(`${spots} spots available`);
} else {
  console.log('Lake is fully booked');
}
```

### 3. Getting Active Bookings

```javascript
import { activeBookings, activeByLake, userActive } from './bookings-utils.js';

// Get all current active bookings
const active = activeBookings();

// Get active bookings by lake
const byLake = activeByLake();
console.log(`Bignor: ${byLake['bignor-main'].length} anglers`);
console.log(`Wood Pool: ${byLake['wood-pool'].length} anglers`);

// Check if specific user has active booking
const userId = 'user@example.com';
const userBooking = userActive(userId);
if (userBooking) {
  console.log(`User is fishing at ${userBooking.lakeSlug}`);
}
```

### 4. Managing Bookings

```javascript
import { 
  loadBookings, 
  cancelBooking, 
  updateBookingStatuses,
  userBookings 
} from './bookings-utils.js';

// Load all bookings
const allBookings = loadBookings();

// Get user's booking history
const myBookings = userBookings('user@example.com');

// Cancel a booking
const success = cancelBooking('booking-uuid-here');

// Update statuses (mark completed bookings)
updateBookingStatuses();
```

### 5. Getting Bookings for a Date

```javascript
import { bookingsForDate } from './bookings-utils.js';

const date = new Date('2025-05-15');
const bookings = bookingsForDate(date);

bookings.forEach(b => {
  console.log(`${b.user.name} - ${b.lakeSlug}`);
});
```

## Migration

### Automatic Migration

The system includes automatic migration from the old format:

```javascript
import { migrateAllBookings } from './bookings-utils.js';

// Run once to migrate all existing bookings
migrateAllBookings();
```

### Old vs New Format

**Old Format:**
```javascript
{
  id: '1234567890',
  userId: 'user@example.com',
  userName: 'John Doe',
  lake: 'bignor',  // old slug
  date: '2025-05-15',  // date string
  notes: 'Some notes',
  status: 'upcoming',
  createdAt: '2025-05-01T10:00:00Z'  // ISO string
}
```

**New Format:**
```javascript
{
  id: 'uuid-v4-here',
  lakeSlug: 'bignor-main',  // new slug format
  user: {
    id: 'user@example.com',
    name: 'John Doe'
  },
  start: 1715774400000,  // ms timestamp at noon
  end: 1715860800000,    // 24h later
  notes: 'Some notes',
  status: 'upcoming',
  createdAt: 1714554000000  // ms timestamp
}
```

## Constants

```javascript
import { MAX_BY_LAKE } from './bookings-utils.js';

console.log(MAX_BY_LAKE['bignor-main']);  // 3
console.log(MAX_BY_LAKE['wood-pool']);     // 2
```

## Integration with booking.js

Update your `booking.js` to import and use these utilities:

```javascript
import { 
  addBooking, 
  generateUUID, 
  loadBookings, 
  activeBookings,
  bookingsForDate,
  availableSpots,
  updateBookingStatuses 
} from './bookings-utils.js';
import { normalizeLakeSlug, getLakeName, getLakeCapacity } from './lakes.js';

// Run migration on page load (safe to run multiple times)
migrateAllBookings();

// Then use the utilities throughout your code
```

## Benefits

1. **Type Safety**: Full TypeScript definitions included
2. **Consistent Data**: Standardized format across the app
3. **Better Queries**: Efficient functions for common operations
4. **Timestamps**: Proper time handling with milliseconds
5. **UUIDs**: Unique IDs that won't collide
6. **Backwards Compatible**: Supports old lake slugs
7. **Easy Migration**: One-line migration from old format

## Testing

```javascript
// Test booking creation
const testBooking = {
  id: generateUUID(),
  lakeSlug: 'bignor-main',
  user: { id: 'test', name: 'Test User' },
  start: Date.now(),
  end: Date.now() + 24 * 60 * 60 * 1000,
  status: 'upcoming',
  createdAt: Date.now()
};

addBooking(testBooking);
console.log('Added test booking:', testBooking.id);

// Verify
const loaded = loadBookings();
console.log('Total bookings:', loaded.length);
```




























