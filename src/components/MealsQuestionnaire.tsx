import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const dietaryOptions = [
  'vegetarian',
  'vegan',
  'gluten_free',
  'dairy_free',
  'nut_free',
  'halal',
  'kosher',
];

const MealsQuestionnaire = ({ userId, onComplete }: { userId: string, onComplete: (prefs: any) => void }) => {
  const [calories, setCalories] = useState('2000');
  const [protein, setProtein] = useState('100');
  const [carbs, setCarbs] = useState('250');
  const [fat, setFat] = useState('70');
  const [fiber, setFiber] = useState('');
  const [sodium, setSodium] = useState('');
  const [sugar, setSugar] = useState('');
  const [dietary, setDietary] = useState<string[]>([]);
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDietaryChange = (option: string) => {
    setDietary((prev) =>
      prev.includes(option)
        ? prev.filter((i) => i !== option)
        : [...prev, option]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.from('user_nutrition_preferences').insert({
      user_id: userId,
      calories_target: parseInt(calories, 10),
      protein_target: parseInt(protein, 10),
      carbs_target: parseInt(carbs, 10),
      fat_target: parseInt(fat, 10),
      fiber_target: fiber ? parseInt(fiber, 10) : null,
      sodium_limit: sodium ? parseInt(sodium, 10) : null,
      sugar_limit: sugar ? parseInt(sugar, 10) : null,
      dietary_restrictions: dietary,
      allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
      notes,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      onComplete({
        calories_target: calories,
        protein_target: protein,
        carbs_target: carbs,
        fat_target: fat,
        fiber_target: fiber,
        sodium_limit: sodium,
        sugar_limit: sugar,
        dietary_restrictions: dietary,
        allergies: allergies ? allergies.split(',').map(a => a.trim()) : [],
        notes,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
      <h2 className="text-2xl font-bold text-green-700 mb-2">Personalize Your Nutrition</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Calories Target</label>
          <input type="number" min="1000" max="6000" value={calories} onChange={e => setCalories(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Protein (g)</label>
          <input type="number" min="0" value={protein} onChange={e => setProtein(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Carbs (g)</label>
          <input type="number" min="0" value={carbs} onChange={e => setCarbs(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Fat (g)</label>
          <input type="number" min="0" value={fat} onChange={e => setFat(e.target.value)} className="border rounded px-3 py-2 w-full" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Fiber (g, optional)</label>
          <input type="number" min="0" value={fiber} onChange={e => setFiber(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Sodium Limit (mg, optional)</label>
          <input type="number" min="0" value={sodium} onChange={e => setSodium(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
        <div>
          <label className="block font-medium mb-1">Sugar Limit (g, optional)</label>
          <input type="number" min="0" value={sugar} onChange={e => setSugar(e.target.value)} className="border rounded px-3 py-2 w-full" />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Dietary Restrictions</label>
        <div className="flex flex-wrap gap-3 mb-2">
          {dietaryOptions.map(option => (
            <label key={option} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={dietary.includes(option)}
                onChange={() => handleDietaryChange(option)}
                className="accent-green-600"
              />
              <span className="text-sm capitalize">{option.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Allergies (comma separated)</label>
        <input type="text" value={allergies} onChange={e => setAllergies(e.target.value)} className="border rounded px-3 py-2 w-full" placeholder="e.g. peanuts, shellfish" />
      </div>
      <div>
        <label className="block font-medium mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="border rounded px-3 py-2 w-full" rows={2} />
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
};

export default MealsQuestionnaire; 