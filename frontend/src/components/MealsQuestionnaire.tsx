import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChefHat, Target, Shield, AlertCircle, Check } from 'lucide-react';

const dietaryOptions = [
  { value: 'vegetarian', label: 'Vegetarian', icon: '🥬', color: 'from-green-400 to-emerald-500' },
  { value: 'vegan', label: 'Vegan', icon: '🌱', color: 'from-green-500 to-teal-500' },
  { value: 'gluten_free', label: 'Gluten Free', icon: '🌾', color: 'from-amber-400 to-orange-500' },
  { value: 'dairy_free', label: 'Dairy Free', icon: '🥛', color: 'from-blue-400 to-cyan-500' },
  { value: 'nut_free', label: 'Nut Free', icon: '🥜', color: 'from-red-400 to-pink-500' },
  { value: 'halal', label: 'Halal', icon: '☪️', color: 'from-purple-400 to-violet-500' },
  { value: 'kosher', label: 'Kosher', icon: '✡️', color: 'from-indigo-400 to-blue-500' },
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

  const macroInputs = [
    { label: 'Calories Target', value: calories, setter: setCalories, min: 1000, max: 6000, required: true, unit: 'cal', color: 'from-blue-400 to-cyan-500' },
    { label: 'Protein', value: protein, setter: setProtein, min: 0, required: true, unit: 'g', color: 'from-red-400 to-pink-500' },
    { label: 'Carbs', value: carbs, setter: setCarbs, min: 0, required: true, unit: 'g', color: 'from-yellow-400 to-orange-500' },
    { label: 'Fat', value: fat, setter: setFat, min: 0, required: true, unit: 'g', color: 'from-green-400 to-emerald-500' },
  ];

  const optionalInputs = [
    { label: 'Fiber', value: fiber, setter: setFiber, unit: 'g' },
    { label: 'Sodium Limit', value: sodium, setter: setSodium, unit: 'mg' },
    { label: 'Sugar Limit', value: sugar, setter: setSugar, unit: 'g' },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(34,197,94,0.15)] hover:border-green-400/80 hover:ring-4 hover:ring-green-200/40">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg inline-block mb-4">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          Personalize Your Nutrition
        </h2>
        <p className="text-gray-600 text-lg">
          Set your nutritional goals and dietary preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Macro Targets */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">Nutritional Targets</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {macroInputs.map((input) => (
              <div key={input.label} className="relative">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">{input.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    min={input.min}
                    max={input.max}
                    value={input.value}
                    onChange={e => input.setter(e.target.value)}
                    className="w-full pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
                    required={input.required}
                  />
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded-lg bg-gradient-to-r ${input.color} text-white text-xs font-semibold`}>
                    {input.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Targets */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Optional Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {optionalInputs.map((input) => (
              <div key={input.label} className="relative">
                <label className="block font-semibold text-gray-700 mb-2 text-sm">{input.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={input.value}
                    onChange={e => input.setter(e.target.value)}
                    className="w-full pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
                    placeholder="Optional"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold">
                    {input.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-800">Dietary Restrictions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {dietaryOptions.map(option => {
              const isSelected = dietary.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => handleDietaryChange(option.value)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    isSelected
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${option.color}`}>
                      <span className="text-lg">{option.icon}</span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 text-sm">{option.label}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Allergies */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <label className="text-lg font-bold text-gray-800">Allergies</label>
          </div>
          <input
            type="text"
            value={allergies}
            onChange={e => setAllergies(e.target.value)}
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
            placeholder="e.g. peanuts, shellfish, eggs (comma separated)"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-lg font-bold text-gray-800 mb-4">Additional Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full py-3 px-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all resize-none"
            rows={4}
            placeholder="Any other dietary preferences, medical conditions, or special requirements..."
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              Saving Preferences...
            </div>
          ) : (
            'Save Preferences'
          )}
        </button>
      </form>
    </div>
  );
};

export default MealsQuestionnaire;
