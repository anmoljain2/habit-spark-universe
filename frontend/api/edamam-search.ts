import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDAMAM_APP_ID = '8a1f97f9';
const EDAMAM_APP_KEY = 'def5c320af15c9bf3a059c20de31249c';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { query, userId } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'Missing or invalid query' });
    return;
  }
  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&to=10`;

  try {
    const edamamRes = await fetch(url, {
      headers: {
        'Edamam-Account-User': userId
      }
    });
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