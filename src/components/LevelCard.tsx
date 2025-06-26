import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Star, Trophy } from 'lucide-react';
import ProgressBar from './ProgressBar';

// Example leveling formula: nextLevelXP = 1000 * level
function getNextLevelXP(level: number) {
  return 1000 * level;
}

const LevelCard = ({ xpRefresh }: { xpRefresh?: number }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('level,total_xp,streak')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user, xpRefresh]);

  if (!user || loading || !profile) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white mb-8 flex items-center justify-center min-h-[120px]">
        Loading level...
      </div>
    );
  }

  const currentLevel = profile.level || 1;
  const currentXP = profile.total_xp || 0;
  const currentStreak = profile.streak || 0;
  const nextLevelXP = getNextLevelXP(currentLevel);
  const xpForCurrentLevel = getNextLevelXP(currentLevel - 1);
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = nextLevelXP - xpForCurrentLevel;

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 rounded-full p-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Level {currentLevel}</h2>
            <p className="text-purple-200">Life Adventurer</p>
            <span className="inline-block mt-1 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full">🔥 Streak: {currentStreak} day{currentStreak === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-yellow-400 mb-1">
            <Star className="w-5 h-5 mr-1" />
            <span className="text-lg font-bold">{currentXP.toLocaleString()}</span>
          </div>
          <p className="text-sm text-purple-200">Total XP</p>
        </div>
      </div>
      <ProgressBar
        current={xpProgress}
        max={xpNeeded}
        label={`Progress to Level ${currentLevel + 1}`}
        color="#FBBF24"
        showNumbers={false}
      />
      <div className="text-center text-purple-200 text-sm">
        {xpNeeded - xpProgress} XP until next level
      </div>
    </div>
  );
};

export default LevelCard;
