import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import JournalConfig from './JournalConfig';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { BookOpen, Calendar as CalendarIcon, PenTool, Sparkles } from 'lucide-react';
import QuestionnaireWrapper from '../components/QuestionnaireWrapper';

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

interface JournalEntry {
  id: string;
  user_id: string;
  answers: { [q: string]: string };
  created_at: string;
}

const Journal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [q: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get the list of enabled questions for this user
  const enabledQuestions = QUESTION_KEYS
    .map((key, i) => (config && config[key] ? COMMON_JOURNAL_QUESTIONS[i] : null))
    .filter(Boolean) as string[];

  // Check if the user has already submitted an entry for today
  const todayStr = new Date().toDateString();
  const hasEntryToday = entries.some(entry => new Date(entry.created_at).toDateString() === todayStr);

  useEffect(() => {
    if (!user) return;
    setConfigLoading(true);
    supabase
      .from('journal_config')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setConfig(data);
        setConfigLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !config) return;
    setLoading(true);
    supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        // Type assertion to handle the Json type from Supabase
        const typedEntries = (data || []).map(entry => ({
          ...entry,
          answers: entry.answers as { [q: string]: string }
        }));
        setEntries(typedEntries);
        setLoading(false);
      });
  }, [user, config]);

  const handleAnswerChange = (q: string, value: string) => {
    setAnswers(prev => ({ ...prev, [q]: value }));
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      answers,
    }).select().single();
    setSaving(false);
    if (!error && data) {
      const typedEntry = {
        ...data,
        answers: data.answers as { [q: string]: string }
      };
      setEntries([typedEntry, ...entries]);
      setAnswers({});
    }
  };

  const handleCalendarChange = (value: Date | Date[] | null) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    } else if (Array.isArray(value) && value[0] instanceof Date) {
      setSelectedDate(value[0]);
    } else {
      setSelectedDate(null);
    }
  };

  if (configLoading) return (
    <div className="min-h-screen">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    </div>
  );

  if (!config) {
    return (
      <QuestionnaireWrapper>
        <JournalConfig onComplete={() => {
          setConfigLoading(true);
          supabase
            .from('journal_config')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(({ data }) => {
              setConfig(data);
              setConfigLoading(false);
            });
        }} />
      </QuestionnaireWrapper>
    );
  }

  // Map dates to entries for quick lookup
  const entriesByDate = entries.reduce((acc, entry) => {
    const dateStr = new Date(entry.created_at).toDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(entry);
    return acc;
  }, {} as { [date: string]: JournalEntry[] });

  // Get entries for the selected date
  const selectedEntries = selectedDate
    ? entriesByDate[new Date(selectedDate).toDateString()] || []
    : [];

  // Dates with entries for highlighting
  const entryDates = new Set(entries.map(e => new Date(e.created_at).toDateString()));

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-4 py-2 rounded-full border border-purple-200 mb-6">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Daily Reflection</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Journal
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Capture your thoughts, reflect on your day, and track your personal growth journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Write Entry Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
                  <PenTool className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Today's Entry</h2>
              </div>
              
              {hasEntryToday ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✨</div>
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Entry Complete!</h3>
                  <p className="text-gray-600">You've already journaled today. Great job!</p>
                </div>
              ) : (
                enabledQuestions.length === 0 ? (
                  <JournalConfig onComplete={() => {
                    // Refetch config after saving
                    setConfigLoading(true);
                    supabase
                      .from('journal_config')
                      .select('*')
                      .eq('user_id', user.id)
                      .single()
                      .then(({ data }) => {
                        setConfig(data);
                        setConfigLoading(false);
                      });
                  }} />
                ) : (
                  <form onSubmit={handleAddEntry} className="space-y-6">
                    {enabledQuestions.map((q, index) => (
                      <div key={q} className="group">
                        <label className="block font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          {q}
                        </label>
                        <textarea
                          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all duration-200 resize-none"
                          rows={3}
                          value={answers[q] || ''}
                          onChange={e => handleAnswerChange(q, e.target.value)}
                          placeholder="Share your thoughts..."
                          required
                        />
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={saving || enabledQuestions.length === 0}
                    >
                      {saving ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                          Saving...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          Save Entry
                        </div>
                      )}
                    </button>
                  </form>
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calendar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                Journal Calendar
              </h3>
              <Calendar
                onChange={handleCalendarChange}
                value={selectedDate}
                className="w-full"
                tileClassName={({ date }: { date: Date }) =>
                  entryDates.has(date.toDateString())
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold rounded-lg' 
                    : undefined
                }
              />
            </div>

            {/* Selected Date Entries */}
            {selectedDate && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/50">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                {selectedEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-gray-500">No entry for this day</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedEntries.map(entry => (
                      <div key={entry.id} className="border-l-4 border-purple-400 pl-4 py-2 bg-purple-50/50 rounded-r-lg">
                        {entry.answers &&
                          Object.entries(entry.answers).map(([q, a]) => (
                            <div key={q} className="mb-3">
                              <span className="font-semibold text-purple-700 text-sm">{q}</span>
                              <div className="text-gray-700 mt-1 text-sm leading-relaxed whitespace-pre-line">{a}</div>
                            </div>
                          ))}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
