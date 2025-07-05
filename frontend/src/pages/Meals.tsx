import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TodaysMeals from '@/components/MealsComponents/TodaysMeals';
import AICalendarMealPlanner from '@/components/MealsComponents/AICalendarMealPlanner';
import GroceryList from '@/components/MealsComponents/GroceryList';
import LogMeal from '@/components/MealsComponents/LogMeal';
import AISearchRecipe from '@/components/MealsComponents/AISearchRecipe';
import EdamamRecipeSearchTester from '@/components/MealsComponents/EdamamRecipeSearchTester';
import EdamamNutritionAnalysisTester from '@/components/MealsComponents/EdamamNutritionAnalysisTester';
import EdamamFoodDatabaseTester from '@/components/MealsComponents/EdamamFoodDatabaseTester';
import EdamamWeeklyMealPlan from '@/components/MealsComponents/EdamamWeeklyMealPlan';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar } from 'lucide-react';
import { startOfWeek, formatISO } from 'date-fns';

const Meals: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekStart = formatISO(startOfWeek(today, { weekStartsOn: 0 }), { representation: 'date' });

  const [nutritionPrefs, setNutritionPrefs] = useState<any>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);

  // AI Recipe Search state (for modularity, can be moved to a custom hook)
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [recipeError, setRecipeError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [hoveredSavedRecipe, setHoveredSavedRecipe] = useState<any | null>(null);
  const [savedRecipeTooltipPos, setSavedRecipeTooltipPos] = useState<{ x: number, y: number } | null>(null);
  const savedRecipeTooltipTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      if (!userId) return;
      setPrefsLoading(true);
      const { data } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      setNutritionPrefs(data || {});
      setPrefsLoading(false);
    };
    fetchPrefs();
  }, [userId]);

  // Fetch saved recipes from Supabase on mount
  useEffect(() => {
    const fetchSavedRecipes = async () => {
      if (!userId) return;
      const { data, error } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('user_id', userId)
        .eq('source', 'searched')
        .order('created_at', { ascending: false });
      if (!error && data) setSavedRecipes(data);
    };
    fetchSavedRecipes();
  }, [userId]);

  // AI Recipe Search handlers
  const handleRecipeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecipeError('');
    setRecipeLoading(true);
    setRecipeResults([]);
    try {
      const res = await fetch('/api/find-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: recipeQuery, user_id: userId, date: todayStr }),
      });
      if (!res.ok) throw new Error('Failed to search recipes');
      const data = await res.json();
      // Only update recipeResults, do not save to Supabase yet
      if (data && data.recipe) {
        setRecipeResults([data.recipe]);
      } else if (data && data.meal) {
        setRecipeResults([data.meal]);
      } else {
        setRecipeResults(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      setRecipeError(err.message || 'Error searching recipes');
    }
    setRecipeLoading(false);
  };
  // Save recipe to Supabase
  const handleSaveRecipe = async (recipe: any) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/save-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: recipe.meal_name || recipe.name || recipe.description,
          ingredients: recipe.ingredients,
          recipe: recipe.recipe,
          serving_size: recipe.serving_size,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
        }),
      });
      if (!res.ok) throw new Error('Failed to save recipe');
      const data = await res.json();
      if (data && data.recipe) {
        setSavedRecipes(prev => [data.recipe, ...prev]);
      }
    } catch (err: any) {
      setRecipeError(err.message || 'Error saving recipe');
    }
  };

  if (!userId) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-gray-600">Please log in to view your meals.</div>;
  }
  if (prefsLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-gray-600"><Loader2 className="w-8 h-8 animate-spin mb-2 text-green-500" /> Loading your nutrition preferences...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen w-full py-12">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Nutrition Hub Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-1">
          <span className="inline-block bg-green-100 text-green-700 font-semibold px-4 py-1 rounded-full text-xs tracking-wider shadow-sm">Nutrition Hub</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-green-700 leading-tight">Meal Planning & Nutrition</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg">Track your meals, plan your nutrition, and achieve your health goals with personalized recommendations.</p>
        </div>
        {/* Today's Meals Section Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Today's Meals</h2>
        {/* Today's Meals and Nutrition Card */}
        <TodaysMeals userId={userId} todayStr={todayStr} nutritionPrefs={nutritionPrefs || {}} />
        {/* AI Meal Plan Calendar */}
        <div className="w-full flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-7 h-7 text-green-600" />
            <h2 className="text-2xl font-bold text-blue-900">Personalized Meal Plan Calendar</h2>
          </div>
          <p className="text-gray-600 mb-4 text-center">This calendar shows your personalized meal plan generated by the AI, based on your preferences and logged meals.</p>
          <div className="w-full flex justify-center">
            <AICalendarMealPlanner userId={userId} weekStart={weekStart} nutritionPrefs={nutritionPrefs || {}} />
          </div>
        </div>
        {/* Grocery List, Log a Meal, AI Recipe Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <GroceryList userId={userId} weekStart={weekStart} />
          <LogMeal userId={userId} todayStr={todayStr} />
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
            setRecipeResults={setRecipeResults}
          />
        </div>
        {/* Edamam Testers */}
        <EdamamRecipeSearchTester />
        <EdamamNutritionAnalysisTester />
        <EdamamFoodDatabaseTester />
        {/* Edamam Demo Meal Plan Calendar (bottom) */}
        <div>
          <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2"><span>📅</span> Edamam Demo Meal Plan Calendar</h2>
          <p className="text-gray-600 mb-4">This calendar is a demo using the Edamam API, showing example meal plans from Edamam's recipe database.</p>
          <EdamamWeeklyMealPlan nutritionPrefs={nutritionPrefs || {}} handleRegenerateDay={() => {}} />
        </div>
      </div>
    </div>
  );
};

export default Meals;
