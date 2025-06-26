
import { Star, Trophy } from 'lucide-react';
import ProgressBar from './ProgressBar';

const LevelCard = () => {
  const currentLevel = 5;
  const currentXP = 2547;
  const nextLevelXP = 3000;
  const xpForCurrentLevel = 2000;
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
