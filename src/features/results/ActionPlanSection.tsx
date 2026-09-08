// src/features/results/ActionPlanSection.tsx
import React from 'react';
import { ActionPlanStep } from '../../types/decision';
import { SupportedLang } from '../../i18n';
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface ActionPlanSectionProps {
  steps: ActionPlanStep[];
  lang: SupportedLang;
}

export const ActionPlanSection: React.FC<ActionPlanSectionProps> = ({ steps, lang }) => {
  return (
    <div className="space-y-4 text-left">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/50 border border-indigo-800/40 text-[11px] font-bold text-indigo-300">
          <Sparkles className="w-3 h-3" />
          <span>{lang === 'fr' ? 'Plan d’action concret' : lang === 'es' ? 'Plan de acción concreto' : 'Action Roadmap'}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {lang === 'fr'
            ? 'Voici comment tu peux le faire'
            : lang === 'es'
            ? 'Cómo puedes llevarlo a cabo paso a paso'
            : 'How you can make it happen step by step'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400">
          {lang === 'fr'
            ? 'La stratégie chronologique recommandée pour lancer ton projet sans mettre tes finances en danger.'
            : lang === 'es'
            ? 'La secuencia cronológica recomendada para arrancar sin poner en riesgo tu estabilidad.'
            : 'The recommended chronological sequence to launch without risking personal financial solvency.'}
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((st, idx) => (
          <div
            key={st.step}
            className="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-colors space-y-2.5 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs flex items-center justify-center shadow-sm">
                  {st.step}
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {st.title}
                </h4>
              </div>

              {st.impact && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 self-start sm:self-auto">
                  {st.impact}
                </span>
              )}
            </div>

            {st.subtitle && (
              <p className="text-xs sm:text-sm font-semibold text-slate-300 pl-10">
                {st.subtitle}
              </p>
            )}

            <p className="text-xs text-slate-400 pl-10 leading-relaxed font-normal">
              {st.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
