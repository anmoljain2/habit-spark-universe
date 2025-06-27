
import { Button } from '@/components/ui/button';
import { Trophy, Target, Users, BookOpen, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center space-y-8">
      {/* Hero Section */}
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-3xl shadow-2xl animate-pulse">
            <Trophy className="w-16 h-16 text-white" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to LifeQuest!
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Transform your daily routines into an exciting adventure. Level up your life through 
            gamified habit tracking, social connections, and personalized learning experiences.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 my-12">
        <div className="group text-center space-y-4 p-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-4 rounded-2xl shadow-lg">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Track & Build Habits</h3>
          <p className="text-gray-600 leading-relaxed">
            Build positive habits and break negative ones with our gamified system that makes progress fun and rewarding
          </p>
        </div>

        <div className="group text-center space-y-4 p-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Connect & Compete</h3>
          <p className="text-gray-600 leading-relaxed">
            Join friends, share progress, and motivate each other in a supportive community environment
          </p>
        </div>

        <div className="group text-center space-y-4 p-8 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-2xl shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Learn & Grow</h3>
          <p className="text-gray-600 leading-relaxed">
            Get personalized educational content, news updates, and insights tailored to your interests
          </p>
        </div>
      </div>

      {/* Stats Preview */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-100 shadow-lg">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">50K+</div>
            <div className="text-gray-600 font-medium">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600 mb-2">1M+</div>
            <div className="text-gray-600 font-medium">Habits Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">95%</div>
            <div className="text-gray-600 font-medium">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <span className="font-medium">Let's personalize your LifeQuest experience!</span>
          <Sparkles className="w-5 h-5 text-indigo-500" />
        </div>
        <Button 
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3"
        >
          Begin Your Journey
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
