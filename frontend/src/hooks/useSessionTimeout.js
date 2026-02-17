import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../services/api';

export const useSessionTimeout = (timeoutMinutes = 30) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Show warning 2 minutes before timeout
    warningRef.current = setTimeout(() => {
      addToast('Your session will expire in 2 minutes due to inactivity', 'warning');
    }, (timeoutMinutes - 2) * 60 * 1000);

    // Set logout timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await authAPI.logout();
        addToast('Session expired due to inactivity', 'info');
        navigate('/login');
      } catch (error) {
        navigate('/login');
      }
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    // Events that reset the timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [timeoutMinutes, navigate, addToast]);
};
