// src/types/decision.ts

export type ProjectCategory =
  | 'entrepreneurship'
  | 'money'
  | 'real_estate'
  | 'career'
  | 'education'
  | 'relocation'
  | 'personal'
  | 'other';

export type FeasibilityVerdict = 'feasible' | 'conditional' | 'too_risky';

export interface UserExtractedData {
  prompt: string;
  projectTitle: string;
  category: ProjectCategory;
  location?: string;
  budget?: number; // Available liquid capital / savings
  monthlyIncome?: number; // Current baseline revenue/salary
  monthlyExpenses?: number; // Current personal/living expenses
  projectStartupCost?: number; // Initial capital expenditure needed
  projectMonthlyRunningCost?: number; // Dedicated recurring project costs
  projectExpectedRevenue?: number; // Projected monthly revenue once active
  monthsBeforeRevenue?: number; // Ramp-up delay
  timelineMonths?: number; // Target execution timeline
  employmentStatus?: string;
  workingSoloOrHiring?: 'solo' | 'team';
  hasPremises?: boolean;
  riskTolerance?: 'low' | 'moderate' | 'high';
  customAnswers: Record<string, any>;
}

export interface MissingQuestion {
  id: string;
  field: keyof UserExtractedData;
  question: string;
  explanation?: string;
  type: 'number' | 'text' | 'choice' | 'boolean';
  placeholder?: string;
  unit?: string;
  options?: { label: string; value: any }[];
  defaultValue?: any;
}

export interface ActionPlanStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
  impact?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProjectVariant {
  id: 'original' | 'reduced' | 'minimal';
  name: string;
  estimatedCost: number;
  monthlyCost: number;
  risk: 'low' | 'moderate' | 'high';
  description: string;
  savingsNeeded: number;
  recommended: boolean;
}

export interface ScenarioResult {
  label: string;
  tagline: string;
  cashM12: number;
  cashM36: number;
  cashM60: number;
  monthlyNet: number;
  runwayMonths: number | 'sustainable' | 'insolvent';
  risks: string[];
}

export interface DecisionAnalysis {
  id: string;
  createdAt: string;
  userInput: UserExtractedData;
  score: number; // 0-100
  verdict: FeasibilityVerdict;
  verdictTitle: string;
  verdictSummary: string; // Max 3 human sentences explaining WHY
  metrics: {
    budgetAvailable: number;
    budgetNeeded: number;
    gap: number; // budgetAvailable - budgetNeeded
    monthlyMargin: number; // monthly net cashflow
    realisticMonths: number;
    safetyReserveRecommended: number;
    runwayMonths: number | 'sustainable' | 'insolvent';
  };
  mainProblem: {
    title: string;
    description: string;
    priorityLevel: 'critical' | 'warning' | 'info';
  };
  actionPlan: ActionPlanStep[];
  variants: {
    original: ProjectVariant;
    reduced: ProjectVariant;
    minimal: ProjectVariant;
  };
  scenarios: {
    prudent: ScenarioResult;
    realistic: ScenarioResult;
    favorable: ScenarioResult;
  };
  stressTest: {
    incomeDrop20Months: number | 'sustainable' | 'insolvent';
    expensesUp20Months: number | 'sustainable' | 'insolvent';
    delay3MonthsCashImpact: number;
    summary: string;
  };
  breakingPoint: {
    maxSustainableMonthlyBurn: number;
    currentMonthlyExpenses: number;
    monthlySafetyCushion: number;
    summary: string;
  };
  dataTransparency: {
    userData: { label: string; value: string }[];
    calculatedData: { label: string; value: string }[];
    marketEstimations: { label: string; value: string; disclaimer?: string }[];
    assumptions: { label: string; value: string }[];
  };
}

export interface BenchmarkArchetype {
  category: ProjectCategory;
  keywords: string[];
  defaultTitle: string;
  estimatedStartupCost: number;
  estimatedMonthlyCost: number;
  estimatedRevenue: number;
  rampUpMonths: number;
  minimumSafetyBuffer: number;
  typicalRisks: string[];
  reducedVariantDescription: string;
  reducedCostRatio: number;
  minimalVariantDescription: string;
  minimalCostRatio: number;
}
