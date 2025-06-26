
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

const StatsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total XP"
        value="2,547"
        icon={<TrendingUp className="w-6 h-6" />}
        color="#10B981"
        subtitle="+127 this week"
      />
      <StatCard
        title="Current Streak"
        value="12 days"
        icon={<Flame className="w-6 h-6" />}
        color="#F59E0B"
        subtitle="Personal best!"
      />
      <StatCard
        title="Habits Completed"
        value="89%"
        icon={<Target className="w-6 h-6" />}
        color="#8B5CF6"
        subtitle="This week"
      />
    </div>
  );
};

export default StatsOverview;
