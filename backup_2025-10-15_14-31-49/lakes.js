// Lakes data and utilities

export const LAKES = [
    {
        slug: 'bignor-main',
        name: 'Bignor Main Lake',
        capacity: 3,
        description: 'Main fishing lake with 3 available spots',
        image: 'HCRU2383.JPG',
        // Legacy slug for backwards compatibility
        legacySlug: 'bignor'
    },
    {
        slug: 'wood-pool',
        name: 'Wood Pool',
        capacity: 2,
        description: 'Smaller pool with 2 available spots',
        image: 'WhatsApp Image 2025-06-14 at 09.56.15_83f78450.jpg',
        // Legacy slug for backwards compatibility
        legacySlug: 'wood'
    }
];

/**
 * Generate booking URL for a lake
 * @param {string} slug - Lake slug identifier
 * @returns {string} Booking URL
 */
export const bookingUrl = (slug) => `/booking.html?lake=${slug}`;

/**
 * Get lake by slug (supports both new and legacy formats)
 * @param {string} slug - Lake slug identifier
 * @returns {Object|undefined} Lake object or undefined if not found
 */
export const getLake = (slug) => {
    if (!slug) return undefined;
    // Try new format first, then legacy format
    return LAKES.find(l => l.slug === slug || l.legacySlug === slug);
};

/**
 * Get lake name by slug
 * @param {string} slug - Lake slug identifier
 * @returns {string} Lake name or 'Unknown Lake'
 */
export const getLakeName = (slug) => {
    const lake = getLake(slug);
    return lake ? lake.name : 'Unknown Lake';
};

/**
 * Get lake capacity by slug
 * @param {string} slug - Lake slug identifier
 * @returns {number} Lake capacity or 0
 */
export const getLakeCapacity = (slug) => {
    const lake = getLake(slug);
    return lake ? lake.capacity : 0;
};

/**
 * Get all available lakes
 * @returns {Array} Array of all lakes
 */
export const getAllLakes = () => [...LAKES];

/**
 * Normalize lake slug to new format
 * @param {string} slug - Lake slug (old or new format)
 * @returns {string} Normalized slug
 */
export const normalizeLakeSlug = (slug) => {
    if (!slug) return 'bignor-main';
    const lake = getLake(slug);
    return lake ? lake.slug : slug;
};

