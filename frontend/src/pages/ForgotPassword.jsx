import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../constants';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.forgotPassword({ email });

      setMessage({
        type: 'success',
        text: response.data.message,
      });

      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 2000);
    } catch (error) {
      if (error.response?.status === 404) {
        setMessage({
          type: 'error',
          text: 'Email id does not exist',
        });
        return;
      }

      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send reset code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Card */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift">
            <h2 className="text-3xl font-bold text-primary-900 mb-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Forgot Password?
            </h2>
            <p className="text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              We'll send you a code to reset your password
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

            <form onSubmit={handleSubmit} className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                error={error}
                placeholder="you@example.com"
                autoComplete="email"
                label="Email Address"
              />

              <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold mt-6 hover-lift">
                Send Reset Code
              </Button>
            </form>

            <p className="text-center text-base text-primary-700 mt-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
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