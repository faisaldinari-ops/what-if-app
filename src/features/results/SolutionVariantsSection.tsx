// src/features/results/SolutionVariantsSection.tsx
import React from 'react';
import { ProjectVariant } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { SlidersHorizontal, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface SolutionVariantsSectionProps {
  variants: {
    original: ProjectVariant;
    reduced: ProjectVariant;
    minimal: ProjectVariant;
  };
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const SolutionVariantsSection: React.FC<SolutionVariantsSectionProps> = ({
  variants,
  lang,
  currency
}) => {
  const options = [variants.original, variants.reduced, variants.minimal];

  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300">
          <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
          <span>
            {lang === 'fr'
              ? 'Mode « Trouve-moi une solution »'
              : lang === 'es'
              ? 'Modo «Encuéntrame una solución»'
              : '“Find Me a Solution” Mode'}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {lang === 'fr'
            ? '3 variantes pour ajuster l’envergure de ton projet'
            : lang === 'es'
            ? '3 formatos para adaptar la escala de tu proyecto'
            : '3 formats to scale your project according to budget'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          {lang === 'fr'
            ? 'Si le format original est trop exigeant en capital, choisis une alternative plus légère pour débuter sans risque.'
            : lang === 'es'
            ? 'Si el formato original requiere demasiado capital, elige una alternativa ligera para empezar sin riesgo.'
            : 'If the full setup demands too much capital, launch via a leaner alternative to build cash safely.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {options.map((opt, idx) => {
          const isRec = opt.recommended;
          const riskConfig = {
            low: { text: lang === 'fr' ? 'Risque faible' : 'Low risk', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
            moderate: { text: lang === 'fr' ? 'Risque modéré' : 'Moderate risk', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' },
            high: { text: lang === 'fr' ? 'Risque élevé' : 'High risk', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' }
          }[opt.risk];

          return (
            <div
              key={opt.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative ${
                isRec
                  ? 'border-indigo-500 bg-slate-900 shadow-lg shadow-indigo-950/30'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
              }`}
            >
              {isRec && (
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{lang === 'fr' ? 'Recommandé' : lang === 'es' ? 'Recomendado' : 'Recommended'}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold">
                    Option {idx === 0 ? 'A' : idx === 1 ? 'B' : 'C'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskConfig.color}`}>
                    {riskConfig.text}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white tracking-tight">{opt.name}</h4>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">{lang === 'fr' ? 'Budget nécessaire :' : 'Budget needed:'}</span>
                    <span className="font-mono font-bold text-white text-sm">
                      {formatCurrency(opt.estimatedCost, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400">{lang === 'fr' ? 'Charges mensuelles :' : 'Monthly overhead:'}</span>
                    <span className="font-mono font-bold text-slate-300">
                      {formatCurrency(opt.monthlyCost, currency)}/mois
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed pt-2">
                  {opt.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>{lang === 'fr' ? 'Épargne conseillée : ' : 'Target reserve: '}</span>
                <span className="font-bold text-slate-200">{formatCurrency(opt.savingsNeeded, currency)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
