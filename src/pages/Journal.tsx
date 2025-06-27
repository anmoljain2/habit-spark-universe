import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import JournalConfig from './JournalConfig';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
        setEntries(data || []);
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
      setEntries([data, ...entries]);
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

  if (configLoading) return <div>Loading...</div>;
  if (!config) {
    // Show config questionnaire if not set
    return <JournalConfig onComplete={() => {
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
    }} />;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">Journal</h1>
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Write a new entry</h2>
          {hasEntryToday ? (
            <div className="text-green-700 font-semibold text-lg">You've already added a journal entry for today!</div>
          ) : (
            <form onSubmit={handleAddEntry} className="space-y-4">
              {enabledQuestions.length === 0 ? (
                <div className="text-gray-500">No questions selected. Please update your configuration.</div>
              ) : (
                enabledQuestions.map(q => (
                  <div key={q} className="mb-4">
                    <label className="block font-medium mb-1">{q}</label>
                    <textarea
                      className="w-full border rounded px-3 py-2"
                      value={answers[q] || ''}
                      onChange={e => handleAnswerChange(q, e.target.value)}
                      required
                    />
                  </div>
                ))
              )}
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                disabled={saving || enabledQuestions.length === 0}
              >
                {saving ? 'Saving...' : 'Add Entry'}
              </button>
            </form>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Journal Calendar</h2>
          <Calendar
            onChange={handleCalendarChange}
            value={selectedDate}
            tileClassName={({ date }) =>
              entryDates.has(date.toDateString())
                ? 'bg-indigo-200 font-bold' // highlight days with entries
                : undefined
            }
          />
          <div className="mt-6">
            {selectedDate && (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  Entries for {selectedDate.toLocaleDateString()}
                </h3>
                {selectedEntries.length === 0 ? (
                  <div className="text-gray-500">No entry for this day.</div>
                ) : (
                  <ul className="space-y-6">
                    {selectedEntries.map(entry => (
                      <li key={entry.id} className="border-l-4 border-indigo-300 pl-4 py-2">
                        {entry.answers &&
                          Object.entries(entry.answers).map(([q, a]) => (
                            <div key={q} className="mb-2">
                              <span className="font-semibold text-indigo-700">{q}</span>
                              <div className="text-gray-700 whitespace-pre-line">{a}</div>
                            </div>
                          ))}
                        <div className="text-xs text-gray-400">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal; 