
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Target, TrendingUp, Calendar } from 'lucide-react';

interface StatsOverviewProps {
  xpRefresh?: number;
}

const StatsOverview = ({ xpRefresh }: StatsOverviewProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalXP: 0,
    habitsCompleted: 0,
    currentStreak: 0,
    weeklyProgress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp, streak, habits_completed_percent')
          .eq('id', user.id)
          .maybeSingle();

        // Get today's completed habits
        const today = new Date().toISOString().split('T')[0];
        const { data: completedHabits, error: habitsError } = await supabase
          .from('user_habits')
          .select('id')
          .eq('user_id', user.id)
          .eq('completed_today', true);

        if (habitsError) {
          console.error('Error fetching habits:', habitsError);
        }

        setStats({
          totalXP: profile?.total_xp || 0,
          habitsCompleted: completedHabits?.length || 0,
          currentStreak: profile?.streak || 0,
          weeklyProgress: profile?.habits_completed_percent || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, xpRefresh]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total XP',
      value: stats.totalXP.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Habits Today',
      value: stats.habitsCompleted.toString(),
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Current Streak',
      value: `${stats.currentStreak} days`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Weekly Progress',
      value: `${stats.weeklyProgress}%`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
