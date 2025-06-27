import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import NewsQuestionnaire from '../components/NewsQuestionnaire';

const News = () => {
  const { user } = useAuth();
  const [newsPrefs, setNewsPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_news_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setNewsPrefs(data);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading...</div>;

  if (!newsPrefs) {
    // Show questionnaire if no preferences
    return (
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-10">
          <NewsQuestionnaire userId={user.id} onComplete={setNewsPrefs} />
        </div>
      </div>
    );
  }

  // Show main news content if preferences exist
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-indigo-800 mb-6">News</h1>
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Your Personalized News</h2>
          <p className="text-gray-600 mb-2">This section will show news and learning content based on your preferences.</p>
          <div className="text-gray-400 italic">(Coming soon: personalized news feed, articles, and more!)</div>
        </div>
      </div>
    </div>
  );
};

export default News; 