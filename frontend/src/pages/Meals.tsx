import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MealsQuestionnaire from '../components/MealsQuestionnaire';
import { Utensils, ChefHat, Calendar, Clock, Heart, Zap, CheckCircle, Loader2, ShoppingCart, Info, PackageCheck } from 'lucide-react';
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
  const userLoggedMeals = todaysMeals.filter(m => m.source === 'user');
  const [hoveredUserMeal, setHoveredUserMeal] = useState<Meal | null>(null);
  const [userMealTooltipPos, setUserMealTooltipPos] = useState<{x: number, y: number} | null>(null);
  const userMealTooltipTimeout = useRef<NodeJS.Timeout | null>(null);

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
    try {
      const res = await axios.post('/api/log-meal', {
        user_id: user.id,
        ...logMealForm,
        calories: logMealForm.calories ? Number(logMealForm.calories) : null,
        protein: logMealForm.protein ? Number(logMealForm.protein) : null,
        carbs: logMealForm.carbs ? Number(logMealForm.carbs) : null,
        fat: logMealForm.fat ? Number(logMealForm.fat) : null,
        ingredients: logMealForm.ingredients ? logMealForm.ingredients.split(',').map(i => i.trim()) : [],
        tags: logMealForm.tags ? logMealForm.tags.split(',').map(t => t.trim()) : [],
      });
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
    } catch (err) {
      toast.error('Failed to log meal.');
    }
    setLogMealLoading(false);
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
        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-start mt-12 mb-16">
          {/* Grocery List Section */}
          <div className="w-full max-w-sm">
            <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 flex flex-col items-start justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-green-600" />
                Grocery List
              </h2>
              {groceryLoading ? (
                <div className="flex flex-col items-center justify-center py-8 w-full">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
                  <span className="text-green-700 font-medium">Loading grocery list...</span>
                </div>
              ) : groceryError ? (
                <div className="flex flex-col items-center gap-2 py-4 w-full">
                  <Info className="w-6 h-6 text-red-500" />
                  <span className="text-red-600 font-semibold">{groceryError}</span>
                  <button
                    onClick={handleGenerateGroceryList}
                    className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> Generate Grocery List
                  </button>
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
                    {groceryList.map((item, idx) => (
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
                  <button
                    onClick={handleGenerateGroceryList}
                    className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 mx-auto"
                  >
                    <ShoppingCart className="w-5 h-5" /> Regenerate Grocery List
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* Log a Meal Section */}
          <div className="w-full max-w-sm">
            <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 flex flex-col items-start justify-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-green-600" />
                Log a Meal
              </h2>
              <form className="w-full space-y-3" onSubmit={handleLogMealSubmit}>
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
                <Button type="submit" className="w-full mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700" disabled={logMealLoading}>
                  {logMealLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log Meal'}
                </Button>
              </form>
              {userLoggedMeals.length > 0 && (
                <div className="mt-6 w-full">
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
        </div>
      </div>
    </div>
  );
};

export default Meals;
