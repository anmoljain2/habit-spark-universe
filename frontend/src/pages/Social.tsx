import React from 'react';
import { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Check, PlusCircle, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- SocialContext ---
interface SocialContextType {
  potentialFriends: any[];
  friends: any[];
  groups: any[];
  loading: boolean;
  addingFriend: string | null;
  joiningGroup: string | null;
  joinedGroups: string[];
  refreshSocial: () => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  joinGroup: (group: any) => Promise<void>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({ userId, children }) => {
  const [potentialFriends, setPotentialFriends] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const fetchSocial = useCallback(async () => {
    setLoading(true);
    // Fetch all users except current user
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('user_id,username,display_name,bio,profile_visibility')
      .neq('user_id', userId)
      .eq('profile_visibility', 'public');
    // Fetch current friends
    const { data: friendsData } = await supabase
      .from('friend_requests')
      .select('sender_id,receiver_id,status')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    const friendIds = (friendsData || []).map((f: any) => f.sender_id === userId ? f.receiver_id : f.sender_id);
    setFriends(friendIds);
    // Filter out users who are already friends
    const potentials = (allUsers || []).filter((u: any) => !friendIds.includes(u.user_id));
    setPotentialFriends(potentials);
    // Fetch groups from Supabase
    const { data: groupList } = await supabase
      .from('social_groups')
      .select('*');
    setGroups(groupList || []);
    // Set joinedGroups for current user
    setJoinedGroups((groupList || []).filter(g => Array.isArray(g.members) && g.members.includes(userId)).map(g => g.id));
    setLoading(false);
  }, [userId]);

  const refreshSocial = useCallback(async () => {
    await fetchSocial();
  }, [fetchSocial]);

  const addFriend = async (friendId: string) => {
    setAddingFriend(friendId);
    await supabase.from('friend_requests').insert({ sender_id: userId, receiver_id: friendId, status: 'pending' });
    setPotentialFriends(prev => prev.filter(f => f.user_id !== friendId));
    setAddingFriend(null);
  };

  const joinGroup = async (group: any) => {
    setJoiningGroup(group.id);
    if (group.visibility === 'public') {
      // Add user to members
      const newMembers = Array.isArray(group.members) ? [...group.members, userId] : [userId];
      await supabase
        .from('social_groups')
        .update({ members: newMembers })
        .eq('id', group.id);
      // Update user_profiles.group_ids
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('group_ids')
        .eq('user_id', userId)
        .single();
      const groupIds = userProfile?.group_ids || [];
      if (!groupIds.includes(group.id)) {
        await supabase
          .from('user_profiles')
          .update({ group_ids: [...groupIds, group.id] })
          .eq('user_id', userId);
      }
    } else {
      // Add user to pending_requests
      const newPending = Array.isArray(group.pending_requests) ? [...group.pending_requests, userId] : [userId];
      await supabase
        .from('social_groups')
        .update({ pending_requests: newPending })
        .eq('id', group.id);
    }
    await fetchSocial();
    setJoiningGroup(null);
  };

  React.useEffect(() => {
    if (userId) fetchSocial();
  }, [userId, fetchSocial]);

  return (
    <SocialContext.Provider value={{ potentialFriends, friends, groups, loading, addingFriend, joiningGroup, joinedGroups, refreshSocial, addFriend, joinGroup }}>
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within a SocialProvider');
  return ctx;
};

const Social = () => {
  const { user } = useAuth();
  const { potentialFriends, friends, groups, loading, addingFriend, joiningGroup, joinedGroups, refreshSocial, addFriend, joinGroup } = useSocial();
  const navigate = useNavigate();
  const [showJoinCelebration, setShowJoinCelebration] = useState<{ groupName: string } | null>(null);

  // Wrapper for joinGroup to show celebration
  const handleJoinGroup = async (group: any) => {
    await joinGroup(group);
    if (group.visibility === 'public') {
      setShowJoinCelebration({ groupName: group.name });
      setTimeout(() => setShowJoinCelebration(null), 2000);
    }
  };

  if (!user) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 px-4 py-2 rounded-full border border-purple-200 mb-6">
            <Heart className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Connect & Grow</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Social Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Connect with like-minded people, join communities, and grow together on your wellness journey.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Potential Friends */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Discover People</h2>
                <p className="text-gray-600">Connect with new friends and expand your network</p>
              </div>
            </div>

            {potentialFriends.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No new friend suggestions right now.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {potentialFriends.map((friend) => (
                  <div
                    key={friend.user_id}
                    className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer transform hover:-translate-y-1"
                    onClick={() => navigate(`/user/${friend.username}`)}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg">
                          {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 text-lg">
                          {friend.display_name || friend.username}
                        </div>
                        <div className="text-sm text-gray-500">@{friend.username}</div>
                        {friend.bio && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">{friend.bio}</div>
                        )}
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); addFriend(friend.user_id); }}
                        disabled={addingFriend === friend.user_id}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-shadow transition-transform duration-200"
                      >
                        {addingFriend === friend.user_id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                            Sent
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Groups */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/50 mt-8">
            {/* Celebration Popup */}
            {showJoinCelebration && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-gradient-to-br from-green-300 via-emerald-300 to-blue-400 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border-4 border-white/80 animate-pop">
                  <div className="text-6xl mb-4 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 text-center">Welcome to the Group!</h2>
                  <p className="text-lg text-white/90 font-semibold text-center mb-2">You've joined <span className='font-bold'>{showJoinCelebration.groupName}</span>! Connect, share, and grow together! 🚀</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
                <p className="text-gray-600">Join a group and grow together</p>
              </div>
            </div>
            {groups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups found</h3>
                <p className="text-gray-600">Be the first to create a group!</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {groups.map((group) => {
                  const isMember = Array.isArray(group.members) && group.members.includes(user.id);
                  const isPending = Array.isArray(group.pending_requests) && group.pending_requests.includes(user.id);
                  return (
                    <div
                      key={group.id}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                      onClick={() => navigate(`/group/${group.id.slice(0,6)}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="font-bold text-gray-800 text-lg">{group.name}</div>
                          {group.bio && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{group.bio}</div>}
                          <div className="text-xs text-gray-500 mt-1">{Array.isArray(group.members) ? group.members.length : 0} members</div>
                        </div>
                        <Button
                          onClick={e => { e.stopPropagation(); handleJoinGroup(group); }}
                          disabled={isMember || isPending || joiningGroup === group.id}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-shadow transition-transform duration-200"
                        >
                          {isMember ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Joined
                            </>
                          ) : isPending ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Pending
                            </>
                          ) : joiningGroup === group.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                              Joining
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Join Group
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialRouteWrapper = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <SocialProvider userId={user.id}>
      <Social />
    </SocialProvider>
  );
};

export default SocialRouteWrapper;
