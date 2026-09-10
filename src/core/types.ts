// src/core/types.ts

export type FactOrigin =
  | 'USER_PROVIDED'
  | 'DERIVED'
  | 'LIVE_SOURCE'
  | 'CACHED_SOURCE'
  | 'INTERNAL_BENCHMARK'
  | 'ASSUMPTION'
  | 'UNKNOWN';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Fact<T> {
  value: T | 'UNKNOWN';
  origin: FactOrigin;
  confidence?: ConfidenceLevel;
  source?: string;
  sourceUrl?: string;
  retrievedAt?: string;
  dependencies?: string[]; // IDs or keys of facts this was derived from
}

export type ProjectDomain =
  | 'travel'
  | 'relocation'
  | 'business'
  | 'career'
  | 'education'
  | 'real_estate'
  | 'purchase'
  | 'digital_project'
  | 'personal_finance'
  | 'life_change'
  | 'unknown';

export type UserIntent =
  | 'LEAVE_OR_TRAVEL'
  | 'START_BUSINESS'
  | 'CHANGE_CAREER'
  | 'RELOCATE'
  | 'BUY_SOMETHING'
  | 'GENERAL_ADVICE'
  | 'UNKNOWN';

export type RequestIntent =
  | 'ESTIMATE_COST'
  | 'CHECK_AFFORDABILITY'
  | 'COMPARE_OPTIONS'
  | 'FIND_SOLUTION'
  | 'BUILD_PLAN'
  | 'RESEARCH_REQUIREMENTS'
  | 'CHECK_ELIGIBILITY'
  | 'ESTIMATE_TIMELINE'
  | 'OPTIMIZE_BUDGET'
  | 'EXPLAIN'
  | 'BRAINSTORM'
  | 'RECOMMEND'
  | 'VERIFY_FACT'
  | 'START_PROJECT'
  | 'UNKNOWN';

export type NextBestAction =
  | 'ASK'
  | 'RESEARCH'
  | 'CALCULATE'
  | 'VERIFY'
  | 'COMPARE'
  | 'EXPLORE'
  | 'OPTIMIZE'
  | 'PLAN'
  | 'ANSWER';

export interface CostItem {
  id: string;
  category: string;
  label: string;
  min: number;
  max: number;
  isMandatory: boolean;
  source?: string;
  sourceUrl?: string;
  notes?: string;
}

export type OperatingModel = 'home' | 'mobile' | 'salon' | 'online' | 'unknown';

export interface ProjectState {
  // Goals and Intents
  rawGoal: string;
  interpretedGoal: Fact<string>;
  primaryIntent: Fact<UserIntent>;
  requestIntent: Fact<RequestIntent>;
  nextBestAction: NextBestAction;
  secondaryIntents: UserIntent[];
  activeDomains: ProjectDomain[];

  // Core Variables (NO DEFAULT VALUES ALLOWED)
  originLocation: Fact<string>;
  destinationLocation: Fact<string>;
  datesFlexible: Fact<boolean>;
  durationDays: Fact<number>;
  durationMonths: Fact<number>;
  
  availableBudget: Fact<number>;
  monthlyIncome: Fact<number>;
  monthlyExpenses: Fact<number>;
  monthlySavingsCapacity: Fact<number>;

  profession: Fact<string>;
  activitySubtype: Fact<string>;
  operatingModel: Fact<OperatingModel>;
  qualifications: Fact<string[]>;

  // Cost estimates and itemization
  costEstimateRange?: { min: number; max: number; items: CostItem[] };
  sources: Array<{ name: string; url?: string; note?: string }>;
  assumptions: string[];

  // Extensible facts (for domain specific facts)
  facts: Record<string, Fact<any>>;

  // Status
  readiness: 'NEEDS_INFO' | 'READY_FOR_RESEARCH' | 'READY_FOR_CALCULATION' | 'READY_FOR_RECOMMENDATION';
  missingCriticalFacts: string[];
}

export const createUnknownFact = <T>(): Fact<T> => ({
  value: 'UNKNOWN',
  origin: 'UNKNOWN'
});

export const createInitialProjectState = (goal: string): ProjectState => ({
  rawGoal: goal,
  interpretedGoal: createUnknownFact(),
  primaryIntent: createUnknownFact(),
  requestIntent: createUnknownFact(),
  nextBestAction: 'ASK',
  secondaryIntents: [],
  activeDomains: [],

  originLocation: createUnknownFact(),
  destinationLocation: createUnknownFact(),
  datesFlexible: createUnknownFact(),
  durationDays: createUnknownFact(),
  durationMonths: createUnknownFact(),
  
  availableBudget: createUnknownFact(),
  monthlyIncome: createUnknownFact(),
  monthlyExpenses: createUnknownFact(),
  monthlySavingsCapacity: createUnknownFact(),

  profession: createUnknownFact(),
  activitySubtype: createUnknownFact(),
  operatingModel: createUnknownFact(),
  qualifications: createUnknownFact(),

  sources: [],
  assumptions: [],

  facts: {},

  readiness: 'NEEDS_INFO',
  missingCriticalFacts: []
});
