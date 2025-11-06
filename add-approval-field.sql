-- Add approval field to users table
-- This allows admin approval workflow for new signups

-- Add the approved column (default TRUE for existing users, FALSE for new signups)
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Set existing users to approved (so they don't get locked out)
UPDATE users SET approved = TRUE WHERE approved IS NULL OR approved = FALSE;

-- Create index for faster approval queries
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);

-- Show all users and their approval status
SELECT id, email, first_name, last_name, is_admin, approved, created_at 
FROM users 
ORDER BY created_at DESC;

