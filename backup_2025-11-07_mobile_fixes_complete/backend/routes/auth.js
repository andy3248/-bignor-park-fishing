/**
 * Authentication Routes
 * Login, signup, logout, and session management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

// ============================================
// VALIDATION HELPERS
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim();
}

// ============================================
// POST /api/auth/signup - Register new user
// ============================================

router.post('/signup', async (req, res) => {
    try {
        let { email, password, firstName, lastName, phone, fishingCode } = req.body;
        
        // Sanitize inputs
        email = sanitizeInput(email);
        firstName = sanitizeInput(firstName);
        lastName = sanitizeInput(lastName);
        phone = sanitizeInput(phone);
        fishingCode = sanitizeInput(fishingCode);
        
        // Validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email, password, first name, and last name are required'
            });
        }
        
        if (!validateEmail(email)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid email format'
            });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Password must be at least 6 characters'
            });
        }
        
        // Check fishing code (required for member signup)
        const validFishingCode = process.env.FISHING_CODE || 'FISH2024';
        if (fishingCode !== validFishingCode) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Invalid fishing code. Please contact admin for the correct code.'
            });
        }
        
        // Check if user already exists
        const existingUser = await db.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'An account with this email already exists'
            });
        }
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create user (will be unapproved by default)
        const newUser = await db.createUser({
            email,
            passwordHash,
            firstName,
            lastName,
            phone: phone || null,
            isAdmin: false
        });
        
        // Return success message without token (user needs admin approval first)
        res.status(201).json({
            message: 'Account created successfully! Please wait for admin approval before logging in.',
            requiresApproval: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                approved: newUser.approved,
                createdAt: newUser.created_at
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create account'
        });
    }
});

// ============================================
// POST /api/auth/login - Login user
// ============================================

router.post('/login', async (req, res) => {
    try {
        let { email, password, fishingCode } = req.body;
        
        // Sanitize inputs
        email = sanitizeInput(email);
        fishingCode = sanitizeInput(fishingCode);
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }
        
        // Check if user is approved (admins are auto-approved)
        if (!user.is_admin && !user.approved) {
            return res.status(403).json({
                error: 'Approval Pending',
                message: 'Your account is pending admin approval. Please wait for approval before logging in.'
            });
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        // Check fishing code for members (admins don't need it)
        if (!user.is_admin) {
            const validFishingCode = process.env.FISHING_CODE || 'FISH2024';
            if (!fishingCode || fishingCode !== validFishingCode) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Invalid fishing code'
                });
            }
        }
        
        // Update last login
        await db.updateLastLogin(user.id);
        
        // Generate token
        const token = generateToken(user);
        
        // Return user data
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                profilePictureUrl: user.profile_picture_url,
                isAdmin: user.is_admin,
                lastLogin: user.last_login
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Login failed'
        });
    }
});

// ============================================
// POST /api/auth/admin-login - Admin login (no fishing code required)
// ============================================

router.post('/admin-login', async (req, res) => {
    try {
        let { email, password } = req.body;
        
        // Sanitize inputs
        email = sanitizeInput(email);
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await db.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        // Check if user is admin
        if (!user.is_admin) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Admin access required'
            });
        }
        
        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Your account has been deactivated'
            });
        }
        
        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        await db.updateLastLogin(user.id);
        
        // Generate token
        const token = generateToken(user);
        
        // Return user data
        res.json({
            message: 'Admin login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                profilePictureUrl: user.profile_picture_url,
                isAdmin: user.is_admin,
                lastLogin: user.last_login
            }
        });
        
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Login failed'
        });
    }
});

// ============================================
// GET /api/auth/me - Get current user
// ============================================

router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await db.findUserByEmail(req.user.email);
        
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                profilePictureUrl: user.profile_picture_url,
                isAdmin: user.is_admin,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user data'
        });
    }
});

// ============================================
// POST /api/auth/logout - Logout (client-side token removal)
// ============================================

router.post('/logout', authenticateToken, (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint is here for consistency and could be used for
    // token blacklisting in the future if needed
    res.json({
        message: 'Logout successful'
    });
});

// ============================================
// POST /api/auth/verify - Verify token validity
// ============================================

router.post('/verify', authenticateToken, (req, res) => {
    // If we reach here, token is valid (authenticateToken middleware passed)
    res.json({
        valid: true,
        user: req.user
    });
});

module.exports = router;

