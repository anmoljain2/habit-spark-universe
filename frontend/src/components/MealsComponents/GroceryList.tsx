import React from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Loader2, Utensils } from 'lucide-react';

interface GroceryListProps {
  groceryList: any[];
  groceryLoading: boolean;
  checkedItems: Set<number>;
  onToggleItem: (idx: number) => void;
  onGenerate: () => void;
  groceryCondensed: boolean;
  setGroceryCondensed: (condensed: boolean) => void;
}

const GroceryList: React.FC<GroceryListProps> = ({
  groceryList,
  groceryLoading,
  checkedItems,
  onToggleItem,
  onGenerate,
  groceryCondensed,
  setGroceryCondensed,
}) => {
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
        ) : groceryList.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-4 w-full">
            <span className="text-gray-500 text-lg mb-2">No grocery list found for this week.</span>
            <button
              onClick={onGenerate}
              className="mt-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" /> Generate Grocery List
            </button>
          </div>
        ) : (
          <div className="w-full mt-2">
            <ul className="divide-y divide-gray-200 w-full">
              {(groceryCondensed ? groceryList.slice(0, 5) : groceryList).map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(idx)}
                    onChange={() => onToggleItem(idx)}
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
          onClick={onGenerate}
          className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 w-full"
        >
          <ShoppingCart className="w-5 h-5" /> Regenerate Grocery List
        </button>
      </div>
    </div>
  );
};

export default GroceryList; 