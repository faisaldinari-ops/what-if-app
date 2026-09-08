// src/features/results/RecommendationCard.tsx
import React from 'react';
import { SupportedLang } from '../../i18n';
import { Compass, Lightbulb, ShieldCheck } from 'lucide-react';

interface RecommendationCardProps {
  recommendationText: string;
  lang: SupportedLang;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendationText,
  lang
}) => {
  const isFr = lang === 'fr';

  return (
    <div className="w-full rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-950 p-6 text-left space-y-2">
      <div className="flex items-center gap-2 text-indigo-400">
        <Lightbulb className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider">
          {isFr ? 'Ce que je te recommande (Priorités)' : 'What I Recommend (Priorities)'}
        </h3>
      </div>
      <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
        {recommendationText}
      </p>
    </div>
  );
};
