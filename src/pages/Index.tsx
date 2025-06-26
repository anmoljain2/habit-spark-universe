import { useAuth } from '@/hooks/useAuth';
import Navbar from '../components/Navbar';
import StatsOverview from '../components/StatsCard';
import LevelCard from '../components/LevelCard';
import HabitsList from '../components/HabitsList';
import AchievementsSection from '../components/AchievementBadge';
import { useState } from 'react';

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
        <AchievementsSection />
      </div>
    </div>
  );
};

export default Index;
