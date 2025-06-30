
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import HabitCard from './HabitCard';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Target } from 'lucide-react';

interface HabitsListProps {
  onXPChange?: () => void;
  hideAddButton?: boolean;
}

const HabitsList = ({ onXPChange, hideAddButton }: HabitsListProps) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabits = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_habits')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching habits:', error);
          setHabits([]);
        } else {
          setHabits(data || []);
        }
      } catch (error) {
        console.error('Error in fetchHabits:', error);
        setHabits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [user]);

  const refreshHabits = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_habits')
        .select('*')
        .eq('user_id', user.id);
      
      setHabits(data || []);
    } catch (error) {
      console.error('Error refreshing habits:', error);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Today's Habits</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Habits</h2>
        {!hideAddButton && (
          <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        )}
      </div>
      
      {habits.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gray-100 p-4 rounded-full">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No habits yet</h3>
                <p className="text-gray-600 mb-4">Start building healthy habits to level up your life!</p>
                {!hideAddButton && (
                  <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium">
                    Create Your First Habit
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
                refreshHabits();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HabitsList;
