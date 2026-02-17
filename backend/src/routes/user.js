import express from 'express';
import User from '../models/User.js';
import { authenticate, require2FAComplete } from '../middleware/auth.js';
import { createAuditLog } from '../services/auditService.js';
import { validateEmail, validatePassword } from '../utils/validators.js';

const router = express.Router();

// =====================================================
// GET /users/me - Get current user profile
// =====================================================
router.get('/me', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('name email isVerified isEmailConfirmed twoFactorEnabled createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
          isEmailConfirmed: user.isEmailConfirmed,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// PUT /users/me - Update current user profile
// =====================================================
router.put('/me', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id).select('+passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const changes = {};
    const oldValues = {};

    // Update name if provided
    if (name !== undefined && name !== user.name) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long',
        });
      }
      oldValues.name = user.name;
      user.name = name.trim();
      changes.name = name.trim();
    }

    // Update email if provided
    if (email !== undefined && email !== user.email) {
      validateEmail(email);
      
      // Check if email is already taken
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use',
        });
      }

      oldValues.email = user.email;
      user.email = email;
      user.isEmailConfirmed = false; // Require re-confirmation
      changes.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      validatePassword(newPassword);
      user.passwordHash = newPassword; // Will be hashed by pre-save hook
      changes.password = 'updated';
    }

    // Save changes if any
    if (Object.keys(changes).length > 0) {
      await user.save();

      await createAuditLog({
        userId: user._id,
        action: 'PROFILE_UPDATE',
        email: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        metadata: {
          changes,
          oldValues,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isEmailConfirmed: user.isEmailConfirmed,
            twoFactorEnabled: user.twoFactorEnabled,
          },
        },
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'No changes made',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            isEmailConfirmed: user.isEmailConfirmed,
            twoFactorEnabled: user.twoFactorEnabled,
          },
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;