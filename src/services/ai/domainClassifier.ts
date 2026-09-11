// src/services/ai/domainClassifier.ts
import { ProjectDomain } from '../../types/context';

// Generic keyword-root matcher: normalizes accents so "électricien"/"electricien"
// and inflected forms ("voyager"/"voyage"/"voyageant") all match via short roots.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hasAny(p: string, roots: string[]): boolean {
  return roots.some(r => p.includes(r));
}

export function classifyProjectDomain(prompt: string): ProjectDomain {
  const p = normalize(prompt);

  // Marriage / wedding is its own recognizable life project (not hardcoded per-example,
  // but a genuinely distinct real-world project type with its own cost/timeline shape).
  const isWedding = hasAny(p, ['marier', 'mariage', 'se marier', 'wedding', 'casarse', 'boda']);
  if (isWedding) return 'life_change';

  // 1. Digital project (website, app, SaaS, ecommerce, software) — root-based, not fixed phrases
  const isDigital = hasAny(p, [
    'site internet', 'site web', 'creer un site', 'monter un site',
    'application', 'app mobile', 'appli ', 'saas', 'boutique en ligne',
    'e-commerce', 'ecommerce', 'logiciel', 'software', 'web app', 'plateforme numerique'
  ]);
  if (isDigital) return 'digital_project';

  // 2. Relocation (leaving country, moving abroad, expat) — generic roots + country mention
  const relocationVerbs = hasAny(p, [
    'expatrier', 'partir vivre', 'demenager', 'quitter mon pays', 'quitter la france',
    'changer de pays', 'move to', 'relocate', 'mudarse', 'emigrer', 'immigrer'
  ]);
  const relocationPhrase = hasAny(p, ['vivre a l etranger', 'vivre a letranger', 'live abroad']);
  if (relocationVerbs || relocationPhrase) return 'relocation';

  // 3. Travel (vacations, short trips, holidays) — generic verb roots, no destination hardcoding
  const isTravel = hasAny(p, [
    'voyage', 'voyager', 'partir en vacances', 'road trip', 'visiter',
    'travel to', 'holiday', 'vacation', 'viajar', 'tour du monde'
  ]);
  if (isTravel) return 'travel';

  // 4. Career (changing jobs, learning new trade, retraining)
  const isCareer = hasAny(p, [
    'changer de metier', 'changer de carriere', 'reconversion', 'changer de travail',
    'me reconvertir', 'change career', 'switch career', 'cambiar de trabajo', 'cambiar de carrera'
  ]);
  if (isCareer) return 'career';

  // 5. Real estate (buying apartment, house, land) — check before generic "purchase"
  const isRealEstate = hasAny(p, [
    'appartement', 'acheter une maison', 'acheter la maison', 'immobilier',
    'real estate', 'comprar una casa', 'comprar casa', 'credit immobilier', 'pret immobilier'
  ]);
  if (isRealEstate) return 'real_estate';

  // 6. Business (entrepreneurship, artisan, commerce, salon, opening shop) — broad roots
  const isBusiness = hasAny(p, [
    'societe', 'entreprise', 'ma boite', 'ma boîte', 'auto-entrepreneur', 'auto entrepreneur',
    'micro-entreprise', 'micro entreprise', 'freelance', 'independant', 'mon compte',
    'ouvrir un', 'ouvrir une', 'lancer une activite', 'lancer mon activite',
    'electr', 'plombier', 'menuisier', 'chauffagiste', 'artisan', 'btp',
    'restaurant', 'food truck', 'snack', 'cafe', 'boulangerie', 'patisserie',
    'coiffure', 'coiffeur', 'coiffeuse', 'salon de', 'barber', 'esthetique',
    'ongle', 'onglerie', 'cil ', 'faux cils', 'manucure',
    'start a company', 'start a business', 'start my business', 'business'
  ]);
  if (isBusiness) return 'business';

  // 7. Purchase (car, boat, watch, high-ticket personal purchase; not real estate)
  const isPurchase = hasAny(p, [
    'acheter une voiture', 'acheter un vehicule', 'acheter une moto', 'acheter un bateau',
    'buy a car', 'comprar un coche', 'comprar coche'
  ]);
  if (isPurchase) return 'purchase';

  // 8. Personal finance (savings, investing, debt, runway)
  const isPersonalFinance = hasAny(p, [
    'economiser', 'mettre de cote', 'epargner', 'epargne', 'gerer mon budget', 'investir mon argent'
  ]);
  if (isPersonalFinance) return 'personal_finance';

  // 9. Life change general (vague or holistic personal transformation)
  const isLifeChange = hasAny(p, [
    'changer de vie', 'tout plaquer', 'nouveau depart', 'life change',
    'cambiar de vida', 'recommencer a zero', 'repartir a zero'
  ]);
  if (isLifeChange) return 'life_change';

  return 'other';
}
