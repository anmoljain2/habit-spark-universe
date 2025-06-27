import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import FitnessQuestionnaire from '../components/FitnessQuestionnaire';

const Fitness = () => {
  const { user } = useAuth();
  const [fitnessGoals, setFitnessGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setFitnessGoals(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading...</div>;

  if (!fitnessGoals) {
    // Show questionnaire if no goals
    return (
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <FitnessQuestionnaire userId={user.id} onComplete={setFitnessGoals} />
        </div>
      </div>
    );
  }

  // Show main fitness content if goals exist
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Fitness</h1>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Fitness Tracking & Workouts</h2>
          <p className="text-gray-600 mb-2">This section will help you track workouts, set fitness goals, and monitor your progress.</p>
          <div className="text-gray-400 italic">(Coming soon: workout planner, progress charts, and more!)</div>
        </div>
      </div>
    </div>
  );
};

export default Fitness; 