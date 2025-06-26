import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Target, Flame } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-shadow duration-300" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

const StatsOverview = ({ xpRefresh }: { xpRefresh?: number }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [habitsCompleted, setHabitsCompleted] = useState(0);
  const [habitsTotal, setHabitsTotal] = useState(0);
  const [habitsCompletedPercent, setHabitsCompletedPercent] = useState(0);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    let xpFetched = false;
    let habitsFetched = false;
    // Fetch XP and streak and habits_completed_percent from profiles
    supabase
      .from('profiles')
      .select('total_xp, streak, habits_completed_percent')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setTotalXP(data?.total_xp || 0);
        setStreak(data?.streak || 0);
        setHabitsCompletedPercent(data?.habits_completed_percent || 0);
        xpFetched = true;
        if (xpFetched && habitsFetched) setLoading(false);
      });
    // Fetch habits for completion percentage (no longer used for percent)
    supabase
      .from('user_habits')
      .select('streak_goal')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (!data) {
          setHabitsCompleted(0);
          setHabitsTotal(0);
          habitsFetched = true;
          if (xpFetched && habitsFetched) setLoading(false);
          return;
        }
        const total = data.length;
        setHabitsTotal(total);
        setHabitsCompleted(0); // No completed column, so always 0
        habitsFetched = true;
        if (xpFetched && habitsFetched) setLoading(false);
      });
  }, [user, xpRefresh]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total XP" value="..." icon={<TrendingUp className="w-6 h-6" />} color="#10B981" />
        <StatCard title="Current Streak" value="..." icon={<Flame className="w-6 h-6" />} color="#F59E0B" />
        <StatCard title="Habits Completed" value="..." icon={<Target className="w-6 h-6" />} color="#8B5CF6" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total XP"
        value={totalXP.toLocaleString()}
        icon={<TrendingUp className="w-6 h-6" />}
        color="#10B981"
      />
      <StatCard
        title="Current Streak"
        value={streak > 0 ? `${streak} days` : '0 days'}
        icon={<Flame className="w-6 h-6" />}
        color="#F59E0B"
      />
      <StatCard
        title="Habits Completed"
        value={`${habitsCompletedPercent}%`}
        icon={<Target className="w-6 h-6" />}
        color="#8B5CF6"
      />
    </div>
  );
};

export default StatsOverview;
