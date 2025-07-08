import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import FitnessQuestionnaire from '../components/FitnessQuestionnaire';
import { Dumbbell, Target, Timer, TrendingUp, Zap, Award, Play, Calendar, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { formatISO, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import QuestionnaireWrapper from '../components/QuestionnaireWrapper';
import { useProfile } from '@/components/ProfileContext';
import WeeklyWorkoutCalendar from '../components/WeeklyWorkoutCalendar';
import FitnessGoals from '../components/FitnessGoals';

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
      .gte('week_start', weekStart)
      .lte('week_start', weekEnd);
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

  const handleRegenerate = async () => {
    if (!user) return;
    setRegenerating(true);
    setError('');
    const { weekStart, weekEnd } = getWeekRange();
    // Delete existing workouts for the week
    await supabase
      .from('user_workouts')
      .delete()
      .eq('user_id', user.id)
      .gte('week_start', weekStart)
      .lte('week_start', weekEnd);
    await fetchWorkouts();
    setRegenerating(false);
  };

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

  // Find today's workout
  const today = new Date();
  const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const todayWorkout = weeklyWorkouts.find(w => w.details && w.details.day && w.details.day.toLowerCase().includes(todayName.toLowerCase()));

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
      markWorkoutComplete();
    }
    // eslint-disable-next-line
  }, [timerActive, timerPaused, timerSeconds]);

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
      try {
        // Remove any existing workout for this user and date
        await supabase.from('user_workouts').delete().eq('user_id', userId).eq('date', date);
        // Insert new workout
        const { error: insertError } = await supabase.from('user_workouts').insert({
          user_id: userId,
          date,
          details: {
            workout_type: workoutType,
            summary,
            exercises: exercises.filter(ex => ex.name.trim()),
          },
        });
        if (insertError) throw insertError;
        setWorkoutType('');
        setSummary('');
        setExercises([{ name: '', sets: '', reps: '', rest: '', notes: '' }]);
        onLogged();
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
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2">
                <input type="text" value={ex.name} onChange={e => handleExerciseChange(idx, 'name', e.target.value)} className="flex-1 border rounded px-2 py-1" placeholder="Exercise name" />
                <input type="number" min="1" value={ex.sets} onChange={e => handleExerciseChange(idx, 'sets', e.target.value)} className="w-20 border rounded px-2 py-1" placeholder="Sets" />
                <input type="number" min="1" value={ex.reps} onChange={e => handleExerciseChange(idx, 'reps', e.target.value)} className="w-20 border rounded px-2 py-1" placeholder="Reps" />
                <input type="text" value={ex.rest} onChange={e => handleExerciseChange(idx, 'rest', e.target.value)} className="w-24 border rounded px-2 py-1" placeholder="Rest" />
                <input type="text" value={ex.notes} onChange={e => handleExerciseChange(idx, 'notes', e.target.value)} className="flex-1 border rounded px-2 py-1" placeholder="Notes" />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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
          {/* Daily Motivation next to Today's Workout */}
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
          </div>
        </div>

        {/* Regenerate Plan button above calendar */}
        <div className="flex justify-end mb-4">
          {weeklyWorkouts.length === 0 ? (
            <button
              onClick={() => generateWorkouts()}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
              disabled={workoutsLoading}
            >
              {workoutsLoading ? 'Generating...' : 'Generate Plan'}
            </button>
          ) : (
            <button
              onClick={handleRegenerate}
              className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
              disabled={regenerating || workoutsLoading}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate Plan'}
            </button>
          )}
        </div>

        {/* Weekly Schedule Calendar - full width */}
        <WeeklyWorkoutCalendar />

        {/* Everything else below calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Sidebar: LogWorkout and Weekly Progress only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <LogWorkout userId={user.id} onLogged={fetchWorkouts} />
              </div>
              <div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
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
          </div>
        </div>

        {/* Move Fitness Goals to the bottom */}
        <div className="mt-12">
          <FitnessGoals />
        </div>
      </div>
    </div>
  );
};

export default Fitness;
