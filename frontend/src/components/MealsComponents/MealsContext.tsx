import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MealsContextType {
  weekMeals: Record<string, any>;
  fetchWeekMeals: (weekStart: string) => Promise<void>;
  loading: boolean;
  refreshMeals: () => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export const MealsProvider: React.FC<{ weekStart: string; children: React.ReactNode }> = ({ weekStart, children }) => {
  const { user } = useAuth();
  const [weekMeals, setWeekMeals] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchWeekMeals = useCallback(async (ws: string = weekStart) => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('date_only', ws)
      .lte('date_only', new Date(new Date(ws).getTime() + 6 * 86400000).toISOString().slice(0, 10));
    if (!error && data) {
      const mealsByDay: any = {};
      data.forEach((meal: any) => {
        if (!mealsByDay[meal.date_only]) mealsByDay[meal.date_only] = {};
        mealsByDay[meal.date_only][meal.meal_type] = meal;
      });
      setWeekMeals(mealsByDay);
    } else {
      setWeekMeals({});
    }
    setLoading(false);
  }, [user, weekStart]);

  const refreshMeals = useCallback(async () => {
    await fetchWeekMeals(weekStart);
  }, [fetchWeekMeals, weekStart]);

  React.useEffect(() => {
    if (user && weekStart) fetchWeekMeals(weekStart);
    // eslint-disable-next-line
  }, [user, weekStart]);

  return (
    <MealsContext.Provider value={{ weekMeals, fetchWeekMeals, loading, refreshMeals }}>
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = () => {
  const ctx = useContext(MealsContext);
  if (!ctx) throw new Error('useMeals must be used within a MealsProvider');
  return ctx;
}; 