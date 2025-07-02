import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import HabitPersonalizationStep from '@/components/onboarding/HabitPersonalizationStep';
import SocialSetupStep from '@/components/onboarding/SocialSetupStep';
// import NewsPreferencesStep from '@/components/onboarding/NewsPreferencesStep';
import { toast } from '@/components/ui/use-toast';

export interface OnboardingData {
  habits: Array<{
    name: string;
    type: 'positive' | 'negative' | 'neutral';
    frequency: string;
    reminderTime?: string;
    difficulty: string;
    xp_value?: number;
    streak?: number;
  }>;
  profile: {
    username: string;
    displayName: string;
    bio: string;
    visibility: 'public' | 'private';
  };
  // newsPreferences: {
  //   interests: string[];
  //   frequency: string;
  //   preferredTime?: string;
  //   format: 'headlines' | 'summaries' | 'deep_dive';
  // };
}

const Onboarding = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    habits: [],
    profile: {
      username: '',
      displayName: '',
      bio: '',
      visibility: 'public'
    },
    // newsPreferences: {
    //   interests: [],
    //   frequency: 'daily',
    //   format: 'summaries'
    // }
  });

  const steps = [
    { title: 'Welcome', description: 'Get started with LifeQuest' },
    { title: 'Habits', description: 'Personalize your habit tracking' },
    { title: 'Social', description: 'Set up your profile' },
    // { title: 'News & Learning', description: 'Customize your content' }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateOnboardingData = (step: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save habits
      if (onboardingData.habits.length > 0) {
        const habitsToInsert = onboardingData.habits.map(habit => ({
          user_id: user.id,
          habit_name: habit.name,
          habit_type: habit.type,
          frequency: habit.frequency,
          reminder_time: habit.reminderTime || null,
          difficulty: habit.difficulty,
          xp_value:
            habit.xp_value ??
            (habit.difficulty === 'easy'
              ? 30
              : habit.difficulty === 'medium'
              ? 50
              : habit.difficulty === 'hard'
              ? 70
              : 50),
          streak: habit.streak || 0
        }));

        const { error: habitsError } = await supabase
          .from('user_habits')
          .insert(habitsToInsert);

        if (habitsError) throw habitsError;
      }

      // Save profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          username: onboardingData.profile.username,
          display_name: onboardingData.profile.displayName,
          bio: onboardingData.profile.bio,
          profile_visibility: onboardingData.profile.visibility
        });

      if (profileError) throw profileError;

      // // Save news preferences
      // const { error: newsError } = await supabase
      //   .from('user_news_preferences')
      //   .insert({
      //     user_id: user.id,
      //     interests: onboardingData.newsPreferences.interests,
      //     frequency: onboardingData.newsPreferences.frequency,
      //     preferred_time: onboardingData.newsPreferences.preferredTime || null,
      //     format: onboardingData.newsPreferences.format
      //   });

      // if (newsError) throw newsError;

      toast({
        title: "Welcome to LifeQuest!",
        description: "Your account has been set up successfully.",
      });

      // Redirect to main app
      window.location.href = '/';
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStep} />;
      case 1:
        return (
          <HabitPersonalizationStep
            data={onboardingData.habits}
            onUpdate={(habits) => updateOnboardingData('habits', habits)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 2:
        return (
          <SocialSetupStep
            data={onboardingData.profile}
            onUpdate={(profile) => updateOnboardingData('profile', profile)}
            onNext={completeOnboarding}
            onPrev={prevStep}
          />
        );
      // case 3:
      //   return (
      //     <NewsPreferencesStep
      //       data={onboardingData.newsPreferences}
      //       onUpdate={(news) => updateOnboardingData('newsPreferences', news)}
      //       onComplete={completeOnboarding}
      //       onPrev={prevStep}
      //       loading={loading}
      //     />
      //   );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep].description}
            </CardDescription>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;

