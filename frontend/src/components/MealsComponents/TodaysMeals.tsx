import React, { useState, useEffect } from 'react';
import TodaysMealCard from './TodaysMealCard';

interface TodaysMealsProps {
  userId: string;
  todayStr: string;
  onNutrition?: (nutrition: { calories: number; protein: number; carbs: number; fat: number }) => void;
}

const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];

const TodaysMeals: React.FC<TodaysMealsProps> = ({ userId, todayStr, onNutrition }) => {
  const [todayMeals, setTodayMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  const fetchTodayMeals = async () => {
    setLoading(true);
    const { data, error } = await import('@/integrations/supabase/client').then(m => m.supabase)
      .then(supabase => supabase
        .from('user_meals')
        .select('*')
        .eq('user_id', userId)
        .eq('date_only', todayStr)
      );
    if (!error && data) {
      setTodayMeals(data);
      let cals = 0, prot = 0, carbs = 0, fat = 0;
      data.forEach((m: any) => {
        cals += Number(m.calories) || 0;
        prot += Number(m.protein) || 0;
        carbs += Number(m.carbs) || 0;
        fat += Number(m.fat) || 0;
      });
      const nut = { calories: cals, protein: prot, carbs: carbs, fat: fat };
      setNutrition(nut);
      if (onNutrition) onNutrition(nut);
    } else {
      setTodayMeals([]);
      setNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      if (onNutrition) onNutrition({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userId && todayStr) fetchTodayMeals();
    // eslint-disable-next-line
  }, [userId, todayStr]);

  if (loading) {
    return <div className="w-full flex items-center justify-center py-12"><span className="text-green-600 font-semibold">Loading today's meals...</span></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
      {mealTypes.map(type => {
        const meal = todayMeals.find((m: any) => m.meal_type === type);
        return <TodaysMealCard key={type} mealType={type} meal={meal} />;
      })}
    </div>
  );
};

export default TodaysMeals; 