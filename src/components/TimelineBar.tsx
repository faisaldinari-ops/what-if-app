// src/components/TimelineBar.tsx
import React from 'react';
import { Clock, GitBranch } from 'lucide-react';
import { SupportedLang, translations } from '../i18n';

export interface TimelinePoint {
  m: number;
  key: 'today' | 'm3' | 'm6' | 'm12' | 'm36' | 'm60';
}

export const TIMELINE_CHECKPOINTS: TimelinePoint[] = [
  { m: 0, key: 'today' },
  { m: 3, key: 'm3' },
  { m: 6, key: 'm6' },
  { m: 12, key: 'm12' },
  { m: 36, key: 'm36' },
  { m: 60, key: 'm60' }
];

interface TimelineBarProps {
  selectedMonth: number;
  onSelectMonth: (m: number) => void;
  lang: SupportedLang;
  onOpenForkModal?: () => void;
}

export const TimelineBar: React.FC<TimelineBarProps> = ({
  selectedMonth,
  onSelectMonth,
  lang,
  onOpenForkModal
}) => {
  const t = translations[lang];

  const getLabel = (pt: TimelinePoint) => {
    switch (pt.key) {
      case 'today':
        return t.timeline.today;
      case 'm3':
        return t.timeline.m3;
      case 'm6':
        return t.timeline.m6;
      case 'm12':
        return t.timeline.m12;
      case 'm36':
        return t.timeline.m36;
      case 'm60':
        return t.timeline.m60;
    }
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {t.timeline.label}
          </span>
          <span className="text-[11px] text-slate-400">
            ({t.timeline.checkpoint_desc} {selectedMonth === 0 ? t.timeline.today : `${selectedMonth} ${t.metrics.months}`})
          </span>
        </div>

        {onOpenForkModal && (
          <button
            id="timeline-fork-button"
            onClick={onOpenForkModal}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-700/60 bg-indigo-950/50 hover:bg-indigo-900 text-indigo-300 transition-colors w-fit"
            title={t.fork.fork_button}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{t.fork.fork_button} ({selectedMonth === 0 ? t.timeline.today : `${selectedMonth}M`})</span>
          </button>
        )}
      </div>

      {/* Segmented Timeline Buttons */}
      <div className="grid grid-cols-6 gap-1 sm:gap-2">
        {TIMELINE_CHECKPOINTS.map(pt => {
          const isSelected = selectedMonth === pt.m;
          return (
            <button
              key={pt.m}
              id={`timeline-checkpoint-${pt.m}`}
              onClick={() => onSelectMonth(pt.m)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all text-center ${
                isSelected
                  ? 'bg-indigo-600 text-white font-bold shadow-md ring-2 ring-indigo-400/40'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80'
              }`}
            >
              <span className="text-xs sm:text-sm">{getLabel(pt)}</span>
              <span className={`text-[9px] uppercase tracking-wider mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                {pt.m === 0 ? 'M0' : `${pt.m}m`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
