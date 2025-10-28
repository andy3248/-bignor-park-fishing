// TypeScript definitions for lakes module

export type LakeSlug = 'bignor-main' | 'wood-pool';

export interface Lake {
    slug: LakeSlug;
    name: string;
    capacity: number;
    description: string;
    image: string;
    legacySlug?: string;
}

export const LAKES: Lake[];

/**
 * Generate booking URL for a lake
 * @param slug - Lake slug identifier
 * @returns Booking URL
 */
export function bookingUrl(slug: string): string;

/**
 * Get lake by slug
 * @param slug - Lake slug identifier
 * @returns Lake object or undefined if not found
 */
export function getLake(slug?: string): Lake | undefined;

/**
 * Get lake name by slug
 * @param slug - Lake slug identifier
 * @returns Lake name or 'Unknown Lake'
 */
export function getLakeName(slug: string): string;

/**
 * Get lake capacity by slug
 * @param slug - Lake slug identifier
 * @returns Lake capacity or 0
 */
export function getLakeCapacity(slug: string): number;

/**
 * Get all available lakes
 * @returns Array of all lakes
 */
export function getAllLakes(): Lake[];

/**
 * Normalize lake slug to new format
 * @param slug - Lake slug (old or new format)
 * @returns Normalized slug
 */
export function normalizeLakeSlug(slug: string): LakeSlug;

