import { useEffect, useState } from 'react';

const PLACEHOLDER_IMG = 'https://covers.openlibrary.org/b/id/10909258-L.jpg'; // generic book cover

interface ChapterSummary {
  chapter: string;
  summary: string;
}

const DailyBookSummary = () => {
  const [bookSummary, setBookSummary] = useState<{ title: string; author: string; chapters?: ChapterSummary[]; key_points?: string[] } | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [bookError, setBookError] = useState('');
  const [inputTitle, setInputTitle] = useState('');
  const [inputAuthor, setInputAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const fetchBookCover = async (title: string, author?: string) => {
    try {
      const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}${author ? `&author=${encodeURIComponent(author)}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
        setCoverUrl(`https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`);
      } else {
        setCoverUrl(PLACEHOLDER_IMG);
      }
    } catch {
      setCoverUrl(PLACEHOLDER_IMG);
    }
  };

  const fetchBookSummary = (title?: string, author?: string) => {
    setBookLoading(true);
    setBookError('');
    const fetchOptions = title
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, author }),
        }
      : {};
    fetch('/api/generate-book-summary', fetchOptions)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setBookSummary(data);
        fetchBookCover(data.title, data.author);
      })
      .catch(err => {
        setBookError(err.message || 'Failed to fetch book summary');
        setCoverUrl(PLACEHOLDER_IMG);
      })
      .finally(() => setBookLoading(false));
  };

  useEffect(() => {
    fetchBookSummary();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTitle.trim()) return;
    fetchBookSummary(inputTitle.trim(), inputAuthor.trim());
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold mb-2">Daily Book Summary</h1>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1"
          placeholder="Enter a book title (e.g. Deep Work)"
          value={inputTitle}
          onChange={e => setInputTitle(e.target.value)}
        />
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1"
          placeholder="Optional: Author"
          value={inputAuthor}
          onChange={e => setInputAuthor(e.target.value)}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-orange-500 to-pink-600 text-white px-4 py-2 rounded font-medium"
          disabled={bookLoading || !inputTitle.trim()}
        >
          Get Summary
        </button>
      </form>
      {bookLoading && <div className="text-gray-600 mb-2">Loading book summary...</div>}
      {bookError && <div className="text-red-600 mb-2">{bookError}</div>}
      {bookSummary && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-col items-center w-full">
          {coverUrl && (
            <img
              src={coverUrl}
              alt={bookSummary.title + ' cover'}
              className="w-40 h-60 object-cover rounded-lg mb-4 shadow"
              style={{ background: '#f3f3f3' }}
            />
          )}
          <div className="text-lg font-bold text-blue-700 mb-1 text-center">{bookSummary.title}</div>
          {bookSummary.author && <div className="text-sm text-gray-500 mb-3 text-center">by {bookSummary.author}</div>}
          {bookSummary.chapters && (
            <div className="w-full max-w-xl mb-4">
              <h3 className="text-md font-semibold mb-2 text-left">Chapter-by-Chapter Summary:</h3>
              <ul className="list-decimal list-inside space-y-2">
                {bookSummary.chapters.map((ch, idx) => (
                  <li key={idx}>
                    <span className="font-semibold">{ch.chapter}:</span> {ch.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {bookSummary.key_points && (
            <div className="w-full max-w-xl">
              <h3 className="text-md font-semibold mb-2 text-left">Key Ideas & Takeaways:</h3>
              <ul className="list-disc list-inside space-y-1">
                {bookSummary.key_points.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyBookSummary; 