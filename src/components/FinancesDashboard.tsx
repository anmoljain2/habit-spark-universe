import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';

const COLORS = ['#34d399', '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#f87171', '#38bdf8', '#facc15'];

function percent(num: any) {
  if (!num && num !== 0) return '';
  return `${num}%`;
}

export default function FinancesDashboard({ profile }: { profile: any }) {
  // Pie chart data for spending habits
  const spendingData = (profile.spending_habits?.categories || []).map((c: any) => ({ name: c.category, value: Number(c.percent) }));
  // Bar chart data for goals
  const goalsData = (profile.financial_goals || []).map((g: any) => ({
    name: g.goal,
    target: Number(g.target),
    progress: 0 // You can calculate progress if you have current value
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center">
          <div className="text-lg font-semibold mb-1">Net Worth</div>
          <div className="text-3xl font-bold">${Number(profile.net_worth || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center">
          <div className="text-lg font-semibold mb-1">Total Assets</div>
          <div className="text-2xl font-bold">${Number(profile.total_assets || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-2xl p-6 shadow-lg flex flex-col items-center">
          <div className="text-lg font-semibold mb-1">Total Liabilities</div>
          <div className="text-2xl font-bold">${Number(profile.total_liabilities || 0).toLocaleString()}</div>
        </div>
      </div>
      {/* Income, Expenses, Savings, Investments */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Monthly Income</div>
          <div className="text-xl font-bold text-green-600">${Number(profile.monthly_income || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Monthly Expenses</div>
          <div className="text-xl font-bold text-red-500">${Number(profile.monthly_expenses || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Savings</div>
          <div className="text-xl font-bold text-blue-600">${Number(profile.savings_balance || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Investments</div>
          <div className="text-xl font-bold text-purple-600">${Number(profile.investment_value || 0).toLocaleString()}</div>
        </div>
      </div>
      {/* Spending Habits Pie Chart */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-bold text-lg mb-4 text-green-700">Spending Habits</div>
        {spendingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : <div className="text-gray-400">No spending data</div>}
      </div>
      {/* Financial Goals Progress */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="font-bold text-lg mb-4 text-green-700">Financial Goals</div>
        {goalsData.length > 0 ? (
          <div className="space-y-4">
            {goalsData.map((goal, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">{goal.name}</span>
                  <span className="text-gray-500">Target: ${goal.target.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full" style={{ width: '0%' }}></div>
                </div>
                {goal.by && <div className="text-xs text-gray-400 mt-1">By: {goal.by}</div>}
              </div>
            ))}
          </div>
        ) : <div className="text-gray-400">No goals set</div>}
      </div>
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Risk Tolerance</div>
          <div className="text-lg font-bold text-green-700">{profile.risk_tolerance || 'N/A'}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Budgeting Method</div>
          <div className="text-lg font-bold text-green-700">{profile.preferred_budgeting || 'N/A'}</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <div className="text-gray-500 font-semibold mb-1">Emergency Fund</div>
          <div className="text-lg font-bold text-green-700">{profile.emergency_fund_status || 'N/A'}</div>
        </div>
      </div>
      {/* Notes */}
      {profile.notes && (
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="font-bold text-lg mb-2 text-green-700">Notes</div>
          <div className="text-gray-700 whitespace-pre-line">{profile.notes}</div>
        </div>
      )}
    </div>
  );
} 