// Admin Lakes Management

document.addEventListener('DOMContentLoaded', function() {
    loadLakeStats();
    setInterval(loadLakeStats, 30000); // Refresh every 30 seconds
});

function loadLakeStats() {
    const bookings = JSON.parse(localStorage.getItem('bignor_park_bookings') || '[]');
    const today = new Date().toISOString().split('T')[0];

    // Count active bookings for today
    const activeBooksToday = bookings.filter(b => {
        if (b.status === 'cancelled') return false;

        const bookingStart = new Date(b.date + 'T00:00:00');
        const bookingEnd = new Date(bookingStart.getTime() + (24 * 60 * 60 * 1000));
        const now = new Date();

        return b.date === today || (now >= bookingStart && now < bookingEnd);
    });

    // Count by lake
    const bignorCount = activeBooksToday.filter(b =>
        b.lake === 'bignor' || b.lake === 'bignor-main' || b.lakeName === 'Bignor Main Lake'
    ).length;

    const woodCount = activeBooksToday.filter(b =>
        b.lake === 'wood' || b.lake === 'wood-pool' || b.lakeName === 'Wood Pool'
    ).length;

    document.getElementById('bignorCurrent').textContent = bignorCount;
    document.getElementById('woodCurrent').textContent = woodCount;
}
