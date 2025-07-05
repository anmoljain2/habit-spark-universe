import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Loader2, Utensils, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GroceryListProps {
  userId: string;
  weekStart: string;
}

const GroceryList: React.FC<GroceryListProps> = ({ userId, weekStart }) => {
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [groceryLoading, setGroceryLoading] = useState(true);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [groceryCondensed, setGroceryCondensed] = useState(true);
  const [popup, setPopup] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

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
      setChecklist([]);
    } else {
      let itemsArr = Array.isArray(data.items) ? data.items as any[] : [];
      let checklistArr = Array.isArray(data.checklist) ? data.checklist as boolean[] : [];
      let cl = checklistArr.length === itemsArr.length
        ? checklistArr
        : Array(itemsArr.length).fill(false);
      setGroceryList(itemsArr);
      setChecklist(cl);
    }
    setGroceryLoading(false);
  };

  React.useEffect(() => {
    if (userId && weekStart) fetchGroceryList();
    // eslint-disable-next-line
  }, [userId, weekStart]);

  const handleToggleItem = async (idx: number) => {
    const newChecklist = [...checklist];
    newChecklist[idx] = !newChecklist[idx];
    setChecklist(newChecklist);
    // Save to Supabase
    await supabase
      .from('grocery_lists')
      .update({ checklist: newChecklist })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
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

  // Add a new item
  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    const updatedList = [...groceryList, newItem.trim()];
    const updatedChecklist = [...checklist, false];
    setGroceryList(updatedList);
    setChecklist(updatedChecklist);
    setNewItem('');
    await supabase
      .from('grocery_lists')
      .update({ items: updatedList, checklist: updatedChecklist })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
  };

  // Edit an item
  const handleEditItem = async (idx: number) => {
    if (!editingValue.trim()) return;
    const updatedList = [...groceryList];
    updatedList[idx] = editingValue.trim();
    setGroceryList(updatedList);
    setEditingIdx(null);
    setEditingValue('');
    await supabase
      .from('grocery_lists')
      .update({ items: updatedList })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
  };

  // Delete an item
  const handleDeleteItem = async (idx: number) => {
    const updatedList = groceryList.filter((_, i) => i !== idx);
    const updatedChecklist = checklist.filter((_, i) => i !== idx);
    setGroceryList(updatedList);
    setChecklist(updatedChecklist);
    await supabase
      .from('grocery_lists')
      .update({ items: updatedList, checklist: updatedChecklist })
      .eq('user_id', userId)
      .eq('week_start', weekStart);
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
                {/* Add new item */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:ring-green-500 focus:border-green-500"
                    placeholder="Add new item..."
                    onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
                  />
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-semibold shadow"
                    onClick={handleAddItem}
                  >Add</button>
                </div>
                <ul className="divide-y divide-gray-200 w-full">
                  {(groceryCondensed ? groceryList.slice(0, 5) : groceryList).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!checklist[idx]}
                        onChange={() => handleToggleItem(idx)}
                        className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500 border-gray-300"
                      />
                      {editingIdx === idx ? (
                        <>
                          <input
                            type="text"
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-base focus:ring-green-500 focus:border-green-500"
                            onKeyDown={e => { if (e.key === 'Enter') handleEditItem(idx); if (e.key === 'Escape') setEditingIdx(null); }}
                          />
                          <button className="text-green-600 hover:text-green-800" onClick={() => handleEditItem(idx)}><Check className="w-4 h-4" /></button>
                          <button className="text-gray-400 hover:text-red-500" onClick={() => setEditingIdx(null)}><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <span className={`flex-1 text-gray-800 text-base ${checklist[idx] ? 'line-through text-gray-400' : ''}`}>{typeof item === 'object' && 'name' in item ? String(item.name) : String(item)}
                          <button className="ml-2 text-gray-400 hover:text-green-600" title="Edit" onClick={() => { setEditingIdx(idx); setEditingValue(typeof item === 'object' && 'name' in item ? String(item.name) : String(item)); }}><Pencil className="w-4 h-4 inline" /></button>
                          <button className="ml-1 text-gray-400 hover:text-red-600" title="Delete" onClick={() => handleDeleteItem(idx)}><Trash2 className="w-4 h-4 inline" /></button>
                        </span>
                      )}
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