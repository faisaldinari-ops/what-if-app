// src/core/controller/DecisionController.ts
import { ProjectState, createInitialProjectState, Fact, createUnknownFact } from '../types';
import { UnderstandingEngine } from '../engine/UnderstandingEngine';
import { ResponseComposer, NeedsInformationResponse, RecommendationResponse } from './ResponseComposer';
import { MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { calculateFeasibility } from '../../logic/feasibilityEngine';

export class DecisionController {
  
  static async processTurn(
    message: string, 
    currentState: ProjectState | null,
    lang: 'fr' | 'en' | 'es' = 'fr',
    currency: string = 'EUR',
    frontendAnswers?: Record<string, any>
  ): Promise<NeedsInformationResponse | RecommendationResponse> {
    
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
      if (frontendAnswers['_budget'] !== undefined) {
        state.availableBudget = { value: frontendAnswers['_budget'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_monthlyIncome'] !== undefined) {
        state.monthlyIncome = { value: frontendAnswers['_monthlyIncome'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_monthlyExpenses'] !== undefined) {
        state.monthlyExpenses = { value: frontendAnswers['_monthlyExpenses'], origin: 'USER_PROVIDED' };
      }
      if (frontendAnswers['_durationMonths'] !== undefined) {
        state.durationMonths = { value: frontendAnswers['_durationMonths'], origin: 'USER_PROVIDED' };
      }
    }

    // 4. Derive facts (savings capacity, etc.)
    state = this.deriveFacts(state);

    // 4. Update Readiness
    this.updateReadiness(state);

    // 5. Decide Next Action
    if (state.readiness === 'NEEDS_INFO') {
      const question = this.determineBestQuestion(state, lang);
      const msg = lang === 'fr' ? 'On peut chercher une solution.' : 'Let us look into this.';
      return ResponseComposer.composeNeedsInfo(state, question, msg);
    } 

    // If ready, we do calculations.
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

    // Rule 1: Intent or Domain
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
    if (state.activeDomains.includes('business') || state.primaryIntent.value === 'START_BUSINESS') {
      if (state.availableBudget.value === 'UNKNOWN') state.missingCriticalFacts.push('availableBudget');
      if (state.profession.value === 'UNKNOWN' && !state.rawGoal.toLowerCase().includes('site')) {
        state.missingCriticalFacts.push('profession');
      }
    }

    if (state.missingCriticalFacts.length > 0) {
      state.readiness = 'NEEDS_INFO';
    } else {
      state.readiness = 'READY_FOR_RECOMMENDATION';
    }
  }

  private static determineBestQuestion(state: ProjectState, lang: string): MissingQuestion {
    const isFr = lang === 'fr';

    if (state.missingCriticalFacts.includes('intent_or_domain')) {
       return {
         id: 'disambiguate_intent',
         field: 'customAnswers',
         type: 'choice',
         question: isFr ? 'Tu veux surtout :' : 'Do you want to:',
         options: [
           { label: isFr ? 'Voyager' : 'Travel', value: 'LEAVE_OR_TRAVEL' },
           { label: isFr ? 'Partir vivre ailleurs' : 'Relocate', value: 'RELOCATE' },
           { label: isFr ? 'Changer completement de vie' : 'Change my life completely', value: 'LIFE_CHANGE' }
         ]
       };
    }

    if (state.missingCriticalFacts.includes('originLocation')) {
      return {
        id: 'originLocation',
        field: 'customAnswers',
        type: 'text',
        question: isFr ? 'Tu pars de ou ?' : 'Where are you departing from?'
      };
    }

    if (state.missingCriticalFacts.includes('destinationLocation')) {
      return {
        id: 'destinationLocation',
        field: 'customAnswers',
        type: 'text',
        question: isFr ? 'Tu as deja une destination en tete ?' : 'Do you have a destination in mind?'
      };
    }

    if (state.missingCriticalFacts.includes('duration')) {
      return {
        id: 'duration',
        field: 'customAnswers',
        type: 'choice',
        question: isFr ? 'Combien de temps souhaites-tu partir ?' : 'How long do you want to go for?',
        options: [
          { label: isFr ? 'Moins d une semaine' : 'Less than a week', value: '5_days' },
          { label: isFr ? '1 a 2 semaines' : '1 to 2 weeks', value: '14_days' },
          { label: isFr ? '1 mois ou plus' : '1 month or more', value: '30_days' }
        ]
      };
    }

    if (state.missingCriticalFacts.includes('availableBudget')) {
      return {
        id: 'availableBudget',
        field: 'budget',
        type: 'number',
        question: isFr ? 'Quel est ton budget disponible pour ce projet ?' : 'What is your available budget for this project?'
      };
    }

    return {
      id: 'general_info',
      field: 'customAnswers',
      type: 'text',
      question: isFr ? 'Peux-tu m en dire un peu plus sur ton projet ?' : 'Can you tell me more about your project?'
    };
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
