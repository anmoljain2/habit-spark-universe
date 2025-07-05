import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Loader2, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GroceryListProps {
  userId: string;
  weekStart: string;
}

const GroceryList: React.FC<GroceryListProps> = ({ userId, weekStart }) => {
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [groceryCondensed, setGroceryCondensed] = useState(true);
  const [popup, setPopup] = useState<string | null>(null);

  // Always fetch the grocery list for the current user and week start
  const fetchGroceryList = async () => {
    setGroceryLoading(true);
    const { data, error } = await supabase
      .from('grocery_lists')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single();
    if (error || !data) {
      setGroceryList([]);
    } else {
      setGroceryList(Array.isArray(data.items) ? data.items : []);
    }
    setGroceryLoading(false);
  };

  React.useEffect(() => {
    if (userId && weekStart) fetchGroceryList();
    // eslint-disable-next-line
  }, [userId, weekStart]);

  const handleToggleItem = (idx: number) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  // On regenerate, call backend and then refetch from Supabase
  const handleGenerateGroceryList = async () => {
    if (!userId || !weekStart) {
      let missing = [];
      if (!userId) missing.push('User ID');
      if (!weekStart) missing.push('Week Start');
      setPopup(`Cannot regenerate grocery list. Missing: ${missing.join(' and ')}`);
      setTimeout(() => setPopup(null), 3500);
      return;
    }
    setGroceryLoading(true);
    try {
      await fetch('/api/generate-grocery-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, weekStart }),
      });
      // Always refetch from Supabase after generation
      await fetchGroceryList();
    } catch (err) {
      // Optionally show error
    }
    setGroceryLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/90 rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col items-start justify-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-green-600" />
          Grocery List
        </h2>
        {groceryLoading ? (
          <div className="flex flex-col items-center justify-center py-8 w-full">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-2" />
            <span className="text-green-700 font-medium">Loading grocery list...</span>
          </div>
        ) : (
          <>
            {groceryList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 w-full">
                <span className="text-gray-500 text-lg mb-2">No grocery list found for this week.</span>
              </div>
            ) : (
              <div className="w-full mt-2">
                <ul className="divide-y divide-gray-200 w-full">
                  {(groceryCondensed ? groceryList.slice(0, 5) : groceryList).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(idx)}
                        onChange={() => handleToggleItem(idx)}
                        className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                      />
                      <span className={`flex-1 text-gray-800 text-base ${checkedItems.has(idx) ? 'line-through text-gray-400' : ''}`}>{typeof item === 'object' && 'name' in item ? String(item.name) : String(item)}</span>
                      {typeof item === 'object' && 'quantity' in item && <span className="text-xs text-gray-500 ml-2">x{String(item.quantity)}</span>}
                      {typeof item === 'object' && 'unit' in item && <span className="text-xs text-gray-400 ml-1">{String(item.unit)}</span>}
                    </li>
                  ))}
                </ul>
                {groceryList.length > 5 && (
                  <button
                    className="mt-2 flex items-center justify-center gap-1 text-xs text-green-700 underline hover:text-green-900 focus:outline-none w-full"
                    onClick={() => setGroceryCondensed(!groceryCondensed)}
                  >
                    {groceryCondensed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    {groceryCondensed ? `Show more` : 'Show less'}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={handleGenerateGroceryList}
              className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 w-full"
            >
              <ShoppingCart className="w-5 h-5" /> {groceryList.length === 0 ? 'Generate Grocery List' : 'Regenerate Grocery List'}
            </button>
          </>
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

export default GroceryList; 