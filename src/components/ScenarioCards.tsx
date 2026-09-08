// src/components/ScenarioCards.tsx
import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, HelpCircle, Edit3, Check, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import {
  ScenarioType,
  SimResultPoint,
  SimData,
  calculateRunway,
  SCENARIO_CONFIGS
} from '../logic/engine';

interface ScenarioCardsProps {
  scenarios: Record<ScenarioType, SimResultPoint[]>;
  selectedMonth: number;
  lang: SupportedLang;
  currency: SupportedCurrency;
  simData: SimData;
  onUpdateCustomMods: (growthMod: number, expMod: number) => void;
  onExplain: (type: ScenarioType, metric: string) => void;
}

export const ScenarioCards: React.FC<ScenarioCardsProps> = ({
  scenarios,
  selectedMonth,
  lang,
  currency,
  simData,
  onUpdateCustomMods,
  onExplain
}) => {
  const t = translations[lang];
  const [editingCustom, setEditingCustom] = useState(false);
  const [tempGrowthMod, setTempGrowthMod] = useState(simData.customGrowthMod || 1.0);
  const [tempExpMod, setTempExpMod] = useState(simData.customExpenseMod || 1.0);

  const scenarioOrder: ScenarioType[] = ['conservative', 'expected', 'optimistic', 'custom'];

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

  const getTag = (type: ScenarioType) => {
    switch (type) {
      case 'conservative':
        return t.scenarios.conservative_tag;
      case 'expected':
        return t.scenarios.expected_tag;
      case 'optimistic':
        return t.scenarios.optimistic_tag;
      case 'custom':
        return t.scenarios.custom_tag;
    }
  };

  const handleSaveCustom = () => {
    onUpdateCustomMods(tempGrowthMod, tempExpMod);
    setEditingCustom(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {scenarioOrder.map(type => {
        const points = scenarios[type];
        const currentPt = points.find(p => p.m === selectedMonth) || points[0];
        const runway = calculateRunway(currentPt.cash, currentPt.expenses);
        const config = SCENARIO_CONFIGS[type](simData.customGrowthMod, simData.customExpenseMod);

        const isCustom = type === 'custom';
        const isExpected = type === 'expected';

        // Card styling accents
        const borderClass = isExpected
          ? 'border-indigo-500/70 bg-gradient-to-b from-indigo-950/40 to-slate-900/90 shadow-md ring-1 ring-indigo-500/30'
          : type === 'conservative'
            ? 'border-amber-700/60 bg-gradient-to-b from-amber-950/20 to-slate-900/90'
            : type === 'optimistic'
              ? 'border-sky-600/60 bg-gradient-to-b from-sky-950/20 to-slate-900/90'
              : 'border-violet-600/60 bg-gradient-to-b from-violet-950/20 to-slate-900/90';

        const tagColor = isExpected
          ? 'text-indigo-300 bg-indigo-950/70 border-indigo-800'
          : type === 'conservative'
            ? 'text-amber-300 bg-amber-950/70 border-amber-800'
            : type === 'optimistic'
              ? 'text-sky-300 bg-sky-950/70 border-sky-800'
              : 'text-violet-300 bg-violet-950/70 border-violet-800';

        return (
          <div
            key={type}
            id={`scenario-card-${type}`}
            className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${borderClass}`}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${tagColor}`}>
                    {getLabel(type)}
                  </span>
                  {isExpected && (
                    <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-950/90 px-1.5 py-0.5 rounded">
                      Baseline
                    </span>
                  )}
                </div>

                <button
                  id={`explain-btn-${type}`}
                  onClick={() => onExplain(type, 'cash')}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                  title={t.explain.title}
                  aria-label={`${t.explain.title} for ${getLabel(type)}`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                {getTag(type)}
              </p>

              {/* Primary Metric: Liquid Cash at Selected Point */}
              <div className="space-y-1 mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{t.metrics.cash}</span>
                  <span className="text-[10px] text-slate-500">
                    {selectedMonth === 0 ? t.timeline.today : `${selectedMonth}M`}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-black tracking-tight ${
                      currentPt.cash < 0 ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    {formatCurrency(currentPt.cash, currency, lang)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {currentPt.net >= 0 ? (
                    <span className="text-emerald-400 flex items-center font-semibold">
                      <ArrowUpRight className="w-3 h-3" />
                      +{formatCurrency(currentPt.net, currency, lang)}/mo
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center font-semibold">
                      <ArrowDownRight className="w-3 h-3" />
                      {formatCurrency(currentPt.net, currency, lang)}/mo
                    </span>
                  )}
                  <span className="text-slate-500 text-[10px]">{t.metrics.net_cashflow}</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">{t.metrics.income}</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentPt.income, currency, lang)}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">{t.metrics.expenses}</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentPt.expenses, currency, lang)}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/50">
                  <span className="text-slate-400">{t.metrics.runway}</span>
                  <span
                    className={`font-bold ${
                      runway === 'insolvent'
                        ? 'text-rose-400'
                        : runway === 'sustainable'
                          ? 'text-emerald-400'
                          : runway < 3
                            ? 'text-rose-400'
                            : runway < 6
                              ? 'text-amber-400'
                              : 'text-indigo-300'
                    }`}
                  >
                    {runway === 'insolvent'
                      ? t.metrics.critical
                      : runway === 'sustainable'
                        ? t.metrics.indefinite
                        : `${runway} ${t.metrics.months}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Exposed Assumptions footer */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                <span>{t.scenarios.assumptions_badge}</span>
                {isCustom && (
                  <button
                    type="button"
                    id="edit-custom-mods-btn"
                    onClick={() => setEditingCustom(!editingCustom)}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>{editingCustom ? t.ui.cancel : t.ui.custom_rates}</span>
                  </button>
                )}
              </div>

              {!isCustom || !editingCustom ? (
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-400 block">Growth</span>
                    <span className="font-bold text-slate-200">
                      {Math.round(config.growthMult * 100)}%
                    </span>
                  </div>
                  <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                    <span className="text-slate-400 block">Expenses</span>
                    <span className="font-bold text-slate-200">
                      {Math.round(config.expenseMult * 100)}%
                    </span>
                  </div>
                </div>
              ) : (
                /* Custom Multiplier In-Place Editor */
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[9px] text-slate-400 block">Growth Mod</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={tempGrowthMod}
                        onChange={e => setTempGrowthMod(Number(e.target.value))}
                        className="w-full h-7 px-1.5 rounded bg-slate-900 border border-violet-800 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block">Exp Mod</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5"
                        value={tempExpMod}
                        onChange={e => setTempExpMod(Number(e.target.value))}
                        className="w-full h-7 px-1.5 rounded bg-slate-900 border border-violet-800 text-white text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    id="save-custom-mods-btn"
                    onClick={handleSaveCustom}
                    className="w-full py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>{t.ui.apply}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
