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
        const parsedDuration = parseInt(frontendAnswers['duration'], 10);
        // Never silently substitute a default (e.g. 14) and label it USER_PROVIDED if parsing
        // fails — an unparseable answer must stay UNKNOWN, not become a mislabeled invention.
        if (!isNaN(parsedDuration)) {
          state.durationDays = { value: parsedDuration, origin: 'USER_PROVIDED' };
        }
      }
      if (frontendAnswers['availableBudget']) {
        const parsedBudget = parseFloat(frontendAnswers['availableBudget']);
        if (!isNaN(parsedBudget)) {
          state.availableBudget = { value: parsedBudget, origin: 'USER_PROVIDED' };
        }
      }
      if (frontendAnswers['itemPrice'] !== undefined && frontendAnswers['itemPrice'] !== null && frontendAnswers['itemPrice'] !== '') {
        const parsedItemPrice = parseFloat(frontendAnswers['itemPrice']);
        if (!isNaN(parsedItemPrice)) {
          state.facts = {
            ...(state.facts || {}),
            itemPrice: { value: parsedItemPrice, origin: 'USER_PROVIDED' }
          };
        }
      }
      if (frontendAnswers['relocationGoal']) {
        state.facts = {
          ...(state.facts || {}),
          relocationGoal: { value: frontendAnswers['relocationGoal'], origin: 'USER_PROVIDED' }
        };
        // "Just travel" reframes this as a travel project so the travel-specific readiness
        // rules (destination/origin/duration) take over instead of the relocation ones.
        if (frontendAnswers['relocationGoal'] === 'travel' && !state.activeDomains.includes('travel')) {
          state.activeDomains = [...state.activeDomains, 'travel'];
        }
      }
      if (frontendAnswers['monthlyIncome'] !== undefined && frontendAnswers['monthlyIncome'] !== null) {
        const parsedIncome = parseFloat(frontendAnswers['monthlyIncome']);
        if (!isNaN(parsedIncome)) {
          state.monthlyIncome = { value: parsedIncome, origin: 'USER_PROVIDED' };
        }
      }
      if (frontendAnswers['monthlyExpenses'] !== undefined && frontendAnswers['monthlyExpenses'] !== null) {
        const parsedExpenses = parseFloat(frontendAnswers['monthlyExpenses']);
        if (!isNaN(parsedExpenses)) {
          state.monthlyExpenses = { value: parsedExpenses, origin: 'USER_PROVIDED' };
        }
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

    // Case A0: Pure factual/research question (not a personal project). Do NOT run the
    // feasibility pipeline — that would fabricate a fake verdict (score, budget gap, etc.)
    // out of zero personal data. Ask the person to reframe it as their own project instead.
    if (state.requestIntent.value === 'VERIFY_FACT') {
      const q: MissingQuestion = {
        id: 'reframe_as_project',
        field: 'customAnswers',
        type: 'text',
        question: lang === 'fr'
          ? 'Je suis un copilote de projet personnel, pas un moteur de recherche : dis-moi plutôt ton propre projet (ex. "Je veux vivre au Portugal, ça me coûterait combien ?") et je calculerai ta faisabilité réelle.'
          : lang === 'es'
          ? 'Soy un copiloto de proyectos personales, no un buscador: cuéntame tu propio proyecto (ej. "Quiero vivir en Portugal, ¿cuánto me costaría?") y calcularé tu viabilidad real.'
          : 'I\'m a personal project copilot, not a search engine: tell me about your own project instead (e.g. "I want to move to Portugal, what would it cost me?") and I\'ll calculate your real feasibility.'
      };
      state.nextBestAction = 'ASK';
      state.readiness = 'NEEDS_INFO';
      return ResponseComposer.composeNeedsInfo(
        state,
        q,
        lang === 'fr' ? 'Précision nécessaire :' : 'One clarification:',
        'ASK'
      );
    }

    // Case A: User explicitly asks for COST ESTIMATE (e.g. "ça me coûterait combien pour démarrer ?")
    if (state.requestIntent.value === 'ESTIMATE_COST') {
      const isBusiness = state.activeDomains.includes('business') || state.activeDomains.includes('digital_project') || state.primaryIntent.value === 'START_BUSINESS';
      
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

    // Travel Domain Rules (destination/origin/duration are travel-specific; budget requirement
    // is handled uniformly below in the non-business branch to avoid duplicating that check).
    if (state.activeDomains.includes('travel') || state.primaryIntent.value === 'LEAVE_OR_TRAVEL') {
      if (state.destinationLocation.value === 'UNKNOWN') state.missingCriticalFacts.push('destinationLocation');
      if (state.originLocation.value === 'UNKNOWN') state.missingCriticalFacts.push('originLocation');
      if (state.durationDays.value === 'UNKNOWN' && state.durationMonths.value === 'UNKNOWN') state.missingCriticalFacts.push('duration');
    }

    // Relocation Domain Rules: "leaving the country" covers genuinely different projects
    // (tourism, settling abroad, working abroad) with very different required facts and
    // opportunities. Per the mission's own example, ask this single disambiguating question
    // before anything else — asking for budget/income first would waste the person's time on
    // the wrong follow-up questions if, say, they actually just want a long holiday.
    if (state.activeDomains.includes('relocation')) {
      const relocationGoalFact = state.facts?.['relocationGoal'];
      if (!relocationGoalFact || relocationGoalFact.value === 'UNKNOWN') {
        state.missingCriticalFacts.push('relocationGoal');
        state.readiness = 'NEEDS_INFO';
        return;
      }
    }

    // Business Domain Rules (business and digital_project share the same cost-estimation
    // pipeline via CostEstimator — a website/app/SaaS launch asks the same "how do you want to
    // build/run it" question a physical business does, just with different concrete options).
    const isBusiness = state.activeDomains.includes('business') || state.activeDomains.includes('digital_project') || state.primaryIntent.value === 'START_BUSINESS';

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
        // 0 € or no money: budget is already resolved to 0, never ask for it again. But for a
        // digital project specifically, whether it's free (DIY/no-code) or paid (custom dev) is
        // the single fact that determines whether "0 €" is actually achievable — without it we
        // can't surface the genuinely free path the person needs, so it's still worth asking.
        if (state.activeDomains.includes('digital_project') && state.operatingModel.value === 'UNKNOWN') {
          state.missingCriticalFacts.push('operatingModel');
        }
      } else {
        // General business launch without explicit cost query: we still need to know how the
        // person plans to operate (home/mobile/salon/online) to produce a meaningful cost
        // estimate via CostEstimator, plus their available budget to judge feasibility.
        if (state.operatingModel.value === 'UNKNOWN') state.missingCriticalFacts.push('operatingModel');
        if (state.availableBudget.value === 'UNKNOWN') state.missingCriticalFacts.push('availableBudget');
      }
    } else {
      // NON-BUSINESS (Simple Goals like Travel, Relocation, Career, Real Estate, Purchase, Life Change)
      // Available budget is always required to compute a genuine feasibility verdict — without it
      // there is nothing to compare against a target cost, and we must not silently assume 0.
      // Exception: FIND_SOLUTION requests explicitly state "no money" (budget already resolved to 0).
      const isRealEstateOrPurchase = state.activeDomains.includes('real_estate') || state.activeDomains.includes('purchase');
      const itemPriceFact = state.facts?.['itemPrice'];
      const knownItemPrice = itemPriceFact && itemPriceFact.value !== 'UNKNOWN' ? itemPriceFact.value as number : undefined;

      // For a specific purchase (car, house...), the price of the thing itself is a required,
      // never-invented fact. Ask for it explicitly instead of silently falling back to a
      // category benchmark (e.g. "voiture" -> 10 000 €) further down the pipeline.
      if (isRealEstateOrPurchase && knownItemPrice === undefined) {
        state.missingCriticalFacts.push('itemPrice');
      } else if (state.availableBudget.value === 'UNKNOWN' && state.requestIntent.value !== 'FIND_SOLUTION') {
        state.missingCriticalFacts.push('availableBudget');
      } else if (state.availableBudget.value !== 'UNKNOWN') {
        const budget = state.availableBudget.value as number;
        // Only compare against a real target cost we actually have (the stated item price).
        // When there is no concrete target cost to compare against (e.g. a generic travel/life
        // goal with no destination-priced estimate yet), we cannot determine whether income and
        // expenses would meaningfully change the verdict, so we don't ask for them speculatively.
        if (knownItemPrice !== undefined && budget < knownItemPrice) {
          if (state.monthlyIncome.value === 'UNKNOWN') state.missingCriticalFacts.push('monthlyIncome');
          else if (state.monthlyExpenses.value === 'UNKNOWN') state.missingCriticalFacts.push('monthlyExpenses');
        } else if (!isRealEstateOrPurchase && state.costEstimateRange && budget < state.costEstimateRange.min) {
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

  private static mapDomainToCategory(domain: string | undefined): 'entrepreneurship' | 'money' | 'real_estate' | 'career' | 'education' | 'relocation' | 'personal' | 'other' {
    switch (domain) {
      case 'business':
      case 'digital_project':
        return 'entrepreneurship';
      case 'travel':
        return 'personal';
      case 'relocation':
        return 'relocation';
      case 'career':
        return 'career';
      case 'real_estate':
        return 'real_estate';
      case 'purchase':
      case 'personal_finance':
        return 'money';
      case 'education':
        return 'education';
      case 'life_change':
        return 'personal';
      default:
        return 'other';
    }
  }

  private static async buildRecommendation(state: ProjectState, lang: string, currency: string): Promise<RecommendationResponse> {
    const budget = state.availableBudget.value !== 'UNKNOWN' ? state.availableBudget.value as number : undefined;
    const domain = state.activeDomains[0];
    const category = this.mapDomainToCategory(domain);
    const isBusiness = category === 'entrepreneurship';

    // For business/digital projects, prefer CostEstimator: it has item-level, sourced estimates
    // for known activity types (artisan, beauty, food, tech) instead of the coarser single-figure
    // archetype fallback used inside calculateFeasibility. Only used when we have enough signal
    // (activity + operating model known); otherwise calculateFeasibility's own archetype matcher
    // (matchArchetype) supplies a transparent, clearly-labeled estimate.
    let projectStartupCost: number | undefined;
    let projectMonthlyRunningCost: number | undefined;
    if (isBusiness) {
      const activity = state.activitySubtype.value !== 'UNKNOWN' ? state.activitySubtype.value as string : state.rawGoal;
      const opModel = state.operatingModel.value !== 'UNKNOWN' ? state.operatingModel.value as OperatingModel : 'unknown';
      const estimate = CostEstimator.estimate(activity, opModel, currency);
      // Use midpoint of the CostEstimator range as the deterministic startup cost input.
      projectStartupCost = Math.round((estimate.minimumEstimate + estimate.maximumEstimate) / 2);
    } else if (domain === 'real_estate' || domain === 'purchase') {
      // The price of the house/car/item itself IS the startup cost — never invent it,
      // only use it if the user actually stated a price. Readiness (updateReadiness) already
      // requires itemPrice before we can reach READY_FOR_RECOMMENDATION for this domain, so
      // this should always be known here; if it somehow isn't, calculateFeasibility falls back
      // to a category benchmark, which is why readiness enforcement above must not be bypassed.
      const itemPriceFact = state.facts?.['itemPrice'];
      if (itemPriceFact && itemPriceFact.value !== 'UNKNOWN') {
        projectStartupCost = itemPriceFact.value as number;
      }
    }

    const mockExtractedData = {
      prompt: state.rawGoal,
      projectTitle: state.rawGoal,
      category,
      budget,
      monthlyIncome: state.monthlyIncome.value !== 'UNKNOWN' ? state.monthlyIncome.value as number : undefined,
      monthlyExpenses: state.monthlyExpenses.value !== 'UNKNOWN' ? state.monthlyExpenses.value as number : undefined,
      projectStartupCost,
      projectMonthlyRunningCost,
      customAnswers: {}
    };

    const analysis = calculateFeasibility(mockExtractedData as any, lang as any, currency as any);
    
    return ResponseComposer.composeRecommendation(state, analysis);
  }
}

