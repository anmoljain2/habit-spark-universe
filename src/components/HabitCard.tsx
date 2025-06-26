import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Circle, Star, Flame } from 'lucide-react';

interface HabitCardProps {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  streak: number;
  completed: boolean;
  xpReward: number;
  description?: string;
  onXPChange?: () => void;
}

const HabitCard = ({ id, name, difficulty, streak, completed, xpReward, description, onXPChange }: HabitCardProps) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(completed);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showAllCompletePopup, setShowAllCompletePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800'
  };

  const handleToggleComplete = async () => {
    if (!user) return;
    setLoading(true);
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    if (newCompleted) setShowCelebration(true);
    await supabase
      .from('user_habits')
      .update({ completed_today: newCompleted })
      .eq('id', id);
    // Increment streak if marking as complete
    if (newCompleted) {
      // Get current streak
      const { data: habitRow } = await supabase
        .from('user_habits')
        .select('streak')
        .eq('id', id)
        .maybeSingle();
      const currentStreak = habitRow && typeof habitRow.streak === 'number' ? habitRow.streak : 0;
      await supabase
        .from('user_habits')
        .update({ streak: currentStreak + 1 })
        .eq('id', id);
    }
    // Fetch current XP
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp, streak')
      .eq('id', user.id)
      .single();
    if (!profileError && profile && newCompleted) {
      const newXP = (profile.total_xp || 0) + xpReward;
      const newLevel = 1 + Math.floor(newXP / 1000);
      await supabase
        .from('profiles')
        .update({ total_xp: newXP, level: newLevel })
        .eq('id', user.id);
    }
    // Fetch all habits for today
    const { data: allHabits, error: habitsError } = await supabase
      .from('user_habits')
      .select('completed_today')
      .eq('user_id', user.id);
    if (!habitsError && allHabits && allHabits.length > 0) {
      // Calculate and update habits_completed_percent
      const completedCount = allHabits.filter(h => h.completed_today === true).length;
      const percent = Math.round((completedCount / allHabits.length) * 100);
      await supabase
        .from('profiles')
        .update({ habits_completed_percent: percent })
        .eq('id', user.id);
      // Update streak if all completed (only when marking complete)
      const allCompleted = allHabits.every(h => h.completed_today === true);
      if (allCompleted && profile && newCompleted) {
        await supabase
          .from('profiles')
          .update({ streak: (profile.streak || 0) + 1 })
          .eq('id', user.id);
        // Show all complete popup
        setShowAllCompletePopup(true);
        setTimeout(() => setShowAllCompletePopup(false), 2000);
      }
      // Check and unlock achievements
      await checkAndUnlockAchievements(profile, allHabits, newCompleted);
    }
    if (onXPChange) onXPChange();
    setTimeout(() => setShowCelebration(false), 2000);
    setLoading(false);
  };

  const checkAndUnlockAchievements = async (profile: any, allHabits: any[], newCompleted: boolean) => {
    if (!user) return;
    // Fetch all achievements for this user
    const { data: userAchievements } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id);
    const unlocked = (key: string) => userAchievements?.some((a: any) => a.achievement_key === key && a.unlocked);
    // 1. First Steps: Complete your first habit
    if (newCompleted && allHabits.filter(h => h.completed_today === true).length === 1 && !unlocked('first_steps')) {
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_key: 'first_steps', unlocked: true, unlocked_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_key' });
    }
    // 2. Streak Starter: Achieve a 3-day streak
    if ((profile.streak || 0) + (newCompleted ? 1 : 0) >= 3 && !unlocked('streak_starter')) {
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_key: 'streak_starter', unlocked: true, unlocked_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_key' });
    }
    // 3. Consistency King: Complete all habits for 7 days in a row
    if ((profile.streak || 0) + (newCompleted ? 1 : 0) >= 7 && !unlocked('consistency_king')) {
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_key: 'consistency_king', unlocked: true, unlocked_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_key' });
    }
    // 4. Habit Collector: Add 5 different habits
    if (allHabits.length >= 5 && !unlocked('habit_collector')) {
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_key: 'habit_collector', unlocked: true, unlocked_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_key' });
    }
    // 5. Level Up: Reach Level 5
    if ((profile.level || 1) >= 5 && !unlocked('level_up')) {
      await supabase.from('achievements').upsert([
        { user_id: user.id, achievement_key: 'level_up', unlocked: true, unlocked_at: new Date().toISOString() }
      ], { onConflict: 'user_id,achievement_key' });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 relative overflow-hidden">
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 flex items-center justify-center animate-pulse z-10">
          <div className="text-4xl animate-bounce">🎉</div>
        </div>
      )}
      {showAllCompletePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gradient-to-br from-yellow-300 via-pink-300 to-indigo-400 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border-4 border-white/80 animate-pop">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 text-center">CONGRATS ON A PRODUCTIVE DAY</h2>
            <p className="text-lg text-white/90 font-semibold text-center mb-2">You completed all your habits! Keep up the momentum! 🚀</p>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
          {description && <p className="text-gray-600 text-sm mb-2">{description}</p>}
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
            <div className="flex items-center text-gray-600">
              <Flame className="w-4 h-4 text-orange-500 mr-1" />
              <span className="text-sm">{streak} day streak</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleComplete}
          className={`transition-all duration-300 ${
            isCompleted
              ? 'text-green-500 scale-110'
              : 'text-gray-400 hover:text-green-500 hover:scale-110'
          }`}
          disabled={loading}
        >
          {isCompleted ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <Circle className="w-8 h-8" />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-purple-600">
          <Star className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+{xpReward} XP</span>
        </div>
        
        {isCompleted && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
            Completed! 🎉
          </span>
        )}
      </div>
    </div>
  );
};

export default HabitCard;
