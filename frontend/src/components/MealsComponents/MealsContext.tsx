import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getLocalDateStr } from '@/lib/utils';

interface MealsContextType {
  weekMeals: Record<string, any>;
  fetchWeekMeals: (weekStart: string) => Promise<void>;
  loading: boolean;
  refreshMeals: () => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

// Helper to add days to a YYYY-MM-DD string in a specific timezone
function addDaysToDateStr(dateStr: string, days: number, timezone: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return getLocalDateStr(base, timezone);
}

export const MealsProvider: React.FC<{ weekStart: string; timezone: string; children: React.ReactNode }> = ({ weekStart, timezone, children }) => {
  const { user } = useAuth();
  const [weekMeals, setWeekMeals] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchWeekMeals = useCallback(async (ws: string = weekStart) => {
    if (!user) return;
    setLoading(true);
    // Calculate week dates in user's timezone using the same logic as the calendar
    const weekDates = Array.from({ length: 7 }, (_, i) => addDaysToDateStr(ws, i, timezone));
    console.log('[MealsContext] weekDates for fetch:', weekDates); // DEBUG
    const { data, error } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', user.id)
      .in('date_only', weekDates);
    console.log('[MealsContext] Supabase fetch result:', { data, error }); // DEBUG
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
  }, [user, weekStart, timezone]);

  const refreshMeals = useCallback(async () => {
    await fetchWeekMeals(weekStart);
  }, [fetchWeekMeals, weekStart]);

  React.useEffect(() => {
    if (user && weekStart && timezone) fetchWeekMeals(weekStart);
    // eslint-disable-next-line
  }, [user, weekStart, timezone]);

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