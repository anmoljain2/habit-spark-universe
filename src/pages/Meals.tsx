
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import MealsQuestionnaire from '../components/MealsQuestionnaire';
import { Utensils, ChefHat, Calendar, Clock, Heart, Zap } from 'lucide-react';

const Meals = () => {
  const { user } = useAuth();
  const [nutritionPrefs, setNutritionPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_nutrition_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setNutritionPrefs(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (!nutritionPrefs) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
              <ChefHat className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              Customize Your Nutrition
            </h1>
            <p className="text-xl text-gray-600">
              Let's create a personalized meal plan that fits your lifestyle
            </p>
          </div>
          <MealsQuestionnaire userId={user.id} onComplete={setNutritionPrefs} />
        </div>
      </div>
    );
  }

  const todaysMeals = [
    {
      type: "Breakfast",
      time: "8:00 AM",
      dish: "Avocado Toast with Poached Eggs",
      calories: 420,
      protein: "18g",
      image: "🥑",
      status: "completed"
    },
    {
      type: "Lunch",
      time: "12:30 PM", 
      dish: "Mediterranean Quinoa Bowl",
      calories: 520,
      protein: "22g",
      image: "🥗",
      status: "upcoming"
    },
    {
      type: "Snack",
      time: "3:30 PM",
      dish: "Greek Yogurt with Mixed Berries",
      calories: 180,
      protein: "15g",
      image: "🫐",
      status: "upcoming"
    },
    {
      type: "Dinner",
      time: "7:00 PM",
      dish: "Grilled Salmon with Roasted Vegetables",
      calories: 480,
      protein: "35g",
      image: "🐟",
      status: "planned"
    }
  ];

  const nutritionStats = [
    { label: "Calories", current: 420, target: 1600, color: "from-blue-500 to-cyan-500" },
    { label: "Protein", current: 18, target: 90, color: "from-red-500 to-pink-500" },
    { label: "Carbs", current: 45, target: 200, color: "from-yellow-500 to-orange-500" },
    { label: "Fat", current: 28, target: 70, color: "from-green-500 to-emerald-500" }
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
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Meals */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-600" />
                  Today's Meals
                </h2>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all">
                  Add Meal
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaysMeals.map((meal, index) => (
                  <div key={index} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    meal.status === 'completed' 
                      ? 'bg-green-50 border-green-200' 
                      : meal.status === 'upcoming'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{meal.image}</span>
                        <div>
                          <h3 className="font-semibold text-gray-800">{meal.type}</h3>
                          <div className="flex items-center gap-1 text-gray-500 text-sm">
                            <Clock className="w-3 h-3" />
                            {meal.time}
                          </div>
                        </div>
                      </div>
                      {meal.status === 'completed' && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-800 mb-2">{meal.dish}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {meal.calories} cal
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {meal.protein} protein
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Plan */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">This Week's Plan</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weeklyPlan.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className={`${day.color} rounded-xl p-4 mb-2`}>
                      <div className="font-bold text-lg">{day.day}</div>
                      <div className="text-sm font-medium">{day.focus}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Nutrition Progress */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Today's Nutrition</h3>
              <div className="space-y-4">
                {nutritionStats.map((stat, index) => {
                  const percentage = (stat.current / stat.target) * 100;
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">{stat.label}</span>
                        <span className="text-sm text-gray-600">{stat.current}/{stat.target}g</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${stat.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  📱 Log a Meal
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  🛒 Generate Grocery List
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  👨‍🍳 Find Recipes
                </button>
              </div>
            </div>

            {/* Meal Inspiration */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recipe of the Day</h3>
              <div className="text-center">
                <div className="text-4xl mb-3">🍲</div>
                <h4 className="font-semibold text-gray-800 mb-2">Thai Green Curry</h4>
                <p className="text-gray-600 text-sm mb-4">A flavorful, healthy dinner ready in 30 minutes</p>
                <button className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all text-sm">
                  View Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meals;
