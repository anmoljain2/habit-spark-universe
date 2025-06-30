// import { OpenAI } from 'openai';
// import { createClient } from '@supabase/supabase-js';
import { jsonrepair } from 'jsonrepair';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ message: 'Hello from minimal test handler!' });
} 