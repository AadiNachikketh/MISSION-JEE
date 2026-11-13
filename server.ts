import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { callGrokServer, generateDemoReply, GROK_MODEL } from './api/grok.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function refreshEnv() {
  dotenv.config({ path: path.join(__dirname, '.env'), override: true });
  dotenv.config({ path: path.join(__dirname, '.env.example'), override: false });
}

refreshEnv();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  /**
   * GET /api/status
   * Reports whether XAI_API_KEY is configured on the server or if Demo Mode is active.
   */
  app.get('/api/status', (_req, res) => {
    refreshEnv();
    const key = (process.env.XAI_API_KEY || process.env.GROQ_API_KEY || '').trim();
    const hasKey = Boolean(
      key && key !== 'MY_XAI_API_KEY' && key !== 'your_xai_api_key_here'
    );
    res.json({
      configured: hasKey,
      demoMode: !hasKey,
      model: key.startsWith('gsk_') ? 'llama-3.3-70b-versatile' : GROK_MODEL,
    });
  });

  /**
   * POST /api/chat
   * Backend proxy route that holds XAI_API_KEY and forwards requests to xAI or Groq Cloud.
   * Falls back to Demo Mode with realistic, profile-aware replies if no key is configured.
   */
  app.post('/api/chat', async (req, res) => {
    refreshEnv();
    try {
      const {
        systemPrompt,
        messages = [],
        companion = 'calm',
        profile = {},
        purpose = 'chat',
        temperature,
        stream = false,
      } = req.body || {};

      if (!systemPrompt || typeof systemPrompt !== 'string') {
        res.status(400).json({
          error: 'Missing required systemPrompt in /api/chat request.',
        });
        return;
      }

      const result = await callGrokServer({
        systemPrompt,
        messages,
        companion,
        profile,
        purpose,
        temperature,
        stream: Boolean(stream),
      });

      // If real xAI SSE stream was returned, pipe it to client
      if (stream && !result.demoMode && result.response && result.response.body) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Lakshya-Demo', 'false');

        const reader = result.response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
        return;
      }

      // If client requested stream in Demo Mode, stream tokens smoothly via SSE
      if (stream && result.demoMode && result.reply) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Lakshya-Demo', 'true');

        const words = result.reply.split(' ');
        const chunkSize = 3;
        for (let i = 0; i < words.length; i += chunkSize) {
          const piece =
            words.slice(i, i + chunkSize).join(' ') +
            (i + chunkSize < words.length ? ' ' : '');
          res.write(
            `data: ${JSON.stringify({
              demoMode: true,
              choices: [{ delta: { content: piece } }],
            })}\n\n`
          );
          await new Promise((r) => setTimeout(r, 22));
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }

      res.json({
        reply: result.reply,
        demoMode: result.demoMode,
        model: result.model,
      });
    } catch (err: unknown) {
      console.warn('[LAKSHYA] /api/chat error, returning fallback reply:', err);
      const {
        companion = 'calm',
        profile = {},
        messages = [],
        purpose = 'chat',
      } = req.body || {};
      const fallbackReply = generateDemoReply({
        companion,
        profile,
        messages,
        purpose,
      });
      res.status(200).json({
        reply: fallbackReply,
        demoMode: true,
        model: `${GROK_MODEL} (Fallback)`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LAKSHYA Mission Control server running on http://localhost:${PORT}`);
  });
}

startServer();
