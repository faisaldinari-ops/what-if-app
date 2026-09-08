// src/services/ai/domainClassifier.ts
import { ProjectDomain } from '../../types/context';

export function classifyProjectDomain(prompt: string): ProjectDomain {
  const p = prompt.toLowerCase();

  // 1. Digital project (website, app, SaaS, ecommerce, blog)
  if (
    p.includes('site internet') ||
    p.includes('site web') ||
    p.includes('application') ||
    p.includes('app mobile') ||
    p.includes('saas') ||
    p.includes('boutique en ligne') ||
    p.includes('e-commerce') ||
    p.includes('ecommerce') ||
    p.includes('créer un site') ||
    p.includes('monter une application') ||
    p.includes('monter un site') ||
    p.includes('logiciel') ||
    p.includes('software') ||
    p.includes('web app')
  ) {
    return 'digital_project';
  }

  // 2. Relocation (leaving country, moving abroad, expat)
  if (
    p.includes('quitter la france') ||
    p.includes('partir vivre') ||
    p.includes('vivre en espagne') ||
    p.includes('vivre à miami') ||
    p.includes('vivre au canada') ||
    p.includes('vivre au portugal') ||
    p.includes('vivre à l’étranger') ||
    p.includes('vivre a letranger') ||
    p.includes('m’expatrier') ||
    p.includes('mexpatrier') ||
    p.includes('déménager dans un autre pays') ||
    p.includes('changer de pays') ||
    p.includes('move to') ||
    p.includes('relocate') ||
    p.includes('mudarse al extranjero')
  ) {
    return 'relocation';
  }

  // 3. Travel (vacations, short trips, holidays)
  if (
    p.includes('partir 10 jours') ||
    p.includes('partir en vacances') ||
    p.includes('voyager avec') ||
    p.includes('voyage au japon') ||
    p.includes('voyage en') ||
    p.includes('partir au japon') ||
    p.includes('partir en thaïlande') ||
    p.includes('partir aux usa') ||
    p.includes('où puis-je voyager') ||
    p.includes('faire un road trip') ||
    p.includes('visiter') ||
    p.includes('travel to') ||
    p.includes('holiday') ||
    p.includes('viajar')
  ) {
    return 'travel';
  }

  // 4. Career (changing jobs, learning new trade, retraining)
  if (
    p.includes('changer de métier') ||
    p.includes('changer de carrière') ||
    p.includes('reconversion') ||
    p.includes('changer de travail') ||
    p.includes('me reconvertir') ||
    p.includes('devenir développeur') ||
    p.includes('devenir designer') ||
    p.includes('change career') ||
    p.includes('cambiar de trabajo')
  ) {
    return 'career';
  }

  // 5. Business (entrepreneurship, artisan, commerce, salon, opening shop)
  if (
    p.includes('société') ||
    p.includes('entreprise') ||
    p.includes('barber shop') ||
    p.includes('restaurant') ||
    p.includes('café') ||
    p.includes('boulangerie') ||
    p.includes('électricien') ||
    p.includes('plombier') ||
    p.includes('artisan') ||
    p.includes('mettre à mon compte') ||
    p.includes('ouvrir un magasin') ||
    p.includes('ouvrir un commerce') ||
    p.includes('indépendant') ||
    p.includes('freelance') ||
    p.includes('auto-entrepreneur') ||
    p.includes('business') ||
    p.includes('start a company')
  ) {
    return 'business';
  }

  // 6. Purchase (car, boat, watch, high-ticket personal purchase)
  if (
    p.includes('acheter une voiture') ||
    p.includes('acheter un véhicule') ||
    p.includes('acheter une moto') ||
    p.includes('achat') ||
    p.includes('buy a car') ||
    p.includes('comprar un coche')
  ) {
    return 'purchase';
  }

  // 7. Real estate (buying apartment, house, land)
  if (
    p.includes('acheter un appartement') ||
    p.includes('acheter une maison') ||
    p.includes('immobilier') ||
    p.includes('investir dans l’immobilier') ||
    p.includes('real estate') ||
    p.includes('comprar una casa')
  ) {
    return 'real_estate';
  }

  // 8. Personal finance (savings, investing, debt, runway)
  if (
    p.includes('combien de temps pour économiser') ||
    p.includes('mettre de côté') ||
    p.includes('épargner') ||
    p.includes('gère mon budget') ||
    p.includes('épargne')
  ) {
    return 'personal_finance';
  }

  // 9. Life change general
  if (
    p.includes('changer complètement de vie') ||
    p.includes('changer de vie') ||
    p.includes('tout plaquer') ||
    p.includes('nouveau départ') ||
    p.includes('life change') ||
    p.includes('cambiar de vida')
  ) {
    return 'life_change';
  }

  return 'other';
}
