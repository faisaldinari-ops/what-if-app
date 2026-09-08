// src/services/research/relocationResearch.ts
import { DestinationShortlistOption } from '../../types/planning';
import { ResearchFact } from '../../types/research';

export interface RelocationCountryProfile {
  id: string;
  country: string;
  flag: string;
  capitalCity: string;
  popularCities: string[];
  climateType: 'warm' | 'temperate' | 'continental';
  costOfLivingIndex: number; // vs France (100)
  installationBudgetMin: number;
  installationBudgetRealistic: number;
  installationBudgetComfort: number;
  monthlyRentAverage1Bed: number;
  monthlyCostOfLivingSingle: number;
  indicativeGrossSalaryAverage: number;
  potentialJobs: string[];
  constraints: string[];
  languageRequired: string;
  difficultyLevel: 'Facile' | 'Modéré' | 'Exigeant';
  visaStatusEuCitizens: string;
  source: string;
}

export const RELOCATION_PROFILES: RelocationCountryProfile[] = [
  {
    id: 'espagne',
    country: 'Espagne',
    flag: '🇪🇸',
    capitalCity: 'Madrid',
    popularCities: ['Valence', 'Barcelone', 'Malaga', 'Alicante'],
    climateType: 'warm',
    costOfLivingIndex: 72,
    installationBudgetMin: 2200,
    installationBudgetRealistic: 3800,
    installationBudgetComfort: 6500,
    monthlyRentAverage1Bed: 750,
    monthlyCostOfLivingSingle: 1350,
    indicativeGrossSalaryAverage: 1850,
    potentialJobs: ['Tourisme & Hôtellerie', 'Tech / Remote', 'Enseignement de langues', 'Service client multilingue'],
    constraints: ['NIF / NIE obligatoire', 'Marché du travail local sélectif hors tech/tourisme'],
    languageRequired: 'Espagnol (bases recommandées, anglais dans les pôles tech)',
    difficultyLevel: 'Facile',
    visaStatusEuCitizens: 'Libre circulation UE (Enregistrement NIE résident sous 3 mois)',
    source: 'INE Espagne & Eurostat 2025'
  },
  {
    id: 'portugal',
    country: 'Portugal',
    flag: '🇵🇹',
    capitalCity: 'Lisbonne',
    popularCities: ['Porto', 'Braga', 'Faro / Algarve'],
    climateType: 'warm',
    costOfLivingIndex: 68,
    installationBudgetMin: 2000,
    installationBudgetRealistic: 3500,
    installationBudgetComfort: 5800,
    monthlyRentAverage1Bed: 700,
    monthlyCostOfLivingSingle: 1250,
    indicativeGrossSalaryAverage: 1550,
    potentialJobs: ['Centres de relation client européens', 'Développement web & Freelance', 'Tourisme'],
    constraints: ['Loyers en hausse à Lisbonne/Porto', 'Salaires locaux modestes'],
    languageRequired: 'Portugais (Anglais très répandu)',
    difficultyLevel: 'Facile',
    visaStatusEuCitizens: 'Libre circulation UE (Certificado de Registo de Cidadão da UE)',
    source: 'Instituto Nacional de Estatística Portugal 2025'
  },
  {
    id: 'malte',
    country: 'Malte',
    flag: '🇲🇹',
    capitalCity: 'La Valette',
    popularCities: ['Sliema', 'St Julian’s', 'Gzira'],
    climateType: 'warm',
    costOfLivingIndex: 82,
    installationBudgetMin: 2600,
    installationBudgetRealistic: 4400,
    installationBudgetComfort: 7200,
    monthlyRentAverage1Bed: 850,
    monthlyCostOfLivingSingle: 1500,
    indicativeGrossSalaryAverage: 2200,
    potentialJobs: ['iGaming & Fintech', 'Services financiers', 'Hôtellerie', 'Conformité & Support client'],
    constraints: ['Densité urbaine élevée', 'Transports publics limités'],
    languageRequired: 'Anglais (langue officielle avec le maltais)',
    difficultyLevel: 'Facile',
    visaStatusEuCitizens: 'Libre circulation UE',
    source: 'National Statistics Office Malta 2025'
  },
  {
    id: 'thailande',
    country: 'Thaïlande',
    flag: '🇹🇭',
    capitalCity: 'Bangkok',
    popularCities: ['Chiang Mai', 'Phuket', 'Koh Samui'],
    climateType: 'warm',
    costOfLivingIndex: 44,
    installationBudgetMin: 1800,
    installationBudgetRealistic: 3200,
    installationBudgetComfort: 5500,
    monthlyRentAverage1Bed: 380,
    monthlyCostOfLivingSingle: 850,
    indicativeGrossSalaryAverage: 950,
    potentialJobs: ['Nomadisme digital', 'Enseignement anglais/français', 'Hôtellerie internationale'],
    constraints: ['Visa strict (LTR, DTV Destination Thailand Visa ou Non-B)', 'Métiers réservés aux locaux'],
    languageRequired: 'Thaï (Anglais suffisant dans les pôles d’expatriés)',
    difficultyLevel: 'Modéré',
    visaStatusEuCitizens: 'Visa obligatoire pour séjours > 60 jours',
    source: 'Thai Immigration Bureau & Numbeo Benchmark 2025'
  },
  {
    id: 'usa_miami',
    country: 'États-Unis (Miami / Floride)',
    flag: '🇺🇸',
    capitalCity: 'Washington D.C. (Miami)',
    popularCities: ['Miami', 'Fort Lauderdale', 'Orlando'],
    climateType: 'warm',
    costOfLivingIndex: 145,
    installationBudgetMin: 8000,
    installationBudgetRealistic: 15000,
    installationBudgetComfort: 25000,
    monthlyRentAverage1Bed: 2100,
    monthlyCostOfLivingSingle: 3400,
    indicativeGrossSalaryAverage: 4500,
    potentialJobs: ['Commerce international', 'Tech & Crypto', 'Restauration haut de gamme', 'Immobilier'],
    constraints: ['Visas très contraignants (H-1B, L-1, E-2 investisseur)', 'Assurance santé obligatoire et coûteuse'],
    languageRequired: 'Anglais & Espagnol (bilinguisme très valorisé à Miami)',
    difficultyLevel: 'Exigeant',
    visaStatusEuCitizens: 'Visa de travail ou d’investissement OBLIGATOIRE (ESTA interdit de travailler)',
    source: 'US Bureau of Labor Statistics & US Immigration Service 2025'
  },
  {
    id: 'canada',
    country: 'Canada (Montréal / Québec)',
    flag: '🇨🇦',
    capitalCity: 'Ottawa (Montréal)',
    popularCities: ['Montréal', 'Québec', 'Toronto'],
    climateType: 'continental',
    costOfLivingIndex: 96,
    installationBudgetMin: 4500,
    installationBudgetRealistic: 7500,
    installationBudgetComfort: 12000,
    monthlyRentAverage1Bed: 1100,
    monthlyCostOfLivingSingle: 1950,
    indicativeGrossSalaryAverage: 3200,
    potentialJobs: ['Jeux vidéo & Tech', 'BTP & Métiers manuels qualifiés', 'Santé', 'Services'],
    constraints: ['Permis de travail ou PVT obligatoire', 'Hivers rigoureux'],
    languageRequired: 'Français (Québec) ou Anglais',
    difficultyLevel: 'Modéré',
    visaStatusEuCitizens: 'Permis vacances-travail (PVT) ou Entrée Express',
    source: 'Statistique Canada & Immigration Québec 2025'
  }
];

export function buildRelocationShortlist(
  budgetAvailable: number = 0,
  preferences?: { climate?: string[]; priority?: string }
): {
  shortlist: DestinationShortlistOption[];
  facts: ResearchFact[];
} {
  // Select 3 top options: Easiest, Best Cost/Opportunity, and Ambitious
  const pSpain = RELOCATION_PROFILES.find(p => p.id === 'espagne')!;
  const pPortugal = RELOCATION_PROFILES.find(p => p.id === 'portugal')!;
  const pMalta = RELOCATION_PROFILES.find(p => p.id === 'malte')!;
  const pUSA = RELOCATION_PROFILES.find(p => p.id === 'usa_miami')!;

  const shortlist: DestinationShortlistOption[] = [
    {
      id: pSpain.id,
      country: pSpain.country,
      city: 'Valence ou Séville',
      flag: pSpain.flag,
      compatibilityScore: budgetAvailable >= pSpain.installationBudgetMin ? 88 : 72,
      matchReason: 'Cadre de vie exceptionnel, proximité géographique et démarches administratives simples pour ressortissants européens.',
      installationBudgetRange: {
        min: pSpain.installationBudgetMin,
        realistic: pSpain.installationBudgetRealistic,
        comfortable: pSpain.installationBudgetComfort,
        currency: 'EUR',
        confidence: 'high'
      },
      monthlyRentIndicative: pSpain.monthlyRentAverage1Bed,
      monthlyCostOfLivingIndicative: pSpain.monthlyCostOfLivingSingle,
      indicativeSalary: pSpain.indicativeGrossSalaryAverage,
      potentialJobs: pSpain.potentialJobs,
      constraints: pSpain.constraints,
      languageRequired: pSpain.languageRequired,
      difficultyLevel: pSpain.difficultyLevel,
      badge: 'Option la plus facile'
    },
    {
      id: pPortugal.id,
      country: pPortugal.country,
      city: 'Porto ou Braga',
      flag: pPortugal.flag,
      compatibilityScore: budgetAvailable >= pPortugal.installationBudgetMin ? 85 : 68,
      matchReason: 'Coût de la vie parmi les plus bas d’Europe occidentale, communauté internationale accueillante et sécurité élevée.',
      installationBudgetRange: {
        min: pPortugal.installationBudgetMin,
        realistic: pPortugal.installationBudgetRealistic,
        comfortable: pPortugal.installationBudgetComfort,
        currency: 'EUR',
        confidence: 'high'
      },
      monthlyRentIndicative: pPortugal.monthlyRentAverage1Bed,
      monthlyCostOfLivingIndicative: pPortugal.monthlyCostOfLivingSingle,
      indicativeSalary: pPortugal.indicativeGrossSalaryAverage,
      potentialJobs: pPortugal.potentialJobs,
      constraints: pPortugal.constraints,
      languageRequired: pPortugal.languageRequired,
      difficultyLevel: pPortugal.difficultyLevel,
      badge: 'Meilleur rapport coût / opportunités'
    },
    {
      id: pMalta.id,
      country: pMalta.country,
      city: 'Sliema',
      flag: pMalta.flag,
      compatibilityScore: budgetAvailable >= pMalta.installationBudgetMin ? 79 : 62,
      matchReason: 'Anglophone, hub dynamique pour la tech et la finance, climat méditerranéen ensoleillé toute l’année.',
      installationBudgetRange: {
        min: pMalta.installationBudgetMin,
        realistic: pMalta.installationBudgetRealistic,
        comfortable: pMalta.installationBudgetComfort,
        currency: 'EUR',
        confidence: 'high'
      },
      monthlyRentIndicative: pMalta.monthlyRentAverage1Bed,
      monthlyCostOfLivingIndicative: pMalta.monthlyCostOfLivingSingle,
      indicativeSalary: pMalta.indicativeGrossSalaryAverage,
      potentialJobs: pMalta.potentialJobs,
      constraints: pMalta.constraints,
      languageRequired: pMalta.languageRequired,
      difficultyLevel: pMalta.difficultyLevel,
      badge: 'Option anglophone'
    }
  ];

  const facts: ResearchFact[] = [
    {
      label: 'Droit de séjour UE (Espagne / Portugal)',
      value: 'Aucun visa requis pour les citoyens de l’Union Européenne',
      source: 'Commission Européenne - Directive 2004/38/CE',
      retrievedAt: '2026-01',
      confidence: 'high',
      isEstimate: false
    },
    {
      label: 'Budget moyen d’installation (caution + 2 mois de loyer)',
      value: 'Entre 2 500 € et 4 000 € selon la ville cible',
      source: 'Fédération Européenne de l’Immobilier 2025',
      retrievedAt: '2026-01',
      confidence: 'medium',
      isEstimate: true
    }
  ];

  return { shortlist, facts };
}
