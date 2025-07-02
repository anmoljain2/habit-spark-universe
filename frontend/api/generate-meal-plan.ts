import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { jsonrepair } from 'jsonrepair';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id, mode, date, weekStart } = req.body;
  if (!user_id) {
    res.status(400).json({ error: 'user_id is required' });
    return;
  }

  if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: preferences, error } = await supabase
      .from('user_nutrition_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (!preferences) {
      return res.status(404).json({ error: 'User preferences not found' });
    }

    let prompt = '';
    let targetDates: string[] = [];
    if (mode === 'week') {
      // Generate for the week starting from weekStart (YYYY-MM-DD)
      if (!weekStart) return res.status(400).json({ error: 'weekStart is required for weekly generation' });
      const start = new Date(weekStart);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        targetDates.push(d.toISOString().slice(0, 10));
      }
      prompt = `Generate a personalized meal plan for a user with the following daily nutrition goals:\n- Calories: ${preferences.calories_target || 'N/A'} kcal\n- Protein: ${preferences.protein_target || 'N/A'}g\n- Carbs: ${preferences.carbs_target || 'N/A'}g\n- Fat: ${preferences.fat_target || 'N/A'}g\n\nRequirements:\n- Return a JSON object with 7 keys, one for each day (YYYY-MM-DD), each containing an array of 4 meals: one breakfast, one lunch, one snack, one dinner.\n- Each meal must have a field \\\"meal_type\\\" with one of: \\\"breakfast\\\", \\\"lunch\\\", \\\"snack\\\", \\\"dinner\\\".\n- The sum of calories, protein, carbs, and fat across all 4 meals for each day should add up to the user's daily goals as closely as possible.\n- For each meal, provide:\n  - meal_type\n  - meal_name\n  - serving_size\n  - recipe (instructions)\n  - nutrition_breakdown (calories, protein, carbs, fat)\n  - ingredients (with amounts)\n  - tags (e.g., vegetarian, gluten-free)\n\nReturn ONLY a JSON object as described, with no extra text.`;
    } else {
      // Default to daily
      const targetDate = date || new Date().toISOString().slice(0, 10);
      targetDates = [targetDate];
      // Check if user already has 4 or more meals for this date
      const { count, error: countError } = await supabase
        .from('user_meals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('date_only', targetDate);
      if (typeof count !== 'number') {
        return res.status(500).json({ error: "Could not determine meal count for this date" });
      }
      if (count >= 4) {
        return res.status(400).json({ error: 'Daily meal limit of 4 has been reached.' });
      }
      prompt = `Generate a personalized meal plan for a user with the following daily nutrition goals:\n- Calories: ${preferences.calories_target || 'N/A'} kcal\n- Protein: ${preferences.protein_target || 'N/A'}g\n- Carbs: ${preferences.carbs_target || 'N/A'}g\n- Fat: ${preferences.fat_target || 'N/A'}g\n\nRequirements:\n- Return exactly 4 meals: one breakfast, one lunch, one snack, one dinner.\n- Each meal must have a field \\\"meal_type\\\" with one of: \\\"breakfast\\\", \\\"lunch\\\", \\\"snack\\\", \\\"dinner\\\".\n- The sum of calories, protein, carbs, and fat across all 4 meals should add up to the user's daily goals as closely as possible.\n- For each meal, provide:\n  - meal_type\n  - meal_name\n  - serving_size\n  - recipe (instructions)\n  - nutrition_breakdown (calories, protein, carbs, fat)\n  - ingredients (with amounts)\n  - tags (e.g., vegetarian, gluten-free)\n\nReturn ONLY a JSON array of 4 objects, one for each meal type, with no extra text.`;
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    let meals;
    try {
      let content = completion.choices[0].message.content;
      if (!content) throw new Error('No content from OpenAI');
      if (mode === 'week') {
        // Try to parse as object of days
        const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
        for (const block of codeBlocks) {
          try {
            meals = JSON.parse(jsonrepair(block));
            break;
          } catch (e) {}
        }
        if (!meals && content) {
          const objStart = content.indexOf('{');
          const objEnd = content.lastIndexOf('}');
          if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
            try {
              meals = JSON.parse(jsonrepair(content.slice(objStart, objEnd + 1)));
            } catch (e) {}
          }
        }
        if (!meals) throw new Error('No valid JSON found');
      } else {
        // Day mode: array
        const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
        for (const block of codeBlocks) {
          try {
            meals = JSON.parse(jsonrepair(block));
            break;
          } catch (e) {}
        }
        if (!meals && content) {
          const arrStart = content.indexOf('[');
          const arrEnd = content.lastIndexOf(']');
          if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
            try {
              meals = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
            } catch (e) {}
          }
        }
        if (!meals) throw new Error('No valid JSON found');
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    // Insert meals
    let insertedMeals = [];
    if (mode === 'week') {
      // Robustly map meals to days
      let mealsByDay = {};
      if (typeof meals === 'object' && !Array.isArray(meals)) {
        const aiKeys = Object.keys(meals);
        console.log('AI meal plan keys:', aiKeys);
        // Try to map by ISO date keys
        let allKeysAreDates = aiKeys.every(k => targetDates.includes(k));
        if (allKeysAreDates) {
          for (let i = 0; i < targetDates.length; i++) {
            const day = targetDates[i];
            let dayMeals = meals[day];
            mealsByDay[day] = Array.isArray(dayMeals) ? dayMeals.slice(0, 4) : [];
          }
        } else {
          // Map values to days in order (first key = first day, etc.)
          for (let i = 0; i < targetDates.length; i++) {
            const day = targetDates[i];
            const key = aiKeys[i];
            let dayMeals = meals[key];
            mealsByDay[day] = Array.isArray(dayMeals) ? dayMeals.slice(0, 4) : [];
          }
        }
      } else if (Array.isArray(meals)) {
        // Fallback: flat array, split into 7 days
        for (let i = 0; i < targetDates.length; i++) {
          mealsByDay[targetDates[i]] = meals.slice(i * 4, (i + 1) * 4);
        }
      } else {
        return res.status(500).json({ error: 'AI response structure invalid for weekly meal plan.' });
      }
      // Insert meals for each day
      for (const day of targetDates) {
        const dayMeals = mealsByDay[day] || [];
        for (const meal of dayMeals) {
          let meal_type = (meal.meal_type || meal.meal || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
          const nb = meal.nutrition_breakdown || {};
          const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
          const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
          const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
          const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
          const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
          const recipe = meal.recipe || meal.recipe_instructions || meal.full_recipe || '';
          await supabase.from('user_meals').insert({
            user_id,
            date: day,
            date_only: day,
            meal_type,
            description: meal.meal_name,
            calories,
            protein,
            carbs,
            fat,
            serving_size: meal.serving_size,
            recipe,
            ingredients: meal.ingredients,
            tags: meal.tags,
          });
          insertedMeals.push({ ...meal, date: day });
        }
      }
    } else {
      const day = targetDates[0];
      for (const meal of meals) {
        let meal_type = (meal.meal_type || meal.meal || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
        const nb = meal.nutrition_breakdown || {};
        const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
        const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
        const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
        const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
        const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
        const recipe = meal.recipe || meal.recipe_instructions || meal.full_recipe || '';
        await supabase.from('user_meals').insert({
          user_id,
          date: day,
          date_only: day,
          meal_type,
          description: meal.meal_name,
          calories,
          protein,
          carbs,
          fat,
          serving_size: meal.serving_size,
          recipe,
          ingredients: meal.ingredients,
          tags: meal.tags,
        });
        insertedMeals.push({ ...meal, date: day });
      }
    }
    res.status(200).json({ meals: insertedMeals });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
}