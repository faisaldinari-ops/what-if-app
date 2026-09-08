// src/features/results/SmartCTASection.tsx
import React from 'react';
import { SmartCTAAction } from '../../types/planning';
import { SupportedLang } from '../../i18n';
import { Sparkles, ArrowRight, Clock, DollarSign, MapPin, Zap } from 'lucide-react';

interface SmartCTASectionProps {
  ctas: SmartCTAAction[];
  lang: SupportedLang;
  onExecuteCTA: (cta: SmartCTAAction) => void;
}

export const SmartCTASection: React.FC<SmartCTASectionProps> = ({
  ctas,
  lang,
  onExecuteCTA
}) => {
  if (!ctas || ctas.length === 0) return null;

  const isFr = lang === 'fr';

  const getIcon = (type: SmartCTAAction['actionType']) => {
    switch (type) {
      case 'FIND_CHEAPER':
      case 'REDUCE_BUDGET':
        return DollarSign;
      case 'WAIT_MONTHS':
        return Clock;
      case 'CHANGE_COUNTRY':
        return MapPin;
      case 'START_THIS_WEEK':
        return Zap;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="w-full rounded-3xl border border-indigo-900/40 bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-slate-950 p-5 sm:p-6 text-left space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          {isFr ? 'Explorer d’autres voies en 1 clic' : 'Explore alternative pathways in 1 click'}
        </h4>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {ctas.map(cta => {
          const IconComponent = getIcon(cta.actionType);
          return (
            <button
              key={cta.id}
              onClick={() => onExecuteCTA(cta)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900/90 hover:bg-indigo-600/20 text-slate-200 hover:text-white border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <IconComponent className="w-3.5 h-3.5 text-indigo-400" />
              <span>{cta.label}</span>
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
