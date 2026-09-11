// src/core/engine/RequestIntentClassifier.ts
import { RequestIntent } from '../types';

export function classifyRequestIntent(prompt: string): RequestIntent {
  const p = prompt.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 0. VERIFY_FACT: generic third-party factual question, not a personal project request.
  // Distinguishing signal: "combien coûte un/le/la X" (third-person article) rather than
  // "combien ça me coûterait" / "combien pour demarrer MON projet" (first-person project framing).
  const isGenericFactualCostQuestion =
    /combien coute (un|une|le|la|les|des)\s/.test(p) ||
    /how much does (a|an|the)\s.+\s(cost|require)/.test(p) ||
    p.includes('quel est le prix d\'un') ||
    p.includes('quel est le prix d un') ||
    p.includes('quel est le prix de la') ||
    p.includes('quel est le prix du');
  const hasPersonalProjectFraming =
    p.includes(' mon ') || p.includes(' ma ') || p.includes(' mes ') ||
    p.includes('demarrer') || p.includes('lancer') || p.includes('creer') || p.includes('ouvrir');

  if (isGenericFactualCostQuestion && !hasPersonalProjectFraming) {
    return 'VERIFY_FACT';
  }

  // 1. ESTIMATE_COST (Pure cost query: "combien ça me coûterait", "combien pour démarrer", "quel budget prévoir")
  if (
    p.includes('ca me couterai') ||
    p.includes('ca me couterait') ||
    p.includes('combien pour demarrer') ||
    p.includes('combien pour commencer') ||
    p.includes('combien pour lancer') ||
    p.includes('combien ca coute') ||
    p.includes('combien coute') ||
    p.includes('combien couterait') ||
    p.includes('combien faut-il') ||
    p.includes('combien faut il') ||
    p.includes('il me faut combien') ||
    p.includes('il faut combien') ||
    p.includes('combien prevoir') ||
    p.includes('quel est le cout') ||
    p.includes('quel budget prevoir') ||
    p.includes('quel budget faut') ||
    p.includes('quel investissement') ||
    p.includes('combien investir') ||
    p.includes('how much does it cost') ||
    p.includes('how much to start') ||
    p.includes('how much would it cost') ||
    p.includes('cuanto cuesta') ||
    p.includes('cuanto dinero necesito para empezar')
  ) {
    return 'ESTIMATE_COST';
  }

  // 2. FIND_SOLUTION (0 € or "pas de sous / sans argent")
  // Note: use a word-boundary regex for the "0€" check — a plain substring match would wrongly
  // fire on "2000€" (which contains "0€"). Only a standalone zero should count.
  const hasStandaloneZeroAmount = /(?:^|[^0-9])0\s*(?:€|euros?|dollars?|\$)/.test(p);
  if (
    p.includes('pas de sous') ||
    p.includes('pas d’argent') ||
    p.includes('pas d argent') ||
    p.includes('sans argent') ||
    p.includes('sans apport') ||
    p.includes('sans budget') ||
    p.includes('zero euro') ||
    hasStandaloneZeroAmount ||
    p.includes('comment faire sans un sou') ||
    p.includes('no money') ||
    p.includes('sin dinero')
  ) {
    return 'FIND_SOLUTION';
  }

  // 3. CHECK_AFFORDABILITY ("J'ai X €, est-ce suffisant / faisable ?")
  if (
    p.includes('est-ce suffisant') ||
    p.includes('est ce suffisant') ||
    p.includes('est-ce assez') ||
    p.includes('est ce assez') ||
    p.includes('est-ce faisable avec') ||
    p.includes('est ce faisable avec') ||
    p.includes('puis-je me permettre') ||
    p.includes('puis je me permettre') ||
    p.includes('can i afford') ||
    p.includes('is it enough') ||
    p.includes('me alcanza') ||
    (p.includes('j\'ai') && p.includes('est-ce que')) ||
    (p.includes('jai') && p.includes('est-ce que'))
  ) {
    return 'CHECK_AFFORDABILITY';
  }

  // 4. CHECK_ELIGIBILITY ("quelles aides", "subventions", "droit à", "ACRE", "ARCE")
  if (
    p.includes('quelles aides') ||
    p.includes('quelles subventions') ||
    p.includes('ai-je droit') ||
    p.includes('ai je droit') ||
    p.includes('droit a l\'acre') ||
    p.includes('droit au chomage') ||
    p.includes('what grants') ||
    p.includes('que ayudas')
  ) {
    return 'CHECK_ELIGIBILITY';
  }

  // 5. BUILD_PLAN ("comment faire pour", "étapes pour créer", "guide pour")
  if (
    p.includes('quelles sont les etapes') ||
    p.includes('les etapes pour') ||
    p.includes('comment creer') ||
    p.includes('comment faire pour ouvrir') ||
    p.includes('comment faire pour lancer') ||
    p.includes('how to start') ||
    p.includes('como crear')
  ) {
    return 'BUILD_PLAN';
  }

  // 6. COMPARE_OPTIONS ("mieux de X ou Y", "comparer", "vaut-il mieux")
  if (
    p.includes('vaut-il mieux') ||
    p.includes('vaut il mieux') ||
    p.includes('est-ce mieux de') ||
    p.includes('est ce mieux de') ||
    p.includes('comparer') ||
    p.includes('difference entre') ||
    p.includes('which is better')
  ) {
    return 'COMPARE_OPTIONS';
  }

  // 7. General project launch
  if (
    p.includes('je souhaite creer') ||
    p.includes('je veux creer') ||
    p.includes('je veux ouvrir') ||
    p.includes('je veux lancer') ||
    p.includes('monter ma boite') ||
    p.includes('creer ma boite')
  ) {
    return 'START_PROJECT';
  }

  return 'UNKNOWN';
}
