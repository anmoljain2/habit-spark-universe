import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { AchievementsBadgesRow } from '../components/AchievementBadge';
import { TrendingUp, Target, Flame } from 'lucide-react';

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [mainStats, setMainStats] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!username || !user) return;
    setLoading(true);
    const fetchData = async () => {
      // Fetch user_id by username
      const { data: profileData } = await supabase.from('user_profiles').select('*').eq('username', username).single();
      console.log('Fetched profileData for viewed user:', profileData);
      setProfile(profileData);
      if (!profileData) {
        setUserId(null);
        setMainStats(null);
        setFriends([]);
        setIsFriend(false);
        setLoading(false);
        return;
      }
      setUserId(profileData.user_id);
      // Fetch stats for the viewed user
      const { data: stats } = await supabase.from('profiles').select('total_xp, streak, level, habits_completed_percent').eq('id', profileData.user_id).single();
      console.log('Fetched stats for viewed user:', stats);
      setMainStats(stats);

      // Fetch friends
      const { data: friendsData } = await supabase
        .from('friend_requests')
        .select('sender_id,receiver_id,status')
        .or(`sender_id.eq.${profileData.user_id},receiver_id.eq.${profileData.user_id}`)
        .eq('status', 'accepted');
      const friendIds = (friendsData || []).map((f: any) => f.sender_id === profileData.user_id ? f.receiver_id : f.sender_id);
      let friendProfiles: any[] = [];
      if (friendIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('user_profiles')
          .select('user_id,username,display_name,bio')
          .in('user_id', friendIds);
        friendProfiles = profilesData || [];
      }
      setFriends(friendProfiles);
      // Check if current user is a friend
      setIsFriend(friendIds.includes(user.id));
      setLoading(false);
    };
    fetchData();
  }, [username, user]);

  const handleAddFriend = async () => {
    setAddFriendLoading(true);
    if (!userId) return;
    await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: userId, status: 'pending' });
    setAddFriendLoading(false);
    // Optionally, you can show a toast or update UI
  };

  const handleUnfriend = async (friendUserId: string, friendUsername: string) => {
    if (!window.confirm(`Are you sure you want to unfriend ${friendUsername}?`)) return;
    // Delete all friend_requests rows between the two users
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${user.id})`);
    // Refresh friends list
    setFriends(friends.filter(f => f.user_id !== friendUserId));
    toast({ title: 'Unfriended', description: `You have unfriended ${friendUsername}.` });
  };

  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>User not found.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="w-full max-w-2xl mb-4 flex justify-start">
          <button
            className="px-4 py-2 rounded bg-indigo-100 text-indigo-700 font-semibold hover:bg-indigo-200 transition"
            onClick={() => {
              const from = location.state?.from;
              if (from === 'social') navigate('/social');
              else navigate('/profile');
            }}
          >
            ← Back
          </button>
        </div>
        {/* Compete Section (gradient card) */}
        <div className="relative z-10 mb-10">
          <div className="bg-gradient-to-br from-yellow-400 via-pink-400 to-indigo-500 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-4 border-white/80 animate-pulse-slow">
            <div className="flex-1 flex flex-col items-center md:items-start">
              <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">🔥 Compete with {profile?.display_name || profile?.username}</h2>
              <p className="text-white/90 mb-4 text-lg font-semibold drop-shadow">See how you stack up against your friends!</p>
              <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start mb-6">
                <div className="bg-white/90 rounded-xl px-8 py-6 flex flex-col items-center shadow-lg border-2 border-yellow-300">
                  <span className="text-4xl font-bold text-yellow-500 drop-shadow">{mainStats?.total_xp ?? 0}</span>
                  <span className="text-base font-semibold text-yellow-700 mt-1">Total XP</span>
                </div>
                <div className="bg-white/90 rounded-xl px-8 py-6 flex flex-col items-center shadow-lg border-2 border-pink-300">
                  <span className="text-4xl font-bold text-pink-500 drop-shadow">{mainStats?.streak ?? 0}</span>
                  <span className="text-base font-semibold text-pink-700 mt-1">Streak</span>
                </div>
                <div className="bg-white/90 rounded-xl px-8 py-6 flex flex-col items-center shadow-lg border-2 border-blue-300">
                  <span className="text-4xl font-bold text-blue-600 drop-shadow">{mainStats?.habits_completed_percent ?? 0}%</span>
                  <span className="text-base font-semibold text-blue-700 mt-1">Habits Completed Today</span>
                </div>
                <div className="bg-white/90 rounded-xl px-8 py-6 flex flex-col items-center shadow-lg border-2 border-green-300">
                  <span className="text-4xl font-bold text-green-600 drop-shadow">{mainStats?.level ?? 1}</span>
                  <span className="text-base font-semibold text-green-700 mt-1">Level</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-7xl font-extrabold text-white drop-shadow-lg animate-bounce">🏆</span>
              <span className="text-xl text-white/80 mt-2 font-semibold">Challenge your friends!</span>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <AchievementsBadgesRow />
        </div>
        {/* Purple Profile Box */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-10 flex flex-col md:flex-row items-center md:items-end gap-8 text-white relative overflow-hidden">
          <div className="flex flex-col items-center md:items-start flex-1">
            <Avatar className="h-24 w-24 mb-4 shadow-lg border-4 border-white/20">
              <AvatarFallback className="text-3xl font-bold bg-indigo-500 text-white">{(profile?.display_name || profile?.username || 'U')[0]}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-lg">{profile?.display_name || profile?.username}</h1>
              <span className="bg-white/20 text-white border-white/30 px-3 py-1 text-base font-semibold flex items-center gap-1 rounded-full">@{profile?.username}</span>
            </div>
            {profile?.bio && <p className="text-white/90 text-lg mt-2 max-w-xl drop-shadow-sm">{profile.bio}</p>}
            {isFriend ? (
              <Badge variant="default" className="ml-2">Your Friend</Badge>
            ) : (
              <Button onClick={handleAddFriend} className="ml-2" disabled={addFriendLoading}>
                {addFriendLoading ? 'Adding...' : 'Add Friend'}
              </Button>
            )}
          </div>
        </div>
        {/* Friends List */}
        <div className="shadow-lg border-0 bg-white/90 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Friends</h2>
          {friends.length === 0 ? (
            <div className="text-gray-500">No friends yet.</div>
          ) : (
            <ul className="flex flex-wrap gap-4">
              {friends.map((friend, i) => (
                <li key={i} className="flex flex-col items-center bg-indigo-50 rounded-lg px-4 py-3 shadow-sm w-48">
                  <div className="flex flex-col items-center w-full cursor-pointer" onClick={() => navigate(`/user/${friend.username}`, { state: { from: location.state?.from || null } })}>
                    <Avatar className="h-10 w-10 mb-2">
                      <AvatarFallback className="bg-indigo-400 text-white font-bold">
                        {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-indigo-800 text-center">{friend.display_name || friend.username}</span>
                    {friend.bio && <span className="text-xs text-gray-500 text-center mt-1 block w-full">{friend.bio}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 