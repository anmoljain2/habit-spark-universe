import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Trophy } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [showForgotLink, setShowForgotLink] = useState(false);
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get redirect and mode params from query string
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    const mode = params.get('mode');
    setIsLogin(mode !== 'signup'); // Always sync isLogin with mode param
    setShowForgotForm(false); // Reset forgot form on mode change
    setShowForgotLink(false); // Reset forgot link on mode change
    setForgotSent(false);
    setResetSuccess(false);
    setResetError('');
    if (mode === 'reset') {
      setResetPassword(true);
    } else {
      setResetPassword(false);
    }
    // Restore navigation on auth state change for successful login
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          navigate(redirect || '/');
        }
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate(redirect || '/');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, location.search]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTriedSubmit(true);
    
    if (username.trim().length === 0) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }
    if (email.trim().length === 0) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    if (password.trim().length === 0) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }
    if (confirmPassword.trim().length === 0) {
      toast({
        title: "Error",
        description: "Confirm password is required",
        variant: "destructive",
      });
      return;
    }
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Check for duplicate username if provided
      if (username.trim().length > 0) {
        const { data: usernameAvailable, error: usernameError } = await supabase
          .rpc('check_username_availability', { username_to_check: username });
        if (usernameError) {
          toast({
            title: "Error",
            description: "Failed to check username availability.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        if (!usernameAvailable) {
          toast({
            title: "Username taken",
            description: "This username is already taken. Please choose another.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Always use production URL for email confirmation
      const redirectUrl = "https://habit-spark-universe.vercel.app/auth";
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('duplicate key value') ||
          error.status === 400 ||
          error.code === '23505'
        ) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Email sent!",
          description: "Please check your inbox for a confirmation link.",
        });
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setTriedSubmit(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password.",
            variant: "destructive",
          });
          setShowForgotLink(true); // Only show the link
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        // Update timezone in user_profiles
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          await supabase
            .from('user_profiles')
            .update({ timezone })
            .eq('user_id', data.user.id);
        } catch (err) {
          // Optionally log or ignore
        }
        // Do not redirect here
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setForgotSent(false);
    try {
      // Always use production URL for password reset
      const redirectUrl = "https://habit-spark-universe.vercel.app/auth?mode=reset";
      const { data, error } = await supabase.auth.resetPasswordForEmail(forgotEmail, { redirectTo: redirectUrl });
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setForgotSent(true);
        toast({
          title: "Reset email sent!",
          description: "If this email exists, a reset link has been sent.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    if (password.length < 8) {
      setResetError('Password must be at least 8 characters long');
      setResetLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setResetError('Passwords do not match');
      setResetLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        setResetError(error.message);
      } else {
        setResetSuccess(true);
        toast({
          title: "Password updated!",
          description: "You can now sign in with your new password.",
        });
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
      }
    } catch (error) {
      setResetError('Something went wrong. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-full">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {resetPassword
              ? 'Reset Password'
              : showForgotForm
                ? 'Forgot Password'
                : isLogin
                  ? 'Welcome Back!'
                  : 'Join LifeQuest'}
          </CardTitle>
          <CardDescription>
            {resetPassword
              ? 'Enter your new password below.'
              : showForgotForm
                ? 'Input email to receive a link to change your password!'
                : isLogin
                  ? 'Sign in to continue your journey'
                  : 'Start your adventure today'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetPassword ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {resetError && <p className="text-sm text-red-500">{resetError}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" disabled={resetLoading}>
                {resetLoading ? 'Saving...' : 'Save New Password'}
              </Button>
              {resetSuccess && <p className="text-green-600 text-center mt-2">Password updated! Redirecting to login...</p>}
            </form>
          ) : showForgotForm ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgotEmail">Email</Label>
                <Input
                  id="forgotEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              {forgotSent && <p className="text-green-600 text-center mt-2">If this email exists, a reset link has been sent.</p>}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotForm(false);
                    setShowForgotLink(false);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                  {triedSubmit && username.trim().length === 0 && (
                    <p className="text-sm text-red-500">Username is required</p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {triedSubmit && email.trim().length === 0 && (
                  <p className="text-sm text-red-500">Email is required</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {triedSubmit && password.trim().length === 0 && (
                  <p className="text-sm text-red-500">Password is required</p>
                )}
                {triedSubmit && password.length > 0 && password.length < 8 && (
                  <p className="text-sm text-red-500">Password must be at least 8 characters long</p>
                )}
              </div>
              
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {triedSubmit && confirmPassword.trim().length === 0 && (
                    <p className="text-sm text-red-500">Confirm password is required</p>
                  )}
                  {triedSubmit && password !== confirmPassword && confirmPassword.length > 0 && (
                    <p className="text-sm text-red-500">Passwords do not match</p>
                  )}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          )}
          {!resetPassword && !showForgotForm && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  if (isLogin) {
                    navigate('/auth?mode=signup' + (location.search.includes('redirect=') ? '&' + location.search.split('?')[1].split('&').filter(q => q.startsWith('redirect=')).join('&') : ''));
                  } else {
                    navigate('/auth' + (location.search.includes('redirect=') ? '?'+ location.search.split('?')[1].split('&').filter(q => q.startsWith('redirect=')).join('&') : ''));
                  }
                }}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"
                }
              </button>
              {isLogin && showForgotLink && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotForm(true);
                      setShowForgotLink(false);
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
