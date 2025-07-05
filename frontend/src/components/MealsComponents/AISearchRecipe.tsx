import React, { useState } from 'react';
import { Utensils, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AISearchRecipeProps {
  recipeQuery: string;
  setRecipeQuery: (q: string) => void;
  recipeLoading: boolean;
  recipeResults: any[];
  recipeError: string;
  handleRecipeSearch: (e: React.FormEvent) => void;
  handleSaveRecipe: (recipe: any) => void;
  savedRecipes: any[];
  hoveredSavedRecipe: any | null;
  setHoveredSavedRecipe: (rec: any | null) => void;
  savedRecipeTooltipPos: { x: number, y: number } | null;
  setSavedRecipeTooltipPos: (pos: { x: number, y: number } | null) => void;
  savedRecipeTooltipTimeout: React.MutableRefObject<NodeJS.Timeout | null>;
  setRecipeResults: (results: any[]) => void;
}

const AISearchRecipe: React.FC<AISearchRecipeProps> = ({
  recipeQuery,
  setRecipeQuery,
  recipeLoading,
  recipeResults,
  recipeError,
  handleRecipeSearch,
  handleSaveRecipe,
  savedRecipes,
  hoveredSavedRecipe,
  setHoveredSavedRecipe,
  savedRecipeTooltipPos,
  setSavedRecipeTooltipPos,
  savedRecipeTooltipTimeout,
  setRecipeResults,
}) => {
  const [popup, setPopup] = useState<string | null>(null);

  // Wrap the search handler to add validation and error popup
  const wrappedHandleRecipeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeQuery || recipeQuery.trim().length === 0) {
      setPopup('Please enter a search query.');
      setTimeout(() => setPopup(null), 3500);
      return;
    }
    try {
      await handleRecipeSearch(e);
    } catch (err: any) {
      setPopup('Failed to search recipes. Please try again.');
      setTimeout(() => setPopup(null), 3500);
    }
  };

  // Handler to delete a saved recipe
  const handleDeleteRecipe = async (recipeId: string) => {
    try {
      const res = await fetch(`/api/delete-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipeId }),
      });
      if (!res.ok) throw new Error('Failed to delete recipe');
      // Refetch saved recipes after deletion
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    } catch (err: any) {
      setPopup(err.message || 'Failed to delete recipe');
      setTimeout(() => setPopup(null), 3500);
    }
  };

  // Remove recipe from search results after saving
  const handleSaveAndRemove = async (recipe: any) => {
    await handleSaveRecipe(recipe);
    setRecipeResults(recipeResults.filter(r => r !== recipe));
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-green-600" />
          AI Search a Recipe
        </h2>
        <form className="w-full flex gap-2 mb-4" onSubmit={wrappedHandleRecipeSearch}>
          <Input
            name="recipeQuery"
            value={recipeQuery}
            onChange={e => setRecipeQuery(e.target.value)}
            placeholder="e.g. salmon, pasta, vegan..."
            className="flex-1"
          />
          <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:from-green-600 hover:to-emerald-700" disabled={recipeLoading}>
            {recipeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </Button>
        </form>
        <div className="w-full">
          {recipeError && <div className="text-red-600 mb-2">{recipeError}</div>}
          {recipeLoading ? (
            <div className="flex items-center justify-center py-6 text-green-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : recipeResults.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recipeResults.map((r, idx) => (
                <li key={idx} className="py-2">
                  <div className="font-semibold text-gray-900 text-lg mb-1">{r.name || r.meal_name || r.description}</div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-2">
                    <span>⚡ {r.calories} cal</span>
                    <span>❤️ {r.protein}g protein</span>
                    <span>C {r.carbs}g carbs</span>
                    <span>F {r.fat}g fat</span>
                  </div>
                  {r.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {r.serving_size}</div>}
                  {r.ingredients && Array.isArray(r.ingredients) && r.ingredients.length > 0 && (
                    <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {r.ingredients.map((ing: any) => ing.name + (ing.quantity ? ` (${ing.quantity})` : '')).join(', ')}</div>
                  )}
                  {r.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {r.recipe}</div>}
                  <Button className="mt-2" onClick={() => handleSaveAndRemove(r)}>Save Recipe</Button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 text-sm py-4">Search for healthy recipes by ingredient, cuisine, or diet.</div>
          )}
        </div>
        {/* Saved Recipes List */}
        {savedRecipes.length > 0 && (
          <div className="mt-6 w-full">
            <h3 className="text-base font-semibold text-gray-700 mb-2">Your Saved Recipes</h3>
            <ul className="space-y-2">
              {savedRecipes.map((rec, idx) => (
                <li key={rec.id || idx} className="relative group flex items-center w-full" draggable onDragStart={e => { e.dataTransfer.setData('application/json', JSON.stringify({ ...rec, recipeType: 'searched' })); }}>
                  <button
                    type="button"
                    className="flex-1 text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-green-50 border border-gray-200 font-medium text-gray-900 transition-all w-full"
                    onMouseEnter={e => {
                      if (savedRecipeTooltipTimeout.current) clearTimeout(savedRecipeTooltipTimeout.current);
                      setHoveredSavedRecipe(rec);
                      const rect2 = (e.target as HTMLElement).getBoundingClientRect();
                      setSavedRecipeTooltipPos({ x: rect2.left + rect2.width / 2, y: rect2.bottom + window.scrollY });
                    }}
                    onMouseLeave={() => {
                      savedRecipeTooltipTimeout.current = setTimeout(() => setHoveredSavedRecipe(null), 200);
                    }}
                  >
                    {rec.name || rec.meal_name || rec.description}
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete recipe"
                    onClick={() => handleDeleteRecipe(rec.id)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            {hoveredSavedRecipe && savedRecipeTooltipPos && (
              <div
                style={{ position: 'absolute', left: savedRecipeTooltipPos.x, top: savedRecipeTooltipPos.y + 8, zIndex: 50 }}
                className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-80 max-w-xs text-sm animate-fade-in-up"
                onMouseEnter={() => { if (savedRecipeTooltipTimeout.current) clearTimeout(savedRecipeTooltipTimeout.current); }}
                onMouseLeave={() => { setHoveredSavedRecipe(null); }}
              >
                <div className="font-bold text-lg mb-1">{hoveredSavedRecipe.name}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-orange-500 font-semibold">⚡ {hoveredSavedRecipe.calories} cal</span>
                  <span className="text-red-500 font-semibold">❤️ {hoveredSavedRecipe.protein} protein</span>
                  <span className="text-yellow-500 font-semibold">C {hoveredSavedRecipe.carbs} carbs</span>
                  <span className="text-green-500 font-semibold">F {hoveredSavedRecipe.fat} fat</span>
                </div>
                {hoveredSavedRecipe.serving_size && <div className="text-xs text-gray-500 mb-1">Serving size: {hoveredSavedRecipe.serving_size}</div>}
                {hoveredSavedRecipe.ingredients && Array.isArray(hoveredSavedRecipe.ingredients) && hoveredSavedRecipe.ingredients.length > 0 && (
                  <div className="text-xs text-gray-600 mb-1"><b>Ingredients:</b> {hoveredSavedRecipe.ingredients.map((ing: any) => ing.name + (ing.quantity ? ` (${ing.quantity})` : '')).join(', ')}</div>
                )}
                {hoveredSavedRecipe.recipe && <div className="text-xs text-gray-600 mb-1"><b>Recipe:</b> {hoveredSavedRecipe.recipe}</div>}
              </div>
            )}
          </div>
        )}
        {popup && (
          <div className="fixed z-50 left-1/2 bottom-8 -translate-x-1/2 bg-red-100 border border-red-300 text-red-800 px-6 py-3 rounded-xl shadow-lg text-base font-semibold animate-fade-in-up">
            {popup}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISearchRecipe; 