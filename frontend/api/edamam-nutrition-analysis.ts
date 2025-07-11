import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDAMAM_NUTRITION_APP_ID = '7b4b1d25';
const EDAMAM_NUTRITION_APP_KEY = '718ff8303b7bf705e3e39b9480201e71';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Missing or invalid query' });
    return;
  }
  // Split by newlines, trim, filter empty
  const ingrArr = query
    .split(/\r?\n/)
    .map((line: string) => line.trim())
    .filter(Boolean);
  const url = `https://api.edamam.com/api/nutrition-details?app_id=${EDAMAM_NUTRITION_APP_ID}&app_key=${EDAMAM_NUTRITION_APP_KEY}`;
  try {
    const requestBody = { ingr: ingrArr };
    const edamamRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await edamamRes.json();
    if (!edamamRes.ok) {
      res.status(edamamRes.status).json({ error: data.error || data.message || 'Edamam error', details: data });
      return;
    }
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch from Edamam' });
  }
} 