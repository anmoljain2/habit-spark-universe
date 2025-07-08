import React, { useEffect, useState, useRef } from 'react';
import { Dumbbell, Heart, Bed, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatISO, startOfWeek } from 'date-fns';
import axios from 'axios';
import { useProfile } from '../components/ProfileContext';

const workoutIcons: Record<string, any> = {
  'Full Body Strength': Dumbbell,
  'Upper Body Strength': Dumbbell,
  'Lower Body Strength': Dumbbell,
  'Cardio - Running': Heart,
  'Cardio': Heart,
  'Flexibility & Mobility': Sparkles,
  'Rest': Bed,
};

const workoutColors: Record<string, string> = {
  'Full Body Strength': 'from-pink-400 to-pink-600',
  'Upper Body Strength': 'from-orange-400 to-orange-600',
  'Lower Body Strength': 'from-yellow-400 to-yellow-600',
  'Cardio - Running': 'from-blue-400 to-blue-600',
  'Cardio': 'from-blue-400 to-blue-600',
  'Flexibility & Mobility': 'from-green-400 to-green-600',
  'Rest': 'from-gray-300 to-gray-400',
};

const weekData = [
  {
    day: 'Monday',
    type: 'Full Body Strength',
    summary: 'Full Body Strength workout using a mix of equipment focused on basic compound movements.',
    details: [
      'Squats (3 sets × 12), Rest: 60 seconds, Use barbells.',
      'Kettlebell Swings (4 sets × 15), Rest: 45 seconds, Focus on hip drive.',
      'Push-Ups (3 sets × 15), Rest: 60 seconds, Bodyweight exercise.',
      'Lat Pulldown (3 sets × 12), Rest: 60 seconds, Use machine.'
    ]
  },
  {
    day: 'Tuesday',
    type: 'Cardio - Running',
    summary: 'Running for cardio endurance with a steady pace followed by a walking cooldown.',
    details: [
      'Steady State Run (1 sets × 1), Rest: 0 seconds, Maintain a consistent pace.',
      'Walking Cool Down (1 sets × 1), Rest: 0 seconds, Slow pace to cool down.'
    ]
  },
  {
    day: 'Wednesday',
    type: 'Upper Body Strength',
    summary: 'Targeting upper body muscles with dumbbells, barbells, and resistance bands.',
    details: [
      'Dumbbell Bench Press (3 sets × 12), Rest: 60 seconds, Focus on control.',
      'Bent Over Row (3 sets × 10), Rest: 60 seconds, Use barbell.',
      'Overhead Press (3 sets × 10), Rest: 60 seconds, Use barbell.'
    ]
  },
  {
    day: 'Thursday',
    type: 'Rest',
    summary: 'Rest day for active recovery and to recharge for the upcoming week.',
    details: []
  },
  {
    day: 'Friday',
    type: 'Lower Body Strength',
    summary: 'Lower body strength workout with a focus on major leg muscles using weights and bodyweight exercises.',
    details: [
      'Deadlifts (4 sets × 10), Rest: 60 seconds, Use barbell.',
      'Leg Press (3 sets × 12), Rest: 60 seconds, Focus on form.',
      'Calf Raises (4 sets × 15), Rest: 45 seconds, Use dumbbells or machine.',
      'Lunges (3 sets × 12), Rest: 60 seconds, Bodyweight or with dumbbells.'
    ]
  },
  {
    day: 'Saturday',
    type: 'Flexibility & Mobility',
    summary: 'Focus on increasing flexibility and mobility with stretching, yoga, and foam rolling.',
    details: [
      'Dynamic Stretching (1 sets × 8 stretches), Rest: 0 seconds, Perform each stretch slowly.',
      'Yoga Routine (1 sets × 1), Rest: 0 seconds, Use a guided video.',
      'Foam Rolling (1 sets × Focus areas), Rest: 0 seconds, Switch areas every 2 minutes.'
    ]
  },
  {
    day: 'Sunday',
    type: 'Rest',
    summary: 'Rest day for active recovery and to recharge for the upcoming week.',
    details: []
  },
];

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyWorkoutCalendar: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [weekWorkouts, setWeekWorkouts] = useState<any>({});
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const regenInputRef = useRef<HTMLTextAreaElement | null>(null);
  const [savedContexts, setSavedContexts] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [savingContext, setSavingContext] = useState(false);
  const [contextSaved, setContextSaved] = useState(false);

  // Calculate week start (Sunday) and today in user's local time
  const now = new Date();
  const weekStart = formatISO(startOfWeek(now, { weekStartsOn: 0 }), { representation: 'date' });
  const todayStr = formatISO(now, { representation: 'date' });
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  });

  // Fetch workouts for the week
  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id)
        .in('date', weekDates);
      if (error) {
        setError('Failed to fetch workouts: ' + error.message);
        setWeekWorkouts({});
      } else {
        // Map by date
        const byDate: any = {};
        (data || []).forEach((w: any) => {
          byDate[w.date] = w;
        });
        setWeekWorkouts(byDate);
      }
      setLoading(false);
    };
    if (user) fetchWorkouts();
  }, [user, weekStart]);

  // Fetch saved contexts on mount
  useEffect(() => {
    const fetchContexts = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_fitness_goals')
        .select('contexts')
        .eq('user_id', user.id)
        .single();
      const contexts = data?.contexts || [];
      setSavedContexts(contexts);
    };
    if (user) fetchContexts();
  }, [user]);

  // Save new context
  const handleSaveContext = async () => {
    if (!user || !regenFeedback.trim()) return;
    setSavingContext(true);
    try {
      // Fetch current contexts
      const { data } = await supabase
        .from('user_fitness_goals')
        .select('contexts')
        .eq('user_id', user.id)
        .single();
      const currentContexts = data?.contexts || [];
      const newContexts = [...currentContexts, regenFeedback.trim()];
      await supabase
        .from('user_fitness_goals')
        .update({ contexts: newContexts })
        .eq('user_id', user.id);
      setSavedContexts(newContexts);
      setContextSaved(true);
      setTimeout(() => setContextSaved(false), 2000);
    } catch (err) {}
    setSavingContext(false);
  };

  // Regenerate week plan
  const handleRegenerate = () => {
    setShowRegenModal(true);
    setTimeout(() => regenInputRef.current?.focus(), 100);
    setSelectedContexts([]);
  };

  const submitRegenerate = async () => {
    if (!user) return;
    setRegenerating(true);
    setError('');
    try {
      await axios.post('/api/generate-workout-plan', {
        user_id: user.id,
        regenerate_feedback: regenFeedback,
        applied_contexts: selectedContexts,
      });
      // Refetch after generating
      const { data, error } = await supabase
        .from('user_workouts')
        .select('*')
        .eq('user_id', user.id)
        .in('date', weekDates);
      if (error) {
        setError('Failed to fetch workouts: ' + error.message);
        setWeekWorkouts({});
      } else {
        const byDate: any = {};
        (data || []).forEach((w: any) => {
          byDate[w.date] = w;
        });
        setWeekWorkouts(byDate);
      }
    } catch (err: any) {
      setError('Failed to regenerate plan.');
    }
    setRegenerating(false);
    setShowRegenModal(false);
    setRegenFeedback('');
    setSelectedContexts([]);
  };

  return (
    <div className="w-full px-2 md:px-8 py-10 flex justify-center">
      <div className="w-full max-w-7xl mx-auto mt-10 mb-10">
        <h2 className="text-3xl font-extrabold text-pink-700 mb-8 flex items-center gap-3 tracking-tight">
          <span className="text-4xl">📅</span> This Week&apos;s Workout Calendar
        </h2>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRegenerate}
            className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
            disabled={regenerating || loading}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
          </button>
        </div>
        {/* Regenerate Modal */}
        {showRegenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
              <h3 className="text-lg font-bold text-pink-700 mb-2">Regenerate Workout Plan</h3>
              <label className="text-sm text-gray-700 mb-1">Why are you regenerating? (Dislikes, changes, or feedback for the AI)</label>
              <textarea
                ref={regenInputRef}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-pink-500 focus:border-pink-500"
                rows={3}
                value={regenFeedback}
                onChange={e => setRegenFeedback(e.target.value)}
                placeholder="E.g. I want more cardio, less HIIT, etc."
                disabled={regenerating}
              />
              {/* Save Context Button */}
              <div className="flex items-center gap-2 mb-2 relative group self-end">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg font-semibold text-sm shadow border ${contextSaved ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'} ${savingContext ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={handleSaveContext}
                  disabled={!regenFeedback.trim() || savingContext || contextSaved}
                >
                  {contextSaved ? 'Saved!' : savingContext ? 'Saving...' : 'Save Context'}
                </button>
              </div>
              {/* Saved Contexts Selection */}
              {savedContexts.length > 0 && (
                <div className="flex flex-col gap-1 mb-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs font-semibold">
                      <input
                        type="checkbox"
                        checked={selectedContexts.length === savedContexts.length}
                        ref={el => {
                          if (el) el.indeterminate = selectedContexts.length > 0 && selectedContexts.length < savedContexts.length;
                        }}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedContexts([...savedContexts]);
                          } else {
                            setSelectedContexts([]);
                          }
                        }}
                      />
                      Select All Contexts
                    </label>
                  </div>
                  {savedContexts.map((ctx, i) => (
                    <label key={i} className="flex items-center gap-2 text-xs font-medium">
                      <input
                        type="checkbox"
                        checked={selectedContexts.includes(ctx)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedContexts(prev => [...prev, ctx]);
                          } else {
                            setSelectedContexts(prev => prev.filter(c => c !== ctx));
                          }
                        }}
                      />
                      <span className="truncate max-w-xs">{ctx}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2 justify-end mt-2">
                <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => { setShowRegenModal(false); setRegenFeedback(''); setSelectedContexts([]); }} disabled={regenerating}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 flex items-center gap-2"
                  onClick={submitRegenerate}
                  disabled={regenerating || (!regenFeedback.trim() && selectedContexts.length === 0)}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <div className="text-center text-red-600 font-semibold mb-4">{error}</div>}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-50">
          <div className="flex gap-6 min-w-[1400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 w-full">
                <span className="text-pink-700 font-medium">Loading workout plan...</span>
              </div>
            ) : (
              weekDates.map((dateStr, idx) => {
                const dayName = daysOfWeek[idx];
                const workout = weekWorkouts[dateStr];
                const type = workout?.details?.workout_type || '';
                const Icon = workoutIcons[type] || Dumbbell;
                // Vibrant color scheme
                const colorMap: Record<string, string> = {
                  'Full Body': 'from-pink-500 via-rose-400 to-rose-600',
                  'Cardio - Running': 'from-blue-500 via-sky-400 to-indigo-600',
                  'Rest': 'from-gray-200 via-gray-100 to-gray-300',
                  'Yoga': 'from-green-400 via-emerald-300 to-teal-500',
                  'HIIT': 'from-orange-400 via-pink-500 to-red-500',
                };
                const color = colorMap[type] || 'from-purple-400 via-pink-400 to-pink-600';
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    className={`flex flex-col items-center rounded-3xl shadow-2xl px-8 py-10 min-h-[520px] w-[260px] md:w-[220px] bg-gradient-to-b ${color} text-white relative transition-all duration-300 ${isToday ? 'ring-4 ring-pink-400 scale-105 z-10' : 'opacity-90 hover:scale-105 hover:z-10'} font-semibold`}
                  >
                    <div className="flex flex-col items-center mb-8">
                      <div className="text-4xl mb-3 drop-shadow-lg"><Icon /></div>
                      <div className="font-extrabold text-2xl mb-1 tracking-tight drop-shadow-lg">{dayName}</div>
                      <div className="text-base font-bold mb-2 uppercase tracking-wide drop-shadow">{type}</div>
                    </div>
                    <div className="flex-1 w-full flex flex-col gap-4">
                      <div className="text-lg font-medium mb-2 drop-shadow-sm">{workout?.details?.summary || ''}</div>
                      <ul className="text-base space-y-2">
                        {(workout?.details?.exercises || []).map((item: any, i: number) => (
                          <li key={i} className="leading-relaxed">
                            {item.name ? `${item.name} (${item.sets} sets × ${item.reps})${item.rest ? `, Rest: ${item.rest}` : ''}${item.notes ? `, ${item.notes}` : ''}` : item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyWorkoutCalendar; 