import { useState } from 'react';

const initialGoal = { goal: '', target: '', by: '' };
const initialCategory = { category: '', percent: '' };

const budgetingMethods = [
  '50/30/20 rule',
  'Zero-based',
  'Envelope',
  'None',
  'Other',
];
const riskLevels = ['Low', 'Medium', 'High'];
const timeframes = ['Short-term', 'Long-term', 'Retirement'];
const emergencyStatuses = ['None', 'Partial', 'Fully funded'];

export default function FinancesQuestionnaire({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    net_worth: '',
    total_assets: '',
    total_liabilities: '',
    savings_balance: '',
    investment_value: '',
    monthly_income: '',
    monthly_expenses: '',
    spending_habits: {
      categories: [ { ...initialCategory } ],
      summary: ''
    },
    preferred_budgeting: '',
    financial_goals: [ { ...initialGoal } ],
    risk_tolerance: '',
    goal_timeframe: '',
    emergency_fund_status: '',
    notes: ''
  });

  // Handlers for repeatable fields
  const addGoal = () => setForm(f => ({ ...f, financial_goals: [...f.financial_goals, { ...initialGoal }] }));
  const removeGoal = (i: number) => setForm(f => ({ ...f, financial_goals: f.financial_goals.filter((_, idx) => idx !== i) }));
  const updateGoal = (i: number, key: string, value: string) => setForm(f => ({
    ...f,
    financial_goals: f.financial_goals.map((g, idx) => idx === i ? { ...g, [key]: value } : g)
  }));

  const addCategory = () => setForm(f => ({ ...f, spending_habits: { ...f.spending_habits, categories: [...f.spending_habits.categories, { ...initialCategory }] } }));
  const removeCategory = (i: number) => setForm(f => ({ ...f, spending_habits: { ...f.spending_habits, categories: f.spending_habits.categories.filter((_, idx) => idx !== i) } }));
  const updateCategory = (i: number, key: string, value: string) => setForm(f => ({
    ...f,
    spending_habits: {
      ...f.spending_habits,
      categories: f.spending_habits.categories.map((c, idx) => idx === i ? { ...c, [key]: value } : c)
    }
  }));

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  return (
    <form className="space-y-8 max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/50 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(34,197,94,0.15)] hover:border-green-400/80 hover:ring-4 hover:ring-green-200/40" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <h2 className="text-2xl font-bold mb-4 text-green-700">Financial Profile Questionnaire</h2>
      {/* Net Worth & Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Net Worth</label>
          <input type="number" name="net_worth" value={form.net_worth} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Total Assets</label>
          <input type="number" name="total_assets" value={form.total_assets} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Total Liabilities</label>
          <input type="number" name="total_liabilities" value={form.total_liabilities} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Savings Balance</label>
          <input type="number" name="savings_balance" value={form.savings_balance} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Investment Value</label>
          <input type="number" name="investment_value" value={form.investment_value} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      {/* Income & Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Monthly Income</label>
          <input type="number" name="monthly_income" value={form.monthly_income} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Monthly Expenses</label>
          <input type="number" name="monthly_expenses" value={form.monthly_expenses} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      {/* Spending Habits */}
      <div>
        <label className="block font-semibold mb-2">Spending Categories</label>
        {form.spending_habits.categories.map((cat, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" placeholder="Category" value={cat.category} onChange={e => updateCategory(i, 'category', e.target.value)} className="border rounded px-2 py-1 flex-1" />
            <input type="number" placeholder="%" value={cat.percent} onChange={e => updateCategory(i, 'percent', e.target.value)} className="border rounded px-2 py-1 w-20" />
            {form.spending_habits.categories.length > 1 && (
              <button type="button" onClick={() => removeCategory(i)} className="text-red-500">Remove</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addCategory} className="text-green-600 font-medium">+ Add Category</button>
        <div className="mt-2">
          <label className="block font-semibold mb-1">Overspending Summary</label>
          <input type="text" value={form.spending_habits.summary} onChange={e => setForm(f => ({ ...f, spending_habits: { ...f.spending_habits, summary: e.target.value } }))} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mt-2">
          <label className="block font-semibold mb-1">Preferred Budgeting Method</label>
          <select value={form.preferred_budgeting} onChange={e => setForm(f => ({ ...f, preferred_budgeting: e.target.value }))} className="w-full border rounded px-3 py-2">
            <option value="">Select...</option>
            {budgetingMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      {/* Financial Goals */}
      <div>
        <label className="block font-semibold mb-2">Financial Goals</label>
        {form.financial_goals.map((goal, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
            <input type="text" placeholder="Goal" value={goal.goal} onChange={e => updateGoal(i, 'goal', e.target.value)} className="border rounded px-2 py-1" />
            <input type="number" placeholder="Target Amount" value={goal.target} onChange={e => updateGoal(i, 'target', e.target.value)} className="border rounded px-2 py-1" />
            <input type="date" placeholder="By" value={goal.by} onChange={e => updateGoal(i, 'by', e.target.value)} className="border rounded px-2 py-1" />
            {form.financial_goals.length > 1 && (
              <button type="button" onClick={() => removeGoal(i)} className="text-red-500">Remove</button>
            )}
          </div>
        ))}
        <button type="button" onClick={addGoal} className="text-green-600 font-medium">+ Add Goal</button>
      </div>
      {/* Risk & Planning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold mb-1">Risk Tolerance</label>
          <select value={form.risk_tolerance} onChange={e => setForm(f => ({ ...f, risk_tolerance: e.target.value }))} className="w-full border rounded px-3 py-2">
            <option value="">Select...</option>
            {riskLevels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Main Planning Timeframe</label>
          <select value={form.goal_timeframe} onChange={e => setForm(f => ({ ...f, goal_timeframe: e.target.value }))} className="w-full border rounded px-3 py-2">
            <option value="">Select...</option>
            {timeframes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Emergency Fund Status</label>
          <select value={form.emergency_fund_status} onChange={e => setForm(f => ({ ...f, emergency_fund_status: e.target.value }))} className="w-full border rounded px-3 py-2">
            <option value="">Select...</option>
            {emergencyStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {/* Notes */}
      <div>
        <label className="block font-semibold mb-1">Additional Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={3} />
      </div>
      <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold mt-4">Save Profile</button>
    </form>
  );
} 