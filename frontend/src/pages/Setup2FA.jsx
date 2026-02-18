import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { APP_NAME } from '../constants';

export const Setup2FA = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    initiate2FA();
  }, []);

  const initiate2FA = async () => {
    try {
      const response = await authAPI.setup2FA();
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.manualEntryKey);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to setup 2FA',
      });
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!token || token.length !== 6) {
      setMessage({ type: 'error', text: 'Please enter a valid 6-digit code' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.verify2FASetup({ token });
      setBackupCodes(response.data.data.backupCodes);
      setStep(3);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '2FA verification failed',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', '2fa-backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="relative z-0 pt-8 px-4">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                  s <= step
                    ? 'bg-accent-600 text-white scale-110'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                <p className="text-xs text-primary-600 mt-2 text-center">
                  {s === 1 && 'Scan QR'}
                  {s === 2 && 'Verify'}
                  {s === 3 && 'Backup'}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-1 bg-primary-100 rounded-full relative">
            <div className={`h-full bg-accent-600 rounded-full transition-all duration-500`} style={{width: `${((step - 1) / 2) * 100}%`}} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-0 flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          {/* Card */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-sm border border-primary-100 hover-lift">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Set Up Two-Factor Authentication
            </h2>
            <p className="text-base sm:text-lg text-primary-600 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Add an extra layer of security to your account
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

            {step === 1 && qrCode && (
              <div className="text-center animate-scale-in">
                <p className="mb-6 text-primary-700 font-medium">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
                </p>
                <div className="bg-primary-50 p-6 rounded-xl mb-6 inline-block border border-primary-100">
                  <img src={qrCode} alt="QR Code" className="w-56 h-56 sm:w-64 sm:h-64" />
                </div>
                
                <div className="bg-primary-50 p-4 rounded-xl mb-8 border border-primary-100">
                  <p className="text-xs text-primary-600 mb-2">Manual Entry Key (if needed):</p>
                  <p className="font-mono text-sm break-all text-primary-900 font-semibold">{secret}</p>
                </div>
                
                <Button onClick={() => setStep(2)} className="hover-lift">
                  Next: Verify Code
                </Button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleVerify} className="animate-fade-in-up">
                <p className="mb-6 text-primary-700 font-medium">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <Input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  label="Verification Code"
                />
                <Button type="submit" isLoading={isLoading} className="w-full py-3 text-base font-semibold mt-6 hover-lift">
                  Verify & Enable 2FA
                </Button>
              </form>
            )}

            {step === 3 && backupCodes.length > 0 && (
              <div className="animate-fade-in-up">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                  <p className="text-sm text-amber-900 font-semibold">
                    Save these backup codes in a secure location
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Use them if you lose access to your authenticator app. Each code can only be used once.
                  </p>
                </div>

                <div className="bg-primary-50 p-6 rounded-xl mb-8 border border-primary-100 max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="font-mono text-sm text-primary-900 bg-white p-3 rounded-lg border border-primary-200">
                        <span className="text-primary-500 mr-2">{index + 1}.</span>{code}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button onClick={downloadBackupCodes} variant="secondary" className="w-full">
                    📥 Download Backup Codes
                  </Button>
                  <Button onClick={() => navigate('/dashboard')} className="w-full py-3 text-base font-semibold hover-lift">
                    Finish Setup
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};