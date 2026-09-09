// api/analyze-project.ts
import { handleProjectAnalysis } from '../src/services/ai/serverCopilot';

interface ServerlessRequest {
  method?: string;
  body?: any;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (body: any) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'vercel_serverless_client';

  const { status, body } = await handleProjectAnalysis({
    ...req.body,
    clientId
  });

  return res.status(status).json(body);
}
