export const PasswordStrength = ({ password }) => {
  const getStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // Character variety
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 25, text: 'Weak', color: 'bg-red-500' };
    if (strength <= 4) return { level: 50, text: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 5) return { level: 75, text: 'Good', color: 'bg-blue-500' };
    return { level: 100, text: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-primary-600">Password Strength:</span>
        <span className={`text-xs font-medium ${
          strength.text === 'Weak' ? 'text-red-600' :
          strength.text === 'Fair' ? 'text-yellow-600' :
          strength.text === 'Good' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strength.text}
        </span>
      </div>
      <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.level}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-primary-500 space-y-1">
        <p className={password.length >= 8 ? 'text-green-600' : ''}>
          {password.length >= 8 ? '✓' : '○'} At least 8 characters
        </p>
        <p className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-green-600' : ''}>
          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? '✓' : '○'} Upper & lowercase letters
        </p>
        <p className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
          {/[0-9]/.test(password) ? '✓' : '○'} At least one number
        </p>
        <p className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : ''}>
          {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} Special character (!@#$%)
        </p>
      </div>
    </div>
  );
};
