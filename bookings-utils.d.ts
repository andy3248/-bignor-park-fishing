// TypeScript definitions for bookings utilities module

import { LakeSlug } from './lakes';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface BookingUser {
    id: string;
    name: string;
    avatar?: string;
}

export interface Booking {
    id: string;
    lakeSlug: LakeSlug;
    user: BookingUser;
    start: number;
    end: number;
    peg?: string;
    createdAt: number;
    notes?: string;
    status: BookingStatus;
}

export const MAX_BY_LAKE: Record<LakeSlug, number>;

/**
 * Generate a simple UUID v4
 */
export function generateUUID(): string;

/**
 * Load bookings from localStorage
 */
export function loadBookings(): Booking[];

/**
 * Save bookings to localStorage
 */
export function saveBookings(list: Booking[]): void;

/**
 * Add a new booking
 */
export function addBooking(booking: Booking): void;

/**
 * Get active bookings (currently ongoing)
 */
export function activeBookings(now?: number): Booking[];

/**
 * Get active bookings grouped by lake
 */
export function activeByLake(now?: number): Record<LakeSlug, Booking[]>;

/**
 * Get active booking for a specific user
 */
export function userActive(userId: string, now?: number): Booking | undefined;

/**
 * Get upcoming bookings (not yet started)
 */
export function upcomingBookings(now?: number): Booking[];

/**
 * Get bookings for a specific date
 */
export function bookingsForDate(date: Date | number): Booking[];

/**
 * Check if a lake is available on a specific date
 */
export function isLakeAvailable(lakeSlug: LakeSlug, date: Date | number): boolean;

/**
 * Get available spots for a lake on a specific date
 */
export function availableSpots(lakeSlug: LakeSlug, date: Date | number): number;

/**
 * Cancel a booking
 */
export function cancelBooking(bookingId: string): boolean;

/**
 * Update booking statuses (mark completed bookings)
 */
export function updateBookingStatuses(now?: number): void;

/**
 * Get user's booking history
 */
export function userBookings(userId: string): Booking[];

/**
 * Migrate old booking format to new format
 */
export function migrateBooking(oldBooking: any): Booking;

/**
 * Migrate all old bookings to new format
 */
export function migrateAllBookings(): void;




























