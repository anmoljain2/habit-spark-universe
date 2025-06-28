import { useAuth } from '@/hooks/useAuth';
import { useOnboardingCheck } from '@/hooks/useOnboardingCheck';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { needsOnboarding, loading: onboardingLoading } = useOnboardingCheck();

  useEffect(() => {
    if (!authLoading && !user) {
      signOut(); // Sign out and redirect to /auth
    }
  }, [user, authLoading, signOut]);

  useEffect(() => {
    if (!authLoading && !onboardingLoading && user && needsOnboarding) {
      // Only redirect to onboarding if we're not already there
      if (window.location.pathname !== '/onboarding') {
        window.location.href = '/onboarding';
      }
    }
  }, [user, authLoading, onboardingLoading, needsOnboarding]);

  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
