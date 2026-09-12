// src/core/engine/UnderstandingEngine.ts
import { ProjectState, ProjectDomain, UserIntent, RequestIntent, OperatingModel, Fact, createUnknownFact } from '../types';
import { classifyProjectDomain } from '../../services/ai/domainClassifier';
import { classifyUserIntent } from '../../services/ai/intentClassifier';
import { classifyRequestIntent } from './RequestIntentClassifier';

export class UnderstandingEngine {
  
  static extractFacts(message: string, currentState: ProjectState): Partial<ProjectState> {
    const updates: Partial<ProjectState> = {};
    const p = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 0. Detect domain + explicit goal change up front, since it affects how every other
    // field below is extracted (whether we reuse prior state or start that field fresh).
    const domain = classifyProjectDomain(message);
    const isBusinessClue = domain === 'business';
    const signalsGoalChange = /\b(en fait|plutot|plutôt|finalement|je prefere|je préfère|changement de projet|change d avis|changer d avis)\b/.test(p);
    const isGenuineDomainSwitch = signalsGoalChange && domain !== 'other' && currentState.activeDomains.length > 0 && !currentState.activeDomains.includes(domain);

    // 1. Request Intent extraction (re-evaluated from scratch when the goal changed)
    if (isGenuineDomainSwitch || currentState.requestIntent.value === 'UNKNOWN') {
      const reqIntent = classifyRequestIntent(message);
      updates.requestIntent = reqIntent !== 'UNKNOWN'
        ? { value: reqIntent, origin: 'DERIVED' }
        : createUnknownFact();
    }

    // 2. Domain & Primary Intent extraction
    // Single source of truth for domain detection: classifyProjectDomain (generic keyword-root
    // matcher, see domainClassifier.ts). Beauty/artisan activities are a subset of 'business'
    // used later only to pick an activitySubtype/operatingModel question, not to re-derive domain.
    const isBeautyActivity =
      p.includes('ongle') ||
      p.includes('cil') ||
      p.includes('faux cil') ||
      p.includes('esthetique') ||
      p.includes('manucure');

    // Explicit goal change: reset domain-specific facts (destination, duration, operating model,
    // activity...) but keep general financial facts (budget, income, expenses) since those
    // describe the person, not the abandoned project. requestIntent was already reset in step 1.
    if (isGenuineDomainSwitch) {
      updates.activeDomains = [domain];
      updates.primaryIntent = createUnknownFact();
      updates.destinationLocation = createUnknownFact();
      updates.originLocation = createUnknownFact();
      updates.durationDays = createUnknownFact();
      updates.durationMonths = createUnknownFact();
      updates.operatingModel = createUnknownFact();
      updates.activitySubtype = createUnknownFact();
    } else if (currentState.activeDomains.length === 0 && domain !== 'other') {
      updates.activeDomains = [domain];
    }

    if (isGenuineDomainSwitch || currentState.primaryIntent.value === 'UNKNOWN') {
      if (isBusinessClue) {
        updates.primaryIntent = { value: 'START_BUSINESS', origin: 'DERIVED' };
      } else if (domain === 'travel') {
        updates.primaryIntent = { value: 'LEAVE_OR_TRAVEL', origin: 'DERIVED' };
      } else if (domain === 'relocation') {
        updates.primaryIntent = { value: 'RELOCATE', origin: 'DERIVED' };
      } else if (domain === 'career') {
        updates.primaryIntent = { value: 'CHANGE_CAREER', origin: 'DERIVED' };
      } else if (domain === 'real_estate' || domain === 'purchase') {
        updates.primaryIntent = { value: 'BUY_SOMETHING', origin: 'DERIVED' };
      } else {
        const intentStr = classifyUserIntent(message);
        updates.primaryIntent = { value: this.mapIntent(intentStr, p), origin: 'DERIVED' };
      }
    }

    // 3. Activity Subtype
    if (isGenuineDomainSwitch || currentState.activitySubtype.value === 'UNKNOWN') {
      if (isBeautyActivity) {
        updates.activitySubtype = { value: 'ongles_et_faux_cils', origin: 'USER_PROVIDED' };
      } else if (p.includes('electr')) {
        updates.activitySubtype = { value: 'artisan_electricien', origin: 'USER_PROVIDED' };
      } else if (p.includes('plombier')) {
        updates.activitySubtype = { value: 'artisan_plombier', origin: 'USER_PROVIDED' };
      } else if (p.includes('restaurant') || p.includes('food truck') || p.includes('snack')) {
        updates.activitySubtype = { value: 'restauration', origin: 'USER_PROVIDED' };
      } else if (p.includes('coiff') || p.includes('barber')) {
        updates.activitySubtype = { value: 'coiffure', origin: 'USER_PROVIDED' };
      } else if (p.includes('dev') || p.includes('freelance') || p.includes('consultant')) {
        updates.activitySubtype = { value: 'tech_freelance', origin: 'USER_PROVIDED' };
      }
    }

    // 4. Operating Model extraction (domicile, mobile, salon, etc.) — only meaningful for
    // physical business activities (beauty/artisan/food). For digital projects these same
    // words have unrelated meanings ("application mobile", "boutique en ligne") and must not
    // be misread as an answer to the diy_free/custom_dev question, which is asked separately.
    if (domain !== 'digital_project' && (isGenuineDomainSwitch || currentState.operatingModel.value === 'UNKNOWN')) {
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

    // 4b. Digital project operating model: only explicit, unambiguous statements about the
    // build approach count (no generic word like "mobile" that could mean something else).
    if (domain === 'digital_project' && (isGenuineDomainSwitch || currentState.operatingModel.value === 'UNKNOWN')) {
      if (
        p.includes('gratuit') || p.includes('no-code') || p.includes('nocode') ||
        p.includes('moi meme') || p.includes('free tool') || p.includes('diy')
      ) {
        updates.operatingModel = { value: 'diy_free', origin: 'USER_PROVIDED' };
      } else if (
        p.includes('freelance') || p.includes('agence') || p.includes('developpeur') ||
        p.includes('sur mesure') || p.includes('sur-mesure') || p.includes('custom dev')
      ) {
        updates.operatingModel = { value: 'custom_dev', origin: 'USER_PROVIDED' };
      }
    }

    // Number extraction
    // Distinguish "price of the thing being bought" (real estate, purchase) from "budget/savings
    // available" — a single message can legitimately contain both ("maison à 300 000€ avec 30 000€
    // d'apport"), and conflating them silently invents a wrong budget. We extract all money
    // mentions with their surrounding context and assign each by keyword proximity.
    const moneyMentions: Array<{ value: number; index: number; context: string }> = [];
    const moneyRegex = /(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|dollars?)/gi;
    let mm: RegExpExecArray | null;
    while ((mm = moneyRegex.exec(message)) !== null) {
      const raw = mm[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        const start = Math.max(0, mm.index - 25);
        moneyMentions.push({ value: val, index: mm.index, context: p.slice(start, mm.index + 10) });
      }
    }

    // Income first (so its amount can be excluded from budget candidates below)
    const incomeMatch = message.match(/(?:gagne|revenu|salaire|earn|ingreso)[^\d]*(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|\/mois|\/m|per month)/i);
    let extractedIncome: number | undefined;
    if (incomeMatch) {
      const raw = incomeMatch[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        extractedIncome = val;
        updates.monthlyIncome = { value: val, origin: 'USER_PROVIDED' };
      }
    }

    // Expenses (so its amount can also be excluded from budget candidates below)
    const expMatch = message.match(/(?:dépense|dépenses|charges|loyer|spend|gasto)[^\d]*(\d[\d\s.,]*)\s*(?:€|\$|£|chf|euros?|\/mois|\/m|per month)/i);
    let extractedExpenses: number | undefined;
    if (expMatch) {
      const raw = expMatch[1].replace(/\s/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        extractedExpenses = val;
        updates.monthlyExpenses = { value: val, origin: 'USER_PROVIDED' };
      }
    }

    // Remaining money mentions, excluding whatever was already claimed as income/expenses,
    // are the candidates for "available budget" / "item price".
    const remainingMentions = moneyMentions.filter(m =>
      !(extractedIncome !== undefined && m.value === extractedIncome) &&
      !(extractedExpenses !== undefined && m.value === extractedExpenses)
    );

    const priceMention = remainingMentions.find(m => /(?:^|\s)(a|de|prix|coute|couterait)\s*$/.test(m.context.trimEnd() + ' '));
    const savingsKeywords = ['apport', 'economie', 'epargne', 'budget', 'jai', 'j ai', 'capital', 'dispose'];
    const savingsMention = remainingMentions.find(m => savingsKeywords.some(kw => m.context.includes(kw)));

    // Explicit 0, or an unambiguous "I have no money" statement. Only phrases that leave no
    // reasonable doubt count here — anything vaguer (e.g. "petit budget", "pas beaucoup
    // d'argent") stays UNKNOWN and gets asked for, rather than silently resolved to 0.
    // IMPORTANT: a standalone "0" must not be immediately preceded by another digit, otherwise
    // "15 000 €" or "2 000 €" would wrongly match on their trailing "0 €" and silently zero out
    // a real budget — this is exactly the kind of silent invention UNKNOWN=UNKNOWN forbids.
    const explicitZeroPhrase = /\b(pas d.argent|pas de sous|aucun budget|aucune epargne|sans argent|sans un sou|no money|sin dinero|sin un duro)\b/.test(p);
    const hasStandaloneZeroAmount = /(?:^|[^0-9])0\s*(?:€|euros?|dollars?|\$)/i.test(message);
    const zeroMatch = hasStandaloneZeroAmount || explicitZeroPhrase;

    const isRealEstateOrPurchase = domain === 'real_estate' || domain === 'purchase';

    if (zeroMatch) {
      updates.availableBudget = { value: 0, origin: 'USER_PROVIDED' };
    } else if (isRealEstateOrPurchase && savingsMention) {
      // Clear "apport/économies/budget" mention: that is the available budget.
      updates.availableBudget = { value: savingsMention.value, origin: 'USER_PROVIDED' };
    } else if (isRealEstateOrPurchase && remainingMentions.length >= 2) {
      // Two+ amounts with no explicit savings keyword: assume first = price, second = budget
      // (matches the natural phrasing "maison à 300 000€ avec 30 000€ d'apport").
      updates.availableBudget = { value: remainingMentions[1].value, origin: 'USER_PROVIDED' };
    } else if (remainingMentions.length > 0 && !(isRealEstateOrPurchase && remainingMentions.length === 1 && !savingsMention)) {
      // Single amount, non-purchase context (or purchase context but flagged as savings):
      // treat as available budget.
      updates.availableBudget = { value: remainingMentions[0].value, origin: 'USER_PROVIDED' };
    }

    // Purchase/real-estate price of the item itself (used as projectStartupCost downstream)
    if (isRealEstateOrPurchase && remainingMentions.length > 0) {
      const price = priceMention || remainingMentions[0];
      // Avoid double-using the same mention as both price and budget when only one figure exists.
      if (!(remainingMentions.length === 1 && savingsMention)) {
        updates.facts = {
          ...(currentState.facts || {}),
          itemPrice: { value: price.value, origin: 'USER_PROVIDED' }
        };
      }
    }
    
    // Locations (only for travel or relocation) — generic proper-noun extraction instead of a
    // closed city/country list, so any destination the user actually types is captured verbatim.
    const isNotBusiness = !currentState.activeDomains.includes('business') && !isBusinessClue;
    if (isNotBusiness) {
      // Known short-form origins (common French cities used colloquially as "depuis Marseille" etc.)
      const originMatch = message.match(/(?:depuis|de|from)\s+([A-ZÀ-Ÿ][a-zà-ÿ\-]+)/);
      if (originMatch) {
        const candidate = originMatch[1].trim();
        const stopWords = ['Le', 'La', 'Les', 'Un', 'Une', 'Des', 'Mon', 'Ma', 'Mes', 'Ce', 'Cet', 'Cette'];
        if (!stopWords.includes(candidate)) {
          updates.originLocation = { value: candidate, origin: 'USER_PROVIDED' };
        }
      }

      // Destination: capture "au/en/à/vers/pour + ProperNoun" generically (covers any country/city,
      // not just a fixed shortlist). Falls back to nothing (UNKNOWN) if no proper noun is found —
      // never invents a destination.
      const destMatch = message.match(/(?:au|aux|en|à|vers|pour)\s+([A-ZÀ-Ÿ][a-zà-ÿ\-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ\-]+)?)/);
      if (destMatch) {
        const candidate = destMatch[1].trim();
        const stopWords = ['Le', 'La', 'Les', 'Un', 'Une', 'Des', 'Mon', 'Ma', 'Mes', 'Ce', 'Cet', 'Cette', 'Combien'];
        if (!stopWords.includes(candidate)) {
          updates.destinationLocation = { value: candidate, origin: 'USER_PROVIDED' };
        }
      }
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

    // Explicit high-confidence phrase overrides (user's own words, not a fallback guess)
    if (p.includes('voyager') || p.includes('voyage')) {
      updates.primaryIntent = { value: 'LEAVE_OR_TRAVEL', origin: 'USER_PROVIDED' };
    }
    if (p.includes('partir vivre') || p.includes('m expatrier') || p.includes('mexpatrier')) {
      updates.primaryIntent = { value: 'RELOCATE', origin: 'USER_PROVIDED' };
    }

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

