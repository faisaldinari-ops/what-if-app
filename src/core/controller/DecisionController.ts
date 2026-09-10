// src/core/controller/DecisionController.ts
import { ProjectState, createInitialProjectState, Fact, createUnknownFact, OperatingModel } from '../types';
import { UnderstandingEngine } from '../engine/UnderstandingEngine';
import {
  ResponseComposer,
  NeedsInformationResponse,
  RecommendationResponse,
  CostEstimateResponse,
  CoreDecisionResponse
} from './ResponseComposer';
import { MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { calculateFeasibility } from '../../logic/feasibilityEngine';
import { QuestionPlanner } from './QuestionPlanner';
import { CostEstimator } from '../specialists/CostEstimator';

export class DecisionController {
  
  static async processTurn(
    message: string, 
    currentState: ProjectState | null,
    lang: 'fr' | 'en' | 'es' = 'fr',
    currency: string = 'EUR',
    frontendAnswers?: Record<string, any>
  ): Promise<CoreDecisionResponse> {
    
    // 1. Initialize or load state
    let state = currentState || createInitialProjectState(message);
    
    // 2. Understand and update state from prompt
    const extractedUpdates = UnderstandingEngine.extractFacts(message, state);
    state = { ...state, ...extractedUpdates };

    // 3. Update state from frontend explicit answers
    if (frontendAnswers) {
      if (frontendAnswers['disambiguate_intent']) {
        state.primaryIntent = { value: frontendAnswers['disambiguate_intent'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['operatingModel']) {
        state.operatingModel = { value: frontendAnswers['operatingModel'] as OperatingModel, origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['originLocation']) {
        state.originLocation = { value: frontendAnswers['originLocation'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['destinationLocation']) {
        state.destinationLocation = { value: frontendAnswers['destinationLocation'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['duration']) {
        state.durationDays = { value: parseInt(frontendAnswers['duration'], 10) || 14, origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['availableBudget']) {
        state.availableBudget = { value: parseFloat(frontendAnswers['availableBudget']), origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['monthlyIncome'] !== undefined && frontendAnswers['monthlyIncome'] !== null) {
        state.monthlyIncome = { value: parseFloat(frontendAnswers['monthlyIncome']), origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['monthlyExpenses'] !== undefined && frontendAnswers['monthlyExpenses'] !== null) {
        state.monthlyExpenses = { value: parseFloat(frontendAnswers['monthlyExpenses']), origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_budget'] !== undefined && frontendAnswers['_budget'] !== null) {
        state.availableBudget = { value: frontendAnswers['_budget'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_monthlyIncome'] !== undefined && frontendAnswers['_monthlyIncome'] !== null) {
        state.monthlyIncome = { value: frontendAnswers['_monthlyIncome'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_monthlyExpenses'] !== undefined && frontendAnswers['_monthlyExpenses'] !== null) {
        state.monthlyExpenses = { value: frontendAnswers['_monthlyExpenses'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_durationMonths'] !== undefined && frontendAnswers['_durationMonths'] !== null) {
        state.durationMonths = { value: frontendAnswers['_durationMonths'], origin: 'USER_PROVIDED' };
      }
    }

    // 4. Derive facts (savings capacity, etc.)
    state = this.deriveFacts(state);

    // 5. Update Readiness & determine if Cost Estimation applies
    this.updateReadiness(state);

    // Case A: User explicitly asks for COST ESTIMATE (e.g. "ça me coûterait combien pour démarrer ?")
    if (state.requestIntent.value === 'ESTIMATE_COST') {
      const isBusiness = state.activeDomains.includes('business') || state.primaryIntent.value === 'START_BUSINESS';
      
      if (isBusiness) {
        // If operating model is still unknown, we must ask the single high-impact question
        if (state.operatingModel.value === 'UNKNOWN') {
          const planned = QuestionPlanner.selectNextBestQuestion(state, lang);
          state.nextBestAction = planned.nextAction;
          state.readiness = 'NEEDS_INFO';
          const msg = lang === 'fr'
            ? 'Oui. Le coût change énormément selon la façon dont tu veux démarrer.'
            : 'Yes. The startup cost varies significantly depending on your setup.';
          return ResponseComposer.composeNeedsInfo(state, planned.question, msg, planned.nextAction, planned.ctaLabel);
        }

        // Operating model is known (or explicitly provided, e.g. "chez moi", "salon", "mobile")
        // Build genuine CostEstimateResponse without inventing fake margins or fake feasibility score!
        const activity = state.activitySubtype.value !== 'UNKNOWN' ? state.activitySubtype.value : state.rawGoal;
        const estimateResult = CostEstimator.estimate(activity, state.operatingModel.value, currency);

        state.costEstimateRange = {
          min: estimateResult.minimumEstimate,
          max: estimateResult.maximumEstimate,
          items: estimateResult.costItems
        };
        state.sources = estimateResult.sources;
        state.assumptions = estimateResult.assumptions;
        state.readiness = 'READY_FOR_RECOMMENDATION';

        const followUpQuestion: MissingQuestion = {
          id: 'availableBudget',
          field: 'budget',
          type: 'number',
          question: lang === 'fr'
            ? 'Tu veux maintenant que je compare cette fourchette à ton budget disponible ?'
            : lang === 'es'
            ? '¿Quieres que compare este rango con tu presupuesto disponible?'
            : 'Would you like me to compare this range with your available budget?',
          placeholder: 'ex. 1 000'
        };

        return ResponseComposer.composeCostEstimate(
          state,
          `Estimation de démarrage : ${state.rawGoal}`,
          activity,
          estimateResult.operatingModel,
          estimateResult.minimumEstimate,
          estimateResult.maximumEstimate,
          currency,
          estimateResult.costItems,
          estimateResult.sources,
          estimateResult.assumptions,
          estimateResult.summary,
          followUpQuestion
        );
      }
    }

    // Case B: System needs information for other intents/domains
    if (state.readiness === 'NEEDS_INFO') {
      const planned = QuestionPlanner.selectNextBestQuestion(state, lang);
      state.nextBestAction = planned.nextAction;
      const msg = lang === 'fr' ? 'Pour avancer concrètement :' : 'To take the next step:';
      return ResponseComposer.composeNeedsInfo(state, planned.question, msg, planned.nextAction, planned.ctaLabel);
    } 

    // Case C: Build standard recommendation
    return this.buildRecommendation(state, lang, currency);
  }

  private static deriveFacts(state: ProjectState): ProjectState {
    if (
      state.monthlyIncome.value !== 'UNKNOWN' &&
      state.monthlyExpenses.value !== 'UNKNOWN' &&
      state.monthlySavingsCapacity.value === 'UNKNOWN'
    ) {
      const inc = state.monthlyIncome.value as number;
      const exp = state.monthlyExpenses.value as number;
      state.monthlySavingsCapacity = {
        value: Math.max(0, inc - exp),
        origin: 'DERIVED',
        dependencies: ['monthlyIncome', 'monthlyExpenses']
      };
    }
    return state;
  }

  private static updateReadiness(state: ProjectState) {
    state.missingCriticalFacts = [];

    // Rule 1: Intent or Domain ambiguous
    if (state.primaryIntent.value === 'UNKNOWN' && state.activeDomains.length === 0) {
      state.missingCriticalFacts.push('intent_or_domain');
      state.readiness = 'NEEDS_INFO';
      return;
    }

    // Travel Domain Rules
    if (state.activeDomains.includes('travel') || state.primaryIntent.value === 'LEAVE_OR_TRAVEL') {
      if (state.destinationLocation.value === 'UNKNOWN') state.missingCriticalFacts.push('destinationLocation');
      if (state.originLocation.value === 'UNKNOWN') state.missingCriticalFacts.push('originLocation');
      if (state.availableBudget.value === 'UNKNOWN') state.missingCriticalFacts.push('availableBudget');
      if (state.durationDays.value === 'UNKNOWN' && state.durationMonths.value === 'UNKNOWN') state.missingCriticalFacts.push('duration');
    }

    // Business Domain Rules
    const isBusiness = state.activeDomains.includes('business') || state.primaryIntent.value === 'START_BUSINESS';

    if (isBusiness) {
      // If user asks "HOW MUCH DOES IT COST?" (ESTIMATE_COST):
      // Available budget is NOT a required input! Operating model is what determines cost.
      if (state.requestIntent.value === 'ESTIMATE_COST') {
        if (state.operatingModel.value === 'UNKNOWN') {
          state.missingCriticalFacts.push('operatingModel');
        }
      } else if (state.requestIntent.value === 'CHECK_AFFORDABILITY') {
        // If user asks "Can I afford it?", availableBudget IS required
        if (state.availableBudget.value === 'UNKNOWN') state.missingCriticalFacts.push('availableBudget');
      } else if (state.requestIntent.value === 'FIND_SOLUTION') {
        // 0 € or no money: budget is already 0, do NOT ask for it!
      } else {
        // General business launch without explicit cost query
        if (state.availableBudget.value === 'UNKNOWN') state.missingCriticalFacts.push('availableBudget');
      }
    } else {
      // NON-BUSINESS (Simple Goals like Travel, Purchase, Life Change)
      // If the budget is known, we check if they need a savings plan. 
      // Travel archetype assumes ~3000 by default if duration is 14 days, purchase assumes ~10000.
      // Let's use a generic rough estimate to trigger the savings plan questionnaire.
      if (state.availableBudget.value !== 'UNKNOWN') {
        const budget = state.availableBudget.value as number;
        const estCost = state.activeDomains.includes('travel') ? 3000 : 5000;
        
        if (budget < estCost) {
          if (state.monthlyIncome.value === 'UNKNOWN') state.missingCriticalFacts.push('monthlyIncome');
          else if (state.monthlyExpenses.value === 'UNKNOWN') state.missingCriticalFacts.push('monthlyExpenses');
        }
      }
    }

    if (state.missingCriticalFacts.length > 0) {
      state.readiness = 'NEEDS_INFO';
    } else {
      state.readiness = 'READY_FOR_RECOMMENDATION';
    }
  }

  private static async buildRecommendation(state: ProjectState, lang: string, currency: string): Promise<RecommendationResponse> {
    const budget = state.availableBudget.value !== 'UNKNOWN' ? state.availableBudget.value as number : 0; 
    
    const mockExtractedData = {
      prompt: state.rawGoal,
      projectTitle: state.rawGoal,
      category: state.activeDomains[0] || 'other',
      budget: budget,
      monthlyIncome: state.monthlyIncome.value !== 'UNKNOWN' ? state.monthlyIncome.value as number : undefined,
      monthlyExpenses: state.monthlyExpenses.value !== 'UNKNOWN' ? state.monthlyExpenses.value as number : undefined,
      customAnswers: {}
    };

    const analysis = calculateFeasibility(mockExtractedData as any, lang as any, currency as any);
    
    return ResponseComposer.composeRecommendation(state, analysis);
  }
}

