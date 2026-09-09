// src/features/results/AdaptiveVerdictHero.tsx
import React from 'react';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { AdaptiveLevel1Summary } from '../../services/ai/adaptiveDepthEngine';
import {
  Sparkles,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  PiggyBank,
  ChevronRight,
  Layers,
  CalendarCheck
} from 'lucide-react';

interface AdaptiveVerdictHeroProps {
  summary: AdaptiveLevel1Summary;
  projectTitle: string;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onExecutePrimaryAction: () => void;
  onExecuteSecondaryAction: () => void;
  onOpenSavingsFinder: () => void;
  onOpenFullFinancials: () => void;
  onScrollToSection: (sectionId: string) => void;
}

const ICON_CARD_MAP: Record<string, any> = {
  Briefcase,
  ShieldCheck,
  PiggyBank
};

export const AdaptiveVerdictHero: React.FC<AdaptiveVerdictHeroProps> = ({
  summary,
  projectTitle,
  lang,
  onExecutePrimaryAction,
  onExecuteSecondaryAction,
  onOpenSavingsFinder,
  onOpenFullFinancials,
  onScrollToSection
}) => {
  const badgeColors = {
    emerald: {
      pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      accentBorder: 'border-emerald-500/30',
      glow: 'from-emerald-500/10 via-slate-900 to-slate-950'
    },
    amber: {
      pill: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400',
      accentBorder: 'border-amber-500/30',
      glow: 'from-amber-500/10 via-slate-900 to-slate-950'
    },
    indigo: {
      pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      dot: 'bg-indigo-400',
      accentBorder: 'border-indigo-500/30',
      glow: 'from-indigo-500/10 via-slate-900 to-slate-950'
    },
    rose: {
      pill: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
      accentBorder: 'border-rose-500/30',
      glow: 'from-rose-500/10 via-slate-900 to-slate-950'
    }
  }[summary.badgeStyle];

  return (
    <div className="w-full space-y-6 text-left">
      {/* 5-SECOND HERO CONTAINER */}
      <div
        className={`w-full rounded-3xl border ${badgeColors.accentBorder} bg-gradient-to-b ${badgeColors.glow} p-6 sm:p-8 md:p-10 shadow-xl relative overflow-hidden`}
      >
        {/* Top project tag & category badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {projectTitle}
            </span>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline-block">
              • {summary.depthLabel}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${badgeColors.pill}`}
          >
            <span className={`w-2 h-2 rounded-full ${badgeColors.dot} animate-pulse`} />
            <span>
              {lang === 'fr'
                ? 'Verdict calculé en direct'
                : lang === 'es'
                ? 'Veredicto calculado'
                : 'Live Calculated Verdict'}
            </span>
          </div>
        </div>

        {/* 1. Main Verdict & Human Explanation */}
        <div className="pt-6 pb-6 space-y-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {summary.headlineVerdict}
          </h1>

          {/* 16px to 18px comfortable body text */}
          <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl font-medium">
            {summary.humanExplanation}
          </p>
        </div>

        {/* 2. Key Figure Spotlight (The 1 key number needed) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 pb-6">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 shadow-inner md:col-span-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
                {summary.keyFigure.label}
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-white tracking-tight">
              {summary.keyFigure.value}
            </div>
            {summary.keyFigure.subtext && (
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {summary.keyFigure.subtext}
              </p>
            )}
          </div>

          {/* Quick jump to actionable sections */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'fr' ? 'Navigation directe' : 'Jump directly'}
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onScrollToSection('action-plan-section')}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{lang === 'fr' ? '1. Plan d’action' : '1. Action plan'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onScrollToSection('opportunity-radar-section')}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{lang === 'fr' ? '2. Aides & Subventions' : '2. Grants & Subsidies'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={onOpenFullFinancials}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-xs sm:text-sm font-semibold text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{lang === 'fr' ? '3. Détails financiers' : '3. Full Financials'}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Primary & Secondary CTA Buttons (The next steps) */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          <button
            type="button"
            onClick={onExecutePrimaryAction}
            className="flex-1 min-h-[50px] px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <span>{summary.primaryAction.label}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {summary.secondaryAction && (
            <button
              type="button"
              onClick={onExecuteSecondaryAction}
              className="min-h-[50px] px-6 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-sm sm:text-base border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{summary.secondaryAction.label}</span>
            </button>
          )}
        </div>
      </div>

      {/* ENTREPRENEUR MODE: 3 STRUCTURED CARDS (Statut, Matériel, Aides) */}
      {summary.entrepreneurCards && summary.entrepreneurCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              {lang === 'fr'
                ? 'Piliers clés pour réussir ton lancement professionnel'
                : 'Key Pillars for Business Launch'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.entrepreneurCards.map((card, idx) => {
              const Icon = ICON_CARD_MAP[card.icon] || Briefcase;
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {card.badge}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white pt-1">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-300 font-medium">
                      {card.subtitle}
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300 pt-2 border-t border-slate-800/80">
                    {card.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SIMPLE MODE: 3 MILESTONES / HORIZON PROJECTION */}
      {summary.simpleMilestones && summary.simpleMilestones.length > 0 && !summary.entrepreneurCards && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
              {lang === 'fr'
                ? 'Calendrier de réalisation réaliste'
                : 'Realistic Project Timeline'}
            </h2>
            <button
              onClick={onOpenSavingsFinder}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {lang === 'fr' ? 'Modifier mes économies' : 'Adjust savings'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summary.simpleMilestones.map((m, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs text-indigo-400 font-bold">
                  <span>{m.timing}</span>
                  <span>Étape {idx + 1}</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-100">
                  {m.stepTitle}
                </div>
                <p className="text-xs sm:text-sm text-slate-400 leading-normal">
                  {m.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
