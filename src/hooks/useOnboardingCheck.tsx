
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboardingCheck = () => {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLoading(false);
        setNeedsOnboarding(null);
        return;
      }

      try {
        console.log('Checking onboarding status for user:', user.email);
        
        // Check if user has completed onboarding by checking if they have a profile
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking onboarding status:', error);
          // If there's an error, assume they need onboarding to be safe
          setNeedsOnboarding(true);
        } else {
          const needsOnboarding = !profile;
          console.log('Onboarding check result:', { hasProfile: !!profile, needsOnboarding });
          setNeedsOnboarding(needsOnboarding);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  return { needsOnboarding, loading };
};
