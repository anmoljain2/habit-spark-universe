import React from 'react';

interface LearnItem {
  id?: string;
  url: string;
  urlToImage?: string;
  source?: string;
  date?: string;
  headline: string;
  summary: string;
}

interface LearnHeadlinesProps {
  news: LearnItem[];
  loading: boolean;
  error: string;
}

const LearnHeadlines: React.FC<LearnHeadlinesProps> = ({ news, loading, error }) => {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-2">Today's Learnings</h1>
      <div className="text-gray-500 mb-8">{new Date().toLocaleDateString()}</div>
      {loading && <div className="text-gray-600 mb-4">Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}
      <div className="space-y-6">
        {news
          .filter(item => item.date && item.date.slice(0, 10) === today)
          .map((item, idx) => (
            <a
              key={item.id || idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-6 group"
            >
              {item.urlToImage && (
                <img
                  src={item.urlToImage}
                  alt={item.headline}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              <div className="flex items-center gap-2 mb-2">
                {item.source && (
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    {item.source}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {item.date ? new Date(item.date).toLocaleDateString() : ''}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2 group-hover:underline">{item.headline}</h2>
              <p className="text-gray-700">{item.summary}</p>
            </a>
          ))}
      </div>
    </div>
  );
};

export default LearnHeadlines; 