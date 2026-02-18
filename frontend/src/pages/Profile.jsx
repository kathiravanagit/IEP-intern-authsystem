import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../contexts/ToastContext';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { APP_NAME } from '../constants';

export const Profile = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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
        setProfileForm({
          name: userData.name || '',
          email: userData.email || '',
        });
      } catch (error) {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

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

  const handleSetup2FA = () => {
    navigate('/setup-2fa');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await userAPI.updateMe({
        name: profileForm.name,
        email: profileForm.email,
      });

      setUser(response.data.data.user);
      addToast('Profile updated successfully', 'success');

      if (profileForm.email !== user.email) {
        addToast('Email changed. Please verify your new email address.', 'info');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      addToast(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }

    setIsUpdating(true);

    try {
      await userAPI.updateMe({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      addToast('Password updated successfully', 'success');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update password';
      addToast(message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-200 border-t-accent-600 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col">
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '0s'}} />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}} />
      </div>

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

      <main className="relative z-0 flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-900 mb-2">Profile & Security</h2>
            <p className="text-base sm:text-lg text-primary-600">Manage your account details and security settings</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-100 mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-2xl font-bold text-primary-900 mb-6">Profile Information</h3>

            <form onSubmit={handleProfileUpdate} className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
                {profileForm.email !== user?.email && (
                  <p className="mt-2 text-sm text-yellow-600">
                    Warning: changing email will require re-verification
                  </p>
                )}
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isUpdating || (profileForm.name === user?.name && profileForm.email === user?.email)}
                  className="w-full md:w-auto"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>

            <div className="border-t border-primary-100 pt-8">
              <h4 className="text-xl font-bold text-primary-900 mb-4">Change Password</h4>

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                  <p className="mt-1 text-xs text-primary-500">
                    Must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isUpdating || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isUpdating ? 'Updating...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-100 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <h3 className="text-2xl font-bold text-primary-900 mb-6">Security Settings</h3>

            <div className="space-y-4">
              {!user?.twoFactorEnabled && (
                <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-accent-900">Enable Two-Factor Authentication</h4>
                    <p className="text-sm text-accent-700 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <Button
                    onClick={handleSetup2FA}
                    className="flex-shrink-0 ml-4"
                  >
                    Enable 2FA
                  </Button>
                </div>
              )}

              {user?.twoFactorEnabled && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-semibold text-green-900">Two-Factor Authentication Enabled</h4>
                    <p className="text-sm text-green-700 mt-1">Your account has maximum security protection</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
