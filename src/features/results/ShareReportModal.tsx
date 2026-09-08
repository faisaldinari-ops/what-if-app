// src/features/results/ShareReportModal.tsx
import React, { useState } from 'react';
import { DecisionAnalysis } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { X, Copy, Check, Printer, Share2, Sparkles, ShieldCheck } from 'lucide-react';

interface ShareReportModalProps {
  analysis: DecisionAnalysis;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onClose: () => void;
}

export const ShareReportModal: React.FC<ShareReportModalProps> = ({
  analysis,
  lang,
  currency,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const { userInput, verdictTitle, score, verdictSummary, metrics, mainProblem, actionPlan } = analysis;

  const formattedReportText = `=== RAPPORT DE FAISABILITÉ WHAT IF? ===
Projet : ${userInput.projectTitle}
Score de faisabilité : ${score}/100 — ${verdictTitle}

DIAGNOSTIC :
${verdictSummary}

CHIFFRES CLÉS :
- Budget disponible : ${formatCurrency(metrics.budgetAvailable, currency)}
- Budget nécessaire : ${formatCurrency(metrics.budgetNeeded, currency)}
- Écart : ${metrics.gap >= 0 ? '+' : ''}${formatCurrency(metrics.gap, currency)}
- Marge nette mensuelle : ${metrics.monthlyMargin >= 0 ? '+' : ''}${formatCurrency(metrics.monthlyMargin, currency)}/mois
- Délai réaliste : ${metrics.realisticMonths} mois
- Réserve recommandée : ${formatCurrency(metrics.safetyReserveRecommended, currency)}

OBSTACLE PRINCIPAL :
${mainProblem.title} : ${mainProblem.description}

PLAN D’ACTION RECOMMANDÉ :
${actionPlan.map(s => `${s.step}. ${s.title} (${s.subtitle})\n   -> ${s.description}`).join('\n\n')}

Généré par WHAT IF? — Copilote de décision & simulations déterministes.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedReportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-left">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
              ?
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {lang === 'fr' ? 'Rapport de synthèse WHAT IF?' : 'WHAT IF? Feasibility Report'}
              </h3>
              <p className="text-xs text-slate-400">{userInput.projectTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* Verdict Banner */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {verdictTitle}
              </span>
              <span className="text-sm font-black text-white font-mono">{score}/100</span>
            </div>
            <p className="text-white font-medium text-sm">{verdictSummary}</p>
          </div>

          {/* Key Numbers Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Budget dispo</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(metrics.budgetAvailable, currency)}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Nécessaire</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(metrics.budgetNeeded, currency)}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Écart</span>
              <span
                className={`font-mono font-bold text-sm ${
                  metrics.gap >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {metrics.gap >= 0 ? '+' : ''}
                {formatCurrency(metrics.gap, currency)}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Marge mensuelle</span>
              <span className="font-mono font-bold text-white text-sm">
                {metrics.monthlyMargin >= 0 ? '+' : ''}
                {formatCurrency(metrics.monthlyMargin, currency)}/mois
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Délai réaliste</span>
              <span className="font-mono font-bold text-white text-sm">
                {metrics.realisticMonths} mois
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
              <span className="text-[10px] text-slate-400 uppercase block">Réserve conseillée</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(metrics.safetyReserveRecommended, currency)}
              </span>
            </div>
          </div>

          {/* Action Plan steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {lang === 'fr' ? 'Plan d’action en 5 étapes' : '5-Step Action Roadmap'}
            </h4>
            <div className="space-y-2">
              {actionPlan.map(s => (
                <div key={s.step} className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-mono">
                      {s.step}
                    </span>
                    <span>{s.title}</span>
                  </div>
                  <p className="text-slate-400 text-xs pl-7">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>{lang === 'fr' ? 'Imprimer / Exporter PDF' : 'Print / Export PDF'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (lang === 'fr' ? 'Rapport copié !' : 'Copied!') : (lang === 'fr' ? 'Copier le texte complet' : 'Copy Full Text')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
