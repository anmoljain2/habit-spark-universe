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

type Meal = Database['public']['Tables']['user_meals']['Row'];

function NutritionAnalysisTester() {
  const [input, setInput] = useState('1 cup rice, 2 eggs');
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
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-80 min-w-[320px] mx-auto">
        <h2 className="text-2xl font-bold text-black mb-2 text-center border-b pb-2">Nutrition Facts</h2>
        <div className="text-xs text-gray-700 mb-2 text-center">Amount Per Serving</div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-extrabold">Calories</span>
          <span className="text-4xl font-extrabold">{Math.round(data.calories)}</span>
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
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.nutrients?.ENERC_KCAL ? Math.round(ing.parsed[0].nutrients.ENERC_KCAL) + ' kcal' : '-'}</td>
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
            placeholder="e.g. 1 cup rice, 2 eggs\n10 oz chickpeas"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
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

function EdamamWeeklyMealPlan({ nutritionPrefs }: { nutritionPrefs: any }) {
  const [plan, setPlan] = useState<any[][]>([]); // [day][meal]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const meals = [
    { label: 'Breakfast', mealType: 'breakfast' },
    { label: 'Lunch', mealType: 'lunch/dinner' },
    { label: 'Dinner', mealType: 'dinner' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setPlan([]);
    try {
      // For each day and meal, fetch a recipe from Edamam
      const weekPlan: any[][] = [];
      for (let d = 0; d < days.length; d++) {
        const dayMeals: any[] = [];
        for (let m = 0; m < meals.length; m++) {
          const params: any = {
            query: '', // blank query to get any recipe
            mealType: meals[m].mealType,
          };
          // Add user preferences as filters
          if (nutritionPrefs?.diet) params.diet = nutritionPrefs.diet;
          if (nutritionPrefs?.calories_target) params.calories = `${Math.max(0, nutritionPrefs.calories_target - 100)}-${nutritionPrefs.calories_target + 100}`;
          // Add more filters as needed
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
    } catch (err: any) {
      setError(err.message || 'Failed to generate Edamam meal plan');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto mt-16 mb-16 p-8 bg-white/90 rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-3xl font-bold text-green-700 mb-6">Edamam Weekly Meal Plan Demo</h2>
      <button
        onClick={handleGenerate}
        className="mb-8 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 text-lg shadow"
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Edamam Meal Plan'}
      </button>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {plan.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-6">
            <thead>
              <tr>
                <th className="text-lg font-bold text-gray-700 text-left px-4">Day</th>
                {meals.map(m => (
                  <th key={m.mealType} className="text-lg font-bold text-gray-700 text-center px-4">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.map((dayMeals, dIdx) => (
                <tr key={days[dIdx]} className="align-top">
                  <td className="font-semibold text-green-700 px-4 py-2 text-left whitespace-nowrap">{days[dIdx]}</td>
                  {dayMeals.map((recipe, mIdx) => (
                    <td key={mIdx} className="px-4 py-2">
                      {recipe ? (
                        <div className="bg-white rounded-2xl shadow border border-gray-200 p-4 w-64 flex flex-col items-center">
                          <div className="w-28 h-28 bg-gray-100 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                            {recipe.image ? <img src={recipe.image} alt={recipe.label} className="object-cover w-full h-full" /> : <span className="text-gray-400">No Image</span>}
                          </div>
                          <div className="text-base font-bold text-gray-900 mb-1 text-center">{recipe.label}</div>
                          <div className="flex gap-2 text-xs text-gray-500 mb-2">
                            <span>{recipe.yield} servings</span>
                            <span>{Math.round(recipe.calories)} kcal</span>
                          </div>
                          <div className="flex gap-2 text-xs mb-2">
                            <span className="text-green-600 font-semibold">PROTEIN {recipe.totalNutrients?.PROCNT?.quantity ? Math.round(recipe.totalNutrients.PROCNT.quantity) : 0}g</span>
                            <span className="text-yellow-600 font-semibold">FAT {recipe.totalNutrients?.FAT?.quantity ? Math.round(recipe.totalNutrients.FAT.quantity) : 0}g</span>
                            <span className="text-red-600 font-semibold">CARB {recipe.totalNutrients?.CHOCDF?.quantity ? Math.round(recipe.totalNutrients.CHOCDF.quantity) : 0}g</span>
                          </div>
                          <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">View Recipe</a>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">No recipe found</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Meals = () => {
  const { user } = useAuth();
  const [nutritionPrefs, setNutritionPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [todaysMeals, setTodaysMeals] = useState<Meal[]>([]);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevTodaysMeals = useRef<Meal[]>();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [xpAwardedForMealsToday, setXpAwardedForMealsToday] = useState(() => localStorage.getItem('lastMealXpDate') === todayStr);
  const [weekMeals, setWeekMeals] = useState<{ [date: string]: Meal[] }>({});
  const [weekLoading, setWeekLoading] = useState(false);
  const [weekError, setWeekError] = useState('');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [dayLoading, setDayLoading] = useState<string | null>(null);
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(false);
  const [groceryError, setGroceryError] = useState('');
  const [groceryGenerated, setGroceryGenerated] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [hoveredMeal, setHoveredMeal] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
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
  const [logMealExpanded, setLogMealExpanded] = useState(false);
  const userLoggedMeals = todaysMeals.filter(m => m.source === 'user');
  const [hoveredUserMeal, setHoveredUserMeal] = useState<Meal | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [hoveredSavedRecipe, setHoveredSavedRecipe] = useState<any | null>(null);
  const [savedRecipeTooltipPos, setSavedRecipeTooltipPos] = useState<{x: number, y: number} | null>(null);
  const savedRecipeTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [groceryCondensed, setGroceryCondensed] = useState(true);

  const fetchOrGenerateMeals = useCallback(async () => {
    if (!user) return;
    setMealsLoading(true);

    console.log('Fetching meals for user:', user.id, 'date:', todayStr);

    const { data: todaysMeals, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date_only', todayStr)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching meals:', error);
      toast.error(`Error fetching meals: ${error.message}`);
      setMealsLoading(false);
      return;
    }
    
    const mealCount = todaysMeals?.length ?? 0;
    console.log('Found', mealCount, 'meals for today');

    if (mealCount >= 4) {
      setTodaysMeals(todaysMeals.slice(0, 4));
      setMealsLoading(false);
      return;
    }

    console.log('Generating new meals...');
    try {
      const response = await axios.post('/api/generate-meal-plan', { 
        user_id: user.id 
      });
      
      console.log('Meal generation response:', response.data);
      
      // Fetch meals again after generation
      const { data: newMeals, error: newFetchError } = await supabase
        .from('user_meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_only', todayStr)
        .order('created_at', { ascending: false });
      
      if (newFetchError) {
        console.error('Error fetching newly generated meals:', newFetchError);
        toast.error(`Failed to fetch newly generated meals: ${newFetchError.message}`);
      } else {
        console.log('Successfully fetched', newMeals?.length || 0, 'new meals');
        setTodaysMeals(newMeals?.slice(0, 4) || []);
        toast.success('New meals generated successfully!');
      }
    } catch (err) {
      console.error('Error generating meals:', err);
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || err.message;
        if (errorMessage.includes('Daily meal limit of 4 has been reached.')) {
          // Defensive: If there are 0 meals, inform the user and suggest regeneration
          if ((todaysMeals?.length ?? 0) === 0) {
            toast.error('No meals found for today, but the daily meal limit was hit. Please try regenerating your meals or contact support.');
          } else {
            toast.error('You have reached the daily meal limit of 4.');
          }
        } else {
          toast.error(`Failed to generate meal plan: ${errorMessage}`);
        }
        console.error('API Error details:', err.response?.data);
      } else {
        toast.error('Failed to generate meal plan: Unknown error');
      }
    }
    setMealsLoading(false);
  }, [user, todayStr]);

  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      setLoading(true);
      console.log('Initializing meals page for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching nutrition preferences:', error);
      }
      
      console.log('Nutrition preferences:', data);
      setNutritionPrefs(data);
      setLoading(false);

      if (data) {
        fetchOrGenerateMeals();
      } else {
        console.log('No nutrition preferences found, showing questionnaire');
        setMealsLoading(false);
      }
    };
    
    initialize();
  }, [user, fetchOrGenerateMeals]);

  const updateUserXp = useCallback(async (amount: number) => {
    if (!user) return;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      toast.error("Could not fetch your profile for XP update.");
      return;
    }

    const newXp = (profile.total_xp || 0) + amount;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ total_xp: newXp })
      .eq('id', user.id);

    if (updateError) {
      toast.error("Failed to update XP.");
    }
  }, [user]);

  useEffect(() => {
    const prevAllComplete = prevTodaysMeals.current ? prevTodaysMeals.current.length >= 4 && prevTodaysMeals.current.every(meal => meal.completed) : false;

    const allComplete = todaysMeals.length >= 4 && todaysMeals.every(meal => meal.completed);

    if (allComplete && !prevAllComplete) {
      setShowConfetti(true);
      if (!xpAwardedForMealsToday) {
        toast.success("You've conquered your kitchen! All meals logged for today! 🎉 You've earned 200 XP!");
        updateUserXp(200);
        setXpAwardedForMealsToday(true);
        localStorage.setItem('lastMealXpDate', todayStr);
      }
    }

    prevTodaysMeals.current = todaysMeals;
  }, [todaysMeals, xpAwardedForMealsToday, todayStr, updateUserXp]);

  const handleCompleteMeal = async (mealId: string) => {
    const { data, error } = await supabase
      .from('user_meals')
      .update({ completed: true })
      .eq('id', mealId)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update meal status.');
    } else {
      toast.success('Meal marked as complete!');
      setTodaysMeals(prevMeals =>
        prevMeals.map(meal => (meal.id === mealId ? data : meal))
      );
    }
  };

  const handleUncompleteMeal = async (mealId: string) => {
    const { data, error } = await supabase
      .from('user_meals')
      .update({ completed: false })
      .eq('id', mealId)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update meal status.');
    } else {
      toast.info('Meal unmarked.');
      setTodaysMeals(prevMeals =>
        prevMeals.map(meal => (meal.id === mealId ? data : meal))
      );
    }
  };

  const handleRegenerateMeals = async () => {
    if (!user) return;
    setIsConfirming(true);
  };

  const confirmAndRegenerate = async () => {
    if (!user) return;

    setMealsLoading(true); 
    setIsConfirming(false);

    console.log('Deleting existing meals for regeneration...');
    const { error } = await supabase
      .from('user_meals')
      .delete()
      .eq('user_id', user.id)
      .eq('date_only', todayStr);

    if (error) {
      console.error('Error deleting meals:', error);
      toast.error(`Failed to delete meals: ${error.message}`);
      setMealsLoading(false);
    } else {
      toast.success("Meals are being regenerated!");
      fetchOrGenerateMeals();
    }
  };

  // Fetch all meals for the week
  const fetchWeekMeals = useCallback(async () => {
    if (!user) return;
    setWeekLoading(true);
    setWeekError('');
    const weekStart = new Date(selectedWeekStart);
    const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
    const { data: meals, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', user.id)
      .in('date_only', weekDates)
      .order('date_only', { ascending: true })
      .order('meal_type', { ascending: true });
    if (error) {
      setWeekError(error.message);
      setWeekMeals({});
    } else {
      // Group meals by date
      const grouped: { [date: string]: Meal[] } = {};
      for (const d of weekDates) grouped[d] = [];
      for (const meal of meals || []) {
        if (!grouped[meal.date_only]) grouped[meal.date_only] = [];
        grouped[meal.date_only].push(meal);
      }
      setWeekMeals(grouped);
    }
    setWeekLoading(false);
  }, [user, selectedWeekStart]);

  // Only fetch meals for the week on mount or when week changes
  useEffect(() => {
    if (user && nutritionPrefs) fetchWeekMeals();
  }, [user, nutritionPrefs, fetchWeekMeals]);

  // Generate or regenerate week
  const handleGenerateWeek = async () => {
    if (!user) return;
    setWeekLoading(true);
    setWeekError('');
    // Delete all meals for the week
    const weekStart = new Date(selectedWeekStart);
    const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
    await supabase.from('user_meals').delete().eq('user_id', user.id).in('date_only', weekDates);
    try {
      await axios.post('/api/generate-meal-plan', {
        user_id: user.id,
        mode: 'week',
        weekStart: selectedWeekStart,
      });
      toast.success('Weekly meal plan generated!');
      fetchWeekMeals();
    } catch (err) {
      setWeekError('Failed to generate weekly meal plan.');
      toast.error('Failed to generate weekly meal plan.');
      setWeekLoading(false);
    }
  };

  // Regenerate a single day
  const handleRegenerateDay = async (date: string) => {
    if (!user) return;
    setDayLoading(date);
    setWeekError('');
    await supabase.from('user_meals').delete().eq('user_id', user.id).eq('date_only', date);
    try {
      await axios.post('/api/generate-meal-plan', {
        user_id: user.id,
        mode: 'day',
        date,
      });
      toast.success('Meals regenerated for ' + date);
      fetchWeekMeals();
    } catch (err) {
      setWeekError('Failed to regenerate meals for ' + date);
      toast.error('Failed to regenerate meals for ' + date);
    }
    setDayLoading(null);
  };

  // Helper: get week dates
  const weekStartDate = new Date(selectedWeekStart);
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStartDate, i), 'yyyy-MM-dd'));
  const today = format(new Date(), 'yyyy-MM-dd');

  // Nutrition tracker for today
  const completedMeals = todaysMeals.filter(meal => meal.completed);
  const totalCalories = completedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = completedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = completedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = completedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
  const nutritionStats = [
    { label: "Calories", current: totalCalories, target: nutritionPrefs?.calories_target || 2000, color: "from-blue-500 to-cyan-500" },
    { label: "Protein", current: totalProtein, target: nutritionPrefs?.protein_target || 120, color: "from-red-500 to-pink-500" },
    { label: "Carbs", current: totalCarbs, target: nutritionPrefs?.carbs_target || 250, color: "from-yellow-500 to-orange-500" },
    { label: "Fat", current: totalFat, target: nutritionPrefs?.fat_target || 70, color: "from-green-500 to-emerald-500" }
  ];

  // Helper to get week start (Monday)
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return format(new Date(d.setDate(diff)), 'yyyy-MM-dd');
  };
  const weekStart = getWeekStart(new Date());

  // Fetch grocery list for this user/week
  const fetchGroceryList = useCallback(async () => {
    if (!user) return;
    setGroceryLoading(true);
    setGroceryError('');
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .single();
      if (error || !data) {
        setGroceryList([]);
        setGroceryGenerated(false);
      } else {
        const items = data.items;
        setGroceryList(Array.isArray(items) ? items : []);
        setGroceryGenerated(true);
      }
    } catch (e: any) {
      setGroceryError('Failed to fetch grocery list.');
      setGroceryList([]);
      setGroceryGenerated(false);
    }
    setGroceryLoading(false);
  }, [user, weekStart]);

  // Generate grocery list via API
  const handleGenerateGroceryList = async () => {
    if (!user) return;
    setGroceryLoading(true);
    setGroceryError('');
    try {
      const res = await axios.post('/api/generate-grocery-list', {
        user_id: user.id,
        weekStart,
      });
      const list = res.data.grocery_list;
      setGroceryList(Array.isArray(list) ? list : []);
      setGroceryGenerated(true);
      toast.success('Grocery list generated!');
    } catch (e: any) {
      setGroceryError(e?.response?.data?.error || 'Failed to generate grocery list.');
      setGroceryList([]);
      setGroceryGenerated(false);
    }
    setGroceryLoading(false);
  };

  useEffect(() => {
    fetchGroceryList();
  }, [fetchGroceryList]);

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

  const handleLogMealChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setLogMealForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleLogMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogMealLoading(true);
    const payload = {
      user_id: user.id,
      ...logMealForm,
      calories: logMealForm.calories ? Number(logMealForm.calories) : null,
      protein: logMealForm.protein ? Number(logMealForm.protein) : null,
      carbs: logMealForm.carbs ? Number(logMealForm.carbs) : null,
      fat: logMealForm.fat ? Number(logMealForm.fat) : null,
      ingredients: logMealForm.ingredients ? logMealForm.ingredients.split(',').map(i => i.trim()) : [],
      tags: logMealForm.tags ? logMealForm.tags.split(',').map(t => t.trim()) : [],
    };
    console.log('handleLogMealSubmit called. Payload:', payload);
    try {
      const res = await axios.post('/api/log-meal', payload);
      console.log('handleLogMealSubmit response:', res.data);
      toast.success('Meal logged!');
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
      fetchOrGenerateMeals();
      setLogMealExpanded(false);
    } catch (err) {
      console.error('handleLogMealSubmit error:', err);
      toast.error('Failed to log meal.');
    }
    setLogMealLoading(false);
  };

  const handleRecipeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeQuery.trim()) return;
    setRecipeLoading(true);
    setRecipeResults([]);
    const payload = {
      user_id: user.id,
      query: recipeQuery,
      date: todayStr,
    };
    console.log('handleRecipeSearch called. Payload:', payload);
    try {
      const res = await axios.post('/api/find-recipe', payload);
      console.log('handleRecipeSearch response:', res.data);
      if (res.data && res.data.meal) {
        setRecipeResults([res.data.meal]);
        fetchOrGenerateMeals();
      } else {
        setRecipeResults([]);
        toast.error('No recipe found.');
      }
    } catch (err: any) {
      console.error('handleRecipeSearch error:', err);
      setRecipeResults([]);
      toast.error(err?.response?.data?.error || 'Failed to find recipe.');
    }
    setRecipeLoading(false);
  };

  const fetchSavedRecipes = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setSavedRecipes(data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchSavedRecipes(); }, [user]);

  const handleSaveRecipe = async (recipe: any) => {
    if (!user) return;
    try {
      await axios.post('/api/save-recipe', {
        user_id: user.id,
        name: recipe.description || recipe.name,
        ingredients: recipe.ingredients,
        recipe: recipe.recipe,
        serving_size: recipe.serving_size,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      });
      toast.success('Recipe saved!');
      fetchSavedRecipes();
    } catch (err) {
      toast.error('Failed to save recipe.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!loading && !nutritionPrefs) {
    return (
      <QuestionnaireWrapper>
        <MealsQuestionnaire userId={user.id} onComplete={setNutritionPrefs} />
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

        {/* Section: Weekly Calendar (full width, clear header, no misplaced panels) */}
        <div className="w-full max-w-7xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Weekly Calendar
          </h2>
          <div className="flex gap-4 w-full">
            {weekDates.map((date, i) => {
              const meals = weekMeals[date] || [];
              const isToday = date === today;
              const plan = weeklyPlan[i] || { color: 'bg-gray-100 text-gray-700', focus: '' };
              return (
                <div key={date} className={`rounded-xl p-4 shadow border flex flex-col items-center transition-all duration-200 ${plan.color} ${isToday ? 'ring-2 ring-green-400 scale-105' : 'border-white/50 bg-white/80'}`} style={{ minWidth: 180, flex: '1 1 180px' }}>
                  <div className="font-bold text-md mb-1 flex items-center gap-2">
                    {isToday && <span className="inline-block w-2 h-2 rounded-full bg-green-500" />}
                    <span className="text-gray-800">{format(parseISO(date), 'EEEE')}</span>
                  </div>
                  <div className="flex flex-col gap-2 w-full mb-4">
                    {mealOrder.map(type => {
                      const meal = meals.find(m => m.meal_type === type);
                      const pillColor =
                        type === 'breakfast' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        type === 'snack' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        type === 'lunch' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        type === 'dinner' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-gray-100 text-gray-700 border-gray-200';
                      const mealTypeFull =
                        type === 'breakfast' ? 'Breakfast' :
                        type === 'snack' ? 'Snack' :
                        type === 'lunch' ? 'Lunch' :
                        type === 'dinner' ? 'Dinner' :
                        type;
                      return (
                        <div key={type} className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm font-medium border ${pillColor} ${meal ? (meal.completed ? 'ring-2 ring-green-300' : '') : ''}`}> 
                          <span className="font-semibold capitalize">{mealTypeFull}</span>
                          {meal && (
                            <span
                              className="ml-2 text-gray-700 cursor-pointer underline decoration-dotted"
                              onMouseEnter={e => {
                                if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
                                setHoveredMeal(meal);
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY });
                              }}
                              onMouseLeave={() => {
                                tooltipTimeout.current = setTimeout(() => setHoveredMeal(null), 200);
                              }}
                            >
                              {meal.description}
                            </span>
                          )}
                          {meal && meal.completed && <CheckCircle className="inline ml-1 w-4 h-4 text-green-500 align-middle" />}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleRegenerateDay(date)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 text-xs"
                    disabled={weekLoading || dayLoading === date}
                  >
                    <Zap className="w-4 h-4" />
                    Regenerate
                    {dayLoading === date && (
                      <span className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {hoveredMeal && tooltipPos && (
            <div
              style={{ position: 'absolute', left: tooltipPos.x, top: tooltipPos.y + 8, zIndex: 50 }}
              className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up"
              onMouseEnter={() => { if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current); }}
              onMouseLeave={() => { setHoveredMeal(null); }}
            >
              <div className="font-bold text-lg mb-1">{hoveredMeal.description}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-orange-500 font-semibold">⚡ {hoveredMeal.calories} cal</span>
                <span className="text-red-500 font-semibold">❤️ {hoveredMeal.protein} protein</span>
                <span className="text-yellow-500 font-semibold">C {hoveredMeal.carbs} carbs</span>
                <span className="text-green-500 font-semibold">F {hoveredMeal.fat} fat</span>
              </div>
              {hoveredMeal.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {hoveredMeal.serving_size}</div>}
              {hoveredMeal.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {hoveredMeal.recipe}</div>}
            </div>
          )}
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
                        <span className={`flex-1 text-gray-800 text-base ${checkedItems.has(idx) ? 'line-through text-gray-400' : ''}`}>{item.name}</span>
                        {item.quantity && <span className="text-xs text-gray-500 ml-2">x{item.quantity}</span>}
                        {item.unit && <span className="text-xs text-gray-400 ml-1">{item.unit}</span>}
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
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setUserMealTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY });
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
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setSavedRecipeTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + window.scrollY });
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
      <EdamamWeeklyMealPlan nutritionPrefs={nutritionPrefs} />
    </div>
  );
};

export default Meals;
