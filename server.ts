// server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleProjectAnalysis } from './src/services/ai/serverCopilot';
import { telemetry } from './src/services/ai/telemetryService';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Telemetry & cost observability endpoint
app.get('/api/telemetry', (req, res) => {
  res.json(telemetry.getSummary());
});

// Server-side project analysis endpoint (protecting API keys from client)
app.post('/api/analyze-project', async (req, res) => {
  try {
    const clientId =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown_client';

    const { status, body } = await handleProjectAnalysis({
      ...req.body,
      clientId
    });

    return res.status(status).json(body);
  } catch (err: any) {
    console.error('[server.ts] Error in /api/analyze-project:', err);
    return res.status(500).json({ error: 'Internal server error', message: err?.message });
  }
});

// Vite middleware in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WHAT IF? Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
