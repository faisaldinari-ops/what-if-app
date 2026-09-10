// src/services/ai/projectAnalyzer.ts
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { DecisionController } from '../../core/controller/DecisionController';
import { CoreDecisionResponse } from '../../core/controller/ResponseComposer';
import { calculateFeasibility } from '../../logic/feasibilityEngine';

export interface AnalysisResponse {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
  analysis?: DecisionAnalysis;
  coPilot?: CoPilotResponse;
  aiEnhanced?: boolean;
  coreResponse?: CoreDecisionResponse;
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
      coreResponse: response
    };
  }

  if (response.type === 'COST_ESTIMATE') {
    const baseAnalysis = calculateFeasibility({
      prompt,
      projectTitle: response.state.rawGoal,
      category: 'entrepreneurship',
      budget: response.state.availableBudget.value !== 'UNKNOWN' ? (response.state.availableBudget.value as number) : undefined,
      projectStartupCost: response.minimumEstimate,
      customAnswers: nextCustomAnswers
    }, lang, currency);

    const analysis: DecisionAnalysis = {
      ...baseAnalysis,
      isCostEstimateOnly: true,
      score: 80,
      verdict: 'feasible',
      feasibilityState: 'POSSIBLE_NOW',
      verdictTitle: lang === 'fr' ? `Estimation de démarrage : ${response.minimumEstimate.toLocaleString()} € à ${response.maximumEstimate.toLocaleString()} €` : `Startup Estimate: ${response.minimumEstimate.toLocaleString()} € - ${response.maximumEstimate.toLocaleString()} €`,
      verdictSummary: response.summary,
      metrics: {
        ...baseAnalysis.metrics,
        budgetNeeded: response.minimumEstimate,
      }
    };

    const coPilot: CoPilotResponse = {
      intent: 'ESTIMATE_COST',
      domain: mapCategory(response.state.activeDomains[0]),
      headlineVerdict: lang === 'fr' ? `BUDGET ESTIMÉ : ${response.minimumEstimate.toLocaleString()} € - ${response.maximumEstimate.toLocaleString()} €` : `ESTIMATED BUDGET: ${response.minimumEstimate.toLocaleString()} € - ${response.maximumEstimate.toLocaleString()} €`,
      whySummary: response.summary,
      keyFigures: [
        { label: lang === 'fr' ? 'Investissement principal' : 'Main Investment', value: `${response.minimumEstimate} € - ${response.maximumEstimate} €`, highlight: true },
        { label: lang === 'fr' ? 'Structure & Formalités' : 'Legal & Setup', value: lang === 'fr' ? 'Variable selon statut' : 'Varies by entity type' }
      ],
      mainObstacle: {
        title: lang === 'fr' ? "Validation du modèle" : "Model Validation",
        description: lang === 'fr' ? "L'enjeu principal sera de trouver vos premiers clients pour rentabiliser cet investissement." : "The main challenge is securing early customers to ROI this investment.",
        priority: 'medium'
      },
      recommendationShortPlan: lang === 'fr' ? "Démarrez petit (MVP) pour valider votre marché avant de faire de gros achats." : "Start lean (MVP) to validate the market before heavy capital expenditure.",
      options: {
        original: { name: lang === 'fr' ? "Lancement complet" : "Full Launch", cost: `${response.maximumEstimate} €`, summary: lang === 'fr' ? "Équipement neuf, standard" : "New equipment, standard setup" },
        reduced: { name: lang === 'fr' ? "Version allégée" : "Lean Version", cost: `${response.minimumEstimate} €`, summary: lang === 'fr' ? "Équipement d'occasion / location" : "Used gear / leasing" },
        minimal: { name: lang === 'fr' ? "Phase de test (MVP)" : "Test Phase (MVP)", cost: `${Math.round(response.minimumEstimate * 0.4)} €`, summary: lang === 'fr' ? "Le strict minimum pour tester" : "Bare minimum to validate" }
      },
      stepByStepPlan: [
        { step: 1, title: lang === 'fr' ? "Validation du projet" : "Project Validation", detail: lang === 'fr' ? "Étude du besoin local" : "Local market research", timing: "Semaine 1" },
        { step: 2, title: lang === 'fr' ? "Statut juridique" : "Legal Entity", detail: lang === 'fr' ? "Immatriculation adaptée" : "Appropriate registration", timing: "Semaine 2" },
        { step: 3, title: lang === 'fr' ? "Assurance & Matériel" : "Insurance & Gear", detail: lang === 'fr' ? "Assurance RC Pro & achat du strict nécessaire" : "Liability insurance & essential gear", timing: "Semaine 3" }
      ],
      researchFacts: response.sources.map(s => ({
        label: s.name,
        value: s.note || 'Benchmark officiel',
        source: s.name,
        sourceUrl: s.url,
        confidence: 'high' as const,
        isEstimate: true
      })),
      confidence: 'high',
      confidenceExplanation: lang === 'fr' ? "Estimation basée sur les moyennes du marché pour ce type d'activité." : "Estimate based on market averages for this activity type.",
      smartCTAs: [
        {
          id: 'compare-budget',
          label: lang === 'fr' ? "Comparer avec mon budget disponible" : "Compare with my available budget",
          actionType: 'BUILD_PATH'
        }
      ]
    };

    return {
      data: {
        prompt,
        projectTitle: response.state.rawGoal,
        category: 'entrepreneurship',
        budget: response.state.availableBudget.value !== 'UNKNOWN' ? response.state.availableBudget.value as number : undefined,
        customAnswers: nextCustomAnswers
      },
      missingQuestions: [],
      isReadyForAnalysis: true,
      analysis,
      coPilot,
      coreResponse: response
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
    analysis: (response as any).analysis,
    coPilot: (response as any).coPilot,
    coreResponse: response
  };
}
