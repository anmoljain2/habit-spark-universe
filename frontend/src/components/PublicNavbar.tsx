import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PublicNavbar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const loginTarget = location.pathname === '/auth' && location.search.includes('mode=signup') ? '/auth' : '/auth';

  return (
    <nav className="bg-gradient-to-r from-rose-500 via-indigo-500 to-purple-600 text-white shadow-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              LifeQuest
            </h1>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={`text-gray-600 hover:text-indigo-600 transition-colors ${isActive('/') ? 'font-bold underline' : ''}`}>Home</Link>
            <Link to="/about" className={`text-gray-600 hover:text-indigo-600 transition-colors ${isActive('/about') ? 'font-bold underline' : ''}`}>About</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button className="hidden sm:inline-flex bg-indigo-600 text-white hover:bg-indigo-700">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar; 