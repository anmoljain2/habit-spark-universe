
import HabitCard from './HabitCard';

const HabitsList = () => {
  const habits = [
    {
      id: '1',
      name: 'Morning Meditation',
      difficulty: 'Easy' as const,
      streak: 12,
      completed: true,
      xpReward: 50,
      description: '10 minutes of mindfulness'
    },
    {
      id: '2',
      name: 'Daily Exercise',
      difficulty: 'Medium' as const,
      streak: 8,
      completed: false,
      xpReward: 100,
      description: '30+ minutes of physical activity'
    },
    {
      id: '3',
      name: 'Read for 1 Hour',
      difficulty: 'Hard' as const,
      streak: 5,
      completed: false,
      xpReward: 150,
      description: 'Educational or personal development'
    },
    {
      id: '4',
      name: 'Drink 8 Glasses of Water',
      difficulty: 'Easy' as const,
      streak: 15,
      completed: true,
      xpReward: 30,
      description: 'Stay hydrated throughout the day'
    },
    {
      id: '5',
      name: 'No Social Media Before Noon',
      difficulty: 'Medium' as const,
      streak: 3,
      completed: false,
      xpReward: 80,
      description: 'Focus on morning productivity'
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Today's Habits</h2>
        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium">
          Add Habit
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <HabitCard key={habit.id} {...habit} />
        ))}
      </div>
    </div>
  );
};

export default HabitsList;
