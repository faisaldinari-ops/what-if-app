// src/features/results/CriticAuditCard.tsx
import React, { useMemo } from 'react';
import { SupportedLang } from '../../i18n';
import { UserExtractedData, DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { auditDecisionAnalysisDeterministically } from '../../services/ai/criticAgent';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';

interface CriticAuditCardProps {
  input: UserExtractedData;
  analysis: DecisionAnalysis;
  coPilot?: CoPilotResponse;
  lang: SupportedLang;
}

export const CriticAuditCard: React.FC<CriticAuditCardProps> = ({
  input,
  analysis,
  coPilot,
  lang
}) => {
  const audit = useMemo(() => {
    return auditDecisionAnalysisDeterministically(input, analysis, coPilot);
  }, [input, analysis, coPilot]);

  return (
    <div className="w-full rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                {lang === 'fr' ? 'Audit de Rigueur de l’Agent Critique' : 'Critic Agent Sanity Audit'}
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  audit.isPassed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {audit.score}/100 • {audit.isPassed ? (lang === 'fr' ? 'Conforme' : 'Valid') : (lang === 'fr' ? 'Attention' : 'Caution')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{audit.auditSummary}</p>
          </div>
        </div>
      </div>

      {audit.issues.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/60">
          {audit.issues.map((iss, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                iss.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                  : iss.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                  : 'bg-slate-950/30 border-slate-800/60 text-slate-300'
              }`}
            >
              {iss.severity === 'critical' ? (
                <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : iss.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-bold text-[11px] block">{iss.message}</span>
                <span className="text-[10px] opacity-80 block">{iss.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
