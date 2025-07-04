import React from 'react';

// Types for meal and nutrition data
interface Meal {
  id: string;
  meal_type: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: string;
  recipe?: string;
  completed?: boolean;
}

interface NutritionData {
  calories: number;
  caloriesTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
}

interface TodaysMealsProps {
  meals: Meal[];
  nutrition: NutritionData;
  mealOrder: string[];
  onCompleteMeal: (mealId: string) => void;
  onUncompleteMeal: (mealId: string) => void;
}

const TodaysMeals: React.FC<TodaysMealsProps> = ({ meals, nutrition, mealOrder, onCompleteMeal, onUncompleteMeal }) => {
  return (
    <div className="w-full max-w-7xl mx-auto mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Today's Meals</h2>
      <div className="flex flex-col md:flex-row gap-8 items-start w-full">
        {/* Meals: 2x2 grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {meals.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <span className="text-6xl text-gray-300 mb-4">🍽️</span>
              <p className="text-gray-500 mb-4">No meals found for today.</p>
            </div>
          ) : (
            mealOrder.map((type) => {
              const meal = meals.find(m => m.meal_type === type);
              if (!meal) return null;
              return (
                <div
                  key={type}
                  className={`relative flex flex-col h-full bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 group hover:shadow-2xl ${meal.completed ? 'border-green-500 bg-green-50/90' : 'border-gray-200 bg-white'} p-6 hover:-translate-y-1`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">🍽️</span>
                    <h3 className="font-extrabold text-gray-900 capitalize text-xl tracking-tight leading-tight">{meal.meal_type}</h3>
                    {meal.completed && <span className="ml-auto text-green-500">✓</span>}
                  </div>
                  <div className="font-bold text-gray-800 text-lg mb-1">{meal.description}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base font-semibold mb-2">
                    <span className="flex items-center gap-1 text-orange-500">⚡ {meal.calories} <span className="font-normal text-gray-600 text-xs ml-0.5">cal</span></span>
                    <span className="flex items-center gap-1 text-red-500">❤️ {meal.protein} <span className="font-normal text-gray-600 text-xs ml-0.5">protein</span></span>
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
                        onClick={() => onUncompleteMeal(meal.id)}
                        className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-full font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-base border border-gray-200 shadow-sm"
                      >
                        Undo
                      </button>
                    ) : (
                      <button
                        onClick={() => onCompleteMeal(meal.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-full font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 text-base"
                      >
                        ✓ Mark as Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {/* Nutrition Card: right side */}
        <div className="w-full md:w-80 flex-shrink-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col items-start justify-start h-full self-stretch" style={{height: '100%'}}>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            Today's Nutrition
          </h3>
          <div className="w-full space-y-5">
            {/* Calories */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">Calories</span>
                <span className="text-xs text-gray-500">{nutrition.calories} / {nutrition.caloriesTarget}</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (nutrition.calories / nutrition.caloriesTarget) * 100)}%` }}></div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{Math.round((nutrition.calories / nutrition.caloriesTarget) * 100)}%</div>
            </div>
            {/* Protein */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">Protein</span>
                <span className="text-xs text-gray-500">{nutrition.protein} / {nutrition.proteinTarget}g</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-3 rounded-full bg-red-500 transition-all" style={{ width: `${Math.min(100, (nutrition.protein / nutrition.proteinTarget) * 100)}%` }}></div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{Math.round((nutrition.protein / nutrition.proteinTarget) * 100)}%</div>
            </div>
            {/* Carbs */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">Carbs</span>
                <span className="text-xs text-gray-500">{nutrition.carbs} / {nutrition.carbsTarget}g</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-3 rounded-full bg-yellow-400 transition-all" style={{ width: `${Math.min(100, (nutrition.carbs / nutrition.carbsTarget) * 100)}%` }}></div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{Math.round((nutrition.carbs / nutrition.carbsTarget) * 100)}%</div>
            </div>
            {/* Fat */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-800">Fat</span>
                <span className="text-xs text-gray-500">{nutrition.fat} / {nutrition.fatTarget}g</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-3 rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (nutrition.fat / nutrition.fatTarget) * 100)}%` }}></div>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{Math.round((nutrition.fat / nutrition.fatTarget) * 100)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysMeals; 