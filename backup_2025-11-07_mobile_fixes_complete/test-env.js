require('dotenv').config();

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? 'Found!' : 'Not found');

if (process.env.DATABASE_URL) {
    console.log('Connection string starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
} else {
    console.log('');
    console.log('❌ .env file not found or DATABASE_URL not set');
    console.log('');
    console.log('Please create a .env file in the project root with:');
    console.log('DATABASE_URL=postgresql://...');
}

