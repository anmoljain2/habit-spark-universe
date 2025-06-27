import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import MealsQuestionnaire from '../components/MealsQuestionnaire';

const Meals = () => {
  const { user } = useAuth();
  const [nutritionPrefs, setNutritionPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_nutrition_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setNutritionPrefs(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading...</div>;

  if (!nutritionPrefs) {
    // Show questionnaire if no preferences
    return (
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <MealsQuestionnaire userId={user.id} onComplete={setNutritionPrefs} />
        </div>
      </div>
    );
  }

  // Show main meals content if preferences exist
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Meals</h1>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Meal Prep & Planning</h2>
          <p className="text-gray-600 mb-2">This section will help you plan, track, and get inspiration for your meals.</p>
          <div className="text-gray-400 italic">(Coming soon: meal planner, recipes, grocery lists, and more!)</div>
        </div>
      </div>
    </div>
  );
};

export default Meals; 