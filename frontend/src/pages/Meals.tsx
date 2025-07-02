import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MealsQuestionnaire from '../components/MealsQuestionnaire';
import { Utensils, ChefHat, Calendar, Clock, Heart, Zap, CheckCircle, Loader2, ShoppingCart, Info, PackageCheck } from 'lucide-react';
import axios from 'axios';
import { format, startOfWeek, addDays } from 'date-fns';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
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

  const sortedMeals = [...todaysMeals].sort((a, b) => {
    const mealOrder = ['breakfast', 'snack', 'lunch', 'dinner'];
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
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

        {/* Current Day Section: 2x2 grid layout with compact, elongated nutrition tracker */}
        <div className="mb-12 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Meals: 2x2 grid, spanning 2 columns */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {todaysMeals.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No meals found for today.</p>
              </div>
            ) : (
              todaysMeals.map((meal, index) => (
                <div key={index} className={`relative p-3 rounded-xl border-2 transition-all duration-200 text-sm ${meal.completed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                  {meal.completed && <div className="absolute top-2 right-2 text-green-500"><CheckCircle className="w-4 h-4" /></div>}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🍽️</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 capitalize text-base">{meal.meal_type}</h3>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock className="w-3 h-3" />
                          {meal.time || 'Anytime'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-800 mb-1 text-sm">{meal.description}</h4>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600 mb-1">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-orange-400" />
                      {meal.calories} cal
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-red-400" />
                      {meal.protein}g protein
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-yellow-500">C</span>
                      {meal.carbs}g carbs
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-green-500">F</span>
                      {meal.fat}g fat
                    </span>
                  </div>
                  {meal.serving_size && (
                    <div className="text-xs text-gray-400 mt-1">Serving size: {meal.serving_size}</div>
                  )}
                  {meal.recipe && (
                    <div className="text-xs text-gray-700 mt-1"><b>Recipe:</b> {meal.recipe}</div>
                  )}
                  {meal.completed ? (
                    <button 
                      onClick={() => handleUncompleteMeal(meal.id)}
                      className="mt-3 w-full bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      Undo
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleCompleteMeal(meal.id)}
                      className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Complete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {/* Right: Compact, elongated Daily Nutrition Tracker */}
          <div className="w-full md:w-auto flex-shrink-0 bg-gradient-to-br from-green-100 via-emerald-50 to-white rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-center justify-start min-h-[400px] max-h-[600px]">
            <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              Daily Nutrition
            </h3>
            <div className="w-full space-y-3">
              {nutritionStats.map((stat, idx) => {
                const percent = Math.min(100, (stat.current / stat.target) * 100);
                return (
                  <div key={stat.label} className="w-full">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-medium text-gray-700 text-xs">{stat.label}</span>
                      <span className="text-xs text-gray-500">{stat.current} / {stat.target}</span>
                    </div>
                    <Progress value={percent} className={`h-2 rounded-full bg-gray-200 ${stat.color}`} />
                    <div className="text-xs text-gray-400 mt-0.5">{Math.round(percent)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Agenda (Calendar Style) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Weekly Calendar
          </h2>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-4 min-w-[700px]">
              {weekDates.map(date => {
                const meals = weekMeals[date] || [];
                const isToday = date === today;
                return (
                  <div key={date} className={`bg-white/80 rounded-xl p-4 shadow border border-white/50 flex flex-col items-center ${isToday ? 'ring-2 ring-green-400' : ''}`} style={{ minWidth: 180 }}>
                    <div className="font-bold text-md text-gray-800 mb-2 flex items-center gap-2">
                      {isToday && <span className="inline-block w-2 h-2 rounded-full bg-green-500" />}
                      {date}
                    </div>
                    <div className="flex flex-col gap-2 w-full mb-4">
                      {['breakfast', 'lunch', 'snack', 'dinner'].map(type => {
                        const meal = meals.find(m => m.meal_type === type);
                        return (
                          <div key={type} className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm font-medium border ${meal ? (meal.completed ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-700') : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            {meal && <span className="truncate ml-2">{meal.description}</span>}
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
          </div>
        </div>

        {/* Grocery List Section */}
        <div className="max-w-2xl mx-auto mt-12 mb-16">
          <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-8 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Utensils className="w-6 h-6 text-green-600" />
              Grocery List
            </h2>
            {groceryLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
                <span className="text-green-700 font-medium">Loading grocery list...</span>
              </div>
            ) : groceryError ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <Info className="w-6 h-6 text-red-500" />
                <span className="text-red-600 font-semibold">{groceryError}</span>
                <button
                  onClick={handleGenerateGroceryList}
                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" /> Generate Grocery List
                </button>
              </div>
            ) : groceryList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <span className="text-gray-500 text-lg mb-2">No grocery list found for this week.</span>
                <button
                  onClick={handleGenerateGroceryList}
                  className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" /> Generate Grocery List
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {groceryList.map((item, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-green-50/80 to-emerald-100/60 border border-green-200 rounded-xl p-4 flex flex-col gap-2 shadow group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 mb-1">
                        <PackageCheck className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-gray-800 text-lg capitalize">{item.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                        {item.quantity && <span className="bg-white/70 rounded px-2 py-0.5 border border-gray-200">Qty: {item.quantity}</span>}
                        {item.unit && <span className="bg-white/70 rounded px-2 py-0.5 border border-gray-200">Unit: {item.unit}</span>}
                        {item.brand && <span className="bg-white/70 rounded px-2 py-0.5 border border-gray-200">Brand: {item.brand}</span>}
                      </div>
                      {item.notes && <div className="text-xs text-gray-500 italic mt-1">{item.notes}</div>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleGenerateGroceryList}
                  className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 mx-auto"
                >
                  <ShoppingCart className="w-5 h-5" /> Regenerate Grocery List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meals;
