// src/core/controller/ResponseComposer.ts
import { ProjectState, NextBestAction, CostItem } from '../types';
import { MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';

export type ResponseType = 
  | 'NEEDS_INFORMATION'
  | 'COST_ESTIMATE'
  | 'AFFORDABILITY'
  | 'RESEARCH_RESULTS'
  | 'CALCULATION_RESULTS'
  | 'RECOMMENDATION'
  | 'PLAN';

export interface NeedsInformationResponse {
  type: 'NEEDS_INFORMATION';
  state: ProjectState;
  question: MissingQuestion;
  message: string;
  nextAction: NextBestAction;
  ctaLabel?: string;
}

export interface CostEstimateResponse {
  type: 'COST_ESTIMATE';
  state: ProjectState;
  title: string;
  activitySubtype: string;
  operatingModel: string;
  minimumEstimate: number;
  maximumEstimate: number;
  currency: string;
  costItems: CostItem[];
  sources: Array<{ name: string; url?: string; note?: string }>;
  assumptions: string[];
  summary: string;
  followUpQuestion?: MissingQuestion;
}

export interface AffordabilityResponse {
  type: 'AFFORDABILITY';
  state: ProjectState;
  budgetAvailable: number;
  costMin: number;
  costMax: number;
  isAffordable: 'YES' | 'TIGHT' | 'NO';
  gapOrSurplus: number;
  recommendations: string[];
}

export interface RecommendationResponse {
  type: 'RECOMMENDATION';
  state: ProjectState;
  analysis: DecisionAnalysis;
  coPilot?: CoPilotResponse;
}

export type CoreDecisionResponse =
  | NeedsInformationResponse
  | CostEstimateResponse
  | AffordabilityResponse
  | RecommendationResponse;

export class ResponseComposer {
  static composeNeedsInfo(
    state: ProjectState,
    question: MissingQuestion,
    message: string,
    nextAction: NextBestAction = 'ASK',
    ctaLabel?: string
  ): NeedsInformationResponse {
    return {
      type: 'NEEDS_INFORMATION',
      state,
      question,
      message,
      nextAction,
      ctaLabel
    };
  }

  static composeCostEstimate(
    state: ProjectState,
    title: string,
    activitySubtype: string,
    operatingModel: string,
    minimumEstimate: number,
    maximumEstimate: number,
    currency: string,
    costItems: CostItem[],
    sources: Array<{ name: string; url?: string; note?: string }>,
    assumptions: string[],
    summary: string,
    followUpQuestion?: MissingQuestion
  ): CostEstimateResponse {
    return {
      type: 'COST_ESTIMATE',
      state,
      title,
      activitySubtype,
      operatingModel,
      minimumEstimate,
      maximumEstimate,
      currency,
      costItems,
      sources,
      assumptions,
      summary,
      followUpQuestion
    };
  }

  static composeAffordability(
    state: ProjectState,
    budgetAvailable: number,
    costMin: number,
    costMax: number,
    isAffordable: 'YES' | 'TIGHT' | 'NO',
    gapOrSurplus: number,
    recommendations: string[]
  ): AffordabilityResponse {
    return {
      type: 'AFFORDABILITY',
      state,
      budgetAvailable,
      costMin,
      costMax,
      isAffordable,
      gapOrSurplus,
      recommendations
    };
  }

  static composeRecommendation(
    state: ProjectState,
    analysis: DecisionAnalysis,
    coPilot?: CoPilotResponse
  ): RecommendationResponse {
    return {
      type: 'RECOMMENDATION',
      state,
      analysis,
      coPilot
    };
  }
}

