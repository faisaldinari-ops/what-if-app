// api/health.ts
interface ServerlessRequest {
  method?: string;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (body: any) => void;
}

export default function handler(req: ServerlessRequest, res: ServerlessResponse) {
  return res.status(200).json({
    status: 'ok',
    environment: 'vercel_serverless',
    time: new Date().toISOString()
  });
}
