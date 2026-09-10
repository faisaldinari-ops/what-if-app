// src/components/ui/TopBar.tsx
import React from 'react';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { FolderKanban, PlusCircle, Sparkles, Globe, Activity } from 'lucide-react';

interface TopBarProps {
  lang: SupportedLang;
  onSelectLang: (l: SupportedLang) => void;
  currency: SupportedCurrency;
  onSelectCurrency: (c: SupportedCurrency) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onNewProject?: () => void;
  hasActiveProject?: boolean;
  onOpenTelemetry?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  lang,
  onSelectLang,
  currency,
  onSelectCurrency,
  savedCount,
  onOpenSaved,
  onNewProject,
  hasActiveProject,
  onOpenTelemetry
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onNewProject}
            className="flex items-center gap-2 text-left group focus:outline-none"
            title="WHAT IF? — Accueil"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm group-hover:bg-indigo-500 transition-colors">
              ?
            </div>
            <div>
              <span className="font-black text-white text-sm sm:text-base tracking-tight group-hover:text-indigo-400 transition-colors">
                WHAT IF?
              </span>
              <span className="hidden md:inline-block ml-2 text-[11px] font-medium text-slate-400">
                {lang === 'fr'
                  ? 'Copilote de décision'
                  : lang === 'es'
                  ? 'Copiloto de decisiones'
                  : 'Decision Co-pilot'}
              </span>
            </div>
          </button>
        </div>

        {/* Right: Controls (Currency, Lang, Saved Projects, New) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currency}
              aria-label="Sélectionner la devise"
              onChange={e => onSelectCurrency(e.target.value as SupportedCurrency)}
              className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg px-2 sm:px-2.5 py-1.5 pr-5 sm:pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="GBP">GBP £</option>
              <option value="CHF">CHF</option>
            </select>
            <span className="pointer-events-none absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
              ▼
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={lang}
              aria-label="Sélectionner la langue"
              onChange={e => onSelectLang(e.target.value as SupportedLang)}
              className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-[11px] sm:text-xs font-semibold rounded-lg px-2 sm:px-2.5 py-1.5 pr-5 sm:pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors uppercase"
            >
              <option value="fr">FR</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
            <span className="pointer-events-none absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">
              ▼
            </span>
          </div>

          {/* Telemetry & Zero-Cost Observability */}
          {onOpenTelemetry && (
            <button
              onClick={onOpenTelemetry}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold transition-colors focus:outline-none cursor-pointer"
              title={lang === 'fr' ? 'Gouvernance & Coûts IA' : 'Cost & Telemetry'}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-[11px]">
                {lang === 'fr' ? 'Coût 0 €' : 'Zero Cost'}
              </span>
            </button>
          )}

          {/* Saved Projects Button */}
          <button
            onClick={onOpenSaved}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] sm:text-xs font-semibold transition-colors focus:outline-none"
            title={lang === 'fr' ? 'Mes projets' : lang === 'es' ? 'Mis proyectos' : 'My Projects'}
          >
            <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">
              {lang === 'fr' ? 'Mes projets' : lang === 'es' ? 'Mis proyectos' : 'My Projects'}
            </span>
            {savedCount > 0 && (
              <span className="ml-0.5 sm:ml-1 px-1.5 py-0.2 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] font-bold border border-indigo-500/40">
                {savedCount}
              </span>
            )}
          </button>

          {/* New Project (if active) */}
          {hasActiveProject && (
            <button
              onClick={onNewProject}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold transition-colors shadow-sm focus:outline-none shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lang === 'fr' ? 'Autre projet' : lang === 'es' ? 'Otro' : 'New'}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
