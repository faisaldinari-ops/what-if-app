// src/components/ReversibilitySection.tsx
import React from 'react';
import { RotateCcw, AlertCircle, Info, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations } from '../i18n';
import { SimData, calculateReversibility, ReversibilityResult } from '../logic/engine';

interface ReversibilitySectionProps {
  simData: SimData;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const ReversibilitySection: React.FC<ReversibilitySectionProps> = ({
  simData,
  lang,
  currency
}) => {
  const t = translations[lang];
  const rev: ReversibilityResult = calculateReversibility(simData);

  const tierLabel =
    rev.tier === 'high'
      ? t.reversibility.tier_high
      : rev.tier === 'moderate'
        ? t.reversibility.tier_moderate
        : t.reversibility.tier_low;

  const tierColor =
    rev.tier === 'high'
      ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
      : rev.tier === 'moderate'
        ? 'text-amber-400 bg-amber-950/80 border-amber-800'
        : 'text-rose-400 bg-rose-950/80 border-rose-800';

  const tierBarColor =
    rev.tier === 'high' ? 'bg-emerald-500' : rev.tier === 'moderate' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-900/60 text-indigo-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{t.reversibility.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.reversibility.subtitle}</p>
          </div>
        </div>

        {/* Score & Tier Badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white">{rev.score}/100</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${tierColor}`}>
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 flex">
          <div
            className={`h-full ${tierBarColor} transition-all duration-500 rounded-full`}
            style={{ width: `${rev.score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
          <span>0 (Low Reversibility)</span>
          <span>50 (Moderate)</span>
          <span>100 (High Reversibility)</span>
        </div>
      </div>

      {/* Breakdown Factors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {rev.factors.map(f => (
          <div key={f.name} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">{f.name}</span>
              <span className="text-xs font-black text-indigo-300">{f.score}/100</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">{f.details}</p>
          </div>
        ))}
      </div>

      {/* Transparent Disclaimer */}
      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/30 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t.reversibility.disclaimer}</p>
      </div>
    </div>
  );
};
