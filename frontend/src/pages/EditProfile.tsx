import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Pencil, Plus } from 'lucide-react';

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [visibility, setVisibility] = useState('public');
  // State for all sections
  const [habits, setHabits] = useState<any[]>([]);
  const [newsPreferences, setNewsPreferences] = useState<any>(null);
  const [nutritionPreferences, setNutritionPreferences] = useState<any>(null);
  const [fitnessGoals, setFitnessGoals] = useState<any>(null);
  const [financialProfile, setFinancialProfile] = useState<any>(null);
  const [journalQuestions, setJournalQuestions] = useState<string[]>([]);
  // Habits form state
  const [habitForm, setHabitForm] = useState({
    id: '',
    name: '',
    type: 'positive',
    frequency: 'daily',
    difficulty: 'easy',
  });
  const [editingHabitIndex, setEditingHabitIndex] = useState<number | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  // News Preferences form state
  const [newsInterests, setNewsInterests] = useState<string[]>([]);
  const [newsFrequency, setNewsFrequency] = useState('daily');
  const [newsPreferredTime, setNewsPreferredTime] = useState('');
  const [newsFormat, setNewsFormat] = useState('headlines');
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Low-Fat', 'Low-Sugar', 'Keto', 'Paleo', 'Halal', 'Kosher', 'Other'
  ];
  // Nutrition Preferences form state
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [sugar, setSugar] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [nutritionNotes, setNutritionNotes] = useState('');
  // Fitness Goals form state
  const [fitnessGoalType, setFitnessGoalType] = useState('');
  const [fitnessTargetWeight, setFitnessTargetWeight] = useState('');
  const [fitnessCurrentWeight, setFitnessCurrentWeight] = useState('');
  const [fitnessNotes, setFitnessNotes] = useState('');
  const [fitnessHeight, setFitnessHeight] = useState('');
  const [fitnessStartDate, setFitnessStartDate] = useState('');
  const [fitnessEndDate, setFitnessEndDate] = useState('');
  // New fitness preferences state
  const [fitnessDaysPerWeek, setFitnessDaysPerWeek] = useState('');
  const [fitnessMinutesPerSession, setFitnessMinutesPerSession] = useState('');
  const [fitnessIntensity, setFitnessIntensity] = useState('moderate');
  const [fitnessCardioPreferences, setFitnessCardioPreferences] = useState<string[]>([]);
  const [fitnessMuscleFocus, setFitnessMuscleFocus] = useState<string[]>([]);
  const [fitnessEquipmentAvailable, setFitnessEquipmentAvailable] = useState<string[]>([]);
  const [fitnessInjuryLimitations, setFitnessInjuryLimitations] = useState('');
  const [fitnessPreferredTimeOfDay, setFitnessPreferredTimeOfDay] = useState('any');
  // Financial Profile form state
  const [netWorth, setNetWorth] = useState('');
  const [totalAssets, setTotalAssets] = useState('');
  const [totalLiabilities, setTotalLiabilities] = useState('');
  const [savingsBalance, setSavingsBalance] = useState('');
  const [investmentValue, setInvestmentValue] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [spendingCategories, setSpendingCategories] = useState([{ category: '', percent: '' }]);
  const [budgetingMethod, setBudgetingMethod] = useState('');
  const [financialGoals, setFinancialGoals] = useState([{ goal: '', target: '', by: '' }]);
  const [riskTolerance, setRiskTolerance] = useState('');
  const [emergencyFundStatus, setEmergencyFundStatus] = useState('');
  const [financeNotes, setFinanceNotes] = useState('');
  // Journal Questions form state
  const QUESTION_KEYS = [
    'q_grateful',
    'q_highlight',
    'q_challenged',
    'q_selfcare',
    'q_learned',
    'q_goals',
    'q_feeling',
    'q_letgo',
    'q_smile',
    'q_improve',
  ];
  const COMMON_JOURNAL_QUESTIONS = [
    'What are you grateful for today?',
    'What was the highlight of your day?',
    'What challenged you today?',
    'How did you take care of yourself today?',
    'What did you learn today?',
    'What are your goals for tomorrow?',
    'How are you feeling right now?',
    'What is something you want to let go of?',
    'What made you smile today?',
    'What is one thing you could improve on?'
  ];
  const [selectedJournalQuestions, setSelectedJournalQuestions] = useState<string[]>([]);

  const availableNewsInterests = [
    'Health & Fitness', 'Technology', 'Science', 'Business', 'Personal Development', 'Productivity', 'Mental Health', 'Nutrition', 'Sports', 'Environment', 'Finance', 'Education', 'Psychology', 'Mindfulness', 'Career Growth'
  ];
  const newsFormatOptions = [
    { value: 'headlines', label: 'Headlines' },
    { value: 'summaries', label: 'Summaries' },
    { value: 'deep_dive', label: 'Deep Dive' },
  ];
  const newsFrequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'every_other_day', label: 'Every Other Day' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi_weekly', label: 'Bi-weekly' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      // Fetch user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);
      setDisplayName(profileData?.display_name || '');
      setUsername(profileData?.username || '');
      setEmail(user.email || '');
      setAvatarUrl('');
      setBio(profileData?.bio || '');
      setVisibility(profileData?.profile_visibility || 'public');
      // Fetch habits
      const { data: habitsData } = await supabase
        .from('user_habits')
        .select('*')
        .eq('user_id', user.id);
      setHabits(habitsData || []);
      // Fetch news preferences
      const { data: newsData } = await supabase
        .from('user_news_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setNewsPreferences(newsData);
      setNewsInterests(newsData?.interests || []);
      setNewsFrequency(newsData?.frequency || 'daily');
      setNewsPreferredTime(newsData?.preferred_time || '');
      setNewsFormat(newsData?.format || 'headlines');
      // Fetch nutrition preferences
      const { data: nutritionData } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setNutritionPreferences(nutritionData);
      setCalories(nutritionData?.calories_target?.toString() || '');
      setProtein(nutritionData?.protein_target?.toString() || '');
      setCarbs(nutritionData?.carbs_target?.toString() || '');
      setFat(nutritionData?.fat_target?.toString() || '');
      setFiber(nutritionData?.fiber_target?.toString() || '');
      setSodium(nutritionData?.sodium_limit?.toString() || '');
      setSugar(nutritionData?.sugar_limit?.toString() || '');
      setDietary(nutritionData?.dietary_restrictions || []);
      setAllergies((nutritionData?.allergies || []).join(', '));
      setNutritionNotes(nutritionData?.notes || '');
      // Fetch fitness goals
      const { data: fitnessData } = await supabase
        .from('user_fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setFitnessGoals(fitnessData);
      setFitnessGoalType(fitnessData?.goal_type || '');
      setFitnessTargetWeight(fitnessData?.target_weight?.toString() || '');
      setFitnessCurrentWeight(fitnessData?.current_weight?.toString() || '');
      setFitnessNotes(fitnessData?.notes || '');
      setFitnessHeight(fitnessData?.height?.toString() || '');
      setFitnessStartDate(fitnessData?.start_date || '');
      setFitnessEndDate(fitnessData?.end_date || '');
      setFitnessDaysPerWeek(fitnessData?.days_per_week?.toString() || '');
      setFitnessMinutesPerSession(fitnessData?.minutes_per_session?.toString() || '');
      setFitnessIntensity(fitnessData?.intensity || 'moderate');
      setFitnessCardioPreferences(fitnessData?.cardio_preferences || []);
      setFitnessMuscleFocus(fitnessData?.muscle_focus || []);
      setFitnessEquipmentAvailable(fitnessData?.equipment_available || []);
      setFitnessInjuryLimitations(fitnessData?.injury_limitations || '');
      setFitnessPreferredTimeOfDay(fitnessData?.preferred_time_of_day || 'any');
      // Fetch financial profile
      const { data: financialData } = await supabase
        .from('financial_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setFinancialProfile(financialData);
      setNetWorth(financialData?.net_worth?.toString() || '');
      setTotalAssets(financialData?.total_assets?.toString() || '');
      setTotalLiabilities(financialData?.total_liabilities?.toString() || '');
      setSavingsBalance(financialData?.savings_balance?.toString() || '');
      setInvestmentValue(financialData?.investment_value?.toString() || '');
      setMonthlyIncome(financialData?.monthly_income?.toString() || '');
      setMonthlyExpenses(financialData?.monthly_expenses?.toString() || '');
      let categories = [{ category: '', percent: '' }];
      if (financialData?.spending_habits) {
        let parsed: any = financialData.spending_habits;
        if (typeof parsed === 'string') {
          try {
            parsed = JSON.parse(parsed);
          } catch {}
        }
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.categories)) {
          categories = parsed.categories.filter((c: any) => typeof c === 'object' && 'category' in c && 'percent' in c);
        }
      }
      setSpendingCategories(categories);
      let goals = [{ goal: '', target: '', by: '' }];
      if (Array.isArray(financialData?.financial_goals)) {
        const arr = (financialData.financial_goals as any[]).filter(
          (g): g is { goal: string; target: string; by: string } =>
            typeof g === 'object' &&
            g !== null &&
            typeof g.goal === 'string' &&
            typeof g.target === 'string' &&
            typeof g.by === 'string'
        );
        if (arr.length > 0) goals = arr;
      }
      setFinancialGoals(goals);
      setRiskTolerance(financialData?.risk_tolerance || '');
      setEmergencyFundStatus(financialData?.emergency_fund_status || '');
      setFinanceNotes(financialData?.notes || '');
      // Fetch journal questions
      const { data: journalConfig } = await supabase
        .from('journal_config')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (journalConfig) {
        const selected: string[] = [];
        QUESTION_KEYS.forEach((key, i) => {
          if (journalConfig[key]) selected.push(COMMON_JOURNAL_QUESTIONS[i]);
        });
        setSelectedJournalQuestions(selected);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await Promise.all([
        supabase.from('user_profiles').update({
          display_name: displayName,
          username,
          bio,
          profile_visibility: visibility,
        }).eq('user_id', user.id),
        supabase.from('user_news_preferences').upsert({
          user_id: user.id,
          interests: newsInterests,
          frequency: newsFrequency,
          preferred_time: newsPreferredTime,
          format: newsFormat,
        }, { onConflict: 'user_id' }),
        supabase.from('user_nutrition_preferences').upsert({
          user_id: user.id,
          calories_target: calories ? parseInt(calories, 10) : null,
          protein_target: protein ? parseInt(protein, 10) : null,
          carbs_target: carbs ? parseInt(carbs, 10) : null,
          fat_target: fat ? parseInt(fat, 10) : null,
          fiber_target: fiber ? parseInt(fiber, 10) : null,
          sodium_limit: sodium ? parseInt(sodium, 10) : null,
          sugar_limit: sugar ? parseInt(sugar, 10) : null,
          dietary_restrictions: dietary,
          allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
          notes: nutritionNotes,
        }, { onConflict: 'user_id' }),
        supabase.from('user_fitness_goals').upsert({
          user_id: user.id,
          goal_type: fitnessGoalType,
          target_weight: fitnessTargetWeight ? parseFloat(fitnessTargetWeight) : null,
          current_weight: fitnessCurrentWeight ? parseFloat(fitnessCurrentWeight) : null,
          height: fitnessHeight ? parseFloat(fitnessHeight) : null,
          start_date: fitnessStartDate || null,
          end_date: fitnessEndDate || null,
          notes: fitnessNotes,
          days_per_week: fitnessDaysPerWeek ? parseInt(fitnessDaysPerWeek, 10) : null,
          minutes_per_session: fitnessMinutesPerSession ? parseInt(fitnessMinutesPerSession, 10) : null,
          intensity: fitnessIntensity,
          cardio_preferences: fitnessCardioPreferences,
          muscle_focus: fitnessMuscleFocus,
          equipment_available: fitnessEquipmentAvailable,
          injury_limitations: fitnessInjuryLimitations,
          preferred_time_of_day: fitnessPreferredTimeOfDay,
        }, { onConflict: 'user_id' }),
        supabase.from('financial_profiles').upsert({
          user_id: user.id,
          net_worth: netWorth ? parseFloat(netWorth) : null,
          total_assets: totalAssets ? parseFloat(totalAssets) : null,
          total_liabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
          savings_balance: savingsBalance ? parseFloat(savingsBalance) : null,
          investment_value: investmentValue ? parseFloat(investmentValue) : null,
          monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
          monthly_expenses: monthlyExpenses ? parseFloat(monthlyExpenses) : null,
          spending_habits: { categories: spendingCategories },
          preferred_budgeting: budgetingMethod,
          financial_goals: financialGoals,
          risk_tolerance: riskTolerance,
          emergency_fund_status: emergencyFundStatus,
          notes: financeNotes,
        }, { onConflict: 'user_id' }),
        (async () => {
          const row: any = { user_id: user.id };
          QUESTION_KEYS.forEach((key, i) => {
            row[key] = selectedJournalQuestions.includes(COMMON_JOURNAL_QUESTIONS[i]);
          });
          await supabase.from('journal_config').upsert(row, { onConflict: 'user_id' });
        })(),
      ]);
      setSaving(false);
      navigate('/profile');
    } catch (err) {
      setSaving(false);
      // Optionally show error toast
      alert('Failed to save profile. Please try again.');
    }
  };

  const resetHabitForm = () => setHabitForm({ id: '', name: '', type: 'positive', frequency: 'daily', difficulty: 'easy' });

  const handleHabitEdit = (index: number) => {
    const h = habits[index];
    setHabitForm({
      id: h.id,
      name: h.habit_name,
      type: h.habit_type || 'positive',
      frequency: h.frequency,
      difficulty: h.difficulty,
    });
    setEditingHabitIndex(index);
    setShowHabitForm(true);
  };
  const handleHabitDelete = async (id: string) => {
    await supabase.from('user_habits').delete().eq('id', id);
    setHabits(habits.filter(h => h.id !== id));
  };
  const handleHabitAdd = () => {
    resetHabitForm();
    setEditingHabitIndex(null);
    setShowHabitForm(true);
  };
  const handleHabitFormChange = (field: string, value: string) => {
    setHabitForm(prev => ({ ...prev, [field]: value }));
  };
  const handleHabitFormSave = async () => {
    if (!habitForm.name.trim()) return;
    if (editingHabitIndex !== null) {
      // Update existing
      const updated = { ...habits[editingHabitIndex],
        habit_name: habitForm.name,
        habit_type: habitForm.type,
        frequency: habitForm.frequency,
        difficulty: habitForm.difficulty,
      };
      await supabase.from('user_habits').update({
        habit_name: habitForm.name,
        habit_type: habitForm.type,
        frequency: habitForm.frequency,
        difficulty: habitForm.difficulty,
      }).eq('id', habitForm.id);
      setHabits(habits.map((h, i) => i === editingHabitIndex ? updated : h));
    } else {
      // Add new
      const { data, error } = await supabase.from('user_habits').insert({
        user_id: user.id,
        habit_name: habitForm.name,
        habit_type: habitForm.type,
        frequency: habitForm.frequency,
        difficulty: habitForm.difficulty,
      }).select();
      if (!error && data && data[0]) {
        setHabits([...habits, data[0]]);
      }
    }
    setShowHabitForm(false);
    resetHabitForm();
    setEditingHabitIndex(null);
  };

  const handleNewsInterestToggle = (interest: string) => {
    setNewsInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };
  const handleNewsPreferencesSave = async () => {
    if (!user) return;
    await supabase.from('user_news_preferences').upsert({
      user_id: user.id,
      interests: newsInterests,
      frequency: newsFrequency,
      preferred_time: newsPreferredTime,
      format: newsFormat,
    });
    setNewsPreferences({ interests: newsInterests, frequency: newsFrequency, preferred_time: newsPreferredTime, format: newsFormat });
  };

  const handleDietaryToggle = (option: string) => {
    setDietary(prev => prev.includes(option) ? prev.filter(i => i !== option) : [...prev, option]);
  };
  const handleNutritionPreferencesSave = async () => {
    if (!user) return;
    await supabase.from('user_nutrition_preferences').upsert({
      user_id: user.id,
      calories_target: calories ? parseInt(calories, 10) : null,
      protein_target: protein ? parseInt(protein, 10) : null,
      carbs_target: carbs ? parseInt(carbs, 10) : null,
      fat_target: fat ? parseInt(fat, 10) : null,
      fiber_target: fiber ? parseInt(fiber, 10) : null,
      sodium_limit: sodium ? parseInt(sodium, 10) : null,
      sugar_limit: sugar ? parseInt(sugar, 10) : null,
      dietary_restrictions: dietary,
      allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
      notes: nutritionNotes,
    });
    setNutritionPreferences({
      calories_target: calories,
      protein_target: protein,
      carbs_target: carbs,
      fat_target: fat,
      fiber_target: fiber,
      sodium_limit: sodium,
      sugar_limit: sugar,
      dietary_restrictions: dietary,
      allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
      notes: nutritionNotes,
    });
  };

  const handleFitnessGoalsSave = async () => {
    if (!user) return;
    await supabase.from('user_fitness_goals').upsert({
      user_id: user.id,
      goal_type: fitnessGoalType,
      target_weight: fitnessTargetWeight ? parseFloat(fitnessTargetWeight) : null,
      current_weight: fitnessCurrentWeight ? parseFloat(fitnessCurrentWeight) : null,
      height: fitnessHeight ? parseFloat(fitnessHeight) : null,
      start_date: fitnessStartDate || null,
      end_date: fitnessEndDate || null,
      notes: fitnessNotes,
    });
    setFitnessGoals({
      goal_type: fitnessGoalType,
      target_weight: fitnessTargetWeight,
      current_weight: fitnessCurrentWeight,
      height: fitnessHeight,
      start_date: fitnessStartDate,
      end_date: fitnessEndDate,
      notes: fitnessNotes,
    });
  };

  const handleSpendingCategoryChange = (i: number, key: string, value: string) => {
    setSpendingCategories(prev => prev.map((cat, idx) => idx === i ? { ...cat, [key]: value } : cat));
  };
  const addSpendingCategory = () => setSpendingCategories(prev => [...prev, { category: '', percent: '' }]);
  const removeSpendingCategory = (i: number) => setSpendingCategories(prev => prev.filter((_, idx) => idx !== i));

  const handleFinancialGoalChange = (i: number, key: string, value: string) => {
    setFinancialGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [key]: value } : g));
  };
  const addFinancialGoal = () => setFinancialGoals(prev => [...prev, { goal: '', target: '', by: '' }]);
  const removeFinancialGoal = (i: number) => setFinancialGoals(prev => prev.filter((_, idx) => idx !== i));

  const handleFinancialProfileSave = async () => {
    if (!user) return;
    await supabase.from('financial_profiles').upsert({
      user_id: user.id,
      net_worth: netWorth ? parseFloat(netWorth) : null,
      total_assets: totalAssets ? parseFloat(totalAssets) : null,
      total_liabilities: totalLiabilities ? parseFloat(totalLiabilities) : null,
      savings_balance: savingsBalance ? parseFloat(savingsBalance) : null,
      investment_value: investmentValue ? parseFloat(investmentValue) : null,
      monthly_income: monthlyIncome ? parseFloat(monthlyIncome) : null,
      monthly_expenses: monthlyExpenses ? parseFloat(monthlyExpenses) : null,
      spending_habits: { categories: spendingCategories },
      preferred_budgeting: budgetingMethod,
      financial_goals: financialGoals,
      risk_tolerance: riskTolerance,
      emergency_fund_status: emergencyFundStatus,
      notes: financeNotes,
    });
    setFinancialProfile({
      net_worth: netWorth,
      total_assets: totalAssets,
      total_liabilities: totalLiabilities,
      savings_balance: savingsBalance,
      investment_value: investmentValue,
      monthly_income: monthlyIncome,
      monthly_expenses: monthlyExpenses,
      spending_habits: { categories: spendingCategories },
      preferred_budgeting: budgetingMethod,
      financial_goals: financialGoals,
      risk_tolerance: riskTolerance,
      emergency_fund_status: emergencyFundStatus,
      notes: financeNotes,
    });
  };

  const handleJournalQuestionToggle = (question: string) => {
    setSelectedJournalQuestions(prev => prev.includes(question) ? prev.filter(q => q !== question) : [...prev, question]);
  };
  const handleJournalQuestionsSave = async () => {
    if (!user) return;
    const row: any = { user_id: user.id };
    QUESTION_KEYS.forEach((key, i) => {
      row[key] = selectedJournalQuestions.includes(COMMON_JOURNAL_QUESTIONS[i]);
    });
    await supabase.from('journal_config').upsert(row);
    setJournalQuestions(selectedJournalQuestions);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Edit Profile</h1>
        {/* Basic Info Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your main profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || ''} alt={displayName || username || email} />
                <AvatarFallback>{(displayName || username || email)?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              {/* Avatar upload placeholder */}
              <Button variant="outline" disabled>Change Avatar (coming soon)</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Display Name</label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Username</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Email</label>
                <Input value={email} disabled />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Profile Visibility</label>
                <div className="flex items-center gap-3 mt-1">
                  <Switch checked={visibility === 'public'} onCheckedChange={v => setVisibility(v ? 'public' : 'private')} />
                  <span className="text-gray-600 text-sm">{visibility === 'public' ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">Bio</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3 min-h-[80px]"
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        {/* Habits Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Habits</CardTitle>
            <CardDescription>Manage your daily habits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* List habits */}
              {habits.length === 0 ? (
                <div className="text-gray-500 text-center">No habits yet. Add one below!</div>
              ) : (
                <div className="space-y-2">
                  {habits.map((habit, i) => (
                    <div key={habit.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <div>
                        <span className="font-semibold text-gray-800">{habit.habit_name}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">{habit.difficulty}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">{habit.habit_type}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{habit.frequency}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handleHabitEdit(i)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleHabitDelete(habit.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Add/Edit Habit Form */}
              {showHabitForm && (
                <div className="bg-white rounded-xl shadow p-4 space-y-4 border border-gray-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Habit Name</Label>
                      <Input value={habitForm.name} onChange={e => handleHabitFormChange('name', e.target.value)} />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={habitForm.type} onValueChange={v => handleHabitFormChange('type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Select value={habitForm.frequency} onValueChange={v => handleHabitFormChange('frequency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="weekdays">Weekdays</SelectItem>
                          <SelectItem value="weekends">Weekends</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={habitForm.difficulty} onValueChange={v => handleHabitFormChange('difficulty', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => { setShowHabitForm(false); resetHabitForm(); setEditingHabitIndex(null); }}>Cancel</Button>
                    <Button onClick={handleHabitFormSave}>{editingHabitIndex !== null ? 'Save Changes' : 'Add Habit'}</Button>
                  </div>
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={handleHabitAdd}>
                <Plus className="w-4 h-4 mr-2" /> Add Habit
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* News Preferences Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit News Preferences</CardTitle>
            <CardDescription>Manage your news interests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Interests Multi-select */}
              <div>
                <Label className="mb-2 block">Interests</Label>
                <div className="flex flex-wrap gap-2">
                  {availableNewsInterests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${newsInterests.includes(interest) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-indigo-50'}`}
                      onClick={() => handleNewsInterestToggle(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">Select at least 3 interests.</div>
              </div>
              {/* Frequency Dropdown */}
              <div>
                <Label className="mb-2 block">Frequency</Label>
                <Select value={newsFrequency} onValueChange={setNewsFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {newsFrequencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Preferred Time */}
              <div>
                <Label className="mb-2 block">Preferred Reading Time (optional)</Label>
                <Input type="time" value={newsPreferredTime} onChange={e => setNewsPreferredTime(e.target.value)} />
              </div>
              {/* Format Dropdown */}
              <div>
                <Label className="mb-2 block">Format</Label>
                <Select value={newsFormat} onValueChange={setNewsFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {newsFormatOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Nutrition Preferences Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Nutrition Preferences</CardTitle>
            <CardDescription>Manage your dietary targets and restrictions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>Calories</Label>
                  <Input type="number" value={calories} onChange={e => setCalories(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input type="number" value={protein} onChange={e => setProtein(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Carbs (g)</Label>
                  <Input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Fat (g)</Label>
                  <Input type="number" value={fat} onChange={e => setFat(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Fiber (g)</Label>
                  <Input type="number" value={fiber} onChange={e => setFiber(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Sodium (mg)</Label>
                  <Input type="number" value={sodium} onChange={e => setSodium(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Sugar (g)</Label>
                  <Input type="number" value={sugar} onChange={e => setSugar(e.target.value)} min={0} />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Dietary Restrictions</Label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${dietary.includes(option) ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'}`}
                      onClick={() => handleDietaryToggle(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Allergies (comma separated)</Label>
                <Input value={allergies} onChange={e => setAllergies(e.target.value)} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={nutritionNotes} onChange={e => setNutritionNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Fitness Goals Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Fitness Goals</CardTitle>
            <CardDescription>Manage your fitness objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label>Goal Type</Label>
                <Select value={fitnessGoalType} onValueChange={setFitnessGoalType}>
                  <SelectTrigger><SelectValue placeholder="Select a goal type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lose Weight">Lose Weight</SelectItem>
                    <SelectItem value="Gain Muscle">Gain Muscle</SelectItem>
                    <SelectItem value="Maintain">Maintain</SelectItem>
                    <SelectItem value="Improve Endurance">Improve Endurance</SelectItem>
                    <SelectItem value="Increase Flexibility">Increase Flexibility</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Weight (kg)</Label>
                  <Input type="number" value={fitnessTargetWeight} onChange={e => setFitnessTargetWeight(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Current Weight (kg)</Label>
                  <Input type="number" value={fitnessCurrentWeight} onChange={e => setFitnessCurrentWeight(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" value={fitnessHeight} onChange={e => setFitnessHeight(e.target.value)} min={0} />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={fitnessStartDate} onChange={e => setFitnessStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={fitnessEndDate} onChange={e => setFitnessEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Days per Week</Label>
                  <Input type="number" min={1} max={7} value={fitnessDaysPerWeek} onChange={e => setFitnessDaysPerWeek(e.target.value)} />
                </div>
                <div>
                  <Label>Minutes per Session</Label>
                  <Input type="number" min={10} max={180} value={fitnessMinutesPerSession} onChange={e => setFitnessMinutesPerSession(e.target.value)} />
                </div>
                <div>
                  <Label>Intensity</Label>
                  <Select value={fitnessIntensity} onValueChange={setFitnessIntensity}>
                    <SelectTrigger><SelectValue placeholder="Select intensity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Preferred Time of Day</Label>
                  <Select value={fitnessPreferredTimeOfDay} onValueChange={setFitnessPreferredTimeOfDay}>
                    <SelectTrigger><SelectValue placeholder="Select time of day" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Cardio Preferences</Label>
                <div className="flex flex-wrap gap-2">
                  {['Running','Swimming','Biking','Rowing','Walking','HIIT','Elliptical','Other'].map(opt => (
                    <Button key={opt} type="button" size="sm" variant={fitnessCardioPreferences.includes(opt) ? 'default' : 'outline'} className={fitnessCardioPreferences.includes(opt) ? 'bg-pink-500 text-white' : ''} onClick={() => setFitnessCardioPreferences(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])}>{opt}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Muscle Focus</Label>
                <div className="flex flex-wrap gap-2">
                  {['Legs','Upper Body','Core','Full Body','Back','Chest','Arms','Shoulders','Glutes'].map(opt => (
                    <Button key={opt} type="button" size="sm" variant={fitnessMuscleFocus.includes(opt) ? 'default' : 'outline'} className={fitnessMuscleFocus.includes(opt) ? 'bg-pink-500 text-white' : ''} onClick={() => setFitnessMuscleFocus(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])}>{opt}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Equipment Available</Label>
                <div className="flex flex-wrap gap-2">
                  {['Dumbbells','Resistance Bands','Barbell','Kettlebell','Bodyweight Only','Machines','None'].map(opt => (
                    <Button key={opt} type="button" size="sm" variant={fitnessEquipmentAvailable.includes(opt) ? 'default' : 'outline'} className={fitnessEquipmentAvailable.includes(opt) ? 'bg-pink-500 text-white' : ''} onClick={() => setFitnessEquipmentAvailable(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])}>{opt}</Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Injury Limitations</Label>
                <Input value={fitnessInjuryLimitations} onChange={e => setFitnessInjuryLimitations(e.target.value)} placeholder="e.g. knee pain, shoulder injury, etc." />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={fitnessNotes} onChange={e => setFitnessNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Financial Profile Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Financial Profile</CardTitle>
            <CardDescription>Manage your financial snapshot and goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label>Net Worth</Label>
                  <Input type="number" value={netWorth} onChange={e => setNetWorth(e.target.value)} />
                </div>
                <div>
                  <Label>Total Assets</Label>
                  <Input type="number" value={totalAssets} onChange={e => setTotalAssets(e.target.value)} />
                </div>
                <div>
                  <Label>Total Liabilities</Label>
                  <Input type="number" value={totalLiabilities} onChange={e => setTotalLiabilities(e.target.value)} />
                </div>
                <div>
                  <Label>Savings Balance</Label>
                  <Input type="number" value={savingsBalance} onChange={e => setSavingsBalance(e.target.value)} />
                </div>
                <div>
                  <Label>Investment Value</Label>
                  <Input type="number" value={investmentValue} onChange={e => setInvestmentValue(e.target.value)} />
                </div>
                <div>
                  <Label>Monthly Income</Label>
                  <Input type="number" value={monthlyIncome} onChange={e => setMonthlyIncome(e.target.value)} />
                </div>
                <div>
                  <Label>Monthly Expenses</Label>
                  <Input type="number" value={monthlyExpenses} onChange={e => setMonthlyExpenses(e.target.value)} />
                </div>
              </div>
              {/* Spending Habits */}
              <div>
                <Label className="mb-2 block">Spending Categories</Label>
                <div className="space-y-2">
                  {spendingCategories.map((cat, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input className="flex-1" placeholder="Category" value={cat.category} onChange={e => handleSpendingCategoryChange(i, 'category', e.target.value)} />
                      <Input className="w-24" placeholder="%" type="number" value={cat.percent} onChange={e => handleSpendingCategoryChange(i, 'percent', e.target.value)} />
                      <Button size="icon" variant="ghost" onClick={() => removeSpendingCategory(i)} disabled={spendingCategories.length === 1}><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSpendingCategory}>Add Category</Button>
                </div>
              </div>
              {/* Budgeting Method */}
              <div>
                <Label>Preferred Budgeting Method</Label>
                <Select value={budgetingMethod} onValueChange={setBudgetingMethod}>
                  <SelectTrigger><SelectValue placeholder="Select a budgeting method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50/30/20">50/30/20</SelectItem>
                    <SelectItem value="Zero-based">Zero-based</SelectItem>
                    <SelectItem value="Envelope">Envelope</SelectItem>
                    <SelectItem value="Pay Yourself First">Pay Yourself First</SelectItem>
                    <SelectItem value="No Budget">No Budget</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Financial Goals */}
              <div>
                <Label className="mb-2 block">Financial Goals</Label>
                <div className="space-y-2">
                  {financialGoals.map((goal, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input className="flex-1" placeholder="Goal" value={goal.goal} onChange={e => handleFinancialGoalChange(i, 'goal', e.target.value)} />
                      <Input className="w-32" placeholder="Target" value={goal.target} onChange={e => handleFinancialGoalChange(i, 'target', e.target.value)} />
                      <Input className="w-32" placeholder="By (date/year)" value={goal.by} onChange={e => handleFinancialGoalChange(i, 'by', e.target.value)} />
                      <Button size="icon" variant="ghost" onClick={() => removeFinancialGoal(i)} disabled={financialGoals.length === 1}><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFinancialGoal}>Add Goal</Button>
                </div>
              </div>
              {/* Risk Tolerance, Emergency Fund, Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Risk Tolerance</Label>
                  <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                    <SelectTrigger><SelectValue placeholder="Select risk tolerance" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Emergency Fund Status</Label>
                  <Select value={emergencyFundStatus} onValueChange={setEmergencyFundStatus}>
                    <SelectTrigger><SelectValue placeholder="Select emergency fund status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="Less than 3 months">Less than 3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="More than 6 months">More than 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input value={financeNotes} onChange={e => setFinanceNotes(e.target.value)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Journal Questions Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Edit Journal Prompts</CardTitle>
            <CardDescription>Manage your daily reflection questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Select Your Prompts</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMMON_JOURNAL_QUESTIONS.map((question, i) => (
                    <button
                      key={question}
                      type="button"
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${selectedJournalQuestions.includes(question) ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-gray-200 bg-white hover:border-purple-300'}`}
                      onClick={() => handleJournalQuestionToggle(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">Select as many prompts as you like.</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="text-center pt-4">
          <Button type="button" className="px-8 py-3 text-lg font-semibold" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile; 