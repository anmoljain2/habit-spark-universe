
import { User, Trophy, Settings, Menu } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">LifeQuest</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="#" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </a>
              <a href="#" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Habits
              </a>
              <a href="#" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Social
              </a>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Level 5</span>
            </div>
            <User className="w-8 h-8 p-1 bg-white/10 rounded-full cursor-pointer hover:bg-white/20 transition-colors" />
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
