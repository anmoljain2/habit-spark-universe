import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star } from 'lucide-react';

interface LevelCardProps {
  xpRefresh?: number;
}

const LevelCard = ({ xpRefresh }: LevelCardProps) => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [totalXP, setTotalXP] = useState(0);
  const [loading, setLoading] = useState(true);

  // Calculate XP needed for current level and next level
  const getXPForLevel = (level: number) => Math.pow(level, 2) * 100;
  const currentLevelXP = getXPForLevel(level);
  const prevLevelXP = getXPForLevel(level - 1);
  const progressXP = totalXP - prevLevelXP;
  const neededXP = currentLevelXP - prevLevelXP;
  const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);

  const PROGRESS_COLOR = 'bg-gradient-to-r from-blue-500 to-cyan-400';
  const PROGRESS_BG = 'bg-blue-100';

  useEffect(() => {
    const fetchLevelData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('level, total_xp')
          .eq('id', user.id)
          .maybeSingle();
        let newLevel = 1;
        let newXP = 0;
        if (error) {
          setLevel(1);
          setTotalXP(0);
        } else if (profile) {
          // --- Level recalculation logic ---
          let calculatedLevel = 1;
          let xp = profile.total_xp || 0;
          while (xp >= Math.pow(calculatedLevel, 2) * 100) {
            calculatedLevel++;
          }
          calculatedLevel = Math.max(1, calculatedLevel - 1);
          setLevel(calculatedLevel);
          setTotalXP(xp);
          // If level in DB is wrong, update it
          if (profile.level !== calculatedLevel) {
            await supabase.from('profiles').update({ level: calculatedLevel }).eq('id', user.id);
          }
        } else {
          // No profile found, create one
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              level: 1,
              total_xp: 0,
              username: user.email?.split('@')[0] || 'User'
            });
          if (insertError) {
            console.error('Error creating profile:', insertError);
          }
          setLevel(1);
          setTotalXP(0);
        }
      } catch (error) {
        setLevel(1);
        setTotalXP(0);
      } finally {
        setLoading(false);
      }
    };
    fetchLevelData();
  }, [user, xpRefresh]);

  if (loading) {
    return (
      <Card className="mb-8 animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Level Progress</h3>
              <p className="text-sm text-gray-600">Keep up the great work!</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-2xl font-bold text-purple-600">
              <Star className="w-6 h-6" />
              <span>Level {level}</span>
            </div>
            <p className="text-sm text-gray-600">{totalXP.toLocaleString()} Total XP</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{progressXP.toLocaleString()} XP</span>
            <span>{neededXP.toLocaleString()} XP to level {level + 1}</span>
          </div>
          <div className={`relative w-full h-3 rounded-full overflow-hidden ${PROGRESS_BG}`}>
            <div
              className={`${PROGRESS_COLOR} h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {Math.max(0, neededXP - progressXP).toLocaleString()} XP needed for next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelCard;
