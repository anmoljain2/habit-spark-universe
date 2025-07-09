import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../hooks/useAuth';

const News = () => {
  const { user, loading: authLoading } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>;
  }
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Please log in to view your personalized news.</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Personalized News</h1>
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
    </div>
  );
};

export default News;
