// api/telemetry.ts
import { telemetry } from '../src/services/ai/telemetryService';

interface ServerlessRequest {
  method?: string;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (body: any) => void;
}

export default function handler(req: ServerlessRequest, res: ServerlessResponse) {
  return res.status(200).json(telemetry.getSummary());
}
