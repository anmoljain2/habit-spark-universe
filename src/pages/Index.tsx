import { useAuth } from '@/hooks/useAuth';
import Navbar from '../components/Navbar';
import StatsOverview from '../components/StatsCard';
import LevelCard from '../components/LevelCard';
import HabitsList from '../components/HabitsList';
import AchievementsSection from '../components/AchievementBadge';
import { useState } from 'react';
import { Newspaper, Utensils, Dumbbell } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const [xpRefresh, setXPRefresh] = useState(0);
  
  // Get user's display name from email or username
  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Adventurer';

  const handleXPChange = () => setXPRefresh((prev) => prev + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Ready to level up your life today?
          </p>
        </div>

        <LevelCard xpRefresh={xpRefresh} />
        <StatsOverview xpRefresh={xpRefresh} />
        <HabitsList onXPChange={handleXPChange} hideAddButton />

        {/* New Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {/* News Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <div className="flex items-center mb-2 gap-2">
              <div className="bg-indigo-100 p-2 rounded-full">
                <Newspaper className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-indigo-700">News</h2>
            </div>
            <ul className="mb-4 w-full">
              <li className="flex items-start gap-2 py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">•</span>
                <span className="text-gray-700">How Exercise Boosts Brain Health, According to New Research</span>
              </li>
              <li className="flex items-start gap-2 py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">•</span>
                <span className="text-gray-700">5 Habits of Highly Productive People</span>
              </li>
              <li className="flex items-start gap-2 py-1">
                <span className="font-medium text-gray-700">•</span>
                <span className="text-gray-700">Nutrition Trends: What to Eat in 2024</span>
              </li>
            </ul>
            <a href="/news" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors">Go to News</a>
          </div>
          {/* Meals Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <div className="flex items-center mb-2 gap-2">
              <div className="bg-green-100 p-2 rounded-full">
                <Utensils className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-700">Meals</h2>
            </div>
            <ul className="mb-4 w-full">
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Breakfast</span>
                <span className="text-gray-500">Oatmeal & Berries</span>
              </li>
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Lunch</span>
                <span className="text-gray-500">Grilled Chicken Salad</span>
              </li>
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Snack</span>
                <span className="text-gray-500">Greek Yogurt & Nuts</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Dinner</span>
                <span className="text-gray-500">Salmon & Quinoa</span>
              </li>
            </ul>
            <a href="/meals" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors">Go to Meals</a>
          </div>
          {/* Fitness Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-start">
            <div className="flex items-center mb-2 gap-2">
              <div className="bg-pink-100 p-2 rounded-full">
                <Dumbbell className="w-6 h-6 text-pink-600" />
              </div>
              <h2 className="text-xl font-semibold text-pink-700">Fitness</h2>
            </div>
            <ul className="mb-4 w-full">
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Warmup</span>
                <span className="text-gray-500">5 min Jump Rope</span>
              </li>
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Strength</span>
                <span className="text-gray-500">Pushups & Squats</span>
              </li>
              <li className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-medium text-gray-700">Cardio</span>
                <span className="text-gray-500">20 min Run</span>
              </li>
              <li className="flex justify-between py-1">
                <span className="font-medium text-gray-700">Stretch</span>
                <span className="text-gray-500">Full Body Stretch</span>
              </li>
            </ul>
            <a href="/fitness" className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md font-medium transition-colors">Go to Fitness</a>
          </div>
        </div>
        <AchievementsSection />
      </div>
    </div>
  );
};

export default Index;
