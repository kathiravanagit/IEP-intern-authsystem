import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, require2FAComplete } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { createAuditLog } from '../services/auditService.js';
import { sendLoginConfirmationEmail, sendPasswordResetEmail, send2FAEnabledEmail } from '../services/emailService.js';
import { generateOTP, generateToken, hashToken } from '../utils/crypto.js';
import { validateEmail, validatePassword } from '../utils/validators.js';
import {
  generateTwoFactorSecret,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from '../services/twoFactorService.js';

const router = express.Router();

// Helper: Create JWT Token
const createJWTToken = (userId, twoFactorPending = false) => {
  return jwt.sign(
    { id: userId, twoFactorPending },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Helper: Send JWT Cookie
const sendTokenResponse = (user, res, twoFactorPending = false) => {
  const token = createJWTToken(user._id, twoFactorPending);

  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie('jwt', token, cookieOptions);

  return token;
};

// =====================================================
// POST /auth/register - Register new user
// =====================================================
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, name, password } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid name (at least 2 characters)',
      });
    }

    validateEmail(email);
    validatePassword(password);

    const user = await User.create({
      email,
      name: name.trim(),
      passwordHash: password,
    });

    // Generate email confirmation token for new user
    const token = generateToken();
    const hashedToken = hashToken(token);

    user.emailConfirmToken = hashedToken;
    user.emailConfirmTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    // Send confirmation email
    await sendLoginConfirmationEmail(email, token);

    await createAuditLog({
      userId: user._id,
      action: 'REGISTER',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    await createAuditLog({
      userId: user._id,
      action: 'EMAIL_CONFIRMATION_SENT',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to confirm your account.',
      data: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/login - Login (sends confirmation email)
// =====================================================
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    validateEmail(email);

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password',
      });
    }

    const user = await User.findOne({ email })
      .select('+passwordHash +emailConfirmToken +emailConfirmTokenExpiresAt +twoFactorEnabled +isEmailConfirmed');

    if (!user || !(await user.comparePassword(password))) {
      await createAuditLog({
        action: 'LOGIN_FAILURE',
        email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { reason: 'Invalid credentials' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // If email is already confirmed, allow direct login
    if (user.isEmailConfirmed) {
      // Check if 2FA is enabled
      if (user.twoFactorEnabled) {
        // Set JWT with 2FA pending flag
        sendTokenResponse(user, res, true);

        await createAuditLog({
          userId: user._id,
          action: 'LOGIN_ATTEMPT',
          email: user.email,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          metadata: { twoFactorRequired: true },
        });

        return res.status(200).json({
          success: true,
          message: 'Please enter your 2FA code.',
          requires2FA: true,
          data: {
            user: {
              id: user._id,
              email: user.email,
              name: user.name,
            },
          },
        });
      }

      // No 2FA - complete login
      sendTokenResponse(user, res, false);

      await createAuditLog({
        userId: user._id,
        action: 'LOGIN_SUCCESS',
        email: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        requires2FA: false,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
        },
      });
    }

    // Email not confirmed - send confirmation email
    const token = generateToken();
    const hashedToken = hashToken(token);

    user.emailConfirmToken = hashedToken;
    user.emailConfirmTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send confirmation email
    await sendLoginConfirmationEmail(email, token);

    await createAuditLog({
      userId: user._id,
      action: 'EMAIL_CONFIRMATION_SENT',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Confirmation email sent! Please check your inbox and click the link to login.',
      has2FA: user.twoFactorEnabled,
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GET /auth/confirm-login - Confirm login via email link
// =====================================================
router.get('/confirm-login', async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing token',
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailConfirmToken: hashedToken,
      emailConfirmTokenExpiresAt: { $gt: Date.now() },
    }).select('+emailConfirmToken +emailConfirmTokenExpiresAt +twoFactorEnabled');

    if (!user) {
      await createAuditLog({
        action: 'LOGIN_FAILURE',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { reason: 'Invalid or expired confirmation token' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired confirmation link',
      });
    }

    // Clear confirmation token
    user.emailConfirmToken = undefined;
    user.emailConfirmTokenExpiresAt = undefined;
    user.isEmailConfirmed = true;
    user.isVerified = true;
    await user.save();

    await createAuditLog({
      userId: user._id,
      action: 'EMAIL_CONFIRMED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Set JWT with 2FA pending flag
      sendTokenResponse(user, res, true);

      await createAuditLog({
        userId: user._id,
        action: 'LOGIN_ATTEMPT',
        email: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { twoFactorRequired: true },
      });

      return res.status(200).json({
        success: true,
        message: 'Email confirmed. Please enter your 2FA code.',
        requires2FA: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
        },
      });
    }

    // No 2FA - complete login
    sendTokenResponse(user, res, false);

    await createAuditLog({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Login Granted',
      requires2FA: false,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/verify-2fa - Verify 2FA code
// =====================================================
router.post('/verify-2fa', authenticate, authLimiter, async (req, res, next) => {
  try {
    const { token, backupCode } = req.body;

    if (!req.user.twoFactorPending) {
      return res.status(400).json({
        success: false,
        message: '2FA verification not required',
      });
    }

    const user = await User.findById(req.user.id)
      .select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this account',
      });
    }

    let verified = false;

    // Try TOTP token first
    if (token) {
      verified = verifyTOTP(user.twoFactorSecret, token);
    }

    // Try backup code if TOTP failed
    if (!verified && backupCode) {
      const codeIndex = await verifyBackupCode(
        user.twoFactorBackupCodes,
        backupCode
      );
      
      if (codeIndex !== -1) {
        verified = true;
        user.twoFactorBackupCodes.splice(codeIndex, 1);
        await user.save();

        await createAuditLog({
          userId: user._id,
          action: 'BACKUP_CODE_USED',
          email: user.email,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      }
    }

    if (!verified) {
      await createAuditLog({
        userId: user._id,
        action: 'LOGIN_FAILURE',
        email: user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        metadata: { reason: 'Invalid 2FA code' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA code or backup code',
      });
    }

    // Issue final JWT without 2FA pending flag
    sendTokenResponse(user, res, false);

    await createAuditLog({
      userId: user._id,
      action: '2FA_VERIFIED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    await createAuditLog({
      userId: user._id,
      action: 'LOGIN_SUCCESS',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { method: token ? 'TOTP' : 'backup_code' },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/google-login - Google OAuth login
// =====================================================
router.post('/google-login', authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required',
      });
    }

    // Note: In production, verify the token with Google's API
    // For now, this is a placeholder that expects the frontend to send a valid token
    // You'll need to implement proper token verification using:
    // import { OAuth2Client } from 'google-auth-library';
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken: token });

    // Placeholder: Extract email from token (in production, verify with Google)
    // For now, return a message asking to implement Google verification
    
    await createAuditLog({
      action: 'GOOGLE_LOGIN_ATTEMPT',
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.status(501).json({
      success: false,
      message: 'Google login is not yet fully configured. Please implement Google token verification in the backend using google-auth-library.',
      details: 'Install: npm install google-auth-library and configure GOOGLE_CLIENT_ID in .env'
    });

  } catch (error) {
    next(error);
  }
});
// =====================================================
router.post('/2fa/setup', authenticate, require2FAComplete, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is already enabled',
      });
    }

    const { secret, otpauthUrl } = generateTwoFactorSecret(user.email);
    const qrCode = await generateQRCode(otpauthUrl);

    user.twoFactorSecret = secret;
    user.twoFactorVerified = false;
    await user.save();

    await createAuditLog({
      userId: user._id,
      action: '2FA_SETUP_INITIATED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Scan the QR code with your authenticator app',
      data: {
        qrCode,
        secret,
        manualEntryKey: secret,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/2fa/verify-setup - Verify 2FA setup
// =====================================================
router.post('/2fa/verify-setup', authenticate, require2FAComplete, authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Please provide 2FA token',
      });
    }

    const user = await User.findById(req.user.id)
      .select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Please initiate 2FA setup first',
      });
    }

    const verified = verifyTOTP(user.twoFactorSecret, token);

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token',
      });
    }

    const backupCodes = generateBackupCodes();
    const hashedCodes = await hashBackupCodes(backupCodes);

    user.twoFactorEnabled = true;
    user.twoFactorVerified = true;
    user.twoFactorBackupCodes = hashedCodes;
    await user.save();

    await send2FAEnabledEmail(user.email);

    await createAuditLog({
      userId: user._id,
      action: '2FA_ENABLED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: '2FA enabled successfully! Save your backup codes.',
      data: {
        backupCodes,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/2fa/disable - Disable 2FA
// =====================================================
router.post('/2fa/disable', authenticate, require2FAComplete, authLimiter, async (req, res, next) => {
  try {
    const { password, token } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    const user = await User.findById(req.user.id)
      .select('+passwordHash +twoFactorSecret +twoFactorBackupCodes');

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    if (user.twoFactorEnabled && !verifyTOTP(user.twoFactorSecret, token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid 2FA token',
      });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    user.twoFactorVerified = false;
    await user.save();

    await createAuditLog({
      userId: user._id,
      action: '2FA_DISABLED',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/forgot-password - Request password reset
// =====================================================
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    validateEmail(email);

    const user = await User.findOne({ email }).select('+otp +otpExpiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email id does not exist',
      });
    }

    const otp = generateOTP();

    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(email, otp);

    await createAuditLog({
      userId: user._id,
      action: 'PASSWORD_RESET_REQUEST',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to your email',
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/reset-password - Reset password with OTP
// =====================================================
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    validateEmail(email);
    validatePassword(newPassword);

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP',
      });
    }

    const user = await User.findOne({
      email,
      otp,
      otpExpiresAt: { $gt: Date.now() },
    }).select('+otp +otpExpiresAt +passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    user.passwordHash = newPassword;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    await createAuditLog({
      userId: user._id,
      action: 'PASSWORD_RESET_SUCCESS',
      email: user.email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in.',
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST /auth/logout - Logout user
// =====================================================
router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await createAuditLog({
          userId: decoded.id,
          action: 'LOGOUT',
          ip: req.ip,
          userAgent: req.get('user-agent'),
        });
      } catch (err) {
        // Token invalid, just clear cookie
      }
    }

    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;