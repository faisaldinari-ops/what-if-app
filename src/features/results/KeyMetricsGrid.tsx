// src/features/results/KeyMetricsGrid.tsx
import React from 'react';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { Wallet, Calculator, TrendingUp, Clock, Scale } from 'lucide-react';

interface KeyMetricsGridProps {
  budgetAvailable: number;
  budgetNeeded: number;
  gap: number;
  monthlyMargin: number;
  realisticMonths: number;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  budgetAvailable,
  budgetNeeded,
  gap,
  monthlyMargin,
  realisticMonths,
  lang,
  currency
}) => {
  return (
    <div className="space-y-3 text-left">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
        {lang === 'fr'
          ? 'Les chiffres importants'
          : lang === 'es'
          ? 'Cifras clave del proyecto'
          : 'Key Financial Figures'}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 1. Budget disponible */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">
              {lang === 'fr'
                ? 'Budget disponible'
                : lang === 'es'
                ? 'Presupuesto disponible'
                : 'Available Budget'}
            </span>
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-white">
            {formatCurrency(budgetAvailable, currency)}
          </div>
          <span className="text-[10px] text-slate-400">
            {lang === 'fr' ? 'Épargne liquide' : lang === 'es' ? 'Ahorro actual' : 'Current savings'}
          </span>
        </div>

        {/* 2. Budget estimé nécessaire */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">
              {lang === 'fr'
                ? 'Budget nécessaire'
                : lang === 'es'
                ? 'Presupuesto necesario'
                : 'Estimated Needed'}
            </span>
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-white">
            {formatCurrency(budgetNeeded, currency)}
          </div>
          <span className="text-[10px] text-slate-400">
            {lang === 'fr' ? 'Avec réserve sécurité' : lang === 'es' ? 'Con fondo seguridad' : 'Includes buffer'}
          </span>
        </div>

        {/* 3. Écart */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${
            gap >= 0
              ? 'border-emerald-900/40 bg-emerald-950/20'
              : 'border-rose-900/40 bg-rose-950/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              {lang === 'fr' ? 'Écart' : lang === 'es' ? 'Diferencia' : 'Gap'}
            </span>
            <Scale
              className={`w-3.5 h-3.5 ${gap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            />
          </div>
          <div
            className={`font-mono font-black text-lg sm:text-xl ${
              gap >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {gap >= 0 ? '+' : ''}
            {formatCurrency(gap, currency)}
          </div>
          <span className="text-[10px] text-slate-400">
            {gap >= 0
              ? lang === 'fr'
                ? 'Excédent protecteur'
                : 'Surplus buffer'
              : lang === 'fr'
              ? 'À financer / combler'
              : 'Funding shortfall'}
          </span>
        </div>

        {/* 4. Marge mensuelle */}
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">
              {lang === 'fr'
                ? 'Marge mensuelle'
                : lang === 'es'
                ? 'Margen mensual'
                : 'Monthly Margin'}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div
            className={`font-mono font-black text-lg sm:text-xl ${
              monthlyMargin >= 0 ? 'text-white' : 'text-amber-400'
            }`}
          >
            {monthlyMargin >= 0 ? '+' : ''}
            {formatCurrency(monthlyMargin, currency)}
          </div>
          <span className="text-[10px] text-slate-400">
            {monthlyMargin >= 0
              ? lang === 'fr'
                ? 'Flux net positif'
                : 'Positive net'
              : lang === 'fr'
              ? 'Déficit à compenser'
              : 'Monthly burn'}
          </span>
        </div>

        {/* 5. Délai réaliste */}
        <div className="col-span-2 md:col-span-1 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">
              {lang === 'fr'
                ? 'Délai réaliste'
                : lang === 'es'
                ? 'Plazo realista'
                : 'Realistic Horizon'}
            </span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-mono font-black text-lg sm:text-xl text-white">
            {realisticMonths} {lang === 'fr' ? 'mois' : lang === 'es' ? 'meses' : 'months'}
          </div>
          <span className="text-[10px] text-slate-400">
            {lang === 'fr'
              ? 'Pour lancer sans risque'
              : lang === 'es'
              ? 'Para arrancar seguro'
              : 'To launch safely'}
          </span>
        </div>
      </div>
    </div>
  );
};
