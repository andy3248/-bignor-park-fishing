/**
 * User Routes
 * User profile management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticateToken);

// ============================================
// GET /api/users/profile - Get user profile
// ============================================

router.get('/profile', async (req, res) => {
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
                isActive: user.is_active,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get profile'
        });
    }
});

// ============================================
// PUT /api/users/profile - Update user profile
// ============================================

router.put('/profile', async (req, res) => {
    try {
        const { firstName, lastName, phone, profilePictureUrl } = req.body;
        const userId = req.user.id;
        
        // Sanitize inputs
        const updates = {};
        if (firstName !== undefined) updates.firstName = firstName.trim();
        if (lastName !== undefined) updates.lastName = lastName.trim();
        if (phone !== undefined) updates.phone = phone.trim();
        if (profilePictureUrl !== undefined) updates.profilePictureUrl = profilePictureUrl.trim();
        
        // Validation
        if (updates.firstName && updates.firstName.length < 1) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'First name cannot be empty'
            });
        }
        
        if (updates.lastName && updates.lastName.length < 1) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Last name cannot be empty'
            });
        }
        
        // Update user
        const updatedUser = await db.updateUser(userId, updates);
        
        if (!updatedUser) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                phone: updatedUser.phone,
                profilePictureUrl: updatedUser.profile_picture_url
            }
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update profile'
        });
    }
});

// ============================================
// PUT /api/users/password - Change password
// ============================================

router.put('/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'Current password and new password are required'
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'New password must be at least 6 characters'
            });
        }
        
        // Get user
        const user = await db.findUserByEmail(req.user.email);
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }
        
        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Current password is incorrect'
            });
        }
        
        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password in database
        await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );
        
        res.json({
            message: 'Password updated successfully'
        });
        
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to change password'
        });
    }
});

module.exports = router;

