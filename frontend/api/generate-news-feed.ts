import { VercelRequest, VercelResponse } from '@vercel/node';
import NewsAPI from 'newsapi';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { user_id, preferences } = req.body;
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
    // 1. Fetch news from NewsAPI.org
    const query = {
      q: preferences.join(' '),
      language: 'en',
      pageSize: 10,
      sortBy: 'publishedAt',
    };
    console.log('[NewsAPI] Query:', query);
    const newsResponse = await newsapi.v2.everything(query);
    console.log('[NewsAPI] Response:', JSON.stringify(newsResponse, null, 2));
    if (newsResponse.status !== 'ok' || !newsResponse.articles) {
      res.status(500).json({ error: 'Failed to fetch news', details: newsResponse });
      return;
    }
    // 2. Prepare prompt for OpenAI
    const articlesForPrompt = newsResponse.articles.slice(0, 10).map(a => `Title: ${a.title}\nDescription: ${a.description}`).join('\n\n');
    const prompt = `User interests: ${preferences.join(', ')}\nNews articles: ${articlesForPrompt}\nTask: Generate a personalized news digest with 5 items. For each, provide a headline, a 1-2 sentence summary, and a reason why it matches the user's interests. Return as a JSON array.`;
    console.log('[OpenAI] Prompt:', prompt);
    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const aiContent = completion.choices[0].message.content;
    console.log('[OpenAI] Response:', aiContent);
    const aiNewsDigest = JSON.parse(aiContent);
    console.log('[AI News Digest]:', aiNewsDigest);

    // After getting aiNewsDigest (array of news articles)
    // Insert each article into user_news
    const now = new Date().toISOString();
    const inserts = Array.isArray(aiNewsDigest) ? aiNewsDigest.map((item: any) => ({
      user_id,
      headline: item.headline,
      summary: item.summary,
      reason: item.reason,
      source: item.source,
      url: item.url,
      date: now,
    })) : [];
    if (inserts.length > 0) {
      const { error: insertError } = await supabase.from('user_news').insert(inserts);
      if (insertError) {
        res.status(500).json({ error: 'Failed to save news to Supabase', details: insertError });
        return;
      }
    }
    res.status(200).json({ news: aiNewsDigest });
  } catch (err) {
    console.error('[API ERROR]', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
} 