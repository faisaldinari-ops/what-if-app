// src/features/scenarios/ScenariosSection.tsx
import React, { useState } from 'react';
import { ScenarioResult } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { GitBranch, ShieldAlert, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

interface ScenariosSectionProps {
  scenarios: {
    prudent: ScenarioResult;
    realistic: ScenarioResult;
    favorable: ScenarioResult;
  };
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const ScenariosSection: React.FC<ScenariosSectionProps> = ({
  scenarios,
  lang,
  currency
}) => {
  const [activeTab, setActiveTab] = useState<'prudent' | 'realistic' | 'favorable'>('realistic');

  const scenarioTabs = [
    { key: 'prudent' as const, label: scenarios.prudent.label, sub: lang === 'fr' ? 'Défensif' : 'Defensive' },
    { key: 'realistic' as const, label: scenarios.realistic.label, sub: lang === 'fr' ? 'Central' : 'Baseline' },
    { key: 'favorable' as const, label: scenarios.favorable.label, sub: lang === 'fr' ? 'Croissance' : 'Growth' }
  ];

  const current = scenarios[activeTab];

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
          <GitBranch className="w-3 h-3 text-indigo-400" />
          <span>{lang === 'fr' ? 'Projections multi-scénarios' : 'Multi-Scenario Forecasts'}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {lang === 'fr' ? 'Tes 3 scénarios prévisionnels' : 'Your 3 Projected Scenarios'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          {lang === 'fr'
            ? 'Compare l’évolution de ta trésorerie selon la vitesse d’adoption commerciale.'
            : 'Compare your cash balance across different rates of market adoption.'}
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        {scenarioTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] opacity-75 font-normal">{tab.sub}</span>
          </button>
        ))}
      </div>

      {/* Active Scenario Card */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-800 bg-slate-900/80 space-y-5">
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {current.label} — {current.tagline}
          </h4>
        </div>

        {/* Checkpoint Cash Balances */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {lang === 'fr' ? 'Trésorerie à 12 mois' : 'Cash at Month 12'}
            </span>
            <span
              className={`font-mono font-black text-base sm:text-lg ${
                current.cashM12 >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(current.cashM12, currency)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {lang === 'fr' ? 'Trésorerie à 36 mois' : 'Cash at Month 36'}
            </span>
            <span
              className={`font-mono font-black text-base sm:text-lg ${
                current.cashM36 >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(current.cashM36, currency)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/60 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 block">
              {lang === 'fr' ? 'Trésorerie à 60 mois' : 'Cash at Month 60'}
            </span>
            <span
              className={`font-mono font-black text-base sm:text-lg ${
                current.cashM60 >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {formatCurrency(current.cashM60, currency)}
            </span>
          </div>
        </div>

        {/* Key operational indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
          <div className="text-xs space-y-1">
            <span className="text-slate-400">{lang === 'fr' ? 'Flux net mensuel moyen :' : 'Net monthly cashflow:'}</span>
            <div className="font-mono font-bold text-white text-sm">
              {current.monthlyNet >= 0 ? '+' : ''}
              {formatCurrency(current.monthlyNet, currency)}/mois
            </div>
          </div>

          <div className="text-xs space-y-1">
            <span className="text-slate-400">{lang === 'fr' ? 'Autonomie de trésorerie (Runway) :' : 'Cash Runway:'}</span>
            <div className="font-mono font-bold text-white text-sm">
              {typeof current.runwayMonths === 'number'
                ? `${current.runwayMonths} mois`
                : current.runwayMonths === 'sustainable'
                ? lang === 'fr'
                  ? 'Pérenne (positif)'
                  : 'Sustainable'
                : lang === 'fr'
                ? 'Déficit'
                : 'Insolvent'}
            </div>
          </div>
        </div>

        {/* Risks */}
        {current.risks.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'fr' ? 'Points de vigilance associés :' : 'Key scenario risks:'}
            </span>
            <ul className="text-xs text-slate-400 space-y-1 pl-5 list-disc leading-relaxed">
              {current.risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
