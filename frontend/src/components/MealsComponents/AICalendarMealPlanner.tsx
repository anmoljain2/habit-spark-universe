import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AICalendarMealPlannerProps {
  userId: string;
  weekStart: string;
  nutritionPrefs: any;
}

const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AICalendarMealPlanner: React.FC<AICalendarMealPlannerProps> = ({ userId, weekStart, nutritionPrefs }) => {
  const [weekMeals, setWeekMeals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [regeneratingWeek, setRegeneratingWeek] = useState(false);
  const [hoveredMeal, setHoveredMeal] = useState<{ day: string; type: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenMode, setRegenMode] = useState<'week' | 'day' | null>(null);
  const [regenDay, setRegenDay] = useState<string | null>(null);
  const [regenFeedback, setRegenFeedback] = useState('');
  const regenInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string; type: string } | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

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

  const handleRegenerateDay = (dateStr: string) => {
    setRegenMode('day');
    setRegenDay(dateStr);
    setShowRegenModal(true);
    setRegenFeedback('');
    setTimeout(() => regenInputRef.current?.focus(), 100);
  };

  const handleRegenerateWeek = () => {
    setRegenMode('week');
    setShowRegenModal(true);
    setRegenFeedback('');
    setTimeout(() => regenInputRef.current?.focus(), 100);
  };

  const submitRegenerate = async () => {
    if (regenMode === 'week') {
      setRegeneratingWeek(true);
      try {
        await fetch('/api/generate-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, week_start: weekStart, nutritionPrefs, force_regen_week: true, regenerate_feedback: regenFeedback }),
        });
        await fetchWeekMeals();
      } catch (err) {}
      setRegeneratingWeek(false);
    } else if (regenMode === 'day' && regenDay) {
      setRegeneratingDay(regenDay);
      try {
        await fetch('/api/generate-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, week_start: weekStart, nutritionPrefs, force_regen_day: regenDay, regenerate_feedback: regenFeedback }),
        });
        await fetchWeekMeals();
      } catch (err) {}
      setRegeneratingDay(null);
    }
    setShowRegenModal(false);
    setRegenMode(null);
    setRegenDay(null);
    setRegenFeedback('');
  };

  const getDateForDay = (start: string, dayIdx: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + dayIdx);
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full flex flex-row justify-end mb-2">
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all text-sm"
            onClick={handleRegenerateWeek}
            disabled={regeneratingWeek}
            onMouseEnter={() => setShowTooltip('week')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            {regeneratingWeek ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Regenerate Week
          </button>
          {showTooltip === 'week' && (
            <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64 text-xs text-gray-700 animate-fade-in-up">
              <b>Regenerate Week</b>: Generate a new meal plan for the entire week based on your latest preferences.
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 w-full">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
          <span className="text-green-700 font-medium">Loading meal plan...</span>
        </div>
      ) : (
        <table className="w-full border-collapse text-base bg-white/90 rounded-2xl shadow-xl">
          <thead>
            <tr>
              <th className="p-3 border-b text-left text-base font-semibold text-gray-700">Meal Type</th>
              {daysOfWeek.map((day, idx) => {
                const dateStr = (() => {
                  const d = new Date(weekStart);
                  d.setDate(new Date(weekStart).getDate() + idx);
                  return d.toISOString().slice(0, 10);
                })();
                const todayStr = new Date().toISOString().slice(0, 10);
                const isToday = dateStr === todayStr;
                return (
                  <th key={day} className={`p-3 border-b text-center text-base font-semibold text-gray-700 relative ${isToday ? 'bg-green-100 text-green-900' : ''}`}>
                    <span>{day}</span>
                    <span className="inline-block ml-2 relative">
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleRegenerateDay(dateStr)}
                        disabled={regeneratingDay === dateStr}
                        onMouseEnter={() => setShowTooltip(day)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        {regeneratingDay === dateStr ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <RefreshCw className="w-4 h-4 inline" />}
                      </button>
                      {showTooltip === day && (
                        <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 w-48 text-xs text-gray-700 animate-fade-in-up">
                          <b>Regenerate Day</b>: Generate a new meal plan for this day only.
                        </div>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {mealTypes.map(type => (
              <tr key={type}>
                <td className="p-3 border-b text-base font-semibold text-gray-700 capitalize">{type}</td>
                {daysOfWeek.map((day, idx) => {
                  const dateStr = (() => {
                    const d = new Date(weekStart);
                    d.setDate(new Date(weekStart).getDate() + idx);
                    return d.toISOString().slice(0, 10);
                  })();
                  const meal = weekMeals[dateStr]?.[type];
                  const todayStr = new Date().toISOString().slice(0, 10);
                  const isToday = dateStr === todayStr;
                  return (
                    <td
                      key={day}
                      className={`p-3 border-b text-center text-base relative group min-w-[160px] bg-transparent`}
                      onMouseEnter={() => meal && setHoveredMeal({ day: dateStr, type })}
                      onMouseLeave={() => setHoveredMeal(null)}
                      onDragOver={e => {
                        e.preventDefault();
                        setDragOverCell({ day: dateStr, type });
                      }}
                      onDragLeave={e => {
                        setDragOverCell(null);
                      }}
                      onDrop={async e => {
                        e.preventDefault();
                        setDragOverCell(null);
                        let recipe;
                        try { recipe = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; }
                        // Delete existing meal in this slot
                        const { error: delErr } = await supabase
                          .from('user_meals')
                          .delete()
                          .eq('user_id', userId)
                          .eq('date_only', dateStr)
                          .eq('meal_type', type);
                        // Insert new meal using recipe data
                        await supabase.from('user_meals').insert({
                          user_id: userId,
                          date: dateStr,
                          date_only: dateStr,
                          meal_type: type,
                          description: recipe.name || recipe.meal_name || recipe.description,
                          calories: recipe.calories,
                          protein: recipe.protein,
                          carbs: recipe.carbs,
                          fat: recipe.fat,
                          serving_size: recipe.serving_size,
                          recipe: recipe.recipe,
                          ingredients: recipe.ingredients,
                          source: recipe.recipeType === 'logged' ? 'user' : 'find_recipe',
                        });
                        await fetchWeekMeals();
                      }}
                    >
                      <div
                        className={`transition-all duration-200 rounded-xl border shadow-sm px-2 py-3 h-full min-h-[60px] flex items-center justify-center cursor-pointer
                          ${dragOverCell && dragOverCell.day === dateStr && dragOverCell.type === type
                            ? 'bg-green-100 border-green-400'
                            : 'bg-white/80 border-gray-200'}
                          group-hover:bg-green-50 group-hover:border-green-300
                        `}
                        style={{ position: 'relative', zIndex: 1 }}
                      >
                        {meal ? (
                          <span className="font-medium text-gray-900 text-base cursor-pointer">
                            {meal.description}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      {hoveredMeal && hoveredMeal.day === dateStr && hoveredMeal.type === type && meal && (
                        <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up">
                          <div className="font-bold text-lg mb-1">{meal.description}</div>
                          <div className="flex flex-wrap gap-2 mb-2 items-center">
                            <span className="text-orange-500 font-semibold">⚡ {meal.calories} cal</span>
                            <span className="text-red-500 font-semibold">❤️ {meal.protein} protein</span>
                            <span className="text-yellow-500 font-semibold">C {meal.carbs} carbs</span>
                            <span className="text-green-500 font-semibold flex items-center">F {meal.fat} fat
                              {meal.serving_size && (
                                <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">| Serving: {meal.serving_size}</span>
                              )}
                            </span>
                          </div>
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
      )}
      {/* Regenerate Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-green-700 mb-2">Regenerate {regenMode === 'week' ? 'Week' : 'Day'} Meal Plan</h3>
            <label className="text-sm text-gray-700 mb-1">Why are you regenerating? (Dislikes, changes, or feedback for the AI)</label>
            <textarea
              ref={regenInputRef}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-green-500 focus:border-green-500"
              rows={3}
              value={regenFeedback}
              onChange={e => setRegenFeedback(e.target.value)}
              placeholder="E.g. I don't like tuna, want more vegetarian options, etc."
            />
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setShowRegenModal(false)}>Cancel</button>
              <button className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700" onClick={submitRegenerate}>Regenerate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICalendarMealPlanner; 