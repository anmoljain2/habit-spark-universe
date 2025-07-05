import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TodaysMeals from '@/components/MealsComponents/TodaysMeals';
import AICalendarMealPlanner from '@/components/MealsComponents/AICalendarMealPlanner';
import GroceryList, { GroceryProvider } from '@/components/MealsComponents/GroceryList';
import LogMeal from '@/components/MealsComponents/LogMeal';
import AISearchRecipe from '@/components/MealsComponents/AISearchRecipe';
import EdamamRecipeSearchTester from '@/components/MealsComponents/EdamamRecipeSearchTester';
import EdamamNutritionAnalysisTester from '@/components/MealsComponents/EdamamNutritionAnalysisTester';
import EdamamFoodDatabaseTester from '@/components/MealsComponents/EdamamFoodDatabaseTester';
import EdamamWeeklyMealPlan from '@/components/MealsComponents/EdamamWeeklyMealPlan';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar } from 'lucide-react';
import { startOfWeek, formatISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import MealsQuestionnaire from '@/components/MealsQuestionnaire';
import { useProfile } from '@/components/ProfileContext';
import { MealsProvider } from '@/components/MealsComponents/MealsContext';

const Meals: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekStart = formatISO(startOfWeek(today, { weekStartsOn: 0 }), { representation: 'date' });

  const { nutritionPreferences, loading: profileLoading } = useProfile();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

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
    if (!profileLoading && userId && !nutritionPreferences) {
      setShowQuestionnaire(true);
    }
  }, [profileLoading, userId, nutritionPreferences]);

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
  if (profileLoading) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-lg text-gray-600"><Loader2 className="w-8 h-8 animate-spin mb-2 text-green-500" /> Loading your nutrition preferences...</div>;
  }
  if (showQuestionnaire) {
    return <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <MealsQuestionnaire userId={userId} onComplete={() => window.location.reload()} />
    </div>;
  }

  return (
    <MealsProvider weekStart={weekStart}>
      <div className="bg-gradient-to-br from-blue-50 to-green-50 min-h-screen w-full py-12">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Nutrition Hub Header */}
          <div className="flex flex-col items-center text-center gap-1 mb-0">
            <span className="inline-block bg-green-100 text-green-700 font-semibold px-4 py-1 rounded-full text-xs tracking-wider shadow-sm">Nutrition Hub</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-700 leading-tight">Meal Planning & Nutrition</h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-0">Track your meals, plan your nutrition, and achieve your health goals with personalized recommendations.</p>
          </div>
          {/* Today's Meals Section Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-0 mt-2">Today's Meals</h2>
          {/* Today's Meals and Nutrition Card */}
          <div className="mt-0">
            <TodaysMeals userId={userId} todayStr={todayStr} nutritionPrefs={nutritionPreferences || {}} />
          </div>
          {/* AI Meal Plan Calendar */}
          <div className="w-full">
            <AICalendarMealPlanner userId={userId} weekStart={weekStart} nutritionPrefs={nutritionPreferences || {}} />
            {/* Move title and description directly above the calendar */}
            <div className="flex flex-col w-full mb-2 mt-4">
              <div className="flex items-center gap-2 mb-0">
                <Calendar className="w-7 h-7 text-green-600" />
                <h2 className="text-2xl font-bold text-blue-900">Personalized Meal Plan Calendar</h2>
              </div>
              <p className="text-gray-600 mt-0 mb-1">This calendar shows your personalized meal plan generated by the AI, based on your preferences and logged meals.</p>
            </div>
          </div>
          {/* Context for drag-and-drop */}
          <p className="text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-2 text-base text-center font-medium shadow-sm">
            <span className="font-semibold">Tip:</span> You can <span className="font-bold">drag your logged meals</span> or <span className="font-bold">searched recipes</span> into your calendar above to quickly add them to your meal plan!
          </p>
          {/* Grocery List, Log a Meal, AI Recipe Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            <GroceryProvider userId={userId} weekStart={weekStart}>
              <GroceryList userId={userId} weekStart={weekStart} />
            </GroceryProvider>
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
          {/* Divider and Edamam API Testers Title */}
          <div className="w-full flex flex-col items-center my-10">
            <hr className="w-full border-t-2 border-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center tracking-wide">Edamam API Database Use Case Tests</h2>
          </div>
          {/* Edamam Testers */}
          <EdamamRecipeSearchTester />
          <EdamamNutritionAnalysisTester />
          <EdamamFoodDatabaseTester />
          {/* Edamam Demo Meal Plan Calendar (bottom) */}
          <div>
            <h2 className="text-2xl font-bold text-green-700 mb-2 flex items-center gap-2"><span>📅</span> Edamam Demo Meal Plan Calendar</h2>
            <p className="text-gray-600 mb-4">This calendar is a demo using the Edamam API, showing example meal plans from Edamam's recipe database.</p>
            <EdamamWeeklyMealPlan nutritionPrefs={nutritionPreferences || {}} handleRegenerateDay={() => {}} />
          </div>
        </div>
      </div>
    </MealsProvider>
  );
};

export default Meals;
