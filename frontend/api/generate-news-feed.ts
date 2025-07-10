import { VercelRequest, VercelResponse } from '@vercel/node';
import NewsAPI from 'newsapi';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { jsonrepair } from 'jsonrepair';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id, preferences, regenerate_feedback } = req.body;
  if (!user_id || !preferences || !Array.isArray(preferences)) {
    res.status(400).json({ error: 'user_id and preferences (array) are required' });
    return;
  }

  if (!process.env.NEWSAPI_KEY || !process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: 'Missing required environment variables' });
    return;
  }

  const newsapi = new NewsAPI(process.env.NEWSAPI_KEY);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Date boundaries for today in UTC
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const todayStart = `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
    const tomorrow = new Date(Date.UTC(yyyy, now.getUTCMonth(), now.getUTCDate() + 1));
    const tomorrowStart = tomorrow.toISOString().slice(0, 10) + 'T00:00:00.000Z';
    const nowISOString = now.toISOString();

    // Delete previous news for today for this user
    const { error: deleteError } = await supabase
      .from('user_news')
      .delete()
      .eq('user_id', user_id)
      .gte('date', todayStart)
      .lt('date', tomorrowStart);
    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete previous news', details: deleteError });
      return;
    }
    // 1. Fetch news from NewsAPI.org (top headlines from major sources)
    const majorSources = 'cnbc,npr,espn,cnn,bbc-news,abc-news,nbc-news,fox-news,techcrunch,engadget';
    const query: any = {
      sources: majorSources,
      language: 'en',
      pageSize: 10,
    };
    if (preferences && preferences.length > 0) {
      query.q = preferences.join(' ');
    }
    console.log('[NewsAPI] Query:', query);
    const newsResponse = await newsapi.v2.topHeadlines(query);
    console.log('[NewsAPI] Response:', JSON.stringify(newsResponse, null, 2));
    if (newsResponse.status !== 'ok' || !newsResponse.articles) {
      res.status(500).json({ error: 'Failed to fetch news', details: newsResponse });
      return;
    }
    // 2. Prepare prompt for OpenAI
    const articlesForPrompt = newsResponse.articles.slice(0, 10).map(a => `Title: ${a.title}\nDescription: ${a.description}`).join('\n\n');
    let prompt = `User interests: ${preferences.join(', ')}\nNews articles: ${articlesForPrompt}\n`;
    if (regenerate_feedback && regenerate_feedback.trim()) {
      prompt += `\nUser feedback for this news generation: \"${regenerate_feedback.trim()}\". Please use this feedback to better tailor the news selection and summaries.`;
    }
    prompt += `\nTask: Generate a personalized news digest with 5 items. For each item, provide:\n- headline: a concise headline\n- summary: a detailed summary covering all the main points of the article\n- url: the original article URL (from the news list above)\nReturn as a JSON array. Only use major, widely-reported headlines from the provided articles, not niche or obscure stories. Do not include any extra commentary.`;
    console.log('[OpenAI] Prompt:', prompt);
    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const aiContent = completion.choices[0].message.content;
    console.log('[OpenAI] Response:', aiContent);
    // Robust JSON extraction and repair
    let aiNewsDigest = null;
    if (aiContent) {
      // Try to extract from code block
      const codeBlocks = [...aiContent.matchAll(/```json([\s\S]*?)```/g)].map(m => m[1].trim());
      for (const block of codeBlocks) {
        try {
          aiNewsDigest = JSON.parse(jsonrepair(block));
          break;
        } catch (e) {}
      }
      // Fallback: try to parse from first array/object in content
      if (!aiNewsDigest && aiContent) {
        const arrStart = aiContent.indexOf('[');
        const arrEnd = aiContent.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
          try {
            aiNewsDigest = JSON.parse(jsonrepair(aiContent.slice(arrStart, arrEnd + 1)));
          } catch (e) {}
        }
        if (!aiNewsDigest) {
          const objStart = aiContent.indexOf('{');
          const objEnd = aiContent.lastIndexOf('}');
          if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
            try {
              aiNewsDigest = JSON.parse(jsonrepair(aiContent.slice(objStart, objEnd + 1)));
            } catch (e) {}
          }
        }
      }
    }
    if (!aiNewsDigest) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    console.log('[AI News Digest]:', aiNewsDigest);

    // After getting aiNewsDigest (array of news articles)
    // Insert each article into user_news
    const inserts = Array.isArray(aiNewsDigest) ? aiNewsDigest.map((item: any, idx: number) => ({
      user_id,
      headline: item.headline,
      summary: item.summary,
      url: item.url,
      date: nowISOString,
      source: item.source || newsResponse.articles[idx]?.source?.name || null,
    })) : [];
    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from('user_news').insert(inserts);
      if (insertError) {
        res.status(500).json({ error: 'Failed to save news to Supabase', details: insertError });
        return;
      }
    }
    // Fetch only today's news for this user
    const { data: todaysNews, error: fetchError } = await supabase
      .from('user_news')
      .select('*')
      .eq('user_id', user_id)
      .gte('date', todayStart)
      .lt('date', tomorrowStart)
      .order('date', { ascending: true });
    if (fetchError) {
      res.status(500).json({ error: 'Failed to fetch today\'s news', details: fetchError });
      return;
    }
    res.status(200).json({ news: todaysNews });
  } catch (err) {
    console.error('[API ERROR]', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
} 