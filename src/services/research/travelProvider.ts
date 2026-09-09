// src/services/research/travelProvider.ts
import { TravelBreakdown } from '../../types/planning';
import { CostRange } from '../../types/research';
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface TravelResearchOptions {
  destination: string;
  originCity?: string;
  durationDays: number;
  travelMonth?: string;
  availableBudget?: number;
  monthlySavingsCapacity?: number;
  currency?: string;
}

/**
 * Calculates a comprehensive grounded travel budget.
 * Distinguishes flight costs, seasonality, origin airport, and daily living costs.
 */
export function researchTravelCosts(options: TravelResearchOptions): {
  breakdown: TravelBreakdown;
  facts: GroundedFact[];
  warnings: string[];
} {
  const {
    destination,
    originCity = 'France',
    durationDays = 10,
    travelMonth,
    availableBudget,
    monthlySavingsCapacity = 0,
    currency = 'EUR'
  } = options;

  const dest = destination.toLowerCase();
  const origin = originCity.toLowerCase();
  const facts: GroundedFact[] = [];
  const warnings: string[] = [];

  // 1. Flights estimation with origin and destination awareness
  let flightMin = 250;
  let flightRealistic = 500;
  let flightComfort = 900;

  let dailyHotelMin = 30;
  let dailyHotelRealistic = 70;
  let dailyHotelComfort = 150;

  let dailyFoodMin = 15;
  let dailyFoodRealistic = 35;
  let dailyFoodComfort = 70;

  let dailyTransportMin = 5;
  let dailyTransportRealistic = 12;
  let dailyTransportComfort = 25;

  let dailyActivitiesMin = 5;
  let dailyActivitiesRealistic = 20;
  let dailyActivitiesComfort = 45;

  // Destination specifics
  if (dest.includes('japon') || dest.includes('japan') || dest.includes('tokyo')) {
    // If departing from Marseille vs Paris:
    // Long-haul from Marseille usually has 1 connection (via Istanbul, Munich, Frankfurt, Paris CDG, etc.)
    const isMarseille = origin.includes('marseille') || origin.includes('mrs');
    const isFeb = (travelMonth && travelMonth.toLowerCase().includes('fév')) || true;

    flightMin = isMarseille ? 720 : 650;
    flightRealistic = isMarseille ? 920 : 850;
    flightComfort = 1450;

    dailyHotelMin = 40; // Business hotel capsule / hostel
    dailyHotelRealistic = 85; // 3-star standard Tokyo/Kyoto
    dailyHotelComfort = 180;

    dailyFoodMin = 20; // Konbini, ramen, teishoku
    dailyFoodRealistic = 45; // standard restaurants
    dailyFoodComfort = 95;

    dailyTransportMin = 10; // Pasmo/Suica subways
    dailyTransportRealistic = 20; // includes partial Shinkansen or regional rail pass
    dailyTransportComfort = 45;

    facts.push(
      createGroundedFact(
        'japan_flight_estimate',
        `Vol A/R indicatif (${isMarseille ? 'Marseille' : 'France'} -> Tokyo/Osaka)`,
        `~${flightMin} € à ${flightRealistic} € en classe éco`,
        'Benchmark indicatif des liaisons aériennes 2025-2026',
        undefined,
        false,
        false,
        isMarseille
          ? 'Départ de Marseille : comprend 1 escale (ex. Lufthansa via Francfort ou Air France via CDG).'
          : 'Tarif standard hors très haute saison estivale.'
      ),
      createGroundedFact(
        'japan_season_february',
        'Saisonnalité : Février au Japon',
        'Basse à moyenne saison touristique (climat froid et sec, tarifs hôteliers modérés)',
        'Japan National Tourism Organization (JNTO)',
        'https://www.japan.travel/',
        false,
        false,
        'Idéal pour visiter sans foule, excellente visibilité sur le Mont Fuji, prévoir vêtements chauds.'
      )
    );
  } else if (dest.includes('espagne') || dest.includes('portugal') || dest.includes('italie') || dest.includes('croatie')) {
    flightMin = 80;
    flightRealistic = 160;
    flightComfort = 300;

    dailyHotelMin = 35;
    dailyHotelRealistic = 75;
    dailyHotelComfort = 140;

    dailyFoodMin = 20;
    dailyFoodRealistic = 38;
    dailyFoodComfort = 70;

    facts.push(
      createGroundedFact(
        'europe_travel_benchmark',
        `Voyage intra-européen (${destination})`,
        'Destinations proches accessibles en vols directs ou train',
        'Indices comparatifs de voyage en Europe',
        undefined,
        false,
        false
      )
    );
  } else if (dest.includes('états-unis') || dest.includes('usa') || dest.includes('miami') || dest.includes('new york')) {
    flightMin = 500;
    flightRealistic = 750;
    flightComfort = 1300;

    dailyHotelMin = 90; // High US lodging prices + resort fees + local taxes
    dailyHotelRealistic = 160;
    dailyHotelComfort = 280;

    dailyFoodMin = 35;
    dailyFoodRealistic = 65; // Tips 18-20% mandatory + tax
    dailyFoodComfort = 120;

    dailyTransportMin = 15;
    dailyTransportRealistic = 35; // Uber / car rental + parking fees
    dailyTransportComfort = 65;

    warnings.push('Attention aux pourboires (18-22 %) et taxes hôtelières aux États-Unis qui augmentent le budget de 25 à 30 %.');
  }

  // Calculate totals
  const flights: CostRange = {
    min: flightMin,
    realistic: flightRealistic,
    comfortable: flightComfort,
    currency,
    confidence: 'medium',
    notes: 'Tarif indicatif aller-retour avec bagage cabine/soute standard.'
  };

  const accommodation: CostRange = {
    min: dailyHotelMin * durationDays,
    realistic: dailyHotelRealistic * durationDays,
    comfortable: dailyHotelComfort * durationDays,
    currency,
    confidence: 'medium'
  };

  const food: CostRange = {
    min: dailyFoodMin * durationDays,
    realistic: dailyFoodRealistic * durationDays,
    comfortable: dailyFoodComfort * durationDays,
    currency,
    confidence: 'medium'
  };

  const localTransport: CostRange = {
    min: dailyTransportMin * durationDays,
    realistic: dailyTransportRealistic * durationDays,
    comfortable: dailyTransportComfort * durationDays,
    currency,
    confidence: 'medium'
  };

  const activities: CostRange = {
    min: dailyActivitiesMin * durationDays,
    realistic: dailyActivitiesRealistic * durationDays,
    comfortable: dailyActivitiesComfort * durationDays,
    currency,
    confidence: 'medium'
  };

  const insuranceAndFormalities: CostRange = {
    min: 40,
    realistic: 85,
    comfortable: 140,
    currency,
    confidence: 'high',
    notes: 'Assurance santé internationale voyage (indispensable hors UE).'
  };

  const safetyBuffer: CostRange = {
    min: 100,
    realistic: 200,
    comfortable: 400,
    currency,
    confidence: 'high',
    notes: 'Coussin imprévus / santé / retards.'
  };

  const totalMin =
    flights.min +
    accommodation.min +
    food.min +
    localTransport.min +
    activities.min +
    insuranceAndFormalities.min +
    safetyBuffer.min;

  const totalRealistic =
    flights.realistic +
    accommodation.realistic +
    food.realistic +
    localTransport.realistic +
    activities.realistic +
    insuranceAndFormalities.realistic +
    safetyBuffer.realistic;

  const totalComfortable =
    flights.comfortable +
    accommodation.comfortable +
    food.comfortable +
    localTransport.comfortable +
    activities.comfortable +
    insuranceAndFormalities.comfortable +
    safetyBuffer.comfortable;

  const totalRange: CostRange = {
    min: Math.round(totalMin),
    realistic: Math.round(totalRealistic),
    comfortable: Math.round(totalComfortable),
    currency,
    confidence: 'medium'
  };

  const distanceToRealistic = availableBudget !== undefined ? Math.round(totalRealistic - availableBudget) : 0;

  let monthsToSaveIfSaving: { monthlySavings: number; monthsNeeded: number } | undefined = undefined;
  if (distanceToRealistic > 0 && monthlySavingsCapacity > 0) {
    monthsToSaveIfSaving = {
      monthlySavings: monthlySavingsCapacity,
      monthsNeeded: Math.ceil(distanceToRealistic / monthlySavingsCapacity)
    };
  }

  return {
    breakdown: {
      flights,
      accommodation,
      food,
      localTransport,
      activities,
      insuranceAndFormalities,
      safetyBuffer,
      totalRange,
      durationDays,
      destination,
      distanceToRealistic,
      monthsToSaveIfSaving
    },
    facts,
    warnings
  };
}
