import React, { useState } from 'react';

function EdamamFoodDatabaseTester() {
  const [input, setInput] = useState('apple');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-food-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error searching food database');
    }
    setLoading(false);
  };

  // Helper to render a food card
  function FoodCard({ food }: { food: any }) {
    const nf = food.nutrients || {};
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 min-w-[280px] flex flex-col items-center mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full mb-2 flex items-center justify-center overflow-hidden">
          {food.image ? <img src={food.image} alt={food.label} className="object-cover w-full h-full" /> : <span className="text-gray-400">No Image</span>}
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1 text-center">{food.label}</div>
        <div className="flex gap-2 text-xs text-gray-500 mb-2">
          <span>⚡ {nf.ENERC_KCAL ? Math.round(nf.ENERC_KCAL) : 0} cal</span>
          <span>❤️ {nf.PROCNT ? nf.PROCNT.toFixed(1) : 0}g protein</span>
          <span>C {nf.CHOCDF ? nf.CHOCDF.toFixed(1) : 0}g carbs</span>
          <span>F {nf.FAT ? nf.FAT.toFixed(1) : 0}g fat</span>
        </div>
        <div className="w-full mt-2">
          <div className="bg-gray-50 rounded-xl p-2 text-xs">
            <div className="font-semibold mb-1">Nutrition Facts (per 100g)</div>
            <div>Total Fat: {nf.FAT ? nf.FAT.toFixed(1) : 0}g</div>
            <div>Carbs: {nf.CHOCDF ? nf.CHOCDF.toFixed(1) : 0}g</div>
            <div>Protein: {nf.PROCNT ? nf.PROCNT.toFixed(1) : 0}g</div>
            <div>Fiber: {nf.FIBTG ? nf.FIBTG.toFixed(1) : 0}g</div>
            <div>Sugar: {nf.SUGAR ? nf.SUGAR.toFixed(1) : 0}g</div>
            <div>Sodium: {nf.NA ? nf.NA.toFixed(0) : 0}mg</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 mb-24 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-purple-700 mb-4">Edamam Food Database API Tester</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-purple-500 focus:border-purple-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. apple, chicken breast, rice"
        />
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {result && result.hints && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {result.hints.map((hint: any, idx: number) => (
            <FoodCard key={idx} food={hint.food} />
          ))}
        </div>
      )}
    </div>
  );
}

export default EdamamFoodDatabaseTester; 