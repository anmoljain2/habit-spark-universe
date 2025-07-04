import React from 'react';
import { CheckCircle2, Utensils } from 'lucide-react';

interface TodaysMealCardProps {
  mealType: string;
  meal: any;
  onComplete?: () => void;
  nutritionPrefs?: any;
}

const colorMap: Record<string, string> = {
  breakfast: 'from-yellow-400 to-orange-400',
  lunch: 'from-green-400 to-emerald-400',
  snack: 'from-pink-400 to-red-400',
  dinner: 'from-blue-400 to-indigo-400',
};

const TodaysMealCard: React.FC<TodaysMealCardProps> = ({ mealType, meal, onComplete }) => {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 flex flex-col min-h-[260px]">
      <div className="flex items-center gap-2 mb-2">
        <Utensils className="w-6 h-6 text-gray-500" />
        <h3 className="font-bold text-lg capitalize">{mealType}</h3>
      </div>
      <div className="font-bold text-xl text-gray-900 mb-2">{meal?.description || <span className="text-gray-400">No meal planned</span>}</div>
      <div className="flex flex-wrap gap-3 mb-2">
        <span className="text-orange-500 font-semibold">⚡ {meal?.calories || 0} cal</span>
        <span className="text-red-500 font-semibold">❤️ {meal?.protein || 0} protein</span>
        <span className="text-yellow-500 font-semibold">C {meal?.carbs || 0} carbs</span>
        <span className="text-green-500 font-semibold">F {meal?.fat || 0} fat</span>
      </div>
      {meal?.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {meal.serving_size}</div>}
      {meal?.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {meal.recipe}</div>}
      <div className="mt-auto pt-2">
        {meal?.completed ? (
          <div className="flex items-center gap-2 text-green-600 font-semibold"><CheckCircle2 className="w-5 h-5" /> Completed</div>
        ) : (
          onComplete && <button onClick={onComplete} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 text-base"><CheckCircle2 className="w-5 h-5" /> Mark as Complete</button>
        )}
      </div>
    </div>
  );
};

export default TodaysMealCard; 