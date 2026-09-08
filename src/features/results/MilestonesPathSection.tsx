// src/features/results/MilestonesPathSection.tsx
import React from 'react';
import { MilestonePath } from '../../types/planning';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { Milestone, CheckCircle2, ShieldCheck, Scale, ArrowRight } from 'lucide-react';

interface MilestonesPathSectionProps {
  milestones?: MilestonePath[];
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const MilestonesPathSection: React.FC<MilestonesPathSectionProps> = ({
  milestones,
  lang,
  currency
}) => {
  if (!milestones || milestones.length === 0) return null;

  const isFr = lang === 'fr';
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'CHF';

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {isFr ? 'Construis-moi le Chemin : Paliers Réalistes' : 'Milestone Pathway: Real Steps'}
            </h3>
            <p className="text-xs text-slate-400">
              {isFr
                ? 'Si le projet immédiat est trop risqué, voici les étapes pour y arriver pas à pas'
                : 'Step-by-step roadmap to make this goal attainable over time'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          {isFr ? 'Trajectoire Progressive' : 'Stepping Stone'}
        </span>
      </div>

      <div className="space-y-3">
        {milestones.map((m, idx) => (
          <div
            key={m.id}
            className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 font-mono font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                {m.step}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950/40 px-2 py-0.5 rounded">
                    {m.timeframe}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">{m.title}</h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{m.action}</p>

                {m.legalAspects && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-900/40 px-2 py-0.5 rounded mt-1">
                    <Scale className="w-3 h-3 shrink-0" />
                    <span>{m.legalAspects}</span>
                  </div>
                )}
              </div>
            </div>

            {m.targetBudget !== undefined && (
              <div className="sm:text-right shrink-0 pl-11 sm:pl-0">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">
                  {isFr ? 'Palier d’épargne' : 'Savings target'}
                </span>
                <span className="text-sm sm:text-base font-mono font-bold text-slate-100">
                  {m.targetBudget.toLocaleString()} {sym}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
