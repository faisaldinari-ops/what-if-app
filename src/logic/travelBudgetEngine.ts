// src/logic/travelBudgetEngine.ts
import { TravelBreakdown } from '../types/planning';
import { lookupTravelBenchmarks } from '../services/research/travelResearch';

export function calculateTravelBudget(
  destination: string,
  durationDays: number = 10,
  availableBudget: number = 0,
  monthlySavingsCapacity: number = 250,
  currency: string = 'EUR'
): TravelBreakdown {
  const { data: bm } = lookupTravelBenchmarks(destination);
  const days = Math.max(3, durationDays);

  // Flight ranges
  const flightMin = bm.flightRangeMin;
  const flightRealistic = bm.flightRangeRealistic;
  const flightComfort = bm.flightRangeComfort;

  // Local transport
  const transitMin = Math.round(bm.localTransportDay * 0.7 * days);
  const transitRealistic = Math.round(bm.localTransportDay * days);
  const transitComfort = Math.round(bm.localTransportDay * 2.5 * days); // Taxi / bullet train express

  // Accommodation & Food calculated per day
  const lodgingMin = Math.round(bm.dailyCostMin * 0.55 * days);
  const lodgingRealistic = Math.round(bm.dailyCostRealistic * 0.55 * days);
  const lodgingComfort = Math.round(bm.dailyCostComfort * 0.55 * days);

  const foodMin = Math.round(bm.dailyCostMin * 0.35 * days);
  const foodRealistic = Math.round(bm.dailyCostRealistic * 0.35 * days);
  const foodComfort = Math.round(bm.dailyCostComfort * 0.35 * days);

  // Activities
  const activitiesMin = Math.round(bm.dailyCostMin * 0.1 * days);
  const activitiesRealistic = Math.round(bm.dailyCostRealistic * 0.1 * days);
  const activitiesComfort = Math.round(bm.dailyCostComfort * 0.1 * days);

  // Insurance & formalities
  const insMin = 35;
  const insRealistic = 65;
  const insComfort = 120;

  // Safety buffer (10% to 15%)
  const subtotalMin = flightMin + transitMin + lodgingMin + foodMin + activitiesMin + insMin;
  const subtotalRealistic = flightRealistic + transitRealistic + lodgingRealistic + foodRealistic + activitiesRealistic + insRealistic;
  const subtotalComfort = flightComfort + transitComfort + lodgingComfort + foodComfort + activitiesComfort + insComfort;

  const safetyMin = Math.round(subtotalMin * 0.08);
  const safetyRealistic = Math.round(subtotalRealistic * 0.12);
  const safetyComfort = Math.round(subtotalComfort * 0.15);

  const totalMin = subtotalMin + safetyMin;
  const totalRealistic = subtotalRealistic + safetyRealistic;
  const totalComfort = subtotalComfort + safetyComfort;

  const distanceToRealistic = totalRealistic - availableBudget;
  let monthsToSave: { monthlySavings: number; monthsNeeded: number } | undefined = undefined;

  if (distanceToRealistic > 0) {
    const monthly = monthlySavingsCapacity > 0 ? monthlySavingsCapacity : 200;
    const months = Math.ceil(distanceToRealistic / monthly);
    monthsToSave = {
      monthlySavings: monthly,
      monthsNeeded: months
    };
  }

  return {
    flights: { min: flightMin, realistic: flightRealistic, comfortable: flightComfort, currency, confidence: 'high' },
    localTransport: { min: transitMin, realistic: transitRealistic, comfortable: transitComfort, currency, confidence: 'high' },
    accommodation: { min: lodgingMin, realistic: lodgingRealistic, comfortable: lodgingComfort, currency, confidence: 'high' },
    food: { min: foodMin, realistic: foodRealistic, comfortable: foodComfort, currency, confidence: 'high' },
    activities: { min: activitiesMin, realistic: activitiesRealistic, comfortable: activitiesComfort, currency, confidence: 'medium' },
    insuranceAndFormalities: { min: insMin, realistic: insRealistic, comfortable: insComfort, currency, confidence: 'high' },
    safetyBuffer: { min: safetyMin, realistic: safetyRealistic, comfortable: safetyComfort, currency, confidence: 'high' },
    totalRange: { min: totalMin, realistic: totalRealistic, comfortable: totalComfort, currency, confidence: 'high' },
    durationDays: days,
    destination: bm.destination,
    distanceToRealistic,
    monthsToSaveIfSaving: monthsToSave
  };
}
