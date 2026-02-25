import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on auth pages
      const authPages = ['/login', '/register', '/forgot-password', '/reset-password', '/confirm-login'];
      if (!authPages.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google-login', data),
  confirmLogin: (token) => api.get(`/auth/confirm-login?token=${token}`),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FASetup: (data) => api.post('/auth/2fa/verify-setup', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
};

// User API calls
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

export default api;
