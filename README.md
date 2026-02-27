# IEP Auth System

A production-ready Full Stack Authentication application built with a modern React (Vite) frontend and a secure Node.js (Express) backend. This system implements enterprise-level security architecture including JWT Sessions, Two-Factor Authentication (TOTP), Google OAuth, and active device tracking.

![React](https://img.shields.io/badge/Frontend-React_18.2-blue)
![NodeJS](https://img.shields.io/badge/Backend-Node.js_20-green)
![Security](https://img.shields.io/badge/Security-Enterprise_Grade-success)

---

## 🚀 Key Features

* **Secure Authentication:** JWTs stored in `HttpOnly`, `Secure` cookies preventing XSS attacks. Includes a "Remember Me" option for extended 30-day sessions.
* **Social Login:** Seamless "Continue with Google" OAuth 2.0 integration.
* **Two-Factor Authentication (2FA):** TOTP Authenticator integration (Google Authenticator, Authy) with secure backup codes.
* **Active Device Management:** Tracks active session IPs and User-Agents, allowing users to remotely terminate unrecognized logins.
* **Account Security:** Secure email verification, OTP password resets, and a permanent "Danger Zone" account deletion flow.
* **Backend Infrastructure:** Built-in rate limiting, NoSQL injection protection, secure Helmet headers, and comprehensive audit logging.

---

## 💻 Tech Stack

* **Frontend:** React, Vite, TailwindCSS, React Router DOM, Axios
* **Backend:** Node.js, Express, MongoDB/Mongoose
* **Security & Utils:** JSONWebTokens (JWT), bcryptjs, Speakeasy, Brevo (Sendinblue)

---

## 🛠️ Local Setup

### 1. Backend Initialization
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_cluster_url
JWT_SECRET=super_secure_random_string
JWT_EXPIRES_IN=7d
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_email@domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
Run the backend:
```bash
npm run dev
```

### 2. Frontend Initialization
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_cloud_client_id
```
Run the frontend:
```bash
npm run dev
```

---

## ☁️ Deployment

This project is configured for seamless deployment to modern hosting platforms.

**Backend (Render):**
Deploy the `backend` folder as a Web Service on Render. Set the Build Command to `npm install` and the Start Command to `node server.js`. Ensure all environment variables are added.

**Frontend (Vercel):**
Deploy the `frontend` folder to Vercel using the Vite framework preset. Ensure `VITE_API_URL` points to your active Render backend domain.
