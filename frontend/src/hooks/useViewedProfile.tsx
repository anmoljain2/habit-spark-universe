import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useViewedProfile(
  username: string | undefined,
  currentUser: any,
  isSelf: boolean,
  contextProfile: any,
  contextFriends: any[],
  profileLoading: boolean
) {
  const [profile, setProfile] = useState<any>(null);
  const [mainStats, setMainStats] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addFriendLoading, setAddFriendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username || !currentUser) return;
    if (isSelf) {
      setProfile(contextProfile);
      setFriends(contextFriends);
      setIsFriend(false);
      setLoading(profileLoading);
      setMainStats(contextProfile?.mainStats || null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      // Fetch user_id by username
      const { data: profileData, error: profileError } = await supabase.from('user_profiles').select('*').eq('username', username).single();
      if (profileError || !profileData) {
        setProfile(null);
        setMainStats(null);
        setFriends([]);
        setIsFriend(false);
        setLoading(false);
        setError('User not found');
        return;
      }
      setProfile(profileData);
      // Fetch stats for the viewed user
      const { data: stats } = await supabase.from('profiles').select('total_xp, streak, level, habits_completed_percent').eq('id', profileData.user_id).single();
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
      setIsFriend(friendIds.includes(currentUser.id));
      setLoading(false);
      setError(null);
    };
    fetchData();
    // eslint-disable-next-line
  }, [username, currentUser, isSelf, contextProfile, contextFriends, profileLoading]);

  const handleAddFriend = useCallback(async () => {
    if (!profile?.user_id || !currentUser) return;
    setAddFriendLoading(true);
    await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: profile.user_id, status: 'pending' });
    setAddFriendLoading(false);
    toast({ title: 'Friend request sent!', description: 'Your friend request has been sent.' });
  }, [profile, currentUser]);

  const handleUnfriend = useCallback(async (friendUserId: string, friendUsername: string) => {
    if (!window.confirm(`Are you sure you want to unfriend ${friendUsername}?`)) return;
    await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${currentUser.id})`);
    setFriends(friends.filter(f => f.user_id !== friendUserId));
    toast({ title: 'Unfriended', description: `You have unfriended ${friendUsername}.` });
  }, [currentUser, friends]);

  return {
    profile,
    mainStats,
    friends,
    isFriend,
    loading,
    addFriendLoading,
    handleAddFriend,
    handleUnfriend,
    error,
  };
} 