/**
 * Database Connection Test Script
 * Run this to verify your database setup is working correctly
 * 
 * Usage: node backend/test-db-connection.js
 */

const db = require('./database');

async function runTests() {
    console.log('🧪 Starting database connection tests...\n');

    try {
        // Test 1: Basic connection
        console.log('Test 1: Testing basic connection...');
        const connected = await db.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to database');
        }
        console.log('✅ Connection test passed\n');

        // Test 2: Get lakes
        console.log('Test 2: Fetching lakes...');
        const lakes = await db.getAllLakes();
        console.log(`✅ Found ${lakes.length} lakes:`);
        lakes.forEach(lake => {
            console.log(`   - ${lake.display_name} (max: ${lake.max_anglers} anglers)`);
        });
        console.log('');

        // Test 3: Check availability
        if (lakes.length > 0) {
            console.log('Test 3: Checking lake availability...');
            const testDate = new Date().toISOString().split('T')[0];
            const availability = await db.checkLakeAvailability(lakes[0].id, testDate);
            console.log(`✅ ${lakes[0].display_name} on ${testDate}:`);
            console.log(`   - Available spots: ${availability.available_spots}`);
            console.log(`   - Is available: ${availability.is_available}`);
            console.log('');
        }

        // Test 4: Get booking stats
        console.log('Test 4: Getting booking statistics...');
        const stats = await db.getBookingStats();
        console.log('✅ Booking statistics:');
        console.log(`   - Active now: ${stats.active_now}`);
        console.log(`   - Upcoming: ${stats.upcoming}`);
        console.log(`   - Total active: ${stats.total_active}`);
        console.log(`   - Completed: ${stats.total_completed}`);
        console.log(`   - Cancelled: ${stats.total_cancelled}`);
        console.log('');

        console.log('🎉 All tests passed!\n');
        console.log('Your database is set up correctly and ready to use.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\nTroubleshooting tips:');
        console.error('1. Check your .env file has correct DATABASE_URL');
        console.error('2. Verify you ran the schema.sql in your Neon database');
        console.error('3. Make sure your Neon project is active');
        console.error('4. Check network connection to database');
        process.exit(1);
    } finally {
        await db.closePool();
    }
}

// Run tests
runTests();




