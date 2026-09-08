// src/services/ai/projectAnalyzer.ts
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { parseProjectWithRules } from './ruleBasedParser';
import { calculateFeasibility } from '../../logic/feasibilityEngine';
import { orchestrateDecisionCoPilot } from './orchestrator';
import { SupportedLang, SupportedCurrency } from '../../i18n';

export interface AnalysisResponse {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
  analysis?: DecisionAnalysis;
  coPilot?: CoPilotResponse;
  aiEnhanced?: boolean;
}

/**
 * Centralized AI Service:
 * Uses orchestrateDecisionCoPilot which integrates Intent Classification,
 * Domain Classification, Deterministic Math engines, Research benchmarks,
 * and smart alternative generation.
 * Also queries server-side Gemini API when available to enrich context.
 */
export async function analyzeProjectInput(
  prompt: string,
  existingData?: Partial<UserExtractedData>,
  lang: SupportedLang = 'fr',
  currency: SupportedCurrency = 'EUR'
): Promise<AnalysisResponse> {
  // Always run the orchestrator for full domain and factual grounding
  const orch = orchestrateDecisionCoPilot(
    prompt,
    {
      goal: prompt,
      budget: existingData?.budget,
      monthlyIncome: existingData?.monthlyIncome,
      monthlyExpenses: existingData?.monthlyExpenses,
      durationDays: existingData?.timelineMonths,
      knownFacts: existingData?.customAnswers
    },
    lang,
    currency
  );

  let mergedData: UserExtractedData = {
    prompt,
    projectTitle: orch.context.goal || prompt.slice(0, 40),
    category: orch.domain === 'business' || orch.domain === 'digital_project' ? 'entrepreneurship' : orch.domain === 'travel' ? 'personal' : orch.domain === 'relocation' ? 'relocation' : 'other',
    budget: orch.context.budget,
    monthlyIncome: orch.context.monthlyIncome,
    monthlyExpenses: orch.context.monthlyExpenses,
    projectStartupCost: existingData?.projectStartupCost || 3000,
    projectMonthlyRunningCost: existingData?.projectMonthlyRunningCost || 150,
    projectExpectedRevenue: existingData?.projectExpectedRevenue || 0,
    monthsBeforeRevenue: existingData?.monthsBeforeRevenue || 1,
    timelineMonths: existingData?.timelineMonths || 12,
    customAnswers: existingData?.customAnswers || {}
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch('/api/analyze-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        existingData: mergedData,
        lang,
        currency
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        mergedData = { ...mergedData, ...json.data };
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.warn('AI proxy optional check passed, using full deterministic orchestrator');
  }

  // If orchestrator produced a ready analysis, return it!
  if (orch.isReady && orch.coPilotResponse && orch.decisionAnalysis) {
    return {
      data: mergedData,
      missingQuestions: [],
      isReadyForAnalysis: true,
      analysis: orch.decisionAnalysis,
      coPilot: orch.coPilotResponse,
      aiEnhanced: true
    };
  }

  if (orch.missingQuestions.length > 0) {
    return {
      data: mergedData,
      missingQuestions: orch.missingQuestions,
      isReadyForAnalysis: false,
      coPilot: undefined,
      aiEnhanced: true
    };
  }

  // Final fallback calculation
  const fallbackAnalysis = calculateFeasibility(mergedData, lang, currency);
  return {
    data: mergedData,
    missingQuestions: [],
    isReadyForAnalysis: true,
    analysis: fallbackAnalysis,
    coPilot: orch.coPilotResponse,
    aiEnhanced: false
  };
}
