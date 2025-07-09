import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../components/ProfileContext';

const News = () => {
  const { user, loading: authLoading } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenModal, setRegenModal] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState('');
  const { newsPreferences } = useProfile();

  const fetchNewsFromSupabase = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('user_news')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      setNews(data || []);
    } catch (err: any) {
      setError('Failed to fetch news');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.id) {
      fetchNewsFromSupabase(user.id);
    }
  }, [user]);

  const handleRegenerate = async () => {
    if (!user) return;
    setRegenLoading(true);
    setRegenError('');
    try {
      const res = await fetch('/api/generate-news-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, preferences: newsPreferences?.interests || [], regenerate_feedback: regenFeedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate news');
      // After regeneration, refresh news
      await fetchNewsFromSupabase(user.id);
      setRegenModal(false);
      setRegenFeedback('');
    } catch (err: any) {
      setRegenError(err.message || 'Failed to regenerate news');
    }
    setRegenLoading(false);
  };

  // Handler for getting news (first time)
  const handleGetNews = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-news-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, preferences: newsPreferences?.interests || [], regenerate_feedback: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate news');
      await fetchNewsFromSupabase(user.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate news');
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Please log in to view your personalized news.</div>;
  }

  // Check if there are news articles for today
  const today = new Date().toISOString().slice(0, 10);
  const hasTodayNews = news.some(n => n.date && n.date.slice(0, 10) === today);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Personalized News</h1>
      {/* Show Get My News or Regenerate News button as appropriate */}
      {!hasTodayNews ? (
        <button
          className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium mb-6"
          onClick={handleGetNews}
          disabled={loading}
        >
          Get My News
        </button>
      ) : (
        <button
          className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium mb-6"
          onClick={() => setRegenModal(true)}
        >
          Regenerate News
        </button>
      )}
      {loading && <div className="text-gray-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="grid gap-6">
        {news.map((item, idx) => (
          <div key={item.id || idx} className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-2">{item.headline}</h3>
            <p className="mb-1">{item.summary}</p>
            {item.source && item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                Source: {item.source}
              </a>
            )}
            <div className="text-xs text-gray-400 mt-2">{item.date ? new Date(item.date).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
      {/* Regenerate Modal (only for regeneration) */}
      {regenModal && hasTodayNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-orange-700 mb-2">Regenerate News</h3>
            <label className="text-sm text-gray-700 mb-1">Why are you regenerating? (Optional feedback for AI)</label>
            <textarea
              className="border rounded p-2 w-full min-h-[80px]"
              value={regenFeedback}
              onChange={e => setRegenFeedback(e.target.value)}
              placeholder="E.g. I want more tech news, less politics, etc."
            />
            {regenError && <div className="text-red-600 text-sm">{regenError}</div>}
            <div className="flex gap-2 mt-2">
              <button
                className="bg-gray-200 px-4 py-2 rounded font-medium"
                onClick={() => setRegenModal(false)}
                disabled={regenLoading}
              >Cancel</button>
              <button
                className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
                onClick={handleRegenerate}
                disabled={regenLoading}
              >
                {regenLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
