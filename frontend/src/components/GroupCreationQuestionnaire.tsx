import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '../components/ProfileContext';
import { Button } from './ui/button';

const visibilities = [
  { value: 'public', label: 'Public (anyone can join)' },
  { value: 'private', label: 'Private (requests required)' },
];

export default function GroupCreationQuestionnaire() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    description: '',
    visibility: 'public',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Check if user already owns a group
    const { data: existing } = await supabase
      .from('social_groups')
      .select('id')
      .eq('owner', profile?.user_id)
      .single();
    if (existing) {
      setError('You already own a group.');
      setLoading(false);
      return;
    }
    // Insert new group
    const { error: insertError } = await supabase.from('social_groups').insert({
      name: form.name,
      bio: form.bio,
      description: form.description,
      visibility: form.visibility,
      avatar_url: form.avatar_url || null,
      owner: profile?.user_id,
      members: [profile?.user_id],
      pending_requests: [],
      chats: [],
      is_active: true,
    });
    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/profile');
  };

  return (
    <form className="space-y-8 max-w-xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold mb-4 text-green-700">Create Your Group</h2>
      {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
      <div>
        <label className="block font-semibold mb-1">Group Name</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Bio</label>
        <input type="text" name="bio" value={form.bio} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} />
      </div>
      <div>
        <label className="block font-semibold mb-1">Visibility</label>
        <select name="visibility" value={form.visibility} onChange={handleChange} className="w-full border rounded px-3 py-2">
          {visibilities.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
        </select>
      </div>
      {/* Avatar upload can be added here if needed */}
      <Button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold" disabled={loading}>
        {loading ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  );
} 