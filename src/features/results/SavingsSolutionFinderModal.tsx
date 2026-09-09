// src/features/results/SavingsSolutionFinderModal.tsx
import React, { useState } from 'react';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { CompressibleExpenseLever } from '../../services/ai/adaptiveDepthEngine';
import {
  X,
  Sparkles,
  ShoppingBag,
  Utensils,
  Smartphone,
  Zap,
  Car,
  Coffee,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface SavingsSolutionFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMonthlyGoal: number;
  totalGap: number;
  levers: CompressibleExpenseLever[];
  lang: SupportedLang;
  currency: SupportedCurrency;
  onApplySavings: (monthlySaved: number) => void;
}

const ICON_MAP: Record<string, any> = {
  ShoppingBag,
  Utensils,
  Smartphone,
  Zap,
  Car,
  Coffee
};

export const SavingsSolutionFinderModal: React.FC<SavingsSolutionFinderModalProps> = ({
  isOpen,
  onClose,
  targetMonthlyGoal,
  totalGap,
  levers,
  lang,
  currency,
  onApplySavings
}) => {
  // State: tracking active levers and their custom amount
  const [activeLevers, setActiveLevers] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    levers.forEach(l => {
      initial[l.id] = true; // by default all selected to show potential
    });
    return initial;
  });

  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    levers.forEach(l => {
      initial[l.id] = l.typicalMonthlySaving;
    });
    return initial;
  });

  if (!isOpen) return null;

  const toggleLever = (id: string) => {
    setActiveLevers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateAmount = (id: string, delta: number) => {
    setCustomAmounts(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(300, current + delta));
      return { ...prev, [id]: next };
    });
  };

  // Calculate total monthly savings
  const totalMonthlySavings = levers.reduce((acc, l) => {
    if (activeLevers[l.id]) {
      return acc + (customAmounts[l.id] ?? l.typicalMonthlySaving);
    }
    return acc;
  }, 0);

  // Calculate projected months to bridge totalGap
  const effectiveGap = Math.max(0, totalGap);
  const projectedMonths =
    totalMonthlySavings > 0
      ? (effectiveGap / totalMonthlySavings).toFixed(1)
      : '∞';

  const isGoalReached = totalMonthlySavings >= targetMonthlyGoal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-left">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'fr'
                ? 'Moteur d’économies indolores'
                : lang === 'es'
                ? 'Motor de optimización de gastos'
                : 'Painless Savings Engine'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === 'fr'
                ? `Comment dégager ${targetMonthlyGoal} €/mois sans se priver ?`
                : lang === 'es'
                ? `¿Cómo ahorrar ${targetMonthlyGoal} €/mes?`
                : `How to unlock ${formatCurrency(targetMonthlyGoal, currency)}/mo easily?`}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {lang === 'fr'
                ? 'Active les leviers ci-dessous pour voir immédiatement l’impact sur la date de réalisation de ton projet.'
                : 'Select the everyday levers below to see the immediate effect on your target launch date.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulator Summary Banner */}
        <div className="px-6 py-4 sm:px-8 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isGoalReached ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {lang === 'fr' ? 'Économies mensuelles libérées' : 'Monthly savings unlocked'}
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-black text-white">
                +{formatCurrency(totalMonthlySavings, currency)}{' '}
                <span className="text-sm font-normal text-slate-400">/ mois</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/90 px-4 py-2.5 rounded-2xl border border-slate-800">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'fr' ? 'Délai d’aboutissement' : 'Target timeline'}
              </div>
              <div className="text-lg sm:text-xl font-mono font-black text-indigo-300">
                {projectedMonths}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {lang === 'fr' ? 'mois' : 'months'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Levers List */}
        <div className="p-6 sm:p-8 space-y-3.5 max-h-[50vh] overflow-y-auto">
          {levers.map(lever => {
            const Icon = ICON_MAP[lever.iconName] || ShoppingBag;
            const isChecked = !!activeLevers[lever.id];
            const amount = customAmounts[lever.id] ?? lever.typicalMonthlySaving;

            return (
              <div
                key={lever.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isChecked
                    ? 'bg-slate-800/70 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleLever(lever.id)}
                    className={`mt-1 p-1 rounded-lg border transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span className="text-base font-bold text-slate-100">
                        {lever.categoryName}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-normal">
                      {lever.tip}
                    </p>
                  </div>
                </div>

                {/* Amount adjusters */}
                {isChecked && (
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => updateAmount(lever.id, -10)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <div className="font-mono font-bold text-sm sm:text-base text-emerald-400 min-w-[70px] text-center">
                      +{formatCurrency(amount, currency)}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateAmount(lever.id, 10)}
                      className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 sm:p-8 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-400">
            {lang === 'fr'
              ? `Objectif recommandé : ${targetMonthlyGoal} €/mois pour concrétiser le projet.`
              : `Recommended target: ${formatCurrency(targetMonthlyGoal, currency)}/mo to launch.`}
          </div>

          <button
            onClick={() => {
              onApplySavings(totalMonthlySavings);
              onClose();
            }}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>
              {lang === 'fr'
                ? 'Appliquer cet objectif à mon projet'
                : lang === 'es'
                ? 'Aplicar este objetivo'
                : 'Apply this savings target'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
