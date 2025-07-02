import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, CheckCircle, Circle, Sparkles, BookOpen } from 'lucide-react';

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

const QUESTION_CATEGORIES = [
  { icon: '🙏', color: 'from-amber-400 to-orange-500' },
  { icon: '✨', color: 'from-purple-400 to-pink-500' },
  { icon: '💪', color: 'from-red-400 to-rose-500' },
  { icon: '🧘', color: 'from-green-400 to-emerald-500' },
  { icon: '🎓', color: 'from-blue-400 to-indigo-500' },
  { icon: '🎯', color: 'from-indigo-400 to-purple-500' },
  { icon: '💭', color: 'from-pink-400 to-rose-500' },
  { icon: '🕊️', color: 'from-cyan-400 to-blue-500' },
  { icon: '😊', color: 'from-yellow-400 to-amber-500' },
  { icon: '📈', color: 'from-emerald-400 to-teal-500' },
];

interface JournalConfigProps {
  onComplete?: () => void;
}

const JournalConfig = ({ onComplete }: JournalConfigProps) => {
  const { user } = useAuth();
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('journal_config')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          // Populate selectedQuestions from boolean columns
          const selected: string[] = [];
          QUESTION_KEYS.forEach((key, i) => {
            if (data[key]) selected.push(COMMON_JOURNAL_QUESTIONS[i]);
          });
          setSelectedQuestions(selected);
        }
        setLoading(false);
      });
  }, [user]);

  const handleChange = (question: string) => {
    setSelectedQuestions(prev =>
      prev.includes(question)
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    // Build row with booleans for each question
    const row: any = { user_id: user.id };
    QUESTION_KEYS.forEach((key, i) => {
      row[key] = selectedQuestions.includes(COMMON_JOURNAL_QUESTIONS[i]);
    });
    const { error } = await supabase.from('journal_config').upsert(row);
    setSaving(false);
    if (!error && onComplete) onComplete();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-4 py-2 rounded-full border border-purple-200 mb-6">
            <Settings className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Personalization</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Journal Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose the reflection prompts that resonate with you. Create a journaling experience that's uniquely yours.
          </p>
        </div>

        {/* Configuration Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Choose Your Prompts</h2>
              <p className="text-gray-600">Select the questions that inspire meaningful reflection</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMMON_JOURNAL_QUESTIONS.map((question, index) => {
                const isSelected = selectedQuestions.includes(question);
                const category = QUESTION_CATEGORIES[index];
                
                return (
                  <div
                    key={question}
                    onClick={() => handleChange(question)}
                    className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      isSelected
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg'
                        : 'border-gray-200 bg-white/50 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} shadow-lg`}>
                        <span className="text-2xl">{category.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800 leading-tight">{question}</h3>
                          {isSelected ? (
                            <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Count */}
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 px-6 py-3 rounded-full">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-700">
                  {selectedQuestions.length} prompt{selectedQuestions.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving || selectedQuestions.length === 0}
              >
                {saving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                    Saving Configuration...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Settings className="w-5 h-5" />
                    Save Configuration
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JournalConfig;
