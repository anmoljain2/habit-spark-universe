import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Utensils, Coffee, Sandwich, Drumstick } from 'lucide-react';

interface TodaysMealsProps {
  userId: string;
  todayStr: string;
  nutritionPrefs: any;
}

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', icon: <Coffee className="w-6 h-6 text-yellow-500" /> },
  { key: 'lunch', label: 'Lunch', icon: <Sandwich className="w-6 h-6 text-green-500" /> },
  { key: 'snack', label: 'Snack', icon: <Utensils className="w-6 h-6 text-blue-500" /> },
  { key: 'dinner', label: 'Dinner', icon: <Drumstick className="w-6 h-6 text-purple-500" /> },
];

const TodaysMeals: React.FC<TodaysMealsProps> = ({ userId, todayStr, nutritionPrefs }) => {
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  useEffect(() => {
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
    if (userId && todayStr) fetchTodayMeals();
  }, [userId, todayStr]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
      {/* Meal Cards Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 min-h-[260px] animate-pulse flex flex-col justify-center items-center">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin mb-2" />
                <span className="text-green-600 font-semibold">Loading...</span>
              </div>
            ))
          ) : (
            mealTypes.map(type => {
              const meal = todayMeals.find((m: any) => m.meal_type === type.key);
              return (
                <div key={type.key} className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 min-h-[260px] flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                    {type.icon}
                    <span className="text-lg font-bold text-gray-800">{type.label}</span>
                  </div>
                  {meal ? (
                    <>
                      <div className="text-gray-700 mb-1">{meal.food_name || 'Meal logged'}</div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span>Calories: <b>{meal.calories}</b></span>
                        <span>Protein: <b>{meal.protein}g</b></span>
                        <span>Carbs: <b>{meal.carbs}g</b></span>
                        <span>Fat: <b>{meal.fat}g</b></span>
                      </div>
                      {meal.notes && <div className="mt-2 text-xs text-gray-500 italic">{meal.notes}</div>}
                    </>
                  ) : (
                    <div className="text-gray-400 italic">No {type.label.toLowerCase()} logged yet.</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Nutrition Card */}
      <div className="w-full lg:w-[320px] flex-shrink-0 flex items-center justify-center" style={{ minHeight: '100%' }}>
        <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 w-full max-w-xs flex flex-col items-center">
          <div className="text-lg font-bold text-green-700 mb-2">Today's Nutrition</div>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex justify-between text-gray-700"><span>Calories</span><span className="font-semibold">{nutrition.calories}</span></div>
            <div className="flex justify-between text-gray-700"><span>Protein</span><span className="font-semibold">{nutrition.protein}g</span></div>
            <div className="flex justify-between text-gray-700"><span>Carbs</span><span className="font-semibold">{nutrition.carbs}g</span></div>
            <div className="flex justify-between text-gray-700"><span>Fat</span><span className="font-semibold">{nutrition.fat}g</span></div>
          </div>
          {nutritionPrefs && (
            <div className="mt-4 w-full text-xs text-gray-500">
              <div>Goal: {nutritionPrefs.calories || '-'} cal, {nutritionPrefs.protein || '-'}g protein, {nutritionPrefs.carbs || '-'}g carbs, {nutritionPrefs.fat || '-'}g fat</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysMeals; 