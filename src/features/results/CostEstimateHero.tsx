import React from 'react';
import { DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { Calculator, ArrowRight, Lightbulb, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CostEstimateHeroProps {
  analysis: DecisionAnalysis;
  coPilot?: CoPilotResponse;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const CostEstimateHero: React.FC<CostEstimateHeroProps> = ({
  analysis,
  coPilot,
  lang,
  currency
}) => {
  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                {lang === 'fr' ? 'ESTIMATION DE BUDGET' : 'BUDGET ESTIMATE'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {analysis.userInput.projectTitle.toUpperCase()}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl leading-relaxed">
              {coPilot?.whySummary || analysis.verdictSummary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col justify-center">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
              {coPilot?.headlineVerdict.split(':')[0] || (lang === 'fr' ? 'BUDGET DE DÉMARRAGE' : 'STARTUP BUDGET')}
            </span>
            <div className="text-3xl sm:text-4xl md:text-5xl font-mono font-black text-white tracking-tight">
              {coPilot?.headlineVerdict.split(':')[1]?.trim() || formatCurrency(analysis.metrics.budgetNeeded, currency)}
            </div>
          </div>
          
          <div className="p-5 rounded-2xl bg-indigo-900/10 border border-indigo-500/20 flex flex-col justify-center space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-indigo-300">
                {coPilot?.mainObstacle.title || (lang === 'fr' ? 'À retenir' : 'Key Takeaway')}
              </h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {coPilot?.mainObstacle.description || analysis.mainProblem.description}
            </p>
          </div>
        </div>
      </div>

      {/* KEY FIGURES */}
      {coPilot?.keyFigures && coPilot.keyFigures.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coPilot.keyFigures.map((kf, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{kf.label}</span>
              <span className={`text-lg font-bold ${kf.highlight ? 'text-indigo-400' : 'text-slate-200'}`}>
                {kf.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* OPTIONS */}
      {coPilot?.options && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {[
            { key: 'original', opt: coPilot.options.original, icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { key: 'reduced', opt: coPilot.options.reduced, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { key: 'minimal', opt: coPilot.options.minimal, icon: Lightbulb, color: 'text-indigo-400', bg: 'bg-indigo-400/10' }
          ].map(({ key, opt, icon: Icon, color, bg }) => (
            <div key={key} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{opt.name}</span>
                <div className={`p-1.5 rounded-lg ${bg} ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-mono font-bold text-slate-200">{opt.cost}</div>
              <p className="text-xs text-slate-400">{opt.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
