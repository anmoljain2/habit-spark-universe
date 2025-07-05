import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AchievementsBadgesRow } from '../components/AchievementBadge';
import { TrendingUp, Target, Flame, ArrowLeft, UserPlus, Trophy, Users } from 'lucide-react';
import { useProfile } from '@/components/ProfileContext';
import { useViewedProfile } from '@/hooks/useViewedProfile';

const UserProfile = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { profile: contextProfile, friends: contextFriends, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  // Use context for self, useViewedProfile for others
  const isSelf = username === contextProfile?.username;
  const {
    profile,
    mainStats,
    friends,
    isFriend,
    loading,
    addFriendLoading,
    handleAddFriend,
    handleUnfriend,
    error,
  } = useViewedProfile(username, user, isSelf, contextProfile, contextFriends, profileLoading);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen">
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

  // Privacy check: if not public, not self, and not friend
  if (profile.profile_visibility !== 'public' && user.id !== profile.user_id && !isFriend) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh] text-center">
          <div>
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">This profile is private</h2>
            <p className="text-gray-600">You do not have permission to view this user's profile.</p>
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
    <div className="min-h-screen">
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
              {profile.bio && <p className="text-gray-600 mb-2">{profile.bio}</p>}
              <div className="flex flex-wrap gap-4 mt-2">
                {stats.map(stat => (
                  <div key={stat.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${stat.color} text-white font-semibold shadow`}>
                    <stat.icon className="w-5 h-5" />
                    <span>{stat.label}:</span> <span>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Row */}
        <AchievementsBadgesRow />

        {/* Friends List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Friends</h2>
          </div>
          {friends.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No friends yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {friends.map((friend: any) => (
                <div key={friend.user_id} className="flex flex-col items-center gap-2">
                  <Avatar className="h-14 w-14 shadow-md">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                      {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-bold text-gray-800 text-lg">{friend.display_name || friend.username}</div>
                  <div className="text-sm text-gray-500">@{friend.username}</div>
                  {!isSelf && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => handleUnfriend(friend.user_id, friend.username)}
                    >
                      Unfriend
                    </Button>
                  )}
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
