
import { CheckCircle, Circle, Star, Flame } from 'lucide-react';
import { useState } from 'react';

interface HabitCardProps {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  streak: number;
  completed: boolean;
  xpReward: number;
  description?: string;
}

const HabitCard = ({ id, name, difficulty, streak, completed, xpReward, description }: HabitCardProps) => {
  const [isCompleted, setIsCompleted] = useState(completed);
  const [showCelebration, setShowCelebration] = useState(false);

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  const handleComplete = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 flex items-center justify-center animate-pulse">
          <div className="text-4xl animate-bounce">🎉</div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
          {description && <p className="text-gray-600 text-sm mb-2">{description}</p>}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
            <div className="flex items-center text-gray-600">
              <Flame className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm">{streak} day streak</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleComplete}
          className={`transition-all duration-300 ${
            isCompleted
              ? 'text-green-500 scale-110'
              : 'text-gray-400 hover:text-green-500 hover:scale-110'
          }`}
          disabled={isCompleted}
        >
          {isCompleted ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <Circle className="w-8 h-8" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-purple-600">
          <Star className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+{xpReward} XP</span>
        </div>
        
        {isCompleted && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
            Completed! 🎉
          </span>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
