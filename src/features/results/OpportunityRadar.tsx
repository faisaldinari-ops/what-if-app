// src/features/results/OpportunityRadar.tsx
import React, { useState, useMemo } from 'react';
import { SupportedLang } from '../../i18n';
import {
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lightbulb,
  Compass,
  Award,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  FileText,
  Clock,
  ShieldCheck,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  DollarSign,
  Building2,
  Calendar
} from 'lucide-react';
import { detectOpportunities } from '../../services/ai/opportunityEngine';
import { UserContext } from '../../types/context';
import {
  BenefitOpportunity,
  EligibilityStatus,
  OpportunityCategory,
  UserOpportunityProfile
} from '../../types/opportunities';

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
  targetCost = 0,
  lang,
  currency = 'EUR',
  context
}) => {
  // Local interactive profile overrides
  const [profileOverride, setProfileOverride] = useState<UserOpportunityProfile>({
    employmentStatus: undefined,
    ageRange: undefined,
    locationType: undefined
  });

  // Modal / Detail drawer state
  const [selectedOpportunity, setSelectedOpportunity] = useState<BenefitOpportunity | null>(null);

  // Category filter for "All opportunities"
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showAllOpportunities, setShowAllOpportunities] = useState<boolean>(false);

  // Combined context
  const mergedContext = useMemo(() => {
    return {
      ...context,
      ...profileOverride
    };
  }, [context, profileOverride]);

  const result = useMemo(() => {
    return detectOpportunities(prompt, domain, budget, targetCost, mergedContext);
  }, [prompt, domain, budget, targetCost, mergedContext]);

  if (!result.topOpportunities?.length && !result.opportunities?.length && !result.subsidiesAndGrants?.length) {
    return null;
  }

  // Filter all opportunities by category
  const filteredAllOpportunities = useMemo(() => {
    if (!result.allOpportunities) return [];
    if (activeCategoryFilter === 'all') return result.allOpportunities;
    return result.allOpportunities.filter(o => o.category === activeCategoryFilter);
  }, [result.allOpportunities, activeCategoryFilter]);

  const getStatusBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'PROBABLEMENT_ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            {lang === 'fr' ? 'Éligible probablement' : 'Likely Eligible'}
          </span>
        );
      case 'A_VERIFIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            {lang === 'fr' ? 'À vérifier' : 'To Verify'}
          </span>
        );
      case 'INFOS_MANQUANTES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <HelpCircle className="w-3 h-3 text-sky-400" />
            {lang === 'fr' ? 'Infos manquantes' : 'Missing Info'}
          </span>
        );
      case 'NON_ELIGIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3 text-slate-500" />
            {lang === 'fr' ? 'Non éligible' : 'Not Eligible'}
          </span>
        );
    }
  };

  const getCategoryLabel = (category: OpportunityCategory) => {
    switch (category) {
      case 'aide_publique': return 'Aide Publique / Subvention';
      case 'exoneration_fiscale': return 'Exonération / Fiscalité';
      case 'pret_aide': return 'Prêt d’Honneur / 0%';
      case 'reduction_materiel': return 'Matériel & Leasing';
      case 'dispositif_jeune_emploi': return 'Dispositif Emploi / Jeunes';
      case 'accompagnement_gratuit': return 'Conseil Public Gratuit';
      case 'formation_financee': return 'Formation Financée';
      case 'aide_logement_mobilite': return 'Logement & Mobilité';
      case 'alternative_gratuite': return 'Bon Plan / Gratuit';
      default: return 'Dispositif Aidé';
    }
  };

  return (
    <div className="w-full rounded-2xl bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-950 border border-indigo-500/25 p-5 sm:p-6 space-y-6 shadow-xl relative overflow-hidden">
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Compass className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                {lang === 'fr' ? 'Moteur d’Aides, Financements & Opportunités' : 'Opportunities, Grants & Benefits Engine'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 text-emerald-300 border border-emerald-500/30">
                Score Opportunité : {result.opportunityScore || 85}/100
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {result.headlineRecommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Profile Refiner: Let user refine status in 1 click */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            {lang === 'fr' ? 'Personnalisez votre éligibilité en 1 clic :' : 'Refine your eligibility in 1 click:'}
          </span>
          <span className="text-[10px] text-slate-500">Mise à jour en direct des critères</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Jobseeker Toggle */}
          <button
            onClick={() =>
              setProfileOverride(prev => ({
                ...prev,
                employmentStatus: prev.employmentStatus === 'jobseeker' ? undefined : 'jobseeker'
              }))
            }
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              profileOverride.employmentStatus === 'jobseeker'
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <span>Demandeur d’emploi (France Travail)</span>
            {profileOverride.employmentStatus === 'jobseeker' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Under 26 Toggle */}
          <button
            onClick={() =>
              setProfileOverride(prev => ({
                ...prev,
                ageRange: prev.ageRange === 'under_26' ? undefined : 'under_26'
              }))
            }
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              profileOverride.ageRange === 'under_26'
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <span>Moins de 26 ans</span>
            {profileOverride.ageRange === 'under_26' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          {/* Rural / ZRR / QPV Toggle */}
          <button
            onClick={() =>
              setProfileOverride(prev => ({
                ...prev,
                locationType: prev.locationType === 'rural_zrr' ? undefined : 'rural_zrr'
              }))
            }
            className={`px-3 py-1.5 rounded-lg border font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              profileOverride.locationType === 'rural_zrr'
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <span>Zone rurale (FRR / ZRR) ou Zone Franche</span>
            {profileOverride.locationType === 'rural_zrr' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Caution Alert: "Ne paie pas avant d'avoir vérifié" (Section 9) */}
      {result.cautionAlert && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-start gap-3 relative z-10">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-extrabold text-amber-300 text-xs sm:text-sm">
              {result.cautionAlert.title}
            </h4>
            <p className="text-amber-200/90 leading-relaxed">
              {result.cautionAlert.message}
            </p>
            <div className="pt-1 font-bold text-amber-400 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{result.cautionAlert.actionBeforeSpending}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section 10: Vrai Budget après Optimisation */}
      {result.budgetOptimization && (
        <div className="p-5 rounded-xl bg-slate-950/70 border border-indigo-500/20 space-y-4 relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'fr' ? 'Optimisation du Budget & Reste à Financer' : 'Optimized Budget & Remaining Balance'}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {Math.round(result.budgetOptimization.confirmedGrants + result.budgetOptimization.probableSavings).toLocaleString()} {currency} d’allègement potentiel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Budget Initial */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">1. Coût Initial Brut</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-200">
                {result.budgetOptimization.initialBudgetNeeded.toLocaleString()} {currency}
              </span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Sans optimisation</span>
            </div>

            {/* 2. Aides directes */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 block font-medium">2. Aides & Subventions</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-400">
                - {result.budgetOptimization.confirmedGrants.toLocaleString()} {currency}
              </span>
              <span className="text-[9px] text-emerald-500 block mt-0.5">Non remboursables</span>
            </div>

            {/* 3. Économies & Exonérations */}
            <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/30">
              <span className="text-[10px] text-indigo-300 block font-medium">3. Économies / Exonérations</span>
              <span className="text-sm sm:text-base font-extrabold text-indigo-300">
                - {result.budgetOptimization.probableSavings.toLocaleString()} {currency}
              </span>
              <span className="text-[9px] text-indigo-400 block mt-0.5">Charges & Matériel</span>
            </div>

            {/* 4. Reste Net à Financer */}
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-400/40">
              <span className="text-[10px] text-indigo-200 block font-bold">4. Reste Net à Financer</span>
              <span className="text-sm sm:text-base font-black text-white">
                {result.budgetOptimization.optimizedNetRemaining.toLocaleString()} {currency}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold block mt-0.5">Effort réel réduit</span>
            </div>
          </div>

          {/* Breakdown tags */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-slate-500 font-semibold">Répartition certifiée :</span>
            {result.budgetOptimization.breakdown.confirmed.map((item, idx) => (
              <span key={`conf-${idx}`} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ {item.label} (-{item.amount.toLocaleString()} {currency})
              </span>
            ))}
            {result.budgetOptimization.breakdown.probable.map((item, idx) => (
              <span key={`prob-${idx}`} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                ~ {item.label} (-{item.amount.toLocaleString()} {currency})
              </span>
            ))}
            {result.budgetOptimization.breakdown.toVerify.map((item, idx) => (
              <span key={`verif-${idx}`} className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ? {item.label} (À vérifier)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Section 15: Combination Engine (Combinaison Gagnante) */}
      {result.combinationStrategy && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-indigo-950/30 via-slate-950 to-indigo-950/30 border border-indigo-500/30 space-y-4 relative z-10">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs sm:text-sm font-extrabold text-white">
              {result.combinationStrategy.title}
            </h4>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {result.combinationStrategy.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {result.combinationStrategy.combinedSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2 text-xs"
              >
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block mb-1">
                    Étape {step.stepNumber}
                  </span>
                  <h5 className="font-bold text-slate-100 text-xs leading-snug">{step.title}</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight pt-1 border-t border-slate-800">
                  {step.impact}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
            <span className="font-bold text-slate-300 block">Règles de compatibilité et de cumul :</span>
            <ul className="space-y-1 text-slate-400">
              {result.combinationStrategy.compatibilityRules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Top Opportunités (Section 12 & 17) */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-indigo-400" />
            {lang === 'fr' ? 'Top Opportunités Identifiées' : 'Top Identified Opportunities'}
          </span>
          <span className="text-[11px] text-slate-400">Classées par potentiel & probabilité</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {result.topOpportunities.map((opp) => (
            <div
              key={opp.id}
              onClick={() => setSelectedOpportunity(opp)}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900/80 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(opp.eligibilityStatus)}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
                      {getCategoryLabel(opp.category)}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {opp.potentialValue}
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                  {opp.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium truncate max-w-[60%]">
                  {opp.officialSource}
                </span>
                <span className="text-indigo-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Voir démarches</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button to view all opportunities and filter by category */}
      {result.allOpportunities && result.allOpportunities.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 relative z-10">
          <button
            onClick={() => setShowAllOpportunities(prev => !prev)}
            className="w-full py-3 px-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-200 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>
                {showAllOpportunities
                  ? (lang === 'fr' ? 'Masquer le catalogue complet' : 'Hide complete catalog')
                  : (lang === 'fr'
                      ? `Voir toutes les aides et opportunités (${result.allOpportunities.length} répertoriées)`
                      : `View all grants and opportunities (${result.allOpportunities.length} listed)`)}
              </span>
            </span>
            {showAllOpportunities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAllOpportunities && (
            <div className="space-y-3 pt-4">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Toutes les aides' },
                  { id: 'aide_publique', label: 'Subventions publiques' },
                  { id: 'exoneration_fiscale', label: 'Exonérations & Charges' },
                  { id: 'pret_aide', label: 'Prêts 0% & Financements' },
                  { id: 'reduction_materiel', label: 'Matériel & Leasing' },
                  { id: 'alternative_gratuite', label: 'Outils gratuits' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium text-[11px] transition-all cursor-pointer ${
                      activeCategoryFilter === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filtered Grid */}
              <div className="space-y-2">
                {filteredAllOpportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOpportunity(opp)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(opp.eligibilityStatus)}
                        <span className="font-bold text-slate-200">{opp.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                          {opp.officialSource}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{opp.description}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <span className="font-extrabold text-emerald-400 text-xs">
                        {opp.potentialValue}
                      </span>
                      <span className="text-[11px] text-indigo-400 font-bold flex items-center gap-1">
                        <span>Détails</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3 Strategic Scenarios (Section 16: Minimum Cash, Prudent, Accéléré) */}
      <div className="pt-3 border-t border-slate-800/60 space-y-2.5 relative z-10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {lang === 'fr' ? '3 Trajectoires Comparatives (Section 16)' : '3 Comparative Trajectories'}
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

      {/* DETAILED MODAL / OPPORTUNITY DRAWER */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedOpportunity.eligibilityStatus)}
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {getCategoryLabel(selectedOpportunity.category)}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Score : {selectedOpportunity.opportunityScore}/100
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white pt-1">{selectedOpportunity.name}</h3>
                <p className="text-xs text-slate-300">{selectedOpportunity.description}</p>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Value Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-indigo-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Valeur financière potentielle
                </span>
                <span className="text-base sm:text-lg font-extrabold text-white">
                  {selectedOpportunity.potentialValue}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Délai estimé</span>
                <span className="text-xs font-bold text-slate-200">{selectedOpportunity.estimatedTime}</span>
              </div>
            </div>

            {/* Why Relevant */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                Pourquoi ce dispositif vous concerne :
              </span>
              <p className="text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                {selectedOpportunity.whyRelevant}
              </p>
            </div>

            {/* Eligibility Conditions Checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Conditions d’éligibilité :
              </span>
              <ul className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-slate-300">
                {selectedOpportunity.eligibilityConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Information if any */}
            {selectedOpportunity.missingInformation.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Informations à préciser pour confirmer l’accès :
                </span>
                <ul className="space-y-1 bg-amber-950/20 p-3 rounded-lg border border-amber-500/30 text-amber-200">
                  {selectedOpportunity.missingInformation.map((info, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Documents */}
            {selectedOpportunity.requiredDocuments.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Pièces justificatives requises :
                </span>
                <ul className="space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-slate-300">
                  {selectedOpportunity.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-indigo-400">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next step & Where to apply */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  Organisme instructeur :
                </span>
                <span className="text-slate-300 font-medium">{selectedOpportunity.whereToApply}</span>
              </div>
              <div className="pt-2 border-t border-indigo-500/20">
                <span className="font-bold text-indigo-300 block mb-0.5">Prochaine action recommandée :</span>
                <p className="text-slate-300">{selectedOpportunity.nextStep}</p>
              </div>
            </div>

            {/* Modal Footer with Official Link */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Source officielle vérifiée ({selectedOpportunity.retrievedAt})</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedOpportunity(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <a
                  href={selectedOpportunity.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                >
                  <span>Accéder au site officiel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
