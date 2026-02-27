import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+activeSessions');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // Verify session still exists (wasn't revoked remotely)
    if (decoded.sessionId) {
      const activeSession = user.activeSessions?.find(s => s.sessionId === decoded.sessionId);
      if (!activeSession) {
        return res.status(401).json({
          success: false,
          message: 'Session has been revoked or expired. Please log in again.',
        });
      }

      // Optional: update lastActive timestamp (debounce to avoid saving every single request)
    }

    req.user = {
      ...user.toObject(),
      id: user._id,
      twoFactorPending: decoded.twoFactorPending || false,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

// Middleware to block access if 2FA is pending
export const require2FAComplete = (req, res, next) => {
  if (req.user.twoFactorPending) {
    return res.status(403).json({
      success: false,
      message: '2FA verification required',
    });
  }
  next();
};