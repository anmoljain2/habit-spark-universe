import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import FitnessQuestionnaire from '../components/FitnessQuestionnaire';
import { Dumbbell, Target, Timer, TrendingUp, Zap, Award, Play, Calendar, CheckCircle, X } from 'lucide-react';
import axios from 'axios';
import { formatISO, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import QuestionnaireWrapper from '../components/QuestionnaireWrapper';
import { useProfile } from '@/components/ProfileContext';
import WeeklyWorkoutCalendar, { setCustomDragImage } from '../components/WeeklyWorkoutCalendar';
import FitnessGoals from '../components/FitnessGoals';
import { getLocalDateStr } from '@/lib/utils';

// Move EditLoggedWorkoutModal above Fitness so it is defined before use
function EditLoggedWorkoutModal({ workout, onClose, onSave }: { workout: any, onClose: () => void, onSave: (w: any) => void }) {
  const [name, setName] = useState(workout.name || '');
  const [description, setDescription] = useState(workout.description || '');
  const [exercises, setExercises] = useState(workout.details?.exercises || []);
  const [saving, setSaving] = useState(false);
  const handleExerciseChange = (idx: number, key: string, value: string) => {
    setExercises(exs => exs.map((ex, i) => i === idx ? { ...ex, [key]: value } : ex));
  };
  const addExercise = () => setExercises(exs => [...exs, { name: '', sets: '', reps: '', rest: '', notes: '' }]);
  const removeExercise = (idx: number) => setExercises(exs => exs.filter((_, i) => i !== idx));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...workout, name, description, details: { ...workout.details, exercises } });
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg flex flex-col gap-4">
        <h3 className="text-lg font-bold text-blue-700 mb-2">Edit Logged Workout</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Workout Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Exercises</label>
            {exercises.map((ex, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 w-full">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <input type="text" value={ex.name} onChange={e => handleExerciseChange(idx, 'name', e.target.value)} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Exercise name" />
                  <input type="number" min="1" value={ex.sets} onChange={e => handleExerciseChange(idx, 'sets', e.target.value)} className="w-20 border rounded px-2 py-1 min-w-0" placeholder="Sets" />
                  <input type="number" min="1" value={ex.reps} onChange={e => handleExerciseChange(idx, 'reps', e.target.value)} className="w-20 border rounded px-2 py-1 min-w-0" placeholder="Reps" />
                  <input type="text" value={ex.rest} onChange={e => handleExerciseChange(idx, 'rest', e.target.value)} className="w-24 border rounded px-2 py-1 min-w-0" placeholder="Rest" />
                  <input type="text" value={ex.notes} onChange={e => handleExerciseChange(idx, 'notes', e.target.value)} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Notes" />
                </div>
                {exercises.length > 1 && <button type="button" onClick={() => removeExercise(idx)} className="text-red-500 font-bold">&times;</button>}
              </div>
            ))}
            <button type="button" onClick={addExercise} className="text-blue-600 font-semibold mt-1">+ Add Exercise</button>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Fitness = () => {
  const { user } = useAuth();
  const { fitnessGoals, loading: profileLoading, refreshProfile } = useProfile();
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerPhase, setTimerPhase] = useState<'work' | 'rest'>('work');
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const switchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [loggedWorkouts, setLoggedWorkouts] = useState<any[]>([]);
  // Add state for hovered workout
  const [hoveredWorkoutId, setHoveredWorkoutId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean, workout: any | null }>({ open: false, workout: null });
  const calendarRef = useRef<{ refresh: () => void }>(null);
  const [wasManuallyReset, setWasManuallyReset] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean, workout: any | null }>({ open: false, workout: null });

  const getWeekRange = () => {
    const now = new Date();
    return {
      weekStart: formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' }),
      weekEnd: formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' })
    };
  };

  const fetchWorkouts = async () => {
    if (!user) return;
    setWorkoutsLoading(true);
    setError('');
    const { weekStart, weekEnd } = getWeekRange();
    const { data: workouts, error: fetchError } = await supabase
      .from('user_workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd);
    if (fetchError) {
      setError('Failed to fetch workouts: ' + fetchError.message);
    } else {
      setWeeklyWorkouts(workouts || []);
    }
    setWorkoutsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchWorkouts();
    // eslint-disable-next-line
  }, [user]);

  // Detect user's timezone dynamically
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Debug: log todayStr and all workout dates after fetching
  useEffect(() => {
    const today = new Date();
    const todayStr = getLocalDateStr(today, detectedTimezone);
    console.log('[Fitness][DEBUG] Detected timezone:', detectedTimezone);
    console.log('[Fitness][DEBUG] todayStr (local):', todayStr);
    console.log('[Fitness][DEBUG] weeklyWorkouts:', weeklyWorkouts);
    console.log('[Fitness][DEBUG] weeklyWorkouts dates:', weeklyWorkouts.map(w => w.date));
    const found = weeklyWorkouts.find(w => w.date === todayStr);
    console.log('[Fitness][DEBUG] todayWorkout lookup result:', found);
  }, [weeklyWorkouts, detectedTimezone]);

  const generateWorkouts = async (retryCount = 0) => {
    if (!user) return;
    setWorkoutsLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/generate-workout-plan', { user_id: user.id });
      if (res.data && res.data.plan) {
        await fetchWorkouts();
        toast.success('Workout plan generated!');
      } else {
        setError('Failed to generate workout plan.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate workout plan.');
    }
    setWorkoutsLoading(false);
  };

  // Find today's workout using user's local date (YYYY-MM-DD)
  const today = new Date();
  const todayStr = getLocalDateStr(today, detectedTimezone); // Local YYYY-MM-DD
  const todayWorkout = weeklyWorkouts.find(w => w.date === todayStr);
  // Debug: log before rendering main card
  console.log('[Fitness][DEBUG] Rendering main card with todayStr:', todayStr, '| todayWorkout:', todayWorkout);
  // Fallback: if not found, show rest day

  // Build the workout queue: [{ phase: 'work'|'rest', seconds, exerciseIdx, setNum }]
  const buildWorkoutQueue = () => {
    const exercises = todayWorkout?.details?.exercises || [];
    const queue = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const sets = parseInt(ex.sets) || 1;
      const workDuration = parseInt(ex.duration) * 60 || 600; // default 10 min
      const restDuration = ex.rest ? parseInt(ex.rest) * 60 : 60; // default 1 min
      for (let s = 1; s <= sets; s++) {
        queue.push({ phase: 'work', seconds: workDuration, exerciseIdx: i, setNum: s });
        if (s < sets) queue.push({ phase: 'rest', seconds: restDuration, exerciseIdx: i, setNum: s });
      }
      // Rest after last set before next exercise (optional)
      if (i < exercises.length - 1) {
        queue.push({ phase: 'rest', seconds: restDuration, exerciseIdx: i, setNum: sets });
      }
    }
    return queue;
  };

  const [workoutQueue, setWorkoutQueue] = useState<any[]>([]);
  const [queueIdx, setQueueIdx] = useState(0);

  const startTimer = () => {
    const queue = buildWorkoutQueue();
    setWorkoutQueue(queue);
    setQueueIdx(0);
    if (queue.length > 0) {
      setTimerSeconds(queue[0].seconds);
      setTimerPhase(queue[0].phase);
      setCurrentExerciseIdx(queue[0].exerciseIdx);
      setCurrentSet(queue[0].setNum);
      setTimerActive(true);
      setTimerPaused(false);
    }
  };

  useEffect(() => {
    if (timerActive && !timerPaused && timerSeconds > 0) {
      timerInterval.current = setInterval(() => {
        setTimerSeconds((s) => s - 1);
      }, 1000);
    } else if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [timerActive, timerPaused]);

  // Handle phase switching
  useEffect(() => {
    if (!timerActive) return;
    if (timerSeconds === 0) {
      if (queueIdx < workoutQueue.length - 1) {
        // Show switch modal for 1s
        setShowSwitchModal(true);
        switchTimeout.current = setTimeout(() => {
          setShowSwitchModal(false);
          const next = workoutQueue[queueIdx + 1];
          setTimerSeconds(next.seconds);
          setTimerPhase(next.phase);
          setCurrentExerciseIdx(next.exerciseIdx);
          setCurrentSet(next.setNum);
          setQueueIdx(queueIdx + 1);
        }, 1000);
      } else {
        setTimerActive(false);
        setTimerPaused(false);
        setTimerSeconds(0);
        setQueueIdx(0);
        setCurrentExerciseIdx(0);
        setCurrentSet(1);
        setWorkoutQueue([]);
        toast.success('Workout complete!');
      }
    }
    return () => {
      if (switchTimeout.current) clearTimeout(switchTimeout.current);
    };
  }, [timerSeconds, timerActive, queueIdx, workoutQueue]);

  const handlePause = () => setTimerPaused(true);
  const handleResume = () => setTimerPaused(false);
  const handleReset = () => {
    setWasManuallyReset(true);
    setTimerActive(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    setQueueIdx(0);
    setCurrentExerciseIdx(0);
    setCurrentSet(1);
    setWorkoutQueue([]);
  };

  const exercises = todayWorkout?.details?.exercises || [];
  const currentExercise = exercises[currentExerciseIdx] || {};

  // Calculate weekly progress
  const completedWorkouts = weeklyWorkouts.filter(w => w.completed);
  const totalActiveMinutes = completedWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const totalCaloriesBurned = completedWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
  const weeklyStats = [
    { label: "Workouts", current: completedWorkouts.length, target: fitnessGoals?.days_per_week || 5, color: "from-pink-500 to-rose-500" },
    { label: "Active Minutes", current: totalActiveMinutes, target: (fitnessGoals?.days_per_week || 5) * (fitnessGoals?.minutes_per_session || 45), color: "from-purple-500 to-indigo-500" },
    { label: "Calories Burned", current: totalCaloriesBurned, target: (fitnessGoals?.days_per_week || 5) * 300, color: "from-orange-500 to-red-500" },
    { label: "Steps", current: 0, target: 10000, color: "from-green-500 to-emerald-500" } // Placeholder, update if you track steps
  ];

  const upcomingWorkouts = [
    { day: "Tomorrow", workout: "Cardio HIIT", duration: "30 min", intensity: "High" },
    { day: "Friday", workout: "Lower Body", duration: "50 min", intensity: "Medium" },
    { day: "Saturday", workout: "Yoga Flow", duration: "40 min", intensity: "Low" },
    { day: "Sunday", workout: "Full Body", duration: "60 min", intensity: "High" }
  ];

  // Mark today's workout as complete (and update UI)
  const markWorkoutComplete = async () => {
    setTimerActive(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    setQueueIdx(0);
    setCurrentExerciseIdx(0);
    setCurrentSet(1);
    setWorkoutQueue([]);
    if (todayWorkout && todayWorkout.id && !todayWorkout.completed) {
      const { error } = await supabase
        .from('user_workouts')
        .update({ completed: true } as any)
        .eq('id', todayWorkout.id);
      if (!error) {
        toast.success('Workout marked as complete!');
        setWeeklyWorkouts(ws => ws.map(w => w.id === todayWorkout.id ? { ...w, completed: true } : w));
      } else {
        toast.error('Failed to mark workout as complete.');
      }
    }
  };

  // When timer finishes naturally, mark workout complete
  useEffect(() => {
    if (!timerActive && !timerPaused && timerSeconds === 0 && todayWorkout && !todayWorkout.completed) {
      if (!wasManuallyReset) {
        markWorkoutComplete();
      }
    }
    if (!timerActive && timerSeconds === 0 && wasManuallyReset) {
      setWasManuallyReset(false);
    }
    // eslint-disable-next-line
  }, [timerActive, timerPaused, timerSeconds]);

  // Fetch user_logged_workouts for the current user
  useEffect(() => {
    const fetchLoggedWorkouts = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_logged_workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setLoggedWorkouts(data || []);
    };
    if (user) fetchLoggedWorkouts();
  }, [user]);

  // LogWorkout component
  const LogWorkout = ({ userId, onLogged }: { userId: string, onLogged: () => void }) => {
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [workoutType, setWorkoutType] = useState('');
    const [summary, setSummary] = useState('');
    const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', rest: '', notes: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleExerciseChange = (idx: number, key: string, value: string) => {
      setExercises(exs => exs.map((ex, i) => i === idx ? { ...ex, [key]: value } : ex));
    };
    const addExercise = () => setExercises(exs => [...exs, { name: '', sets: '', reps: '', rest: '', notes: '' }]);
    const removeExercise = (idx: number) => setExercises(exs => exs.filter((_, i) => i !== idx));
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      const trimmedWorkoutType = workoutType.trim();
      if (!trimmedWorkoutType) {
        setError('Workout Type is required.');
        setLoading(false);
        return;
      }
      try {
        // Remove any existing workout for this user and date
        await supabase.from('user_workouts').delete().eq('user_id', userId).eq('date', date);
        // Insert new workout into user_workouts
        const { error: insertError } = await supabase.from('user_workouts').insert({
          user_id: userId,
          date,
          details: {
            workout_type: trimmedWorkoutType,
            summary,
            exercises: exercises.filter(ex => ex.name.trim()),
          },
        });
        if (insertError) throw insertError;
        // Insert into user_logged_workouts (for personal library)
        const { error: loggedError } = await supabase.from('user_logged_workouts').insert({
          user_id: userId,
          name: trimmedWorkoutType || 'Custom Workout',
          description: summary,
          details: {
            workout_type: trimmedWorkoutType,
            summary,
            exercises: exercises.filter(ex => ex.name.trim()),
          },
        });
        if (loggedError) {
          toast.error('Failed to log workout to your library: ' + loggedError.message);
          console.error('user_logged_workouts insert error:', loggedError);
          throw loggedError;
        }
        setWorkoutType('');
        setSummary('');
        setExercises([{ name: '', sets: '', reps: '', rest: '', notes: '' }]);
        onLogged();
        await fetchWorkouts(); // Ensure calendar is refreshed immediately
        // Refresh logged workouts list
        if (typeof setLoggedWorkouts === 'function') {
          const { data } = await supabase
            .from('user_logged_workouts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          setLoggedWorkouts(data || []);
        }
        if (calendarRef.current) calendarRef.current.refresh();
      } catch (err: any) {
        setError(err.message || 'Failed to log workout');
      }
      setLoading(false);
    };
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Log Workout</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Day</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Workout Type</label>
            <input type="text" value={workoutType} onChange={e => setWorkoutType(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="e.g. Full Body Strength" />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Summary</label>
            <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Describe the workout..." />
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Exercises</label>
            {exercises.map((ex, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2 w-full">
                <div className="flex flex-col md:flex-row gap-2 w-full">
                  <input type="text" value={ex.name} onChange={e => handleExerciseChange(idx, 'name', e.target.value)} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Exercise name" />
                  <input type="number" min="1" value={ex.sets} onChange={e => handleExerciseChange(idx, 'sets', e.target.value)} className="w-20 border rounded px-2 py-1 min-w-0" placeholder="Sets" />
                  <input type="number" min="1" value={ex.reps} onChange={e => handleExerciseChange(idx, 'reps', e.target.value)} className="w-20 border rounded px-2 py-1 min-w-0" placeholder="Reps" />
                  <input type="text" value={ex.rest} onChange={e => handleExerciseChange(idx, 'rest', e.target.value)} className="w-24 border rounded px-2 py-1 min-w-0" placeholder="Rest" />
                  <input type="text" value={ex.notes} onChange={e => handleExerciseChange(idx, 'notes', e.target.value)} className="flex-1 border rounded px-2 py-1 min-w-0" placeholder="Notes" />
                </div>
                {exercises.length > 1 && <button type="button" onClick={() => removeExercise(idx)} className="text-red-500 font-bold">&times;</button>}
              </div>
            ))}
            <button type="button" onClick={addExercise} className="text-blue-600 font-semibold mt-1">+ Add Exercise</button>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-lg font-bold" disabled={loading}>{loading ? 'Logging...' : 'Log Workout'}</button>
        </form>
      </div>
    );
  };

  // Handler for dropping a logged workout onto a calendar day
  const handleLoggedWorkoutDrop = async (date: string, workout: any) => {
    if (!user) return;
    try {
      // Delete existing workout for that date
      await supabase.from('user_workouts').delete().eq('user_id', user.id).eq('date', date);
      // Insert the logged workout for that date
      const workoutType = workout.details?.workout_type || workout.name || 'Custom Workout';
      const details = {
        ...workout.details,
        workout_type: workoutType,
      };
      await supabase.from('user_workouts').insert({
        user_id: user.id,
        date,
        workout_type: workoutType,
        details,
      });
      toast.success('Replaced workout for ' + date + ' with your logged workout!');
      fetchWorkouts();
      if (calendarRef.current) calendarRef.current.refresh();
    } catch (err) {
      toast.error('Failed to replace workout.');
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (!profileLoading && !fitnessGoals) {
    return (
      <QuestionnaireWrapper>
        <FitnessQuestionnaire userId={user.id} onComplete={refreshProfile} />
      </QuestionnaireWrapper>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-4 py-2 rounded-full border border-pink-200 mb-4">
            <Zap className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-medium text-pink-700">Fitness Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
            Fitness Tracking & Workouts
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your progress, follow personalized workouts, and achieve your fitness goals with data-driven insights.
          </p>
        </div>
        {error && <div className="text-center text-red-600 font-semibold mb-4">{error}</div>}

        {/* Main Content: Today's Workout + Motivation side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-2">
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Workout */}
            <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl p-8 text-white shadow-2xl relative mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{todayWorkout?.details?.workout_type || 'Rest Day'}</h2>
                  <div className="flex items-center gap-4 text-pink-100">
                    <div className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      <span>{todayWorkout?.details?.exercises?.length || 0} exercises</span>
                    </div>
                  </div>
                </div>
                {/* Inline Timer or Start Button */}
                {timerActive ? (
                  <div className="flex flex-col items-center gap-2 w-56">
                    <div className={`text-3xl font-mono w-full text-center py-2 rounded-lg ${timerPhase === 'work' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                      {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
                    </div>
                    <div className="text-center mt-1 font-bold text-lg">
                      {timerPhase === 'work' ? 'Go!' : 'Rest'}
                    </div>
                    <div className="text-center text-sm text-gray-800 mt-1">
                      {currentExercise.name ? `Exercise: ${currentExercise.name}` : ''} {currentSet ? `| Set ${currentSet}` : ''}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {timerPaused ? (
                        <button onClick={handleResume} className="bg-green-500 text-white px-3 py-1 rounded-lg font-medium">Resume</button>
                      ) : (
                        <button onClick={handlePause} className="bg-yellow-400 text-white px-3 py-1 rounded-lg font-medium">Pause</button>
                      )}
                      <button onClick={handleReset} className="bg-gray-300 text-gray-800 px-3 py-1 rounded-lg font-medium">Reset</button>
                    </div>
                    {showSwitchModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className={`rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border-4 border-white/80 animate-pop ${timerPhase === 'work' ? 'bg-red-500' : 'bg-green-500'}` }>
                          <div className="text-6xl mb-4 animate-bounce">{timerPhase === 'work' ? '🏋️‍♂️' : '🛌'}</div>
                          <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 text-center">
                            {timerPhase === 'work' ? 'GO TIME!' : 'REST NOW!'}
                          </h2>
                        </div>
                      </div>
                    )}
                    {/* Finish Workout Button (only during timer) */}
                    {!todayWorkout?.completed && (
                      <button
                        onClick={markWorkoutComplete}
                        className="absolute bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 z-10"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Finish Workout
                      </button>
                    )}
                  </div>
                ) : todayWorkout?.completed ? (
                  <div className="flex flex-col items-center gap-2 w-56">
                    <div className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6" /> Workout Completed
                    </div>
                  </div>
                ) : (
                  <button onClick={startTimer} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-2xl transition-all duration-200 flex items-center gap-2">
                    <Play className="w-6 h-6" />
                    <span className="font-medium">Start Workout</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todayWorkout?.details?.exercises?.length > 0 ? todayWorkout.details.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="p-4 rounded-xl backdrop-blur-sm border transition-all bg-white/10 border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{exercise.name}</h3>
                    </div>
                    <p className="text-pink-100 text-sm">{exercise.sets} sets × {exercise.reps}</p>
                    {exercise.rest && <p className="text-pink-200 text-xs">Rest: {exercise.rest}</p>}
                    {exercise.notes && <p className="text-pink-200 text-xs">{exercise.notes}</p>}
                  </div>
                )) : <div className="text-center text-pink-200">Rest day or no workout scheduled.</div>}
              </div>
            </div>
          </div>
          {/* Daily Motivation and Weekly Progress stacked in right column */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Daily Motivation</h3>
              <div className="text-center">
                <div className="text-4xl mb-3">💪</div>
                <p className="text-gray-700 italic mb-4">"The only bad workout is the one that didn't happen."</p>
                <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2 rounded-xl font-medium text-sm">
                  You're 80% to your weekly goal!
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 w-full">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-600" />
                Weekly Progress
              </h3>
              <div className="space-y-4">
                {weeklyStats.map((stat, index) => {
                  const percentage = (stat.current / stat.target) * 100;
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700">{stat.label}</span>
                        <span className="text-sm text-gray-600">{stat.current}/{stat.target}{stat.label === 'Calories Burned' ? ' kcal' : stat.label === 'Active Minutes' ? ' min' : ''}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${stat.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(percentage)}% complete</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Calendar - full width */}
        <div className="mt-2">
          <WeeklyWorkoutCalendar ref={calendarRef} onLoggedWorkoutDrop={handleLoggedWorkoutDrop} />
        </div>

        {/* Everything else below calendar */}
        <div className="w-full flex flex-col md:flex-row gap-8 mb-10">
          <div className="flex-1 min-w-0 flex flex-col h-full">
            <LogWorkout userId={user.id} onLogged={fetchWorkouts} />
          </div>
          <div className="flex-1 min-w-0 flex flex-col h-full">
            {/* Drag-and-drop instructional message above logged workouts */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-2 mb-3 text-sm font-medium flex items-center gap-2">
              <span role="img" aria-label="drag">🖱️</span>
              Drag and drop your logged workouts onto any day in the calendar to replace the scheduled workout with your own.
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow border border-white/50 mt-2 h-full flex flex-col">
              <h4 className="text-lg font-bold text-gray-800 mb-2">Your Logged Workouts</h4>
              {loggedWorkouts.length === 0 ? (
                <div className="text-gray-500 text-sm">No logged workouts yet.</div>
              ) : (
                <ul className="divide-y divide-gray-200 flex-1">
                  {loggedWorkouts.map((w) => (
                    <li
                      key={w.id}
                      className="py-2 cursor-pointer hover:bg-gray-100 rounded transition-all relative group"
                      onMouseEnter={() => setHoveredWorkoutId(w.id)}
                      onMouseLeave={() => setHoveredWorkoutId(null)}
                      draggable
                      onDragStart={e => {
                        setCustomDragImage(e, w.name);
                        e.dataTransfer.setData('application/json', JSON.stringify(w));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <span className="font-semibold text-gray-800">{w.name}</span>
                      {/* X button appears on hover */}
                      <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 p-1"
                        onClick={e => { e.stopPropagation(); setDeleteModal({ open: true, workout: w }); }}
                        aria-label="Delete workout"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      {/* Edit button - now immediately to the left of X */}
                      <button
                        className="absolute right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 p-1"
                        onClick={e => { e.stopPropagation(); setEditModal({ open: true, workout: w }); }}
                        aria-label="Edit workout"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6-6 3 3-6 6H9v-3z" /></svg>
                      </button>
                      {hoveredWorkoutId === w.id && (
                        <div className="absolute left-48 top-0 z-50 bg-white border border-gray-300 shadow-lg rounded-lg p-4 min-w-[260px] text-sm text-gray-800 whitespace-pre-line">
                          <div className="font-bold text-base mb-1">{w.name}</div>
                          {w.description && <div className="mb-2 text-gray-600">{w.description}</div>}
                          {w.details?.exercises && Array.isArray(w.details.exercises) && w.details.exercises.length > 0 && (
                            <div>
                              <div className="font-semibold mb-1">Exercises:</div>
                              <ul className="list-disc pl-5">
                                {w.details.exercises.map((ex: any, i: number) => (
                                  <li key={i}>{ex.name} ({ex.sets} sets × {ex.reps} reps{ex.rest ? `, rest ${ex.rest}` : ''})</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Move Fitness Goals to the bottom */}
        <div className="mt-12">
          <FitnessGoals />
        </div>
      </div>
      {/* Delete confirmation modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <h3 className="text-lg font-bold text-red-700 mb-2">Delete Workout</h3>
            <p>Are you sure you want to delete <span className="font-semibold">{deleteModal.workout?.name}</span> from your logged workouts? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setDeleteModal({ open: false, workout: null })}>Cancel</button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
                onClick={async () => {
                  if (!deleteModal.workout) return;
                  const { error } = await supabase.from('user_logged_workouts').delete().eq('id', deleteModal.workout.id);
                  if (!error) {
                    setLoggedWorkouts(ws => ws.filter(w => w.id !== deleteModal.workout.id));
                    toast.success('Workout deleted!');
                  } else {
                    toast.error('Failed to delete workout.');
                  }
                  setDeleteModal({ open: false, workout: null });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Workout Modal */}
      {editModal.open && editModal.workout && (
        <EditLoggedWorkoutModal
          workout={editModal.workout}
          onClose={() => setEditModal({ open: false, workout: null })}
          onSave={async (updated) => {
            // Save to Supabase
            try {
              const { error } = await supabase.from('user_logged_workouts').update({
                name: updated.name,
                description: updated.description,
                details: updated.details,
              }).eq('id', updated.id);
              if (error) throw error;
              setLoggedWorkouts(ws => ws.map(w => w.id === updated.id ? { ...w, ...updated } : w));
              toast.success('Workout updated!');
              setEditModal({ open: false, workout: null });
            } catch (err: any) {
              toast.error('Failed to update workout.');
            }
          }}
        />
      )}
    </div>
  );
};

export default Fitness;
