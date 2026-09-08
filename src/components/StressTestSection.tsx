// src/components/StressTestSection.tsx
import React, { useState, useMemo } from 'react';
import { AlertOctagon, ShieldAlert, ShieldCheck, HelpCircle, ArrowDownRight, ArrowUpRight, Sliders, RefreshCw } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, evaluateStressTest, StressEvaluation } from '../logic/engine';

interface StressTestSectionProps {
  simData: SimData;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const StressTestSection: React.FC<StressTestSectionProps> = ({
  simData,
  lang,
  currency
}) => {
  const t = translations[lang];
  const [activeShock, setActiveShock] = useState<'income' | 'expenses' | 'unexpected' | 'delay'>('income');
  const [unexpectedAmount, setUnexpectedAmount] = useState<number>(10000);
  const [delayMonths, setDelayMonths] = useState<number>(6);

  // Evaluate stress test dynamically through the real deterministic engine
  const stressResult: StressEvaluation = useMemo(() => {
    return evaluateStressTest(simData, activeShock, {
      amount: unexpectedAmount,
      delayMonths
    });
  }, [simData, activeShock, unexpectedAmount, delayMonths]);

  const shockButtons: { key: 'income' | 'expenses' | 'unexpected' | 'delay'; label: string; desc: string }[] = [
    { key: 'income', label: t.stress.shock_income, desc: t.stress.shock_income_desc },
    { key: 'expenses', label: t.stress.shock_expenses, desc: t.stress.shock_expenses_desc },
    { key: 'unexpected', label: t.stress.shock_unexpected, desc: t.stress.shock_unexpected_desc },
    { key: 'delay', label: t.stress.shock_delay, desc: t.stress.shock_delay_desc }
  ];

  const statusColor =
    stressResult.status === 'resilient'
      ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
      : stressResult.status === 'fragile'
        ? 'text-amber-400 bg-amber-950/80 border-amber-800'
        : 'text-rose-400 bg-rose-950/80 border-rose-800';

  const statusLabel =
    stressResult.status === 'resilient'
      ? t.stress.status_resilient
      : stressResult.status === 'fragile'
        ? t.stress.status_fragile
        : t.stress.status_critical;

  const currentExplanation =
    lang === 'fr'
      ? stressResult.explanationFr
      : lang === 'es'
        ? stressResult.explanationEs
        : stressResult.explanationEn;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-900/60 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{t.stress.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.stress.subtitle}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Shock Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {shockButtons.map(sh => (
          <button
            key={sh.key}
            id={`stress-tab-${sh.key}`}
            onClick={() => setActiveShock(sh.key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeShock === sh.key
                ? 'border-rose-500/80 bg-rose-950/30 text-white shadow-sm'
                : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <span className="text-xs font-bold block">{sh.label}</span>
            <span className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {sh.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Editable Parameters for Shock Amount or Delay */}
      {(activeShock === 'unexpected' || activeShock === 'delay') && (
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center gap-4 text-xs">
          <Sliders className="w-4 h-4 text-rose-400" />
          {activeShock === 'unexpected' && (
            <div className="flex items-center gap-2">
              <label htmlFor="stress-amount-input" className="font-semibold text-slate-300">
                {t.stress.edit_cost_amount}:
              </label>
              <input
                id="stress-amount-input"
                type="number"
                step="500"
                value={unexpectedAmount}
                onChange={e => setUnexpectedAmount(Math.max(0, Number(e.target.value)))}
                className="w-28 h-8 px-2.5 rounded bg-slate-950 border border-slate-700 text-white font-semibold text-xs"
              />
              <span className="text-slate-400">{currency}</span>
            </div>
          )}

          {activeShock === 'delay' && (
            <div className="flex items-center gap-2">
              <label htmlFor="stress-delay-input" className="font-semibold text-slate-300">
                {t.stress.edit_delay_months}:
              </label>
              <input
                id="stress-delay-input"
                type="number"
                min="1"
                max="24"
                value={delayMonths}
                onChange={e => setDelayMonths(Math.max(1, Number(e.target.value)))}
                className="w-20 h-8 px-2.5 rounded bg-slate-950 border border-slate-700 text-white font-semibold text-xs"
              />
              <span className="text-slate-400">{t.metrics.months}</span>
            </div>
          )}
        </div>
      )}

      {/* Stress Results Table: Baseline vs Stressed vs Delta at 1Y, 3Y, 5Y */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3 sm:p-3.5">Horizon</th>
              <th className="p-3 sm:p-3.5">{t.stress.baseline_label}</th>
              <th className="p-3 sm:p-3.5 text-rose-300">{t.stress.stressed_label}</th>
              <th className="p-3 sm:p-3.5">{t.stress.delta_label}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
            {/* 1 Year (12M) */}
            <tr>
              <td className="p-3 sm:p-3.5 font-bold text-white">1 {t.ui.years_suffix} (12M)</td>
              <td className="p-3 sm:p-3.5">{formatCurrency(stressResult.baseline.m12, currency, lang)}</td>
              <td className="p-3 sm:p-3.5 font-semibold text-rose-300">
                {formatCurrency(stressResult.stressed.m12, currency, lang)}
              </td>
              <td className="p-3 sm:p-3.5">
                <span className={stressResult.delta.m12 < 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {formatCurrency(stressResult.delta.m12, currency, lang)}
                </span>
              </td>
            </tr>

            {/* 3 Years (36M) */}
            <tr>
              <td className="p-3 sm:p-3.5 font-bold text-white">3 {t.ui.years_suffix} (36M)</td>
              <td className="p-3 sm:p-3.5">{formatCurrency(stressResult.baseline.m36, currency, lang)}</td>
              <td className="p-3 sm:p-3.5 font-semibold text-rose-300">
                {formatCurrency(stressResult.stressed.m36, currency, lang)}
              </td>
              <td className="p-3 sm:p-3.5">
                <span className={stressResult.delta.m36 < 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {formatCurrency(stressResult.delta.m36, currency, lang)}
                </span>
              </td>
            </tr>

            {/* 5 Years (60M) */}
            <tr>
              <td className="p-3 sm:p-3.5 font-bold text-white">5 {t.ui.years_suffix} (60M)</td>
              <td className="p-3 sm:p-3.5">{formatCurrency(stressResult.baseline.m60, currency, lang)}</td>
              <td className="p-3 sm:p-3.5 font-semibold text-rose-300">
                {formatCurrency(stressResult.stressed.m60, currency, lang)}
              </td>
              <td className="p-3 sm:p-3.5">
                <span className={stressResult.delta.m60 < 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {formatCurrency(stressResult.delta.m60, currency, lang)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Runway & Breaking Point Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs space-y-1">
          <div className="text-slate-400 font-semibold">{t.stress.runway_before} vs {t.stress.runway_after}</div>
          <div className="flex items-center gap-3 font-bold text-sm">
            <span className="text-slate-200">
              {typeof stressResult.baseline.runway === 'number'
                ? `${stressResult.baseline.runway} ${t.metrics.months}`
                : stressResult.baseline.runway}
            </span>
            <span className="text-slate-500">→</span>
            <span className="text-rose-400">
              {typeof stressResult.stressed.runway === 'number'
                ? `${stressResult.stressed.runway} ${t.metrics.months}`
                : stressResult.stressed.runway}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs space-y-1">
          <div className="text-slate-400 font-semibold">{t.stress.breaking_impact}</div>
          <div className="font-bold text-sm text-slate-200">
            {formatCurrency(stressResult.delta.marginDiff, currency, lang)}/mo cushion change
          </div>
        </div>
      </div>

      {/* Narrative & Thresholds explanation */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 space-y-2 text-xs">
        <div className="font-bold text-white flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.stress.thresholds_title}</span>
        </div>
        <p className="text-slate-300 leading-relaxed">{currentExplanation}</p>
        <p className="text-slate-400 text-[11px] leading-relaxed pt-1 border-t border-slate-800/60">
          {t.stress.thresholds_desc}
        </p>
      </div>
    </div>
  );
};
