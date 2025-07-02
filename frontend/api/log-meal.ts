import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const {
    user_id,
    date,
    meal_type,
    description,
    calories,
    protein,
    carbs,
    fat,
    serving_size,
    recipe,
    ingredients,
    tags
  } = req.body;

  if (!user_id || !date || !meal_type || !description) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data, error } = await supabase.from('user_meals').insert({
      user_id,
      date,
      date_only: date,
      meal_type,
      description,
      calories,
      protein,
      carbs,
      fat,
      serving_size,
      recipe,
      ingredients,
      tags,
      source: 'user',
    }).select().single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json({ meal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 