import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileContextType {
  profile: any;
  habits: any[];
  newsPreferences: any;
  nutritionPreferences: any;
  fitnessGoals: any;
  friends: any[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [newsPreferences, setNewsPreferences] = useState<any>(null);
  const [nutritionPreferences, setNutritionPreferences] = useState<any>(null);
  const [fitnessGoals, setFitnessGoals] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Fetch profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setProfile(profileData);
    // Fetch habits
    const { data: habitsData } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user.id);
    setHabits(habitsData || []);
    // Fetch news preferences
    const { data: newsData } = await supabase
      .from('user_news_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setNewsPreferences(newsData);
    // Fetch nutrition preferences
    const { data: nutritionData } = await supabase
      .from('user_nutrition_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setNutritionPreferences(nutritionData);
    // Fetch fitness goals
    const { data: fitnessData } = await supabase
      .from('user_fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setFitnessGoals(fitnessData);
    // Fetch friends (accepted only)
    const { data: friendsData } = await supabase
      .from('friend_requests')
      .select('sender_id,receiver_id,status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');
    const friendIds = (friendsData || []).map((f: any) => f.sender_id === user.id ? f.receiver_id : f.sender_id);
    let friendProfiles: any[] = [];
    if (friendIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id,username,display_name,bio')
        .in('user_id', friendIds);
      friendProfiles = profilesData || [];
    }
    setFriends(friendProfiles);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchProfileData();
  }, [user, fetchProfileData]);

  return (
    <ProfileContext.Provider value={{ profile, habits, newsPreferences, nutritionPreferences, fitnessGoals, friends, loading, refreshProfile: fetchProfileData }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}; 