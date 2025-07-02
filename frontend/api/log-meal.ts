import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('--- Log Meal API handler start ---');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  console.log('Request body:', req.body);
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
  console.log('Received fields:', { user_id, date, meal_type, description, calories, protein, carbs, fat, serving_size, recipe, ingredients, tags });

  if (!user_id || !date || !meal_type || !description) {
    console.error('Missing required fields:', { user_id, date, meal_type, description });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables:', {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
    });
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
    console.log('Supabase insert result:', { data, error });
    if (error) {
      console.error('Supabase insert error:', error);
      res.status(500).json({ error: error.message });
      return;
    }
    console.log('Meal logged successfully:', data);
    res.status(201).json({ meal: data });
  } catch (err: any) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
  console.log('--- Log Meal API handler end ---');
} 