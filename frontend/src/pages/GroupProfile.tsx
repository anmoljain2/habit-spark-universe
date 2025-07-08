import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '../components/ProfileContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import GroupEditQuestionnaire from '../components/GroupEditQuestionnaire';

export default function GroupProfile() {
  const { groupId } = useParams();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<any[]>([]);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [showJoinCelebration, setShowJoinCelebration] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchGroup() {
      setLoading(true);
      // Step 1: Find the full group ID by snippet
      let fullGroupId = null;
      let groupData = null;
      console.log('[GroupProfile][DEBUG] groupId param from URL:', groupId);
      // Fetch all groups whose id starts with the snippet (client-side filter for now)
      const { data: groups, error } = await supabase
        .from('social_groups')
        .select('id');
      if (error) {
        console.error('[GroupProfile][DEBUG] Supabase error fetching group IDs:', error);
        setGroup(null);
        setLoading(false);
        return;
      }
      console.log('[GroupProfile][DEBUG] All group IDs fetched:', groups?.map(g => g.id));
      if (Array.isArray(groups)) {
        const match = groups.find(g => g.id.startsWith((groupId || '').toLowerCase()));
        if (match) {
          fullGroupId = match.id;
          console.log('[GroupProfile][DEBUG] Matched fullGroupId:', fullGroupId);
        } else {
          console.warn('[GroupProfile][DEBUG] No group found for snippet:', groupId);
        }
      }
      if (!fullGroupId) {
        setGroup(null);
        setLoading(false);
        return;
      }
      // Step 2: Fetch the group by full ID
      const { data: group, error: groupError } = await supabase
        .from('social_groups')
        .select('*, owner:owner(*), members, pending_requests')
        .eq('id', fullGroupId)
        .single();
      if (groupError) {
        console.error('[GroupProfile][DEBUG] Error fetching group by full ID:', groupError);
        setGroup(null);
        setLoading(false);
        return;
      }
      groupData = group;
      console.log('[GroupProfile][DEBUG] Group data fetched:', groupData);
      setGroup(groupData);
      setIsMember(Array.isArray(groupData?.members) && profile?.user_id && groupData.members.includes(profile.user_id));
      setLoading(false);
      // Fetch member profiles
      if (Array.isArray(groupData?.members) && groupData.members.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id,username,display_name')
          .in('user_id', groupData.members);
        console.log('[GroupProfile][DEBUG] Member profiles fetched:', profiles);
        setMemberProfiles(profiles || []);
      } else {
        setMemberProfiles([]);
      }
    }
    if (groupId && profile?.user_id) fetchGroup();
  }, [groupId, profile?.user_id]);

  // Join group logic
  async function joinGroup() {
    if (!group || !profile?.user_id) return;
    setJoining(true);
    if (group.visibility === 'public') {
      const newMembers = Array.isArray(group.members) ? [...group.members, profile.user_id] : [profile.user_id];
      await supabase.from('social_groups').update({ members: newMembers }).eq('id', group.id);
      // Add groupId to user's group_ids
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('group_ids')
        .eq('user_id', profile.user_id)
        .single();
      const groupIds = userProfile?.group_ids || [];
      if (!groupIds.includes(group.id)) {
        await supabase.from('user_profiles').update({ group_ids: [...groupIds, group.id] }).eq('user_id', profile.user_id);
      }
      setGroup({ ...group, members: newMembers });
      setIsMember(true);
      setShowJoinCelebration(true);
      setTimeout(() => setShowJoinCelebration(false), 2000);
    } else {
      const newPending = Array.isArray(group.pending_requests) ? [...group.pending_requests, profile.user_id] : [profile.user_id];
      await supabase.from('social_groups').update({ pending_requests: newPending }).eq('id', group.id);
      setGroup({ ...group, pending_requests: newPending });
    }
    setJoining(false);
  }

  // Remove member logic (for owner)
  async function removeMember(userId: string) {
    if (!group || !profile?.user_id || group.owner !== profile.user_id) return;
    const newMembers = (group.members || []).filter((id: string) => id !== userId);
    await supabase.from('social_groups').update({ members: newMembers }).eq('id', group.id);
    // Remove groupId from user's group_ids
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('group_ids')
      .eq('user_id', userId)
      .single();
    const groupIds = userProfile?.group_ids || [];
    if (groupIds.includes(group.id)) {
      await supabase.from('user_profiles').update({ group_ids: groupIds.filter((id: string) => id !== group.id) }).eq('user_id', userId);
    }
    setGroup({ ...group, members: newMembers });
  }

  // Send chat message
  async function sendChatMessage() {
    if (!group || !profile?.user_id || !chatInput.trim()) return;
    setSendingChat(true);
    const newChat = {
      user_id: profile.user_id,
      username: profile.display_name || profile.username || 'User',
      message: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    const updatedChats = Array.isArray(group.chats) ? [...group.chats, newChat] : [newChat];
    await supabase.from('social_groups').update({ chats: updatedChats, last_message_at: newChat.timestamp }).eq('id', group.id);
    setGroup({ ...group, chats: updatedChats, last_message_at: newChat.timestamp });
    setChatInput('');
    setSendingChat(false);
  }

  // Leave group logic (for members)
  async function leaveGroup() {
    if (!group || !profile?.user_id) return;
    // Remove user from group members
    const newMembers = (group.members || []).filter((id: string) => id !== profile.user_id);
    await supabase.from('social_groups').update({ members: newMembers }).eq('id', group.id);
    // Remove groupId from user's group_ids
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('group_ids')
      .eq('user_id', profile.user_id)
      .single();
    const groupIds = userProfile?.group_ids || [];
    if (groupIds.includes(group.id)) {
      await supabase.from('user_profiles').update({ group_ids: groupIds.filter((id: string) => id !== group.id) }).eq('user_id', profile.user_id);
    }
    setGroup({ ...group, members: newMembers });
    setIsMember(false);
    navigate('/profile');
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center">Group not found.</div>;

  const isPublic = group.visibility === 'public';
  const owner = group.owner || {};

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Celebration Popup */}
      {showJoinCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-gradient-to-br from-green-300 via-emerald-300 to-blue-400 rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center border-4 border-white/80 animate-pop">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-extrabold text-white drop-shadow mb-2 text-center">Welcome to the Group!</h2>
            <p className="text-lg text-white/90 font-semibold text-center mb-2">You've joined <span className='font-bold'>{group.name}</span>! Connect, share, and grow together! 🚀</p>
          </div>
        </div>
      )}
      {/* Back Button */}
      <div className="mb-6">
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-white/50 text-gray-700 hover:bg-white/90 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => {
            if (window.history.length > 2) navigate(-1);
            else navigate('/social');
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-green-200 text-green-800 font-bold text-2xl">
                {group.name?.[0]?.toUpperCase() || 'G'}
              </AvatarFallback>
            </Avatar>
            {group.name}
          </CardTitle>
          {/* Join Group Button or In Group label */}
          <div className="mt-2">
            {isMember && profile?.user_id !== group.owner ? (
              <>
                <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold mr-3">In Group</span>
                <Button
                  className="bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 hover:text-red-900 font-semibold"
                  variant="outline"
                  onClick={() => setLeaveDialog(true)}
                >
                  Leave Group
                </Button>
                <AlertDialog open={leaveDialog} onOpenChange={setLeaveDialog}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave {group.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave <span className="font-semibold">{group.name}</span> group? You will lose access to group chat and content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setLeaveDialog(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={leaveGroup}>Leave Group</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : profile?.user_id === group.owner ? (
              <>
                <span className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold mr-3">In Group (Owner)</span>
                <Button
                  className="bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:text-blue-900 font-semibold ml-2"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Group
                </Button>
                {showEditModal && (
                  <GroupEditQuestionnaire
                    group={group}
                    onClose={() => setShowEditModal(false)}
                    onSaved={async (updatedGroup) => {
                      setGroup(updatedGroup);
                      setShowEditModal(false);
                    }}
                  />
                )}
              </>
            ) : (
              <Button
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold mt-2"
                onClick={joinGroup}
                disabled={joining}
              >
                {joining ? 'Joining...' : 'Join Group'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-lg font-semibold">Owner:</div>
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-200 text-gray-700 font-bold">
                {owner.display_name?.[0]?.toUpperCase() || owner.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="font-bold text-gray-800">{owner.display_name || owner.username || 'Unknown'}</span>
          </div>
          <div className="text-gray-700 mb-2"><span className="font-semibold">Description:</span> {group.description || 'No description.'}</div>
          <div className="text-gray-700 mb-2"><span className="font-semibold">Bio:</span> {group.bio || 'No bio.'}</div>
          <div className="text-gray-700 mb-2"><span className="font-semibold">Visibility:</span> {group.visibility}</div>
          {/* Show more info if public or member */}
          {(isPublic || isMember) ? (
            <>
              <div className="text-gray-700 mb-2"><span className="font-semibold">Members:</span> {Array.isArray(group.members) ? group.members.length : 0}</div>
              {/* List member names if available, and allow owner to remove */}
              {Array.isArray(group.members) && group.members.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {group.members.map((memberId: string) => {
                    const member = memberProfiles.find((m: any) => m.user_id === memberId);
                    return (
                      <li key={memberId} className="flex items-center gap-2">
                        <span className="text-gray-800">
                          {memberId === group.owner
                            ? `Owner (You)`
                            : member?.display_name || member?.username || memberId}
                        </span>
                        {/* Show REMOVE button for non-owner members if current user is owner */}
                        {profile?.user_id === group.owner && memberId !== group.owner && (
                          <AlertDialog open={removingMember === memberId} onOpenChange={open => setRemovingMember(open ? memberId : null)}>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="ml-auto bg-red-100 text-red-700 border-red-200 hover:bg-red-200 hover:text-red-900"
                                onClick={() => setRemovingMember(memberId)}
                              >
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove {member?.display_name || member?.username || 'this user'} from the group?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove this member? They will lose access to the group immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setRemovingMember(null)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { removeMember(memberId); setRemovingMember(null); }}>Remove</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {/* Group Chat Section */}
              <div className="mt-8">
                <div className="font-semibold text-lg text-emerald-700 mb-2">Group Chat</div>
                {isMember ? (
                  <>
                    <div className="bg-white/80 rounded-lg border border-emerald-200 p-4 max-h-64 overflow-y-auto space-y-3">
                      {Array.isArray(group.chats) && group.chats.length > 0 ? (
                        group.chats.map((chat: any, idx: number) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-800">{chat.username}</span>
                              <span className="text-xs text-gray-500">{new Date(chat.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="text-gray-800 ml-2">{chat.message}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 italic">No messages yet. Start the conversation!</div>
                      )}
                    </div>
                    <form className="flex gap-2 mt-4" onSubmit={e => { e.preventDefault(); sendChatMessage(); }}>
                      <input
                        type="text"
                        className="flex-1 border rounded px-3 py-2"
                        placeholder="Type your message..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        disabled={sendingChat}
                      />
                      <Button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold" disabled={sendingChat || !chatInput.trim()}>
                        Send
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="text-gray-400 italic">Join the group to view and participate in the chat.</div>
                )}
                {group.last_message_at && (
                  <div className="text-xs text-gray-500 mt-2">Last message: {new Date(group.last_message_at).toLocaleString()}</div>
                )}
              </div>
              {/* Chats, etc. can be added here */}
              <div className="mt-4">Member list and chat above.</div>
            </>
          ) : (
            <div className="text-gray-500 italic mt-4">This is a private group. Join to see more.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 