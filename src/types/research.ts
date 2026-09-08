// src/types/research.ts
import { ConfidenceLevel } from './context';

export interface ResearchFact {
  label: string;
  value: string | number;
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  confidence: ConfidenceLevel;
  isEstimate: boolean;
  notes?: string;
}

export type ResearchTaskType =
  | 'flight'
  | 'hotel'
  | 'cost_of_living'
  | 'salary'
  | 'housing'
  | 'job_market'
  | 'business_cost'
  | 'regulation'
  | 'transport';

export interface ResearchTask {
  id: string;
  type: ResearchTaskType;
  query: string;
  location?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  contextParams?: Record<string, any>;
}

export interface CostRange {
  min: number;
  realistic: number;
  comfortable: number;
  currency: string;
  confidence: ConfidenceLevel;
  notes?: string;
}
