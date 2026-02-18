import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { useToast } from '../contexts/ToastContext';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { APP_NAME } from '../constants';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mathQuestion, setMathQuestion] = useState(() => ({ text: '', answer: 0 }));
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathFeedback, setMathFeedback] = useState('');
  const [mathScore, setMathScore] = useState(0);

  // Session timeout - 30 minutes of inactivity
  useSessionTimeout(30);

  const displayName = () => {
    if (user?.name && user.name.trim() !== '') {
      return user.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await userAPI.getMe();
        const userData = response.data.data.user;
        setUser(userData);
      } catch (error) {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const firstQuestion = createMathQuestion();
    setMathQuestion(firstQuestion);
  }, []);

  const handleLogout = async () => {
    const shouldLogout = window.confirm('Are you sure you want to sign out?');
    if (!shouldLogout) {
      return;
    }

    try {
      await authAPI.logout();
      addToast('Logged out successfully', 'success');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Error logging out', 'error');
    }
  };

  const createMathQuestion = () => {
    const operations = ['+', '-', '*'];
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const operation = operations[randomInt(0, operations.length - 1)];
    let a = randomInt(1, 12);
    let b = randomInt(1, 12);

    if (operation === '-' && b > a) {
      [a, b] = [b, a];
    }

    let answer = 0;
    if (operation === '+') {
      answer = a + b;
    } else if (operation === '-') {
      answer = a - b;
    } else {
      answer = a * b;
    }

    return {
      text: `${a} ${operation} ${b}`,
      answer,
    };
  };

  const handleMathSubmit = (event) => {
    event.preventDefault();

    if (mathAnswer.trim() === '' || Number.isNaN(Number(mathAnswer))) {
      setMathFeedback('Please enter a number.');
      return;
    }

    const userAnswer = Number(mathAnswer);
    if (userAnswer === mathQuestion.answer) {
      setMathScore((prev) => {
        const nextScore = prev + 1;
        setMathFeedback(`Correct! Score: ${nextScore}.`);
        return nextScore;
      });
    } else {
      setMathScore((prev) => {
        setMathFeedback(`Not quite. You scored ${prev}. Resetting to 0.`);
        return 0;
      });
    }

    setMathAnswer('');
    setMathQuestion(createMathQuestion());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-accent-600 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-primary-100 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary-900 animate-fade-in">{APP_NAME}</h1>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              to="/profile"
              className="text-primary-700 font-medium hover:text-primary-900 transition-colors"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-0 flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-900 mb-2">Welcome Back, {displayName()}!</h2>
            <p className="text-base sm:text-lg lg:text-xl text-primary-600">Your account is secure and ready to use</p>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Email Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 hover-lift animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">Email</h3>
              </div>
              <p className="text-sm text-primary-600">{user?.email}</p>
              <div className="mt-4 pt-4 border-t border-primary-100">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user?.isEmailConfirmed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}>
                  {user?.isEmailConfirmed ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>

            {/* 2FA Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 hover-lift animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">Security</h3>
              </div>
              <p className="text-sm text-primary-600">Two-Factor Authentication</p>
              <div className="mt-4 pt-4 border-t border-primary-100">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user?.twoFactorEnabled
                    ? 'bg-green-50 text-green-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
            </div>

            {/* Account Age Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 hover-lift animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">Member</h3>
              </div>
              <p className="text-sm text-primary-600">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                }) : 'N/A'}
              </p>
              <div className="mt-4 pt-4 border-t border-primary-100">
                <p className="text-xs text-primary-500">Account created</p>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-100 hover-lift animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary-900">Status</h3>
              </div>
              <p className="text-sm text-primary-600">Account Status</p>
              <div className="mt-4 pt-4 border-t border-primary-100">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Math Game */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-100 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-bold text-primary-900">Quick Math Game</h3>
                <p className="text-primary-600">Practice addition, subtraction, and multiplication</p>
              </div>
              <div className="text-sm text-primary-600">
                Score: <span className="font-semibold text-primary-900">{mathScore}</span>
              </div>
            </div>

            <form onSubmit={handleMathSubmit} className="space-y-4">
              <div className="text-2xl sm:text-3xl font-semibold text-primary-900">{mathQuestion.text}</div>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="number"
                  inputMode="numeric"
                  value={mathAnswer}
                  onChange={(event) => setMathAnswer(event.target.value)}
                  className="w-full md:w-48 rounded-lg border border-primary-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  placeholder="Your answer"
                  aria-label="Math answer"
                />
                <Button type="submit" className="w-full md:w-auto">
                  Check Answer
                </Button>
              </div>

              {mathFeedback && (
                <p className="text-sm text-primary-700">{mathFeedback}</p>
              )}
            </form>
          </div>

        </div>
      </main>
    </div>
  );
};