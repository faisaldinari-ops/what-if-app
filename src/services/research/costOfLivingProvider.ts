// src/services/research/costOfLivingProvider.ts
import { CostRange } from '../../types/research';
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface CountryLivingCosts {
  country: string;
  currency: string;
  flag: string;
  climate: 'warm' | 'temperate' | 'continental' | 'cold';
  coastal: boolean;
  languages: string[];
  majorityMuslim?: boolean;
  costOfLivingIndexVsFrance: number; // France = 100
  monthlyRent1BedCityCenter: number;
  monthlyRent1BedOutside: number;
  monthlyGroceriesSingle: number;
  monthlyUtilities: number;
  estimatedMonthlyTotalSingle: number;
  installationBudgetRealistic: number; // 1st rent + 2 mo deposit + agency + initial setup
  averageNetSalaryLocal: number;
  facts: GroundedFact[];
}

// Broad international reference benchmarks (dated 2025/2026, explicitly labeled as benchmarks)
export const LIVING_COST_DATABASE: Record<string, Omit<CountryLivingCosts, 'facts'>> = {
  maroc: {
    country: 'Maroc',
    currency: 'MAD / EUR',
    flag: '🇲🇦',
    climate: 'warm',
    coastal: true,
    languages: ['arabe', 'français', 'amazigh'],
    majorityMuslim: true,
    costOfLivingIndexVsFrance: 42,
    monthlyRent1BedCityCenter: 350,
    monthlyRent1BedOutside: 220,
    monthlyGroceriesSingle: 180,
    monthlyUtilities: 50,
    estimatedMonthlyTotalSingle: 650,
    installationBudgetRealistic: 1600,
    averageNetSalaryLocal: 450
  },
  tunisie: {
    country: 'Tunisie',
    currency: 'TND / EUR',
    flag: '🇹🇳',
    climate: 'warm',
    coastal: true,
    languages: ['arabe', 'français'],
    majorityMuslim: true,
    costOfLivingIndexVsFrance: 38,
    monthlyRent1BedCityCenter: 260,
    monthlyRent1BedOutside: 170,
    monthlyGroceriesSingle: 150,
    monthlyUtilities: 40,
    estimatedMonthlyTotalSingle: 550,
    installationBudgetRealistic: 1400,
    averageNetSalaryLocal: 350
  },
  espagne: {
    country: 'Espagne',
    currency: 'EUR',
    flag: '🇪🇸',
    climate: 'warm',
    coastal: true,
    languages: ['espagnol'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 74,
    monthlyRent1BedCityCenter: 850,
    monthlyRent1BedOutside: 650,
    monthlyGroceriesSingle: 280,
    monthlyUtilities: 110,
    estimatedMonthlyTotalSingle: 1400,
    installationBudgetRealistic: 3600,
    averageNetSalaryLocal: 1850
  },
  portugal: {
    country: 'Portugal',
    currency: 'EUR',
    flag: '🇵🇹',
    climate: 'warm',
    coastal: true,
    languages: ['portugais'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 69,
    monthlyRent1BedCityCenter: 800,
    monthlyRent1BedOutside: 580,
    monthlyGroceriesSingle: 250,
    monthlyUtilities: 100,
    estimatedMonthlyTotalSingle: 1300,
    installationBudgetRealistic: 3200,
    averageNetSalaryLocal: 1250
  },
  croatie: {
    country: 'Croatie',
    currency: 'EUR',
    flag: '🇭🇷',
    climate: 'warm',
    coastal: true,
    languages: ['croate', 'anglais', 'italien'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 68,
    monthlyRent1BedCityCenter: 620,
    monthlyRent1BedOutside: 450,
    monthlyGroceriesSingle: 260,
    monthlyUtilities: 120,
    estimatedMonthlyTotalSingle: 1200,
    installationBudgetRealistic: 2900,
    averageNetSalaryLocal: 1200
  },
  slovenie: {
    country: 'Slovénie',
    currency: 'EUR',
    flag: '🇸🇮',
    climate: 'temperate',
    coastal: true, // short Adriatic coast (Piran / Koper)
    languages: ['slovène', 'anglais'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 72,
    monthlyRent1BedCityCenter: 650,
    monthlyRent1BedOutside: 480,
    monthlyGroceriesSingle: 270,
    monthlyUtilities: 140,
    estimatedMonthlyTotalSingle: 1300,
    installationBudgetRealistic: 3100,
    averageNetSalaryLocal: 1450
  },
  roumanie: {
    country: 'Roumanie',
    currency: 'RON / EUR',
    flag: '🇷🇴',
    climate: 'continental',
    coastal: true, // Black sea coast
    languages: ['roumain', 'anglais'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 52,
    monthlyRent1BedCityCenter: 480,
    monthlyRent1BedOutside: 340,
    monthlyGroceriesSingle: 210,
    monthlyUtilities: 90,
    estimatedMonthlyTotalSingle: 900,
    installationBudgetRealistic: 2200,
    averageNetSalaryLocal: 950
  },
  belgique: {
    country: 'Belgique',
    currency: 'EUR',
    flag: '🇧🇪',
    climate: 'temperate',
    coastal: true,
    languages: ['français', 'néerlandais', 'allemand'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 104,
    monthlyRent1BedCityCenter: 880,
    monthlyRent1BedOutside: 720,
    monthlyGroceriesSingle: 330,
    monthlyUtilities: 160,
    estimatedMonthlyTotalSingle: 1750,
    installationBudgetRealistic: 4200,
    averageNetSalaryLocal: 2450
  },
  japon: {
    country: 'Japon',
    currency: 'JPY / EUR',
    flag: '🇯🇵',
    climate: 'temperate',
    coastal: true,
    languages: ['japonais'],
    majorityMuslim: false,
    costOfLivingIndexVsFrance: 70, // Weak yen effect in 2025/2026
    monthlyRent1BedCityCenter: 750,
    monthlyRent1BedOutside: 500,
    monthlyGroceriesSingle: 320,
    monthlyUtilities: 110,
    estimatedMonthlyTotalSingle: 1450,
    installationBudgetRealistic: 3800,
    averageNetSalaryLocal: 2200
  },
  emirats: {
    country: 'Émirats Arabes Unis',
    currency: 'AED / EUR',
    flag: '🇦🇪',
    climate: 'warm',
    coastal: true,
    languages: ['arabe', 'anglais'],
    majorityMuslim: true,
    costOfLivingIndexVsFrance: 108,
    monthlyRent1BedCityCenter: 1400,
    monthlyRent1BedOutside: 950,
    monthlyGroceriesSingle: 380,
    monthlyUtilities: 180,
    estimatedMonthlyTotalSingle: 2200,
    installationBudgetRealistic: 6500,
    averageNetSalaryLocal: 3200
  }
};

/**
 * Retrieves cost of living data for any country, dynamically estimating unknown ones cleanly.
 */
export function getCountryLivingCosts(countryName: string): CountryLivingCosts {
  const c = countryName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const [key, profile] of Object.entries(LIVING_COST_DATABASE)) {
    if (c.includes(key) || profile.country.toLowerCase().includes(c)) {
      const facts: GroundedFact[] = [
        createGroundedFact(
          `col_${key}_rent`,
          `Loyer moyen 1 pièce (${profile.country})`,
          `~${profile.monthlyRent1BedCityCenter} € (centre-ville) / ~${profile.monthlyRent1BedOutside} € (hors centre)`,
          'Référentiel indicatif de coût de la vie',
          undefined,
          false,
          true,
          'Estimation de référence pour une personne seule.'
        ),
        createGroundedFact(
          `col_${key}_budget_install`,
          `Budget indicatif d'installation (${profile.country})`,
          `~${profile.installationBudgetRealistic} € (caution + 1er mois + démarches + imprévus)`,
          'Estimation calculée par WHAT IF? (règle 3 mois)',
          undefined,
          false,
          false,
          'Niveau d’apport liquide prudent avant arrivée.'
        )
      ];

      return {
        ...profile,
        facts
      };
    }
  }

  // Fallback for an unlisted country: deterministic, safe, transparent estimate
  const facts: GroundedFact[] = [
    createGroundedFact(
      `col_unknown_${c}`,
      `Coût de la vie estimé (${countryName})`,
      'Estimation par ordre de grandeur moyen',
      undefined,
      undefined,
      false,
      false,
      'Données non chargées en mémoire directe ; une recherche en direct est conseillée.'
    )
  ];

  return {
    country: countryName,
    currency: 'EUR',
    flag: '🌐',
    climate: 'temperate',
    coastal: false,
    languages: ['anglais'],
    costOfLivingIndexVsFrance: 80,
    monthlyRent1BedCityCenter: 700,
    monthlyRent1BedOutside: 500,
    monthlyGroceriesSingle: 250,
    monthlyUtilities: 100,
    estimatedMonthlyTotalSingle: 1300,
    installationBudgetRealistic: 3200,
    averageNetSalaryLocal: 1500,
    facts
  };
}
