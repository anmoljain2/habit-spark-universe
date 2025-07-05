import { User, Trophy, Settings, Menu, LogOut, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/components/ProfileContext';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { level, loading: profileLoading } = useProfile();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/habits', label: 'Habits' },
    { path: '/journal', label: 'Journal' },
    { path: '/news', label: 'News' },
    { path: '/meals', label: 'Meals' },
    { path: '/fitness', label: 'Fitness' },
    { path: '/finances', label: 'Finances' },
    { path: '/social', label: 'Social' },
    { path: '/relationship', label: 'Relationship' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">
              LifeQuest
            </h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors transition-shadow duration-200 ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                      : 'hover:bg-white/10 hover:text-white/90'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 px-4 py-2 rounded-full border border-yellow-400/30 backdrop-blur-sm flex-nowrap whitespace-nowrap">
              <Trophy className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {profileLoading ? '...' : `Level ${level}`}
              </span>
            </div>
            <Link 
              to="/profile" 
              className="flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full p-2.5 transition-colors duration-200 backdrop-blur-sm border border-white/20"
            >
              <User className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
              <span className="text-sm font-medium">{user?.email?.split('@')[0]}</span>
              <Button
                onClick={signOut}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 transition-colors h-8 w-8 p-0 rounded-full"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black/10 rounded-lg mt-2 backdrop-blur-sm">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-white/20 pt-4 mt-4">
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5 text-white" />
                  <span>Profile</span>
                </Link>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm">{user?.email?.split('@')[0]}</span>
                  <Button
                    onClick={signOut}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
