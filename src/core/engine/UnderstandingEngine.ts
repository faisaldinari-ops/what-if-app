// src/core/engine/UnderstandingEngine.ts
import { ProjectState, ProjectDomain, UserIntent, RequestIntent, OperatingModel, Fact, createUnknownFact } from '../types';
import { classifyProjectDomain } from '../../services/ai/domainClassifier';
import { classifyUserIntent } from '../../services/ai/intentClassifier';
import { classifyRequestIntent } from './RequestIntentClassifier';

export class UnderstandingEngine {
  
  static extractFacts(message: string, currentState: ProjectState): Partial<ProjectState> {
    const updates: Partial<ProjectState> = {};
    const p = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 1. Request Intent extraction
    if (currentState.requestIntent.value === 'UNKNOWN') {
      const reqIntent = classifyRequestIntent(message);
      if (reqIntent !== 'UNKNOWN') {
        updates.requestIntent = { value: reqIntent, origin: 'DERIVED' };
      }
    }

    // 2. Domain & Primary Intent extraction
    // High-priority domain checks to prevent domain contamination:
    const isBeautyActivity =
      p.includes('ongle') ||
      p.includes('cil') ||
      p.includes('faux cil') ||
      p.includes('esthetique') ||
      p.includes('manucure');

    const isBusinessClue =
      isBeautyActivity ||
      p.includes('creer ma boite') ||
      p.includes('lancer ma societe') ||
      p.includes('ouvrir un') ||
      p.includes('electricien') ||
      p.includes('artisan') ||
      p.includes('entreprise');

    if (currentState.activeDomains.length === 0) {
      if (isBusinessClue) {
        updates.activeDomains = ['business'];
        updates.primaryIntent = { value: 'START_BUSINESS', origin: 'DERIVED' };
      } else {
        const domain = classifyProjectDomain(message);
        if (domain !== 'other') {
          updates.activeDomains = [domain];
        }
      }
    }

    if (currentState.primaryIntent.value === 'UNKNOWN') {
      if (isBusinessClue) {
        updates.primaryIntent = { value: 'START_BUSINESS', origin: 'DERIVED' };
      } else {
        const intentStr = classifyUserIntent(message);
        updates.primaryIntent = { value: this.mapIntent(intentStr, p), origin: 'DERIVED' };
      }
    }

    // 3. Activity Subtype
    if (currentState.activitySubtype.value === 'UNKNOWN') {
      if (isBeautyActivity) {
        updates.activitySubtype = { value: 'ongles_et_faux_cils', origin: 'USER_PROVIDED' };
      } else if (p.includes('electricien')) {
        updates.activitySubtype = { value: 'artisan_electricien', origin: 'USER_PROVIDED' };
      } else if (p.includes('restaurant') || p.includes('food truck')) {
        updates.activitySubtype = { value: 'restauration', origin: 'USER_PROVIDED' };
      } else if (p.includes('dev') || p.includes('freelance')) {
        updates.activitySubtype = { value: 'tech_freelance', origin: 'USER_PROVIDED' };
      }
    }

    // 4. Operating Model extraction (domicile, mobile, salon, etc.)
    if (currentState.operatingModel.value === 'UNKNOWN') {
      if (
        p.includes('chez moi') ||
        p.includes('domicile') ||
        p.includes('a la maison') ||
        p.includes('from home')
      ) {
        updates.operatingModel = { value: 'home', origin: 'USER_PROVIDED' };
      } else if (
        p.includes('deplacement') ||
        p.includes('chez les clientes') ||
        p.includes('chez le client') ||
        p.includes('mobile') ||
        p.includes('itinerant')
      ) {
        updates.operatingModel = { value: 'mobile', origin: 'USER_PROVIDED' };
      } else if (
        p.includes('local') ||
        p.includes('salon') ||
        p.includes('institut') ||
        p.includes('boutique') ||
        p.includes('bail')
      ) {
        updates.operatingModel = { value: 'salon', origin: 'USER_PROVIDED' };
      } else if (p.includes('en ligne') || p.includes('remote') || p.includes('online')) {
        updates.operatingModel = { value: 'online', origin: 'USER_PROVIDED' };
      }
    }

    // Number extraction
    // Budget
    const budgetMatch = message.match(/(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|dollars?)/i);
    // Explicit 0
    const zeroMatch = message.match(/\b0\s*(?:€|euros?|dollars?|\$)\b/i) || p.includes('0 euro') || p.includes('0 €');

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
    
    // Locations (only for travel or relocation)
    const isNotBusiness = !currentState.activeDomains.includes('business') && !isBusinessClue;
    if (isNotBusiness) {
      if (p.includes('marseille')) updates.originLocation = { value: 'Marseille', origin: 'USER_PROVIDED' };
      if (p.includes('paris')) updates.originLocation = { value: 'Paris', origin: 'USER_PROVIDED' };
      
      if (p.includes('japon') || p.includes('japan')) updates.destinationLocation = { value: 'Japon', origin: 'USER_PROVIDED' };
      else if (p.includes('espagne') || p.includes('spain')) updates.destinationLocation = { value: 'Espagne', origin: 'USER_PROVIDED' };
      else if (p.includes('portugal')) updates.destinationLocation = { value: 'Portugal', origin: 'USER_PROVIDED' };
      else if (p.includes('thaïlande') || p.includes('thailand')) updates.destinationLocation = { value: 'Thaïlande', origin: 'USER_PROVIDED' };
      else if (p.includes('miami')) updates.destinationLocation = { value: 'États-Unis (Miami)', origin: 'USER_PROVIDED' };
    }

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

