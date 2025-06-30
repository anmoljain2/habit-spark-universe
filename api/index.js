
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const { jsonrepair } = require('jsonrepair');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI and Supabase clients
let openai, supabase;

try {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY environment variable is missing');
  } else {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase environment variables are missing');
  } else {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
} catch (error) {
  console.error('Error initializing services:', error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    openai: !!openai,
    supabase: !!supabase,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate-meal-plan', async (req, res) => {
  console.log('Generate meal plan request received');
  
  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  try {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const date_only_str = `${yyyy}-${mm}-${dd}`;

    // Check if user already has 5 or more meals for today
    const { count, error: countError } = await supabase
      .from('user_meals')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('date_only', date_only_str);

    if (countError) {
      console.error('Error counting meals:', countError);
      return res.status(500).json({ error: "Failed to count today's meals" });
    }

    if (count >= 5) {
      return res.status(400).json({ error: 'Daily meal limit of 5 has been reached.' });
    }

    console.log('Looking for user nutrition preferences for user_id:', user_id);
    const { data: preferences, error: prefError } = await supabase
      .from('user_nutrition_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    console.log('Preferences found:', preferences, 'Error:', prefError);

    if (!preferences) {
      return res.status(404).json({ error: 'User preferences not found. Please set up your nutrition preferences first.' });
    }

    // Build OpenAI prompt
    const prompt = `Generate a personalized meal plan for a user with the following daily nutrition goals:
- Calories: ${preferences.calories_target || 'N/A'} kcal
- Protein: ${preferences.protein_target || 'N/A'}g
- Carbs: ${preferences.carbs_target || 'N/A'}g
- Fat: ${preferences.fat_target || 'N/A'}g

Requirements:
- Return exactly 4 meals: one breakfast, one lunch, one snack, one dinner.
- Each meal must have a field "meal_type" with one of: "breakfast", "lunch", "snack", "dinner".
- The sum of calories, protein, carbs, and fat across all 4 meals should add up to the user's daily goals as closely as possible.
- For each meal, provide:
  - meal_type
  - meal_name
  - serving_size
  - recipe (instructions)
  - nutrition_breakdown (calories, protein, carbs, fat)
  - ingredients (with amounts)
  - tags (e.g., vegetarian, gluten-free)

Return ONLY a JSON array of 4 objects, one for each meal type, with no extra text.`;

    console.log('Calling OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    console.log('OpenAI response received');

    // Parse AI response
    let meals;
    try {
      let content = completion.choices[0].message.content;
      console.log('Raw AI response:', content);
      
      // Find all code blocks with json
      const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
      for (const block of codeBlocks) {
        try {
          meals = JSON.parse(jsonrepair(block));
          break;
        } catch (e) {
          console.log('Failed to parse code block:', e);
        }
      }
      
      // If no code block worked, try to find the first array/object in the whole string
      if (!meals) {
        const arrStart = content.indexOf('[');
        const arrEnd = content.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            meals = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
          } catch (e) {
            console.log('Failed to parse array from content:', e);
          }
        }
      }
      
      if (!meals) throw new Error('No valid JSON found');
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    console.log('Parsed meals:', meals);

    // Save meals to database
    const today = new Date().toISOString().slice(0, 10);
    const allowedTypes = new Set(['breakfast', 'lunch', 'snack', 'dinner']);
    let insertedTypes = new Set();
    
    for (const meal of meals) {
      // Normalize meal_type
      let meal_type = (meal.meal_type || meal.meal || (meal.meal_name ? meal.meal_name.split(/[:\-]/)[0].trim().toLowerCase() : undefined) || '').toLowerCase();
      
      if (!allowedTypes.has(meal_type) || insertedTypes.has(meal_type)) {
        continue;
      }
      
      insertedTypes.add(meal_type);
      
      // Normalize nutrition fields
      const nb = meal.nutrition_breakdown || {};
      const parseMacro = v => typeof v === 'string' ? parseFloat(v.replace(/[^\d.\-]/g, '')) : v;
      const calories = nb.calories !== undefined ? parseMacro(nb.calories) : meal.calories;
      const protein = nb.protein !== undefined ? parseMacro(nb.protein) : meal.protein;
      const carbs = nb.carbs !== undefined ? parseMacro(nb.carbs) : meal.carbs;
      const fat = nb.fat !== undefined ? parseMacro(nb.fat) : meal.fat;
      const recipe = meal.recipe || meal.recipe_instructions || meal.full_recipe || '';

      const date_only = `${yyyy}-${mm}-${dd}`;

      // Check for existing meal of this type for today
      const { data: existing, error: checkError } = await supabase
        .from('user_meals')
        .select('id')
        .eq('user_id', user_id)
        .eq('date_only', date_only)
        .eq('meal_type', meal_type)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing meal:', checkError);
        continue;
      }

      if (!existing) {
        const { error: insertError } = await supabase.from('user_meals').insert({
          user_id,
          date: today,
          date_only,
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

        if (insertError) {
          console.error('Error inserting meal:', insertError);
        } else {
          console.log('Successfully inserted meal:', meal_type);
        }
      }
    }

    console.log('Meal generation completed successfully');
    res.status(200).json({ meals, message: 'Meals generated successfully' });
    
  } catch (error) {
    console.error('Error in generate-meal-plan:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Test endpoint for Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  
  try {
    const { data, error } = await supabase
      .from('user_nutrition_preferences')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For Vercel serverless functions, we need to export the app
module.exports = app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
