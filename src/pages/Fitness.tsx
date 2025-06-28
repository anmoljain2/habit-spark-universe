import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import FitnessQuestionnaire from '../components/FitnessQuestionnaire';
import { Dumbbell, Target, Timer, TrendingUp, Zap, Award, Play, Calendar } from 'lucide-react';

const Fitness = () => {
  const { user } = useAuth();
  const [fitnessGoals, setFitnessGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setFitnessGoals(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (!fitnessGoals) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-4">
              Set Your Fitness Goals
            </h1>
            <p className="text-xl text-gray-600">
              Let's create a personalized workout plan to help you achieve your fitness dreams
            </p>
          </div>
          <FitnessQuestionnaire userId={user.id} onComplete={setFitnessGoals} />
        </div>
      </div>
    );
  }

  const todaysWorkout = {
    name: "Upper Body Strength",
    duration: "45 min",
    exercises: [
      { name: "Push-ups", sets: 3, reps: "12-15", status: "completed" },
      { name: "Pull-ups", sets: 3, reps: "8-10", status: "current" },
      { name: "Dumbbell Press", sets: 3, reps: "10-12", status: "pending" },
      { name: "Plank", sets: 3, reps: "30s", status: "pending" }
    ]
  };

  const weeklyStats = [
    { label: "Workouts", current: 4, target: 5, color: "from-pink-500 to-rose-500" },
    { label: "Active Minutes", current: 180, target: 300, color: "from-purple-500 to-indigo-500" },
    { label: "Calories Burned", current: 1250, target: 2000, color: "from-orange-500 to-red-500" },
    { label: "Steps", current: 8500, target: 10000, color: "from-green-500 to-emerald-500" }
  ];

  const upcomingWorkouts = [
    { day: "Tomorrow", workout: "Cardio HIIT", duration: "30 min", intensity: "High" },
    { day: "Friday", workout: "Lower Body", duration: "50 min", intensity: "Medium" },
    { day: "Saturday", workout: "Yoga Flow", duration: "40 min", intensity: "Low" },
    { day: "Sunday", workout: "Full Body", duration: "60 min", intensity: "High" }
  ];

  const achievements = [
    { title: "7-Day Streak", icon: "🔥", unlocked: true },
    { title: "First 5K", icon: "🏃‍♂️", unlocked: true },
    { title: "Strength Master", icon: "💪", unlocked: false },
    { title: "Consistency King", icon: "👑", unlocked: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50/30 to-rose-50/50">
      <Navbar />
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Workout */}
            <div className="bg-gradient-to-br from-pink-600 to-rose-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{todaysWorkout.name}</h2>
                  <div className="flex items-center gap-4 text-pink-100">
                    <div className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      <span>{todaysWorkout.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>{todaysWorkout.exercises.length} exercises</span>
                    </div>
                  </div>
                </div>
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-2xl transition-all duration-200 flex items-center gap-2">
                  <Play className="w-6 h-6" />
                  <span className="font-medium">Start Workout</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaysWorkout.exercises.map((exercise, index) => (
                  <div key={index} className={`p-4 rounded-xl backdrop-blur-sm border transition-all ${
                    exercise.status === 'completed' 
                      ? 'bg-green-500/20 border-green-300/30' 
                      : exercise.status === 'current'
                      ? 'bg-yellow-400/20 border-yellow-300/30'
                      : 'bg-white/10 border-white/20'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{exercise.name}</h3>
                      {exercise.status === 'completed' && (
                        <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                          <span className="text-green-900 text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-pink-100 text-sm">{exercise.sets} sets × {exercise.reps}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-pink-600" />
                  This Week's Schedule
                </h2>
                <button className="bg-gradient-to-r from-pink-600 to-rose-600 text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all">
                  Customize Plan
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingWorkouts.map((workout, index) => (
                  <div key={index} className="p-4 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{workout.day}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workout.intensity === 'High' ? 'bg-red-100 text-red-700' :
                        workout.intensity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {workout.intensity}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-800 mb-1">{workout.workout}</h4>
                    <p className="text-gray-600 text-sm flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {workout.duration}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-pink-600" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className={`text-center p-4 rounded-xl transition-all ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                      : 'bg-gray-50 border-2 border-gray-200 opacity-60'
                  }`}>
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <h3 className="font-semibold text-gray-800 text-sm">{achievement.title}</h3>
                    {achievement.unlocked && (
                      <div className="text-xs text-yellow-600 font-medium mt-1">Unlocked!</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Progress */}
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
                        <span className="text-sm text-gray-600">{stat.current}/{stat.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`bg-gradient-to-r ${stat.color} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{Math.round(percentage)}% complete</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  📊 Log Workout
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  🎯 Set New Goal
                </button>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl font-medium transition-all text-left">
                  📱 Start Timer
                </button>
              </div>
            </div>

            {/* Motivation */}
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
      </div>
    </div>
  );
};

export default Fitness;
