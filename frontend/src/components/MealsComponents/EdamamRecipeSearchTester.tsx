import React, { useState } from 'react';

function EdamamRecipeSearchTester() {
  const [query, setQuery] = useState('chicken, rice, broccoli');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error searching recipes');
    }
    setLoading(false);
  };

  // Helper to render a recipe card
  function RecipeCard({ recipe }: { recipe: any }) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-80 min-w-[280px] flex flex-col items-center mb-6">
        <div className="w-40 h-40 bg-gray-100 rounded-xl mb-2 flex items-center justify-center overflow-hidden">
          {recipe.image ? <img src={recipe.image} alt={recipe.label} className="object-cover w-full h-full" /> : <span className="text-gray-400">No Image</span>}
        </div>
        <div className="text-lg font-bold text-gray-900 mb-1 text-center">{recipe.label}</div>
        <div className="flex gap-2 text-xs text-gray-500 mb-2">
          <span>{Math.round(recipe.calories)} CALORIES</span>
          <span>{recipe.ingredientLines?.length || 0} INGREDIENTS</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">{recipe.source}</div>
        <a href={recipe.url} target="_blank" rel="noopener noreferrer" className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm">View Recipe</a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 mb-12 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200">
      <h2 className="text-2xl font-bold text-green-700 mb-4">Edamam Recipe Search API Tester</h2>
      <form className="flex gap-2 mb-6" onSubmit={handleSearch}>
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. chicken, rice, broccoli"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {result && result.hits && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {result.hits.map((hit: any, idx: number) => (
            <RecipeCard key={idx} recipe={hit.recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

export default EdamamRecipeSearchTester; 