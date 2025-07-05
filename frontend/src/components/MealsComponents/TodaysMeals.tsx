import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Utensils, Coffee, Sandwich, Drumstick, Flame, Heart, Leaf, Egg, CheckCircle } from 'lucide-react';

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

const macroIcons = {
  calories: <Flame className="inline w-5 h-5 text-orange-500 align-middle" />, // cal
  protein: <Heart className="inline w-5 h-5 text-pink-500 align-middle" />, // protein
  carbs: <Leaf className="inline w-5 h-5 text-green-500 align-middle" />, // carbs
  fat: <Egg className="inline w-5 h-5 text-yellow-700 align-middle" />, // fat
};

const macroColors = {
  calories: 'text-orange-600',
  protein: 'text-pink-600',
  carbs: 'text-green-600',
  fat: 'text-yellow-700',
};

const TodaysMeals: React.FC<TodaysMealsProps> = ({ userId, todayStr, nutritionPrefs: initialNutritionPrefs }) => {
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [completing, setCompleting] = useState<string | null>(null);
  const [nutritionPrefs, setNutritionPrefs] = useState<any>(initialNutritionPrefs || {});

  // Always fetch user_nutrition_preferences if not provided or if userId changes
  useEffect(() => {
    if (!nutritionPrefs?.calories_target && userId) {
      supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) setNutritionPrefs(data);
        });
    }
  }, [userId]);

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
  }, [userId, todayStr]);

  // Helper for progress bar
  const macroProgress = (macro: keyof typeof nutrition, goal: number) => {
    const value = nutrition[macro];
    if (!goal || goal <= 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const handleToggleComplete = async (mealId: string, completed: boolean) => {
    setCompleting(mealId);
    await supabase
      .from('user_meals')
      .update({ completed: !completed })
      .eq('id', mealId);
    await fetchTodayMeals();
    setCompleting(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
      {/* Meal Cards Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/90 rounded-2xl shadow-xl border border-green-200 p-6 min-h-[260px] animate-pulse flex flex-col justify-center items-center">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin mb-2" />
                <span className="text-green-600 font-semibold">Loading...</span>
              </div>
            ))
          ) : (
            mealTypes.map(type => {
              const meal = todayMeals.find((m: any) => m.meal_type === type.key);
              return (
                <div key={type.key} className={`relative bg-white/90 rounded-2xl shadow-xl border-2 ${meal?.completed ? 'border-green-400' : 'border-green-200'} p-6 min-h-[260px] flex flex-col gap-2 transition-all duration-300`}> 
                  {/* Check mark at top right */}
                  {meal && (
                    <button
                      className={`absolute top-3 right-3 rounded-full p-1 border-2 ${meal.completed ? 'bg-green-400 border-green-500 text-white' : 'bg-white border-green-200 text-green-400 hover:bg-green-100'} shadow transition-all`}
                      title={meal.completed ? 'Unmark as complete' : 'Mark as complete'}
                      onClick={() => handleToggleComplete(meal.id, meal.completed)}
                      disabled={completing === meal.id}
                    >
                      {completing === meal.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className={`w-5 h-5 ${meal.completed ? '' : 'opacity-60'}`} />}
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    {type.icon}
                    <span className="text-lg font-bold text-gray-800">{type.label}</span>
                  </div>
                  {meal ? (
                    <>
                      <div className="text-xl font-semibold text-gray-900 mb-1">{meal.description || meal.food_name || ''}</div>
                      <div className="flex gap-3 mb-1">
                        <span className="text-orange-600 font-bold flex items-center gap-1">{macroIcons.calories} {meal.calories} <span className="text-xs font-normal">cal</span></span>
                        <span className="text-pink-600 font-bold flex items-center gap-1">{macroIcons.protein} {meal.protein} <span className="text-xs font-normal">protein</span></span>
                        <span className="text-green-600 font-bold flex items-center gap-1">{macroIcons.carbs} {meal.carbs} <span className="text-xs font-normal">carbs</span></span>
                        <span className="text-yellow-700 font-bold flex items-center gap-1">{macroIcons.fat} {meal.fat} <span className="text-xs font-normal">fat</span></span>
                      </div>
                      {meal.serving_size && <div className="text-gray-500 text-sm mb-1">Serving size: {meal.serving_size}</div>}
                      {meal.recipe && <div className="text-gray-700 text-sm mb-2"><b>Recipe:</b> {meal.recipe}</div>}
                      {meal.notes && <div className="mt-1 text-xs text-gray-500 italic">{meal.notes}</div>}
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
        <div className="bg-white/90 rounded-2xl shadow-xl border-2 border-green-200 p-6 w-full max-w-xs flex flex-col items-center">
          <div className="text-lg font-bold text-green-700 mb-2">Today's Nutrition</div>
          <div className="flex flex-col gap-3 w-full">
            {['calories', 'protein', 'carbs', 'fat'].map((macro) => {
              let goal = 0;
              if (macro === 'calories') goal = nutritionPrefs?.calories_target || 0;
              if (macro === 'protein') goal = nutritionPrefs?.protein_target || 0;
              if (macro === 'carbs') goal = nutritionPrefs?.carbs_target || 0;
              if (macro === 'fat') goal = nutritionPrefs?.fat_target || 0;
              const value = nutrition[macro as keyof typeof nutrition];
              const percent = macroProgress(macro as keyof typeof nutrition, goal);
              return (
                <div key={macro} className="mb-1 w-full">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-semibold capitalize ${macroColors[macro as keyof typeof macroColors]}`}>{macro.charAt(0).toUpperCase() + macro.slice(1)}</span>
                    <span className="font-semibold">{value} / {goal}{macro === 'calories' ? '' : 'g'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`rounded-full h-3 transition-all duration-500 ${macroColors[macro as keyof typeof macroColors]}`}
                      style={{ width: `${percent}%`, background: `linear-gradient(90deg, #4ade80, #22d3ee)` }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{percent}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysMeals; 