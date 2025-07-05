import { useProfile } from '@/components/ProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star } from 'lucide-react';

interface LevelCardProps {
  xpRefresh?: number;
}

const LevelCard = ({ xpRefresh }: LevelCardProps) => {
  const { totalXP, loading } = useProfile();

  // Calculate level and XP thresholds from totalXP
  const getXPForLevel = (level: number) => Math.pow(level, 2) * 100;
  // Find current level by checking which level's threshold totalXP is at
  let level = 1;
  while (getXPForLevel(level) <= totalXP) {
    level++;
  }
  level = Math.max(1, level - 1);
  const prevLevelXP = getXPForLevel(level);
  const nextLevel = level + 1;
  const nextLevelXP = getXPForLevel(nextLevel);
  const progressXP = totalXP - prevLevelXP;
  const neededXP = nextLevelXP - prevLevelXP;
  const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);
  const xpToNextLevel = Math.max(0, nextLevelXP - totalXP);

  const PROGRESS_COLOR = 'bg-gradient-to-r from-blue-500 to-cyan-400';
  const PROGRESS_BG = 'bg-blue-100';

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
            <span>{xpToNextLevel.toLocaleString()} XP to level {nextLevel}</span>
          </div>
          <div className={`relative w-full h-3 rounded-full overflow-hidden ${PROGRESS_BG}`}>
            <div
              className={`${PROGRESS_COLOR} h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            {xpToNextLevel.toLocaleString()} XP needed for next level
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LevelCard;
