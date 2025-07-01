import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Trophy, Target, Heart, Zap, Star, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Landing = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [userCount, setUserCount] = useState<string | null>(null);
  const [habitsCount, setHabitsCount] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[] | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [satisfaction, setSatisfaction] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      if (typeof count === 'number') {
        // Round to nearest 100 and format with comma
        const rounded = Math.round(count / 100) * 100;
        setUserCount(`${rounded.toLocaleString()}+`);
      }
    };
    fetchUserCount();
  }, []);

  useEffect(() => {
    const fetchHabitsCount = async () => {
      const { count } = await supabase
        .from('user_habits')
        .select('id', { count: 'exact', head: true });
      if (typeof count === 'number') {
        const rounded = Math.round(count / 100) * 100;
        setHabitsCount(`${rounded.toLocaleString()}+`);
      }
    };
    fetchHabitsCount();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('stars', 5)
        .order('created_at', { ascending: false })
        .limit(6);
      setReviews(data || []);
      setLoadingReviews(false);
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    const fetchSatisfaction = async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('stars');
      if (data && data.length > 0) {
        const total = data.reduce((sum, r) => sum + (r.stars || 0), 0);
        const avg = total / data.length;
        const percent = Math.round((avg / 5) * 100);
        setSatisfaction(`${percent}%`);
      } else {
        setSatisfaction('N/A');
      }
    };
    fetchSatisfaction();
  }, []);

  const features = [
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with like-minded individuals, share progress, and motivate each other on your journey to self-improvement."
    },
    {
      icon: Target,
      title: "All-in-One Platform",
      description: "Track habits, plan meals, manage finances, journal thoughts, and stay fit - all in one beautifully integrated app."
    },
    {
      icon: Trophy,
      title: "Gamified Experience",
      description: "Earn XP, unlock achievements, level up, and compete with friends to make personal growth addictive and fun."
    },
    {
      icon: Heart,
      title: "Personalized Journey",
      description: "AI-powered recommendations and custom goal setting ensure your path to improvement is uniquely yours."
    },
    {
      icon: Zap,
      title: "Real-time Progress",
      description: "Beautiful dashboards and analytics help you visualize your growth and stay motivated every step of the way."
    },
    {
      icon: Sparkles,
      title: "Daily Inspiration",
      description: "Curated content, motivational quotes, and success stories to keep you inspired and focused on your goals."
    }
  ];

  const stats = [
    { number: userCount || '', label: "Active Users" },
    { number: habitsCount || '', label: "Habits Formed" },
    { number: satisfaction || '', label: "User Satisfaction" },
    { number: "24/7", label: "Community Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
              {userCount
                ? `🚀 Join ${userCount} Users Transforming Their Lives`
                : <span className="inline-block w-32 h-5 bg-indigo-100 animate-pulse rounded" />}
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Transform Your Life
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                One Quest at a Time
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              The ultimate gamified platform for personal growth. Track habits, connect with community, 
              and level up your life with our all-in-one self-improvement ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-3">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-3"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-indigo-600 mb-2">
                  {(stat.label === 'Active Users' && !userCount) ||
                   (stat.label === 'Habits Formed' && !habitsCount) ||
                   (stat.label === 'User Satisfaction' && !satisfaction) ? (
                    <span className="inline-block w-16 h-7 bg-indigo-100 animate-pulse rounded" />
                  ) : stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-8 border border-indigo-200">
              <div className="aspect-video bg-white rounded-xl shadow-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-full mb-4 inline-block">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Journey Starts Here</h3>
                  <p className="text-gray-600">Interactive dashboard preview coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to 
              <span className="block text-indigo-600">Transform Your Life</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform combines the best of habit tracking, social networking, 
              and gamification to create an irresistible self-improvement experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader>
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-lg w-fit mb-4">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-16">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 inline-block">
                Loved by Thousands of 
                <span className="block text-indigo-600">Life Changers</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto md:mx-0">
                Join our community of achievers who are transforming their lives one quest at a time.
              </p>
            </div>
            <Link to="/auth?redirect=/add-review">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md ml-4">
                Add Review
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {loadingReviews ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-0 shadow-lg animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex mb-4 space-x-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <span key={j} className="w-5 h-5 bg-yellow-100 rounded" />
                      ))}
                    </div>
                    <div className="h-12 bg-gray-100 rounded mb-4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </CardContent>
                </Card>
              ))
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{review.comment}"</p>
                    <div>
                      <p className="font-semibold text-gray-900">{review.name}</p>
                      <p className="text-sm text-gray-600">{review.affiliation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">No 5-star reviews yet. Be the first to leave one!</div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Level Up Your Life?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already transforming their lives with LifeQuest. 
            Start your journey today - it's free!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-50 text-lg px-8 py-3">
                Get Started for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" className="bg-white/80 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 text-lg px-8 py-3 transition-colors">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">LifeQuest</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering individuals to transform their lives through gamified self-improvement 
                and community support.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:support@lifequest.app" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="mailto:support@lifequest.app" className="hover:text-white transition-colors">Contact</a></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LifeQuest. All rights reserved. Built with ❤️ for personal growth.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
