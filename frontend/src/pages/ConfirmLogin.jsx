import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../constants';

export const ConfirmLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);

  useEffect(() => {
    const confirmLogin = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing token');
        return;
      }

      try {
        const response = await authAPI.confirmLogin(token);
        setStatus('success');
        setMessage(response.data.message);

        if (response.data.requires2FA) {
          setRequires2FA(true);
          setTimeout(() => {
            navigate('/verify-2fa');
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Login confirmation failed');
      }
    };

    confirmLogin();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift text-center">
            {status === 'loading' && (
              <div className="animate-fade-in-up">
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-accent-600 mx-auto"></div>
                </div>
                <h2 className="text-2xl font-bold text-primary-900 mb-2">Confirming Login</h2>
                <p className="text-lg text-primary-600">
                  Verifying your credentials...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="animate-scale-in">
                <h2 className="text-2xl font-bold text-green-700 mb-2">{message}</h2>
                <p className="text-lg text-primary-600 mb-8">
                  {requires2FA ? 'Redirecting to 2FA verification...' : 'Redirecting to dashboard...'}
                </p>
                <div className="h-1 bg-primary-100 rounded-full relative overflow-hidden">
                  <div className="h-full bg-accent-600 rounded-full animate-pulse" style={{width: '100%'}} />
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="animate-fade-in-up">
                <h2 className="text-2xl font-bold text-red-700 mb-2">Login Failed</h2>
                <p className="text-lg text-red-600 mb-8">{message}</p>
                <Button onClick={() => navigate('/login')} className="w-full">
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};