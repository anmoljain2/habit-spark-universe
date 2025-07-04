import React from 'react';

interface TodaysNutritionCardProps {
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  nutritionPrefs: any;
}

const TodaysNutritionCard: React.FC<TodaysNutritionCardProps> = ({ nutrition, nutritionPrefs }) => {
  const targets = {
    calories: nutritionPrefs?.calories_target || 2000,
    protein: nutritionPrefs?.protein_target || 100,
    carbs: nutritionPrefs?.carbs_target || 250,
    fat: nutritionPrefs?.fat_target || 70,
  };
  const percent = (val: number, target: number) => Math.round((val / target) * 100);
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-6 w-full max-w-xs flex flex-col">
      <h3 className="font-bold text-lg mb-4">Today's Nutrition</h3>
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1"><span>Calories</span><span>{nutrition.calories} / {targets.calories}</span></div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1"><div className="h-2 rounded-full bg-orange-400" style={{ width: `${percent(nutrition.calories, targets.calories)}%` }}></div></div>
        <div className="text-xs text-gray-400 mb-2">{percent(nutrition.calories, targets.calories)}%</div>
        <div className="flex justify-between text-sm mb-1"><span>Protein</span><span>{nutrition.protein} / {targets.protein}g</span></div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1"><div className="h-2 rounded-full bg-red-400" style={{ width: `${percent(nutrition.protein, targets.protein)}%` }}></div></div>
        <div className="text-xs text-gray-400 mb-2">{percent(nutrition.protein, targets.protein)}%</div>
        <div className="flex justify-between text-sm mb-1"><span>Carbs</span><span>{nutrition.carbs} / {targets.carbs}g</span></div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1"><div className="h-2 rounded-full bg-yellow-400" style={{ width: `${percent(nutrition.carbs, targets.carbs)}%` }}></div></div>
        <div className="text-xs text-gray-400 mb-2">{percent(nutrition.carbs, targets.carbs)}%</div>
        <div className="flex justify-between text-sm mb-1"><span>Fat</span><span>{nutrition.fat} / {targets.fat}g</span></div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1"><div className="h-2 rounded-full bg-green-400" style={{ width: `${percent(nutrition.fat, targets.fat)}%` }}></div></div>
        <div className="text-xs text-gray-400">{percent(nutrition.fat, targets.fat)}%</div>
      </div>
    </div>
  );
};

export default TodaysNutritionCard; 