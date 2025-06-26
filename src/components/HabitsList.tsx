import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import HabitCard from './HabitCard';

interface HabitsListProps {
  onXPChange?: () => void;
  hideAddButton?: boolean;
}

const HabitsList = ({ onXPChange, hideAddButton }: HabitsListProps) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setHabits(data || []);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Habits</h2>
        {!hideAddButton && (
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium">
            Add Habit
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No habits found. Add a new habit to get started!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              id={habit.id}
              name={habit.habit_name}
              difficulty={habit.difficulty || 'Easy'}
              streak={habit.streak ?? 0}
              completed={!!habit.completed_today}
              xpReward={habit.xp_value ?? 50}
              description={habit.frequency}
              type={habit.habit_type || 'positive'}
              onXPChange={() => {
                if (onXPChange) onXPChange();
                supabase
                  .from('user_habits')
                  .select('*')
                  .eq('user_id', user.id)
                  .then(({ data }) => setHabits(data || []));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HabitsList;
