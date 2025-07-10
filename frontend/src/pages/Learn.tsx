import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../components/ProfileContext';
import DailyBookSummary from '../components/IntelligenceComponents/DailyBookSummary';
import LearnHeadlines from '../components/IntelligenceComponents/LearnHeadlines';
import LearningReels from '../components/IntelligenceComponents/LearningReels';

const Learn = () => {
  const { user, loading: authLoading } = useAuth();
  const [learn, setLearn] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regenModal, setRegenModal] = useState(false);
  const [regenFeedback, setRegenFeedback] = useState('');
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState('');
  const { newsPreferences } = useProfile();
  const [bookSummary, setBookSummary] = useState<{ title: string; author: string; summary: string } | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');

  const fetchLearnFromSupabase = async (userId: string) => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('user_news')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (error) throw error;
      setLearn(data || []);
    } catch (err: any) {
      setError('Failed to fetch learning content');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.id) {
      fetchLearnFromSupabase(user.id);
    }
  }, [user]);

  useEffect(() => {
    setBookLoading(true);
    setBookError('');
    fetch('/api/generate-book-summary')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBookSummary(data);
      })
      .catch(err => setBookError(err.message || 'Failed to fetch book summary'))
      .finally(() => setBookLoading(false));
  }, []);

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
      if (!res.ok) throw new Error(data.error || 'Failed to regenerate learning content');
      // After regeneration, refresh learning content
      await fetchLearnFromSupabase(user.id);
      setRegenModal(false);
      setRegenFeedback('');
    } catch (err: any) {
      setRegenError(err.message || 'Failed to regenerate learning content');
    }
    setRegenLoading(false);
  };

  // Handler for getting learning content (first time)
  const handleGetLearn = async () => {
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
      if (!res.ok) throw new Error(data.error || 'Failed to generate learning content');
      await fetchLearnFromSupabase(user.id);
    } catch (err: any) {
      setError(err.message || 'Failed to generate learning content');
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Please log in to view your personalized learning content.</div>;
  }

  // Check if there is learning content for today
  const today = new Date().toISOString().slice(0, 10);
  const hasTodayLearn = learn.some(n => n.date && n.date.slice(0, 10) === today);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto">
        <LearningReels />
        <DailyBookSummary />
        <LearnHeadlines news={learn} loading={loading} error={error} />
        {/* Regenerate Modal (only for regeneration) */}
        {regenModal && hasTodayLearn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4">
              <h3 className="text-lg font-bold text-orange-700 mb-2">Regenerate Learnings</h3>
              <label className="text-sm text-gray-700 mb-1">Why are you regenerating? (Optional feedback for AI)</label>
              <textarea
                className="border rounded p-2 w-full min-h-[80px]"
                value={regenFeedback}
                onChange={e => setRegenFeedback(e.target.value)}
                placeholder="E.g. I want more tech, less politics, etc."
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
    </div>
  );
};

export default Learn;
