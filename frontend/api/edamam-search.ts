import type { VercelRequest, VercelResponse } from '@vercel/node';

const EDAMAM_APP_ID = '8a1f97f9';
const EDAMAM_APP_KEY = 'def5c320af15c9bf3a059c20de31249c';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Edamam] Incoming request:', req.method, req.body);
  if (req.method !== 'POST') {
    console.log('[Edamam] Method not allowed:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { query } = req.body;
  console.log('[Edamam] Received query:', query);
  if (!query || typeof query !== 'string' || !query.trim()) {
    console.log('[Edamam] Missing or invalid query:', query);
    res.status(400).json({ error: 'Missing or invalid query' });
    return;
  }

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${encodeURIComponent(query)}&app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&to=10`;
  console.log('[Edamam] Constructed URL:', url);

  try {
    const edamamRes = await fetch(url, {
      headers: {
        'Edamam-Account-User': 'anmoljain'
      }
    });
    console.log('[Edamam] Edamam response status:', edamamRes.status);
    if (!edamamRes.ok) {
      const text = await edamamRes.text();
      console.log('[Edamam] Error response from Edamam:', text);
      res.status(edamamRes.status).json({ error: text });
      return;
    }
    const data = await edamamRes.json();
    console.log('[Edamam] Success, data keys:', Object.keys(data));
    res.status(200).json(data);
  } catch (err: any) {
    console.log('[Edamam] Exception thrown:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch from Edamam' });
  }
} 