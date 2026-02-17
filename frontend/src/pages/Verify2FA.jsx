import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../constants';

export const Verify2FA = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage({ type: 'error', text: 'Please enter a code' });
      return;
    }

    setIsLoading(true);

    try {
      const payload = useBackupCode ? { backupCode: token } : { token };
      const response = await authAPI.verify2FA(payload);

      setMessage({ type: 'success', text: response.data.message });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '2FA verification failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '3s'}} />
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
              Two-Factor Authentication
            </h2>
            <p className="text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              {useBackupCode
                ? 'Enter one of your backup codes'
                : 'Enter the code from your authenticator app'}
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
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\s/g, '').toUpperCase())}
                placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
                maxLength={useBackupCode ? '8' : '6'}
                autoFocus
                label={useBackupCode ? 'Backup Code' : 'Verification Code'}
              />

              <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold mt-6 hover-lift">
                Verify
              </Button>
            </form>

            <div className="mt-8 text-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setToken('');
                  setMessage({ type: '', text: '' });
                }}
                className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
              >
                {useBackupCode ? '↳ Use authenticator code' : '↳ Use backup code'}
              </button>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-8 text-center animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <p className="text-sm text-primary-600">
              Your login is protected by two-factor authentication
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};