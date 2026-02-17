# IEP Project - Frontend

A React + Vite authentication application with secure login, registration, two-factor authentication, and user profile management.

## Features

- User registration and login with email verification
- Two-factor authentication (2FA)
- Secure password reset
- Profile management
- Session timeout (30 minutes)
- Math game on dashboard
- Responsive design with Tailwind CSS

## Setup

```bash
npm install
npm start
```

## Environment Variables

Set `VITE_API_URL` in `.env` to your backend API URL.

# Backend

A secure Node.js/Express authentication API with MongoDB, JWT, 2FA, email verification, and password reset functionality.

## Features

- User registration and login with email verification
- Two-factor authentication (TOTP)
- Password reset with OTP
- Profile management
- Audit logging
- Rate limiting
- Response compression
- Security headers with Helmet
- NoSQL injection protection

## Setup

```bash
npm install
npm start
```

## Environment Variables

Configure these in `.env`:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `BREVO_API_KEY`: Email service API key
- `BREVO_SENDER_EMAIL`: Sender email address
- `RATE_LIMIT_MAX_REQUESTS`: Max auth requests per window (default: 100)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in ms (default: 15 min)

## API Routes

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/confirm-login` - Confirm email and login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with OTP
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify-setup` - Verify 2FA setup
- `POST /api/auth/verify-2fa` - Verify 2FA code
- `POST /api/auth/2fa/disable` - Disable 2FA
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile/password
