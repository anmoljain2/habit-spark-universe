import React, { useState, useRef } from 'react';
import { ChefHat, Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useMeals } from './MealsContext';

interface LogMealProps {
  userId: string;
  todayStr: string;
}

const LogMeal: React.FC<LogMealProps> = ({ userId, todayStr }) => {
  const [logMealExpanded, setLogMealExpanded] = useState(false);
  const [logMealForm, setLogMealForm] = useState({
    meal_type: '',
    description: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    serving_size: '',
    recipe: '',
    ingredients: '',
    tags: '',
    date: todayStr,
  });
  const [logMealLoading, setLogMealLoading] = useState(false);
  const [logMealError, setLogMealError] = useState('');
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hoveredUserMeal, setHoveredUserMeal] = useState<any | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);
  const [showAllLoggedMeals, setShowAllLoggedMeals] = useState(false);
  const { refreshMeals } = useMeals();

  const handleLogMealChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setLogMealForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleLogMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogMealError('');
    if (!logMealForm.meal_type) {
      setLogMealError('Please select a meal type.');
      return;
    }
    setLogMealLoading(true);
    try {
      // Call the /api/log-meal endpoint instead of direct Supabase
      const res = await fetch('/api/log-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          date: logMealForm.date || todayStr,
          meal_type: logMealForm.meal_type,
          description: logMealForm.description,
          calories: logMealForm.calories !== '' ? Number(logMealForm.calories) : null,
          protein: logMealForm.protein !== '' ? Number(logMealForm.protein) : null,
          carbs: logMealForm.carbs !== '' ? Number(logMealForm.carbs) : null,
          fat: logMealForm.fat !== '' ? Number(logMealForm.fat) : null,
          serving_size: logMealForm.serving_size || '',
          recipe: logMealForm.recipe || '',
          ingredients: Array.isArray(logMealForm.ingredients)
            ? logMealForm.ingredients
            : typeof logMealForm.ingredients === 'string' && logMealForm.ingredients.trim() !== ''
              ? logMealForm.ingredients.split(',').map(s => s.trim())
              : [],
          tags: Array.isArray(logMealForm.tags)
            ? logMealForm.tags
            : typeof logMealForm.tags === 'string' && logMealForm.tags.trim() !== ''
              ? logMealForm.tags.split(',').map(s => s.trim())
              : [],
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to log meal');
      }
      setLogMealForm({
        meal_type: '',
        description: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        serving_size: '',
        recipe: '',
        ingredients: '',
        tags: '',
        date: todayStr,
      });
      await refreshMeals();
      setLogMealExpanded(false);
    } catch (err: any) {
      setLogMealError(err.message || 'Failed to log meal');
    }
    setLogMealLoading(false);
  };

  // Delete a logged meal (remains local to user_recipes, not user_meals)
  const handleDeleteLoggedMeal = async (mealId: string) => {
    await supabase.from('user_recipes').delete().eq('id', mealId);
    // Optionally refresh userLoggedMeals if needed
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-green-600" />
          Log a Meal
        </h2>
        {!logMealExpanded && (
          <Button className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700" onClick={() => setLogMealExpanded(true)}>
            Log a Meal
          </Button>
        )}
        {logMealExpanded && (
          <form className="w-full space-y-3 mb-4" onSubmit={handleLogMealSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type</label>
              <select name="meal_type" value={logMealForm.meal_type} onChange={handleLogMealChange} className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500" required>
                <option value="">Select...</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="snack">Snack</option>
                <option value="dinner">Dinner</option>
                <option value="custom">Custom</option>
              </select>
              {logMealError && <div className="text-red-600 text-xs mt-1">{logMealError}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
              <Input name="description" value={logMealForm.description} onChange={handleLogMealChange} required placeholder="e.g. Chicken Salad" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Calories</label>
                <Input name="calories" value={logMealForm.calories} onChange={handleLogMealChange} type="number" min="0" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Protein</label>
                <Input name="protein" value={logMealForm.protein} onChange={handleLogMealChange} type="number" min="0" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Carbs</label>
                <Input name="carbs" value={logMealForm.carbs} onChange={handleLogMealChange} type="number" min="0" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500">Fat</label>
                <Input name="fat" value={logMealForm.fat} onChange={handleLogMealChange} type="number" min="0" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500">Serving Size</label>
              <Input name="serving_size" value={logMealForm.serving_size} onChange={handleLogMealChange} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Recipe</label>
              <Textarea name="recipe" value={logMealForm.recipe} onChange={handleLogMealChange} rows={2} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Ingredients (comma separated)</label>
              <Input name="ingredients" value={logMealForm.ingredients} onChange={handleLogMealChange} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Tags (comma separated, optional)</label>
              <Input name="tags" value={logMealForm.tags} onChange={handleLogMealChange} />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Date</label>
              <Input name="date" value={logMealForm.date} onChange={handleLogMealChange} type="date" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700" disabled={logMealLoading}>
                {logMealLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Meal'}
              </Button>
              <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setLogMealExpanded(false)} disabled={logMealLoading}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LogMeal; 