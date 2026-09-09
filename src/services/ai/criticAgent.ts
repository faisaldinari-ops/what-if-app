// src/services/ai/criticAgent.ts
import { UserExtractedData, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { RequestBudgetTracker } from './rateLimiter';

export interface CriticAuditIssue {
  type: 'arithmetic' | 'missing_data' | 'legal_risk' | 'budget_gap' | 'timeline' | 'source_grounding';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

export interface CriticAuditReport {
  isPassed: boolean;
  score: number; // 0 to 100
  issues: CriticAuditIssue[];
  deterministicValidationOnly: boolean;
  auditSummary: string;
}

/**
 * Deterministic Sanity & Feasibility Auditor (Level 0 - Zero Token).
 * Inspects numbers, sums, deadlines, mandatory legal requirements, and coherence
 * without invoking expensive LLM calls.
 */
export function auditDecisionAnalysisDeterministically(
  input: UserExtractedData,
  analysis: DecisionAnalysis,
  coPilot?: CoPilotResponse
): CriticAuditReport {
  const issues: CriticAuditIssue[] = [];

  const budget = input.budget ?? 0;
  const targetCost = input.projectStartupCost ?? 3000;
  const income = input.monthlyIncome ?? 0;
  const expenses = input.monthlyExpenses ?? 0;
  const margin = income - expenses;

  // 1. Arithmetic & Cashflow Sanity
  if (budget < 0) {
    issues.push({
      type: 'arithmetic',
      severity: 'critical',
      message: 'Le capital initial renseigné est négatif.',
      recommendation: 'Corriger le solde de départ.'
    });
  }

  if (income > 0 && expenses > income) {
    issues.push({
      type: 'arithmetic',
      severity: 'warning',
      message: `Déficit mensuel structurel : dépenses (${expenses} €) supérieures aux revenus (${income} €).`,
      recommendation: 'Sécuriser une réduction des charges fixes avant tout investissement nouveau.'
    });
  }

  // 2. Budget gap verification
  const gap = targetCost - budget;
  if (gap > 0 && margin <= 0 && budget === 0) {
    issues.push({
      type: 'budget_gap',
      severity: 'critical',
      message: `Écart de ${gap} € sans capacité d'épargne déclarée.`,
      recommendation: 'Privilégier le démarrage 100 % gratuit (bootstrap agile) ou une phase de trésorerie.'
    });
  }

  // 3. Domain specific legal requirements
  const promptLower = (input.prompt || '').toLowerCase();

  // Electricity / regulated trade in France
  if (promptLower.includes('electricien') || promptLower.includes('plombier') || promptLower.includes('artisan')) {
    if (!promptLower.includes('diplome') && !promptLower.includes('cap') && !promptLower.includes('bep') && !promptLower.includes('experience')) {
      issues.push({
        type: 'legal_risk',
        severity: 'critical',
        message: 'Activité artisanale réglementée (BTP / Électricité). Qualification obligatoire (loi Raffarin n° 96-603).',
        recommendation: 'Détenir un CAP/BEP ou justifier de 3 années d’expérience professionnelle pour s’immatriculer.'
      });
    }
  }

  // Vehicle purchase stress test
  if (promptLower.includes('voiture') || promptLower.includes('auto') || promptLower.includes('vehicule')) {
    if (targetCost > 10000 && income > 0 && (targetCost / (income * 12)) > 0.6) {
      issues.push({
        type: 'budget_gap',
        severity: 'warning',
        message: `Le prix du véhicule (${targetCost} €) représente plus de 60 % de vos revenus annuels nets.`,
        recommendation: 'Les experts recommandent de limiter l’achat d’un véhicule à 30-40 % du revenu annuel pour éviter l’asphyxie financière.'
      });
    }
  }

  // Relocation outside EU without visa discussion
  if (promptLower.includes('japon') || promptLower.includes('usa') || promptLower.includes('canada') || promptLower.includes('australie')) {
    if (promptLower.includes('vivre') || promptLower.includes('expat') || promptLower.includes('installer')) {
      issues.push({
        type: 'legal_risk',
        severity: 'warning',
        message: 'Destination hors Union Européenne : visa de long séjour / permis de travail impératif.',
        recommendation: 'Ne pas réserver de billet sans accord préalable du consulat ou sponsor local.'
      });
    }
  }

  // 4. Source & Fact grounding check
  if (!analysis.dataTransparency?.marketEstimations || analysis.dataTransparency.marketEstimations.length === 0) {
    issues.push({
      type: 'source_grounding',
      severity: 'info',
      message: 'Sources de référence partielles.',
      recommendation: 'Associer des sources officielles vérifiées et référentiels publics.'
    });
  }

  // Calculate score
  let score = 100;
  for (const iss of issues) {
    if (iss.severity === 'critical') score -= 25;
    else if (iss.severity === 'warning') score -= 10;
    else score -= 3;
  }
  score = Math.max(10, Math.min(100, score));

  return {
    isPassed: score >= 60,
    score,
    issues,
    deterministicValidationOnly: true,
    auditSummary:
      issues.length === 0
        ? 'Toutes les vérifications de cohérence arithmétique et légale sont validées.'
        : `${issues.length} point(s) d'attention identifié(s) par l'agent critique.`
  };
}
