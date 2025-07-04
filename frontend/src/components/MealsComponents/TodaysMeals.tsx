import React, { useState, useEffect } from 'react';
import { CalendarDays, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TodaysMealsProps {
  userId: string;
  todayStr: string;
}

const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];

const TodaysMeals: React.FC<TodaysMealsProps> = ({ userId, todayStr }) => {
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const fetchTodayMeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date_only', todayStr);
    if (!error && data) {
      setTodayMeals(data);
      let cals = 0, prot = 0, carbs = 0, fat = 0;
      data.forEach((m: any) => {
        cals += Number(m.calories) || 0;
        prot += Number(m.protein) || 0;
        carbs += Number(m.carbs) || 0;
        fat += Number(m.fat) || 0;
      });
      setNutrition({ calories: cals, protein: prot, carbs: carbs, fat: fat });
    } else {
      setTodayMeals([]);
      setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId && todayStr) fetchTodayMeals();
    // eslint-disable-next-line
  }, [userId, todayStr]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-green-600" />
          Today's Meals
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
            <span className="text-green-700 font-medium">Loading today's meals...</span>
          </div>
        ) : (
          <div className="w-full">
            <ul className="divide-y divide-gray-200 w-full mb-2">
              {mealTypes.map(type => {
                const meal = todayMeals.find((m: any) => m.meal_type === type);
                return (
                  <li key={type} className="flex items-center gap-3 py-2">
                    <span className="capitalize font-semibold text-gray-700 w-24">{type}</span>
                    {meal ? (
                      <span className="flex-1 text-gray-800 text-base">{meal.description}</span>
                    ) : (
                      <span className="flex-1 text-gray-400 text-base">-</span>
                    )}
                    {meal && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="text-orange-500 font-semibold">⚡ {nutrition.calories} cal</span>
              <span className="text-red-500 font-semibold">❤️ {nutrition.protein} protein</span>
              <span className="text-yellow-500 font-semibold">C {nutrition.carbs} carbs</span>
              <span className="text-green-500 font-semibold">F {nutrition.fat} fat</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysMeals; 