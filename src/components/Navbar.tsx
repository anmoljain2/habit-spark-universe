
import { User, Trophy, Settings, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

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
            <div className="flex items-center space-x-2">
              <span className="text-sm">{user?.email}</span>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
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
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </a>
              <a href="#" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Habits
              </a>
              <a href="#" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Social
              </a>
              <div className="border-t border-white/20 pt-4">
                <div className="flex items-center px-3 py-2">
                  <span className="text-sm">{user?.email}</span>
                </div>
                <Button
                  onClick={signOut}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 w-full justify-start"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
