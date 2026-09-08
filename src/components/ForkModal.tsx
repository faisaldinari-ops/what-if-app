// src/components/ForkModal.tsx
import React, { useState } from 'react';
import { GitBranch, X, Check, ArrowRight } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, forkSimulation, ScenarioType, SimResultPoint } from '../logic/engine';

interface ForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  simData: SimData;
  checkpointMonth: number;
  expectedPointCash: number;
  onConfirmFork: (forkedData: SimData) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const ForkModal: React.FC<ForkModalProps> = ({
  isOpen,
  onClose,
  simData,
  checkpointMonth,
  expectedPointCash,
  onConfirmFork,
  lang,
  currency
}) => {
  if (!isOpen) return null;

  const t = translations[lang];
  const [forkName, setForkName] = useState(
    `${simData.name} — Branch @ ${checkpointMonth === 0 ? 'Today' : `${checkpointMonth}m`}`
  );

  const handleConfirm = () => {
    const forked = forkSimulation(simData, checkpointMonth, expectedPointCash, forkName.trim());
    onConfirmFork(forked);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">{t.fork.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            {t.fork.subtitle}
          </p>

          <div className="p-3.5 rounded-xl border border-indigo-900/60 bg-indigo-950/30 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Fork point:</span>
              <strong className="text-white">
                {checkpointMonth === 0 ? t.timeline.today : `${checkpointMonth} ${t.metrics.months}`}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Inherited cash:</span>
              <strong className="text-emerald-400 font-bold">
                {formatCurrency(expectedPointCash, currency, lang)}
              </strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fork-name-input" className="font-semibold text-slate-200">
              {t.fork.name_label}
            </label>
            <input
              id="fork-name-input"
              type="text"
              value={forkName}
              onChange={e => setForkName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold"
          >
            {t.ui.cancel}
          </button>
          <button
            id="confirm-fork-btn"
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{t.fork.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
