import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MealsQuestionnaire from '../components/MealsQuestionnaire';
import { Utensils, ChefHat, Calendar, Clock, Heart, Zap, CheckCircle, Loader2, ShoppingCart, Info, PackageCheck, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import { format, startOfWeek, addDays, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from '@/integrations/supabase/types';
import Confetti from 'react-confetti';
import QuestionnaireWrapper from '../components/QuestionnaireWrapper';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';

type Meal = Database['public']['Tables']['user_meals']['Row'];

// Wrap the Meals page in QueryClientProvider at the top level (if not already done in App.tsx)
const queryClient = new QueryClient();

function MealsPageWithQueryProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <Meals />
    </QueryClientProvider>
  );
}

function NutritionAnalysisTester() {
  const [input, setInput] = useState('1 cup rice\n2 eggs');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-nutrition-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error analyzing');
    }
    setLoading(false);
  };

  // Helper to render nutrition facts label
  function NutritionLabel({ data }: { data: any }) {
    if (!data) return null;
    const nf = data.totalNutrients || {};
    const daily = data.totalDaily || {};
    // Defensive: calories may be missing or not a number
    const calories = typeof data.calories === 'number' && !isNaN(data.calories) ? Math.round(data.calories) : 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-80 min-w-[320px] mx-auto">
        <h2 className="text-2xl font-bold text-black mb-2 text-center border-b pb-2">Nutrition Facts</h2>
        <div className="text-xs text-gray-700 mb-2 text-center">Amount Per Serving</div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-extrabold">Calories</span>
          <span className="text-4xl font-extrabold">{calories}</span>
        </div>
        <div className="border-b border-gray-300 mb-2"></div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Total Fat {nf.FAT?.quantity ? nf.FAT.quantity.toFixed(1) : 0} g</span>
          <span>{daily.FAT?.quantity ? Math.round(daily.FAT.quantity) : 0} %</span>
        </div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Saturated Fat {nf.FASAT?.quantity ? nf.FASAT.quantity.toFixed(1) : 0} g {daily.FASAT?.quantity ? Math.round(daily.FASAT.quantity) : 0}%</div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Trans Fat {nf.FATRN?.quantity ? nf.FATRN.quantity.toFixed(1) : 0} g</div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Cholesterol {nf.CHOLE?.quantity ? nf.CHOLE.quantity.toFixed(0) : 0} mg</span>
          <span>{daily.CHOLE?.quantity ? Math.round(daily.CHOLE.quantity) : 0} %</span>
        </div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Sodium {nf.NA?.quantity ? nf.NA.quantity.toFixed(0) : 0} mg</span>
          <span>{daily.NA?.quantity ? Math.round(daily.NA.quantity) : 0} %</span>
        </div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Total Carbohydrate {nf.CHOCDF?.quantity ? nf.CHOCDF.quantity.toFixed(1) : 0} g</span>
          <span>{daily.CHOCDF?.quantity ? Math.round(daily.CHOCDF.quantity) : 0} %</span>
        </div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Dietary Fiber {nf.FIBTG?.quantity ? nf.FIBTG.quantity.toFixed(1) : 0} g {daily.FIBTG?.quantity ? Math.round(daily.FIBTG.quantity) : 0}%</div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Total Sugars {nf.SUGAR?.quantity ? nf.SUGAR.quantity.toFixed(1) : 0} g</div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Protein {nf.PROCNT?.quantity ? nf.PROCNT.quantity.toFixed(1) : 0} g</span>
          <span>{daily.PROCNT?.quantity ? Math.round(daily.PROCNT.quantity) : 0} %</span>
        </div>
        {/* Add more micronutrients as needed */}
      </div>
    );
  }

  // Helper to render parsed ingredients table
  function IngredientsTable({ data }: { data: any }) {
    if (!data || !data.ingredients) return null;
    return (
      <table className="w-full mt-4 text-sm border rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1">Qty</th>
            <th className="px-2 py-1">Unit</th>
            <th className="px-2 py-1">Food</th>
            <th className="px-2 py-1">Calories</th>
            <th className="px-2 py-1">Weight</th>
          </tr>
        </thead>
        <tbody>
          {data.ingredients.map((ing: any, idx: number) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.quantity || '-'}</td>
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.measure || '-'}</td>
              <td className="px-2 py-1">{ing.text || '-'}</td>
              <td className="px-2 py-1 text-center">{typeof ing.parsed?.[0]?.nutrients?.ENERC_KCAL === 'number' && !isNaN(ing.parsed[0].nutrients.ENERC_KCAL) ? Math.round(ing.parsed[0].nutrients.ENERC_KCAL) + ' kcal' : '-'}</td>
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.weight ? ing.parsed[0].weight.toFixed(1) + ' g' : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-12 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200 flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Edamam Nutrition Analysis API Tester</h2>
        <form className="flex gap-2 mb-6 w-full" onSubmit={handleAnalyze}>
          <textarea
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"e.g. 1 cup rice\n2 eggs"}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        <div className="text-xs text-gray-500 mb-2">Enter one ingredient per line.</div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {result && <IngredientsTable data={result} />}
      </div>
      <div className="flex-shrink-0">
        {result && <NutritionLabel data={result} />}
      </div>
    </div>
  );
}

function FoodDatabaseTester() {
  const [input, setInput] = useState('apple');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-food-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error searching food database');
    }
    setLoading(false);
  };

  // Helper to render a food card
  function FoodCard({ food }: { food: any }) {
    const nf = food.nutrients || {};
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 min-w-[280px] flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full mb-2 flex items-center justify-center overflow-hidden">
          {food.image ? <img src={food.image} alt={food.label} className="object-cover w-full h-full" /> : <span className="text-gray-400">No Image</span>}
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1 text-center">{food.label}</div>
        <div className="flex gap-2 text-xs text-gray-500 mb-2">
          <span>⚡ {nf.ENERC_KCAL ? Math.round(nf.ENERC_KCAL) : 0} cal</span>
          <span>❤️ {nf.PROCNT ? nf.PROCNT.toFixed(1) : 0}g protein</span>
          <span>C {nf.CHOCDF ? nf.CHOCDF.toFixed(1) : 0}g carbs</span>
          <span>F {nf.FAT ? nf.FAT.toFixed(1) : 0}g fat</span>
        </div>
        <div className="w-full mt-2">
          <div className="bg-gray-50 rounded-xl p-2 text-xs">
            <div className="font-semibold mb-1">Nutrition Facts (per 100g)</div>
            <div>Total Fat: {nf.FAT ? nf.FAT.toFixed(1) : 0}g</div>
            <div>Carbs: {nf.CHOCDF ? nf.CHOCDF.toFixed(1) : 0}g</div>
            <div>Protein: {nf.PROCNT ? nf.PROCNT.toFixed(1) : 0}g</div>
            <div>Fiber: {nf.FIBTG ? nf.FIBTG.toFixed(1) : 0}g</div>
            <div>Sugar: {nf.SUGAR ? nf.SUGAR.toFixed(1) : 0}g</div>
            <div>Sodium: {nf.NA ? nf.NA.toFixed(0) : 0}mg</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 mb-24 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Edamam Food Database API Tester</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. apple, chicken breast, rice"
        />
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {result && result.hints && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {result.hints.map((hint: any, idx: number) => (
            <FoodCard key={idx} food={hint.food} />
          ))}
        </div>
      )}
    </div>
  );
}

function EdamamRecipeSearchTester() {
  const [query, setQuery] = useState('chicken, rice, broccoli');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error searching recipes');
    }
    setLoading(false);
  };

  // Helper to render a recipe card
  function RecipeCard({ recipe }: { recipe: any }) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 min-w-[280px] flex flex-col items-center mb-6">
        <div className="w-40 h-40 bg-gray-100 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
          {recipe.image ? <img src={recipe.image} alt={recipe.label} className="object-cover w-full h-full" /> : <span className="text-gray-400">No Image</span>}
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1 text-center">{recipe.label}</div>
        <div className="flex gap-2 text-xs text-gray-500 mb-2">
          <span>{Math.round(recipe.calories)} CALORIES</span>
          <span>{recipe.ingredientLines?.length || 0} INGREDIENTS</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">{recipe.source}</div>
        <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">View Recipe</a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 mb-12 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Edamam Recipe Search API Tester</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. chicken, rice, broccoli"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {result && result.hits && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {result.hits.map((hit: any, idx: number) => (
            <RecipeCard key={idx} recipe={hit.recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function EdamamWeeklyMealPlan({ nutritionPrefs, handleRegenerateDay }: { nutritionPrefs: any, handleRegenerateDay: (date: string) => void }) {
  const [plan, setPlan] = useState<any[][]>([]); // [day][meal]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredMeal, setHoveredMeal] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

  const mealOrder = ["breakfast", "lunch", "snack", "dinner"];
  const weekDates = [
    "2024-06-10",
    "2024-06-11",
    "2024-06-12",
    "2024-06-13",
    "2024-06-14",
    "2024-06-15",
    "2024-06-16"
  ];
  const todayStr = weekDates[0];
  const weekLoading = false;
  const dayLoading = null;

  // For variety, use a pool of queries for each meal type
  const breakfastIdeas = ["omelette", "pancakes", "smoothie", "avocado toast", "granola", "frittata", "waffles", "shakshuka", "breakfast sandwich", "parfait"];
  const lunchIdeas = ["chicken salad", "burrito", "pasta", "sandwich", "grain bowl", "quiche", "wrap", "soup", "poke bowl", "falafel"];
  const snackIdeas = ["fruit", "yogurt", "nuts", "energy bar", "hummus", "veggie sticks", "trail mix", "rice cake", "protein shake", "popcorn"];
  const dinnerIdeas = ["stir fry", "curry", "roast chicken", "pizza", "tacos", "lasagna", "risotto", "chili", "meatballs", "enchiladas"];

  const getQueryForMeal = (mealType: string, dayIdx: number) => {
    // Rotate through ideas for variety
    if (mealType === "breakfast") return breakfastIdeas[dayIdx % breakfastIdeas.length];
    if (mealType === "lunch") return lunchIdeas[dayIdx % lunchIdeas.length];
    if (mealType === "snack") return snackIdeas[dayIdx % snackIdeas.length];
    if (mealType === "dinner") return dinnerIdeas[dayIdx % dinnerIdeas.length];
    return mealType;
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setPlan([]);
    try {
      const weekPlan: any[][] = [];
      for (let d = 0; d < weekDates.length; d++) {
        const dayMeals: any[] = [];
        for (let m = 0; m < mealOrder.length; m++) {
          const mealType = mealOrder[m];
          const query = getQueryForMeal(mealType, d);
          // Build params using user nutrition preferences
          const params: any = {
            query,
            mealType,
          };
          if (nutritionPrefs?.diet) params.diet = nutritionPrefs.diet;
          if (nutritionPrefs?.calories_target) params.calories = `${Math.max(0, nutritionPrefs.calories_target - 100)}-${nutritionPrefs.calories_target + 100}`;
          // Add more filters as needed from nutritionPrefs
          const res = await fetch('/api/edamam-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          });
          let recipe = null;
          if (res.ok) {
            const data = await res.json();
            recipe = data.hits && data.hits[0] ? data.hits[0].recipe : null;
          }
          dayMeals.push(recipe);
        }
        weekPlan.push(dayMeals);
      }
      setPlan(weekPlan);
    } catch (err) {
      setError('Failed to generate Edamam meal plan');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 mb-10 p-4 bg-white/80 rounded-xl shadow border border-green-300">
      <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
        <span>🥗</span> Edamam Weekly Meal Calendar
      </h2>
      <button
        onClick={handleGenerate}
        className="mb-4 bg-gradient-to-r from-green-500 to-emerald-400 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-500 text-base shadow"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Edamam Meal Plan'}
      </button>
      {error && <div className="text-red-600 mb-4 text-sm">{error}</div>}
      {plan.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-xs bg-white rounded-xl shadow border border-green-200">
            <thead>
              <tr>
                <th className="bg-green-50 font-semibold text-green-700 text-left px-3 py-2 border-b border-r border-green-200 sticky left-0 z-10">Meal</th>
                {weekDates.map((date) => {
                  const isToday = date === todayStr;
                  return (
                    <th
                      key={date}
                      className={`font-semibold text-green-800 text-center px-4 py-2 border-b border-green-200 ${isToday ? 'bg-green-100 text-green-900' : 'bg-green-50'}`}
                    >
                      <div className="flex items-center justify-center gap-1 relative group">
                        {format(parseISO(date), 'EEE')}
                        <button
                          onClick={() => handleRegenerateDay(date)}
                          className="ml-1 p-1 rounded hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all relative"
                          disabled={weekLoading || dayLoading === date}
                          style={{ lineHeight: 0 }}
                          onMouseEnter={e => {
                            const tooltip = e.currentTarget.querySelector('.regen-tooltip');
                            if (tooltip) tooltip.classList.remove('hidden');
                          }}
                          onMouseLeave={e => {
                            const tooltip = e.currentTarget.querySelector('.regen-tooltip');
                            if (tooltip) tooltip.classList.add('hidden');
                          }}
                        >
                          {dayLoading === date ? (
                            <span className="inline-block align-middle">
                              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 border-t-transparent border-l-transparent border-r-transparent"></span>
                            </span>
                          ) : (
                            <Zap className="w-5 h-5 text-orange-500" />
                          )}
                          {/* Custom tooltip for regenerate button */}
                          <span className="regen-tooltip hidden absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 bg-white border border-orange-300 rounded-xl shadow-lg px-3 py-2 text-xs text-orange-700 font-semibold whitespace-nowrap animate-fade-in-up transition-all duration-200">
                            Regenerate meals for this day
                          </span>
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {mealOrder.map((type, mIdx) => (
                <tr key={type}>
                  <td className="font-bold text-green-900 px-3 py-2 border-r border-b border-green-200 bg-green-50 sticky left-0 z-10 capitalize">{type}</td>
                  {weekDates.map((date, dIdx) => {
                    const meal = plan[dIdx]?.[mIdx];
                    const isToday = date === todayStr;
                    return (
                      <td
                        key={date}
                        className={`align-top px-2 py-2 border-b border-green-200 text-center min-w-[140px] max-w-[220px] ${isToday ? 'bg-green-100/70' : ''}`}
                        style={{ verticalAlign: 'top' }}
                      >
                        {meal ? (
                          <div className="flex flex-col items-center gap-1">
                            {meal.image && (
                              <img src={meal.image} alt={meal.label} className="w-16 h-16 object-cover rounded-lg border border-green-100 mb-1" />
                            )}
                            <div className="font-bold text-green-900 text-sm mb-1" style={{whiteSpace:'normal',wordBreak:'break-word'}}>{meal.label}</div>
                            <div className="flex flex-wrap gap-1 justify-center text-xs text-gray-600 mb-1">
                              {typeof meal.calories === 'number' && <span>⚡ {Math.round(meal.calories)} cal</span>}
                              {meal.totalNutrients?.PROCNT && <span>❤️ {Math.round(meal.totalNutrients.PROCNT.quantity)}g protein</span>}
                              {meal.totalNutrients?.CHOCDF && <span>C {Math.round(meal.totalNutrients.CHOCDF.quantity)}g carbs</span>}
                              {meal.totalNutrients?.FAT && <span>F {Math.round(meal.totalNutrients.FAT.quantity)}g fat</span>}
                            </div>
                            {meal.yield && <div className="text-xs text-gray-400 mb-1">Servings: {meal.yield}</div>}
                            {meal.url && (
                              <a href={meal.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold hover:bg-green-200 transition">View Recipe</a>
                            )}
                          </div>
                        ) : (
                          <div className="relative rounded-md border border-green-200 bg-white/70 px-2 py-1 text-center text-gray-400" style={{ fontSize: '1.12em', whiteSpace: 'normal', overflow: 'visible' }}>
                            —
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
  );
}

// HoverCardPortal component for robust hover card rendering
function HoverCardPortal({ children, pos }: { children: React.ReactNode, pos: { x: number, y: number } | null }) {
  if (!pos) return null;
  return createPortal(
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y + 8,
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
      className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up"
    >
      {children}
    </div>,
    document.body
  );
}

const Meals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Fetch user nutrition preferences
  const { data: nutritionPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ['nutritionPrefs', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10, // 10 min
  });

  // Fetch today's meals
  const { data: todaysMeals = [], isLoading: mealsLoading, refetch: refetchMeals } = useQuery({
    queryKey: ['todaysMeals', user?.id, todayStr],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_only', todayStr)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 min
  });

  // Fetch weekly meals
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(weekStart), i), 'yyyy-MM-dd'));
  const { data: weekMeals = {}, isLoading: weekLoading, refetch: refetchWeekMeals } = useQuery({
    queryKey: ['weekMeals', user?.id, weekStart],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('user_meals')
        .select('*')
        .eq('user_id', user.id)
        .in('date_only', weekDates)
        .order('date_only', { ascending: true })
        .order('meal_type', { ascending: true });
      if (error) throw new Error(error.message);
      // Group by date
      const grouped: { [date: string]: Meal[] } = {};
      for (const d of weekDates) grouped[d] = [];
      for (const meal of data || []) {
        if (!grouped[meal.date_only]) grouped[meal.date_only] = [];
        grouped[meal.date_only].push(meal);
      }
      return grouped;
    },
    enabled: !!user && !!nutritionPrefs,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch grocery list
  const { data: groceryList = [], isLoading: groceryLoading, refetch: refetchGrocery } = useQuery({
    queryKey: ['groceryList', user?.id, weekStart],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();
      if (error || !data) return [];
      return Array.isArray(data.items) ? data.items : [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch saved recipes
  const { data: savedRecipes = [], refetch: refetchSavedRecipes } = useQuery({
    queryKey: ['savedRecipes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
  });

  // Local state for confetti and dialog
  const [showConfetti, setShowConfetti] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Tooltip state for hovered meal
  const [hoveredMeal, setHoveredMeal] = useState<any | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);

  // Derived values for nutrition
  const completedMeals = todaysMeals.filter((meal: any) => meal.completed);
  const totalCalories = completedMeals.reduce((sum: number, meal: any) => sum + (meal.calories || 0), 0);
  const totalProtein = completedMeals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
  const totalCarbs = completedMeals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0);
  const totalFat = completedMeals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0);

  // Mutations for meal completion
  const completeMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const { data, error } = await supabase
        .from('user_meals')
        .update({ completed: true })
        .eq('id', mealId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todaysMeals'] }),
  });
  const uncompleteMealMutation = useMutation({
    mutationFn: async (mealId: string) => {
      const { data, error } = await supabase
        .from('user_meals')
        .update({ completed: false })
        .eq('id', mealId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todaysMeals'] }),
  });

  // Handler functions
  const handleCompleteMeal = (mealId: string) => completeMealMutation.mutate(mealId);
  const handleUncompleteMeal = (mealId: string) => uncompleteMealMutation.mutate(mealId);

  // Regenerate dialog logic (stub for now)
  const confirmAndRegenerate = () => setIsConfirming(false);

  // Add missing local state/handlers for linter errors
  const [dayLoading, setDayLoading] = useState<string | null>(null);
  const [groceryCondensed, setGroceryCondensed] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
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
  const userLoggedMeals = todaysMeals.filter((m: any) => m.source === 'user');
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hoveredUserMeal, setHoveredUserMeal] = useState<any | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [hoveredSavedRecipe, setHoveredSavedRecipe] = useState<any | null>(null);
  const [savedRecipeTooltipPos, setSavedRecipeTooltipPos] = useState<{x: number, y: number} | null>(null);
  const savedRecipeTooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handler for toggling grocery list items
  const handleToggleItem = (idx: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // Handler for regenerating a day's meals
  const handleRegenerateDay = async (date: string) => {
    if (!user) return;
    setDayLoading(date);
    try {
      // Delete all meals for this user and date
      await supabase.from('user_meals').delete().eq('user_id', user.id).eq('date_only', date);
      // Call backend to generate new meals for this day
      await axios.post('/api/generate-meal-plan', {
        user_id: user.id,
        mode: 'day',
        date,
      });
      toast.success('Meals regenerated for ' + date);
      // Refetch week meals
      refetchWeekMeals();
    } catch (err) {
      toast.error('Failed to regenerate meals for ' + date);
    }
    setDayLoading(null);
  };

  // Handler for generating grocery list (stub)
  const handleGenerateGroceryList = () => {
    // ... actual logic here ...
  };

  // Handler for logging a meal (stub)
  const handleLogMealChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setLogMealForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleLogMealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ... actual logic here ...
  };

  // Handler for recipe search (stub)
  const handleRecipeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // ... actual logic here ...
  };

  // Handler for saving a recipe (stub)
  const handleSaveRecipe = (recipe: any) => {
    // ... actual logic here ...
  };

  // New handler for generating weekly meals
  const handleGenerateWeeklyMeals = () => {
    // ... actual logic here ...
  };

  if (prefsLoading || mealsLoading || weekLoading || groceryLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!prefsLoading && !nutritionPrefs) {
    return (
      <QuestionnaireWrapper>
        <MealsQuestionnaire userId={user.id} />
      </QuestionnaireWrapper>
    );
  }

  const mealOrder = ["breakfast", "lunch", "snack", "dinner"];

  const sortedMeals = [...todaysMeals].sort((a, b) => {
    const aIndex = mealOrder.indexOf(a.meal_type.toLowerCase());
    const bIndex = mealOrder.indexOf(b.meal_type.toLowerCase());
    return aIndex - bIndex;
  });

  const weeklyPlan = [
    { day: "Mon", focus: "High Protein", color: "bg-red-100 text-red-700" },
    { day: "Tue", focus: "Mediterranean", color: "bg-blue-100 text-blue-700" },
    { day: "Wed", focus: "Plant-Based", color: "bg-green-100 text-green-700" },
    { day: "Thu", focus: "Balanced", color: "bg-purple-100 text-purple-700" },
    { day: "Fri", focus: "Low Carb", color: "bg-orange-100 text-orange-700" },
    { day: "Sat", focus: "Comfort Food", color: "bg-pink-100 text-pink-700" },
    { day: "Sun", focus: "Meal Prep", color: "bg-indigo-100 text-indigo-700" }
  ];

  return (
    <div className="min-h-screen">
      {showConfetti && <Confetti recycle={false} onConfettiComplete={() => setShowConfetti(false)} />}
      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete your current meals for today and generate a new set.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndRegenerate} className="bg-green-600 hover:bg-green-700">Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-4 py-2 rounded-full border border-green-200 mb-4">
            <ChefHat className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Nutrition Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Meal Planning & Nutrition
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your meals, plan your nutrition, and achieve your health goals with personalized recommendations.
          </p>
        </div>

        {/* Section: Today's Meals and Nutrition (side by side, full width) */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Today's Meals</h2>
          <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            {/* Meals: 2x2 grid, fills most of the width */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {todaysMeals.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No meals found for today.</p>
                </div>
              ) : (
                mealOrder.map((type) => {
                  const meal = todaysMeals.find(m => m.meal_type === type);
                  if (!meal) return null;
                  return (
                    <div
                      key={type}
                      className={`relative flex flex-col h-full bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 group hover:shadow-2xl ${meal.completed ? 'border-green-500 bg-green-50/90' : 'border-gray-200 bg-white'} p-6 hover:-translate-y-1`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-3xl">🍽️</span>
                        <h3 className="font-extrabold text-gray-900 capitalize text-xl tracking-tight leading-tight">{meal.meal_type}</h3>
                        {meal.completed && <CheckCircle className="w-6 h-6 text-green-500 ml-auto" />}
                      </div>
                      <div className="font-bold text-gray-800 text-lg mb-1">{meal.description}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base font-semibold mb-2">
                        <span className="flex items-center gap-1 text-orange-500"><Zap className="w-5 h-5" />{meal.calories} <span className="font-normal text-gray-600 text-xs ml-0.5">cal</span></span>
                        <span className="flex items-center gap-1 text-red-500"><Heart className="w-5 h-5" />{meal.protein} <span className="font-normal text-gray-600 text-xs ml-0.5">protein</span></span>
                        <span className="flex items-center gap-1 text-yellow-500"><span className="font-bold">C</span>{meal.carbs} <span className="font-normal text-gray-600 text-xs ml-0.5">carbs</span></span>
                        <span className="flex items-center gap-1 text-green-500"><span className="font-bold">F</span>{meal.fat} <span className="font-normal text-gray-600 text-xs ml-0.5">fat</span></span>
                      </div>
                      {meal.serving_size && (
                        <div className="text-xs text-gray-500 mb-1">Serving size: {meal.serving_size}</div>
                      )}
                      {meal.recipe && (
                        <div className="text-xs text-gray-600 mb-2"><b>Recipe:</b> {meal.recipe}</div>
                      )}
                      <div className="mt-auto pt-2">
                        {meal.completed ? (
                          <button
                            onClick={() => handleUncompleteMeal(meal.id)}
                            className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-base border border-gray-200 shadow-sm"
                          >
                            Undo
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCompleteMeal(meal.id)}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-full font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 text-base"
                          >
                            <CheckCircle className="w-6 h-6" />
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Nutrition Card: right side, match height to meals grid */}
            <div className="w-full md:w-80 flex-shrink-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-start justify-start h-full self-stretch" style={{height: '100%'}}>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Today's Nutrition
              </h3>
              <div className="w-full space-y-5">
                {/* Calories */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">Calories</span>
                    <span className="text-xs text-gray-500">{totalCalories} / {nutritionPrefs?.calories_target || 2000}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (totalCalories / (nutritionPrefs?.calories_target || 2000)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{Math.round((totalCalories / (nutritionPrefs?.calories_target || 2000)) * 100)}%</div>
                </div>
                {/* Protein */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">Protein</span>
                    <span className="text-xs text-gray-500">{totalProtein} / {nutritionPrefs?.protein_target || 100}g</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-red-500 transition-all" style={{ width: `${Math.min(100, (totalProtein / (nutritionPrefs?.protein_target || 100)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{Math.round((totalProtein / (nutritionPrefs?.protein_target || 100)) * 100)}%</div>
                </div>
                {/* Carbs */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">Carbs</span>
                    <span className="text-xs text-gray-500">{totalCarbs} / {nutritionPrefs?.carbs_target || 250}g</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-yellow-400 transition-all" style={{ width: `${Math.min(100, (totalCarbs / (nutritionPrefs?.carbs_target || 250)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{Math.round((totalCarbs / (nutritionPrefs?.carbs_target || 250)) * 100)}%</div>
                </div>
                {/* Fat */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">Fat</span>
                    <span className="text-xs text-gray-500">{totalFat} / {nutritionPrefs?.fat_target || 70}g</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (totalFat / (nutritionPrefs?.fat_target || 70)) * 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{Math.round((totalFat / (nutritionPrefs?.fat_target || 70)) * 100)}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Weekly Calendar (AI/user meal plan) */}
        <div className="w-full max-w-7xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-blue-700 mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            Your AI Meal Plan Calendar
          </h2>
          <p className="text-sm text-gray-500 mb-4">This calendar shows your personalized meal plan generated by the AI, based on your preferences and logged meals.</p>
          <button
            onClick={handleGenerateWeeklyMeals}
            className="mb-6 bg-gradient-to-r from-blue-500 to-green-400 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-green-500 text-lg shadow"
            disabled={weekLoading}
          >
            {weekLoading ? 'Generating...' : 'Generate / Regenerate Weekly Meals'}
          </button>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-xs bg-white rounded-xl shadow border border-gray-200">
              <thead>
                <tr>
                  <th className="bg-gray-50 font-semibold text-gray-600 text-left px-3 py-2 border-b border-r border-gray-200 sticky left-0 z-10">Meal</th>
                  {weekDates.map((date) => {
                    const isToday = date === todayStr;
                    return (
                      <th
                        key={date}
                        className={`font-semibold text-gray-700 text-center px-4 py-2 border-b border-gray-200 ${isToday ? 'bg-green-50 text-green-700' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-center gap-1 relative group">
                          {format(parseISO(date), 'EEE')}
                          <button
                            onClick={() => handleRegenerateDay(date)}
                            className="ml-1 p-1 rounded hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all relative"
                            disabled={weekLoading || dayLoading === date}
                            style={{ lineHeight: 0 }}
                            onMouseEnter={e => {
                              const tooltip = e.currentTarget.querySelector('.regen-tooltip');
                              if (tooltip) tooltip.classList.remove('hidden');
                            }}
                            onMouseLeave={e => {
                              const tooltip = e.currentTarget.querySelector('.regen-tooltip');
                              if (tooltip) tooltip.classList.add('hidden');
                            }}
                          >
                            {dayLoading === date ? (
                              <span className="inline-block align-middle">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 border-t-transparent border-l-transparent border-r-transparent"></span>
                              </span>
                            ) : (
                              <Zap className="w-5 h-5 text-orange-500" />
                            )}
                            {/* Custom tooltip for regenerate button */}
                            <span className="regen-tooltip hidden absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 bg-white border border-orange-300 rounded-xl shadow-lg px-3 py-2 text-xs text-orange-700 font-semibold whitespace-nowrap animate-fade-in-up transition-all duration-200">
                              Regenerate meals for this day
                            </span>
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {mealOrder.map((type, mIdx) => (
                  <tr key={type}>
                    <td className="font-bold text-gray-800 px-3 py-2 border-r border-b border-gray-200 bg-gray-50 sticky left-0 z-10 capitalize">{type}</td>
                    {weekDates.map((date, dIdx) => {
                      const meal = weekMeals[date]?.find((m: any) => m.meal_type === type);
                      const isToday = date === todayStr;
                      return (
                        <td
                          key={date}
                          className={`align-top px-2 py-2 border-b border-gray-200 text-center min-w-[110px] max-w-[180px] ${isToday ? 'bg-green-50/70' : ''}`}
                          style={{ verticalAlign: 'top' }}
                        >
                          {meal ? (
                            <div
                              className="relative group rounded-md border border-gray-200 bg-white/80 px-2 py-1 text-center text-gray-900 hover:shadow-md transition-shadow duration-150"
                              style={{ fontSize: '1.12em', fontWeight: 600, whiteSpace: 'normal', overflow: 'visible' }}
                              onMouseEnter={e => {
                                setHoveredMeal(meal);
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setHoverPos({ x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY });
                              }}
                              onMouseLeave={() => setHoveredMeal(null)}
                            >
                              {meal.description}
                            </div>
                          ) : (
                            <div className="relative rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-center text-gray-400" style={{ fontSize: '1.12em', whiteSpace: 'normal', overflow: 'visible' }}>
                              —
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
        </div>

        {/* Section: Edamam Demo Meal Plan Calendar */}
        <div className="w-full max-w-7xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-green-700 mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-700" />
            Edamam Demo Meal Plan Calendar
          </h2>
          <p className="text-sm text-gray-500 mb-4">This calendar is a demo using the Edamam API, showing example meal plans from Edamam's recipe database.</p>
          <EdamamWeeklyMealPlan nutritionPrefs={nutritionPrefs} handleRegenerateDay={() => {}} />
        </div>

        {/* Middle Section: Grocery List and Log a Meal side by side */}
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 justify-center items-start mt-12 mb-16">
          {/* Grocery List Section */}
          <div className="w-full max-w-md">
            <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                Grocery List
              </h2>
              {groceryLoading ? (
                <div className="flex flex-col items-center justify-center py-8 w-full">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
                  <span className="text-green-700 font-medium">Loading grocery list...</span>
                </div>
              ) : groceryList.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 w-full">
                  <span className="text-gray-500 text-lg mb-2">No grocery list found for this week.</span>
                  <button
                    onClick={handleGenerateGroceryList}
                    className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> Generate Grocery List
                  </button>
                </div>
              ) : (
                <div className="w-full mt-2">
                  <ul className="divide-y divide-gray-200 w-full">
                    {(groceryCondensed ? groceryList.slice(0, 5) : groceryList).map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 py-2">
                        <input
                          type="checkbox"
                          checked={checkedItems.has(idx)}
                          onChange={() => handleToggleItem(idx)}
                          className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                        />
                        <span className={`flex-1 text-gray-800 text-base ${checkedItems.has(idx) ? 'line-through text-gray-400' : ''}`}>{typeof item === 'object' && 'name' in item ? String(item.name) : String(item)}</span>
                        {typeof item === 'object' && 'quantity' in item && <span className="text-xs text-gray-500 ml-2">x{String(item.quantity)}</span>}
                        {typeof item === 'object' && 'unit' in item && <span className="text-xs text-gray-400 ml-1">{String(item.unit)}</span>}
                      </li>
                    ))}
                  </ul>
                  {groceryList.length > 5 && (
                    <button
                      className="mt-2 flex items-center justify-center gap-1 text-xs text-green-700 underline hover:text-green-900 focus:outline-none w-full"
                      onClick={() => setGroceryCondensed(c => !c)}
                    >
                      {groceryCondensed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      {groceryCondensed ? `Show more` : 'Show less'}
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={handleGenerateGroceryList}
                className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 w-full"
              >
                <ShoppingCart className="w-5 h-5" /> Regenerate Grocery List
              </button>
            </div>
          </div>
          {/* Log a Meal Section */}
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
                    <select name="meal_type" value={logMealForm.meal_type} onChange={handleLogMealChange} className="w-full rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500">
                      <option value="">Select...</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="snack">Snack</option>
                      <option value="dinner">Dinner</option>
                      <option value="custom">Custom</option>
                    </select>
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
          {/* Search a Recipe Section */}
          <div className="w-full max-w-md">
            <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                Search a Recipe
              </h2>
              <form className="w-full flex gap-2 mb-4" onSubmit={handleRecipeSearch}>
                <Input
                  name="recipeQuery"
                  value={recipeQuery}
                  onChange={e => setRecipeQuery(e.target.value)}
                  placeholder="e.g. salmon, pasta, vegan..."
                  className="flex-1"
                />
                <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700" disabled={recipeLoading}>
                  {recipeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </Button>
              </form>
              <div className="w-full">
                {recipeLoading ? (
                  <div className="flex items-center justify-center py-6 text-green-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : recipeResults.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {recipeResults.map((r, idx) => (
                      <li key={idx} className="py-2">
                        <div className="font-semibold text-gray-900 text-lg mb-1">{r.description || r.name}</div>
                        <div className="flex gap-3 text-xs text-gray-500 mb-2">
                          <span>⚡ {r.calories} cal</span>
                          <span>❤️ {r.protein}g protein</span>
                          <span>C {r.carbs}g carbs</span>
                          <span>F {r.fat}g fat</span>
                        </div>
                        {r.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {r.serving_size}</div>}
                        {r.ingredients && Array.isArray(r.ingredients) && r.ingredients.length > 0 && (
                          <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {r.ingredients.map((ing: any) => ing.name + (ing.quantity ? ` (${ing.quantity})` : '')).join(', ')}</div>
                        )}
                        {r.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {r.recipe}</div>}
                        <Button className="mt-2" onClick={() => handleSaveRecipe(r)}>Save Recipe</Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-sm py-4">Search for healthy recipes by ingredient, cuisine, or diet.</div>
                )}
              </div>
              {/* Saved Recipes List */}
              {savedRecipes.length > 0 && (
                <div className="mt-6 w-full">
                  <h3 className="text-base font-semibold text-gray-700 mb-2">Your Saved Recipes</h3>
                  <ul className="space-y-2">
                    {savedRecipes.map((rec, idx) => (
                      <li key={rec.id} className="relative">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 border border-gray-200 font-medium text-gray-900 transition-all"
                          onMouseEnter={e => {
                            if (savedRecipeTooltipTimeout.current) clearTimeout(savedRecipeTooltipTimeout.current);
                            setHoveredSavedRecipe(rec);
                            const rect2 = (e.target as HTMLElement).getBoundingClientRect();
                            setSavedRecipeTooltipPos({ x: rect2.left + rect2.width / 2, y: rect2.bottom + window.scrollY });
                          }}
                          onMouseLeave={() => {
                            savedRecipeTooltipTimeout.current = setTimeout(() => setHoveredSavedRecipe(null), 200);
                          }}
                        >
                          {rec.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {hoveredSavedRecipe && savedRecipeTooltipPos && (
                    <div
                      style={{ position: 'absolute', left: savedRecipeTooltipPos.x, top: savedRecipeTooltipPos.y + 8, zIndex: 50 }}
                      className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up"
                      onMouseEnter={() => { if (savedRecipeTooltipTimeout.current) clearTimeout(savedRecipeTooltipTimeout.current); }}
                      onMouseLeave={() => { setHoveredSavedRecipe(null); }}
                    >
                      <div className="font-bold text-lg mb-1">{hoveredSavedRecipe.name}</div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-orange-500 font-semibold">⚡ {hoveredSavedRecipe.calories} cal</span>
                        <span className="text-red-500 font-semibold">❤️ {hoveredSavedRecipe.protein} protein</span>
                        <span className="text-yellow-500 font-semibold">C {hoveredSavedRecipe.carbs} carbs</span>
                        <span className="text-green-500 font-semibold">F {hoveredSavedRecipe.fat} fat</span>
                      </div>
                      {hoveredSavedRecipe.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {hoveredSavedRecipe.serving_size}</div>}
                      {hoveredSavedRecipe.ingredients && Array.isArray(hoveredSavedRecipe.ingredients) && hoveredSavedRecipe.ingredients.length > 0 && (
                        <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {hoveredSavedRecipe.ingredients.map((ing: any) => ing.name + (ing.quantity ? ` (${ing.quantity})` : '')).join(', ')}</div>
                      )}
                      {hoveredSavedRecipe.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {hoveredSavedRecipe.recipe}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <EdamamRecipeSearchTester />
      <NutritionAnalysisTester />
      <FoodDatabaseTester />
      {/* Render the hover card portal for meal details */}
      {hoveredMeal && hoverPos && (
        <HoverCardPortal pos={hoverPos}>
          <>
            <div className="font-bold text-lg mb-1">{hoveredMeal.description}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-orange-500 font-semibold">⚡ {hoveredMeal.calories} cal</span>
              <span className="text-red-500 font-semibold">❤️ {hoveredMeal.protein} protein</span>
              <span className="text-yellow-500 font-semibold">C {hoveredMeal.carbs} carbs</span>
              <span className="text-green-500 font-semibold">F {hoveredMeal.fat} fat</span>
            </div>
            {hoveredMeal.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {hoveredMeal.serving_size}</div>}
            {hoveredMeal.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {hoveredMeal.recipe}</div>}
            {hoveredMeal.ingredients && Array.isArray(hoveredMeal.ingredients) && hoveredMeal.ingredients.length > 0 && (
              <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {hoveredMeal.ingredients.join(', ')}</div>
            )}
            {hoveredMeal.tags && Array.isArray(hoveredMeal.tags) && hoveredMeal.tags.length > 0 && (
              <div className="text-xs text-gray-400 mb-1"><b>Tags:</b> {hoveredMeal.tags.join(', ')}</div>
            )}
          </>
        </HoverCardPortal>
      )}
    </div>
  );
};

export default Meals;
