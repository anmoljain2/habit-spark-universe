import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const WELLNESS_BOOKS = [
  { title: 'Atomic Habits', author: 'James Clear' },
  { title: 'The Power of Now', author: 'Eckhart Tolle' },
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey' },
  { title: 'The Four Agreements', author: 'Don Miguel Ruiz' },
  { title: 'Mindset: The New Psychology of Success', author: 'Carol S. Dweck' },
  { title: 'Why We Sleep', author: 'Matthew Walker' },
  { title: 'Daring Greatly', author: 'Brené Brown' },
  { title: 'The Miracle Morning', author: 'Hal Elrod' },
  { title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson' },
  { title: 'Ikigai: The Japanese Secret to a Long and Happy Life', author: 'Héctor García and Francesc Miralles' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.OPENAI_API_KEY) {
    res.status(500).json({ error: 'Missing OpenAI API key' });
    return;
  }

  let book;
  if (req.method === 'POST' && req.body && req.body.title) {
    book = { title: req.body.title, author: req.body.author || '' };
  } else {
    book = WELLNESS_BOOKS[Math.floor(Math.random() * WELLNESS_BOOKS.length)];
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const prompt = `Provide a detailed summary of the wellness book "${book.title}"${book.author ? ` by ${book.author}` : ''}.

1. Give a chapter-by-chapter summary, with each chapter's main points in 2-4 sentences.
2. After the chapter summaries, provide a bullet-point list of the book's key ideas and takeaways.
3. Make the summary comprehensive but readable, suitable for someone who wants to understand the book's structure and main lessons without reading the whole book.
Return the result as:
{
  "chapters": [
    { "chapter": "Chapter Title or Number", "summary": "Summary text" },
    ...
  ],
  "key_points": [
    "Key point 1",
    "Key point 2",
    ...
  ]
}
Do not include any extra commentary or explanation outside this JSON object.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const aiContent = completion.choices[0].message.content;
    let parsed = null;
    if (aiContent) {
      try {
        parsed = JSON.parse(aiContent);
      } catch {
        // fallback: try to extract JSON from code block
        const match = aiContent.match(/```json([\s\S]*?)```/);
        if (match) {
          try {
            parsed = JSON.parse(match[1].trim());
          } catch {}
        }
      }
    }
    if (!parsed) {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    res.status(200).json({
      title: book.title,
      author: book.author,
      chapters: parsed.chapters,
      key_points: parsed.key_points,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate book summary', details: err?.message || err });
  }
} 