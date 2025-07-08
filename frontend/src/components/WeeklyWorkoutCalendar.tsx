import React, { useEffect, useState } from 'react';
import { Dumbbell, Heart, Bed, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatISO, startOfWeek } from 'date-fns';
import axios from 'axios';

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
  const [loading, setLoading] = useState(true);
  const [weekWorkouts, setWeekWorkouts] = useState<any>({});
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

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

  // Regenerate week plan
  const handleRegenerate = async () => {
    if (!user) return;
    setRegenerating(true);
    setError('');
    try {
      await axios.post('/api/generate-workout-plan', { user_id: user.id });
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
  };

  return (
    <div className="w-full px-2 md:px-8 py-10 flex justify-center">
      <div className="w-full max-w-7xl bg-white/90 rounded-3xl shadow-2xl border border-white/60 px-2 md:px-8 py-8">
        <h2 className="text-3xl font-bold text-pink-700 mb-8 flex items-center gap-2">
          <span>📅</span> This Week&apos;s Workout Calendar
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
        {error && <div className="text-center text-red-600 font-semibold mb-4">{error}</div>}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="flex gap-4 min-w-[900px]">
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
                const color = workoutColors[type] || 'from-gray-200 to-gray-400';
                const isToday = dateStr === todayStr;
                return (
                  <div
                    key={dateStr}
                    className={`flex flex-col items-center rounded-2xl shadow-lg p-5 md:p-6 min-h-[420px] w-[220px] md:w-[180px] bg-gradient-to-b ${color} text-white relative ${isToday ? 'ring-4 ring-pink-300' : ''}`}
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="text-3xl mb-2"><Icon /></div>
                      <div className="font-bold text-lg mb-1">{dayName}</div>
                      <div className="text-sm font-semibold mb-2">{type}</div>
                    </div>
                    <div className="flex-1 w-full flex flex-col gap-4">
                      <div className="text-base font-medium mb-2">{workout?.details?.summary || ''}</div>
                      <ul className="text-sm space-y-2">
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