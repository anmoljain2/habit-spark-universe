import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'other', label: 'Other' },
];

const FitnessQuestionnaire = ({ userId, onComplete }: { userId: string, onComplete: (goals: any) => void }) => {
  const [goalType, setGoalType] = useState('weight_loss');
  const [targetWeight, setTargetWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [height, setHeight] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.from('user_fitness_goals').insert({
      user_id: userId,
      goal_type: goalType,
      target_weight: targetWeight ? parseFloat(targetWeight) : null,
      current_weight: currentWeight ? parseFloat(currentWeight) : null,
      height: height ? parseFloat(height) : null,
      start_date: startDate || null,
      end_date: endDate || null,
      notes,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onComplete({
        goal_type: goalType,
        target_weight: targetWeight,
        current_weight: currentWeight,
        height,
        start_date: startDate,
        end_date: endDate,
        notes,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-pink-700 mb-2">Set Your Fitness Goals</h2>
      <div>
        <label className="block font-medium mb-1">Goal Type</label>
        <select value={goalType} onChange={e => setGoalType(e.target.value)} className="border rounded px-3 py-2 w-full">
          {goalTypes.map(g => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Target Weight (kg)</label>
          <input type="number" min="0" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Current Weight (kg)</label>
          <input type="number" min="0" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Height (cm)</label>
          <input type="number" min="0" value={height} onChange={e => setHeight(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">End Date (optional)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border rounded px-3 py-2 w-full" rows={2} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Goals'}
      </button>
    </form>
  );
};

export default FitnessQuestionnaire; 