import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { user_id, query, date } = req.body;
  if (!user_id || !query || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Call OpenAI to generate a recipe
    const prompt = `Generate a detailed recipe for the following dish: "${query}". Include:\n- A short meal name\n- Serving size\n- Step-by-step recipe instructions\n- Nutrition breakdown (calories, protein, carbs, fat)\n- A list of ingredients (with amounts)\nReturn ONLY a JSON object with fields: meal_name, serving_size, recipe, nutrition_breakdown (calories, protein, carbs, fat), ingredients (array of objects with name and quantity).`;
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let meal;
    try {
      let content = completion.choices[0].message.content;
      if (!content) throw new Error('No content from OpenAI');
      const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
      for (const block of codeBlocks) {
        try {
          meal = JSON.parse(block);
          break;
        } catch (e) {}
      }
      if (!meal && content) {
        const objStart = content.indexOf('{');
        const objEnd = content.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
          try {
            meal = JSON.parse(content.slice(objStart, objEnd + 1));
          } catch (e) {}
        }
      }
      if (!meal) throw new Error('No valid JSON found');
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    // 2. Insert into user_meals
    const nb = meal.nutrition_breakdown || {};
    const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
    const calories = nb.calories !== undefined ? parseMacro(nb.calories) : null;
    const protein = nb.protein !== undefined ? parseMacro(nb.protein) : null;
    const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : null;
    const fat = nb.fat !== undefined ? parseMacro(nb.fat) : null;
    // Insert into user_meals (for today)
    const { data: mealData, error: mealError } = await supabase.from('user_meals').insert({
      user_id,
      date,
      date_only: date,
      meal_type: 'custom',
      description: meal.meal_name,
      calories,
      protein,
      carbs,
      fat,
      serving_size: meal.serving_size,
      recipe: meal.recipe,
      ingredients: meal.ingredients,
      source: 'find_recipe',
    }).select().single();
    if (mealError) {
      return res.status(500).json({ error: mealError.message });
    }
    // Insert into user_recipes (for persistent storage)
    const { data: recipeData, error: recipeError } = await supabase.from('user_recipes').insert({
      user_id,
      name: meal.meal_name,
      ingredients: meal.ingredients,
      recipe: meal.recipe,
      serving_size: meal.serving_size,
      calories,
      protein,
      carbs,
      fat,
    }).select().single();
    if (recipeError) {
      return res.status(500).json({ error: recipeError.message });
    }
    res.status(201).json({ meal: mealData, recipe: recipeData });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 