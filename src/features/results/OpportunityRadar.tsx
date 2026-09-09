// src/features/results/OpportunityRadar.tsx
import React, { useMemo } from 'react';
import { SupportedLang } from '../../i18n';
import { Sparkles, ArrowRight, ExternalLink, Lightbulb, Compass, Award } from 'lucide-react';
import { detectOpportunities } from '../../services/ai/opportunityEngine';
import { UserContext } from '../../types/context';

interface OpportunityRadarProps {
  prompt: string;
  domain: any;
  budget?: number;
  targetCost?: number;
  lang: SupportedLang;
  currency?: string;
  context?: Partial<UserContext>;
}

export const OpportunityRadar: React.FC<OpportunityRadarProps> = ({
  prompt,
  domain,
  budget = 0,
  targetCost = 3000,
  lang,
  currency = 'EUR',
  context
}) => {
  const result = useMemo(() => {
    return detectOpportunities(prompt, domain, budget, targetCost, context);
  }, [prompt, domain, budget, targetCost, context]);

  if (!result.opportunities.length && !result.subsidiesAndGrants.length) {
    return null;
  }

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-indigo-950/30 to-slate-900/60 border border-indigo-500/20 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {lang === 'fr' ? 'Radar d’Opportunités & Aides Publiques' : 'Opportunity Radar & Grants'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pistes Inexplorées
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{result.headlineRecommendation}</p>
          </div>
        </div>
      </div>

      {/* Unconsidered Opportunities Cards */}
      {result.opportunities.length > 0 && (
        <div className="space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'fr' ? 'Leviers stratégiques identifiés' : 'Identified Strategic Levers'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.opportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {opp.badge || 'Opportunité'}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-400">
                      {opp.financialGainOrSaving}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100">{opp.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opp.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span>{opp.actionRequired}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subsidies & Public Aids */}
      {result.subsidiesAndGrants.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            {lang === 'fr' ? 'Dispositifs & Aides Financières Éligibles' : 'Eligible Financial Subsidies'}
          </span>
          <div className="space-y-2">
            {result.subsidiesAndGrants.map((aid, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{aid.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                      {aid.organization}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{aid.eligibilityCriteria}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-extrabold text-emerald-400 text-xs">{aid.estimatedAmount}</span>
                  <a
                    href={aid.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-colors"
                  >
                    <span>{lang === 'fr' ? 'Fiche officielle' : 'Official link'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3 Strategic Scenarios (Prudent, Normal, Ambitieux) */}
      <div className="pt-3 border-t border-slate-800/60 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {lang === 'fr' ? '3 Trajectoires Comparatives' : '3 Comparative Trajectories'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">{result.scenarios.prudent.title}</span>
              <span className="text-emerald-400 font-bold">
                {result.scenarios.prudent.cost.toLocaleString()} {currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {result.scenarios.prudent.description}
            </p>
            <span className="inline-block text-[10px] text-slate-500">
              Risque : {result.scenarios.prudent.risk}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-indigo-200">{result.scenarios.normal.title}</span>
              <span className="text-indigo-300 font-bold">
                {result.scenarios.normal.cost.toLocaleString()} {currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              {result.scenarios.normal.description}
            </p>
            <span className="inline-block text-[10px] text-indigo-400/80">
              Risque : {result.scenarios.normal.risk}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">{result.scenarios.ambitious.title}</span>
              <span className="text-amber-400 font-bold">
                {result.scenarios.ambitious.cost.toLocaleString()} {currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              {result.scenarios.ambitious.description}
            </p>
            <span className="inline-block text-[10px] text-slate-500">
              Risque : {result.scenarios.ambitious.risk}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
