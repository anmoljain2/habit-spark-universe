
import { Trophy, Star, Target, Flame, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedDate?: string;
}

const AchievementBadge = ({ achievement }: { achievement: Achievement }) => {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
      achievement.unlocked 
        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-lg' 
        : 'bg-gray-50 border-gray-200 opacity-60'
    }`}>
      <div className="text-center">
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          achievement.unlocked ? 'bg-yellow-400 text-white' : 'bg-gray-300 text-gray-500'
        }`}>
          {achievement.icon}
        </div>
        <h3 className={`font-semibold text-sm mb-1 ${
          achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>
        <p className={`text-xs ${
          achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
        }`}>
          {achievement.description}
        </p>
        {achievement.unlocked && achievement.unlockedDate && (
          <p className="text-xs text-yellow-600 mt-1 font-medium">
            Unlocked {achievement.unlockedDate}
          </p>
        )}
      </div>
    </div>
  );
};

const AchievementsSection = () => {
  const achievements: Achievement[] = [
    {
      id: '1',
      name: 'First Steps',
      description: 'Complete your first habit',
      icon: <Star className="w-6 h-6" />,
      unlocked: true,
      unlockedDate: '2 weeks ago'
    },
    {
      id: '2',
      name: 'Streak Master',
      description: 'Maintain a 7-day streak',
      icon: <Flame className="w-6 h-6" />,
      unlocked: true,
      unlockedDate: '1 week ago'
    },
    {
      id: '3',
      name: 'Habit Collector',
      description: 'Create 5 different habits',
      icon: <Target className="w-6 h-6" />,
      unlocked: false
    },
    {
      id: '4',
      name: 'Level Up',
      description: 'Reach Level 10',
      icon: <Trophy className="w-6 h-6" />,
      unlocked: false
    },
    {
      id: '5',
      name: 'Consistency King',
      description: 'Complete 100 habits',
      icon: <Award className="w-6 h-6" />,
      unlocked: false
    }
  ];

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Achievements</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => (
          <AchievementBadge key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};

export default AchievementsSection;
