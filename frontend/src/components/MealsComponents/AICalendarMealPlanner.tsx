import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AICalendarMealPlannerProps {
  userId: string;
  weekStart: string;
  nutritionPrefs: any;
}

const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AICalendarMealPlanner: React.FC<AICalendarMealPlannerProps> = ({ userId, weekStart, nutritionPrefs }) => {
  const [weekMeals, setWeekMeals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [hoveredMeal, setHoveredMeal] = useState<{ day: string; type: string } | null>(null);

  const fetchWeekMeals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', userId)
      .gte('date_only', weekStart)
      .lte('date_only', new Date(new Date(weekStart).getTime() + 6 * 86400000).toISOString().slice(0, 10));
    if (!error && data) {
      const mealsByDay: any = {};
      data.forEach((meal: any) => {
        if (!mealsByDay[meal.date_only]) mealsByDay[meal.date_only] = {};
        mealsByDay[meal.date_only][meal.meal_type] = meal;
      });
      setWeekMeals(mealsByDay);
    } else {
      setWeekMeals({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId && weekStart) fetchWeekMeals();
    // eslint-disable-next-line
  }, [userId, weekStart]);

  const handleRegenerateDay = async (dateStr: string) => {
    setRegeneratingDay(dateStr);
    try {
      await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, week_start: weekStart, nutritionPrefs, force_regen_day: dateStr }),
      });
      await fetchWeekMeals();
    } catch (err) {
      // Optionally show error
    }
    setRegeneratingDay(null);
  };

  const getDateForDay = (start: string, dayIdx: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + dayIdx);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          AI Meal Plan Calendar
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
            <span className="text-green-700 font-medium">Loading meal plan...</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border-b text-left text-sm font-semibold text-gray-700">Meal Type</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={day} className="p-2 border-b text-center text-sm font-semibold text-gray-700">
                      {day}
                      <button
                        className="ml-2 text-xs text-green-600 hover:text-green-900"
                        title="Regenerate meals for this day"
                        onClick={() => handleRegenerateDay(getDateForDay(weekStart, idx))}
                        disabled={regeneratingDay === getDateForDay(weekStart, idx)}
                      >
                        {regeneratingDay === getDateForDay(weekStart, idx) ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <RefreshCw className="w-4 h-4 inline" />}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mealTypes.map(type => (
                  <tr key={type}>
                    <td className="p-2 border-b text-sm font-semibold text-gray-700 capitalize">{type}</td>
                    {daysOfWeek.map((day, idx) => {
                      const dateStr = getDateForDay(weekStart, idx);
                      const meal = weekMeals[dateStr]?.[type];
                      return (
                        <td
                          key={day}
                          className="p-2 border-b text-center text-sm relative group"
                          onMouseEnter={() => meal && setHoveredMeal({ day: dateStr, type })}
                          onMouseLeave={() => setHoveredMeal(null)}
                        >
                          {meal ? (
                            <span className="font-medium text-gray-900 text-base cursor-pointer">
                              {meal.description}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                          {hoveredMeal && hoveredMeal.day === dateStr && hoveredMeal.type === type && meal && (
                            <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up">
                              <div className="font-bold text-lg mb-1">{meal.description}</div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                <span className="text-orange-500 font-semibold">⚡ {meal.calories} cal</span>
                                <span className="text-red-500 font-semibold">❤️ {meal.protein} protein</span>
                                <span className="text-yellow-500 font-semibold">C {meal.carbs} carbs</span>
                                <span className="text-green-500 font-semibold">F {meal.fat} fat</span>
                              </div>
                              {meal.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {meal.serving_size}</div>}
                              {meal.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {meal.recipe}</div>}
                              {meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
                                <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {meal.ingredients.join(', ')}</div>
                              )}
                              {meal.tags && Array.isArray(meal.tags) && meal.tags.length > 0 && (
                                <div className="text-xs text-gray-400 mb-1"><b>Tags:</b> {meal.tags.join(', ')}</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICalendarMealPlanner; 