import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, CheckCircle, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export interface FitnessGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  motivational_prompt: string;
  target_type: string;
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string | null;
  progress: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  icon: string | null;
}

const defaultGoal: Partial<FitnessGoal> = {
  title: '',
  description: '',
  motivational_prompt: '',
  target_type: '',
  target_value: 0,
  unit: '',
  start_date: new Date().toISOString().slice(0, 10),
  end_date: '',
  icon: '',
};

const FitnessGoals: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<FitnessGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultGoal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setGoals(data);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleFormChange = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { error: insertError } = await supabase.from('fitness_goals').insert({
        user_id: user.id,
        title: form.title || '',
        description: form.description || '',
        motivational_prompt: form.motivational_prompt || '',
        target_type: form.target_type || '',
        target_value: Number(form.target_value) || 0,
        unit: form.unit || '',
        start_date: form.start_date || new Date().toISOString().slice(0, 10),
        end_date: form.end_date || null,
        progress: 0,
        status: 'active',
        icon: form.icon || '',
      });
      if (insertError) throw insertError;
      setShowForm(false);
      setForm(defaultGoal);
      setCelebrate(true);
      fetchGoals();
      setTimeout(() => setCelebrate(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add goal');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white/80 rounded-2xl shadow-lg p-6 mb-8 border border-pink-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-pink-700 flex items-center gap-2">
          <Award className="w-6 h-6 text-pink-500" /> My Fitness Goals
        </h2>
        <button onClick={() => setShowForm(f => !f)} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow hover:from-pink-600 hover:to-rose-600">
          <Plus className="w-5 h-5" /> Add Goal
        </button>
      </div>
      {celebrate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-gradient-to-br from-yellow-300 via-pink-300 to-indigo-400 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border-4 border-white/80 animate-pop">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 text-center">GOAL ADDED!</h2>
            <p className="text-lg text-white/90 font-semibold text-center mb-2">Stay committed and crush it! 🚀</p>
          </div>
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 mb-6 border border-pink-100 space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Goal Title</label>
            <input type="text" value={form.title} onChange={e => handleFormChange('title', e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => handleFormChange('description', e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Motivational Prompt (Why is this important to you?)</label>
            <textarea value={form.motivational_prompt} onChange={e => handleFormChange('motivational_prompt', e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Type</label>
              <input type="text" value={form.target_type} onChange={e => handleFormChange('target_type', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. distance, weight, sessions" required />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Target Value</label>
              <input type="number" value={form.target_value} onChange={e => handleFormChange('target_value', e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Unit</label>
              <input type="text" value={form.unit} onChange={e => handleFormChange('unit', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. km, kg, days" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => handleFormChange('start_date', e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">End Date</label>
              <input type="date" value={form.end_date || ''} onChange={e => handleFormChange('end_date', e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Icon (Emoji or icon name)</label>
            <input type="text" value={form.icon} onChange={e => handleFormChange('icon', e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. 🏃‍♂️, 💪, 🥇" />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg font-bold" disabled={saving}>{saving ? 'Saving...' : 'Add Goal'}</button>
        </form>
      )}
      {loading ? (
        <div className="text-center text-pink-500 font-semibold py-8">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No fitness goals yet. Start by adding one!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <div key={goal.id} className="bg-white rounded-xl shadow p-5 border border-pink-100 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{goal.icon || '🎯'}</span>
                <span className="font-bold text-lg text-pink-700">{goal.title}</span>
                {goal.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500 ml-2" />}
              </div>
              <div className="text-gray-700 mb-2 text-sm">{goal.description}</div>
              <div className="text-xs text-gray-500 mb-2 italic">{goal.motivational_prompt}</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-pink-600 font-semibold">Target:</span>
                <span>{goal.target_value} {goal.unit} ({goal.target_type})</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-pink-600 font-semibold">Progress:</span>
                <span>{goal.progress} / {goal.target_value} {goal.unit}</span>
                <div className="flex-1 h-2 bg-pink-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full" style={{ width: `${Math.min(100, (goal.progress / goal.target_value) * 100)}%` }}></div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-bold rounded-full px-2 py-1 ${goal.status === 'completed' ? 'bg-green-100 text-green-700' : goal.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}</span>
                {goal.end_date && <span className="text-xs text-gray-400 ml-2">Ends: {goal.end_date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FitnessGoals; 