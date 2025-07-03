import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDAMAM_NUTRITION_APP_ID = '7b4b1d25';
const EDAMAM_NUTRITION_APP_KEY = '718ff8303b7bf705e3e39b9480201e71';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Edamam Nutrition] Incoming request:', req.method, req.body);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Missing or invalid query' });
    return;
  }
  const url = `https://api.edamam.com/api/nutrition-data?app_id=${EDAMAM_NUTRITION_APP_ID}&app_key=${EDAMAM_NUTRITION_APP_KEY}&ingr=${encodeURIComponent(query)}`;
  console.log('[Edamam Nutrition] Constructed URL:', url);
  try {
    const edamamRes = await fetch(url);
    console.log('[Edamam Nutrition] Edamam response status:', edamamRes.status);
    if (!edamamRes.ok) {
      const text = await edamamRes.text();
      console.log('[Edamam Nutrition] Error response from Edamam:', text);
      res.status(edamamRes.status).json({ error: text });
      return;
    }
    const data = await edamamRes.json();
    console.log('[Edamam Nutrition] Success, data keys:', Object.keys(data));
    res.status(200).json(data);
  } catch (err: any) {
    console.log('[Edamam Nutrition] Exception thrown:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch from Edamam' });
  }
} 