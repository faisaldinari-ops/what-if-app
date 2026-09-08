// src/components/ExplainModal.tsx
import React from 'react';
import { X, HelpCircle, Calculator, Info, ShieldCheck } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { ScenarioType, SimData, getCategoryEffectiveInputs, SCENARIO_CONFIGS } from '../logic/engine';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioType: ScenarioType;
  metric: string;
  simData: SimData;
  selectedMonth: number;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  scenarioType,
  metric,
  simData,
  selectedMonth,
  lang,
  currency
}) => {
  if (!isOpen) return null;

  const t = translations[lang];
  const effective = getCategoryEffectiveInputs(simData);
  const cfg = SCENARIO_CONFIGS[scenarioType](simData.customGrowthMod, simData.customExpenseMod);

  const scenarioName =
    scenarioType === 'conservative'
      ? t.scenarios.conservative
      : scenarioType === 'expected'
        ? t.scenarios.expected
        : scenarioType === 'optimistic'
          ? t.scenarios.optimistic
          : t.scenarios.custom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {t.explain.title} — {scenarioName}
              </h3>
              <p className="text-[11px] text-slate-400">
                Horizon: {selectedMonth === 0 ? t.timeline.today : `${selectedMonth} ${t.metrics.months}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close explanation modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Inputs Section */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              {t.explain.inputs_used}
            </h4>
            <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Initial Savings</span>
                <span className="font-bold text-white">{formatCurrency(effective.savings, currency, lang)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Initial Upfront Cost</span>
                <span className="font-bold text-white">{formatCurrency(effective.oneOff, currency, lang)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Base Monthly Income</span>
                <span className="font-bold text-white">{formatCurrency(effective.income, currency, lang)}/mo</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Base Monthly Expenses</span>
                <span className="font-bold text-white">{formatCurrency(effective.expenses, currency, lang)}/mo</span>
              </div>
            </div>
          </div>

          {/* Assumptions Applied */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              {t.explain.assumptions_applied}
            </h4>
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Annual Growth Multiplier:</span>
                <strong className="text-white">{Math.round(cfg.growthMult * 100)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Expense Adjustment Multiplier:</span>
                <strong className="text-white">{Math.round(cfg.expenseMult * 100)}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Decision Category:</span>
                <strong className="text-white capitalize">{simData.category || 'Business'}</strong>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">
              {t.explain.formula}
            </h4>
            <div className="bg-slate-900/90 p-3 rounded-xl border border-indigo-950 text-indigo-200 font-mono text-[11px] leading-relaxed">
              Cash(m) = Savings - UpfrontCost + Σ [Income(i) - Expenses(i)] for i = 1..m
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Where monthly income compounds according to the category-specific growth rate, and expenses adjust by the scenario multiplier.
            </p>
          </div>

          {/* Deterministic Disclaimer */}
          <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30 flex items-start gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>{t.explain.horizon_desc}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            {t.ui.close}
          </button>
        </div>
      </div>
    </div>
  );
};
