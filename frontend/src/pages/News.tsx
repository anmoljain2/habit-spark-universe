import { useState } from 'react';

const News = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // TODO: Replace with actual user preferences from profile/context
  const preferences = ['technology', 'health', 'finance'];

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate-news-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'demo', preferences }),
      });
      const data = await res.json();
      // Try to parse the AI response as JSON
      let parsed = [];
      try {
        parsed = typeof data.news === 'string' ? JSON.parse(data.news) : data.news;
      } catch {
        parsed = [];
      }
      setNews(parsed);
    } catch (err: any) {
      setError('Failed to fetch news');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Personalized News</h1>
      <button
        onClick={fetchNews}
        className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded-xl font-medium mb-6"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get My News'}
      </button>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="grid gap-6">
        {news.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow p-4">
            <h3 className="text-xl font-bold mb-2">{item.headline}</h3>
            <p className="mb-1">{item.summary}</p>
            <small className="text-gray-500 block mb-1">{item.reason}</small>
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
