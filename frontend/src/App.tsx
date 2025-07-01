import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Social from "./pages/Social";
import Habits from "./pages/Habits";
import UserProfile from "./pages/UserProfile";
import News from './pages/News';
import Meals from './pages/Meals';
import Fitness from './pages/Fitness';
import Journal from './pages/Journal';
import Finances from './pages/Finances';
import EditProfile from './pages/EditProfile';
import Landing from './pages/Landing';
import About from './pages/About';
import Navbar from './components/Navbar';
import PublicNavbar from './components/PublicNavbar';

const queryClient = new QueryClient();

const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <PublicNavbar />
    {children}
  </>
);

const PrivateLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    {children}
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/auth" element={<PublicLayout><Auth /></PublicLayout>} />

            {/* Protected routes */}
            <Route path="/onboarding" element={<PrivateLayout><ProtectedRoute><Onboarding /></ProtectedRoute></PrivateLayout>} />
            <Route path="/profile" element={<PrivateLayout><ProtectedRoute><Profile /></ProtectedRoute></PrivateLayout>} />
            <Route path="/profile/edit" element={<PrivateLayout><ProtectedRoute><EditProfile /></ProtectedRoute></PrivateLayout>} />
            <Route path="/social" element={<PrivateLayout><ProtectedRoute><Social /></ProtectedRoute></PrivateLayout>} />
            <Route path="/habits" element={<PrivateLayout><ProtectedRoute><Habits /></ProtectedRoute></PrivateLayout>} />
            <Route path="/user/:username" element={<PrivateLayout><ProtectedRoute><UserProfile /></ProtectedRoute></PrivateLayout>} />
            <Route path="/news" element={<PrivateLayout><ProtectedRoute><News /></ProtectedRoute></PrivateLayout>} />
            <Route path="/meals" element={<PrivateLayout><ProtectedRoute><Meals /></ProtectedRoute></PrivateLayout>} />
            <Route path="/fitness" element={<PrivateLayout><ProtectedRoute><Fitness /></ProtectedRoute></PrivateLayout>} />
            <Route path="/journal" element={<PrivateLayout><ProtectedRoute><Journal /></ProtectedRoute></PrivateLayout>} />
            <Route path="/finances" element={<PrivateLayout><ProtectedRoute><Finances /></ProtectedRoute></PrivateLayout>} />
            <Route path="/" element={<PrivateLayout><ProtectedRoute><Index /></ProtectedRoute></PrivateLayout>} />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
