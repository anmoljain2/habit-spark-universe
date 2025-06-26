
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, BookOpen, Zap, FileText } from 'lucide-react';

interface NewsPreferences {
  interests: string[];
  frequency: string;
  preferredTime?: string;
  format: 'headlines' | 'summaries' | 'deep_dive';
}

interface NewsPreferencesStepProps {
  data: NewsPreferences;
  onUpdate: (preferences: NewsPreferences) => void;
  onComplete: () => void;
  onPrev: () => void;
  loading: boolean;
}

const NewsPreferencesStep = ({ data, onUpdate, onComplete, onPrev, loading }: NewsPreferencesStepProps) => {
  const availableInterests = [
    'Health & Fitness',
    'Technology',
    'Science',
    'Business',
    'Personal Development',
    'Productivity',
    'Mental Health',
    'Nutrition',
    'Sports',
    'Environment',
    'Finance',
    'Education',
    'Psychology',
    'Mindfulness',
    'Career Growth'
  ];

  const updateInterests = (interest: string, checked: boolean) => {
    const newInterests = checked
      ? [...data.interests, interest]
      : data.interests.filter(i => i !== interest);
    
    onUpdate({ ...data, interests: newInterests });
  };

  const updateData = (field: keyof NewsPreferences, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Personalize Your Learning</h3>
        <p className="text-gray-600">
          Get curated news and educational content tailored to your interests
        </p>
      </div>

      <div className="space-y-6">
        {/* Interests */}
        <Card>
          <CardHeader>
            <CardTitle>What interests you?</CardTitle>
            <CardDescription>
              Select topics you'd like to receive content about (choose at least 3)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-3">
              {availableInterests.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={data.interests.includes(interest)}
                    onCheckedChange={(checked) => updateInterests(interest, checked as boolean)}
                  />
                  <Label htmlFor={interest} className="text-sm">
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Selected: {data.interests.length} topic{data.interests.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        {/* Content Format */}
        <Card>
          <CardHeader>
            <CardTitle>Content Format</CardTitle>
            <CardDescription>
              How would you like to receive your content?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.format === 'headlines' ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => updateData('format', 'headlines')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Quick Headlines</h4>
                    <p className="text-sm text-gray-600">
                      Brief headlines and key points - perfect for busy schedules
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.format === 'summaries' ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => updateData('format', 'summaries')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Detailed Summaries</h4>
                    <p className="text-sm text-gray-600">
                      Comprehensive summaries with key insights and takeaways
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  data.format === 'deep_dive' ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => updateData('format', 'deep_dive')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Deep Dive Articles</h4>
                    <p className="text-sm text-gray-600">
                      In-depth analysis and educational content for thorough understanding
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Preferences */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="frequency">Content Frequency</Label>
            <Select
              value={data.frequency}
              onValueChange={(value) => updateData('frequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="every_other_day">Every Other Day</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi_weekly">Bi-weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferred-time">Preferred Time (Optional)</Label>
            <Input
              id="preferred-time"
              type="time"
              value={data.preferredTime || ''}
              onChange={(e) => updateData('preferredTime', e.target.value)}
            />
            <p className="text-xs text-gray-500">
              When would you like to receive your content?
            </p>
          </div>
        </div>

        {/* Preview */}
        {data.interests.length > 0 && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-lg">Your Content Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Topics:</strong> {data.interests.slice(0, 3).join(', ')}
                  {data.interests.length > 3 && ` +${data.interests.length - 3} more`}
                </p>
                <p className="text-sm">
                  <strong>Format:</strong> {data.format.replace('_', ' ').charAt(0).toUpperCase() + data.format.slice(1).replace('_', ' ')}
                </p>
                <p className="text-sm">
                  <strong>Frequency:</strong> {data.frequency.replace('_', ' ').charAt(0).toUpperCase() + data.frequency.slice(1).replace('_', ' ')}
                </p>
                {data.preferredTime && (
                  <p className="text-sm">
                    <strong>Delivery Time:</strong> {data.preferredTime}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={onComplete} 
          disabled={loading || data.interests.length < 3}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? 'Setting up your account...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
};

export default NewsPreferencesStep;
