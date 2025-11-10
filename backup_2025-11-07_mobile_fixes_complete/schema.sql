-- ============================================
-- Bignor Park Fishing App - Database Schema
-- PostgreSQL (Neon/Supabase compatible)
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS lakes CASCADE;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_admin ON users(is_admin);

-- ============================================
-- LAKES TABLE
-- ============================================
CREATE TABLE lakes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    max_anglers INTEGER NOT NULL,
    image_url TEXT,
    features TEXT[], -- Array of features like "Up to 35lbs carp", "3 anglers max"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for active lakes
CREATE INDEX idx_lakes_is_active ON lakes(is_active);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(50) UNIQUE NOT NULL, -- Format: BKG-timestamp-random
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lake_id INTEGER NOT NULL REFERENCES lakes(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    lake_name VARCHAR(100) NOT NULL,
    
    -- Booking date/time (stored in UTC)
    booking_date DATE NOT NULL,
    start_time TIMESTAMP NOT NULL, -- UTC timestamp
    end_time TIMESTAMP NOT NULL,   -- UTC timestamp (24 hours later)
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'expired')),
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_date_range CHECK (end_time > start_time)
);

-- Indexes for fast queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_lake_id ON bookings(lake_id);
CREATE INDEX idx_bookings_user_email ON bookings(user_email);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Composite index for checking availability
CREATE INDEX idx_bookings_lake_date_status ON bookings(lake_id, booking_date, status);

-- ============================================
-- INITIAL DATA - Lakes
-- ============================================
INSERT INTO lakes (name, display_name, description, max_anglers, features, image_url) VALUES
(
    'bignor',
    'Bignor Main Lake',
    'Up to 35lbs carp • 3 anglers max • Premium experience',
    3,
    ARRAY['Up to 35lbs carp', '3 anglers maximum', 'Premium fishing experience', 'Well-stocked lake'],
    'bignor-lake-background.jpg'
),
(
    'wood',
    'Wood Pool',
    'Up to 25lbs carp • 2 anglers max • Peaceful setting',
    2,
    ARRAY['Up to 25lbs carp', '2 anglers maximum', 'Peaceful setting', 'Intimate fishing experience'],
    'wood-pool-1.jpg'
);

-- ============================================
-- VIEWS - Useful queries
-- ============================================

-- Active bookings view
CREATE OR REPLACE VIEW active_bookings AS
SELECT 
    b.id,
    b.booking_id,
    b.user_email,
    b.user_name,
    b.lake_name,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.notes,
    b.created_at,
    l.display_name as lake_display_name,
    u.first_name,
    u.last_name,
    u.phone
FROM bookings b
JOIN lakes l ON b.lake_id = l.id
JOIN users u ON b.user_id = u.id
WHERE b.status = 'active' 
  AND b.end_time > CURRENT_TIMESTAMP
ORDER BY b.start_time ASC;

-- Lake availability view
CREATE OR REPLACE VIEW lake_availability AS
SELECT 
    l.id as lake_id,
    l.name as lake_name,
    l.display_name,
    l.max_anglers,
    b.booking_date,
    COUNT(b.id) as current_bookings,
    l.max_anglers - COUNT(b.id) as available_spots
FROM lakes l
LEFT JOIN bookings b ON l.id = b.lake_id 
    AND b.status = 'active' 
    AND b.booking_date >= CURRENT_DATE
GROUP BY l.id, l.name, l.display_name, l.max_anglers, b.booking_date
ORDER BY b.booking_date, l.name;

-- ============================================
-- FUNCTIONS - Useful stored procedures
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lakes_updated_at BEFORE UPDATE ON lakes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check lake availability
CREATE OR REPLACE FUNCTION check_lake_availability(
    p_lake_id INTEGER,
    p_booking_date DATE
)
RETURNS TABLE(
    available_spots INTEGER,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (l.max_anglers - COALESCE(COUNT(b.id), 0))::INTEGER as available_spots,
        (l.max_anglers - COALESCE(COUNT(b.id), 0)) > 0 as is_available
    FROM lakes l
    LEFT JOIN bookings b ON l.id = b.lake_id 
        AND b.booking_date = p_booking_date
        AND b.status = 'active'
    WHERE l.id = p_lake_id
    GROUP BY l.id, l.max_anglers;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old bookings
CREATE OR REPLACE FUNCTION expire_old_bookings()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE bookings
    SET status = 'expired'
    WHERE status = 'active'
      AND end_time < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Create a test admin user (password: Admin123!)
-- Note: In production, use proper password hashing (bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_admin) VALUES
('admin@bignorpark.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'User', '01234567890', TRUE);

-- Create a test member user (password: Member123!)
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_admin) VALUES
('john.doe@example.com', '$2a$10$YourHashedPasswordHere', 'John', 'Doe', '07123456789', FALSE);

-- ============================================
-- CLEANUP & MAINTENANCE
-- ============================================

-- Run this periodically to clean up expired bookings
-- SELECT expire_old_bookings();

-- Query to see all active bookings
-- SELECT * FROM active_bookings;

-- Query to check availability for a specific lake and date
-- SELECT * FROM check_lake_availability(1, '2025-11-10');

-- ============================================
-- NOTES
-- ============================================
-- 1. All times are stored in UTC
-- 2. Passwords should be hashed using bcrypt with salt rounds >= 10
-- 3. Run expire_old_bookings() periodically (cron job or scheduled query)
-- 4. Regular backups are handled automatically by Neon
-- 5. Connection pooling is recommended for production






