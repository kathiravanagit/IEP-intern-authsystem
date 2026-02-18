import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../constants';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.otp) newErrors.otp = 'OTP is required';
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      setMessage({
        type: 'success',
        text: response.data.message,
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Password reset failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-1/3 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Card */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Reset Password
            </h2>
            <p className="text-base sm:text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Enter the code sent to your email
            </p>

            {message.text && (
              <div
                className={`mb-6 p-4 rounded-lg animate-fade-in ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="you@example.com"
                  label="Email Address"
                />
              </div>

              <div className="animate-fade-in-up" style={{animationDelay: '0.35s'}}>
                <Input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  error={errors.otp}
                  placeholder="000000"
                  maxLength="6"
                  label="Reset Code"
                />
              </div>

              <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                <Input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  placeholder="Enter new password"
                  label="New Password"
                />
              </div>

              <div className="animate-fade-in-up" style={{animationDelay: '0.45s'}}>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Confirm password"
                  label="Confirm Password"
                />
              </div>

              <div className="animate-fade-in-up" style={{animationDelay: '0.5s', animationFillMode: 'both'}}>
                <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold hover-lift">
                  Reset Password
                </Button>
              </div>
            </form>

            <p className="text-center text-base text-primary-700 mt-8 animate-fade-in-up" style={{animationDelay: '0.55s'}}>
              <Link to="/login" className="text-accent-600 hover:text-accent-700 font-semibold transition-colors">
                ← Back to login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};