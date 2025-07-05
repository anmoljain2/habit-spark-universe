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
    // Delete any existing meal for this user, date, and meal_type
    const { error: deleteError } = await supabase
      .from('user_meals')
      .delete()
      .eq('user_id', user_id)
      .eq('date_only', date)
      .eq('meal_type', meal_type);
    if (deleteError) {
    }
    // Insert the new meal
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
    // Also insert into user_recipes if not already present
    const { data: existingRecipe } = await supabase
      .from('user_recipes')
      .select('id')
      .eq('user_id', user_id)
      .eq('name', description)
      .maybeSingle();
    if (!existingRecipe) {
      await supabase.from('user_recipes').insert({
        user_id,
        name: description,
        ingredients,
        recipe,
        serving_size,
        calories,
        protein,
        carbs,
        fat,
        source: 'logged',
      });
    }
    res.status(201).json({ meal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 