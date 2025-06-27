
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AchievementsBadgesRow } from '../components/AchievementBadge';
import { TrendingUp, Target, Flame, ArrowLeft, UserPlus, Trophy, Users } from 'lucide-react';

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
    toast({ title: 'Friend request sent!', description: 'Your friend request has been sent.' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
            <p className="text-gray-600">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total XP', value: mainStats?.total_xp ?? 0, color: 'from-yellow-400 to-orange-500', icon: Trophy },
    { label: 'Current Streak', value: `${mainStats?.streak ?? 0} days`, color: 'from-orange-400 to-red-500', icon: Flame },
    { label: 'Today\'s Progress', value: `${mainStats?.habits_completed_percent ?? 0}%`, color: 'from-green-400 to-emerald-500', icon: Target },
    { label: 'Level', value: mainStats?.level ?? 1, color: 'from-purple-400 to-indigo-500', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-white/50 text-gray-700 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => {
              const from = location.state?.from;
              if (from === 'social') navigate('/social');
              else navigate('/profile');
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/50">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 shadow-lg border-4 border-white/50">
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                {(profile?.display_name || profile?.username || 'U')[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{profile?.display_name || profile?.username}</h1>
                  <p className="text-gray-500">@{profile?.username}</p>
                </div>
                
                <div className="flex gap-2">
                  {isFriend ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <Users className="w-4 h-4 mr-1" />
                      Friend
                    </Badge>
                  ) : (
                    <Button 
                      onClick={handleAddFriend} 
                      disabled={addFriendLoading}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      {addFriendLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      {addFriendLoading ? 'Sending...' : 'Add Friend'}
                    </Button>
                  )}
                </div>
              </div>
              
              {profile?.bio && (
                <p className="text-gray-600 text-lg max-w-2xl">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.color} mb-3`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <AchievementsBadgesRow />
        </div>

        {/* Friends List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Friends</h2>
              <p className="text-gray-600">{friends.length} connections</p>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Friends Yet</h3>
              <p className="text-gray-600">This user hasn't connected with anyone yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {friends.map((friend, i) => (
                <div
                  key={i}
                  className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/user/${friend.username}`, { state: { from: location.state?.from || null } })}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                        {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">
                        {friend.display_name || friend.username}
                      </div>
                      <div className="text-sm text-gray-500 truncate">@{friend.username}</div>
                      {friend.bio && (
                        <div className="text-xs text-gray-400 mt-1 truncate">{friend.bio}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
