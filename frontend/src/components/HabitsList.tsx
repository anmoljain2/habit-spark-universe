import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import HabitCard from './HabitCard';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Target, X, Pencil, Trash2 } from 'lucide-react';

interface HabitsListProps {
  onXPChange?: () => void;
  hideAddButton?: boolean;
}

const DIFFICULTY_XP = { easy: 30, medium: 50, hard: 70 };

const HabitsList = ({ onXPChange, hideAddButton }: HabitsListProps) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlideout, setShowSlideout] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    frequency: 'daily',
    difficulty: 'easy',
    type: 'positive',
  });

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

  const openAdd = () => {
    setEditingHabit(null);
    setForm({ name: '', frequency: 'daily', difficulty: 'easy', type: 'positive' });
    setShowSlideout(true);
  };
  const openEdit = (habit: any) => {
    setEditingHabit(habit);
    setForm({
      name: habit.habit_name,
      frequency: habit.frequency,
      difficulty: habit.difficulty,
      type: habit.habit_type || 'positive',
    });
    setShowSlideout(true);
  };
  const closeSlideout = () => setShowSlideout(false);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this habit?');
    if (!confirmed) return;
    await supabase.from('user_habits').delete().eq('id', id);
    await refreshHabits();
    if (onXPChange) onXPChange();
  };

  const handleSave = async () => {
    if (!form.name.trim() || !user) {
      alert('User not loaded or name is empty!');
      return;
    }
    const xp = DIFFICULTY_XP[form.difficulty as keyof typeof DIFFICULTY_XP];
    let result;
    if (editingHabit) {
      result = await supabase.from('user_habits').update({
        habit_name: form.name,
        frequency: form.frequency,
        difficulty: form.difficulty,
        habit_type: form.type,
        xp_value: xp,
      }).eq('id', editingHabit.id);
    } else {
      result = await supabase.from('user_habits').insert({
        user_id: user.id,
        habit_name: form.name,
        frequency: form.frequency,
        difficulty: form.difficulty,
        habit_type: form.type,
        xp_value: xp,
      });
    }
    if (result.error) {
      alert('Error saving habit: ' + result.error.message);
      return;
    }
    setShowSlideout(false);
    await refreshHabits();
    if (onXPChange) onXPChange();
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
          <button onClick={openAdd} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2">
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
            <div key={habit.id} className="relative group">
              <HabitCard
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
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => openEdit(habit)} className="bg-white rounded-full p-1 shadow hover:bg-gray-100"><Pencil className="w-4 h-4 text-indigo-600" /></button>
                <button onClick={() => handleDelete(habit.id)} className="bg-white rounded-full p-1 shadow hover:bg-gray-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slideout Panel */}
      {showSlideout && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={closeSlideout}></div>
          <div className="w-full max-w-md bg-white shadow-2xl p-8 flex flex-col animate-slide-in-right relative">
            <button className="absolute top-4 right-4" onClick={closeSlideout}><X className="w-6 h-6 text-gray-400 hover:text-gray-700" /></button>
            <h2 className="text-2xl font-bold mb-6 text-indigo-700">{editingHabit ? 'Edit Habit' : 'Add Habit'}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Drink water"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.difficulty}
                onChange={e => setForm({ ...form, difficulty: e.target.value })}
              >
                <option value="easy">Easy (+30 XP)</option>
                <option value="medium">Medium (+50 XP)</option>
                <option value="hard">Hard (+70 XP)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div className="mb-6 text-sm text-gray-500">XP Reward: <span className="font-bold text-indigo-700">{DIFFICULTY_XP[form.difficulty as keyof typeof DIFFICULTY_XP]}</span></div>
            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300" onClick={handleSave}>{editingHabit ? 'Save Changes' : 'Add Habit'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsList;
