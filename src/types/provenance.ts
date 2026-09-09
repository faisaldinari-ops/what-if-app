// src/types/provenance.ts
import { UserContext } from './context';

export type FeasibilityState =
  | 'POSSIBLE_NOW'
  | 'POSSIBLE_WITH_PLAN'
  | 'NOT_REALISTIC_YET';

export type DataOrigin =
  | 'USER'
  | 'LIVE_SOURCE'
  | 'CALCULATED'
  | 'ESTIMATE'
  | 'ASSUMPTION';

export type Freshness =
  | 'LIVE'
  | 'RECENT'
  | 'STALE'
  | 'UNKNOWN';

export interface GroundedValue<T> {
  value: T;
  origin: DataOrigin;
  sourceName?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  confidence: 'high' | 'medium' | 'low';
  freshness?: Freshness;
}

export interface GroundedFact {
  id: string;
  label: string;
  value: string | number;
  origin: DataOrigin;
  sourceName?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  confidence: 'high' | 'medium' | 'low';
  freshness?: Freshness;
  isLegalWarning?: boolean;
  notes?: string;
}

export interface ResearchResult {
  taskId: string;
  topic: string;
  query: string;
  findings: string;
  facts: GroundedFact[];
  confidence: 'high' | 'medium' | 'low';
  sourceTier: 'official' | 'recognized_platform' | 'specialized' | 'general' | 'estimate';
  sourceName: string;
  sourceUrl?: string;
  retrievedAt: string;
}

export interface CalculationResult {
  id: string;
  label: string;
  formula: string;
  inputs: Record<string, any>;
  result: number | string;
  origin: DataOrigin;
  confidence: 'high' | 'medium' | 'low';
}

export interface LifePlanMilestone {
  stage: 'NOW' | 'NEXT' | 'LATER';
  title: string;
  description: string;
  actions: string[];
  requiredCapital: number;
  timeline: string;
  difficulty: 'accessible' | 'moderate' | 'challenging';
}

export interface LifePlan {
  headline: string;
  feasibilityState: FeasibilityState;
  whySummary: string;
  now: {
    title: string;
    description: string;
    actions: string[];
    cost: number;
    timeline: string;
  };
  next: {
    title: string;
    description: string;
    milestones: string[];
    cost: number;
    timeline: string;
  };
  later: {
    title: string;
    description: string;
    goals: string[];
    cost: number;
    timeline: string;
  };
  alternatives: {
    title: string;
    summary: string;
    costDifference: string;
    reason: string;
  }[];
}

export interface ProjectSession {
  id: string;
  objective: string;
  conversation: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }[];
  userProfile: UserContext;
  facts: GroundedFact[];
  assumptions: GroundedFact[];
  research: ResearchResult[];
  calculations: CalculationResult[];
  currentPlan?: LifePlan;
  createdAt: string;
  updatedAt: string;
}
