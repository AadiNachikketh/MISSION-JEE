import { callGrokServer, generateDemoReply, GROK_MODEL } from './grok.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      systemPrompt,
      messages = [],
      companion = 'calm',
      profile = {},
      purpose = 'chat',
      temperature,
    } = req.body || {};

    if (!systemPrompt || typeof systemPrompt !== 'string') {
      return res.status(400).json({ error: 'Missing required systemPrompt.' });
    }

    const result = await callGrokServer({
      systemPrompt,
      messages,
      companion,
      profile,
      purpose,
      temperature,
      stream: false,
    });

    return res.status(200).json({
      reply: result.reply,
      demoMode: result.demoMode,
      model: result.model,
    });
  } catch (err) {
    console.warn('[LAKSHYA] Serverless /api/chat fallback:', err);
    const {
      companion = 'calm',
      profile = {},
      messages = [],
      purpose = 'chat',
    } = req.body || {};
    return res.status(200).json({
      reply: generateDemoReply({ companion, profile, messages, purpose }),
      demoMode: true,
      model: `${GROK_MODEL} (Fallback)`,
    });
  }
}
