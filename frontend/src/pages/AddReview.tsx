import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const AddReview = () => {
  const { user } = useAuth();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReview = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setStars(data.stars);
        setComment(data.comment);
        setName(data.name);
        setAffiliation(data.affiliation || '');
        setExistingReviewId(data.id);
      }
    };
    fetchReview();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!stars || !comment || !name) {
      setError('Please fill out all required fields.');
      setLoading(false);
      return;
    }
    let errorResult;
    if (existingReviewId) {
      // Update existing review
      const { error } = await supabase
        .from('product_reviews')
        .update({ stars, comment, name, affiliation })
        .eq('id', existingReviewId);
      errorResult = error;
    } else {
      // Insert new review
      const { error } = await supabase.from('product_reviews').insert({
        stars,
        comment,
        name,
        affiliation,
        user_id: user?.id
      });
      errorResult = error;
    }
    setLoading(false);
    if (errorResult) {
      setError('Failed to submit review.');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full space-y-6 border border-gray-200">
        <h1 className="text-2xl font-bold mb-4 text-center">{existingReviewId ? 'Edit Review' : 'Add a Review'}</h1>
        <div>
          <label className="block font-medium mb-1">Stars <span className="text-red-500">*</span></label>
          <select value={stars} onChange={e => setStars(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
            {[...Array(9)].map((_, i) => {
              const val = 1 + i * 0.5;
              return <option key={val} value={val}>{val} Stars</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Comment <span className="text-red-500">*</span></label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={4} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Name <span className="text-red-500">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Affiliation/Organization</label>
          <input value={affiliation} onChange={e => setAffiliation(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        {error && <div className="text-red-600 text-center font-medium">{error}</div>}
        <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold" disabled={loading}>
          {loading ? 'Saving...' : existingReviewId ? 'Save' : 'Create Review'}
        </Button>
      </form>
    </div>
  );
};

export default AddReview; 