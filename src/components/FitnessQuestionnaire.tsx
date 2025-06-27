
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dumbbell, Target, Calendar, FileText, Scale, Ruler } from 'lucide-react';

const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '🏃‍♀️', color: 'from-red-400 to-pink-500', description: 'Burn fat and lose weight' },
  { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪', color: 'from-blue-400 to-indigo-500', description: 'Build strength and muscle' },
  { value: 'maintenance', label: 'Maintenance', icon: '⚖️', color: 'from-green-400 to-emerald-500', description: 'Maintain current fitness' },
  { value: 'endurance', label: 'Endurance', icon: '🏃‍♂️', color: 'from-orange-400 to-red-500', description: 'Improve stamina and cardio' },
  { value: 'other', label: 'Other', icon: '🎯', color: 'from-purple-400 to-violet-500', description: 'Custom fitness goal' },
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

  const selectedGoal = goalTypes.find(g => g.value === goalType);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
          Set Your Fitness Goals
        </h2>
        <p className="text-gray-600 text-lg">
          Define your fitness journey and track your progress
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Goal Type Selection */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-bold text-gray-800">Choose Your Goal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalTypes.map(goal => (
              <div
                key={goal.value}
                onClick={() => setGoalType(goal.value)}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  goalType === goal.value
                    ? 'border-pink-500 bg-gradient-to-br from-pink-50 to-rose-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'
                }`}
              >
                <div className="text-center">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${goal.color} mb-3`}>
                    <span className="text-2xl">{goal.icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">{goal.label}</h3>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body Measurements */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-bold text-gray-800">Body Measurements</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Current Weight</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentWeight}
                  onChange={e => setCurrentWeight(e.target.value)}
                  className="w-full pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
                  placeholder="70.5"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold">
                  kg
                </div>
              </div>
            </div>
            
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Target Weight</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={targetWeight}
                  onChange={e => setTargetWeight(e.target.value)}
                  className="w-full pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
                  placeholder="65.0"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold">
                  kg
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Height
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="w-full pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
                  placeholder="170"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-pink-100 text-pink-700 rounded-lg text-sm font-semibold">
                  cm
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-pink-600" />
            <h3 className="text-xl font-bold text-gray-800">Timeline</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
              />
            </div>
            
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Target End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-pink-600" />
            <label className="text-lg font-bold text-gray-800">Additional Notes</label>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 transition-all resize-none"
            rows={4}
            placeholder="Share any specific fitness goals, medical conditions, or preferences..."
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              Saving Goals...
            </div>
          ) : (
            'Save Goals'
          )}
        </button>
      </form>
    </div>
  );
};

export default FitnessQuestionnaire;
