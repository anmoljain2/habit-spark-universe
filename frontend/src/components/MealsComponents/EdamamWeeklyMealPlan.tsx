import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Zap } from 'lucide-react';

interface EdamamWeeklyMealPlanProps {
  nutritionPrefs: any;
  handleRegenerateDay: (date: string) => void;
}

const EdamamWeeklyMealPlan: React.FC<EdamamWeeklyMealPlanProps> = ({ nutritionPrefs, handleRegenerateDay }) => {
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
          let recipe = null;
          let attempt = 0;
          let lastQuery = getQueryForMeal(mealType, d);
          while (!recipe && attempt < 3) {
            const params: any = {
              query: lastQuery,
              mealType,
            };
            if (nutritionPrefs?.diet) params.diet = nutritionPrefs.diet;
            if (nutritionPrefs?.calories_target) params.calories = `${Math.max(0, nutritionPrefs.calories_target - 100)}-${nutritionPrefs.calories_target + 100}`;
            const res = await fetch('/api/edamam-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            });
            if (res.ok) {
              const data = await res.json();
              recipe = data.hits && data.hits[0] ? data.hits[0].recipe : null;
            }
            attempt++;
            if (!recipe && attempt < 3) {
              if (mealType === "breakfast") lastQuery = breakfastIdeas[(d + attempt) % breakfastIdeas.length];
              if (mealType === "lunch") lastQuery = lunchIdeas[(d + attempt) % lunchIdeas.length];
              if (mealType === "snack") lastQuery = snackIdeas[(d + attempt) % snackIdeas.length];
              if (mealType === "dinner") lastQuery = dinnerIdeas[(d + attempt) % dinnerIdeas.length];
            }
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
};

export default EdamamWeeklyMealPlan; 