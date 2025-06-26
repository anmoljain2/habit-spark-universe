import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '../components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, Check, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Social = () => {
  const { user } = useAuth();
  const [potentialFriends, setPotentialFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSocialData = async () => {
      if (!user) return;
      setLoading(true);
      // Fetch all users except current user
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('user_id,username,display_name,bio')
        .neq('user_id', user.id);
      // Fetch current friends
      const { data: friendsData } = await supabase
        .from('friend_requests')
        .select('sender_id,receiver_id,status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted');
      const friendIds = (friendsData || []).map((f: any) => f.sender_id === user.id ? f.receiver_id : f.sender_id);
      setFriends(friendIds);
      // Filter out users who are already friends
      const potentials = (allUsers || []).filter((u: any) => !friendIds.includes(u.user_id));
      setPotentialFriends(potentials);
      // Demo groups (static, since user_groups table does not exist)
      let groupList = [
        { id: '1', name: 'Morning Warriors', description: 'Early risers and morning routine lovers', members: 24 },
        { id: '2', name: 'Fitness Fanatics', description: 'Share workouts and motivate each other', members: 31 },
        { id: '3', name: 'Book Club', description: 'Read and discuss a new book every month', members: 17 },
        { id: '4', name: 'Mindfulness Circle', description: 'Meditation, journaling, and self-care', members: 12 },
      ];
      setGroups(groupList);
      setJoinedGroups([]); // No persistent group join state
      setLoading(false);
    };
    fetchSocialData();
  }, [user]);

  const handleAddFriend = async (friendId: string) => {
    setAddingFriend(friendId);
    await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: friendId, status: 'pending' });
    setPotentialFriends(potentialFriends.filter(f => f.user_id !== friendId));
    setAddingFriend(null);
  };

  const handleJoinGroup = async (groupId: string) => {
    setJoiningGroup(groupId);
    // Simulate join (replace with Supabase call if/when user_groups table exists)
    setTimeout(() => {
      setJoinedGroups((prev) => [...prev, groupId]);
      setJoiningGroup(null);
    }, 600);
  };

  if (!user) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Social</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Potential Friends */}
          <Card className="shadow-xl border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-indigo-700 flex items-center gap-2"><UserPlus className="w-6 h-6" /> Potential Friends</CardTitle>
              <CardDescription>Connect with new people and grow your circle</CardDescription>
            </CardHeader>
            <CardContent>
              {potentialFriends.length === 0 ? (
                <div className="text-gray-500">No new friends to suggest right now.</div>
              ) : (
                <ul className="flex flex-col gap-4">
                  {potentialFriends.map((friend) => (
                    <li key={friend.user_id} className="flex items-center gap-4 bg-indigo-50 rounded-lg px-4 py-3 shadow-sm cursor-pointer"
                      onClick={() => navigate(`/user/${friend.username}`)}>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-indigo-400 text-white font-bold text-xl">
                          {(friend.display_name || friend.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold text-indigo-800">{friend.display_name || friend.username}</div>
                        {friend.bio && <div className="text-xs text-gray-500 mt-1">{friend.bio}</div>}
                      </div>
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleAddFriend(friend.user_id); }}
                        disabled={addingFriend === friend.user_id}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
                      >
                        {addingFriend === friend.user_id ? <Check className="w-4 h-4 mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />}
                        {addingFriend === friend.user_id ? 'Request Sent' : 'Add Friend'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {/* Groups */}
          <Card className="shadow-xl border-0 bg-white/90">
            <CardHeader>
              <CardTitle className="text-indigo-700 flex items-center gap-2"><Users className="w-6 h-6" /> Groups</CardTitle>
              <CardDescription>Join a group to share, learn, and grow together</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {groups.map((group) => (
                  <li key={group.id} className="flex items-center gap-4 bg-indigo-50 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex-1">
                      <div className="font-semibold text-indigo-800 text-lg flex items-center gap-2">
                        {group.name}
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-0 px-2 py-0.5 text-xs">{group.members} members</Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{group.description}</div>
                    </div>
                    <Button
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={joiningGroup === group.id || joinedGroups.includes(group.id)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
                    >
                      {joinedGroups.includes(group.id) ? <Check className="w-4 h-4 mr-1" /> : <PlusCircle className="w-4 h-4 mr-1" />}
                      {joinedGroups.includes(group.id) ? 'Joined' : joiningGroup === group.id ? 'Joining...' : 'Join Group'}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Social; 