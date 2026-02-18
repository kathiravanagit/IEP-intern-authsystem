import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PasswordStrength } from '../components/PasswordStrength';
import { useToast } from '../contexts/ToastContext';
import { APP_NAME } from '../constants';

export const Register = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
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
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      addToast('Registration successful! Check your email to confirm your account.', 'success');
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            fromRegistration: true,
            message: 'Registration successful! Please check your email to confirm your account before logging in.' 
          } 
        });
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      setMessage({ type: 'error', text: errorMsg });
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute top-96 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-accent-400 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
          <nav className="flex flex-wrap gap-4 sm:gap-6">
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
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column - Form */}
          <div className="animate-fade-in-up">
            <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-3 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                Create your account
              </h2>
              <p className="text-base sm:text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                Join thousands of secure users. Simple, fast, and protected.
              </p>

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-lg animate-fade-in ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'success' && (
                      <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder="John Doe"
                    autoComplete="name"
                    label="Full Name"
                  />
                </div>

                <div className="animate-fade-in-up" style={{animationDelay: '0.35s'}}>
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
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    label="Password"
                  />
                  <PasswordStrength password={formData.password} />
                </div>

                <div className="animate-fade-in-up" style={{animationDelay: '0.45s'}}>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    label="Confirm Password"
                  />
                </div>

                <div className="animate-fade-in-up" style={{animationDelay: '0.5s', animationFillMode: 'both'}}>
                  <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold hover-lift">
                    Create Account
                  </Button>
                </div>
              </form>

              <p className="text-center text-base text-primary-700 mt-8 animate-fade-in-up" style={{animationDelay: '0.55s'}}>
                Already have an account?{' '}
                <Link to="/login" className="text-accent-600 hover:text-accent-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Right Column - Benefits */}
          <div className="flex items-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="w-full">
              <div className="bg-white rounded-2xl p-8 lg:p-10 border border-primary-100 shadow-sm hover-lift mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-6">Why join us?</h3>
                <ul className="space-y-5">
                  <li className="flex items-start gap-4 animate-slide-in-left" style={{animationDelay: '0.3s'}}>
                    <span className="text-accent-600 text-2xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <p className="font-semibold text-primary-900">Enterprise Security</p>
                      <p className="text-primary-600 text-sm">Bank-level encryption and protection</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 animate-slide-in-left" style={{animationDelay: '0.4s'}}>
                    <span className="text-accent-600 text-2xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <p className="font-semibold text-primary-900">Team Collaboration</p>
                      <p className="text-primary-600 text-sm">Work seamlessly with your team</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 animate-slide-in-left" style={{animationDelay: '0.5s'}}>
                    <span className="text-accent-600 text-2xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <p className="font-semibold text-primary-900">Analytics & Insights</p>
                      <p className="text-primary-600 text-sm">Track usage and performance metrics</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4 animate-slide-in-left" style={{animationDelay: '0.6s'}}>
                    <span className="text-accent-600 text-2xl flex-shrink-0 mt-1">✓</span>
                    <div>
                      <p className="font-semibold text-primary-900">Two-Factor Authentication</p>
                      <p className="text-primary-600 text-sm">Extra layer of account protection</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Trust Badge */}
              <div className="bg-primary-100/50 backdrop-blur-sm rounded-xl p-6 text-center border border-primary-200 animate-fade-in-up" style={{animationDelay: '0.7s'}}>
                <p className="text-sm text-primary-700 font-medium">
                  Trusted by teams worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};