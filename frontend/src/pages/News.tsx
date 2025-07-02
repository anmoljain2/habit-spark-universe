import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NewsQuestionnaire from '../components/NewsQuestionnaire';
import { Newspaper, BookOpen, TrendingUp, Clock, ExternalLink } from 'lucide-react';
import QuestionnaireWrapper from '../components/QuestionnaireWrapper';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!loading && !newsPrefs) {
    return (
      <QuestionnaireWrapper>
        <NewsQuestionnaire userId={user.id} onComplete={setNewsPrefs} />
      </QuestionnaireWrapper>
    );
  }

  const featuredArticles = [
    {
      title: "The Science Behind Habit Formation: What Research Tells Us",
      excerpt: "Discover the latest neuroscience research on how habits form and how you can use this knowledge to build better routines.",
      category: "Health & Wellness",
      readTime: "5 min read",
      featured: true
    },
    {
      title: "Digital Wellness: Managing Screen Time in 2024",
      excerpt: "Practical strategies to maintain a healthy relationship with technology while staying productive.",
      category: "Technology",
      readTime: "3 min read"
    },
    {
      title: "The Rise of Micro-Habits: Small Changes, Big Results",
      excerpt: "How tiny daily actions can lead to significant life transformations over time.",
      category: "Productivity",
      readTime: "4 min read"
    },
    {
      title: "Nutrition Science Update: Plant-Based Eating Benefits",
      excerpt: "Latest research on how plant-based diets impact long-term health and longevity.",
      category: "Nutrition",
      readTime: "6 min read"
    }
  ];

  const trendingTopics = [
    "AI in Healthcare",
    "Sustainable Living",
    "Mental Health Awareness",
    "Remote Work Culture",
    "Climate Solutions"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-4 py-2 rounded-full border border-indigo-200 mb-4">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-700">Stay Informed</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Your Personalized News
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Curated content to help you grow, learn, and stay informed about what matters to you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Featured Article */}
            {featuredArticles[0] && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-yellow-300" />
                  <span className="text-yellow-200 font-medium">Featured Story</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">{featuredArticles[0].title}</h2>
                <p className="text-indigo-100 text-lg mb-6 leading-relaxed">{featuredArticles[0].excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-indigo-200">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {featuredArticles[0].category}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{featuredArticles[0].readTime}</span>
                    </div>
                  </div>
                  <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
                    Read More <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredArticles.slice(1).map((article, index) => (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 group">
                  <div className="mb-4">
                    <span className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{article.readTime}</span>
                    </div>
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="p-3 bg-gray-50/80 hover:bg-indigo-50/80 rounded-lg cursor-pointer transition-colors group">
                    <span className="text-gray-700 group-hover:text-indigo-700 font-medium">#{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-bold mb-4">Your Reading Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-100">Articles Read</span>
                  <span className="font-bold">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-100">Reading Streak</span>
                  <span className="font-bold">7 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-100">Learning XP</span>
                  <span className="font-bold">+150</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default News;
