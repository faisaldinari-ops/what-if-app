// src/core/engine/UnderstandingEngine.ts
import { ProjectState, ProjectDomain, UserIntent, Fact, createUnknownFact } from '../types';
import { classifyProjectDomain } from '../../services/ai/domainClassifier';
import { classifyUserIntent } from '../../services/ai/intentClassifier';

export class UnderstandingEngine {
  
  static extractFacts(message: string, currentState: ProjectState): Partial<ProjectState> {
    const updates: Partial<ProjectState> = {};
    const p = message.toLowerCase();
    
    // Domain & Intent extraction
    // Hybrid approach: We use existing classifiers if current state is unknown
    if (currentState.primaryIntent.value === 'UNKNOWN') {
      const intentStr = classifyUserIntent(message);
      // Map legacy intent to new Intent, or just use string matching for now
      updates.primaryIntent = { value: this.mapIntent(intentStr, p), origin: 'DERIVED' };
    }

    if (currentState.activeDomains.length === 0) {
      const domain = classifyProjectDomain(message);
      if (domain !== 'other' ) {
        updates.activeDomains = [domain];
      }
    }

    // Number extraction
    
    // Budget
    const budgetMatch = message.match(/(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|dollars?)/i);
    // Explicit 0
    const zeroMatch = message.match(/\b0\s*(?:€|euros?|dollars?|\$)\b/i);

    if (zeroMatch) {
      updates.availableBudget = { value: 0, origin: 'USER_PROVIDED' };
    } else if (budgetMatch) {
      const raw = budgetMatch[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        updates.availableBudget = { value: val, origin: 'USER_PROVIDED' };
      }
    }

    // Income
    const incomeMatch = message.match(/(?:gagne|revenu|salaire|earn|ingreso)[^\d]*(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|\/mois|\/m|per month)/i);
    if (incomeMatch) {
      const raw = incomeMatch[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) updates.monthlyIncome = { value: val, origin: 'USER_PROVIDED' };
    }

    // Expenses
    const expMatch = message.match(/(?:dépense|dépenses|charges|loyer|spend|gasto)[^\d]*(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|\/mois|\/m|per month)/i);
    if (expMatch) {
      const raw = expMatch[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) updates.monthlyExpenses = { value: val, origin: 'USER_PROVIDED' };
    }
    
    // Location (very basic extraction, will need better NLP later, but preserving some existing logic)
    if (p.includes('marseille')) updates.originLocation = { value: 'Marseille', origin: 'USER_PROVIDED' };
    if (p.includes('paris')) updates.originLocation = { value: 'Paris', origin: 'USER_PROVIDED' };
    
    if (p.includes('japon') || p.includes('japan')) updates.destinationLocation = { value: 'Japon', origin: 'USER_PROVIDED' };
    else if (p.includes('espagne') || p.includes('spain')) updates.destinationLocation = { value: 'Espagne', origin: 'USER_PROVIDED' };
    else if (p.includes('portugal')) updates.destinationLocation = { value: 'Portugal', origin: 'USER_PROVIDED' };
    else if (p.includes('thaïlande') || p.includes('thailand')) updates.destinationLocation = { value: 'Thaïlande', origin: 'USER_PROVIDED' };
    else if (p.includes('miami')) updates.destinationLocation = { value: 'États-Unis (Miami)', origin: 'USER_PROVIDED' };

    // Duration
    const daysMatch = message.match(/(\d+)\s*(?:jours?|days?|días?)/i);
    if (daysMatch) {
      updates.durationDays = { value: parseInt(daysMatch[1], 10), origin: 'USER_PROVIDED' };
    }
    
    const monthsMatch = message.match(/(\d+)\s*(?:mois|months?|meses?)/i);
    if (monthsMatch) {
      updates.durationMonths = { value: parseInt(monthsMatch[1], 10), origin: 'USER_PROVIDED' };
    }

    // Intent disambiguation phrases
    if (p.includes('voyager')) updates.primaryIntent = { value: 'LEAVE_OR_TRAVEL', origin: 'USER_PROVIDED' };
    if (p.includes('partir vivre')) updates.primaryIntent = { value: 'RELOCATE', origin: 'USER_PROVIDED' };
    if (p.includes('changer de vie')) updates.primaryIntent = { value: 'LIFE_CHANGE' as any, origin: 'USER_PROVIDED' };

    return updates;
  }

  private static mapIntent(legacyIntent: string, prompt: string): UserIntent {
    if (prompt.includes('voyager')) return 'LEAVE_OR_TRAVEL';
    if (prompt.includes('partir vivre')) return 'RELOCATE';
    if (legacyIntent === 'CAN_I_START_THIS_BUSINESS') return 'START_BUSINESS';
    if (legacyIntent === 'CAN_I_CHANGE_CAREER') return 'CHANGE_CAREER';
    if (legacyIntent === 'CAN_I_RELOCATE') return 'RELOCATE';
    return 'UNKNOWN';
  }
}
