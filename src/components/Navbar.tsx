import { User, Trophy, Settings, Menu, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [level, setLevel] = useState<number | null>(null);
  const [levelLoading, setLevelLoading] = useState(true);

  useEffect(() => {
    const fetchLevel = async () => {
      if (!user) return;
      setLevelLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('level')
        .eq('id', user.id)
        .single();
      setLevel(data?.level || 1);
      setLevelLoading(false);
    };
    fetchLevel();
  }, [user]);

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">LifeQuest</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/habits" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Habits
              </Link>
              <Link to="/journal" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Journal
              </Link>
              <Link to="/news" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                News
              </Link>
              <Link to="/meals" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Meals
              </Link>
              <Link to="/fitness" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Fitness
              </Link>
              <Link to="/social" className="hover:bg-white/10 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Social
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">
                {levelLoading ? '...' : `Level ${level}`}
              </span>
            </div>
            <Link to="/profile" className="flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors">
              <User className="w-5 h-5 text-white" />
            </Link>
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
              <Link to="/" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Dashboard
              </Link>
              <Link to="/habits" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Habits
              </Link>
              <Link to="/journal" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Journal
              </Link>
              <Link to="/news" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                News
              </Link>
              <Link to="/meals" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Meals
              </Link>
              <Link to="/fitness" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Fitness
              </Link>
              <Link to="/social" className="hover:bg-white/10 block px-3 py-2 rounded-md text-base font-medium">
                Social
              </Link>
              <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 hover:bg-white/10 rounded-md text-base font-medium">
                <User className="w-5 h-5 text-white" />
                <span>Profile</span>
              </Link>
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
