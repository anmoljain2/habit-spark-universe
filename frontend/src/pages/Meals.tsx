import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TodaysMeals from '@/components/MealsComponents/TodaysMeals';
import AICalendarMealPlanner from '@/components/MealsComponents/AICalendarMealPlanner';
import GroceryList from '@/components/MealsComponents/GroceryList';
import LogMeal from '@/components/MealsComponents/LogMeal';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Meals: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekStart = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday as start
    return d.toISOString().slice(0, 10);
  })();

  const [nutritionPrefs, setNutritionPrefs] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!userId) return;
      setPrefsLoading(true);
      const { data, error } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      setNutritionPrefs(data || {});
      setPrefsLoading(false);
    };
    fetchPrefs();
  }, [userId]);

  if (!userId) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-gray-600">Please log in to view your meals.</div>;
  }

  if (prefsLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-gray-600"><Loader2 className="w-8 h-8 animate-spin mb-2 text-green-500" /> Loading your nutrition preferences...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-8 py-8 w-full">
      <TodaysMeals userId={userId} todayStr={todayStr} />
      <AICalendarMealPlanner userId={userId} weekStart={weekStart} nutritionPrefs={nutritionPrefs || {}} />
      <GroceryList userId={userId} weekStart={weekStart} />
      <LogMeal userId={userId} todayStr={todayStr} />
      {/* Other MealsComponents (AIRecipeSearch, Edamam testers, etc.) can be added here as needed */}
    </div>
  );
};

export default Meals;
