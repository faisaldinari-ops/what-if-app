// src/components/AssumptionsDrawer.tsx
import React from 'react';
import { X, Layers, RotateCcw, Check, Sparkles } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, getCategoryBenchmarkPresets, AssumptionSource } from '../logic/engine';

interface AssumptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  simData: SimData;
  onUpdateField: (field: keyof SimData, val: any, source?: AssumptionSource) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const AssumptionsDrawer: React.FC<AssumptionsDrawerProps> = ({
  isOpen,
  onClose,
  simData,
  onUpdateField,
  lang,
  currency
}) => {
  if (!isOpen) return null;

  const t = translations[lang];
  const benchmarks = getCategoryBenchmarkPresets(simData.category || 'business');

  // List of all keys to expose based on category
  const exposedKeys: (keyof SimData)[] = [
    'savings',
    'income',
    'expenses',
    'oneOff',
    'growth',
    'expectedNewIncome',
    'transitionMonths',
    'transitionCost',
    'personalExpenses',
    'startupCost',
    'initialBusinessRevenue',
    'businessMonthlyCosts',
    'expectedAnnualRevenueGrowth',
    'monthsBeforeRevenue',
    'debt',
    'recurringDebtPayment',
    'tuition',
    'studyDuration',
    'incomeDuringStudies',
    'expectedIncomeAfterStudies',
    'currentRent',
    'movingCost',
    'newRent',
    'estimatedNewExpenses',
    'propertyCost',
    'mortgagePayment',
    'recurringHousingCosts',
    'newRecurringCost',
    'lifestyleOneOff',
    'incomeImpact'
  ];

  // Filter keys that are actually defined in simData
  const activeKeys = exposedKeys.filter(k => simData[k] !== undefined && typeof simData[k] === 'number');

  const getLabel = (k: string) => {
    return (t.vars as any)[k] || k;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">{t.assumptions.title}</h3>
              <p className="text-[11px] text-slate-400">{t.assumptions.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close assumptions drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Every simulation calculation is 100% deterministic based on these variables. Adjust any value to update the model in real time.
          </p>

          <div className="space-y-3">
            {activeKeys.map(k => {
              const val = simData[k] as number;
              const source: AssumptionSource = simData.assumptionsSource?.[k] || 'DEFAULT';
              const benchmarkVal = benchmarks[k];

              return (
                <div
                  key={k}
                  className="p-3 rounded-xl border border-slate-800/90 bg-slate-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{getLabel(k)}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        source === 'USER'
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {source === 'USER' ? t.onboarding.user_badge : t.onboarding.unknown_badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={val}
                      onChange={e => onUpdateField(k, Number(e.target.value), 'USER')}
                      className="flex-1 h-8 px-2.5 rounded bg-slate-950 border border-slate-700 text-white font-semibold text-xs"
                    />
                    {benchmarkVal !== undefined && (
                      <button
                        type="button"
                        onClick={() => onUpdateField(k, benchmarkVal, 'DEFAULT')}
                        className="px-2 py-1 rounded border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-colors"
                        title={`Reset to benchmark: ${benchmarkVal}`}
                      >
                        Reset ({benchmarkVal})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
          >
            {t.ui.close}
          </button>
        </div>
      </div>
    </div>
  );
};
