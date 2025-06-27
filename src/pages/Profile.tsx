import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Eye, EyeOff, Users, UserPlus, XCircle, CheckCircle, Users as UsersIcon } from 'lucide-react';
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
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  // Avatar fallback: first letter of display name or username
  const avatarFallback = (profile?.display_name || profile?.username || user.email)?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Public Stats Card */}
        <div className="relative z-10 mb-10">
          <div className="bg-gradient-to-br from-yellow-400 via-pink-400 to-indigo-500 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-white/80 animate-pulse-slow">
            <div className="flex-1 flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">🔥 Compete with {profile?.display_name || profile?.username || user.email}</h2>
              <p className="text-white/90 mb-4 text-lg font-semibold drop-shadow">See how you stack up against your friends!</p>
              <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start mb-6">
                <div className="bg-white/90 rounded-xl px-6 py-4 flex flex-col items-center shadow-lg border-2 border-yellow-300">
                  <span className="text-3xl font-bold text-yellow-500 drop-shadow">{mainStats.total_xp}</span>
                  <span className="text-sm font-semibold text-yellow-700 mt-1">Total XP</span>
                </div>
                <div className="bg-white/90 rounded-xl px-6 py-4 flex flex-col items-center shadow-lg border-2 border-pink-300">
                  <span className="text-3xl font-bold text-pink-500 drop-shadow">{mainStats.streak}</span>
                  <span className="text-sm font-semibold text-pink-700 mt-1">Streak</span>
                </div>
                <div className="bg-white/90 rounded-xl px-6 py-4 flex flex-col items-center shadow-lg border-2 border-indigo-300">
                  <span className="text-3xl font-bold text-indigo-500 drop-shadow">{mainStats.habits_completed_percent}%</span>
                  <span className="text-sm font-semibold text-indigo-700 mt-1">Habits Completed Today</span>
                </div>
                <div className="bg-white/90 rounded-xl px-6 py-4 flex flex-col items-center shadow-lg border-2 border-green-300">
                  <span className="text-3xl font-bold text-green-500 drop-shadow">{mainStats.level}</span>
                  <span className="text-sm font-semibold text-green-700 mt-1">Level</span>
                </div>
              </div>
              {/* Subtle Achievements Badges Row */}
              <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start mt-1">
                <AchievementsBadgesRow />
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg animate-bounce">🏆</span>
              <span className="text-lg text-white/80 mt-2 font-semibold">Challenge your friends!</span>
            </div>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-10 flex flex-col md:flex-row items-center md:items-end gap-8 text-white relative overflow-hidden">
          <div className="flex flex-col items-center md:items-start flex-1">
            <Avatar className="h-24 w-24 mb-4 shadow-lg border-4 border-white/20">
              {/* You can add a profile image URL to AvatarImage if available */}
              <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || profile?.username || user.email} />
              <AvatarFallback className="text-3xl font-bold bg-indigo-500 text-white">{avatarFallback}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-lg">{profile?.display_name || profile?.username || user.email}</h1>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-3 py-1 text-base font-semibold flex items-center gap-1">
                <User className="w-4 h-4 mr-1" />
                @{profile?.username || user.email?.split('@')[0]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 flex items-center gap-1">
                <Mail className="w-4 h-4 mr-1" />
                {user.email}
              </Badge>
              <Badge variant="outline" className={`bg-white/10 text-white border-white/20 flex items-center gap-1 ${profile?.profile_visibility === 'public' ? 'border-green-400' : 'border-blue-400'}`}> 
                {profile?.profile_visibility === 'public' ? <Eye className="w-4 h-4 mr-1 text-green-300" /> : <EyeOff className="w-4 h-4 mr-1 text-blue-300" />}
                {profile?.profile_visibility === 'public' ? 'Public' : 'Private'}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 flex items-center gap-1">
                <Users className="w-4 h-4 mr-1" />
                {friends.length} Friends
              </Badge>
            </div>
            {profile?.bio && <p className="text-white/90 text-lg mt-2 max-w-xl drop-shadow-sm">{profile.bio}</p>}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-indigo-700">Habits</CardTitle>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="text-gray-500">No habits found.</div>
              ) : (
                <ul className="list-disc pl-5 space-y-1">
                  {habits.map((habit, i) => (
                    <li key={i} className="text-gray-800">
                      <span className="font-semibold">{habit.habit_name}</span> <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 border-0">{habit.habit_type}</Badge> <span className="text-xs text-gray-500">{habit.frequency}, Difficulty: {habit.difficulty}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-indigo-700">News Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {newsPreferences ? (
                <div className="space-y-1 text-gray-800">
                  <div><span className="font-semibold">Interests:</span> {newsPreferences.interests?.join(', ')}</div>
                  <div><span className="font-semibold">Frequency:</span> {newsPreferences.frequency}</div>
                  <div><span className="font-semibold">Preferred Time:</span> {newsPreferences.preferred_time || 'N/A'}</div>
                  <div><span className="font-semibold">Format:</span> {newsPreferences.format}</div>
                </div>
              ) : (
                <div className="text-gray-500">No news preferences found.</div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-pink-700">Nutrition Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionPreferences ? (
                <div className="space-y-1 text-gray-800">
                  <div><span className="font-semibold">Calories Target:</span> {nutritionPreferences.calories_target || 'N/A'}</div>
                  <div><span className="font-semibold">Protein Target:</span> {nutritionPreferences.protein_target || 'N/A'}g</div>
                  <div><span className="font-semibold">Carbs Target:</span> {nutritionPreferences.carbs_target || 'N/A'}g</div>
                  <div><span className="font-semibold">Fat Target:</span> {nutritionPreferences.fat_target || 'N/A'}g</div>
                  <div><span className="font-semibold">Fiber Target:</span> {nutritionPreferences.fiber_target || 'N/A'}g</div>
                  <div><span className="font-semibold">Sodium Limit:</span> {nutritionPreferences.sodium_limit || 'N/A'}mg</div>
                  <div><span className="font-semibold">Sugar Limit:</span> {nutritionPreferences.sugar_limit || 'N/A'}g</div>
                  <div><span className="font-semibold">Dietary Restrictions:</span> {nutritionPreferences.dietary_restrictions?.join(', ') || 'None'}</div>
                  <div><span className="font-semibold">Allergies:</span> {nutritionPreferences.allergies?.join(', ') || 'None'}</div>
                  <div><span className="font-semibold">Notes:</span> {nutritionPreferences.notes || 'None'}</div>
                </div>
              ) : (
                <div className="text-gray-500">No nutrition preferences found.</div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-pink-700">Fitness Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {fitnessGoals ? (
                <div className="space-y-1 text-gray-800">
                  <div><span className="font-semibold">Goal Type:</span> {fitnessGoals.goal_type || 'N/A'}</div>
                  <div><span className="font-semibold">Target Weight:</span> {fitnessGoals.target_weight || 'N/A'} kg</div>
                  <div><span className="font-semibold">Current Weight:</span> {fitnessGoals.current_weight || 'N/A'} kg</div>
                  <div><span className="font-semibold">Height:</span> {fitnessGoals.height || 'N/A'} cm</div>
                  <div><span className="font-semibold">Start Date:</span> {fitnessGoals.start_date || 'N/A'}</div>
                  <div><span className="font-semibold">End Date:</span> {fitnessGoals.end_date || 'N/A'}</div>
                  <div><span className="font-semibold">Notes:</span> {fitnessGoals.notes || 'None'}</div>
                </div>
              ) : (
                <div className="text-gray-500">No fitness goals found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Friends Card */}
        <Card className="shadow-lg border-0 bg-white/90">
          <CardHeader>
            <CardTitle className="text-indigo-700">Friends</CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-gray-500">No friends yet.</div>
            ) : (
              <ul className="flex flex-wrap gap-4">
                {friends.map((friend, i) => (
                  <li key={i} className="flex flex-col items-center bg-indigo-50 rounded-lg px-4 py-3 shadow-sm w-48">
                    <div className="flex flex-col items-center w-full cursor-pointer" onClick={() => navigate(`/user/${friend.username}`)}>
                      <Avatar className="h-10 w-10 mb-2">
                        <AvatarFallback className="bg-indigo-400 text-white font-bold">
                          {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-indigo-800 text-center">{friend.display_name || friend.username}</span>
                      {friend.bio && <span className="text-xs text-gray-500 text-center mt-1 block w-full">{friend.bio}</span>}
                    </div>
                    <AlertDialog open={unfriendDialog.open && unfriendDialog.friendUserId === friend.user_id} onOpenChange={open => setUnfriendDialog(open ? { open: true, friendUserId: friend.user_id, friendUsername: friend.display_name || friend.username } : { open: false, friendUserId: null, friendUsername: null })}>
                      <AlertDialogTrigger asChild>
                        <button
                          className="mt-2 px-3 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition"
                          onClick={e => {
                            e.stopPropagation();
                            setUnfriendDialog({ open: true, friendUserId: friend.user_id, friendUsername: friend.display_name || friend.username });
                          }}
                        >
                          Unfriend
                        </button>
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
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Friend Requests */}
        <Card className="shadow-lg border-0 bg-white/90 mb-8">
          <CardHeader>
            <CardTitle className="text-indigo-700 flex items-center gap-2"><UserPlus className="w-5 h-5" /> Friend Requests</CardTitle>
            <CardDescription>Manage your pending friend requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="font-semibold text-indigo-800 mb-2">Received Requests</div>
              {pendingFriendRequests.length === 0 ? (
                <div className="text-gray-500 text-sm">No pending requests.</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {pendingFriendRequests.map((req) => (
                    <li key={req.id} className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-2 shadow-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-400 text-white font-bold">
                          {(req.sender?.display_name || req.sender?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-indigo-800">{req.sender?.display_name || req.sender?.username}</span>
                      <Button size="sm" className="ml-auto bg-green-500 hover:bg-green-600 text-white" onClick={() => handleAcceptFriend(req.id)}><CheckCircle className="w-4 h-4 mr-1" />Accept</Button>
                      <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDeclineFriend(req.id)}><XCircle className="w-4 h-4 mr-1" />Decline</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="font-semibold text-indigo-800 mb-2">Sent Requests</div>
              {sentFriendRequests.length === 0 ? (
                <div className="text-gray-500 text-sm">No sent requests.</div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {sentFriendRequests.map((req) => (
                    <li key={req.id} className="flex items-center gap-3 bg-indigo-50 rounded-lg px-4 py-2 shadow-sm">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-400 text-white font-bold">
                          {(req.receiver?.display_name || req.receiver?.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-indigo-800">{req.receiver?.display_name || req.receiver?.username}</span>
                      <Badge variant="secondary" className="ml-auto bg-yellow-100 text-yellow-800 border-0">Pending</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Group Requests (simulated) */}
        <Card className="shadow-lg border-0 bg-white/90 mb-8">
          <CardHeader>
            <CardTitle className="text-indigo-700 flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Group Requests</CardTitle>
            <CardDescription>Groups you have requested to join (demo only)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500 text-sm">Group join requests will appear here when group join is implemented.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile; 