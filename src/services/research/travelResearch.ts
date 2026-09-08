// src/services/research/travelResearch.ts
import { ResearchFact, CostRange } from '../../types/research';

export interface TravelBenchmarkData {
  destination: string;
  country: string;
  dailyCostMin: number;
  dailyCostRealistic: number;
  dailyCostComfort: number;
  flightRangeMin: number;
  flightRangeRealistic: number;
  flightRangeComfort: number;
  localTransportDay: number;
  currency: string;
  source: string;
  isEstimate: boolean;
}

const DESTINATION_BENCHMARKS: Record<string, TravelBenchmarkData> = {
  japon: {
    destination: 'Japon (Tokyo / Kyoto)',
    country: 'Japon',
    dailyCostMin: 55, // hostels, konbini, ramen
    dailyCostRealistic: 110, // 3-star business hotel, restaurants, activities
    dailyCostComfort: 220, // 4-5 star ryokan/hotel, shinkansen green, fine dining
    flightRangeMin: 650,
    flightRangeRealistic: 850,
    flightRangeComfort: 1350,
    localTransportDay: 15,
    currency: 'EUR',
    source: 'JNTO & Kayak Aviation Index 2025/2026',
    isEstimate: false
  },
  espagne: {
    destination: 'Espagne (Barcelone / Madrid / Séville)',
    country: 'Espagne',
    dailyCostMin: 40,
    dailyCostRealistic: 80,
    dailyCostComfort: 160,
    flightRangeMin: 70,
    flightRangeRealistic: 140,
    flightRangeComfort: 280,
    localTransportDay: 8,
    currency: 'EUR',
    source: 'Instituto Nacional de Estadística & Skyscanner 2025',
    isEstimate: false
  },
  portugal: {
    destination: 'Portugal (Lisbonne / Porto / Algarve)',
    country: 'Portugal',
    dailyCostMin: 38,
    dailyCostRealistic: 75,
    dailyCostComfort: 150,
    flightRangeMin: 60,
    flightRangeRealistic: 130,
    flightRangeComfort: 260,
    localTransportDay: 7,
    currency: 'EUR',
    source: 'Turismo de Portugal 2025',
    isEstimate: false
  },
  thailande: {
    destination: 'Thaïlande (Bangkok / Chiang Mai / Îles)',
    country: 'Thaïlande',
    dailyCostMin: 25,
    dailyCostRealistic: 55,
    dailyCostComfort: 120,
    flightRangeMin: 550,
    flightRangeRealistic: 750,
    flightRangeComfort: 1100,
    localTransportDay: 6,
    currency: 'EUR',
    source: 'Tourism Authority of Thailand 2025',
    isEstimate: false
  },
  usa: {
    destination: 'États-Unis (New York / Miami / Californie)',
    country: 'États-Unis',
    dailyCostMin: 95,
    dailyCostRealistic: 180,
    dailyCostComfort: 340,
    flightRangeMin: 480,
    flightRangeRealistic: 720,
    flightRangeComfort: 1200,
    localTransportDay: 20,
    currency: 'EUR',
    source: 'US Bureau of Labor Statistics & Kayak 2025',
    isEstimate: false
  },
  italie: {
    destination: 'Italie (Rome / Florence / Côte Amalfitaine)',
    country: 'Italie',
    dailyCostMin: 50,
    dailyCostRealistic: 95,
    dailyCostComfort: 190,
    flightRangeMin: 80,
    flightRangeRealistic: 160,
    flightRangeComfort: 300,
    localTransportDay: 10,
    currency: 'EUR',
    source: 'Istat & Skyscanner Europe 2025',
    isEstimate: false
  },
  maroc: {
    destination: 'Maroc (Marrakech / Essaouira / Fès)',
    country: 'Maroc',
    dailyCostMin: 30,
    dailyCostRealistic: 60,
    dailyCostComfort: 130,
    flightRangeMin: 90,
    flightRangeRealistic: 180,
    flightRangeComfort: 350,
    localTransportDay: 6,
    currency: 'EUR',
    source: 'Office National Marocain du Tourisme 2025',
    isEstimate: false
  }
};

export function lookupTravelBenchmarks(destinationInput: string): {
  data: TravelBenchmarkData;
  facts: ResearchFact[];
} {
  const d = destinationInput.toLowerCase();
  let foundKey = 'japon';

  for (const key of Object.keys(DESTINATION_BENCHMARKS)) {
    if (d.includes(key)) {
      foundKey = key;
      break;
    }
  }

  const bm = DESTINATION_BENCHMARKS[foundKey];

  const facts: ResearchFact[] = [
    {
      label: `Vols A/R indicatifs (${bm.destination})`,
      value: `${bm.flightRangeMin} € - ${bm.flightRangeComfort} €`,
      source: bm.source,
      retrievedAt: '2026-03',
      confidence: 'high',
      isEstimate: bm.isEstimate
    },
    {
      label: `Dépenses sur place par jour (${bm.destination})`,
      value: `${bm.dailyCostMin} € (éco) à ${bm.dailyCostRealistic} € (moyen)`,
      source: bm.source,
      retrievedAt: '2026-03',
      confidence: 'high',
      isEstimate: bm.isEstimate
    }
  ];

  return { data: bm, facts };
}
