import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { APP_NAME } from '../constants';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [twoFACode, setTwoFACode] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [requires2FA, setRequires2FA] = useState(false);

  // Check if coming from registration
  useEffect(() => {
    if (location.state?.fromRegistration && location.state?.message) {
      setMessage({ type: 'info', text: location.state.message });
      // Clear the state to prevent message from showing again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? 'Email is required' : '',
        password: !formData.password ? 'Password is required' : '',
      });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.login(formData);

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setMessage({
          type: 'info',
          text: 'Please enter your 2FA code',
        });
        addToast('Please enter your 2FA code', 'info');
      } else {
        setMessage({
          type: 'success',
          text: response.data.message,
        });
        addToast('Login successful!', 'success');

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      setMessage({ type: 'error', text: errorMsg });
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();

    if (!twoFACode) {
      setMessage({
        type: 'error',
        text: 'Please enter your 2FA code',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.verify2FA({ token: twoFACode });

      setMessage({
        type: 'success',
        text: response.data.message,
      });
      addToast('2FA verified successfully!', 'success');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.message || '2FA verification failed';
      setMessage({ type: 'error', text: errorMsg });
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const response = await authAPI.googleLogin({
          token: codeResponse.access_token,
        });

        setMessage({
          type: 'success',
          text: response.data.message,
        });
        addToast('Google login successful!', 'success');

        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Google login failed';
        setMessage({ type: 'error', text: errorMsg });
        addToast(errorMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      const errorMsg = 'Google login failed. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
      addToast(errorMsg, 'error');
    },
  });

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '3s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
          <nav className="flex gap-6">
            <Link to="/register" className="text-primary-700 hover:text-primary-900 font-medium transition-colors">
              Register
            </Link>
            <Link to="/login" className="text-primary-700 hover:text-primary-900 font-medium transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Login Card */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift">
            <h2 className="text-4xl font-bold text-primary-900 mb-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {requires2FA ? 'Verify Your Identity' : 'Welcome Back'}
            </h2>
            <p className="text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              {requires2FA ? 'Enter the code from your authenticator app' : 'Sign in to your account to continue'}
            </p>

            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg animate-fade-in ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : message.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {message.type === 'info' && (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}

            <form onSubmit={requires2FA ? handle2FASubmit : handleSubmit} className="space-y-6">
              {!requires2FA ? (
                <>
                  <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={errors.email}
                      placeholder="you@example.com"
                      autoComplete="email"
                      label="Email Address"
                    />
                  </div>

                  <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-primary-700">Password</label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      error={errors.password}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      label=""
                    />
                  </div>

                  <div className="animate-fade-in-up" style={{animationDelay: '0.5s', animationFillMode: 'both'}}>
                    <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold hover-lift">
                      Sign In
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative animate-fade-in-up" style={{animationDelay: '0.55s'}}>
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-primary-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-primary-600">Or continue with</span>
                    </div>
                  </div>

                  {/* Google Login Button */}
                  <div className="animate-fade-in-up" style={{animationDelay: '0.6s', animationFillMode: 'both'}}>
                    <button
                      type="button"
                      onClick={() => googleLogin()}
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium flex items-center justify-center gap-2 transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </button>
                  </div>
                </>
              ) : (
                <div className="animate-fade-in-up">
                  <Input
                    type="text"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value.replace(/\s/g, '').toUpperCase())}
                    placeholder="000000"
                    maxLength="6"
                    autoFocus
                    label="2FA Verification Code"
                  />

                  <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold mt-6 hover-lift">
                    Verify Code
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequires2FA(false);
                      setTwoFACode('');
                      setFormData({ email: '', password: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    className="w-full mt-3 py-2 text-base text-accent-600 hover:text-accent-700 font-medium transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>

            <p className="text-center text-base text-primary-700 mt-8 animate-fade-in-up" style={{animationDelay: '0.65s'}}>
              {!requires2FA && (
                <>
                  Don't have an account?{' '}
                  <Link to="/register" className="text-accent-600 hover:text-accent-700 font-semibold transition-colors">
                    Create one
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Security Info */}
          <div className="mt-8 text-center animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <p className="text-sm text-primary-600">
              Your data is encrypted and secure
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};