import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { startOfWeek, endOfWeek, formatISO } from 'date-fns';
import { jsonrepair } from 'jsonrepair';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id } = req.body;
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
    // 1. Check for existing workouts for this week
    const now = new Date();
    const weekStart = formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
    const weekEnd = formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
    const { data: existingWorkouts, error: existingError } = await supabase
      .from('user_workouts')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', weekStart)
      .lte('date', weekEnd);
    if (existingError) {
      return res.status(500).json({ error: 'Failed to check existing workouts' });
    }
    if (existingWorkouts && existingWorkouts.length > 0) {
      return res.status(400).json({ error: 'Workout plan for this week already exists', workouts: existingWorkouts });
    }

    // 2. Fetch user fitness preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_fitness_goals')
      .select('*')
      .eq('user_id', user_id)
      .single();
    if (prefError || !preferences) {
      return res.status(404).json({ error: 'User fitness preferences not found' });
    }

    // 3. Build OpenAI prompt
    const prompt = `Generate a personalized weekly workout plan for a user with these preferences:
- Days per week: ${preferences.days_per_week || 'N/A'}
- Minutes per session: ${preferences.minutes_per_session || 'N/A'}
- Intensity: ${preferences.intensity || 'N/A'}
- Cardio preferences: ${(preferences.cardio_preferences || []).join(', ') || 'N/A'}
- Muscle focus: ${(preferences.muscle_focus || []).join(', ') || 'N/A'}
- Equipment: ${(preferences.equipment_available || []).join(', ') || 'N/A'}
- Injury limitations: ${preferences.injury_limitations || 'None'}
- Preferred time of day: ${preferences.preferred_time_of_day || 'Any'}

Return a JSON array of 7 objects, one for each day (Monday to Sunday). Each object should include:
- day (e.g., 'Monday')
- workout_type (e.g., 'Upper Body', 'Cardio', etc.)
- exercises: array of { name, sets, reps, rest, notes }
- summary: string
If a day is a rest day, set workout_type to 'Rest' and exercises to an empty array. Do not include any extra text.`;

    // 4. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    let plan;
    try {
      let content = completion.choices[0].message.content;
      if (!content) throw new Error('No content from OpenAI');
      // Try to extract JSON from code block or direct
      const codeBlocks = [...content.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
      for (const block of codeBlocks) {
        try {
          plan = JSON.parse(jsonrepair(block));
          break;
        } catch (e) {}
      }
      if (!plan && content) {
        const arrStart = content.indexOf('[');
        const arrEnd = content.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            plan = JSON.parse(jsonrepair(content.slice(arrStart, arrEnd + 1)));
          } catch (e) {}
        }
      }
      if (!plan) throw new Error('No valid JSON found');
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    // 5. Save plan to user_workouts (one row per day)
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekStartDate = new Date(weekStart);
    for (let i = 0; i < plan.length; i++) {
      const day = plan[i];
      // Calculate the date for this day
      const workoutDate = new Date(weekStartDate);
      workoutDate.setDate(weekStartDate.getDate() + i);
      const dateStr = workoutDate.toISOString().slice(0, 10);

      // Calculate total sets and reps for the day
      let totalSets = null;
      let totalReps = null;
      if (Array.isArray(day.exercises) && day.exercises.length > 0) {
        totalSets = day.exercises.reduce((sum, ex) => sum + (parseInt(ex.sets) || 0), 0);
        totalReps = day.exercises.reduce((sum, ex) => sum + (parseInt(ex.reps) || 0), 0);
      }

      const { error: insertError } = await supabase.from('user_workouts').insert({
        user_id,
        date: dateStr,
        workout_type: day.workout_type,
        details: day,
        completed: false,
        week_start: weekStart,
        sets: totalSets,
        reps: totalReps,
      });

      if (insertError) {
        console.error('Failed to insert workout for', day.day, insertError);
      }
    }

    res.status(200).json({ plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'A server error has occurred' });
  }
} 