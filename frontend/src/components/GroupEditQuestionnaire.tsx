import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';

export default function GroupEditQuestionnaire({ group, onClose, onSaved }: { group: any, onClose: () => void, onSaved: (g: any) => void }) {
  const [form, setForm] = useState({
    name: group.name || '',
    bio: group.bio || '',
    description: group.description || '',
    visibility: group.visibility || 'public',
    avatar_url: group.avatar_url || '',
    rules: Array.isArray(group.rules) ? group.rules : [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setForm(f => ({ ...f, rules: [...f.rules, newRule.trim()] }));
    setNewRule('');
  };
  const handleEditRule = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(form.rules[idx]);
  };
  const handleSaveEditRule = (idx: number) => {
    if (!editingValue.trim()) return;
    setForm(f => ({ ...f, rules: f.rules.map((r, i) => i === idx ? editingValue.trim() : r) }));
    setEditingIdx(null);
    setEditingValue('');
  };
  const handleDeleteRule = (idx: number) => {
    setForm(f => ({ ...f, rules: f.rules.filter((_, i) => i !== idx) }));
    setEditingIdx(null);
    setEditingValue('');
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from('social_groups')
      .update({
        name: form.name,
        bio: form.bio,
        description: form.description,
        visibility: form.visibility,
        avatar_url: form.avatar_url,
        rules: form.rules,
      })
      .eq('id', group.id)
      .select('*')
      .single();
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    onSaved(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <form className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg flex flex-col gap-4" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-2 text-blue-700">Edit Group</h2>
        {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
        <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" placeholder="Group Name" />
        <input type="text" name="bio" value={form.bio} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Bio" />
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} placeholder="Description" />
        <select name="visibility" value={form.visibility} onChange={handleChange} className="w-full border rounded px-3 py-2">
          <option value="public">Public (anyone can join)</option>
          <option value="private">Private (requests required)</option>
        </select>
        <input type="text" name="avatar_url" value={form.avatar_url} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="Avatar URL" />
        <label className="font-semibold">Rules:</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
              placeholder="Add a new rule..."
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRule(); } }}
            />
            <Button type="button" onClick={handleAddRule} className="bg-blue-500 text-white px-3 py-2 rounded-lg"><Plus className="w-4 h-4" /></Button>
          </div>
          <ul className="space-y-1">
            {form.rules.map((rule, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {editingIdx === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      className="flex-1 border rounded px-2 py-1"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEditRule(idx); } }}
                    />
                    <button type="button" className="text-green-600" onClick={() => handleSaveEditRule(idx)}><Check className="w-4 h-4" /></button>
                    <button type="button" className="text-gray-400" onClick={() => { setEditingIdx(null); setEditingValue(''); }}><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{rule}</span>
                    <button type="button" className="text-blue-600" onClick={() => handleEditRule(idx)}><Pencil className="w-4 h-4" /></button>
                    <button type="button" className="text-red-600" onClick={() => handleDeleteRule(idx)}><Trash2 className="w-4 h-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" className="bg-blue-600 text-white" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </div>
  );
} 