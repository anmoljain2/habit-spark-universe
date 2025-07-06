import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Calendar, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMeals } from './MealsContext';
import { getLocalDateStr } from '@/lib/utils';

interface AICalendarMealPlannerProps {
  userId: string;
  weekStart: string;
  nutritionPrefs: any;
  timezone: string;
}

const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AICalendarMealPlanner: React.FC<AICalendarMealPlannerProps> = ({ userId, weekStart, nutritionPrefs, timezone }) => {
  const { weekMeals, loading, refreshMeals } = useMeals();
  const [regeneratingDay, setRegeneratingDay] = useState<string | null>(null);
  const [regeneratingWeek, setRegeneratingWeek] = useState(false);
  const [hoveredMeal, setHoveredMeal] = useState<{ day: string; type: string } | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenMode, setRegenMode] = useState<'week' | 'day' | 'meal' | null>(null);
  const [regenDay, setRegenDay] = useState<string | null>(null);
  const [regenFeedback, setRegenFeedback] = useState('');
  const regenInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [dragOverCell, setDragOverCell] = useState<{ day: string; type: string } | null>(null);
  const [savingContext, setSavingContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);
  const [regenDayIdx, setRegenDayIdx] = useState<number | null>(null);
  const [expandedRecipes, setExpandedRecipes] = useState<Record<string, boolean>>({});
  const [regenMealType, setRegenMealType] = useState<string | null>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState<string[]>([...mealTypes]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);

  const todayStr = getLocalDateStr(new Date(), timezone);
  const todayIdx = (() => {
    const d = new Date(todayStr);
    return d.getDay();
  })();

  const savedContexts = Array.isArray(nutritionPrefs?.contexts) ? nutritionPrefs.contexts : [];

  // Parse weekStart as a date in the user's timezone once
  const [wsYear, wsMonth, wsDay] = weekStart.split('-').map(Number);
  const baseWeekStartDate = new Date(wsYear, wsMonth - 1, wsDay);

  const handleRegenerateDay = (dateStr: string) => {
    setRegenMode('day');
    setRegenDay(dateStr);
    setSelectedMealTypes([...mealTypes]);
    setSelectedContexts([]);
    setShowRegenModal(true);
    setRegenFeedback('');
    setTimeout(() => regenInputRef.current?.focus(), 100);
  };

  const handleRegenerateWeek = () => {
    setRegenMode('week');
    setShowRegenModal(true);
    setSelectedContexts([]);
    setRegenFeedback('');
    setTimeout(() => regenInputRef.current?.focus(), 100);
  };

  const handleRegenerateMeal = (dateStr: string, mealType: string) => {
    setRegenMode('meal');
    setRegenDay(dateStr);
    setRegenMealType(mealType);
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
          body: JSON.stringify({ user_id: userId, weekStart: weekStart, nutritionPrefs, force_regen_week: true, regenerate_feedback: regenFeedback, mode: 'week', applied_contexts: selectedContexts }),
        });
        await refreshMeals();
      } catch (err) {}
      setRegeneratingWeek(false);
    } else if (regenMode === 'day' && regenDay) {
      setRegeneratingDay(regenDay);
      try {
        await fetch('/api/generate-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, weekStart: weekStart, nutritionPrefs, force_regen_day: regenDay, meal_types: selectedMealTypes, regenerate_feedback: regenFeedback, mode: 'day', applied_contexts: selectedContexts }),
        });
        await refreshMeals();
      } catch (err) {}
      setRegeneratingDay(null);
    } else if (regenMode === 'meal' && regenDay && regenMealType) {
      setRegeneratingDay(regenDay + '_' + regenMealType);
      try {
        await fetch('/api/generate-meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, weekStart: weekStart, nutritionPrefs, force_regen_day: regenDay, meal_type: regenMealType, regenerate_feedback: regenFeedback, mode: 'meal', applied_contexts: selectedContexts }),
        });
        await refreshMeals();
      } catch (err) {}
      setRegeneratingDay(null);
    }
    setShowRegenModal(false);
    setRegenMode(null);
    setRegenDay(null);
    setRegenDayIdx(null);
    setRegenMealType(null);
    setRegenFeedback('');
    setSelectedContexts([]);
  };

  // Helper to add days to a YYYY-MM-DD string in a specific timezone
  function addDaysToDateStr(dateStr: string, days: number, timezone: string) {
    const [y, m, d] = dateStr.split('-').map(Number);
    // Create a date in the user's timezone
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + days);
    return getLocalDateStr(base, timezone);
  }

  // Helper to get local weekday name from yyyy-mm-dd string and timezone
  function getWeekdayName(dateStr: string, timezone: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString(undefined, { weekday: 'long', timeZone: timezone });
  }

  // Save Context handler
  const handleSaveContext = async () => {
    if (!userId || !regenFeedback.trim()) return;
    setSavingContext(true);
    try {
      // Fetch current contexts
      const { data, error } = await supabase
        .from('user_nutrition_preferences')
        .select('contexts')
        .eq('user_id', userId)
        .single();
      let contexts: any[] = [];
      if (!error && data && Array.isArray((data as any).contexts)) {
        contexts = (data as any).contexts;
      } else if (!error && data && (data as any).contexts && typeof (data as any).contexts === 'object') {
        // Defensive: handle object case
        contexts = Array.isArray((data as any).contexts) ? (data as any).contexts : [];
      }
      // Append new context
      const newContexts = [...contexts, regenFeedback.trim()];
      // Update in Supabase
      await supabase
        .from('user_nutrition_preferences')
        .update({ ...( { contexts: newContexts } as any ) })
        .eq('user_id', userId);
      setContextSaved(true);
      setTimeout(() => setContextSaved(false), 2000);
    } catch (err) {
      // Optionally show error
    }
    setSavingContext(false);
  };

  // Helper to get a unique key for a meal cell
  const getMealKey = (dateStr: string, type: string) => `${dateStr}_${type}`;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full flex flex-row justify-end mb-2">
        <div className="relative">
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition-all text-sm"
            onClick={handleRegenerateWeek}
            disabled={!!regeneratingWeek || !!showRegenModal}
            onMouseEnter={() => setShowTooltip('week')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <RefreshCw className="w-5 h-5" />
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
                const weekStartDate = new Date(baseWeekStartDate);
                weekStartDate.setDate(baseWeekStartDate.getDate() + idx);
                const dateStr = getLocalDateStr(weekStartDate, timezone);
                const isToday = dateStr === todayStr;
                // Format date as M/D
                const [year, month, dayNum] = dateStr.split('-');
                const formattedDate = `${parseInt(month)}/${parseInt(dayNum)}`;
                return (
                  <th key={day} className={`p-3 border-b text-center text-base font-semibold text-gray-700 relative ${isToday ? 'bg-green-100 text-green-900' : ''}`} data-today={isToday}>
                    <span>{day} - {formattedDate}</span>
                    <span className="inline-block ml-2 relative">
                      <button
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleRegenerateDay(dateStr)}
                        disabled={regeneratingDay === dateStr || !!showRegenModal}
                        onMouseEnter={() => setShowTooltip(day)}
                        onMouseLeave={() => setShowTooltip(null)}
                      >
                        <RefreshCw className="w-4 h-4 inline" />
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
                  const weekStartDate = new Date(baseWeekStartDate);
                  weekStartDate.setDate(baseWeekStartDate.getDate() + idx);
                  const dateStr = getLocalDateStr(weekStartDate, timezone);
                  const meal = weekMeals[dateStr]?.[type];
                  const isToday = dateStr === todayStr;
                  return (
                    <td
                      key={day}
                      className={`p-3 border-b text-center text-base relative group min-w-[160px] ${isToday ? 'bg-green-100' : 'bg-transparent'}`}
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
                        await refreshMeals();
                      }}
                    >
                      <div
                        className={`transition-colors transition-shadow duration-200 rounded-xl border shadow-sm px-2 py-3 h-full min-h-[60px] flex items-center justify-center cursor-pointer
                          ${dragOverCell && dragOverCell.day === dateStr && dragOverCell.type === type
                            ? 'bg-green-100 border-green-400'
                            : 'bg-white/80 border-gray-200'}
                          group-hover:bg-green-50 group-hover:border-green-300
                        `}
                        style={{ position: 'relative', zIndex: 1 }}
                      >
                        {meal ? (
                          <span className="font-medium text-gray-900 text-base cursor-pointer flex items-center gap-1">
                            {meal.description}
                            <button
                              className="ml-1 text-green-500 hover:text-green-700"
                              title="Regenerate this meal"
                              onClick={e => { e.stopPropagation(); handleRegenerateMeal(dateStr, type); }}
                              disabled={regeneratingDay === dateStr || !!showRegenModal}
                            >
                              <RefreshCw className="w-4 h-4 inline" />
                            </button>
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
                          {meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0 && (
                            <div className="text-xs text-gray-600 mb-1">
                              <b>Ingredients:</b> {meal.ingredients.map((ing: any) => {
                                if (typeof ing === 'string') return ing;
                                if (ing && typeof ing === 'object') return ing.name + (ing.quantity ? ` (${ing.quantity})` : '');
                                return '';
                              }).join(', ')}
                            </div>
                          )}
                          {meal.recipe && (
                            <div className="text-xs text-gray-600 mb-1">
                              <b>Recipe:</b>{' '}
                              {(() => {
                                let steps = meal.recipe;
                                let stepArr: string[] = [];
                                if (Array.isArray(steps)) {
                                  stepArr = steps;
                                } else if (typeof steps === 'string') {
                                  // Try to parse as JSON array if stringified
                                  try {
                                    const parsed = JSON.parse(steps);
                                    if (Array.isArray(parsed)) stepArr = parsed;
                                  } catch {
                                    // Not JSON, split by step numbers or newlines
                                    stepArr = steps.match(/(Step \d+: [^\n]+|[^\n]+(?=Step \d+:|$))/g)?.filter(s => s.trim()) || steps.split(/\n|\r/).filter(s => s.trim());
                                  }
                                }
                                if (stepArr.length > 0) {
                                  return (
                                    <ol className="list-decimal ml-5 mt-1">
                                      {stepArr.map((step, i) => (
                                        <li key={i} className="mb-1">{step.replace(/^Step \d+:\s*/, '')}</li>
                                      ))}
                                    </ol>
                                  );
                                } else if (typeof steps === 'string') {
                                  return <div className="mt-1">{steps}</div>;
                                } else {
                                  return null;
                                }
                              })()}
                            </div>
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
            <h3 className="text-lg font-bold text-green-700 mb-2">
              {regenMode === 'week'
                ? 'Regenerate Week Meal Plan'
                : regenMode === 'day' && regenDay
                  ? `Regenerate ${getWeekdayName(regenDay, timezone)} Meal Plan`
                  : regenMode === 'meal' && regenDay && regenMealType
                    ? `Regenerate ${regenMealType.charAt(0).toUpperCase() + regenMealType.slice(1)} for ${getWeekdayName(regenDay, timezone)}`
                    : 'Regenerate Day Meal Plan'}
            </h3>
            <label className="text-sm text-gray-700 mb-1">Why are you regenerating? (Dislikes, changes, or feedback for the AI)</label>
            <textarea
              ref={regenInputRef}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-green-500 focus:border-green-500"
              rows={3}
              value={regenFeedback}
              onChange={e => setRegenFeedback(e.target.value)}
              placeholder="E.g. I don't like tuna, want more vegetarian options, etc."
            />
            {/* Save Context Button with Tooltip */}
            <div className="flex items-center gap-2 mb-2 relative group self-end">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg font-semibold text-sm shadow border ${contextSaved ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'} ${savingContext ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={handleSaveContext}
                onMouseEnter={() => setShowTooltip('save-context')}
                onMouseLeave={() => setShowTooltip(null)}
                disabled={!regenFeedback.trim() || savingContext || contextSaved}
              >
                {contextSaved ? 'Saved!' : savingContext ? 'Saving...' : 'Save Context'}
              </button>
              {showTooltip === 'save-context' && (
                <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 text-xs text-gray-700 animate-fade-in-up">
                  If this applies to future contexts, we will save it and automatically apply it when creating your meal plan.
                </div>
              )}
            </div>
            {regenMode === 'day' && (
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={selectedMealTypes.length === mealTypes.length}
                      ref={el => {
                        if (el) el.indeterminate = selectedMealTypes.length > 0 && selectedMealTypes.length < mealTypes.length;
                      }}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedMealTypes([...mealTypes]);
                        } else {
                          setSelectedMealTypes([]);
                        }
                      }}
                    />
                    Select All Meals
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  {mealTypes.map(type => (
                    <label key={type} className="flex items-center gap-1 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedMealTypes.includes(type)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedMealTypes(prev => [...prev, type]);
                          } else {
                            setSelectedMealTypes(prev => prev.filter(t => t !== type));
                          }
                        }}
                      />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {savedContexts.length > 0 && (
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={selectedContexts.length === savedContexts.length}
                      ref={el => {
                        if (el) el.indeterminate = selectedContexts.length > 0 && selectedContexts.length < savedContexts.length;
                      }}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedContexts([...savedContexts]);
                        } else {
                          setSelectedContexts([]);
                        }
                      }}
                    />
                    Select All Contexts
                  </label>
                </div>
                {savedContexts.map((ctx, i) => (
                  <label key={i} className="flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={selectedContexts.includes(ctx)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedContexts(prev => [...prev, ctx]);
                        } else {
                          setSelectedContexts(prev => prev.filter(c => c !== ctx));
                        }
                      }}
                    />
                    <span className="truncate max-w-xs">{ctx}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setShowRegenModal(false)}>Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center gap-2"
                onClick={submitRegenerate}
                disabled={Boolean(regeneratingWeek) || Boolean(regeneratingDay)}
              >
                {(regeneratingWeek || regeneratingDay) ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICalendarMealPlanner; 