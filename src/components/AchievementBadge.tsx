import { useEffect, useState } from 'react';
import { Trophy, Star, Target, Flame, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const ACHIEVEMENTS = [
  {
    key: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first habit',
    icon: <Star className="w-6 h-6" />,
  },
  {
    key: 'streak_starter',
    name: 'Streak Starter',
    description: 'Achieve a 3-day streak',
    icon: <Flame className="w-6 h-6" />,
  },
  {
    key: 'consistency_king',
    name: 'Consistency King',
    description: 'Complete all habits for 7 days in a row',
    icon: <Award className="w-6 h-6" />,
  },
  {
    key: 'habit_collector',
    name: 'Habit Collector',
    description: 'Add 5 different habits',
    icon: <Target className="w-6 h-6" />,
  },
  {
    key: 'level_up',
    name: 'Level Up',
    description: 'Reach Level 5',
    icon: <Trophy className="w-6 h-6" />,
  },
];

const AchievementBadge = ({ achievement, unlocked, unlockedAt }: { achievement: typeof ACHIEVEMENTS[0], unlocked: boolean, unlockedAt?: string }) => {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
      unlocked
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg'
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          unlocked ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-500'
        }`}>
          {achievement.icon}
        </div>
        <h3 className={`font-semibold text-sm mb-1 ${
          unlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>
        <p className={`text-xs ${
          unlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>
        {unlocked && unlockedAt && (
          <p className="text-xs text-yellow-600 mt-1 font-medium">
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

const AchievementsSection = () => {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<{ [key: string]: { unlocked: boolean, unlocked_at?: string } }>({});

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('achievements')
        .select('achievement_key, unlocked, unlocked_at')
        .eq('user_id', user.id);
      const map: { [key: string]: { unlocked: boolean, unlocked_at?: string } } = {};
      (data || []).forEach((a: any) => {
        map[a.achievement_key] = { unlocked: a.unlocked, unlocked_at: a.unlocked_at };
      });
      setUserAchievements(map);
    };
    fetchAchievements();
  }, [user]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ACHIEVEMENTS.map((achievement) => (
          <AchievementBadge
            key={achievement.key}
            achievement={achievement}
            unlocked={!!userAchievements[achievement.key]?.unlocked}
            unlockedAt={userAchievements[achievement.key]?.unlocked_at}
          />
        ))}
      </div>
    </div>
  );
};

export const AchievementsBadgesRow = () => {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<{ [key: string]: { unlocked: boolean, unlocked_at?: string } }>({});

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('achievements')
        .select('achievement_key, unlocked, unlocked_at')
        .eq('user_id', user.id);
      const map: { [key: string]: { unlocked: boolean, unlocked_at?: string } } = {};
      (data || []).forEach((a: any) => {
        map[a.achievement_key] = { unlocked: a.unlocked, unlocked_at: a.unlocked_at };
      });
      setUserAchievements(map);
    };
    fetchAchievements();
  }, [user]);

  const unlockedBadges = ACHIEVEMENTS.filter((achievement) => userAchievements[achievement.key]?.unlocked);
  if (unlockedBadges.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2 items-center">
        {unlockedBadges.map((achievement) => (
          <Tooltip key={achievement.key}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center cursor-pointer">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-400 text-white shadow border-2 border-yellow-300">
                  {achievement.icon}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-center">
                <div className="font-bold">{achievement.name}</div>
                <div className="text-xs">{achievement.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default AchievementsSection;
