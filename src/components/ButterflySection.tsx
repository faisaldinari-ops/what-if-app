// src/components/ButterflySection.tsx
import React, { useState, useMemo } from 'react';
import { Wind, ArrowRight, ArrowDown, Sparkles, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, evaluateButterflyEffect, getCategoryEffectiveInputs, ButterflyChainResult } from '../logic/engine';

interface ButterflySectionProps {
  simData: SimData;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const ButterflySection: React.FC<ButterflySectionProps> = ({
  simData,
  lang,
  currency
}) => {
  const t = translations[lang];
  const effective = getCategoryEffectiveInputs(simData);

  const [selectedVar, setSelectedVar] = useState<'expenses' | 'income' | 'growth' | 'oneOff'>('expenses');
  const [adjustedVal, setAdjustedVal] = useState<number>(() => {
    return Math.max(0, effective.expenses - 300);
  });

  // Update input when user switches variable
  const handleSelectVar = (v: 'expenses' | 'income' | 'growth' | 'oneOff') => {
    setSelectedVar(v);
    if (v === 'expenses') setAdjustedVal(Math.max(0, effective.expenses - 300));
    else if (v === 'income') setAdjustedVal(effective.income + 400);
    else if (v === 'growth') setAdjustedVal(effective.growth + 3);
    else if (v === 'oneOff') setAdjustedVal(Math.max(0, effective.oneOff - 1500));
  };

  const chainResult: ButterflyChainResult = useMemo(() => {
    return evaluateButterflyEffect(simData, selectedVar, adjustedVal);
  }, [simData, selectedVar, adjustedVal]);

  const varOptions: { key: 'expenses' | 'income' | 'growth' | 'oneOff'; label: string }[] = [
    { key: 'expenses', label: t.vars.expenses },
    { key: 'income', label: t.vars.income },
    { key: 'growth', label: t.vars.growth },
    { key: 'oneOff', label: t.vars.oneOff }
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-900/60 text-sky-400">
          <Wind className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">{t.butterfly.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.butterfly.subtitle}</p>
        </div>
      </div>

      {/* Control Panel: Variable Selection & New Value */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs">
        {/* Variable selector */}
        <div className="space-y-1.5">
          <label htmlFor="butterfly-var-select" className="font-semibold text-slate-300">
            {t.butterfly.select_var}
          </label>
          <select
            id="butterfly-var-select"
            value={selectedVar}
            onChange={e => handleSelectVar(e.target.value as any)}
            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-slate-700 text-white font-medium focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
          >
            {varOptions.map(opt => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Current baseline value display */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-400 block">{t.butterfly.current_value}</span>
          <div className="h-10 px-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center font-bold text-slate-300">
            {selectedVar === 'growth'
              ? `${chainResult.currentValue}%`
              : formatCurrency(chainResult.currentValue, currency, lang)}
          </div>
        </div>

        {/* New adjusted value input */}
        <div className="space-y-1.5">
          <label htmlFor="butterfly-new-val-input" className="font-semibold text-sky-300 flex items-center justify-between">
            <span>{t.butterfly.new_value}</span>
            <span className="text-[10px] text-slate-400">
              Δ {chainResult.delta >= 0 ? '+' : ''}
              {selectedVar === 'growth' ? `${chainResult.delta}%` : formatCurrency(chainResult.delta, currency, lang)}
            </span>
          </label>
          <input
            id="butterfly-new-val-input"
            type="number"
            value={adjustedVal}
            onChange={e => setAdjustedVal(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-lg bg-slate-950 border border-sky-600/80 text-white font-bold focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Causal Transmission Chain */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>{t.butterfly.causal_chain}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          {/* Step 1: Isolated Change */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-sky-400 block">
              {t.butterfly.step_change}
            </span>
            <div>
              <span className="font-bold text-white block text-sm">
                {chainResult.delta >= 0 ? '+' : ''}
                {selectedVar === 'growth'
                  ? `${chainResult.delta}%`
                  : formatCurrency(chainResult.delta, currency, lang)}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">{selectedVar}</span>
            </div>
          </div>

          {/* Step 2: Monthly Net Cashflow */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">
              {t.butterfly.step_monthly}
            </span>
            <div>
              <span className="font-bold text-white block text-sm">
                {chainResult.monthlyImpact >= 0 ? '+' : ''}
                {formatCurrency(chainResult.monthlyImpact, currency, lang)}/mo
              </span>
              <span className="text-[10px] text-slate-400">
                {formatCurrency(chainResult.annualImpact, currency, lang)}/year
              </span>
            </div>
          </div>

          {/* Step 3: Runway Effect */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">
              {t.butterfly.step_runway}
            </span>
            <div>
              <span className="font-bold text-white block text-sm">
                {chainResult.runwayDiff >= 0 ? `+${chainResult.runwayDiff}` : chainResult.runwayDiff} {t.metrics.months}
              </span>
              <span className="text-[10px] text-slate-400">
                {chainResult.runwayBefore} → {chainResult.runwayAfter}m
              </span>
            </div>
          </div>

          {/* Step 4: 12M Safety Margin */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              {t.butterfly.step_goal}
            </span>
            <div>
              <span className="font-bold text-white block text-sm">
                {chainResult.breakingPointDiff >= 0 ? '+' : ''}
                {formatCurrency(chainResult.breakingPointDiff, currency, lang)}/mo
              </span>
              <span className="text-[10px] text-slate-400">Safety margin</span>
            </div>
          </div>

          {/* Step 5: 5-Year Cumulative Delta */}
          <div className="p-3 rounded-xl border border-sky-900/60 bg-sky-950/30 space-y-1 flex flex-col justify-between shadow-sm">
            <span className="text-[10px] uppercase font-bold text-sky-300 block">
              {t.butterfly.step_5y}
            </span>
            <div>
              <span
                className={`font-black text-base block ${
                  chainResult.m60Diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {chainResult.m60Diff >= 0 ? '+' : ''}
                {formatCurrency(chainResult.m60Diff, currency, lang)}
              </span>
              <span className="text-[10px] text-slate-400">Net compound delta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkpoints summary: 1Y, 3Y, 5Y differences */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">{t.butterfly.diff_1y}</span>
          <span className={`font-bold ${chainResult.m12Diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {chainResult.m12Diff >= 0 ? '+' : ''}{formatCurrency(chainResult.m12Diff, currency, lang)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">{t.butterfly.diff_3y}</span>
          <span className={`font-bold ${chainResult.m36Diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {chainResult.m36Diff >= 0 ? '+' : ''}{formatCurrency(chainResult.m36Diff, currency, lang)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-400">{t.butterfly.diff_5y}</span>
          <span className={`font-bold ${chainResult.m60Diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {chainResult.m60Diff >= 0 ? '+' : ''}{formatCurrency(chainResult.m60Diff, currency, lang)}
          </span>
        </div>
      </div>
    </div>
  );
};
