// src/features/results/MainProblemCard.tsx
import React from 'react';
import { SupportedLang } from '../../i18n';
import { AlertCircle, Target } from 'lucide-react';

interface MainProblemCardProps {
  title: string;
  description: string;
  priorityLevel: 'critical' | 'warning' | 'info';
  lang: SupportedLang;
}

export const MainProblemCard: React.FC<MainProblemCardProps> = ({
  title,
  description,
  priorityLevel,
  lang
}) => {
  const badgeConfig = {
    critical: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    info: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
  }[priorityLevel];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 space-y-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-indigo-400" />
          {lang === 'fr'
            ? 'Le principal obstacle à lever'
            : lang === 'es'
            ? 'El principal obstáculo a superar'
            : 'Key Priority Bottleneck'}
        </span>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeConfig}`}>
          {lang === 'fr'
            ? 'Priorité n°1'
            : lang === 'es'
            ? 'Prioridad #1'
            : 'Top Priority'}
        </span>
      </div>

      <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h4>

      <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">{description}</p>
    </div>
  );
};
