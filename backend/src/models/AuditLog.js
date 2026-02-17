import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'REGISTER',
      'LOGIN_ATTEMPT',
      'LOGIN_SUCCESS',
      'LOGIN_FAILURE',
      'EMAIL_CONFIRMATION_SENT',
      'EMAIL_CONFIRMED',
      'LOGOUT',
      'PASSWORD_RESET_REQUEST',
      'PASSWORD_RESET_SUCCESS',
      'OTP_SENT',
      'OTP_VERIFIED',
      '2FA_SETUP_INITIATED',
      '2FA_ENABLED',
      '2FA_DISABLED',
      '2FA_VERIFIED',
      'BACKUP_CODE_USED',
      'PROFILE_UPDATE',
    ],
  },
  email: {
    type: String,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for querying
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);