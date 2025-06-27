import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Eye, EyeOff, Users, UserPlus, XCircle, CheckCircle, Users as UsersIcon, Trophy, Target, Zap, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AchievementsBadgesRow } from '../components/AchievementBadge';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [newsPreferences, setNewsPreferences] = useState<any>(null);
  const [nutritionPreferences, setNutritionPreferences] = useState<any>(null);
  const [fitnessGoals, setFitnessGoals] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<any[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mainStats, setMainStats] = useState({ total_xp: 0, streak: 0, habits_completed_percent: 0, level: 1 });
  const navigate = useNavigate();
  const [unfriendDialog, setUnfriendDialog] = useState<{ open: boolean, friendUserId: string | null, friendUsername: string | null }>({ open: false, friendUserId: null, friendUsername: null });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      setLoading(true);
      // Fetch main stats from profiles
      const { data: statsData } = await supabase
        .from('profiles')
        .select('total_xp, streak, habits_completed_percent, level')
        .eq('id', user.id)
        .single();
      setMainStats({
        total_xp: statsData?.total_xp || 0,
        streak: statsData?.streak || 0,
        habits_completed_percent: statsData?.habits_completed_percent || 0,
        level: statsData?.level || 1,
      });
      // Fetch profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);
      // Fetch habits
      const { data: habitsData } = await supabase
        .from('user_habits')
        .select('*')
        .eq('user_id', user.id);
      setHabits(habitsData || []);
      // Fetch news preferences
      const { data: newsData } = await supabase
        .from('user_news_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setNewsPreferences(newsData);
      // Fetch nutrition preferences
      const { data: nutritionData } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setNutritionPreferences(nutritionData);
      // Fetch fitness goals
      const { data: fitnessData } = await supabase
        .from('user_fitness_goals')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setFitnessGoals(fitnessData);
      // Fetch friends (accepted only)
      const { data: friendsData } = await supabase
        .from('friend_requests')
        .select('sender_id,receiver_id,status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      // Get friend user IDs
      const friendIds = (friendsData || []).map((f: any) => f.sender_id === user.id ? f.receiver_id : f.sender_id);
      // Fetch friend profiles
      let friendProfiles: any[] = [];
      if (friendIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id,username,display_name,bio')
          .in('user_id', friendIds);
        friendProfiles = profilesData || [];
      }
      setFriends(friendProfiles);
      // Fetch pending friend requests (received)
      const { data: pendingReceived } = await supabase
        .from('friend_requests')
        .select('id,sender_id,receiver_id,status,sent_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending');
      // Fetch user info for senders
      let pendingReceivedWithUser = [];
      if (pendingReceived && pendingReceived.length > 0) {
        const senderIds = pendingReceived.map((r: any) => r.sender_id);
        const { data: senderProfiles } = await supabase
          .from('user_profiles')
          .select('user_id,username,display_name')
          .in('user_id', senderIds);
        pendingReceivedWithUser = pendingReceived.map((r: any) => ({
          ...r,
          sender: senderProfiles?.find((p: any) => p.user_id === r.sender_id)
        }));
      }
      setPendingFriendRequests(pendingReceivedWithUser);
      // Fetch sent friend requests (pending)
      const { data: sentPending } = await supabase
        .from('friend_requests')
        .select('id,receiver_id,status,sent_at')
        .eq('sender_id', user.id)
        .eq('status', 'pending');
      // Fetch user info for receivers
      let sentPendingWithUser = [];
      if (sentPending && sentPending.length > 0) {
        const receiverIds = sentPending.map((r: any) => r.receiver_id);
        const { data: receiverProfiles } = await supabase
          .from('user_profiles')
          .select('user_id,username,display_name')
          .in('user_id', receiverIds);
        sentPendingWithUser = sentPending.map((r: any) => ({
          ...r,
          receiver: receiverProfiles?.find((p: any) => p.user_id === r.receiver_id)
        }));
      }
      setSentFriendRequests(sentPendingWithUser);
      setLoading(false);
    };
    fetchProfileData();
  }, [user]);

  // Accept/decline friend request
  const handleAcceptFriend = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    setPendingFriendRequests(pendingFriendRequests.filter(r => r.id !== requestId));
    // Refresh friends list after accepting
    // Fetch friends (accepted only)
    const { data: friendsData } = await supabase
      .from('friend_requests')
      .select('sender_id,receiver_id,status')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted');
    const friendIds = (friendsData || []).map((f: any) => f.sender_id === user.id ? f.receiver_id : f.sender_id);
    let friendProfiles: any[] = [];
    if (friendIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id,username,display_name,bio')
        .in('user_id', friendIds);
      friendProfiles = profilesData || [];
    }
    setFriends(friendProfiles);
  };
  const handleDeclineFriend = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', requestId);
    setPendingFriendRequests(pendingFriendRequests.filter(r => r.id !== requestId));
  };

  const handleUnfriend = async (friendUserId: string, friendUsername: string) => {
    console.log('Unfriending:', { userId: user.id, friendUserId });
    let error1 = null, error2 = null;
    const { error: err1 } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: user.id, receiver_id: friendUserId });
    if (err1) error1 = err1;
    const { error: err2 } = await supabase
      .from('friend_requests')
      .delete()
      .match({ sender_id: friendUserId, receiver_id: user.id });
    if (err2) error2 = err2;
    if (error1 || error2) {
      console.error('Unfriend error:', error1 || error2);
      toast({ title: 'Error', description: `Failed to unfriend: ${(error1 || error2)?.message}`, variant: 'destructive' });
    } else {
      setFriends(friends.filter(f => f.user_id !== friendUserId));
      toast({ title: 'Unfriended', description: `You have unfriended ${friendUsername}.` });
      setUnfriendDialog({ open: false, friendUserId: null, friendUsername: null });
    }
  };

  if (!user) return null;
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600 text-lg">Loading your profile...</p>
      </div>
    </div>
  );

  // Avatar fallback: first letter of display name or username
  const avatarFallback = (profile?.display_name || profile?.username || user.email)?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Profile Section */}
        <div className="relative mb-10">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
          
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 border border-white/20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <Crown className="w-16 h-16 text-white" />
            </div>
            
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <Avatar className="h-32 w-32 mb-6 shadow-2xl border-4 border-white/30 ring-4 ring-white/20">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || profile?.username || user.email} />
                  <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-sm">{avatarFallback}</AvatarFallback>
                </Avatar>
                
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {profile?.display_name || profile?.username || user.email}
                  </h1>
                  
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">
                    <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-base font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <User className="w-4 h-4 mr-2" />
                      @{profile?.username || user.email?.split('@')[0]}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-base font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6">
                    <Badge className={`px-4 py-2 text-base font-semibold backdrop-blur-sm transition-colors ${
                      profile?.profile_visibility === 'public' 
                        ? 'bg-green-400/20 text-green-100 border-green-400/30 hover:bg-green-400/30' 
                        : 'bg-blue-400/20 text-blue-100 border-blue-400/30 hover:bg-blue-400/30'
                    }`}>
                      {profile?.profile_visibility === 'public' ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                      {profile?.profile_visibility === 'public' ? 'Public Profile' : 'Private Profile'}
                    </Badge>
                    <Badge className="bg-purple-400/20 text-purple-100 border-purple-400/30 px-4 py-2 text-base font-semibold backdrop-blur-sm hover:bg-purple-400/30 transition-colors">
                      <Users className="w-4 h-4 mr-2" />
                      {friends.length} Friends
                    </Badge>
                  </div>

                  {profile?.bio && (
                    <p className="text-white/90 text-lg max-w-2xl leading-relaxed drop-shadow-sm mb-6">
                      {profile.bio}
                    </p>
                  )}

                  {/* Achievements Row */}
                  <div className="flex justify-center lg:justify-start">
                    <AchievementsBadgesRow />
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 lg:ml-auto">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/25 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-yellow-400/30 p-3 rounded-xl">
                      <Zap className="w-6 h-6 text-yellow-200" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Total XP</p>
                      <p className="text-3xl font-bold text-white drop-shadow">{mainStats.total_xp}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/25 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-orange-400/30 p-3 rounded-xl">
                      <Target className="w-6 h-6 text-orange-200" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Streak</p>
                      <p className="text-3xl font-bold text-white drop-shadow">{mainStats.streak}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/25 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-400/30 p-3 rounded-xl">
                      <Trophy className="w-6 h-6 text-green-200" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Level</p>
                      <p className="text-3xl font-bold text-white drop-shadow">{mainStats.level}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 hover:bg-white/25 transition-all duration-300 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-400/30 p-3 rounded-xl">
                      <Star className="w-6 h-6 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Today</p>
                      <p className="text-3xl font-bold text-white drop-shadow">{mainStats.habits_completed_percent}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Habits Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Target className="w-6 h-6 text-indigo-600" />
                My Habits
              </CardTitle>
              <CardDescription className="text-gray-600">Your daily habit tracking progress</CardDescription>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No habits found</p>
                  <p className="text-gray-400 text-sm">Start building better habits today!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {habits.slice(0, 3).map((habit, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">{habit.habit_name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-0 text-xs">
                            {habit.habit_type}
                          </Badge>
                          <span className="text-xs text-gray-500">{habit.frequency}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">Difficulty</div>
                        <div className="text-lg font-bold text-indigo-600">{habit.difficulty}</div>
                      </div>
                    </div>
                  ))}
                  {habits.length > 3 && (
                    <p className="text-center text-gray-500 text-sm font-medium pt-2">
                      And {habits.length - 3} more habits...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* News Preferences */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                News Preferences
              </CardTitle>
              <CardDescription className="text-gray-600">Your personalized news settings</CardDescription>
            </CardHeader>
            <CardContent>
              {newsPreferences ? (
                <div className="space-y-4">
                  {newsPreferences.interests && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {newsPreferences.interests.slice(0, 3).map((interest: string, i: number) => (
                          <Badge key={i} className="bg-blue-100 text-blue-700 border-0">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Frequency</p>
                      <p className="font-semibold text-gray-800">{newsPreferences.frequency}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Format</p>
                      <p className="font-semibold text-gray-800">{newsPreferences.format}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No preferences set</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Preferences */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Nutrition Goals
              </CardTitle>
              <CardDescription className="text-gray-600">Your dietary targets and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionPreferences ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Calories</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.calories_target || 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Protein</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.protein_target || 'N/A'}g</p>
                    </div>
                  </div>
                  {nutritionPreferences.dietary_restrictions && nutritionPreferences.dietary_restrictions.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Dietary Restrictions</h4>
                      <div className="flex flex-wrap gap-2">
                        {nutritionPreferences.dietary_restrictions.slice(0, 2).map((restriction: string, i: number) => (
                          <Badge key={i} className="bg-orange-100 text-orange-700 border-0 text-xs">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No nutrition goals set</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Friends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Friends List */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                My Friends ({friends.length})
              </CardTitle>
              <CardDescription className="text-gray-600">Connect and compete with your friends</CardDescription>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No friends yet</p>
                  <p className="text-gray-400 text-sm">Start connecting with others!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {friends.map((friend, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer" 
                        onClick={() => navigate(`/user/${friend.username}`)}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-purple-200">
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                            {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{friend.display_name || friend.username}</h4>
                          {friend.bio && <p className="text-sm text-gray-500 truncate">{friend.bio}</p>}
                        </div>
                      </div>
                      <AlertDialog open={unfriendDialog.open && unfriendDialog.friendUserId === friend.user_id} onOpenChange={open => setUnfriendDialog(open ? { open: true, friendUserId: friend.user_id, friendUsername: friend.display_name || friend.username } : { open: false, friendUserId: null, friendUsername: null })}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            onClick={e => {
                              e.stopPropagation();
                              setUnfriendDialog({ open: true, friendUserId: friend.user_id, friendUsername: friend.display_name || friend.username });
                            }}
                          >
                            Unfriend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Unfriend {friend.display_name || friend.username}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove this person from your friends list? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setUnfriendDialog({ open: false, friendUserId: null, friendUsername: null })}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnfriend(friend.user_id, friend.display_name || friend.username)}>Unfriend</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Friend Requests */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-indigo-600" />
                Friend Requests
              </CardTitle>
              <CardDescription className="text-gray-600">Manage your pending friend requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Received Requests */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Received ({pendingFriendRequests.length})
                </h4>
                {pendingFriendRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg text-center">No pending requests</p>
                ) : (
                  <div className="space-y-3">
                    {pendingFriendRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-green-400 text-white font-bold">
                              {(req.sender?.display_name || req.sender?.username || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-gray-800">{req.sender?.display_name || req.sender?.username}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAcceptFriend(req.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />Accept
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeclineFriend(req.id)}>
                            <XCircle className="w-4 h-4 mr-1" />Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sent ({sentFriendRequests.length})
                </h4>
                {sentFriendRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg text-center">No sent requests</p>
                ) : (
                  <div className="space-y-3">
                    {sentFriendRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-blue-400 text-white font-bold">
                              {(req.receiver?.display_name || req.receiver?.username || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-gray-800">{req.receiver?.display_name || req.receiver?.username}</span>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-0 px-3 py-1">
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fitness Goals Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Fitness Goals
            </CardTitle>
            <CardDescription className="text-gray-600">Your health and fitness objectives</CardDescription>
          </CardHeader>
          <CardContent>
            {fitnessGoals ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-2">Goal Type</h4>
                  <p className="text-2xl font-bold text-pink-600">{fitnessGoals.goal_type || 'N/A'}</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-2">Target Weight</h4>
                  <p className="text-2xl font-bold text-pink-600">{fitnessGoals.target_weight || 'N/A'} kg</p>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-2">Current Weight</h4>
                  <p className="text-2xl font-bold text-pink-600">{fitnessGoals.current_weight || 'N/A'} kg</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-lg">No fitness goals set</p>
                <p className="text-gray-400">Set up your fitness goals to start tracking progress!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
