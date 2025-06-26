
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Check, X, User, Users, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ProfileData {
  username: string;
  displayName: string;
  bio: string;
  visibility: 'public' | 'private';
}

interface SocialSetupStepProps {
  data: ProfileData;
  onUpdate: (profile: ProfileData) => void;
  onNext: () => void;
  onPrev: () => void;
}

const SocialSetupStep = ({ data, onUpdate, onNext, onPrev }: SocialSetupStepProps) => {
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const updateData = (field: keyof ProfileData, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim() || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const { data: result, error } = await supabase
        .rpc('check_username_availability', { username_to_check: username });

      if (error) throw error;
      setUsernameAvailable(result);
    } catch (error) {
      console.error('Error checking username:', error);
      toast({
        title: "Error",
        description: "Failed to check username availability",
        variant: "destructive",
      });
    } finally {
      setIsCheckingUsername(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (data.username) {
        checkUsernameAvailability(data.username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data.username]);

  const isValid = data.username.length >= 3 && 
                  data.displayName.trim() !== '' && 
                  usernameAvailable === true;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Set Up Your Profile</h3>
        <p className="text-gray-600">
          Create your profile to connect with friends and track progress together
        </p>
      </div>

      <div className="space-y-6">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <div className="relative">
            <Input
              id="username"
              placeholder="e.g., fitness_guru123"
              value={data.username}
              onChange={(e) => updateData('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`pr-10 ${usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : ''}`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isCheckingUsername ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
              ) : usernameAvailable === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : usernameAvailable === false ? (
                <X className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
          </div>
          {data.username.length > 0 && data.username.length < 3 && (
            <p className="text-sm text-red-500">Username must be at least 3 characters</p>
          )}
          {usernameAvailable === false && (
            <p className="text-sm text-red-500">Username is already taken</p>
          )}
          {usernameAvailable === true && (
            <p className="text-sm text-green-500">Username is available!</p>
          )}
          <p className="text-xs text-gray-500">
            This will be your unique identifier that others can use to find you
          </p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            placeholder="e.g., John Doe"
            value={data.displayName}
            onChange={(e) => updateData('displayName', e.target.value)}
          />
          <p className="text-xs text-gray-500">
            This is how your name will appear to other users
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself and your goals..."
            value={data.bio}
            onChange={(e) => updateData('bio', e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-gray-500">
            {data.bio.length}/200 characters
          </p>
        </div>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Privacy Settings</CardTitle>
            <CardDescription>
              Choose who can see your profile and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={data.visibility}
              onValueChange={(value: 'public' | 'private') => updateData('visibility', value)}
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <Label htmlFor="public" className="font-medium">Public Profile</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Anyone can see your profile, habits, and progress. Great for motivation and finding accountability partners.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <Label htmlFor="private" className="font-medium">Private Profile</Label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Only you and accepted friends can see your profile and progress. More privacy but less social motivation.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {data.visibility === 'public' && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              With a public profile, you'll appear in search results and others can send you friend requests. 
              You can always change this later in your settings.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: Content Preferences
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SocialSetupStep;
