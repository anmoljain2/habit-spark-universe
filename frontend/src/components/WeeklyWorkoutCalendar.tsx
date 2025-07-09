import React, { useEffect, useState, useRef } from 'react';
import { Dumbbell, Heart, Bed, Sparkles, Calendar } from 'lucide-react';
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

interface WeeklyWorkoutCalendarProps {
  onLoggedWorkoutDrop?: (date: string, workout: any) => void;
}

function autoScrollOnDrag(e: React.DragEvent) {
  const threshold = 80; // px from top/bottom to start scrolling
  const scrollSpeed = 30; // px per event
  const y = e.clientY;
  const windowHeight = window.innerHeight;
  if (y < threshold) {
    window.scrollBy({ top: -scrollSpeed, behavior: 'smooth' });
  } else if (y > windowHeight - threshold) {
    window.scrollBy({ top: scrollSpeed, behavior: 'smooth' });
  }
}

function setCustomDragImage(e: React.DragEvent, name: string) {
  const dragPreview = document.createElement('div');
  dragPreview.style.position = 'absolute';
  dragPreview.style.top = '-1000px';
  dragPreview.style.left = '-1000px';
  dragPreview.style.padding = '6px 16px';
  dragPreview.style.background = '#f472b6'; // Tailwind pink-400
  dragPreview.style.color = 'white';
  dragPreview.style.fontWeight = 'bold';
  dragPreview.style.fontSize = '14px';
  dragPreview.style.borderRadius = '8px';
  dragPreview.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
  dragPreview.innerText = name;
  document.body.appendChild(dragPreview);
  e.dataTransfer.setDragImage(dragPreview, dragPreview.offsetWidth / 2, dragPreview.offsetHeight / 2);
  setTimeout(() => document.body.removeChild(dragPreview), 0);
}

export { setCustomDragImage };

const WeeklyWorkoutCalendar: React.FC<WeeklyWorkoutCalendarProps> = ({ onLoggedWorkoutDrop }) => {
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
  // Add drag-over state
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

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
      <div className="w-full max-w-7xl mx-auto mt-6 mb-10">
        <h2 className="text-3xl font-extrabold text-pink-700 mb-6 flex items-center gap-2">
          <Calendar className="w-7 h-7 text-pink-600" /> Weekly Workout Calendar
        </h2>
        <div className="flex justify-end mb-2">
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
                  {regenerating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                      Regenerating...
                    </>
                  ) : 'Regenerate'}
                </button>
              </div>
            </div>
          </div>
        )}
        {error && <div className="text-center text-red-600 font-semibold mb-4">{error}</div>}
        <div className="w-full">
          <div className="grid grid-cols-7 gap-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 w-full">
                <span className="text-pink-700 font-medium">Loading workout plan...</span>
              </div>
            ) : (
              weekDates.map((date, idx) => {
                const workout = weekWorkouts[date];
                const isToday = date === todayStr;
                return (
                  <div
                    key={date}
                    className={`relative rounded-xl p-3 min-h-[120px] flex flex-col items-start justify-between border shadow-sm transition-all duration-200 bg-white/80 ${isToday ? 'border-pink-500 ring-2 ring-pink-300' : 'border-gray-200'} ${dragOverDate === date ? 'bg-blue-100 border-blue-400 ring-4 ring-blue-400/60' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOverDate(date); autoScrollOnDrag(e); }}
                    onDragLeave={() => setDragOverDate(null)}
                    onDrop={e => {
                      setDragOverDate(null);
                      const workoutStr = e.dataTransfer.getData('application/json');
                      if (workoutStr && onLoggedWorkoutDrop) {
                        try {
                          const loggedWorkout = JSON.parse(workoutStr);
                          onLoggedWorkoutDrop(date, loggedWorkout);
                        } catch {}
                      }
                    }}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-1">{daysOfWeek[idx]}</div>
                    <div className="font-bold text-lg mb-1 truncate w-full">{workout?.details?.workout_type || 'Rest Day'}</div>
                    <div className="text-gray-600 text-xs line-clamp-2 mb-1">{workout?.details?.summary || ''}</div>
                    {workout?.details?.exercises && Array.isArray(workout.details.exercises) && workout.details.exercises.length > 0 && (
                      <ul className="text-xs text-gray-500 list-disc pl-4">
                        {workout.details.exercises.slice(0, 2).map((ex: any, i: number) => (
                          <li key={i}>{ex.name} ({ex.sets}×{ex.reps})</li>
                        ))}
                        {workout.details.exercises.length > 2 && <li>+{workout.details.exercises.length - 2} more…</li>}
                      </ul>
                    )}
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