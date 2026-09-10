// src/core/validators/NumericConsistencyValidator.ts

export interface NumericConsistencyInputs {
  availableBudget?: number | 'UNKNOWN';
  startupCostNeeded?: number | 'UNKNOWN';
  safetyBufferNeeded?: number | 'UNKNOWN';
  totalBudgetNeeded?: number | 'UNKNOWN';
  monthlyIncome?: number | 'UNKNOWN';
  monthlyExpenses?: number | 'UNKNOWN';
  monthlySavingsCapacity?: number | 'UNKNOWN';
}

export interface ConsistentFinancialMetrics {
  availableBudget: number;
  hasKnownBudget: boolean;
  
  startupCost: number;
  hasKnownStartupCost: boolean;

  safetyBuffer: number;
  totalBudgetNeeded: number;

  fundingGap: number; // strictly Math.max(0, totalBudgetNeeded - availableBudget)
  surplus: number;    // strictly Math.max(0, availableBudget - totalBudgetNeeded)

  isFunded: boolean; // true if availableBudget >= totalBudgetNeeded
  isLeanFunded: boolean; // true if availableBudget >= startupCost (even if safety buffer is partial)

  monthlyMargin?: number; // ONLY defined if both income and expenses are KNOWN numbers
  hasKnownCashflow: boolean;

  monthsToSaveGap?: number; // ONLY defined if gap > 0 and monthlySavingsCapacity > 0
}

export class NumericConsistencyValidator {
  /**
   * Enforces mathematical invariants across all financial metrics.
   * Eliminates the possibility of:
   * - gap > 0 and surplus > 0 at the same time
   * - negative gap displayed as shortfall
   * - calling a project underfunded when available >= required
   * - computing fake monthly margin or savings timeline from UNKNOWN inputs
   */
  static computeConsistentMetrics(inputs: NumericConsistencyInputs): ConsistentFinancialMetrics {
    const hasKnownBudget = typeof inputs.availableBudget === 'number' && !isNaN(inputs.availableBudget);
    const available = hasKnownBudget ? (inputs.availableBudget as number) : 0;

    const hasKnownStartup = typeof inputs.startupCostNeeded === 'number' && !isNaN(inputs.startupCostNeeded);
    const startupCost = hasKnownStartup ? (inputs.startupCostNeeded as number) : 0;

    const safetyBuffer =
      typeof inputs.safetyBufferNeeded === 'number' && !isNaN(inputs.safetyBufferNeeded)
        ? inputs.safetyBufferNeeded
        : 0;

    const totalNeeded =
      typeof inputs.totalBudgetNeeded === 'number' && !isNaN(inputs.totalBudgetNeeded)
        ? inputs.totalBudgetNeeded
        : startupCost + safetyBuffer;

    // Strict Invariants:
    // gap is ONLY the missing money to reach totalNeeded. Never negative.
    // surplus is ONLY the excess money beyond totalNeeded. Never negative.
    let fundingGap = 0;
    let surplus = 0;

    if (hasKnownBudget) {
      if (available >= totalNeeded) {
        surplus = available - totalNeeded;
        fundingGap = 0;
      } else {
        fundingGap = totalNeeded - available;
        surplus = 0;
      }
    } else {
      // Budget not provided yet
      fundingGap = totalNeeded;
      surplus = 0;
    }

    // Cashflow Invariant
    const hasIncome = typeof inputs.monthlyIncome === 'number' && !isNaN(inputs.monthlyIncome);
    const hasExpenses = typeof inputs.monthlyExpenses === 'number' && !isNaN(inputs.monthlyExpenses);
    const hasKnownCashflow = hasIncome && hasExpenses;

    let monthlyMargin: number | undefined = undefined;
    if (hasKnownCashflow) {
      monthlyMargin = (inputs.monthlyIncome as number) - (inputs.monthlyExpenses as number);
    }

    // Timeline invariant: only compute if gap > 0 AND savings capacity is verified > 0
    let monthsToSaveGap: number | undefined = undefined;
    const hasSavings =
      typeof inputs.monthlySavingsCapacity === 'number' &&
      !isNaN(inputs.monthlySavingsCapacity) &&
      inputs.monthlySavingsCapacity > 0;

    if (fundingGap > 0 && hasSavings) {
      monthsToSaveGap = Math.ceil(fundingGap / (inputs.monthlySavingsCapacity as number));
    } else if (fundingGap > 0 && hasKnownCashflow && monthlyMargin && monthlyMargin > 50) {
      monthsToSaveGap = Math.ceil(fundingGap / monthlyMargin);
    }

    return {
      availableBudget: available,
      hasKnownBudget,
      startupCost,
      hasKnownStartupCost: hasKnownStartup,
      safetyBuffer,
      totalBudgetNeeded: totalNeeded,
      fundingGap,
      surplus,
      isFunded: hasKnownBudget && available >= totalNeeded,
      isLeanFunded: hasKnownBudget && available >= startupCost,
      monthlyMargin,
      hasKnownCashflow,
      monthsToSaveGap
    };
  }

  /**
   * Validates consistency and throws an error if any invariant is broken.
   */
  static assertConsistency(metrics: ConsistentFinancialMetrics): void {
    if (metrics.fundingGap < 0) {
      throw new Error(`Invariant broken: fundingGap cannot be negative (${metrics.fundingGap})`);
    }
    if (metrics.surplus < 0) {
      throw new Error(`Invariant broken: surplus cannot be negative (${metrics.surplus})`);
    }
    if (metrics.fundingGap > 0 && metrics.surplus > 0) {
      throw new Error(
        `Invariant broken: fundingGap (${metrics.fundingGap}) and surplus (${metrics.surplus}) cannot both be > 0`
      );
    }
    if (metrics.isFunded && metrics.fundingGap > 0) {
      throw new Error(`Invariant broken: isFunded is true but fundingGap is ${metrics.fundingGap}`);
    }
  }
}
