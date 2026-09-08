// src/types/planning.ts
import { ConfidenceLevel, ProjectDomain } from './context';
import { CostRange, ResearchFact } from './research';

export interface MilestonePath {
  id: string;
  step: number;
  timeframe: string;
  title: string;
  action: string;
  targetBudget?: number;
  legalAspects?: string;
  difficulty: 'accessible' | 'moderate' | 'challenging';
}

export interface DestinationShortlistOption {
  id: string;
  country: string;
  city?: string;
  flag: string;
  compatibilityScore: number; // 0-100
  matchReason: string;
  installationBudgetRange: CostRange;
  monthlyRentIndicative: number;
  monthlyCostOfLivingIndicative: number;
  indicativeSalary: number;
  potentialJobs: string[];
  constraints: string[];
  languageRequired: string;
  difficultyLevel: 'Facile' | 'Modéré' | 'Exigeant';
  badge?: string; // 'Option la plus facile' | 'Meilleur rapport coût / opportunités' | 'Option ambitieuse'
}

export interface CareerShortlistOption {
  id: string;
  title: string;
  compatibilityScore: number;
  whyMatches: string;
  trainingTimeMonths: number;
  trainingCostRange: CostRange;
  expectedSalaryRange: CostRange;
  difficulty: 'Facile' | 'Moyen' | 'Exigeant';
  firstStep: string;
  badge?: string;
}

export interface BusinessBlueprint {
  businessType: string;
  minimalVersion: {
    title: string;
    description: string;
    startupCost: number;
    monthlyRunningCost: number;
    recommendedReserve: number;
    breakEvenMonthlyRevenue: number;
    risk: 'low' | 'medium' | 'high';
    estimatedLaunchWeeks: number;
  };
  realisticVersion: {
    title: string;
    description: string;
    startupCost: number;
    monthlyRunningCost: number;
    recommendedReserve: number;
    breakEvenMonthlyRevenue: number;
    risk: 'low' | 'medium' | 'high';
    estimatedLaunchWeeks: number;
  };
  completeVersion: {
    title: string;
    description: string;
    startupCost: number;
    monthlyRunningCost: number;
    recommendedReserve: number;
    breakEvenMonthlyRevenue: number;
    risk: 'low' | 'medium' | 'high';
    estimatedLaunchWeeks: number;
  };
}

export interface TravelBreakdown {
  flights: CostRange;
  localTransport: CostRange;
  accommodation: CostRange;
  food: CostRange;
  activities: CostRange;
  insuranceAndFormalities: CostRange;
  safetyBuffer: CostRange;
  totalRange: CostRange;
  durationDays: number;
  destination: string;
  distanceToRealistic: number; // gap between user budget and realistic
  monthsToSaveIfSaving?: {
    monthlySavings: number;
    monthsNeeded: number;
  };
}

export interface SmartCTAAction {
  id: string;
  label: string;
  icon?: string;
  actionType:
    | 'FIND_CHEAPER'
    | 'BUILD_PATH'
    | 'COMPARE_OPTIONS'
    | 'WAIT_MONTHS'
    | 'ADD_BUDGET'
    | 'CHANGE_COUNTRY'
    | 'REDUCE_BUDGET'
    | 'SHOW_RISKS'
    | 'START_THIS_WEEK';
  payload?: Record<string, any>;
}

export interface CoPilotResponse {
  intent: string;
  domain: ProjectDomain;
  headlineVerdict: string; // e.g. "OUI, TON PROJET EST RÉALISTE" | "OUI, MAIS PAS EXACTEMENT COMME TU L'IMAGINAIS" | "PAS ENCORE, MAIS IL EXISTE UN CHEMIN"
  whySummary: string; // Max 3 human sentences
  keyFigures: {
    label: string;
    value: string;
    sublabel?: string;
    highlight?: boolean;
  }[];
  mainObstacle: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  };
  recommendationShortPlan: string;
  options: {
    original: { name: string; cost: string; summary: string };
    reduced: { name: string; cost: string; summary: string };
    minimal: { name: string; cost: string; summary: string };
  };
  stepByStepPlan: {
    step: number;
    title: string;
    detail: string;
    timing: string;
  }[];
  travelBreakdown?: TravelBreakdown;
  relocationShortlist?: DestinationShortlistOption[];
  careerShortlist?: CareerShortlistOption[];
  businessBlueprint?: BusinessBlueprint;
  constructedPath?: MilestonePath[];
  researchFacts: ResearchFact[];
  confidence: ConfidenceLevel;
  confidenceExplanation?: string;
  smartCTAs: SmartCTAAction[];
}
