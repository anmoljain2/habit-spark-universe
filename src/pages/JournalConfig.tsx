import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Journal Configuration</h1>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Choose Your Journal Questions</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {COMMON_JOURNAL_QUESTIONS.map(q => (
                <label key={q} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.includes(q)}
                    onChange={() => handleChange(q)}
                    className="accent-indigo-600"
                  />
                  <span className="text-gray-800">{q}</span>
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Questions'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JournalConfig;

 