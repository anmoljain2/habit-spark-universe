import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import MealsQuestionnaire from '../components/MealsQuestionnaire';
import { Utensils, ChefHat, Calendar, Clock, Heart, Zap, CheckCircle } from 'lucide-react';
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
    setWeekLoading(true);
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
      setWeekLoading(false);
    }
  };

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

  const completedMeals = todaysMeals.filter(meal => meal.completed);
  const totalCalories = completedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = completedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = completedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = completedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  const sortedMeals = [...todaysMeals].sort((a, b) => {
    const mealOrder = ['breakfast', 'snack', 'lunch', 'dinner'];
    const aIndex = mealOrder.indexOf(a.meal_type.toLowerCase());
    const bIndex = mealOrder.indexOf(b.meal_type.toLowerCase());
    return aIndex - bIndex;
  });

  const nutritionStats = [
    { label: "Calories", current: totalCalories, target: nutritionPrefs?.calories_target || 2000, color: "from-blue-500 to-cyan-500" },
    { label: "Protein", current: totalProtein, target: nutritionPrefs?.protein_target || 120, color: "from-red-500 to-pink-500" },
    { label: "Carbs", current: totalCarbs, target: nutritionPrefs?.carbs_target || 250, color: "from-yellow-500 to-orange-500" },
    { label: "Fat", current: totalFat, target: nutritionPrefs?.fat_target || 70, color: "from-green-500 to-emerald-500" }
  ];

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

        {/* Week Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex gap-2">
            <button
              onClick={handleGenerateWeek}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
              disabled={weekLoading}
            >
              <Zap className="w-4 h-4" />
              {weekLoading ? 'Generating...' : 'Generate/Regenerate Week'}
            </button>
          </div>
          <div>
            <span className="text-gray-600 text-sm">Week of: {selectedWeekStart}</span>
          </div>
        </div>

        {weekError && <div className="text-red-600 text-center mb-4">{weekError}</div>}
        {weekLoading ? (
          <div className="flex items-center justify-center min-h-[20vh] flex-col">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Generating your weekly meal plan...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(weekMeals).map(([date, meals]) => (
              <div key={date} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    {date}
                  </h2>
                  <button
                    onClick={() => handleRegenerateDay(date)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    disabled={weekLoading}
                  >
                    <Zap className="w-4 h-4" />
                    Regenerate Day
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meals.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">No meals found for this day.</p>
                    </div>
                  ) : (
                    meals.map((meal, index) => (
                      <div key={index} className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${meal.completed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                        {meal.completed && <div className="absolute top-2 right-2 text-green-500"><CheckCircle className="w-5 h-5" /></div>}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🍽️</span>
                            <div>
                              <h3 className="font-semibold text-gray-800 capitalize">{meal.meal_type}</h3>
                              <div className="flex items-center gap-1 text-gray-500 text-sm">
                                <Clock className="w-3 h-3" />
                                {meal.time || 'Anytime'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">{meal.description}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
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
                          <div className="text-xs text-gray-500 mt-1">Serving size: {meal.serving_size}</div>
                        )}
                        {meal.recipe && (
                          <div className="text-xs text-gray-700 mt-2"><b>Recipe:</b> {meal.recipe}</div>
                        )}
                        {meal.completed ? (
                          <button 
                            onClick={() => handleUncompleteMeal(meal.id)}
                            className="mt-4 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                          >
                            Undo
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleCompleteMeal(meal.id)}
                            className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark as Complete
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Meals;
