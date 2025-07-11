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

    const applied_contexts = req.body.applied_contexts;
    // Build a detailed preferences string for the prompt
    const preferencesDetails = [
      `- Calories: ${preferences.calories_target || 'N/A'} kcal`,
      `- Protein: ${preferences.protein_target || 'N/A'}g`,
      `- Carbs: ${preferences.carbs_target || 'N/A'}g`,
      `- Fat: ${preferences.fat_target || 'N/A'}g`,
      preferences.fiber_target ? `- Fiber: ${preferences.fiber_target}g` : '',
      preferences.sodium_limit ? `- Sodium limit: ${preferences.sodium_limit}mg` : '',
      preferences.sugar_limit ? `- Sugar limit: ${preferences.sugar_limit}g` : '',
      preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0 ? `- Dietary restrictions: ${preferences.dietary_restrictions.join(', ')}` : '',
      preferences.allergies && preferences.allergies.length > 0 ? `- Allergies: ${preferences.allergies.join(', ')}` : '',
      preferences.notes ? `- Notes: ${preferences.notes}` : '',
      (applied_contexts && Array.isArray(applied_contexts) && applied_contexts.length > 0)
        ? `- Applied meal plan contexts: ${applied_contexts.map((c: string) => `"${c}"`).join(', ')}`
        : (preferences.contexts && Array.isArray(preferences.contexts) && preferences.contexts.length > 0 && !applied_contexts)
          ? `- Saved meal plan contexts: ${preferences.contexts.map((c: string) => `"${c}"`).join(', ')}`
          : '',
    ].filter(Boolean).join('\n');

    // Fetch current meals for context if regenerating
    let currentMealsContext = '';
    if (mode === 'week' && req.body.force_regen_week) {
      // Get all meals for the week
      const start = new Date(weekStart);
      const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      const { data: weekMeals, error: weekMealsError } = await supabase
        .from('user_meals')
        .select('date_only, meal_type, description')
        .eq('user_id', user_id)
        .in('date_only', weekDates);
      if (!weekMealsError && weekMeals && weekMeals.length > 0) {
        // Group by day
        const grouped: Record<string, any[]> = {};
        for (const meal of weekMeals) {
          if (!grouped[meal.date_only]) grouped[meal.date_only] = [];
          grouped[meal.date_only].push({ type: meal.meal_type, name: meal.description });
        }
        currentMealsContext = `Current meals for this week (by day):\n${JSON.stringify(grouped, null, 2)}`;
      }
    } else if (mode === 'day' && req.body.force_regen_day) {
      // Get all meals for the day
      const day = req.body.force_regen_day;
      const { data: dayMeals, error: dayMealsError } = await supabase
        .from('user_meals')
        .select('meal_type, description')
        .eq('user_id', user_id)
        .eq('date_only', day);
      if (!dayMealsError && dayMeals && dayMeals.length > 0) {
        currentMealsContext = `Current meals for this day:\n${JSON.stringify(dayMeals.map(m => ({ type: m.meal_type, name: m.description })), null, 2)}`;
      }
    }

    let prompt = '';
    let targetDates: string[] = [];
    const regenerate_feedback = req.body.regenerate_feedback;
    const meal_type = req.body.meal_type;
    const meal_types = req.body.meal_types;
    if (mode === 'week') {
      // Generate for the week starting from weekStart (YYYY-MM-DD)
      if (!weekStart) return res.status(400).json({ error: 'weekStart is required for weekly generation' });
      const start = new Date(weekStart);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        targetDates.push(d.toISOString().slice(0, 10));
      }
      prompt = `Generate a personalized meal plan for a user with the following nutrition preferences:\n${preferencesDetails}\n\n${currentMealsContext ? currentMealsContext + '\n\n' : ''}Requirements:\n- Return a JSON object with exactly 7 keys, one for each day (YYYY-MM-DD), each containing an array of exactly 4 meals: one breakfast, one lunch, one snack, one dinner.\n- Return exactly 28 meals in total, 4 per day.\n- Each meal must have a field "meal_type" with one of: "breakfast", "lunch", "snack", "dinner".\n- The sum of calories, protein, carbs, and fat across all 4 meals for each day should add up to the user's daily goals as closely as possible.\n- For each meal, provide:\n  - meal_type\n  - meal_name\n  - serving_size\n  - recipe (as a JSON array of clear, step-by-step instructions, not a single string)\n  - nutrition_breakdown (calories, protein, carbs, fat)\n  - ingredients (as a JSON array of objects, each with at least name and quantity, and optionally unit, brand, notes)\n  - tags (e.g., vegetarian, gluten-free)\n- IMPORTANT: Maximize variety across the week. Do NOT repeat the same meal more than once or twice in the week. Each day should have different meals.\n\n${regenerate_feedback ? `User feedback for this regeneration: ${regenerate_feedback}\n` : ''}Return ONLY a JSON object as described, with no extra text.`;
    } else if (mode === 'meal' && req.body.force_regen_day && meal_type) {
      // Regenerate only a specific meal for the day
      const day = req.body.force_regen_day;
      // Fetch current meals for the day
      const { data: dayMeals, error: dayMealsError } = await supabase
        .from('user_meals')
        .select('meal_type, description')
        .eq('user_id', user_id)
        .eq('date_only', day);
      let otherMeals = (dayMeals || []).filter(m => m.meal_type !== meal_type);
      prompt = `Regenerate only the ${meal_type} for this day, using the following feedback: "${regenerate_feedback || ''}".\nKeep the other meals (lunch, snack, dinner, etc.) unchanged.\nReturn only the new ${meal_type} meal as a JSON object with all required fields (meal_type, meal_name, serving_size, ingredients, recipe, nutrition_breakdown, tags).`;
      targetDates = [day];
    } else if (mode === 'day' && req.body.force_regen_day && Array.isArray(meal_types) && meal_types.length > 0) {
      // Regenerate only selected meal types for the day
      const day = req.body.force_regen_day;
      // Fetch current meals for the day
      const { data: dayMeals, error: dayMealsError } = await supabase
        .from('user_meals')
        .select('meal_type, description')
        .eq('user_id', user_id)
        .eq('date_only', day);
      let otherMeals = (dayMeals || []).filter(m => !meal_types.includes(m.meal_type));
      prompt = `Regenerate only the following meals for this day: ${meal_types.join(', ')}. Use the following feedback: "${regenerate_feedback || ''}".\nKeep the other meals unchanged.\nReturn a JSON array with only the regenerated meals, each as an object with all required fields (meal_type, meal_name, serving_size, ingredients, recipe, nutrition_breakdown, tags).`;
      targetDates = [day];
    } else {
      // Default to daily
      const targetDate = req.body.force_regen_day || date || new Date().toISOString().slice(0, 10);
      targetDates = [targetDate];
      prompt = `Generate a personalized meal plan for a user with the following nutrition preferences:\n${preferencesDetails}\n\n${currentMealsContext ? currentMealsContext + '\n\n' : ''}Requirements:\n- Return exactly 4 meals: one breakfast, one lunch, one snack, one dinner.\n- Each meal must have a field "meal_type" with one of: "breakfast", "lunch", "snack", "dinner".\n- The sum of calories, protein, carbs, and fat across all 4 meals should add up to the user's daily goals as closely as possible.\n- For each meal, provide:\n  - meal_type\n  - meal_name\n  - serving_size\n  - ingredients (as a JSON array of objects, each with at least 'name' (string) and 'quantity' (string or number), and optionally 'unit', 'brand', 'notes'; do NOT return [object Object] or any non-string in the list)\n  - recipe (as a JSON array of clear, step-by-step instructions, not a single string; each step should be a string)\n  - nutrition_breakdown (calories, protein, carbs, fat)\n  - tags (e.g., vegetarian, gluten-free)\n- IMPORTANT: Check the other meals in the current week and limit repetition. There can be some overlap, but do not repeat the same meal more than once or twice in the week.\n\n${regenerate_feedback ? `User feedback for this regeneration: ${regenerate_feedback}\n` : ''}Return ONLY a JSON array of 4 objects, one for each meal type, with no extra text.`;
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
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
      } else if (mode === 'meal' && meal_type) {
        // Parse single meal object
        let newMeal = null;
        if (content) {
          const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
          for (const block of codeBlocks) {
            try {
              newMeal = JSON.parse(jsonrepair(block));
              break;
            } catch (e) {}
          }
          if (!newMeal && content) {
            const objStart = content.indexOf('{');
            const objEnd = content.lastIndexOf('}');
            if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
              try {
                newMeal = JSON.parse(jsonrepair(content.slice(objStart, objEnd + 1)));
              } catch (e) {}
            }
          }
        }
        if (!newMeal) return res.status(500).json({ error: 'No valid JSON found for meal' });
        // Delete only the existing meal of this type for this user and day
        await supabase
          .from('user_meals')
          .delete()
          .eq('user_id', user_id)
          .eq('date_only', targetDates[0])
          .eq('meal_type', meal_type);
        // Insert the new meal
        let meal_type_final = (newMeal.meal_type || meal_type).toLowerCase();
        const nb = newMeal.nutrition_breakdown || {};
        const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
        const calories = nb.calories !== undefined ? parseMacro(nb.calories) : newMeal.calories;
        const protein = nb.protein !== undefined ? parseMacro(nb.protein) : newMeal.protein;
        const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : newMeal.carbs;
        const fat = nb.fat !== undefined ? parseMacro(nb.fat) : newMeal.fat;
        const recipe = parseRecipe(newMeal.recipe || newMeal.recipe_instructions || newMeal.full_recipe || '');
        await supabase.from('user_meals').insert({
          user_id,
          date: targetDates[0],
          date_only: targetDates[0],
          meal_type: meal_type_final,
          description: newMeal.meal_name,
          calories,
          protein,
          carbs,
          fat,
          serving_size: newMeal.serving_size,
          recipe,
          ingredients: parseIngredients(newMeal.ingredients),
          tags: newMeal.tags,
          source: 'ai',
        });
        return res.status(200).json({ meal: newMeal });
      } else if (mode === 'day' && Array.isArray(meal_types) && meal_types.length > 0) {
        const day = targetDates[0];
        // Delete only the selected meal types for this user and day
        await supabase
          .from('user_meals')
          .delete()
          .eq('user_id', user_id)
          .eq('date_only', day)
          .in('meal_type', meal_types);
        // Parse array of meals from AI
        let content = completion.choices[0].message.content;
        let newMeals = null;
        if (content) {
          const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
          for (const block of codeBlocks) {
            try {
              newMeals = JSON.parse(jsonrepair(block));
              break;
            } catch (e) {}
          }
          if (!newMeals && content) {
            const arrStart = content.indexOf('[');
            const arrEnd = content.lastIndexOf(']');
            if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
              try {
                newMeals = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
              } catch (e) {}
            }
          }
        }
        if (!Array.isArray(newMeals)) return res.status(500).json({ error: 'No valid JSON array found for meals' });
        let insertedMeals = [];
        for (const meal of newMeals) {
          let meal_type_final = (meal.meal_type || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
          const nb = meal.nutrition_breakdown || {};
          const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
          const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
          const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
          const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
          const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
          const recipe = parseRecipe(meal.recipe || meal.recipe_instructions || meal.full_recipe || '');
          await supabase.from('user_meals').insert({
            user_id,
            date: day,
            date_only: day,
            meal_type: meal_type_final,
            description: meal.meal_name,
            calories,
            protein,
            carbs,
            fat,
            serving_size: meal.serving_size,
            recipe,
            ingredients: parseIngredients(meal.ingredients),
            tags: meal.tags,
            source: 'ai',
          });
          insertedMeals.push({ ...meal, date: day });
        }
        return res.status(200).json({ meals: insertedMeals });
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
        // Use only the first 7 keys (days)
        const usedKeys = aiKeys.slice(0, 7);
        for (let i = 0; i < targetDates.length; i++) {
          const day = targetDates[i];
          const key = usedKeys[i];
          let dayMeals = meals[key];
          mealsByDay[day] = Array.isArray(dayMeals) ? dayMeals.slice(0, 4) : [];
        }
      } else if (Array.isArray(meals)) {
        // Fallback: flat array, use only the first 28 meals
        for (let i = 0; i < targetDates.length; i++) {
          mealsByDay[targetDates[i]] = meals.slice(i * 4, (i + 1) * 4);
        }
      } else {
        console.warn('AI response structure invalid for weekly meal plan.');
        return res.status(500).json({ error: 'AI response structure invalid for weekly meal plan.' });
      }
      // Final enforcement: only 7 days, only 4 meals per day
      const days = Object.keys(mealsByDay).slice(0, 7);
      let totalMeals = 0;
      for (const day of days) {
        mealsByDay[day] = (mealsByDay[day] || []).slice(0, 4);
        totalMeals += mealsByDay[day].length;
      }
      if (totalMeals > 28) {
        console.warn('More than 28 meals generated, truncating to 28.');
      }
      // Delete all existing meals for this user and all 7 dates before inserting new ones
      await supabase
        .from('user_meals')
        .delete()
        .eq('user_id', user_id)
        .in('date_only', days);
      // Insert meals for each day
      for (const day of days) {
        const dayMeals = mealsByDay[day] || [];
        for (const meal of dayMeals) {
          let meal_type = (meal.meal_type || meal.meal || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
          const nb = meal.nutrition_breakdown || {};
          const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
          const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
          const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
          const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
          const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
          const recipe = parseRecipe(meal.recipe || meal.recipe_instructions || meal.full_recipe || '');
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
            ingredients: parseIngredients(meal.ingredients),
            tags: meal.tags,
            source: 'ai',
          });
          insertedMeals.push({ ...meal, date: day });
          if (insertedMeals.length >= 28) break;
        }
        if (insertedMeals.length >= 28) break;
      }
    } else {
      const day = targetDates[0];
      // Delete all existing meals for this user and this date before inserting new ones
      await supabase
        .from('user_meals')
        .delete()
        .eq('user_id', user_id)
        .eq('date_only', day);
      for (const meal of meals) {
        let meal_type = (meal.meal_type || meal.meal || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
        const nb = meal.nutrition_breakdown || {};
        const parseMacro = (v: unknown): number => typeof v === 'string' ? parseFloat((v as string).replace(/[^\d.\-]/g, '')) : (v as number);
        const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
        const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
        const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
        const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
        const recipe = parseRecipe(meal.recipe || meal.recipe_instructions || meal.full_recipe || '');
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
          ingredients: parseIngredients(meal.ingredients),
          tags: meal.tags,
          source: 'ai',
        });
        insertedMeals.push({ ...meal, date: day });
      }
    }
    res.status(200).json({ meals: insertedMeals });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
}

const parseRecipe = (recipe: any) => {
  if (Array.isArray(recipe)) return recipe;
  if (typeof recipe === 'string') {
    try {
      const parsed = JSON.parse(recipe);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Try to split by step numbers or newlines
    const splitSteps = recipe.match(/(Step \d+: [^\n]+|[^\n]+(?=Step \d+:|$))/g)?.filter(s => s.trim()) || recipe.split(/\n|\r/).filter(s => s.trim());
    if (splitSteps.length > 1) return splitSteps;
    return [recipe];
  }
  return [];
};

const parseIngredients = (ingredients: any) => {
  if (Array.isArray(ingredients) && ingredients.length > 0 && typeof ingredients[0] === 'object') return ingredients;
  if (typeof ingredients === 'string') {
    try {
      const parsed = JSON.parse(ingredients);
      if (Array.isArray(parsed) && typeof parsed[0] === 'object') return parsed;
    } catch {}
  }
  // fallback: try to split by comma and treat as name only
  if (Array.isArray(ingredients)) {
    return ingredients.map((name: string) => ({ name }));
  }
  return [];
};