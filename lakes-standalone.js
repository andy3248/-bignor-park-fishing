// Lakes data and utilities - Standalone (no modules)

const LAKES = [
    {
        slug: 'bignor-main',
        name: 'Bignor Main Lake',
        capacity: 3,
        description: 'Main fishing lake with 3 available spots',
        image: 'HCRU2383.JPG',
        legacySlug: 'bignor'
    },
    {
        slug: 'wood-pool',
        name: 'Wood Pool',
        capacity: 2,
        description: 'Smaller pool with 2 available spots',
        image: 'WhatsApp Image 2025-06-14 at 09.56.15_83f78450.jpg',
        legacySlug: 'wood'
    }
];

function bookingUrl(slug) {
    return `/booking.html?lake=${slug}`;
}

function getLake(slug) {
    if (!slug) return undefined;
    return LAKES.find(l => l.slug === slug || l.legacySlug === slug);
}

function getLakeName(slug) {
    const lake = getLake(slug);
    return lake ? lake.name : 'Unknown Lake';
}

function getLakeCapacity(slug) {
    const lake = getLake(slug);
    return lake ? lake.capacity : 0;
}

function getAllLakes() {
    return [...LAKES];
}

function normalizeLakeSlug(slug) {
    if (!slug) return 'bignor-main';
    const lake = getLake(slug);
    return lake ? lake.slug : slug;
}

console.log('[Lakes] Loaded successfully');









