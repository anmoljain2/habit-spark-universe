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
import TodaysMeals from '@/components/MealsComponents/TodaysMeals';
import AICalendarMealPlanner from '@/components/MealsComponents/AICalendarMealPlanner';
import GroceryList from '@/components/MealsComponents/GroceryList';
import LogMeal from '@/components/MealsComponents/LogMeal';
import AISearchRecipe from '@/components/MealsComponents/AISearchRecipe';
import EdamamRecipeSearchTester from '@/components/MealsComponents/EdamamRecipeSearchTester';
import EdamamNutritionAnalysisTester from '@/components/MealsComponents/EdamamNutritionAnalysisTester';
import EdamamFoodDatabaseTester from '@/components/MealsComponents/EdamamFoodDatabaseTester';
import EdamamWeeklyMealPlan from '@/components/MealsComponents/EdamamWeeklyMealPlan';

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
  const [logMealError, setLogMealError] = useState('');
  const userLoggedMeals = todaysMeals.filter((m: any) => m.source === 'user');
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);
  const [hoveredUserMeal, setHoveredUserMeal] = useState<any | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [recipeError, setRecipeError] = useState('');
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

  // Handler for generating grocery list
  const handleGenerateGroceryList = async () => {
    if (!user) return;
    try {
      // 1. Call the API to generate the grocery list
      const res = await fetch('/api/generate-grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, week_start: weekStart }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to generate grocery list: ${text}`);
      }
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : data;
      // 2. Delete the existing grocery list row for this user and week
      await supabase
        .from('grocery_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start', weekStart);
      // 3. Insert the new grocery list row
      const { error } = await supabase
        .from('grocery_lists')
        .insert([{ user_id: user.id, week_start: weekStart, items }]);
      if (error) throw new Error(error.message);
      // 4. Refetch grocery list and show toast
      refetchGrocery();
      toast.success('Grocery list regenerated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate grocery list');
    }
  };

  // Handler for logging a meal (stub)
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
      // Prepare the meal object with correct types
      const mealToInsert = {
        ...logMealForm,
        user_id: user.id,
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
      refetchMeals();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log meal');
    }
    setLogMealLoading(false);
  };

  // Handler for recipe search (AI-powered, not Edamam)
  const handleRecipeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeLoading(true);
    setRecipeResults([]);
    setRecipeError('');
    try {
      const res = await fetch('/api/find-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: recipeQuery }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setRecipeResults(Array.isArray(data) ? data : (data.results || []));
    } catch (err: any) {
      setRecipeError(err.message || 'Error searching recipes');
    }
    setRecipeLoading(false);
  };

  // Handler for saving a recipe (works as before)
  const handleSaveRecipe = async (recipe: any) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_recipes')
        .insert([{ ...recipe, user_id: user.id }]);
      if (error) throw new Error(error.message);
      toast.success('Recipe saved!');
      refetchSavedRecipes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save recipe');
    }
  };

  // New handler for generating weekly meals
  const handleGenerateWeeklyMeals = () => {
    // ... actual logic here ...
  };

  // Use today's date for highlighting the current day
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');

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
        <TodaysMeals
          meals={todaysMeals}
          mealOrder={mealOrder}
          onCompleteMeal={handleCompleteMeal}
          onUncompleteMeal={handleUncompleteMeal}
          nutrition={{
            calories: totalCalories,
            caloriesTarget: nutritionPrefs?.calories_target || 2000,
            protein: totalProtein,
            proteinTarget: nutritionPrefs?.protein_target || 100,
            carbs: totalCarbs,
            carbsTarget: nutritionPrefs?.carbs_target || 250,
            fat: totalFat,
            fatTarget: nutritionPrefs?.fat_target || 70,
          }}
        />

        {/* Section: Weekly Calendar (AI/user meal plan) */}
        <AICalendarMealPlanner
          weekMeals={weekMeals}
          weekDates={weekDates}
          mealOrder={mealOrder}
          todayDateStr={todayDateStr}
          weekLoading={weekLoading}
          dayLoading={dayLoading}
          handleRegenerateDay={handleRegenerateDay}
          setHoveredMeal={setHoveredMeal}
          setHoverPos={setHoverPos}
        />

        {/* Middle Section: Grocery List and Log a Meal side by side */}
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6 justify-center items-start mt-12 mb-16">
          {/* Grocery List Section */}
          <GroceryList
            groceryList={groceryList}
            groceryLoading={groceryLoading}
            checkedItems={checkedItems}
            onToggleItem={handleToggleItem}
            onGenerate={handleGenerateGroceryList}
            groceryCondensed={groceryCondensed}
            setGroceryCondensed={c => setGroceryCondensed(c)}
          />
          {/* Log a Meal Section */}
          <LogMeal
            logMealExpanded={logMealExpanded}
            setLogMealExpanded={setLogMealExpanded}
            logMealForm={logMealForm}
            setLogMealForm={setLogMealForm}
            logMealError={logMealError}
            setLogMealError={setLogMealError}
            logMealLoading={logMealLoading}
            handleLogMealChange={handleLogMealChange}
            handleLogMealSubmit={handleLogMealSubmit}
            userLoggedMeals={userLoggedMeals}
            hoveredUserMeal={hoveredUserMeal}
            setHoveredUserMeal={setHoveredUserMeal}
            userMealTooltipPos={userMealTooltipPos}
            setUserMealTooltipPos={setUserMealTooltipPos}
            userMealTooltipTimeout={userMealTooltipTimeout}
          />
          {/* Search a Recipe Section */}
          <AISearchRecipe
            recipeQuery={recipeQuery}
            setRecipeQuery={setRecipeQuery}
            recipeLoading={recipeLoading}
            recipeResults={recipeResults}
            recipeError={recipeError}
            handleRecipeSearch={handleRecipeSearch}
            handleSaveRecipe={handleSaveRecipe}
            savedRecipes={savedRecipes}
            hoveredSavedRecipe={hoveredSavedRecipe}
            setHoveredSavedRecipe={setHoveredSavedRecipe}
            savedRecipeTooltipPos={savedRecipeTooltipPos}
            setSavedRecipeTooltipPos={setSavedRecipeTooltipPos}
            savedRecipeTooltipTimeout={savedRecipeTooltipTimeout}
          />
        </div>
      </div>
      <EdamamNutritionAnalysisTester />
      <EdamamFoodDatabaseTester />
      {/* Edamam Demo Meal Plan Calendar moved below all Edamam testers */}
      <div className="w-full max-w-7xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-green-700 mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-700" />
          Edamam Demo Meal Plan Calendar
        </h2>
        <p className="text-sm text-gray-500 mb-4">This calendar is a demo using the Edamam API, showing example meal plans from Edamam's recipe database.</p>
        <EdamamWeeklyMealPlan nutritionPrefs={nutritionPrefs} handleRegenerateDay={() => {}} />
      </div>
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
