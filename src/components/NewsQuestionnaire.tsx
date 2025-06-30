import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, Clock, Zap, BookOpen, Check, X } from 'lucide-react';

const availableInterests = [
  { name: 'Health & Fitness', icon: '💪', color: 'from-green-400 to-emerald-500' },
  { name: 'Technology', icon: '💻', color: 'from-blue-400 to-indigo-500' },
  { name: 'Science', icon: '🔬', color: 'from-purple-400 to-violet-500' },
  { name: 'Business', icon: '📈', color: 'from-orange-400 to-red-500' },
  { name: 'Personal Development', icon: '🌱', color: 'from-emerald-400 to-teal-500' },
  { name: 'Productivity', icon: '⚡', color: 'from-yellow-400 to-amber-500' },
  { name: 'Mental Health', icon: '🧠', color: 'from-pink-400 to-rose-500' },
  { name: 'Nutrition', icon: '🥗', color: 'from-lime-400 to-green-500' },
  { name: 'Sports', icon: '⚽', color: 'from-cyan-400 to-blue-500' },
  { name: 'Environment', icon: '🌍', color: 'from-green-400 to-cyan-500' },
  { name: 'Finance', icon: '💰', color: 'from-yellow-400 to-green-500' },
  { name: 'Education', icon: '📚', color: 'from-indigo-400 to-purple-500' },
  { name: 'Psychology', icon: '🧘', color: 'from-purple-400 to-pink-500' },
  { name: 'Mindfulness', icon: '🕯️', color: 'from-amber-400 to-orange-500' },
  { name: 'Career Growth', icon: '🎯', color: 'from-blue-400 to-purple-500' },
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

  const formatOptions = [
    { 
      value: 'headlines', 
      label: 'Headlines', 
      description: 'Quick overview of top stories',
      icon: Zap,
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      value: 'summaries', 
      label: 'Summaries', 
      description: 'Brief summaries of key articles',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-600'
    },
    { 
      value: 'deep_dive', 
      label: 'Deep Dive', 
      description: 'In-depth analysis and insights',
      icon: Newspaper,
      color: 'from-purple-500 to-violet-600'
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
          <Newspaper className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Personalize Your News
        </h2>
        <p className="text-gray-600 text-lg">
          Let's create your perfect news experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Interests Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-xl font-bold text-gray-800">Select Your Interests</label>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {interests.length}/15 selected (min 3)
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableInterests.map((interest) => {
              const isSelected = interests.includes(interest.name);
              return (
                <div
                  key={interest.name}
                  onClick={() => handleInterestChange(interest.name)}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${interest.color}`}>
                      <span className="text-lg">{interest.icon}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 text-sm">{interest.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Frequency Selection */}
        <div>
          <label className="block text-xl font-bold text-gray-800 mb-4">Content Frequency</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'daily', label: 'Daily', desc: 'Every day' },
              { value: 'every_other_day', label: 'Every Other Day', desc: 'Every 2 days' },
              { value: 'weekly', label: 'Weekly', desc: 'Once a week' },
              { value: 'bi_weekly', label: 'Bi-weekly', desc: 'Twice a month' },
            ].map((freq) => (
              <div
                key={freq.value}
                onClick={() => setFrequency(freq.value)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                  frequency === freq.value
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{freq.label}</div>
                  <div className="text-sm text-gray-500">{freq.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preferred Time */}
        <div>
          <label className="block text-xl font-bold text-gray-800 mb-4">Preferred Reading Time (Optional)</label>
          <div className="relative">
            <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-xl font-bold text-gray-800 mb-4">Content Format</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = format === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => setFormat(option.value as typeof format)}
                  className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="text-center">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${option.color} mb-3`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{option.label}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <X className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || interests.length < 3}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              Saving Preferences...
            </div>
          ) : (
            'Save Preferences'
          )}
        </button>
      </form>
    </div>
  );
};

export default NewsQuestionnaire;
