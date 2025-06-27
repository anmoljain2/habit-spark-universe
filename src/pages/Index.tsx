
import { useAuth } from '@/hooks/useAuth';
import Navbar from '../components/Navbar';
import StatsOverview from '../components/StatsCard';
import LevelCard from '../components/LevelCard';
import HabitsList from '../components/HabitsList';
import AchievementsSection from '../components/AchievementBadge';
import { useState } from 'react';
import { Newspaper, Utensils, Dumbbell, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const [xpRefresh, setXPRefresh] = useState(0);
  
  // Get user's display name from email or username
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Adventurer';

  const handleXPChange = () => setXPRefresh((prev) => prev + 1);

  const quickStats = [
    { label: 'Today\'s Progress', value: '85%', color: 'from-green-400 to-emerald-600', icon: Target },
    { label: 'Weekly Streak', value: '7 days', color: 'from-orange-400 to-red-500', icon: TrendingUp },
    { label: 'Total XP', value: '2,340', color: 'from-purple-400 to-pink-500', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <LevelCard xpRefresh={xpRefresh} />
            <StatsOverview xpRefresh={xpRefresh} />
            <HabitsList onXPChange={handleXPChange} hideAddButton />
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* News Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-xl shadow-lg">
                    <Newspaper className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Latest News</h2>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "How Exercise Boosts Brain Health",
                  "5 Habits of Highly Productive People", 
                  "Nutrition Trends: What to Eat in 2024"
                ].map((title, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm leading-relaxed">{title}</span>
                  </div>
                ))}
              </div>
              <Link 
                to="/news" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Explore News <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Meals Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Today's Meals</h2>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { meal: "Breakfast", food: "Oatmeal & Berries" },
                  { meal: "Lunch", food: "Grilled Chicken Salad" },
                  { meal: "Dinner", food: "Salmon & Quinoa" }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                    <span className="font-medium text-gray-800">{item.meal}</span>
                    <span className="text-gray-600 text-sm">{item.food}</span>
                  </div>
                ))}
              </div>
              <Link 
                to="/meals" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Plan Meals <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Fitness Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-3 rounded-xl shadow-lg">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Workout Plan</h2>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  { type: "Warmup", activity: "5 min Jump Rope" },
                  { type: "Strength", activity: "Pushups & Squats" },
                  { type: "Cardio", activity: "20 min Run" }
                ].map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50/80 rounded-lg">
                    <span className="font-medium text-gray-800">{item.type}</span>
                    <span className="text-gray-600 text-sm">{item.activity}</span>
                  </div>
                ))}
              </div>
              <Link 
                to="/fitness" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start Workout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <AchievementsSection />
      </div>
    </div>
  );
};

export default Index;
