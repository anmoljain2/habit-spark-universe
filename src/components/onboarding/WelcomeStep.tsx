
import { Button } from '@/components/ui/button';
import { Trophy, Target, Users, BookOpen } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Welcome to LifeQuest!</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your daily routines into an exciting adventure. Level up your life through 
          gamified habit tracking, social connections, and personalized learning.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 my-8">
        <div className="text-center space-y-3 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex justify-center">
            <Target className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Track Habits</h3>
          <p className="text-sm text-gray-600">
            Build positive habits and break negative ones with our gamified system
          </p>
        </div>

        <div className="text-center space-y-3 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <div className="flex justify-center">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Connect & Compete</h3>
          <p className="text-sm text-gray-600">
            Join friends, share progress, and motivate each other
          </p>
        </div>

        <div className="text-center space-y-3 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
          <div className="flex justify-center">
            <BookOpen className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900">Learn & Grow</h3>
          <p className="text-sm text-gray-600">
            Get personalized educational content and news updates
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Let's get started by personalizing your LifeQuest experience!
        </p>
        <Button 
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          Begin Your Journey
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
