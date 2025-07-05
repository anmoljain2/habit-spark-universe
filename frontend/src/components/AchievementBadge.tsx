import { useProfile } from '@/components/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Star, Target } from 'lucide-react';

const AchievementsBadgesRow = () => {
  const { achievements, loading } = useProfile();

  // Mock achievements if none exist
  const mockAchievements = [
    { achievement_key: 'first_habit', title: 'First Steps', description: 'Complete your first habit' },
    { achievement_key: 'week_streak', title: 'Consistent', description: 'Maintain a 7-day streak' },
    { achievement_key: 'level_up', title: 'Level Up', description: 'Reach level 2' }
  ];

  const displayAchievements = achievements.length > 0 ? achievements : mockAchievements.slice(0, 3);

  const getAchievementIcon = (key: string) => {
    switch (key) {
      case 'first_habit':
        return Target;
      case 'week_streak':
        return Star;
      case 'level_up':
        return Trophy;
      default:
        return Award;
    }
  };

  if (loading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <span>Recent Achievements</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayAchievements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Complete habits to unlock achievements!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayAchievements.map((achievement, index) => {
              const IconComponent = getAchievementIcon(achievement.achievement_key);
              return (
                <div
                  key={achievement.achievement_key || index}
                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                >
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-full">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {achievement.title || achievement.achievement_key}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {achievement.description || 'Achievement unlocked!'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Export both the component and as default
export { AchievementsBadgesRow };
export default AchievementsBadgesRow;
