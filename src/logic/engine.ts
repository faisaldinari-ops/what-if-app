// src/logic/engine.ts

export type ScenarioType = 'conservative' | 'expected' | 'optimistic' | 'custom';
export type AssumptionSource = 'USER' | 'DEFAULT' | 'CALCULATED';

export interface GoalDefinition {
  id: string;
  name: string;
  type: 'savings' | 'income' | 'debt';
  target: number;
  targetMonths: number;
}

export type GoalConfig = GoalDefinition;

export interface SimData {
  id: string | number;
  name: string;
  category: string;
  description: string;
  // Core financial variables
  savings: number;
  income: number;
  expenses: number;
  personalExpenses?: number;
  growth: number; // annual growth %
  oneOff: number;

  // Custom scenario multipliers
  customGrowthMod: number; // e.g. 1.0 = 100% of growth
  customExpenseMod: number; // e.g. 1.0 = 100% of expenses

  // Category specific variables
  transitionMonths?: number;
  transitionCost?: number;
  expectedNewIncome?: number;

  startupCost?: number;
  initialBusinessRevenue?: number;
  businessMonthlyCosts?: number;
  expectedAnnualRevenueGrowth?: number;
  monthsBeforeRevenue?: number;

  debt?: number;
  recurringDebtPayment?: number;
  financialGoal?: number;

  tuition?: number;
  studyDuration?: number;
  incomeDuringStudies?: number;
  expectedIncomeAfterStudies?: number;

  movingCost?: number;
  newRent?: number;
  estimatedNewExpenses?: number;

  currentRent?: number;
  propertyCost?: number;
  mortgagePayment?: number;
  recurringHousingCosts?: number;

  newRecurringCost?: number;
  lifestyleOneOff?: number;
  incomeImpact?: number;

  // Goals
  goals?: GoalDefinition[];

  // Assumptions tracking
  assumptionsSource?: Record<string, AssumptionSource>;

  // Branching metadata
  forkedFrom?: {
    parentId: string | number;
    parentName: string;
    checkpointMonth: number;
  };
  createdAt?: string;
  lastModified?: string;
}

export interface SimResultPoint {
  m: number; // month
  cash: number;
  income: number;
  expenses: number;
  net: number;
}

export interface ScenarioAssumptions {
  growthMult: number;
  expenseMult: number;
  labelEn: string;
  labelFr: string;
  labelEs: string;
  descriptionEn: string;
  descriptionFr: string;
  descriptionEs: string;
}

export const SCENARIO_CONFIGS: Record<ScenarioType, (customGrowth?: number, customExp?: number) => ScenarioAssumptions> = {
  conservative: () => ({
    growthMult: 0.70, // 30% lower income growth
    expenseMult: 1.15, // 15% cost inflation headwind
    labelEn: 'Conservative',
    labelFr: 'Prudent',
    labelEs: 'Conservador',
    descriptionEn: 'Defensive case: 15% higher expenses and 30% reduced income growth.',
    descriptionFr: 'Cas prudent : dépenses majorées de 15% et croissance contenue (-30%).',
    descriptionEs: 'Caso prudente: 15% más de gastos y 30% menor crecimiento de ingresos.'
  }),
  expected: () => ({
    growthMult: 1.0,
    expenseMult: 1.0,
    labelEn: 'Expected',
    labelFr: 'Attendu',
    labelEs: 'Esperado',
    descriptionEn: 'Central case based directly on your baseline inputs.',
    descriptionFr: 'Cas central basé directement sur vos hypothèses de référence.',
    descriptionEs: 'Caso central basado directamente en tus datos de referencia.'
  }),
  optimistic: () => ({
    growthMult: 1.30, // 30% higher growth
    expenseMult: 0.95, // 5% disciplined expense control
    labelEn: 'Optimistic',
    labelFr: 'Optimiste',
    labelEs: 'Optimista',
    descriptionEn: 'Favorable execution: 30% accelerated growth and 5% cost containment.',
    descriptionFr: 'Exécution favorable : croissance supérieure (+30%) et coûts maîtrisés (-5%).',
    descriptionEs: 'Ejecución favorable: 30% más de crecimiento y 5% de contención de gastos.'
  }),
  custom: (customGrowth = 1.0, customExp = 1.0) => ({
    growthMult: Math.max(0, customGrowth),
    expenseMult: Math.max(0.1, customExp),
    labelEn: 'Custom',
    labelFr: 'Personnalisé',
    labelEs: 'Personalizado',
    descriptionEn: `User-defined multipliers: ${Math.round(customGrowth * 100)}% growth, ${Math.round(customExp * 100)}% expenses.`,
    descriptionFr: `Multiplicateurs personnalisés : ${Math.round(customGrowth * 100)}% croissance, ${Math.round(customExp * 100)}% dépenses.`,
    descriptionEs: `Multiplicadores personalizados: ${Math.round(customGrowth * 100)}% crecimiento, ${Math.round(customExp * 100)}% gastos.`
  })
};

export const sanitizeNumber = (val: any, fallback = 0, min?: number, max?: number): number => {
  let n = Number(val);
  if (!isFinite(n) || isNaN(n)) n = fallback;
  if (min !== undefined && n < min) n = min;
  if (max !== undefined && n > max) n = max;
  return n;
};

export interface EffectiveInputs {
  savings: number;
  income: number;
  expenses: number;
  oneOff: number;
  growth: number;
  customGrowthMod: number;
  customExpenseMod: number;
  // Specific dynamics
  transitionMonths: number;
  expectedNewIncome: number;
  studyDuration: number;
  incomeDuringStudies: number;
  expectedIncomeAfterStudies: number;
  monthsBeforeRevenue: number;
  businessMonthlyCosts: number;
}

export const getCategoryEffectiveInputs = (data: Partial<SimData>): EffectiveInputs => {
  const savings = sanitizeNumber(data.savings, 15000, 0);
  let income = sanitizeNumber(data.income, 3200, 0);
  let expenses = sanitizeNumber(data.expenses, 2200, 0);
  let oneOff = sanitizeNumber(data.oneOff, 0, 0);
  const growth = sanitizeNumber(data.growth, 5, -99, 500);
  const customGrowthMod = sanitizeNumber(data.customGrowthMod, 1.0, 0, 10);
  const customExpenseMod = sanitizeNumber(data.customExpenseMod, 1.0, 0, 10);

  let transitionMonths = 0;
  let expectedNewIncome = 0;
  let studyDuration = 0;
  let incomeDuringStudies = 0;
  let expectedIncomeAfterStudies = 0;
  let monthsBeforeRevenue = 0;
  let businessMonthlyCosts = 0;

  // Category specific mappings
  switch (data.category) {
    case 'career':
      if (data.transitionCost !== undefined) oneOff = sanitizeNumber(data.transitionCost, oneOff, 0);
      transitionMonths = sanitizeNumber(data.transitionMonths, 0, 0, 60);
      expectedNewIncome = sanitizeNumber(data.expectedNewIncome, income, 0);
      break;

    case 'business':
      if (data.startupCost !== undefined) oneOff = sanitizeNumber(data.startupCost, oneOff, 0);
      monthsBeforeRevenue = sanitizeNumber(data.monthsBeforeRevenue, 0, 0, 60);
      businessMonthlyCosts = sanitizeNumber(data.businessMonthlyCosts, 0, 0);
      // Combine personal expenses + business overhead
      expenses = expenses + businessMonthlyCosts;
      if (data.initialBusinessRevenue !== undefined) {
        income = sanitizeNumber(data.initialBusinessRevenue, income, 0);
      }
      break;

    case 'money':
      if (data.recurringDebtPayment !== undefined) {
        expenses = expenses + sanitizeNumber(data.recurringDebtPayment, 0, 0);
      }
      break;

    case 'education':
      if (data.tuition !== undefined) oneOff = sanitizeNumber(data.tuition, oneOff, 0);
      studyDuration = sanitizeNumber(data.studyDuration, 12, 0, 60);
      incomeDuringStudies = sanitizeNumber(data.incomeDuringStudies, 0, 0);
      expectedIncomeAfterStudies = sanitizeNumber(data.expectedIncomeAfterStudies, income * 1.5, 0);
      break;

    case 'moving':
      if (data.movingCost !== undefined) oneOff = sanitizeNumber(data.movingCost, oneOff, 0);
      if (data.newRent !== undefined && Number(data.newRent) > 0) {
        const oldRent = sanitizeNumber(data.currentRent, 800, 0);
        const rentDiff = sanitizeNumber(data.newRent, 0, 0) - oldRent;
        expenses = Math.max(500, expenses + rentDiff);
      }
      if (data.estimatedNewExpenses !== undefined && Number(data.estimatedNewExpenses) > 0) {
        expenses = Math.max(500, sanitizeNumber(data.estimatedNewExpenses, expenses, 0));
      }
      if (data.expectedNewIncome !== undefined && Number(data.expectedNewIncome) > 0) {
        income = sanitizeNumber(data.expectedNewIncome, income, 0);
      }
      break;

    case 'housing':
      if (data.propertyCost !== undefined) oneOff = sanitizeNumber(data.propertyCost, oneOff, 0);
      if (data.mortgagePayment !== undefined && Number(data.mortgagePayment) > 0) {
        const oldRent = sanitizeNumber(data.currentRent, 900, 0);
        const addCosts = sanitizeNumber(data.recurringHousingCosts, 200, 0);
        expenses = Math.max(500, expenses - oldRent + sanitizeNumber(data.mortgagePayment, 0, 0) + addCosts);
      }
      break;

    case 'lifestyle':
      if (data.lifestyleOneOff !== undefined) oneOff = sanitizeNumber(data.lifestyleOneOff, oneOff, 0);
      if (data.newRecurringCost !== undefined) {
        expenses = expenses + sanitizeNumber(data.newRecurringCost, 0, 0);
      }
      if (data.incomeImpact !== undefined) {
        income = Math.max(0, income + sanitizeNumber(data.incomeImpact, 0));
      }
      break;

    default:
      break;
  }

  return {
    savings,
    income,
    expenses,
    oneOff,
    growth,
    customGrowthMod,
    customExpenseMod,
    transitionMonths,
    expectedNewIncome,
    studyDuration,
    incomeDuringStudies,
    expectedIncomeAfterStudies,
    monthsBeforeRevenue,
    businessMonthlyCosts
  };
};

/**
 * Runs a deterministic simulation over 60 months.
 * Checkpoints: [0, 3, 6, 12, 36, 60]
 * Month 0 cash = savings - oneOff (exact starting balance, no added cashflow).
 * Month 1..60 add monthly net cashflow (income - expenses).
 */
export const runSimulation = (
  data: Partial<SimData>,
  type: ScenarioType = 'expected',
  options?: {
    overrideIncome?: number;
    overrideExpenses?: number;
    overrideOneOff?: number;
    incomeDelayMonths?: number;
  }
): SimResultPoint[] => {
  const months = 60;
  const results: SimResultPoint[] = [];
  const effective = getCategoryEffectiveInputs(data);

  const scenarioConfig = SCENARIO_CONFIGS[type](effective.customGrowthMod, effective.customExpenseMod);

  const baseSavings = effective.savings;
  const initialCost = options?.overrideOneOff !== undefined ? options.overrideOneOff : effective.oneOff;

  // Month 0 starting cash
  let currentCash = baseSavings - initialCost;

  const effectiveGrowth = Math.max(-99, effective.growth * scenarioConfig.growthMult);
  const monthlyRate = Math.pow(1 + effectiveGrowth / 100, 1 / 12) - 1;

  const baseIncomeTarget = options?.overrideIncome !== undefined ? options.overrideIncome : effective.income;
  const baseExpensesTarget = (options?.overrideExpenses !== undefined ? options.overrideExpenses : effective.expenses) * scenarioConfig.expenseMult;

  const incomeDelay = options?.incomeDelayMonths || 0;

  for (let m = 0; m <= months; m++) {
    let monthlyIncome = 0;

    if (m >= incomeDelay) {
      // Handle domain-specific income curves
      if (data.category === 'education' && effective.studyDuration > 0) {
        if (m <= effective.studyDuration) {
          monthlyIncome = effective.incomeDuringStudies;
        } else {
          const postStudyMonths = m - effective.studyDuration;
          const postGradBase = effective.expectedIncomeAfterStudies || baseIncomeTarget * 1.5;
          monthlyIncome = postGradBase * Math.pow(1 + monthlyRate, postStudyMonths);
        }
      } else if (data.category === 'career' && effective.transitionMonths > 0) {
        if (m <= effective.transitionMonths) {
          monthlyIncome = baseIncomeTarget;
        } else {
          const postTransitionMonths = m - effective.transitionMonths;
          const postIncomeBase = effective.expectedNewIncome || baseIncomeTarget;
          monthlyIncome = postIncomeBase * Math.pow(1 + monthlyRate, postTransitionMonths);
        }
      } else if (data.category === 'business' && effective.monthsBeforeRevenue > 0) {
        if (m < effective.monthsBeforeRevenue) {
          monthlyIncome = 0;
        } else {
          const bizMonths = m - effective.monthsBeforeRevenue;
          monthlyIncome = baseIncomeTarget * Math.pow(1 + monthlyRate, bizMonths);
        }
      } else {
        monthlyIncome = baseIncomeTarget * Math.pow(1 + monthlyRate, m);
      }
    }

    monthlyIncome = Math.max(0, monthlyIncome);
    const monthlyExpenses = Math.max(0, baseExpensesTarget);

    if (m > 0) {
      currentCash += (monthlyIncome - monthlyExpenses);
    }

    if ([0, 3, 6, 12, 36, 60].includes(m)) {
      results.push({
        m,
        cash: Math.round(currentCash),
        income: Math.round(monthlyIncome),
        expenses: Math.round(monthlyExpenses),
        net: Math.round(monthlyIncome - monthlyExpenses)
      });
    }
  }

  return results;
};

export const runMultiScenarioSim = (simData: Partial<SimData>): Record<ScenarioType, SimResultPoint[]> => {
  return {
    conservative: runSimulation(simData, 'conservative'),
    expected: runSimulation(simData, 'expected'),
    optimistic: runSimulation(simData, 'optimistic'),
    custom: runSimulation(simData, 'custom')
  };
};

/**
 * Calculates runway (in months) based on current checkpoint cash and monthly expenses.
 */
export const calculateRunway = (cash: number, monthlyExpenses: number): number | 'sustainable' | 'insolvent' => {
  if (cash < 0) return 'insolvent';
  if (monthlyExpenses <= 0) return 'sustainable';
  const r = cash / monthlyExpenses;
  if (!isFinite(r)) return 'sustainable';
  return Math.round(r * 10) / 10;
};

/**
 * Binary search for 12-Month Breaking Point:
 * Identifies the monthly expenditure that reduces cash to exactly 0 at Month 12.
 */
export interface BreakingPointResult {
  status: 'solvent' | 'insolvent' | 'no_threshold';
  thresholdExpenses: number;
  maxSustainableExpenses: number;
  currentExpenses: number;
  safetyMargin: number; // threshold - current
  horizonMonths: number;
}

export const findBreakingPoint = (data: Partial<SimData>): BreakingPointResult => {
  const effective = getCategoryEffectiveInputs(data);
  const baselineSim = runSimulation(effective, 'expected');

  // If initial cash (m=0) is already negative, immediate insolvency
  if (baselineSim[0].cash < 0) {
    return {
      status: 'insolvent',
      thresholdExpenses: 0,
      maxSustainableExpenses: 0,
      currentExpenses: effective.expenses,
      safetyMargin: -effective.expenses,
      horizonMonths: 12
    };
  }

  let low = 0;
  let high = Math.max(100000, effective.expenses * 10 + effective.savings);
  let threshold = effective.expenses;

  for (let i = 0; i < 28; i++) {
    const mid = (low + high) / 2;
    const sim = runSimulation(effective, 'expected', { overrideExpenses: mid });
    const m12Point = sim.find(p => p.m === 12);

    if (m12Point && m12Point.cash <= 0) {
      high = mid;
      threshold = mid;
    } else {
      low = mid;
    }
  }

  const roundedThreshold = Math.round(threshold);
  const safetyMargin = Math.round(roundedThreshold - effective.expenses);

  return {
    status: 'solvent',
    thresholdExpenses: roundedThreshold,
    maxSustainableExpenses: roundedThreshold,
    currentExpenses: Math.round(effective.expenses),
    safetyMargin,
    horizonMonths: 12
  };
};

/**
 * Stress Test Engine:
 * Reruns the complete 60-month simulation under specific adverse shocks.
 */
export interface StressEvaluation {
  shockType: 'income' | 'expenses' | 'unexpected' | 'delay';
  baseline: {
    m12: number;
    m36: number;
    m60: number;
    runway: number | 'sustainable' | 'insolvent';
    safetyMargin: number;
  };
  stressed: {
    m12: number;
    m36: number;
    m60: number;
    runway: number | 'sustainable' | 'insolvent';
    safetyMargin: number;
  };
  delta: {
    m12: number;
    m36: number;
    m60: number;
    runwayDiff: number;
    marginDiff: number;
  };
  minCash: number;
  status: 'resilient' | 'fragile' | 'critical';
  explanationEn: string;
  explanationFr: string;
  explanationEs: string;
}

export const evaluateStressTest = (
  data: Partial<SimData>,
  shockType: 'income' | 'expenses' | 'unexpected' | 'delay',
  customParam?: { amount?: number; delayMonths?: number }
): StressEvaluation => {
  const effective = getCategoryEffectiveInputs(data);
  const baselineSim = runSimulation(effective, 'expected');
  const baselineBP = findBreakingPoint(effective);

  const b12 = baselineSim.find(p => p.m === 12)?.cash || 0;
  const b36 = baselineSim.find(p => p.m === 36)?.cash || 0;
  const b60 = baselineSim.find(p => p.m === 60)?.cash || 0;
  const baselineRunway = calculateRunway(baselineSim[0].cash, effective.expenses);

  let options: Parameters<typeof runSimulation>[2] = {};

  if (shockType === 'income') {
    // Exact -20% income shock
    options.overrideIncome = Math.max(0, effective.income * 0.8);
  } else if (shockType === 'expenses') {
    // Exact +20% expense shock
    options.overrideExpenses = effective.expenses * 1.2;
  } else if (shockType === 'unexpected') {
    // One-time shock
    const shockCost = customParam?.amount !== undefined ? customParam.amount : 10000;
    options.overrideOneOff = effective.oneOff + shockCost;
  } else if (shockType === 'delay') {
    const delay = customParam?.delayMonths !== undefined ? customParam.delayMonths : 6;
    options.incomeDelayMonths = delay;
  }

  const stressedSim = runSimulation(effective, 'expected', options);
  const stressedBP = findBreakingPoint({
    ...effective,
    income: options.overrideIncome ?? effective.income,
    expenses: options.overrideExpenses ?? effective.expenses,
    oneOff: options.overrideOneOff ?? effective.oneOff
  });

  const s12 = stressedSim.find(p => p.m === 12)?.cash || 0;
  const s36 = stressedSim.find(p => p.m === 36)?.cash || 0;
  const s60 = stressedSim.find(p => p.m === 60)?.cash || 0;
  const stressedRunway = calculateRunway(stressedSim[0].cash, options.overrideExpenses ?? effective.expenses);

  const minCash = Math.min(...stressedSim.map(p => p.cash));

  // Deterministic classification thresholds:
  // Resilient: lowest cash >= 6 months of expenses and positive at 60M
  // Fragile: lowest cash >= 0 but < 3 months of expenses
  // Critical: cash dips below 0 or insolvent
  let status: 'resilient' | 'fragile' | 'critical' = 'resilient';
  const effectiveExpense = options.overrideExpenses ?? effective.expenses;

  if (minCash < 0 || s60 < 0) {
    status = 'critical';
  } else if (minCash < effectiveExpense * 3) {
    status = 'fragile';
  } else {
    status = 'resilient';
  }

  const numRunwayB = typeof baselineRunway === 'number' ? baselineRunway : baselineRunway === 'insolvent' ? 0 : 60;
  const numRunwayS = typeof stressedRunway === 'number' ? stressedRunway : stressedRunway === 'insolvent' ? 0 : 60;

  return {
    shockType,
    baseline: {
      m12: b12,
      m36: b36,
      m60: b60,
      runway: baselineRunway,
      safetyMargin: baselineBP.safetyMargin
    },
    stressed: {
      m12: s12,
      m36: s36,
      m60: s60,
      runway: stressedRunway,
      safetyMargin: stressedBP.safetyMargin
    },
    delta: {
      m12: s12 - b12,
      m36: s36 - b36,
      m60: s60 - b60,
      runwayDiff: Math.round((numRunwayS - numRunwayB) * 10) / 10,
      marginDiff: stressedBP.safetyMargin - baselineBP.safetyMargin
    },
    minCash,
    status,
    explanationEn: status === 'resilient'
      ? 'Liquid reserves comfortably absorb this shock while maintaining at least 6 months of living expenses.'
      : status === 'fragile'
        ? 'Reserves dip below 3 months of baseline expenses, creating cash-flow vulnerability.'
        : 'Shock leads to liquid exhaustion or cash deficit within the 60-month horizon.',
    explanationFr: status === 'resilient'
      ? "L'épargne disponible absorbe ce choc en maintenant au moins 6 mois de dépenses courantes."
      : status === 'fragile'
        ? 'Les réserves descendent sous 3 mois de dépenses courantes, créant une fragilité de trésorerie.'
        : "Ce choc entraîne une cessation de paiement ou un découvert sur l'horizon de 60 mois.",
    explanationEs: status === 'resilient'
      ? 'Las reservas absorben el impacto manteniendo al menos 6 meses de gastos corrientes.'
      : status === 'fragile'
        ? 'Las reservas caen por debajo de 3 meses de gastos, generando vulnerabilidad financiera.'
        : 'El impacto provoca agotamiento de liquidez o déficit en el horizonte de 60 meses.'
  };
};

/**
 * Butterfly Effect / Change One Thing:
 * Evaluates isolated adjustment and causal chain of transmission.
 */
export interface ButterflyChainResult {
  variableKey: 'expenses' | 'income' | 'growth' | 'oneOff';
  currentValue: number;
  newValue: number;
  delta: number;
  monthlyImpact: number;
  annualImpact: number;
  runwayBefore: number | string;
  runwayAfter: number | string;
  runwayDiff: number;
  m12Diff: number;
  m36Diff: number;
  m60Diff: number;
  breakingPointDiff: number;
}

export const evaluateButterflyEffect = (
  data: Partial<SimData>,
  variableKey: 'expenses' | 'income' | 'growth' | 'oneOff',
  newValue: number
): ButterflyChainResult => {
  const effective = getCategoryEffectiveInputs(data);
  const baselineSim = runSimulation(effective, 'expected');
  const baselineBP = findBreakingPoint(effective);

  const currentValue = effective[variableKey];
  const delta = newValue - currentValue;

  const modifiedData = { ...effective };
  if (variableKey === 'expenses') modifiedData.expenses = Math.max(0, newValue);
  if (variableKey === 'income') modifiedData.income = Math.max(0, newValue);
  if (variableKey === 'growth') modifiedData.growth = Math.max(-99, newValue);
  if (variableKey === 'oneOff') modifiedData.oneOff = Math.max(0, newValue);

  const modifiedSim = runSimulation(modifiedData, 'expected');
  const modifiedBP = findBreakingPoint(modifiedData);

  const b12 = baselineSim.find(p => p.m === 12)?.cash || 0;
  const m12 = modifiedSim.find(p => p.m === 12)?.cash || 0;
  const b36 = baselineSim.find(p => p.m === 36)?.cash || 0;
  const m36 = modifiedSim.find(p => p.m === 36)?.cash || 0;
  const b60 = baselineSim.find(p => p.m === 60)?.cash || 0;
  const m60 = modifiedSim.find(p => p.m === 60)?.cash || 0;

  const runB = calculateRunway(baselineSim[0].cash, effective.expenses);
  const runM = calculateRunway(modifiedSim[0].cash, modifiedData.expenses);

  const numB = typeof runB === 'number' ? runB : runB === 'insolvent' ? 0 : 60;
  const numM = typeof runM === 'number' ? runM : runM === 'insolvent' ? 0 : 60;

  let monthlyImpact = 0;
  if (variableKey === 'expenses') monthlyImpact = -delta;
  else if (variableKey === 'income') monthlyImpact = delta;
  else if (variableKey === 'oneOff') monthlyImpact = 0;
  else if (variableKey === 'growth') monthlyImpact = Math.round((m12 - b12) / 12);

  return {
    variableKey,
    currentValue,
    newValue,
    delta,
    monthlyImpact,
    annualImpact: monthlyImpact * 12,
    runwayBefore: runB,
    runwayAfter: runM,
    runwayDiff: Math.round((numM - numB) * 10) / 10,
    m12Diff: m12 - b12,
    m36Diff: m36 - b36,
    m60Diff: m60 - b60,
    breakingPointDiff: modifiedBP.thresholdExpenses - baselineBP.thresholdExpenses
  };
};

/**
 * Reversibility Score (Heuristic 0-100):
 * Transparent heuristic rating factoring upfront lockup, recurring overhead burden,
 * and recovery duration.
 */
export interface ReversibilityScore {
  score: number; // 0 - 100
  tier: 'high' | 'moderate' | 'low';
  upfrontRatioPercent: number;
  recurringCommitmentPercent: number;
  recoveryMonths: number;
  categoryWeightPenalty: number;
  factors: { name: string; score: number; details: string }[];
}

export type ReversibilityResult = ReversibilityScore;

export const calculateReversibility = (data: Partial<SimData>): ReversibilityScore => {
  const effective = getCategoryEffectiveInputs(data);
  const liquidSavings = Math.max(1, effective.savings);
  const monthlyIncome = Math.max(1, effective.income);

  // 1. Upfront capital locked as ratio of liquid savings
  const upfrontRatio = Math.min(2.0, effective.oneOff / liquidSavings);

  // 2. Fixed recurring burden relative to income
  const recurringRatio = Math.min(2.0, effective.expenses / monthlyIncome);

  // 3. Estimated recovery months to rebuild oneOff from net monthly cashflow
  const monthlyNet = Math.max(100, effective.income - effective.expenses);
  const recoveryMonths = effective.oneOff <= 0 ? 0 : Math.min(60, Math.round(effective.oneOff / monthlyNet));

  // 4. Inherent contractual friction of category
  const categoryFriction: Record<string, number> = {
    housing: 15, // Notary fees, selling commissions, mortgage early payoff penalty
    business: 12, // Corporate dissolution, equipment liquidation loss
    education: 10, // Sunk academic tuition
    moving: 8, // Lease termination, moving costs
    career: 6, // Resume gap, severance
    lifestyle: 4, // Subscriptions cancellation
    money: 2,
    other: 5
  };
  const catPenalty = categoryFriction[data.category || 'other'] || 5;

  let score = 100;
  score -= upfrontRatio * 40; // Max -40 for locking all savings
  score -= Math.max(0, recurringRatio - 0.5) * 30; // Max -30 for expenses eating > 50% income
  score -= Math.min(15, (recoveryMonths / 24) * 15); // Max -15 if recovery takes > 2 years
  score -= catPenalty;

  score = Math.round(Math.max(5, Math.min(95, score)));

  let tier: 'high' | 'moderate' | 'low' = 'moderate';
  if (score >= 70) tier = 'high';
  else if (score <= 40) tier = 'low';

  const factors = [
    {
      name: 'Capital Lockup',
      score: Math.max(0, 100 - Math.round(upfrontRatio * 50)),
      details: `${Math.round(upfrontRatio * 100)}% of liquid savings committed upfront.`
    },
    {
      name: 'Monthly Overhead',
      score: Math.max(0, 100 - Math.round(recurringRatio * 50)),
      details: `${Math.round(recurringRatio * 100)}% of monthly baseline income consumed by costs.`
    },
    {
      name: 'Recovery Horizon',
      score: Math.max(0, 100 - Math.min(100, recoveryMonths * 2)),
      details: recoveryMonths === 0 ? 'Instant recovery.' : `Estimated ${recoveryMonths} months to reconstitute buffer.`
    },
    {
      name: 'Structural Inertia',
      score: Math.max(0, 100 - catPenalty * 5),
      details: `Inherent category contractual/legal commitment factor (${catPenalty} pts).`
    }
  ];

  return {
    score,
    tier,
    upfrontRatioPercent: Math.round(upfrontRatio * 100),
    recurringCommitmentPercent: Math.round(recurringRatio * 100),
    recoveryMonths,
    categoryWeightPenalty: catPenalty,
    factors
  };
};

/**
 * Goal Progress Evaluator:
 * Calculates progress % and detects earliest month milestone was achieved.
 */
export interface GoalProgressResult {
  goalId: string;
  goalName: string;
  goalType: 'savings' | 'income' | 'debt';
  target: number;
  targetMonths: number;
  currentValue: number;
  progressPercent: number;
  reachedAtMonth: number | null; // null if not reached within 60 months
}

export const evaluateGoals = (data: Partial<SimData>, simPoints: SimResultPoint[]): GoalProgressResult[] => {
  const effective = getCategoryEffectiveInputs(data);
  const goals = data.goals && data.goals.length > 0 ? data.goals : [
    {
      id: 'default-savings-goal',
      name: data.category === 'money' ? 'Financial Freedom Milestone' : 'Emergency Fund Buffer',
      type: 'savings' as const,
      target: data.financialGoal || Math.max(30000, effective.expenses * 12),
      targetMonths: 36
    }
  ];

  return goals.map(g => {
    let currentValue = 0;
    let reachedAtMonth: number | null = null;

    if (g.type === 'savings') {
      currentValue = simPoints[simPoints.length - 1]?.cash || 0;
      for (const p of simPoints) {
        if (p.cash >= g.target) {
          reachedAtMonth = p.m;
          break;
        }
      }
    } else if (g.type === 'income') {
      currentValue = simPoints[simPoints.length - 1]?.income || 0;
      for (const p of simPoints) {
        if (p.income >= g.target) {
          reachedAtMonth = p.m;
          break;
        }
      }
    } else if (g.type === 'debt') {
      const remainingDebt = Math.max(0, (data.debt || 5000) - (currentValue * 0.2));
      currentValue = remainingDebt;
      if (remainingDebt <= 0) reachedAtMonth = 12;
    }

    const progressPercent = Math.min(100, Math.max(0, Math.round((currentValue / Math.max(1, g.target)) * 100)));

    return {
      goalId: g.id,
      goalName: g.name,
      goalType: g.type,
      target: g.target,
      targetMonths: g.targetMonths,
      currentValue,
      progressPercent,
      reachedAtMonth
    };
  });
};

/**
 * Fork My Future:
 * Branches off from a specific checkpoint month into a fresh simulation state.
 */
export const forkSimulation = (
  parent: SimData,
  checkpointMonth: number,
  inheritedCashOrBranchName?: number | string,
  newBranchName?: string
): SimData => {
  const sim = runSimulation(parent, 'expected');
  const point = sim.find(p => p.m === checkpointMonth) || sim[0];
  const cash = typeof inheritedCashOrBranchName === 'number' ? inheritedCashOrBranchName : Math.max(0, point.cash);
  const name = typeof inheritedCashOrBranchName === 'string'
    ? inheritedCashOrBranchName
    : newBranchName || `${parent.name} (Fork ${checkpointMonth}M)`;

  return {
    ...parent,
    id: `sim-${Date.now()}`,
    name,
    savings: Math.max(0, cash),
    income: point.income,
    expenses: point.expenses,
    oneOff: 0, // Prior upfront costs were already absorbed
    forkedFrom: {
      parentId: parent.id,
      parentName: parent.name,
      checkpointMonth
    },
    lastModified: new Date().toISOString()
  };
};

/**
 * Category Benchmark Presets:
 * Realistic values with explicit sources.
 */
export const getCategoryBenchmarkPresets = (category: string): Partial<SimData> => {
  const benchmarks: Record<string, Partial<SimData>> = {
    career: {
      category: 'career',
      savings: 20000,
      income: 3800,
      expenses: 2300,
      growth: 6,
      oneOff: 2500,
      transitionMonths: 3,
      transitionCost: 2500,
      expectedNewIncome: 4600,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    business: {
      category: 'business',
      savings: 35000,
      income: 2000,
      expenses: 2200,
      growth: 28,
      oneOff: 9000,
      startupCost: 9000,
      initialBusinessRevenue: 2000,
      businessMonthlyCosts: 600,
      expectedAnnualRevenueGrowth: 28,
      monthsBeforeRevenue: 2,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    money: {
      category: 'money',
      savings: 18000,
      income: 3500,
      expenses: 2100,
      growth: 4,
      oneOff: 0,
      debt: 8000,
      recurringDebtPayment: 350,
      financialGoal: 50000,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    education: {
      category: 'education',
      savings: 30000,
      income: 500,
      expenses: 1600,
      growth: 12,
      oneOff: 20000,
      tuition: 20000,
      studyDuration: 12,
      incomeDuringStudies: 500,
      expectedIncomeAfterStudies: 5200,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    moving: {
      category: 'moving',
      savings: 22000,
      income: 4200,
      expenses: 2400,
      currentRent: 950,
      newRent: 1500,
      movingCost: 4000,
      oneOff: 4000,
      expectedNewIncome: 4500,
      estimatedNewExpenses: 2600,
      growth: 4,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    housing: {
      category: 'housing',
      savings: 75000,
      income: 4800,
      expenses: 2600,
      currentRent: 1100,
      propertyCost: 55000,
      oneOff: 55000,
      mortgagePayment: 1850,
      recurringHousingCosts: 300,
      growth: 3,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    lifestyle: {
      category: 'lifestyle',
      savings: 16000,
      income: 3600,
      expenses: 2200,
      newRecurringCost: 350,
      lifestyleOneOff: 1800,
      oneOff: 1800,
      incomeImpact: 0,
      growth: 4,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    },
    other: {
      category: 'other',
      savings: 15000,
      income: 3200,
      expenses: 2000,
      growth: 5,
      oneOff: 2000,
      customGrowthMod: 1.0,
      customExpenseMod: 1.0
    }
  };

  return benchmarks[category] || benchmarks.other;
};

export const createDefaultSim = (category = 'business', name = 'Scenario'): SimData => {
  const benchmark = getCategoryBenchmarkPresets(category);
  return {
    id: Date.now(),
    name,
    category,
    description: '',
    savings: benchmark.savings || 15000,
    income: benchmark.income || 3200,
    expenses: benchmark.expenses || 2000,
    growth: benchmark.growth || 5,
    oneOff: benchmark.oneOff || 2000,
    customGrowthMod: 1.0,
    customExpenseMod: 1.0,
    transitionMonths: benchmark.transitionMonths,
    transitionCost: benchmark.transitionCost,
    expectedNewIncome: benchmark.expectedNewIncome,
    startupCost: benchmark.startupCost,
    initialBusinessRevenue: benchmark.initialBusinessRevenue,
    businessMonthlyCosts: benchmark.businessMonthlyCosts,
    expectedAnnualRevenueGrowth: benchmark.expectedAnnualRevenueGrowth,
    monthsBeforeRevenue: benchmark.monthsBeforeRevenue,
    debt: benchmark.debt || 0,
    recurringDebtPayment: benchmark.recurringDebtPayment || 0,
    financialGoal: benchmark.financialGoal || 50000,
    tuition: benchmark.tuition || 0,
    studyDuration: benchmark.studyDuration || 0,
    incomeDuringStudies: benchmark.incomeDuringStudies || 0,
    expectedIncomeAfterStudies: benchmark.expectedIncomeAfterStudies || 0,
    movingCost: benchmark.movingCost || 0,
    newRent: benchmark.newRent || 0,
    estimatedNewExpenses: benchmark.estimatedNewExpenses || 0,
    currentRent: benchmark.currentRent || 0,
    propertyCost: benchmark.propertyCost || 0,
    mortgagePayment: benchmark.mortgagePayment || 0,
    recurringHousingCosts: benchmark.recurringHousingCosts || 0,
    newRecurringCost: benchmark.newRecurringCost || 0,
    lifestyleOneOff: benchmark.lifestyleOneOff || 0,
    incomeImpact: benchmark.incomeImpact || 0,
    goals: [
      {
        id: 'goal-primary',
        name: 'Financial Milestone',
        type: 'savings',
        target: 40000,
        targetMonths: 36
      }
    ],
    assumptionsSource: {
      savings: 'DEFAULT',
      income: 'DEFAULT',
      expenses: 'DEFAULT',
      growth: 'DEFAULT',
      oneOff: 'DEFAULT',
      customGrowthMod: 'DEFAULT',
      customExpenseMod: 'DEFAULT'
    },
    lastModified: new Date().toISOString()
  };
};
