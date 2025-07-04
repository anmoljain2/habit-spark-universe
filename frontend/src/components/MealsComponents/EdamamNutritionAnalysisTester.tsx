import React, { useState } from 'react';

function EdamamNutritionAnalysisTester() {
  const [input, setInput] = useState('1 cup rice\n2 eggs');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch('/api/edamam-nutrition-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: input }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed (status ${res.status}): ${text}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error analyzing');
    }
    setLoading(false);
  };

  // Helper to render nutrition facts label
  function NutritionLabel({ data }: { data: any }) {
    if (!data) return null;
    const nf = data.totalNutrients || {};
    const daily = data.totalDaily || {};
    const calories = typeof data.calories === 'number' && !isNaN(data.calories) ? Math.round(data.calories) : 0;
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 w-80 min-w-[320px] mx-auto">
        <h2 className="text-2xl font-bold text-black mb-2 text-center border-b pb-2">Nutrition Facts</h2>
        <div className="text-xs text-gray-700 mb-2 text-center">Amount Per Serving</div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-extrabold">Calories</span>
          <span className="text-4xl font-extrabold">{calories}</span>
        </div>
        <div className="border-b border-gray-300 mb-2"></div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Total Fat {nf.FAT?.quantity ? nf.FAT.quantity.toFixed(1) : 0} g</span>
          <span>{daily.FAT?.quantity ? Math.round(daily.FAT.quantity) : 0} %</span>
        </div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Saturated Fat {nf.FASAT?.quantity ? nf.FASAT.quantity.toFixed(1) : 0} g {daily.FASAT?.quantity ? Math.round(daily.FASAT.quantity) : 0}%</div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Trans Fat {nf.FATRN?.quantity ? nf.FATRN.quantity.toFixed(1) : 0} g</div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Cholesterol {nf.CHOLE?.quantity ? nf.CHOLE.quantity.toFixed(0) : 0} mg</span>
          <span>{daily.CHOLE?.quantity ? Math.round(daily.CHOLE.quantity) : 0} %</span>
        </div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Sodium {nf.NA?.quantity ? nf.NA.quantity.toFixed(0) : 0} mg</span>
          <span>{daily.NA?.quantity ? Math.round(daily.NA.quantity) : 0} %</span>
        </div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Total Carbohydrate {nf.CHOCDF?.quantity ? nf.CHOCDF.quantity.toFixed(1) : 0} g</span>
          <span>{daily.CHOCDF?.quantity ? Math.round(daily.CHOCDF.quantity) : 0} %</span>
        </div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Dietary Fiber {nf.FIBTG?.quantity ? nf.FIBTG.quantity.toFixed(1) : 0} g {daily.FIBTG?.quantity ? Math.round(daily.FIBTG.quantity) : 0}%</div>
        <div className="ml-4 text-gray-600 text-sm mb-1">Total Sugars {nf.SUGAR?.quantity ? nf.SUGAR.quantity.toFixed(1) : 0} g</div>
        <div className="flex justify-between font-semibold mb-1">
          <span>Protein {nf.PROCNT?.quantity ? nf.PROCNT.quantity.toFixed(1) : 0} g</span>
          <span>{daily.PROCNT?.quantity ? Math.round(daily.PROCNT.quantity) : 0} %</span>
        </div>
      </div>
    );
  }

  // Helper to render parsed ingredients table
  function IngredientsTable({ data }: { data: any }) {
    if (!data || !data.ingredients) return null;
    return (
      <table className="w-full mt-4 text-sm border rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1">Qty</th>
            <th className="px-2 py-1">Unit</th>
            <th className="px-2 py-1">Food</th>
            <th className="px-2 py-1">Calories</th>
            <th className="px-2 py-1">Weight</th>
          </tr>
        </thead>
        <tbody>
          {data.ingredients.map((ing: any, idx: number) => (
            <tr key={idx} className="border-t">
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.quantity || '-'}</td>
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.measure || '-'}</td>
              <td className="px-2 py-1">{ing.text || '-'}</td>
              <td className="px-2 py-1 text-center">{typeof ing.parsed?.[0]?.nutrients?.ENERC_KCAL === 'number' && !isNaN(ing.parsed[0].nutrients.ENERC_KCAL) ? Math.round(ing.parsed[0].nutrients.ENERC_KCAL) + ' kcal' : '-'}</td>
              <td className="px-2 py-1 text-center">{ing.parsed?.[0]?.weight ? ing.parsed[0].weight.toFixed(1) + ' g' : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-12 p-6 bg-white/90 rounded-2xl shadow-xl border border-gray-200 flex flex-col md:flex-row gap-8 items-start">
      <div className="flex-1 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-blue-700 mb-4">Edamam Nutrition Analysis API Tester</h2>
        <form className="flex gap-2 mb-6 w-full" onSubmit={handleAnalyze}>
          <textarea
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"e.g. 1 cup rice\n2 eggs"}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
        <div className="text-xs text-gray-500 mb-2">Enter one ingredient per line.</div>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {result && <IngredientsTable data={result} />}
      </div>
      <div className="flex-shrink-0">
        {result && <NutritionLabel data={result} />}
      </div>
    </div>
  );
}

export default EdamamNutritionAnalysisTester; 