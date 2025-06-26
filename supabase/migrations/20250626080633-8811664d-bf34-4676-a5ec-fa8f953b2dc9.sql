
-- Create users table to store basic user info
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create user_habits table for habit tracking
CREATE TABLE public.user_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_name TEXT NOT NULL,
  habit_type TEXT CHECK (habit_type IN ('positive', 'negative', 'neutral')),
  frequency TEXT,
  reminder_time TIME,
  difficulty TEXT,
  time_estimate_minutes INTEGER,
  streak_goal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create user_profiles table for social features
CREATE TABLE public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  profile_visibility TEXT CHECK (profile_visibility IN ('public', 'private')) DEFAULT 'public',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create friend_requests table for social connections
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create user_news_preferences table for personalized content
CREATE TABLE public.user_news_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  interests TEXT[],
  frequency TEXT,
  preferred_time TIME,
  format TEXT CHECK (format IN ('headlines', 'summaries', 'deep_dive'))
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_news_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_habits table
CREATE POLICY "Users can view their own habits" ON public.user_habits
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own habits" ON public.user_habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON public.user_habits
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON public.user_habits
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_profiles table
CREATE POLICY "Users can view public profiles" ON public.user_profiles
  FOR SELECT USING (profile_visibility = 'public' OR auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for friend_requests table
CREATE POLICY "Users can view their friend requests" ON public.friend_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can create friend requests" ON public.friend_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update friend requests they received" ON public.friend_requests
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Create RLS policies for user_news_preferences table
CREATE POLICY "Users can view their own news preferences" ON public.user_news_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own news preferences" ON public.user_news_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own news preferences" ON public.user_news_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Update the existing trigger to also create users record
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert into users table
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_complete();

-- Function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE username = username_to_check
  );
$$;
