import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Pencil, Plus, Trash2 } from 'lucide-react';

const DIFFICULTY_XP = { easy: 30, medium: 50, hard: 70 };

const Habits = () => {
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

  const fetchHabits = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_habits')
      .select('*')
      .eq('user_id', user.id);
    setHabits(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHabits();
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (showSlideout === false) fetchHabits();
    // eslint-disable-next-line
  }, [showSlideout]);

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
    setHabits(habits.filter(h => h.id !== id));
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
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-indigo-800">Manage Your Habits</h1>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No habits yet. Click the + to add one!</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            {habits.map((habit) => (
              <Card key={habit.id} className="flex flex-col p-6 relative group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-indigo-700">{habit.habit_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${habit.difficulty === 'easy' ? 'bg-green-100 text-green-700' : habit.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{habit.difficulty}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${habit.habit_type === 'positive' ? 'bg-blue-100 text-blue-700' : habit.habit_type === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{habit.habit_type || 'positive'}</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Frequency: {habit.frequency}</div>
                  <div className="text-xs text-purple-600 font-semibold">XP: {habit.xp_value ?? DIFFICULTY_XP[habit.difficulty as keyof typeof DIFFICULTY_XP]}</div>
                  <div className="text-xs text-green-700 font-semibold">Streak: {habit.streak ?? 0}</div>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(habit)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(habit.id)} title="Delete Habit">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        {/* Floating Add Button */}
        <button
          onClick={openAdd}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-full shadow-lg hover:scale-110 transition-all flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
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
              <Button className="w-full" onClick={handleSave}>{editingHabit ? 'Save Changes' : 'Add Habit'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Habits; 