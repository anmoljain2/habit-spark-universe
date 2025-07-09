import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDAMAM_FOOD_APP_ID = '319a7a19';
const EDAMAM_FOOD_APP_KEY = '650edf5fef880624e4d9ab7768659b79';

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
  const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_FOOD_APP_ID}&app_key=${EDAMAM_FOOD_APP_KEY}&ingr=${encodeURIComponent(query)}`;
  try {
    const edamamRes = await fetch(url);
    if (!edamamRes.ok) {
      const text = await edamamRes.text();
      res.status(edamamRes.status).json({ error: text });
      return;
    }
    const data = await edamamRes.json();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch from Edamam' });
  }
} 