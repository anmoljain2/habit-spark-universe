import { useProfile } from '../components/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Eye, EyeOff, Users, UserPlus, XCircle, CheckCircle, Users as UsersIcon, Trophy, Target, Zap, Crown, Star, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AchievementsBadgesRow } from '../components/AchievementBadge';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { profile, habits, newsPreferences, nutritionPreferences, fitnessGoals, friends, loading } = useProfile();
  const navigate = useNavigate();
  const [unfriendDialog, setUnfriendDialog] = useState<{ open: boolean, friendUserId: string | null, friendUsername: string | null }>({ open: false, friendUserId: null, friendUsername: null });
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [ownedGroup, setOwnedGroup] = useState<any | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);

  // Accept/decline friend request
  const handleAcceptFriend = async (requestId: string) => {
    // Implementation of handleAcceptFriend
  };
  const handleDeclineFriend = async (requestId: string) => {
    // Implementation of handleDeclineFriend
  };

  const handleUnfriend = async (friendUserId: string, friendUsername: string) => {
    console.log('Unfriending:', { userId: profile.user_id, friendUserId });
    let error1 = null, error2 = null;
    // Implementation of handleUnfriend
    if (error1 || error2) {
      console.error('Unfriend error:', error1 || error2);
      toast({ title: 'Error', description: `Failed to unfriend: ${(error1 || error2)?.message}`, variant: 'destructive' });
    } else {
      // Implementation of handleUnfriend
      toast({ title: 'Unfriended', description: `You have unfriended ${friendUsername}.` });
      setUnfriendDialog({ open: false, friendUserId: null, friendUsername: null });
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      setGroupsLoading(true);
      if (!profile?.user_id) return;
      // Fetch groups where user is a member (JSONB array)
      const { data: memberGroups } = await supabase
        .from('social_groups')
        .select('*')
        .contains('members', [String(profile.user_id)]);
      setUserGroups(memberGroups?.filter(g => g.owner !== profile.user_id) || []);
      // Fetch group where user is owner
      const { data: owned } = await supabase
        .from('social_groups')
        .select('*')
        .eq('owner', profile.user_id)
        .single();
      setOwnedGroup(owned || null);
      setGroupsLoading(false);
    };
    fetchGroups();
  }, [profile?.user_id]);

  if (!profile) return null;
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-600 text-lg">Loading your profile...</p>
      </div>
    </div>
  );

  // Avatar fallback: first letter of display name or username
  const avatarFallback = (profile?.display_name || profile?.username || profile?.user?.email || '')?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-8">
        {/* Hero Profile Section */}
        <div className="relative mb-10">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
          {/* Edit Profile Button */}
          <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 border border-white/20 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <Crown className="w-16 h-16 text-white" />
            </div>
            {/* Edit Profile Button - bottom right */}
            <Link
              to="/profile/edit"
              className="absolute bottom-6 right-8 z-10 px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Edit Profile
            </Link>
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center lg:items-start">
                <Avatar className="h-32 w-32 mb-6 shadow-2xl border-4 border-white/30 ring-4 ring-white/20">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || profile?.username || profile?.user?.email || ''} />
                  <AvatarFallback className="text-5xl font-bold bg-gradient-to-br from-white/20 to-white/10 text-white backdrop-blur-sm">{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                    {profile?.display_name || profile?.username || profile?.user?.email || 'Unknown'}
                  </h1>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-4">
                    <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-base font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <User className="w-4 h-4 mr-2" />
                      @{profile?.username || (profile?.user?.email ? profile.user.email.split('@')[0] : 'unknown')}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-base font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors">
                      <Mail className="w-4 h-4 mr-2" />
                      {profile?.user?.email || 'Unknown'}
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
                      <p className="text-3xl font-bold text-white drop-shadow">{profile.total_xp}</p>
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
                      <p className="text-3xl font-bold text-white drop-shadow">{profile.streak}</p>
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
                      <p className="text-3xl font-bold text-white drop-shadow">{profile.level}</p>
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
                      <p className="text-3xl font-bold text-white drop-shadow">{profile.habits_completed_percent}%</p>
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
                        {newsPreferences.interests.map((interest: string, i: number) => (
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
                      <p className="font-semibold text-gray-800">{newsPreferences.format ? newsPreferences.format.replace(/_/g, ' ') : ''}</p>
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
                  {/* Macronutrients */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Calories</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.calories_target ?? 'N/A'}</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Protein</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.protein_target ?? 'N/A'}g</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Carbs</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.carbs_target ?? 'N/A'}g</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Fat</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.fat_target ?? 'N/A'}g</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-600">Fiber</p>
                      <p className="font-bold text-green-600">{nutritionPreferences.fiber_target ?? 'N/A'}g</p>
                    </div>
                  </div>
                  {/* Limits */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Sodium Limit</p>
                      <p className="font-bold text-yellow-700">{nutritionPreferences.sodium_limit ?? 'N/A'}mg</p>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Sugar Limit</p>
                      <p className="font-bold text-yellow-700">{nutritionPreferences.sugar_limit ?? 'N/A'}g</p>
                    </div>
                  </div>
                  {/* Dietary Restrictions */}
                  {nutritionPreferences.dietary_restrictions && nutritionPreferences.dietary_restrictions.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Dietary Restrictions</h4>
                      <div className="flex flex-wrap gap-2">
                        {nutritionPreferences.dietary_restrictions.map((restriction: string, i: number) => (
                          <Badge key={i} className="bg-orange-100 text-orange-700 border-0 text-xs">
                            {restriction}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Allergies */}
                  {nutritionPreferences.allergies && nutritionPreferences.allergies.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Allergies</h4>
                      <div className="flex flex-wrap gap-2">
                        {nutritionPreferences.allergies.map((allergy: string, i: number) => (
                          <Badge key={i} className="bg-red-100 text-red-700 border-0 text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Notes */}
                  {nutritionPreferences.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                      <p className="text-gray-700 text-sm">{nutritionPreferences.notes}</p>
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

          {/* Saved Meal Plan Contexts */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Saved Meal Plan Contexts
              </CardTitle>
              <CardDescription className="text-gray-600">Feedback and preferences you've saved for meal planning</CardDescription>
            </CardHeader>
            <CardContent>
              {nutritionPreferences && Array.isArray(nutritionPreferences.contexts) && nutritionPreferences.contexts.length > 0 ? (
                <ul className="list-disc ml-6 space-y-2">
                  {nutritionPreferences.contexts.map((context: string, i: number) => (
                    <li key={i} className="text-gray-800 bg-green-50 rounded-lg px-4 py-2 shadow-sm border border-green-100">{context}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-gray-500">No saved contexts yet.</div>
              )}
            </CardContent>
          </Card>

          {/* Financial Profile Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                Financial Snapshot
              </CardTitle>
              <CardDescription className="text-gray-600">Your current financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementation of financial profile section */}
            </CardContent>
          </Card>

          {/* Fitness Goals */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Fitness Goals
              </CardTitle>
              <CardDescription className="text-gray-600">Your health and fitness objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementation of fitness goals section */}
            </CardContent>
          </Card>

          {/* Journal Questions Section */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Journal Prompts
              </CardTitle>
              <CardDescription className="text-gray-600">Your selected daily reflection questions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Implementation of journal questions section */}
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
                  Received
                </h4>
                {/* Pending friend requests UI removed for context-based profile */}
              </div>

              {/* Sent Requests */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Sent
                </h4>
                {/* Sent friend requests UI removed for context-based profile */}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Section */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-green-600" />
              My Groups
            </CardTitle>
            <CardDescription className="text-gray-600">Your group memberships and ownership</CardDescription>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading groups...</div>
            ) : (
              <>
                {/* All Groups (owned group at top, with (owner) label) */}
                <div>
                  <div className="font-semibold text-gray-800 mb-2">Groups You're In</div>
                  {(!ownedGroup && userGroups.length === 0) ? (
                    <div className="text-gray-500 text-sm mb-4">You're not a member of any groups yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {/* Owned group at top if exists */}
                      {ownedGroup && (
                        <div
                          key={ownedGroup.id}
                          className="p-3 rounded-lg border-2 border-green-300 bg-green-50 flex flex-col gap-2 cursor-pointer hover:bg-green-100"
                          onClick={() => navigate(`/group/${ownedGroup.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-green-800 flex items-center gap-2">{ownedGroup.name} <span className="text-xs font-semibold text-green-700">(owner)</span></div>
                            {ownedGroup.bio && <div className="text-xs text-gray-700 ml-2">{ownedGroup.bio}</div>}
                            <div className="text-xs text-gray-500 ml-auto">{Array.isArray(ownedGroup.members) ? ownedGroup.members.length : 0} members</div>
                          </div>
                          {/* Join Requests Section for Private Groups */}
                          {ownedGroup.visibility === 'private' && Array.isArray(ownedGroup.pending_requests) && ownedGroup.pending_requests.length > 0 && (
                            <div className="mt-2 bg-white/80 rounded-lg p-3 border border-green-200">
                              <div className="font-semibold text-green-700 mb-2">Join Requests</div>
                              <ul className="space-y-2">
                                {ownedGroup.pending_requests.map((userId: string) => (
                                  <li key={userId} className="flex items-center gap-2">
                                    <span className="text-gray-800">{userId}</span>
                                    <Button size="sm" className="bg-green-500 text-white" onClick={async (e) => {
                                      e.stopPropagation();
                                      // Approve: add to members, remove from pending_requests
                                      const newMembers = [...(ownedGroup.members || []), userId];
                                      const newPending = (ownedGroup.pending_requests || []).filter((id: string) => id !== userId);
                                      await supabase.from('social_groups').update({ members: newMembers, pending_requests: newPending }).eq('id', ownedGroup.id);
                                      setOwnedGroup({ ...ownedGroup, members: newMembers, pending_requests: newPending });
                                    }}>Approve</Button>
                                    <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={async (e) => {
                                      e.stopPropagation();
                                      // Decline: just remove from pending_requests
                                      const newPending = (ownedGroup.pending_requests || []).filter((id: string) => id !== userId);
                                      await supabase.from('social_groups').update({ pending_requests: newPending }).eq('id', ownedGroup.id);
                                      setOwnedGroup({ ...ownedGroup, pending_requests: newPending });
                                    }}>Decline</Button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Other groups */}
                      {userGroups.map((group) => (
                        <div
                          key={group.id}
                          className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-2 cursor-pointer hover:bg-gray-100"
                          onClick={() => navigate(`/group/${group.id}`)}
                        >
                          <div className="font-bold text-gray-800 flex items-center gap-2">{group.name}{group.owner === profile.user_id && <span className="text-xs font-semibold text-green-700">(owner)</span>}</div>
                          {group.bio && <div className="text-xs text-gray-600 ml-2">{group.bio}</div>}
                          <div className="text-xs text-gray-500 ml-auto">{Array.isArray(group.members) ? group.members.length : 0} members</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Create Group button if not owner */}
                {!ownedGroup && (
                  <div className="mt-6 text-center">
                    <Button
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300"
                      onClick={() => navigate('/create-group')}
                    >
                      Create Your Group
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
