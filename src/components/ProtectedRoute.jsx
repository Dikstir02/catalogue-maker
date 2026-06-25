import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback />, unauthenticatedElement }) {
  // Temporary override: disable auth gating so the app works even if login wiring is broken.
  // Enable/disable via VITE_AUTH_BYPASS=true
  const authBypass = import.meta.env.VITE_AUTH_BYPASS === 'true';

  const { isAuthenticated, isLoadingAuth, authChecked, authError, checkUserAuth } = useAuth();

  useEffect(() => {
    if (!authBypass && !authChecked && !isLoadingAuth) {
      checkUserAuth();
    }
  }, [authBypass, authChecked, isLoadingAuth, checkUserAuth]);

  if (authBypass) {
    return <Outlet />;
  }

  if (isLoadingAuth || !authChecked) {
    return fallback;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    return unauthenticatedElement;
  }

  if (!isAuthenticated) {
    return unauthenticatedElement;
  }

  return <Outlet />;
}
