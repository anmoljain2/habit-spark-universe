import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsonrepair } from 'jsonrepair';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id, weekStart } = req.body;
  if (!user_id || !weekStart) {
    res.status(400).json({ error: 'user_id and weekStart are required' });
    return;
  }

  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch all meals for the week
    const weekStartDate = new Date(weekStart);
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
    const { data: meals, error: mealsError } = await supabase
      .from('user_meals')
      .select('*')
      .eq('user_id', user_id)
      .in('date_only', weekDates);
    if (mealsError) {
      return res.status(500).json({ error: 'Failed to fetch meals for the week' });
    }
    if (!meals || meals.length === 0) {
      return res.status(400).json({ error: 'No meals found for this week' });
    }

    // 2. Extract all ingredients, fallback to recipe if missing
    let allIngredients = [];
    for (const meal of meals) {
      let mealIngredients = [];
      if (Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
        mealIngredients = meal.ingredients;
      } else if (typeof meal.ingredients === 'string') {
        try {
          const parsed = JSON.parse(meal.ingredients);
          if (Array.isArray(parsed) && parsed.length > 0) mealIngredients = parsed;
        } catch {}
      }
      // If still no ingredients, try to extract from recipe
      if ((!mealIngredients || mealIngredients.length === 0) && meal.recipe) {
        try {
          const extractPrompt = `Extract a detailed, structured list of ingredients (with amounts if possible) from the following recipe. Return ONLY a JSON array of objects with fields: name (string), quantity (string, optional), unit (string, optional), brand (string, optional), notes (string, optional).\n\nRecipe:\n${meal.recipe}`;
          console.log('Calling OpenAI to extract ingredients from recipe:', extractPrompt);
          const extractCompletion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [{ role: 'user', content: extractPrompt }],
          });
          let extractContent = extractCompletion.choices[0].message.content;
          console.log('OpenAI ingredient extraction response:', extractContent);
          let extractedIngredients;
          if (extractContent) {
            const codeBlocks = [...extractContent.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
            for (const block of codeBlocks) {
              try {
                extractedIngredients = JSON.parse(jsonrepair(block));
                break;
              } catch (e) {}
            }
            if (!extractedIngredients && extractContent) {
              const arrStart = extractContent.indexOf('[');
              const arrEnd = extractContent.lastIndexOf(']');
              if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
                try {
                  extractedIngredients = JSON.parse(jsonrepair(extractContent.slice(arrStart, arrEnd + 1)));
                } catch (e) {}
              }
            }
          }
          if (Array.isArray(extractedIngredients)) {
            mealIngredients = extractedIngredients;
          }
        } catch (e) {
          // If extraction fails, skip
        }
      }
      if (Array.isArray(mealIngredients)) {
        allIngredients.push(...mealIngredients);
      }
    }
    // Flatten and deduplicate by name
    const ingredientMap = new Map();
    for (const ing of allIngredients) {
      if (!ing || !ing.name) continue;
      const key = ing.name.toLowerCase();
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, { ...ing });
      } else {
        // Optionally sum quantities if possible
        // (for now, just keep the first occurrence)
      }
    }
    const uniqueIngredients = Array.from(ingredientMap.values());

    // 3. Call OpenAI to generate grocery list
    const prompt = `You are a meal planning assistant. Given the following list of ingredients for a week's worth of meals, generate a structured grocery list as a JSON array. For each item, include:
- name (string)
- quantity (string, e.g., '2 lbs', '3', '500g')
- unit (if applicable)
- recommended brand (if possible)
- notes (optional)

Ingredients:
${JSON.stringify(uniqueIngredients, null, 2)}

Return ONLY a JSON array of grocery items, no extra text.`;
    console.log('Calling OpenAI to generate grocery list with prompt:', prompt);
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let groceryList;
    try {
      let content = completion.choices[0].message.content;
      console.log('OpenAI grocery list response:', content);
      if (!content) throw new Error('No content from OpenAI');
      const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
      for (const block of codeBlocks) {
        try {
          groceryList = JSON.parse(jsonrepair(block));
          break;
        } catch (e) {}
      }
      if (!groceryList && content) {
        const arrStart = content.indexOf('[');
        const arrEnd = content.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            groceryList = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
          } catch (e) {}
        }
      }
      if (!groceryList) throw new Error('No valid JSON found');
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // 4. Upsert grocery list for this user/week
    const { error: upsertError } = await supabase
      .from('grocery_lists')
      .upsert({
        user_id,
        week_start: weekStart,
        items: groceryList,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' });
    if (upsertError) {
      return res.status(500).json({ error: 'Failed to save grocery list' });
    }

    res.status(200).json({ grocery_list: groceryList });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 