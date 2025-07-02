import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { jsonrepair } from 'jsonrepair';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      console.error('Method not allowed:', req.method);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { user_id, weekStart } = req.body;
    if (!user_id || !weekStart) {
      console.error('Missing user_id or weekStart:', req.body);
      res.status(400).json({ error: 'user_id and weekStart are required' });
      return;
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      res.status(500).json({ error: 'Missing required environment variables' });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
      console.error('Failed to fetch meals for the week:', mealsError);
      return res.status(500).json({ error: 'Failed to fetch meals for the week' });
    }
    if (!meals || meals.length === 0) {
      console.error('No meals found for this week');
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
        } catch (e) {
          console.warn('Failed to parse meal.ingredients as JSON:', meal.ingredients, e);
        }
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
              } catch (e) {
                console.warn('Failed to parse extracted ingredient block:', block, e);
              }
            }
            if (!extractedIngredients && extractContent) {
              const arrStart = extractContent.indexOf('[');
              const arrEnd = extractContent.lastIndexOf(']');
              if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
                try {
                  extractedIngredients = JSON.parse(jsonrepair(extractContent.slice(arrStart, arrEnd + 1)));
                } catch (e) {
                  console.warn('Failed to parse extracted ingredient array:', extractContent.slice(arrStart, arrEnd + 1), e);
                }
              }
            }
          }
          if (Array.isArray(extractedIngredients)) {
            mealIngredients = extractedIngredients;
          } else {
            console.warn('No valid ingredients extracted from recipe for meal:', meal);
          }
        } catch (e) {
          console.error('OpenAI ingredient extraction failed:', e);
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
    const prompt = `You are a meal planning assistant. Given the following list of ingredients for a week's worth of meals, generate a structured grocery list as a JSON array. For each item, include:\n- name (string)\n- quantity (string, e.g., '2 lbs', '3', '500g')\n- unit (if applicable)\n- recommended brand (if possible)\n- notes (optional)\n\nIngredients:\n${JSON.stringify(uniqueIngredients, null, 2)}\n\nReturn ONLY a JSON array of grocery items, no extra text.`;
    console.log('Calling OpenAI to generate grocery list with prompt:', prompt);
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (e) {
      console.error('OpenAI grocery list generation failed:', e);
      return res.status(500).json({ error: 'Failed to call OpenAI for grocery list generation' });
    }
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
        } catch (e) {
          console.warn('Failed to parse grocery list block:', block, e);
        }
      }
      if (!groceryList && content) {
        const arrStart = content.indexOf('[');
        const arrEnd = content.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            groceryList = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
          } catch (e) {
            console.warn('Failed to parse grocery list array:', content.slice(arrStart, arrEnd + 1), e);
          }
        }
      }
      if (!groceryList) throw new Error('No valid JSON found');
    } catch (e) {
      console.error('Failed to parse AI response for grocery list:', e);
      return res.status(500).json({ error: 'Failed to parse AI response for grocery list' });
    }

    // 4. Upsert grocery list for this user/week
    try {
      const { error: upsertError } = await supabase
        .from('grocery_lists')
        .upsert({
          user_id,
          week_start: weekStart,
          items: groceryList,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,week_start' });
      if (upsertError) {
        console.error('Failed to save grocery list:', upsertError);
        return res.status(500).json({ error: 'Failed to save grocery list' });
      }
    } catch (e) {
      console.error('Supabase upsert failed:', e);
      return res.status(500).json({ error: 'Failed to save grocery list (exception)' });
    }

    console.log('Returning grocery list to client:', groceryList);
    res.status(200).json({ grocery_list: groceryList });
  } catch (err: any) {
    console.error('Unhandled error in generate-grocery-list:', err);
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 