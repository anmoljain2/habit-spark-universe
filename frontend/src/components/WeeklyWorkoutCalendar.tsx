import React from 'react';
import { Dumbbell, Heart, Bed, Sparkles } from 'lucide-react';

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

const WeeklyWorkoutCalendar: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-10 mb-10">
      <h2 className="text-3xl font-bold text-pink-700 mb-6 flex items-center gap-2">
        <span>📅</span> This Week&apos;s Workout Calendar
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekData.map((day, idx) => {
          const Icon = workoutIcons[day.type] || Dumbbell;
          const color = workoutColors[day.type] || 'from-gray-200 to-gray-400';
          return (
            <div
              key={day.day}
              className={`flex flex-col items-center rounded-2xl shadow-lg p-6 min-h-[480px] bg-gradient-to-b ${color} text-white relative`}
            >
              <div className="flex flex-col items-center mb-6">
                <div className="text-3xl mb-2"><Icon /></div>
                <div className="font-bold text-lg mb-1">{day.day}</div>
                <div className="text-sm font-semibold mb-2">{day.type}</div>
              </div>
              <div className="flex-1 w-full flex flex-col gap-4">
                <div className="text-base font-medium mb-2">{day.summary}</div>
                <ul className="text-sm space-y-2">
                  {day.details.map((item: string, i: number) => (
                    <li key={i} className="leading-relaxed">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyWorkoutCalendar; 