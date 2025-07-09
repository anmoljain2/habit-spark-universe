import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Dumbbell, Heart, Bed, Sparkles, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatISO, startOfWeek } from 'date-fns';
import axios from 'axios';
import { useProfile } from '../components/ProfileContext';
import { toast } from 'sonner';

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

const WeeklyWorkoutCalendar = forwardRef<
  { refresh: () => void },
  WeeklyWorkoutCalendarProps
>(({ onLoggedWorkoutDrop }, ref) => {
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
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [regenDayModal, setRegenDayModal] = useState<{ open: boolean, date: string | null }>({ open: false, date: null });
  const [regenDayFeedback, setRegenDayFeedback] = useState('');
  const [regenDayLoading, setRegenDayLoading] = useState(false);
  // Add state for editing a calendar day
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingToLogged, setSavingToLogged] = useState(false);
  const [showLoggedTooltip, setShowLoggedTooltip] = useState(false);

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
  const fetchCalendar = async () => {
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

  useImperativeHandle(ref, () => ({ refresh: fetchCalendar }), [user]);

  useEffect(() => {
    fetchCalendar();
    // eslint-disable-next-line
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
        {/* Regenerate Day Modal */}
        {regenDayModal.open && regenDayModal.date && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
              <h3 className="text-lg font-bold text-orange-700 mb-2">Regenerate {daysOfWeek[weekDates.indexOf(regenDayModal.date)]} Workout</h3>
              <label className="text-sm text-gray-700 mb-1">Why are you regenerating this day? (Feedback for the AI)</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-orange-500 focus:border-orange-500"
                rows={3}
                value={regenDayFeedback}
                onChange={e => setRegenDayFeedback(e.target.value)}
                placeholder="E.g. I want more cardio, less HIIT, etc."
                disabled={regenDayLoading}
              />
              <div className="flex gap-2 justify-end mt-2">
                <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setRegenDayModal({ open: false, date: null })} disabled={regenDayLoading}>Cancel</button>
                <button
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 flex items-center gap-2"
                  onClick={async () => {
                    if (!user || !regenDayModal.date) return;
                    setRegenDayLoading(true);
                    try {
                      await axios.post('/api/generate-workout-plan', {
                        user_id: user.id,
                        regenerate_feedback: regenDayFeedback,
                        regenerate_date: regenDayModal.date,
                      });
                      await fetchCalendar();
                      setRegenDayModal({ open: false, date: null });
                      setRegenDayFeedback('');
                    } catch (err) {
                      setError('Failed to regenerate day.');
                    }
                    setRegenDayLoading(false);
                  }}
                  disabled={regenDayLoading || !regenDayFeedback.trim()}
                >
                  {regenDayLoading ? 'Regenerating...' : 'Regenerate'}
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
                    onMouseEnter={() => setHoveredDate(date)}
                    onMouseLeave={() => setHoveredDate(null)}
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
                    {/* Tooltip/modal for full workout info */}
                    {hoveredDate === date && workout && (
                      <div className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 bg-white border border-gray-300 shadow-xl rounded-xl p-4 min-w-[260px] max-w-xs text-sm text-gray-800 whitespace-pre-line">
                        <div className="font-bold text-base mb-1">{workout.details?.workout_type || 'Rest Day'}</div>
                        {workout.details?.summary && <div className="mb-2 text-gray-600">{workout.details.summary}</div>}
                        {workout.details?.exercises && Array.isArray(workout.details.exercises) && workout.details.exercises.length > 0 && (
                          <div>
                            <div className="font-semibold mb-1">Exercises:</div>
                            <ul className="list-disc pl-5">
                              {workout.details.exercises.map((ex: any, i: number) => (
                                <li key={i}>{ex.name} ({ex.sets} sets × {ex.reps} reps{ex.rest ? `, rest ${ex.rest}` : ''})</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {editingDate === date ? (
                      <div className="w-full mt-2 bg-white border border-blue-200 rounded-xl p-3 shadow-lg">
                        <form onSubmit={async e => {
                          e.preventDefault();
                          setSavingEdit(true);
                          try {
                            await supabase.from('user_workouts').update({
                              workout_type: editFields.workout_type,
                              details: { ...editFields, workout_type: editFields.workout_type },
                            }).eq('user_id', user.id).eq('date', date);
                            await fetchCalendar();
                            setEditingDate(null);
                            toast.success('Workout updated!');
                          } catch (err) {
                            toast.error('Failed to update workout.');
                          }
                          setSavingEdit(false);
                        }} className="space-y-2">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Workout Type</label>
                            <input type="text" value={editFields.workout_type || ''} onChange={e => setEditFields((f: any) => ({ ...f, workout_type: e.target.value }))} className="w-full border rounded px-2 py-1" required />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Summary</label>
                            <textarea value={editFields.summary || ''} onChange={e => setEditFields((f: any) => ({ ...f, summary: e.target.value }))} className="w-full border rounded px-2 py-1" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Exercises</label>
                            {(editFields.exercises || []).map((ex: any, idx: number) => (
                              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-1 w-full">
                                <input type="text" value={ex.name} onChange={e => setEditFields((f: any) => { const exs = [...(f.exercises || [])]; exs[idx] = { ...exs[idx], name: e.target.value }; return { ...f, exercises: exs }; })} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Exercise name" />
                                <input type="number" min="1" value={ex.sets} onChange={e => setEditFields((f: any) => { const exs = [...(f.exercises || [])]; exs[idx] = { ...exs[idx], sets: e.target.value }; return { ...f, exercises: exs }; })} className="w-16 border rounded px-2 py-1 min-w-0" placeholder="Sets" />
                                <input type="number" min="1" value={ex.reps} onChange={e => setEditFields((f: any) => { const exs = [...(f.exercises || [])]; exs[idx] = { ...exs[idx], reps: e.target.value }; return { ...f, exercises: exs }; })} className="w-16 border rounded px-2 py-1 min-w-0" placeholder="Reps" />
                                <input type="text" value={ex.rest} onChange={e => setEditFields((f: any) => { const exs = [...(f.exercises || [])]; exs[idx] = { ...exs[idx], rest: e.target.value }; return { ...f, exercises: exs }; })} className="w-20 border rounded px-2 py-1 min-w-0" placeholder="Rest" />
                                <input type="text" value={ex.notes} onChange={e => setEditFields((f: any) => { const exs = [...(f.exercises || [])]; exs[idx] = { ...exs[idx], notes: e.target.value }; return { ...f, exercises: exs }; })} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Notes" />
                                {(editFields.exercises || []).length > 1 && <button type="button" onClick={() => setEditFields((f: any) => ({ ...f, exercises: f.exercises.filter((_: any, i: number) => i !== idx) }))} className="text-red-500 font-bold">&times;</button>}
                              </div>
                            ))}
                            <button type="button" onClick={() => setEditFields((f: any) => ({ ...f, exercises: [...(f.exercises || []), { name: '', sets: '', reps: '', rest: '', notes: '' }] }))} className="text-blue-600 font-semibold mt-1">+ Add Exercise</button>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button type="button" className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setEditingDate(null)} disabled={savingEdit || savingToLogged}>Cancel</button>
                            <button type="submit" className="px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save'}</button>
                            <button type="button" className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-pink-600 text-white font-semibold hover:shadow-lg flex items-center gap-1 relative" onClick={async () => {
                              setSavingToLogged(true);
                              try {
                                await supabase.from('user_logged_workouts').insert({
                                  user_id: user.id,
                                  name: editFields.workout_type || 'Custom Workout',
                                  description: editFields.summary,
                                  details: { ...editFields, workout_type: editFields.workout_type },
                                });
                                setShowLoggedTooltip(true);
                                setTimeout(() => setShowLoggedTooltip(false), 2000);
                                toast.success('Saved to logged workouts!');
                              } catch (err) {
                                toast.error('Failed to save to logged workouts.');
                              }
                              setSavingToLogged(false);
                            }} disabled={savingEdit || savingToLogged} onMouseEnter={() => setShowLoggedTooltip(true)} onMouseLeave={() => setShowLoggedTooltip(false)}>
                              {savingToLogged ? (
                                <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                              ) : (
                                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                              )}
                              Save to Logged Workouts
                              {showLoggedTooltip && (
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 z-50">Save to your logged workouts</span>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <button
                            className={`absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-pink-600 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow-lg transition-all flex items-center gap-1 z-10 ${regenDayLoading && regenDayModal.date === date ? 'opacity-70 cursor-not-allowed' : ''}`}
                            onClick={e => { e.stopPropagation(); setRegenDayModal({ open: true, date }); setRegenDayFeedback(''); }}
                            disabled={regenerating || (regenDayLoading && regenDayModal.date === date)}
                            title="Regenerate Workout"
                          >
                            {regenDayLoading && regenDayModal.date === date ? (
                              <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                            ) : (
                              <>
                                <span className="sr-only">Regenerate Workout</span>
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 1 1 19.364 5.636" /></svg>
                              </>
                            )}
                            <span>Regenerate</span>
                          </button>
                        </div>
                        <button className="absolute bottom-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold hover:bg-blue-200 z-10" onClick={e => { e.stopPropagation(); setEditingDate(date); setEditFields({ ...(workout?.details || {}), exercises: Array.isArray(workout?.details?.exercises) ? workout.details.exercises : [] }); }}>Edit</button>
                      </>
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
});

export default WeeklyWorkoutCalendar; 