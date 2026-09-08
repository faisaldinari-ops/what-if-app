// src/features/results/FeasibilityHero.tsx
import React from 'react';
import { FeasibilityVerdict } from '../../types/decision';
import { SupportedLang } from '../../i18n';
import { CheckCircle2, AlertTriangle, XCircle, Info, Sparkles } from 'lucide-react';

interface FeasibilityHeroProps {
  verdict: FeasibilityVerdict;
  verdictTitle: string;
  verdictSummary: string;
  score: number;
  projectTitle: string;
  lang: SupportedLang;
}

export const FeasibilityHero: React.FC<FeasibilityHeroProps> = ({
  verdict,
  verdictTitle,
  verdictSummary,
  score,
  projectTitle,
  lang
}) => {
  // Styling according to verdict
  const config = {
    feasible: {
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      textColor: 'text-emerald-400',
      icon: CheckCircle2,
      ringColor: 'stroke-emerald-500',
      label:
        lang === 'fr'
          ? 'Ton projet semble réalisable'
          : lang === 'es'
          ? 'Tu proyecto parece viable'
          : 'Your project appears feasible'
    },
    conditional: {
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      textColor: 'text-amber-400',
      icon: AlertTriangle,
      ringColor: 'stroke-amber-500',
      label:
        lang === 'fr'
          ? 'Ton projet est faisable sous conditions'
          : lang === 'es'
          ? 'Tu proyecto es viable bajo condiciones'
          : 'Your project is conditionally feasible'
    },
    too_risky: {
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      textColor: 'text-rose-400',
      icon: XCircle,
      ringColor: 'stroke-rose-500',
      label:
        lang === 'fr'
          ? 'Trop risqué dans les conditions actuelles'
          : lang === 'es'
          ? 'Demasiado riesgoso en las condiciones actuales'
          : 'Currently too risky as structured'
    }
  }[verdict];

  const IconComponent = config.icon;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 sm:p-8 space-y-6 shadow-xl text-left">
      {/* Top project breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          {projectTitle}
        </span>
        <span className="text-[11px] text-slate-400">
          {lang === 'fr'
            ? 'Score indicatif calculé'
            : lang === 'es'
            ? 'Puntuación indicativa'
            : 'Indicative Calculated Score'}
        </span>
      </div>

      {/* Main Verdict & Score Presentation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${config.badgeBg}`}
          >
            <IconComponent className="w-4 h-4" />
            <span>{verdictTitle}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {config.label}
          </h2>
        </div>

        {/* Circular Score Gauge */}
        <div className="flex items-center gap-4 self-start sm:self-center bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 pr-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className={`${config.ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="absolute font-mono font-black text-base text-white">{score}</span>
          </div>

          <div className="text-left">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
              {lang === 'fr' ? 'Faisabilité' : lang === 'es' ? 'Viabilidad' : 'Feasibility'}
            </span>
            <span className="text-lg font-black text-white">{score}/100</span>
          </div>
        </div>
      </div>

      {/* "Pourquoi ?" Section (Max 3 clear human sentences) */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>{lang === 'fr' ? 'Pourquoi ?' : lang === 'es' ? '¿Por qué?' : 'Why?'}</span>
        </h3>
        <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
          {verdictSummary}
        </p>
      </div>
    </div>
  );
};
