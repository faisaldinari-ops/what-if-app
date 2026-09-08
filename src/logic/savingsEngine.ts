// src/logic/savingsEngine.ts

export interface SavingsProjection {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyCapacity: number; // income - expenses
  targetAmount: number;
  currentSavings: number;
  gap: number; // target - current (0 if already reached)
  monthsNeeded: number; // gap / monthlyCapacity
  isAchievable: boolean;
  savingsRates: {
    prudent: { monthly: number; months: number };
    realistic: { monthly: number; months: number };
    accelerated: { monthly: number; months: number };
  };
}

export function calculateSavingsPath(
  currentSavings: number,
  targetAmount: number,
  monthlyIncome: number,
  monthlyExpenses: number
): SavingsProjection {
  const capacity = Math.max(0, monthlyIncome - monthlyExpenses);
  const gap = Math.max(0, targetAmount - currentSavings);

  let monthsNeeded = 0;
  if (gap === 0) {
    monthsNeeded = 0;
  } else if (capacity > 0) {
    monthsNeeded = Math.ceil(gap / capacity);
  } else {
    monthsNeeded = 999; // Insolvent without cutting expenses
  }

  const prudentMonthly = Math.round(capacity * 0.7);
  const realisticMonthly = capacity;
  const acceleratedMonthly = Math.round(capacity * 1.25);

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyCapacity: capacity,
    targetAmount,
    currentSavings,
    gap,
    monthsNeeded: Math.min(monthsNeeded, 120),
    isAchievable: capacity > 0 && monthsNeeded <= 60,
    savingsRates: {
      prudent: {
        monthly: prudentMonthly,
        months: prudentMonthly > 0 ? Math.ceil(gap / prudentMonthly) : 999
      },
      realistic: {
        monthly: realisticMonthly,
        months: realisticMonthly > 0 ? Math.ceil(gap / realisticMonthly) : 999
      },
      accelerated: {
        monthly: acceleratedMonthly,
        months: acceleratedMonthly > 0 ? Math.ceil(gap / acceleratedMonthly) : 999
      }
    }
  };
}
