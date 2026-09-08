// src/components/BreakingPointSection.tsx
import React from 'react';
import { Target, AlertTriangle, ShieldCheck, ShieldAlert, HelpCircle } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, findBreakingPoint, BreakingPointResult } from '../logic/engine';

interface BreakingPointSectionProps {
  simData: SimData;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const BreakingPointSection: React.FC<BreakingPointSectionProps> = ({
  simData,
  lang,
  currency
}) => {
  const t = translations[lang] || translations.en;
  const bpCopy = (t as any).breaking_point || (t as any).breaking || (translations.en as any).breaking_point || {};
  const bp: BreakingPointResult = findBreakingPoint(simData);

  const isSolvent = bp.safetyMargin >= 0;

  const title = bpCopy.title || '12-Month Breaking Point';
  const subtitle = bpCopy.subtitle || 'Calculates maximum sustainable monthly expenses before Month 12 insolvency.';
  const maxSustainableLabel = bpCopy.max_sustainable || bpCopy.threshold_label || 'Maximum Sustainable Expenses';
  const horizonLabel = bpCopy.horizon_label || 'Time Horizon';
  const currentExpensesLabel = bpCopy.current_expenses || 'Current Monthly Expenses';
  const safetyMarginLabel = bpCopy.safety_margin || 'Monthly Safety Cushion';
  const explanationTemplate = bpCopy.explanation_template || 'At baseline growth, you can sustain up to {max}/month before month 12 solvency is compromised, providing a safety cushion of {cushion}/month over your current expenses.';
  const insolventNote = bpCopy.insolvent_note || 'Warning: Solvency breach.';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-900/60 text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Solvency Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
              isSolvent
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : 'bg-rose-950/80 text-rose-400 border-rose-800'
            }`}
          >
            {isSolvent ? t.stress.status_resilient : t.metrics.critical}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Maximum Sustainable Expenses */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">
            {maxSustainableLabel}
          </span>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {formatCurrency(bp.maxSustainableExpenses, currency, lang)}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {horizonLabel} (12M)
          </span>
        </div>

        {/* Current Monthly Expenses */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">
            {currentExpensesLabel}
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-200 block">
            {formatCurrency(bp.currentExpenses, currency, lang)}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </span>
          <span className="text-[11px] text-slate-500">Baseline commitment</span>
        </div>

        {/* Safety Margin Cushion */}
        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isSolvent
              ? 'border-emerald-900/60 bg-emerald-950/30'
              : 'border-rose-900/60 bg-rose-950/30'
          }`}
        >
          <span className="text-xs font-semibold text-slate-400 block">
            {safetyMarginLabel}
          </span>
          <span
            className={`text-xl sm:text-2xl font-black block ${
              isSolvent ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isSolvent ? '+' : ''}
            {formatCurrency(bp.safetyMargin, currency, lang)}
            <span className="text-xs text-slate-400 font-normal">/mo</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {isSolvent ? 'Discretionary buffer' : 'Monthly deficit'}
          </span>
        </div>
      </div>

      {/* Explanatory Statement Box */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-white">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>{t.explain.title}</span>
        </div>
        {isSolvent ? (
          <p className="text-slate-300 leading-relaxed">
            {explanationTemplate
              .replace('{max}', formatCurrency(bp.maxSustainableExpenses, currency, lang))
              .replace('{cushion}', formatCurrency(bp.safetyMargin, currency, lang))}
          </p>
        ) : (
          <p className="text-rose-300 leading-relaxed font-medium">
            {insolventNote} Current expenses exceed 12-month solvency limit by{' '}
            {formatCurrency(Math.abs(bp.safetyMargin), currency, lang)}/month.
          </p>
        )}
      </div>
    </div>
  );
};
