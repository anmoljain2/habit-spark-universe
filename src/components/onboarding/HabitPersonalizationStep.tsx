import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface Habit {
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  frequency: string;
  reminderTime?: string;
  difficulty: string;
  estimatedMinutes?: number;
  streak?: number;
}

interface HabitPersonalizationStepProps {
  data: Habit[];
  onUpdate: (habits: Habit[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

const HabitPersonalizationStep = ({ data, onUpdate, onNext, onPrev }: HabitPersonalizationStepProps) => {
  const [newHabit, setNewHabit] = useState<Habit>({
    name: '',
    type: 'positive',
    frequency: 'daily',
    difficulty: 'medium'
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const addHabit = () => {
    if (newHabit.name.trim()) {
      onUpdate([...data, { ...newHabit }]);
      setNewHabit({
        name: '',
        type: 'positive',
        frequency: 'daily',
        difficulty: 'medium'
      });
      setShowAddForm(false);
    }
  };

  const removeHabit = (index: number) => {
    onUpdate(data.filter((_, i) => i !== index));
  };

  const suggestedHabits = [
    { name: 'Drink 8 glasses of water', type: 'positive' as const, difficulty: 'easy' },
    { name: 'Exercise for 30 minutes', type: 'positive' as const, difficulty: 'medium' },
    { name: 'Read for 20 minutes', type: 'positive' as const, difficulty: 'easy' },
    { name: 'Meditate for 10 minutes', type: 'positive' as const, difficulty: 'easy' },
    { name: 'Stop checking phone before bed', type: 'negative' as const, difficulty: 'hard' },
    { name: 'Avoid sugary drinks', type: 'negative' as const, difficulty: 'medium' }
  ];

  const addSuggestedHabit = (habit: any) => {
    const fullHabit: Habit = {
      ...habit,
      frequency: 'daily'
    };
    onUpdate([...data, fullHabit]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Let's Set Up Your Habits</h3>
        <p className="text-gray-600">
          Choose habits you want to track. You can always add more later!
        </p>
      </div>

      {/* Current Habits */}
      <div className="space-y-4">
        <h4 className="font-medium">Your Habits ({data.length})</h4>
        {data.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No habits added yet. Start by adding one below!</p>
        ) : (
          <div className="grid gap-3">
            {data.map((habit, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{habit.name}</span>
                      <Badge variant={habit.type === 'positive' ? 'default' : habit.type === 'negative' ? 'destructive' : 'secondary'}>
                        {habit.type}
                      </Badge>
                      <Badge variant="outline">
                        {habit.frequency}
                      </Badge>
                      <Badge variant="outline">
                        {habit.difficulty}
                      </Badge>
                    </div>
                    {habit.reminderTime && (
                      <p className="text-sm text-gray-600">Reminder: {habit.reminderTime}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHabit(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add New Habit */}
      <div className="space-y-4">
        {!showAddForm ? (
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Habit
          </Button>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add New Habit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="habit-name">Habit Name</Label>
                  <Input
                    id="habit-name"
                    placeholder="e.g., Exercise for 30 minutes"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="habit-type">Type</Label>
                  <Select
                    value={newHabit.type}
                    onValueChange={(value: 'positive' | 'negative' | 'neutral') => 
                      setNewHabit({ ...newHabit, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive (Build)</SelectItem>
                      <SelectItem value="negative">Negative (Break)</SelectItem>
                      <SelectItem value="neutral">Neutral (Track)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newHabit.frequency}
                    onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={newHabit.difficulty}
                    onValueChange={(value) => setNewHabit({ ...newHabit, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminder">Reminder Time</Label>
                  <Input
                    id="reminder"
                    type="time"
                    value={newHabit.reminderTime || ''}
                    onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={addHabit} disabled={!newHabit.name.trim()}>
                  Add Habit
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Suggested Habits */}
      <div className="space-y-4">
        <h4 className="font-medium">Quick Add Suggestions</h4>
        <div className="grid md:grid-cols-2 gap-3">
          {suggestedHabits.map((habit, index) => (
            <Card key={index} className="p-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{habit.name}</span>
                    <Badge variant={habit.type === 'positive' ? 'default' : 'destructive'}>
                      {habit.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">Difficulty: {habit.difficulty}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => addSuggestedHabit(habit)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext}>
          Next: Social Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default HabitPersonalizationStep;
