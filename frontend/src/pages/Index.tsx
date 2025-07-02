import { useAuth } from '@/hooks/useAuth';
import StatsOverview from '../components/StatsCard';
import LevelCard from '../components/LevelCard';
import HabitsList from '../components/HabitsList';
import AchievementsSection from '../components/AchievementBadge';
import { useState, useEffect } from 'react';
import { Newspaper, Utensils, Dumbbell, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const [xpRefresh, setXPRefresh] = useState(0);
  const [stats, setStats] = useState({ progress: null, streak: null, xp: null, loading: true });
  
  console.log('Index page rendering for user:', user?.email);
  
  // Get user's display name from email or username
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Adventurer';

  const handleXPChange = () => setXPRefresh((prev) => prev + 1);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      setStats(s => ({ ...s, loading: true }));
      // Fetch Total XP and Streak from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, streak')
        .eq('id', user.id)
        .single();
      // Fetch habits completed today
      const today = new Date().toISOString().slice(0, 10);
      const { data: habitsToday } = await supabase
        .from('user_habits')
        .select('id, completed_today, created_at')
        .eq('user_id', user.id);
      // Filter habits created today
      const habitsTodayFiltered = (habitsToday || []).filter(h => h.created_at && h.created_at.startsWith(today));
      const totalHabits = habitsTodayFiltered.length;
      const completedHabits = habitsTodayFiltered.filter(h => h.completed_today).length;
      const progress = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
      setStats({
        progress,
        streak: profile?.streak ?? 0,
        xp: profile?.total_xp ?? 0,
        loading: false
      });
    };
    if (user) fetchStats();
  }, [user, xpRefresh]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: "Today's Progress", value: stats.loading ? <span className="animate-pulse">...</span> : `${stats.progress}%`, color: 'from-green-400 to-emerald-600', icon: Target },
    { label: 'Weekly Streak', value: stats.loading ? <span className="animate-pulse">...</span> : `${stats.streak} days`, color: 'from-orange-400 to-red-500', icon: TrendingUp },
    { label: 'Total XP', value: stats.loading ? <span className="animate-pulse">...</span> : stats.xp?.toLocaleString(), color: 'from-purple-400 to-pink-500', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2 rounded-full border border-indigo-200 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Welcome back</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Hello, {displayName}! 👋
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ready to level up your life today? Let's make progress together.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="group">
                <div className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <IconComponent className="w-8 h-8 text-white/80" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content - Full Width */}
        <LevelCard xpRefresh={xpRefresh} />
        <StatsOverview xpRefresh={xpRefresh} />
        <HabitsList onXPChange={handleXPChange} hideAddButton />
        
        {/* Horizontal Info Sections - Full Width */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* News Section */}
          <div className="bg-white/70 rounded-xl shadow-md p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-lg shadow-sm">
                <Newspaper className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Latest News</h2>
            </div>
            <div className="space-y-2 mb-4">
              {[
                "Exercise Boosts Brain Health",
                "5 Habits of Productive People", 
                "Nutrition Trends 2024"
              ].map((title, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-gray-50/60 rounded-md hover:bg-gray-100/60 transition-colors cursor-pointer text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-700 leading-snug">{title}</span>
                </div>
              ))}
            </div>
            <Link 
              to="/news" 
              className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {/* Meals Section */}
          <div className="bg-white/70 rounded-xl shadow-md p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-lg shadow-sm">
                <Utensils className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Today's Meals</h2>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { meal: "Breakfast", food: "Oatmeal & Berries" },
                { meal: "Lunch", food: "Chicken Salad" },
                { meal: "Dinner", food: "Salmon & Quinoa" }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50/60 rounded-md text-sm">
                  <span className="font-medium text-gray-800">{item.meal}</span>
                  <span className="text-gray-600 text-xs">{item.food}</span>
                </div>
              ))}
            </div>
            <Link 
              to="/meals" 
              className="inline-flex items-center gap-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Plan Meals <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          {/* Fitness Section */}
          <div className="bg-white/70 rounded-xl shadow-md p-4 border border-white/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-2 rounded-lg shadow-sm">
                <Dumbbell className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Workout Plan</h2>
            </div>
            <div className="space-y-2 mb-4">
              {[
                { type: "Warmup", activity: "5 min Jump Rope" },
                { type: "Strength", activity: "Pushups & Squats" },
                { type: "Cardio", activity: "20 min Run" }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50/60 rounded-md text-sm">
                  <span className="font-medium text-gray-800">{item.type}</span>
                  <span className="text-gray-600 text-xs">{item.activity}</span>
                </div>
              ))}
            </div>
            <Link 
              to="/fitness" 
              className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Start Workout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <AchievementsSection />
      </div>
    </div>
  );
};

export default Index;
