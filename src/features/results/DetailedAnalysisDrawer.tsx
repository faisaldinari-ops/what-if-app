// src/features/results/DetailedAnalysisDrawer.tsx
import React, { useState } from 'react';
import { DecisionAnalysis } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import {
  ChevronDown,
  ChevronUp,
  Activity,
  AlertOctagon,
  Eye,
  FileCheck2,
  Database,
  Layers,
  HelpCircle
} from 'lucide-react';

interface DetailedAnalysisDrawerProps {
  analysis: DecisionAnalysis;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const DetailedAnalysisDrawer: React.FC<DetailedAnalysisDrawerProps> = ({
  analysis,
  lang,
  currency
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const { stressTest, breakingPoint, dataTransparency } = analysis;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden text-left">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-900/80 transition-colors focus:outline-none cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {lang === 'fr'
                ? 'Voir l’analyse détaillée'
                : lang === 'es'
                ? 'Ver el análisis detallado'
                : 'View Detailed Analysis'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'fr'
                ? 'Stress tests, point de rupture et transparence des hypothèses.'
                : lang === 'es'
                ? 'Pruebas de estrés, punto de ruptura y transparencia de datos.'
                : 'Stress testing, breaking point and data transparency breakdown.'}
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1">
          <span>{isOpen ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Ouvrir' : 'Open')}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-5 sm:p-7 border-t border-slate-800/80 space-y-8 bg-slate-950/70">
          {/* 1. Stress Tests */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'fr' ? 'Stress Tests (Chocs adverses)' : 'Stress Tests (Adverse Shocks)'}
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-semibold">
              {stressTest.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {lang === 'fr' ? 'Choc -20% de revenus' : '-20% Revenue Shock'}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {typeof stressTest.incomeDrop20Months === 'number'
                    ? `${stressTest.incomeDrop20Months} mois de survie`
                    : lang === 'fr'
                    ? 'Résiste à 12 mois'
                    : 'Survives 12+ months'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {lang === 'fr' ? 'Inflation +20% des charges' : '+20% Expense Shock'}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {typeof stressTest.expensesUp20Months === 'number'
                    ? `${stressTest.expensesUp20Months} mois de survie`
                    : lang === 'fr'
                    ? 'Résiste à 12 mois'
                    : 'Survives 12+ months'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {lang === 'fr' ? 'Retard de 3 mois au démarrage' : '3-Month Launch Delay'}
                </span>
                <span className="font-mono text-sm font-bold text-rose-400">
                  -{formatCurrency(stressTest.delay3MonthsCashImpact, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Point de Rupture */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                {lang === 'fr' ? 'Point de rupture financier' : 'Financial Breaking Point'}
              </h4>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-semibold">
              {breakingPoint.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {lang === 'fr' ? 'Plafond de charges supportables :' : 'Max Sustainable Monthly Burn:'}
                </span>
                <span className="font-mono text-base font-bold text-white">
                  {formatCurrency(breakingPoint.maxSustainableMonthlyBurn, currency)}/mois
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  {lang === 'fr' ? 'Marge de sécurité mensuelle actuelle :' : 'Current Monthly Safety Cushion:'}
                </span>
                <span
                  className={`font-mono text-base font-bold ${
                    breakingPoint.monthlySafetyCushion >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {breakingPoint.monthlySafetyCushion >= 0 ? '+' : ''}
                  {formatCurrency(breakingPoint.monthlySafetyCushion, currency)}/mois
                </span>
              </div>
            </div>
          </div>

          {/* 3. Transparence des Données & Hypothèses */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  {lang === 'fr'
                    ? 'Transparence : Données réelles vs Estimations'
                    : 'Transparency: Declared Data vs Market Benchmarks'}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* User Data */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide block">
                  {lang === 'fr' ? 'Données fournies par toi' : 'User-Declared Inputs'}
                </span>
                <ul className="space-y-1.5 text-slate-400">
                  {dataTransparency.userData.map((item, i) => (
                    <li key={i} className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                      <span>{item.label}</span>
                      <span className="font-mono font-semibold text-white">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Market Estimations */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wide block">
                  {lang === 'fr' ? 'Estimations sectorielles standards' : 'Market Sector Benchmarks'}
                </span>
                <ul className="space-y-1.5 text-slate-400">
                  {dataTransparency.marketEstimations.map((item, i) => (
                    <li key={i} className="flex justify-between items-center py-0.5 border-b border-slate-800/40">
                      <div>
                        <span>{item.label}</span>
                        {item.disclaimer && (
                          <span className="block text-[10px] text-slate-400">{item.disclaimer}</span>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-slate-300">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Disclaimer on external data */}
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              {lang === 'fr'
                ? 'Note de rigueur : WHAT IF? calcule des conséquences déterministes sur la base de tes chiffres et de benchmarks sectoriels transparents. Aucun chiffre n’est une prédiction garantie du futur ni une promesse de rentabilité.'
                : 'Methodological note: WHAT IF? calculates deterministic projections based on your numbers and standard sector benchmarks. Projections represent calculated mathematical consequences, not guarantees.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
