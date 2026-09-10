// src/services/ai/projectAnalyzer.ts
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { DecisionController } from '../../core/controller/DecisionController';

export interface AnalysisResponse {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
  analysis?: DecisionAnalysis;
  coPilot?: CoPilotResponse;
  aiEnhanced?: boolean;
}

export async function analyzeProjectInput(
  prompt: string,
  existingData?: Partial<UserExtractedData>,
  lang: SupportedLang = 'fr',
  currency: SupportedCurrency = 'EUR'
): Promise<AnalysisResponse> {
  // Use the new Decision Controller
  const previousState = existingData?.customAnswers?.__projectState || null;
  // Forward frontend root state to DecisionController via existingData/customAnswers
  const frontendAnswers = {
    ...(existingData?.customAnswers || {}),
    _budget: existingData?.budget,
    _monthlyIncome: existingData?.monthlyIncome,
    _monthlyExpenses: existingData?.monthlyExpenses,
    _durationMonths: existingData?.timelineMonths,
  };
  
  const response = await DecisionController.processTurn(prompt, previousState, lang, currency, frontendAnswers);

  const mapCategory = (domain?: string): any => {
    if (domain === 'business' || domain === 'digital_project') return 'entrepreneurship';
    if (domain === 'travel' || domain === 'life_change') return 'personal';
    if (domain === 'relocation') return 'relocation';
    if (domain === 'personal_finance' || domain === 'purchase') return 'money';
    return domain || 'other';
  };

  const nextCustomAnswers = {
    ...(existingData?.customAnswers || {}),
    __projectState: response.state // Serialize state for multi-turn!
  };

  if (response.type === 'NEEDS_INFORMATION') {
    return {
      data: {
        prompt,
        projectTitle: response.state.rawGoal,
        category: mapCategory(response.state.activeDomains[0]),
        budget: response.state.availableBudget.value !== 'UNKNOWN' ? response.state.availableBudget.value as number : undefined,
        monthlyIncome: response.state.monthlyIncome.value !== 'UNKNOWN' ? response.state.monthlyIncome.value as number : undefined,
        monthlyExpenses: response.state.monthlyExpenses.value !== 'UNKNOWN' ? response.state.monthlyExpenses.value as number : undefined,
        customAnswers: nextCustomAnswers
      },
      missingQuestions: [response.question],
      isReadyForAnalysis: false,
    };
  }

  // It's a recommendation response
  return {
    data: {
      prompt,
      projectTitle: response.state.rawGoal,
      category: mapCategory(response.state.activeDomains[0]),
      budget: response.state.availableBudget.value !== 'UNKNOWN' ? response.state.availableBudget.value as number : undefined,
      monthlyIncome: response.state.monthlyIncome.value !== 'UNKNOWN' ? response.state.monthlyIncome.value as number : undefined,
      monthlyExpenses: response.state.monthlyExpenses.value !== 'UNKNOWN' ? response.state.monthlyExpenses.value as number : undefined,
      customAnswers: nextCustomAnswers
    },
    missingQuestions: [],
    isReadyForAnalysis: true,
    analysis: response.analysis,
    coPilot: response.coPilot,
  };
}
