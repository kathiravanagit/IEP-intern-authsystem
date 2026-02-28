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

// =====================================================
// GET /users/sessions - Get all active sessions
// =====================================================
router.get('/sessions', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+activeSessions').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Sort activeSessions by date, so newest is first
    const sessions = user.activeSessions || [];
    sessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

    return res.status(200).json({
      success: true,
      data: {
        sessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// DELETE /users/sessions/:id - Revoke a specific session
// =====================================================
router.delete('/sessions/:id', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const { id: sessionIdToRemove } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { activeSessions: { sessionId: sessionIdToRemove } } },
      { new: true }
    ).select('+activeSessions');

    await createAuditLog({
      userId: user._id,
      action: 'SESSION_REVOKED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { revokedSessionId: sessionIdToRemove },
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: {
        sessions: user.activeSessions,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// DELETE /users/me - Danger Zone: Delete Account
// =====================================================
router.delete('/me', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to delete account' });
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const emailBeforeDelete = user.email;

    await User.findByIdAndDelete(req.user.id);

    await createAuditLog({
      userId: req.user.id,
      action: 'ACCOUNT_DELETED',
      email: emailBeforeDelete,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Clear JWT cookie
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;