import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id, name, ingredients, recipe, serving_size, calories, protein, carbs, fat } = req.body;
  if (!user_id || !name || !ingredients || !recipe || !serving_size || calories == null || protein == null || carbs == null || fat == null) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase.from('user_recipes').insert({
      user_id,
      name,
      ingredients,
      recipe,
      serving_size,
      calories,
      protein,
      carbs,
      fat,
    }).select().single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json({ recipe: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 