// src/services/research/accommodationProvider.ts
import { CostRange } from '../../types/research';
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface AccommodationDetails {
  cityOrCountry: string;
  shortTermPerNight: CostRange;
  longTermMonthlyStudio: CostRange;
  longTermMonthly1Bed: CostRange;
  requiredDeposits: string;
  typicalPrerequisites: string[];
  facts: GroundedFact[];
}

/**
 * Provides housing and rental estimates with honest provenance.
 */
export function getAccommodationDetails(cityOrCountry: string): AccommodationDetails {
  const c = cityOrCountry.toLowerCase();
  const facts: GroundedFact[] = [];

  let nightMin = 30;
  let nightReal = 65;
  let nightComfort = 130;

  let studioMin = 400;
  let studioReal = 600;
  let studioComfort = 900;

  let oneBedMin = 500;
  let oneBedReal = 750;
  let oneBedComfort = 1200;

  let deposits = '1 à 2 mois de loyer en caution de garantie';
  let prerequisites = [
    'Justificatif de revenus ou garant',
    'Numéro fiscal local pour enregistrement du bail'
  ];

  if (c.includes('japon') || c.includes('tokyo')) {
    nightMin = 35;
    nightReal = 80;
    nightComfort = 170;
    studioReal = 650;
    oneBedReal = 900;
    deposits = 'Shikikin (dépôt de garantie 1-2 mois) + parfois Reikin (argent-cadeau 1 mois)';
    prerequisites = [
      'Visa valide supérieur à 6 mois pour bail standard',
      'Garant japonais (Guarantor Company) obligatoire dans 90 % des agences'
    ];
  } else if (c.includes('espagne')) {
    nightMin = 35;
    nightReal = 75;
    nightComfort = 140;
    studioReal = 650;
    oneBedReal = 850;
    deposits = '1 mois de fianza légale + 1 à 2 mois de garantie additionnelle selon le bailleur';
    prerequisites = [
      'Numéro NIE (Numéro d’Identification d’Étranger)',
      'Contrat de travail espagnol ou 3 dernières fiches de paie'
    ];
  } else if (c.includes('maroc') || c.includes('tunisie')) {
    nightMin = 20;
    nightReal = 45;
    nightComfort = 90;
    studioReal = 250;
    oneBedReal = 350;
    deposits = '1 mois de caution';
    prerequisites = ['Passeport ou Carte Nationale d’Identité'];
  }

  facts.push(
    createGroundedFact(
      'accommodation_estimate',
      `Logement indicatif (${cityOrCountry})`,
      `Courte durée ~${nightReal} €/nuit | Bail résidentiel 1P ~${oneBedReal} €/mois`,
      'Benchmarks immobiliers & indices locatifs',
      undefined,
      false,
      false
    )
  );

  return {
    cityOrCountry,
    shortTermPerNight: {
      min: nightMin,
      realistic: nightReal,
      comfortable: nightComfort,
      currency: 'EUR',
      confidence: 'medium'
    },
    longTermMonthlyStudio: {
      min: studioMin,
      realistic: studioReal,
      comfortable: studioComfort,
      currency: 'EUR',
      confidence: 'medium'
    },
    longTermMonthly1Bed: {
      min: oneBedMin,
      realistic: oneBedReal,
      comfortable: oneBedComfort,
      currency: 'EUR',
      confidence: 'medium'
    },
    requiredDeposits: deposits,
    typicalPrerequisites: prerequisites,
    facts
  };
}
