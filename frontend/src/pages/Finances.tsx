import { useEffect, useState } from 'react';
import FinancesQuestionnaire from '../components/FinancesQuestionnaire';
import FinancesDashboard from '../components/FinancesDashboard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Finances = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('financial_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const handleSubmit = async (form: any) => {
    setSaving(true);
    const { error, data } = await supabase
      .from('financial_profiles')
      .insert({ ...form, user_id: user.id })
      .select()
      .single();
    setSaving(false);
    if (!error) setProfile(data);
    // Optionally show a toast or error
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50">
      <div className="w-full px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-yellow-500/10 px-4 py-2 rounded-full border border-green-200 mb-4">
            <span className="text-sm font-medium text-green-700">Finance Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent mb-4">
            Finances
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your spending, savings, and financial goals all in one place.
          </p>
        </div>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : !profile ? (
          <FinancesQuestionnaire onSubmit={handleSubmit} />
        ) : (
          <FinancesDashboard profile={profile} />
        )}
      </div>
    </div>
  );
};

export default Finances; 