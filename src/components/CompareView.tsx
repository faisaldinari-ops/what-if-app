// src/components/CompareView.tsx
import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import {
  ScenarioType,
  SimResultPoint,
  SimData,
  calculateRunway,
  calculateReversibility,
  evaluateGoals,
  SCENARIO_CONFIGS
} from '../logic/engine';

interface CompareViewProps {
  scenarios: Record<ScenarioType, SimResultPoint[]>;
  selectedMonth: number;
  simData: SimData;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onBackToSim: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  scenarios,
  selectedMonth,
  simData,
  lang,
  currency,
  onBackToSim
}) => {
  const t = translations[lang];
  const scenarioKeys: ScenarioType[] = ['conservative', 'expected', 'optimistic', 'custom'];

  const reversibility = calculateReversibility(simData);

  const getLabel = (type: ScenarioType) => {
    switch (type) {
      case 'conservative':
        return t.scenarios.conservative;
      case 'expected':
        return t.scenarios.expected;
      case 'optimistic':
        return t.scenarios.optimistic;
      case 'custom':
        return t.scenarios.custom;
    }
  };

  const getPt = (type: ScenarioType, m: number) => {
    const pts = scenarios[type];
    return pts.find(p => p.m === m) || pts[pts.length - 1];
  };

  // Generate objective factual insight comparing Expected vs Conservative
  const expected1Y = getPt('expected', 12).cash;
  const conservative1Y = getPt('conservative', 12).cash;
  const optimistic1Y = getPt('optimistic', 12).cash;

  const diffExpCons1Y = expected1Y - conservative1Y;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{t.comparison.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.comparison.subtitle}</p>
        </div>
        <button
          id="compare-back-to-sim-btn"
          onClick={onBackToSim}
          className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.ui.back_to_sim}</span>
        </button>
      </div>

      {/* Objective Factual Insight Box (Strictly non-prescriptive) */}
      <div className="p-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 text-xs space-y-1.5">
        <span className="font-bold text-indigo-300 uppercase tracking-wider text-[10px]">
          {t.comparison.factual_insight}
        </span>
        <p className="text-slate-300 leading-relaxed">
          {t.comparison.insight_text}{' '}
          <strong className="text-white">
            ({formatCurrency(diffExpCons1Y, currency, lang)} delta at 1Y)
          </strong>.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 shadow-md">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-3.5 sm:p-4">{t.comparison.metric_header}</th>
              {scenarioKeys.map(k => (
                <th key={k} className="p-3.5 sm:p-4 text-white font-bold">
                  <span className="block text-xs">{getLabel(k)}</span>
                  <span className="text-[9px] font-normal text-slate-400 lowercase">
                    {SCENARIO_CONFIGS[k](simData.customGrowthMod, simData.customExpenseMod).growthMult * 100}% gr / {SCENARIO_CONFIGS[k](simData.customGrowthMod, simData.customExpenseMod).expenseMult * 100}% exp
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200 font-medium">
            {/* Cash at 1 Year */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.cash_1y}</td>
              {scenarioKeys.map(k => {
                const val = getPt(k, 12).cash;
                return (
                  <td key={k} className="p-3.5 sm:p-4 font-bold">
                    <span className={val < 0 ? 'text-rose-400' : 'text-white'}>
                      {formatCurrency(val, currency, lang)}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Cash at 3 Years */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.cash_3y}</td>
              {scenarioKeys.map(k => {
                const val = getPt(k, 36).cash;
                return (
                  <td key={k} className="p-3.5 sm:p-4 font-bold">
                    <span className={val < 0 ? 'text-rose-400' : 'text-white'}>
                      {formatCurrency(val, currency, lang)}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Cash at 5 Years */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.cash_5y}</td>
              {scenarioKeys.map(k => {
                const val = getPt(k, 60).cash;
                return (
                  <td key={k} className="p-3.5 sm:p-4 font-bold">
                    <span className={val < 0 ? 'text-rose-400' : 'text-white'}>
                      {formatCurrency(val, currency, lang)}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Monthly Net at Selected Point */}
            <tr className="bg-slate-900/30">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">
                {t.metrics.net_cashflow} ({selectedMonth === 0 ? t.timeline.today : `${selectedMonth}M`})
              </td>
              {scenarioKeys.map(k => {
                const net = getPt(k, selectedMonth).net;
                return (
                  <td key={k} className="p-3.5 sm:p-4">
                    <span className={net >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {net >= 0 ? '+' : ''}{formatCurrency(net, currency, lang)}/mo
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Monthly Income at Selected Point */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">
                {t.metrics.income} ({selectedMonth === 0 ? t.timeline.today : `${selectedMonth}M`})
              </td>
              {scenarioKeys.map(k => (
                <td key={k} className="p-3.5 sm:p-4">
                  {formatCurrency(getPt(k, selectedMonth).income, currency, lang)}
                </td>
              ))}
            </tr>

            {/* Monthly Expenses at Selected Point */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">
                {t.metrics.expenses} ({selectedMonth === 0 ? t.timeline.today : `${selectedMonth}M`})
              </td>
              {scenarioKeys.map(k => (
                <td key={k} className="p-3.5 sm:p-4">
                  {formatCurrency(getPt(k, selectedMonth).expenses, currency, lang)}
                </td>
              ))}
            </tr>

            {/* Runway */}
            <tr className="bg-slate-900/30">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.runway_now}</td>
              {scenarioKeys.map(k => {
                const pt = getPt(k, selectedMonth);
                const r = calculateRunway(pt.cash, pt.expenses);
                return (
                  <td key={k} className="p-3.5 sm:p-4 font-bold">
                    <span
                      className={
                        r === 'insolvent'
                          ? 'text-rose-400'
                          : r === 'sustainable'
                            ? 'text-emerald-400'
                            : r < 3
                              ? 'text-rose-400'
                              : 'text-indigo-300'
                      }
                    >
                      {r === 'insolvent'
                        ? t.metrics.critical
                        : r === 'sustainable'
                          ? t.metrics.indefinite
                          : `${r} ${t.metrics.months}`}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Resilience / Risk Status */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.risk_label}</td>
              {scenarioKeys.map(k => {
                const finalCash = getPt(k, 60).cash;
                const minCash = Math.min(...scenarios[k].map(p => p.cash));
                const status = minCash < 0 || finalCash < 0 ? 'critical' : minCash < getPt(k, 0).expenses * 3 ? 'fragile' : 'resilient';
                return (
                  <td key={k} className="p-3.5 sm:p-4">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        status === 'resilient'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : status === 'fragile'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}
                    >
                      {status === 'resilient' ? t.stress.status_resilient : status === 'fragile' ? t.stress.status_fragile : t.stress.status_critical}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* Goal Progress */}
            <tr>
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.goals.title}</td>
              {scenarioKeys.map(k => {
                const goals = evaluateGoals(simData, scenarios[k]);
                const g0 = goals[0];
                return (
                  <td key={k} className="p-3.5 sm:p-4">
                    <span className="font-bold text-white">{g0 ? `${g0.progressPercent}%` : '—'}</span>
                    {g0 && g0.reachedAtMonth !== null && (
                      <span className="block text-[10px] text-emerald-400">
                        {t.goals.status_reached} {g0.reachedAtMonth}m
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Reversibility */}
            <tr className="bg-slate-900/30">
              <td className="p-3.5 sm:p-4 font-semibold text-slate-400">{t.comparison.reversibility_label}</td>
              {scenarioKeys.map(k => (
                <td key={k} className="p-3.5 sm:p-4">
                  <span className="font-bold text-white">{reversibility.score}/100</span>
                  <span className="block text-[10px] text-slate-400">
                    {reversibility.tier === 'high' ? t.reversibility.tier_high : reversibility.tier === 'moderate' ? t.reversibility.tier_moderate : t.reversibility.tier_low}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
