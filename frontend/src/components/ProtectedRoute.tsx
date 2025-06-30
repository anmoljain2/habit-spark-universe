
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboardingCheck();

  console.log('ProtectedRoute state:', { 
    user: user?.email, 
    authLoading, 
    onboardingLoading, 
    needsOnboarding,
    currentPath: window.location.pathname 
  });

  useEffect(() => {
    // Only redirect if we're sure about the auth state
    if (!authLoading && !user) {
      console.log('No user found, redirecting to auth');
      window.location.href = '/auth';
      return;
    }

    // Only redirect to onboarding if we're sure they need it and not already there
    if (!authLoading && !onboardingLoading && user && needsOnboarding) {
      if (window.location.pathname !== '/onboarding') {
        console.log('User needs onboarding, redirecting');
        window.location.href = '/onboarding';
        return;
      }
    }
  }, [user, authLoading, onboardingLoading, needsOnboarding]);

  // Show loading while checking auth state
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user, don't render children (redirect will happen in useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If user needs onboarding and not on onboarding page, don't render children
  if (needsOnboarding && window.location.pathname !== '/onboarding') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
