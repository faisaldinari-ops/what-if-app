// src/core/controller/ResponseComposer.ts
import { ProjectState } from '../types';
import { MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';

export type ResponseType = 
  | 'NEEDS_INFORMATION'
  | 'RESEARCH_RESULTS'
  | 'CALCULATION_RESULTS'
  | 'RECOMMENDATION'
  | 'PLAN';

export interface NeedsInformationResponse {
  type: 'NEEDS_INFORMATION';
  state: ProjectState;
  question: MissingQuestion;
  message: string;
}

export interface RecommendationResponse {
  type: 'RECOMMENDATION';
  state: ProjectState;
  analysis: DecisionAnalysis;
  coPilot?: CoPilotResponse;
}

// We can map this back to the old AnalysisResponse for smooth frontend integration
export class ResponseComposer {
  static composeNeedsInfo(state: ProjectState, question: MissingQuestion, message: string): NeedsInformationResponse {
    return {
      type: 'NEEDS_INFORMATION',
      state,
      question,
      message
    };
  }

  static composeRecommendation(state: ProjectState, analysis: DecisionAnalysis, coPilot?: CoPilotResponse): RecommendationResponse {
    return {
      type: 'RECOMMENDATION',
      state,
      analysis,
      coPilot
    };
  }
}
