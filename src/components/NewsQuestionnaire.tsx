import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const availableInterests = [
  'Health & Fitness',
  'Technology',
  'Science',
  'Business',
  'Personal Development',
  'Productivity',
  'Mental Health',
  'Nutrition',
  'Sports',
  'Environment',
  'Finance',
  'Education',
  'Psychology',
  'Mindfulness',
  'Career Growth',
];

const NewsQuestionnaire = ({ userId, onComplete }: { userId: string, onComplete: (prefs: any) => void }) => {
  const [interests, setInterests] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('daily');
  const [preferredTime, setPreferredTime] = useState('');
  const [format, setFormat] = useState<'headlines' | 'summaries' | 'deep_dive'>('headlines');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInterestChange = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (interests.length < 3) {
      setError('Please select at least 3 interests.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('user_news_preferences').insert({
      user_id: userId,
      interests,
      frequency,
      preferred_time: preferredTime || null,
      format,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onComplete({ interests, frequency, preferred_time: preferredTime, format });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-indigo-700 mb-2">Personalize Your News</h2>
      <div>
        <label className="block font-medium mb-2">Select at least 3 interests:</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          {availableInterests.map((interest) => (
            <label key={interest} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={interests.includes(interest)}
                onChange={() => handleInterestChange(interest)}
                className="accent-indigo-600"
              />
              <span className="text-sm">{interest}</span>
            </label>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">Selected: {interests.length}</div>
      </div>
      <div>
        <label className="block font-medium mb-1">Content Frequency</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="daily">Daily</option>
          <option value="every_other_day">Every Other Day</option>
          <option value="weekly">Weekly</option>
          <option value="bi_weekly">Bi-weekly</option>
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Preferred Time (optional)</label>
        <input
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Content Format</label>
        <div className="flex gap-4">
          <label className={`p-2 rounded border cursor-pointer ${format === 'headlines' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="format"
              value="headlines"
              checked={format === 'headlines'}
              onChange={() => setFormat('headlines')}
              className="mr-2 accent-indigo-600"
            />
            Headlines
          </label>
          <label className={`p-2 rounded border cursor-pointer ${format === 'summaries' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="format"
              value="summaries"
              checked={format === 'summaries'}
              onChange={() => setFormat('summaries')}
              className="mr-2 accent-green-600"
            />
            Summaries
          </label>
          <label className={`p-2 rounded border cursor-pointer ${format === 'deep_dive' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
            <input
              type="radio"
              name="format"
              value="deep_dive"
              checked={format === 'deep_dive'}
              onChange={() => setFormat('deep_dive')}
              className="mr-2 accent-purple-600"
            />
            Deep Dive
          </label>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
};

export default NewsQuestionnaire; 