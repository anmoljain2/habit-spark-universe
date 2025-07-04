import React, { useState, useRef } from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

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
  const [userLoggedMeals, setUserLoggedMeals] = useState<any[]>([]);
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hoveredUserMeal, setHoveredUserMeal] = useState<any | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);

  const fetchUserLoggedMeals = async () => {
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', userId)
      .eq('date_only', todayStr)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setUserLoggedMeals(data.filter((m: any) => m.source === 'user'));
    }
  };

  React.useEffect(() => {
    if (userId && todayStr) fetchUserLoggedMeals();
    // eslint-disable-next-line
  }, [userId, todayStr]);

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
      // Delete any existing meal for this user, date, and meal_type
      await supabase
        .from('user_meals')
        .delete()
        .eq('user_id', userId)
        .eq('date_only', todayStr)
        .eq('meal_type', logMealForm.meal_type);
      // Insert the new meal
      const mealToInsert = {
        ...logMealForm,
        user_id: userId,
        calories: logMealForm.calories ? Number(logMealForm.calories) : undefined,
        protein: logMealForm.protein ? Number(logMealForm.protein) : undefined,
        carbs: logMealForm.carbs ? Number(logMealForm.carbs) : undefined,
        fat: logMealForm.fat ? Number(logMealForm.fat) : undefined,
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
      };
      const { error } = await supabase
        .from('user_meals')
        .insert([mealToInsert]);
      if (error) throw new Error(error.message);
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
      fetchUserLoggedMeals();
      // Optionally, reload the page or trigger a refresh in parent components if needed
      // window.location.reload(); // Uncomment if you want a full reload
    } catch (err: any) {
      setLogMealError(err.message || 'Failed to log meal');
    }
    setLogMealLoading(false);
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
        {userLoggedMeals.length > 0 && (
          <div className="mt-2 w-full">
            <h3 className="text-base font-semibold text-gray-700 mb-2">Your Logged Meals</h3>
            <ul className="space-y-2">
              {userLoggedMeals.map((meal, idx) => (
                <li key={meal.id} className="relative">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 border border-gray-200 font-medium text-gray-900 transition-all"
                    onMouseEnter={e => {
                      if (userMealTooltipTimeout.current) clearTimeout(userMealTooltipTimeout.current);
                      setHoveredUserMeal(meal);
                      const rect2 = (e.target as HTMLElement).getBoundingClientRect();
                      setUserMealTooltipPos({ x: rect2.left + rect2.width / 2, y: rect2.bottom + window.scrollY });
                    }}
                    onMouseLeave={() => {
                      userMealTooltipTimeout.current = setTimeout(() => setHoveredUserMeal(null), 200);
                    }}
                  >
                    {meal.description}
                  </button>
                </li>
              ))}
            </ul>
            {hoveredUserMeal && userMealTooltipPos && (
              <div
                style={{ position: 'absolute', left: userMealTooltipPos.x, top: userMealTooltipPos.y + 8, zIndex: 50 }}
                className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up"
                onMouseEnter={() => { if (userMealTooltipTimeout.current) clearTimeout(userMealTooltipTimeout.current); }}
                onMouseLeave={() => { setHoveredUserMeal(null); }}
              >
                <div className="font-bold text-lg mb-1">{hoveredUserMeal.description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-orange-500 font-semibold">⚡ {hoveredUserMeal.calories} cal</span>
                  <span className="text-red-500 font-semibold">❤️ {hoveredUserMeal.protein} protein</span>
                  <span className="text-yellow-500 font-semibold">C {hoveredUserMeal.carbs} carbs</span>
                  <span className="text-green-500 font-semibold">F {hoveredUserMeal.fat} fat</span>
                </div>
                {hoveredUserMeal.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {hoveredUserMeal.serving_size}</div>}
                {hoveredUserMeal.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {hoveredUserMeal.recipe}</div>}
                {hoveredUserMeal.ingredients && Array.isArray(hoveredUserMeal.ingredients) && hoveredUserMeal.ingredients.length > 0 && (
                  <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {hoveredUserMeal.ingredients.join(', ')}</div>
                )}
                {hoveredUserMeal.tags && Array.isArray(hoveredUserMeal.tags) && hoveredUserMeal.tags.length > 0 && (
                  <div className="text-xs text-gray-400 mb-1"><b>Tags:</b> {hoveredUserMeal.tags.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogMeal; 