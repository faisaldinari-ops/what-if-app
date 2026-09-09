// src/features/results/CopilotTrustStrip.tsx
import React, { useState } from 'react';
import { SupportedLang } from '../../i18n';
import { ShieldCheck, ExternalLink, ChevronDown, ChevronUp, Database, Cpu, Globe, Calculator, HelpCircle } from 'lucide-react';
import { ResearchFact } from '../../types/context';

interface CopilotTrustStripProps {
  facts?: ResearchFact[];
  lang: SupportedLang;
}

export const CopilotTrustStrip: React.FC<CopilotTrustStripProps> = ({ facts = [], lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Categorize tags
  const provenanceCategories = [
    {
      type: 'CALCULATION',
      label: lang === 'fr' ? 'Arithmétique pure' : 'Deterministic Math',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      icon: Calculator,
      desc: lang === 'fr' ? 'Écarts budgétaires, capacité d’épargne, formules financières.' : 'Formulas & cashflow algebra.'
    },
    {
      type: 'KNOWLEDGE',
      label: lang === 'fr' ? 'Indices officiels' : 'Official Benchmarks',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: Database,
      desc: lang === 'fr' ? 'Registres officiels, barèmes légaux et recherche web en direct.' : 'Official registries, legal benchmarks, and live search.'
    },
    {
      type: 'ESTIMATION',
      label: lang === 'fr' ? 'Fourchette prudente' : 'Conservative Estimates',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: Cpu,
      desc: lang === 'fr' ? 'Moyennes sectorielles observées sur le terrain.' : 'Industry median ranges.'
    },
    {
      type: 'ASSUMPTION',
      label: lang === 'fr' ? 'Hypothèses de travail' : 'Working Assumptions',
      badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      icon: HelpCircle,
      desc: lang === 'fr' ? 'Paramètres ajustables basés sur vos réponses.' : 'Adjustable parameters from your answers.'
    }
  ];

  return (
    <div className="w-full rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 transition-all">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                {lang === 'fr' ? 'Transparence & Traçabilité des Données' : 'Data Grounding & Transparency'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100 % Vérifiable
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'fr'
                ? 'Zéro hallucination : chaque chiffre est distingué entre calcul pur, indice certifié et estimation.'
                : 'Zero hallucinations: distinct separation between math, certified indices, and estimates.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-4 text-xs">
          {/* Provenance breakdown pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {provenanceCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.type}
                  className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-300 text-[11px]">{cat.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{cat.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Fact list if present */}
          {facts.length > 0 && (
            <div className="space-y-2 mt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {lang === 'fr' ? 'Sources et références appliquées à cette analyse :' : 'Sources applied to this analysis:'}
              </span>
              <div className="space-y-1.5">
                {facts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-950/30 border border-slate-800/40 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300 font-medium">{fact.label} :</span>
                      <span className="text-slate-200 font-bold">{fact.value}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                      <span>{fact.source}</span>
                      {fact.confidence === 'high' && (
                        <span className="text-emerald-400 font-bold">✓ Certifié</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
