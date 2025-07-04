import React from 'react';
import { ChefHat, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LogMealProps {
  logMealExpanded: boolean;
  setLogMealExpanded: (expanded: boolean) => void;
  logMealForm: any;
  setLogMealForm: (form: any) => void;
  logMealError: string;
  setLogMealError: (err: string) => void;
  logMealLoading: boolean;
  handleLogMealChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleLogMealSubmit: (e: React.FormEvent) => void;
  userLoggedMeals: any[];
  hoveredUserMeal: any | null;
  setHoveredUserMeal: (meal: any | null) => void;
  userMealTooltipPos: { x: number, y: number } | null;
  setUserMealTooltipPos: (pos: { x: number, y: number } | null) => void;
  userMealTooltipTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
}

const LogMeal: React.FC<LogMealProps> = ({
  logMealExpanded,
  setLogMealExpanded,
  logMealForm,
  setLogMealForm,
  logMealError,
  setLogMealError,
  logMealLoading,
  handleLogMealChange,
  handleLogMealSubmit,
  userLoggedMeals,
  hoveredUserMeal,
  setHoveredUserMeal,
  userMealTooltipPos,
  setUserMealTooltipPos,
  userMealTooltipTimeout,
}) => {
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