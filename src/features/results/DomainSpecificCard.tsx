// src/features/results/DomainSpecificCard.tsx
import React from 'react';
import { CoPilotResponse } from '../../types/planning';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { Plane, Compass, Building, Briefcase, Code, ShieldAlert, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';

interface DomainSpecificCardProps {
  coPilotData?: CoPilotResponse;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onSelectOption?: (optionName: string) => void;
}

export const DomainSpecificCard: React.FC<DomainSpecificCardProps> = ({
  coPilotData,
  lang,
  currency,
  onSelectOption
}) => {
  if (!coPilotData) return null;

  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'CHF';

  // 1. TRAVEL BREAKDOWN CARD (Section 10)
  if (coPilotData.domain === 'travel' && coPilotData.travelBreakdown) {
    const tb = coPilotData.travelBreakdown;
    return (
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isFr ? `Budget Détaillé : ${tb.destination}` : `Detailed Trip Budget: ${tb.destination}`}
              </h3>
              <p className="text-xs text-slate-400">
                {isFr ? `Calculé pour un séjour de ${tb.durationDays} jours` : `Calculated for a ${tb.durationDays}-day stay`}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {isFr ? 'Données réelles 2025/2026' : 'Real benchmark data'}
          </span>
        </div>

        {/* 3 Range Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isFr ? 'Budget Minimum' : 'Minimum Budget'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {tb.totalRange.min.toLocaleString()} {sym}
            </div>
            <p className="text-[11px] text-slate-400">
              {isFr ? 'Auberge de jeunesse / Konbini / Transports lents' : 'Hostels & budget transit'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1 relative">
            <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
              {isFr ? 'Recommandé' : 'Recommended'}
            </div>
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              {isFr ? 'Budget Réaliste' : 'Realistic Budget'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-indigo-200 font-mono">
              {tb.totalRange.realistic.toLocaleString()} {sym}
            </div>
            <p className="text-[11px] text-indigo-300/80">
              {isFr ? 'Hôtel 3★ / Repas variés / Visites incontournables' : '3★ hotel & classic tours'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isFr ? 'Budget Confort' : 'Comfortable Budget'}
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
              {tb.totalRange.comfortable.toLocaleString()} {sym}
            </div>
            <p className="text-[11px] text-slate-400">
              {isFr ? 'Ryokan / 4-5★ / TGV express / Zéro contrainte' : '4-5★ & express travel'}
            </p>
          </div>
        </div>

        {/* Detailed Breakdown items */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {isFr ? 'Postes de dépenses estimés (Fourchette réaliste)' : 'Estimated spending categories'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Vols A/R' : 'Return flights'}</span>
              <span className="font-bold text-slate-100">{tb.flights.min} - {tb.flights.realistic} {sym}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Hébergement' : 'Accommodation'}</span>
              <span className="font-bold text-slate-100">{tb.accommodation.min} - {tb.accommodation.realistic} {sym}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Repas / Nourriture' : 'Food & Dining'}</span>
              <span className="font-bold text-slate-100">{tb.food.min} - {tb.food.realistic} {sym}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Transports locaux' : 'Local transport'}</span>
              <span className="font-bold text-slate-100">{tb.localTransport.min} - {tb.localTransport.realistic} {sym}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Activités & Visites' : 'Activities'}</span>
              <span className="font-bold text-slate-100">{tb.activities.min} - {tb.activities.realistic} {sym}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70">
              <span className="text-slate-400 block">{isFr ? 'Assurance & Réserve' : 'Insurance & Buffer'}</span>
              <span className="font-bold text-slate-100">{tb.safetyBuffer.realistic + tb.insuranceAndFormalities.realistic} {sym}</span>
            </div>
          </div>
        </div>

        {/* Distance / Gap advice */}
        {tb.monthsToSaveIfSaving && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs sm:text-sm text-emerald-200 flex items-center justify-between gap-3">
            <span>
              {isFr
                ? `💡 En économisant ${tb.monthsToSaveIfSaving.monthlySavings} ${sym}/mois, tu peux financer ce voyage dans environ ${tb.monthsToSaveIfSaving.monthsNeeded} mois.`
                : `💡 By saving ${tb.monthsToSaveIfSaving.monthlySavings} ${sym}/mo, you can fund this trip in ~${tb.monthsToSaveIfSaving.monthsNeeded} months.`}
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. RELOCATION SHORTLIST CARD (Section 11)
  if (coPilotData.relocationShortlist && coPilotData.relocationShortlist.length > 0) {
    const list = coPilotData.relocationShortlist;
    return (
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isFr ? 'Destinations Recommandées selon ton Profil' : 'Recommended Destinations for your Profile'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFr ? 'Sélectionnées selon la facilité d’installation et tes moyens' : 'Curated for ease of relocation and budget fit'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {isFr ? '3 Options Comparées' : '3 Options Compared'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.flag}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-black text-white">{item.country}</h4>
                  <span className="text-xs text-slate-400">{item.city}</span>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  <span>{isFr ? 'Compatibilité :' : 'Match :'}</span>
                  <span>{item.compatibilityScore}%</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.matchReason}
                </p>
              </div>

              {/* Numbers */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Budget installation :' : 'Setup budget:'}</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {item.installationBudgetRange.min.toLocaleString()} - {item.installationBudgetRange.realistic.toLocaleString()} {sym}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Loyer indicatif :' : 'Rent indicative:'}</span>
                  <span className="font-bold text-slate-200 font-mono">~{item.monthlyRentIndicative} {sym}/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Coût de vie :' : 'Living cost:'}</span>
                  <span className="font-bold text-slate-200 font-mono">~{item.monthlyCostOfLivingIndicative} {sym}/m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Difficulté démarches :' : 'Difficulty:'}</span>
                  <span className={`font-bold ${item.difficultyLevel === 'Facile' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {item.difficultyLevel}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. BUSINESS BLUEPRINT CARD (Section 12)
  if (coPilotData.businessBlueprint) {
    const bp = coPilotData.businessBlueprint;
    return (
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {bp.businessType}
              </h3>
              <p className="text-xs text-slate-400">
                {isFr ? 'Architectures de lancement calibrées sur ton capital' : 'Launch architectures calibrated on your capital'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {isFr ? '3 Formules Métier' : '3 Business Formats'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Minimal */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
              {isFr ? 'Version Minimale' : 'Minimal Version'}
            </span>
            <h4 className="text-base font-bold text-white">{bp.minimalVersion.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{bp.minimalVersion.description}</p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Apport de départ :' : 'Initial capital:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.minimalVersion.startupCost.toLocaleString()} {sym}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Charges mensuelles :' : 'Monthly fixed:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.minimalVersion.monthlyRunningCost} {sym}/m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Seuil rentabilité :' : 'Break-even:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.minimalVersion.breakEvenMonthlyRevenue} {sym}/m</span>
              </div>
            </div>
          </div>

          {/* Realistic */}
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 relative">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500 text-white">
              {isFr ? 'Version Réaliste (Recommandée)' : 'Realistic Version'}
            </span>
            <h4 className="text-base font-bold text-white">{bp.realisticVersion.title}</h4>
            <p className="text-xs text-indigo-200/90 leading-relaxed">{bp.realisticVersion.description}</p>
            <div className="pt-2 border-t border-indigo-900/60 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-indigo-300">{isFr ? 'Apport de départ :' : 'Initial capital:'}</span>
                <span className="font-bold text-white font-mono">{bp.realisticVersion.startupCost.toLocaleString()} {sym}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-300">{isFr ? 'Charges mensuelles :' : 'Monthly fixed:'}</span>
                <span className="font-bold text-white font-mono">{bp.realisticVersion.monthlyRunningCost} {sym}/m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-300">{isFr ? 'Seuil rentabilité :' : 'Break-even:'}</span>
                <span className="font-bold text-white font-mono">{bp.realisticVersion.breakEvenMonthlyRevenue} {sym}/m</span>
              </div>
            </div>
          </div>

          {/* Complete */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300">
              {isFr ? 'Version Complète' : 'Complete Version'}
            </span>
            <h4 className="text-base font-bold text-white">{bp.completeVersion.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{bp.completeVersion.description}</p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Apport de départ :' : 'Initial capital:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.completeVersion.startupCost.toLocaleString()} {sym}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Charges mensuelles :' : 'Monthly fixed:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.completeVersion.monthlyRunningCost} {sym}/m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{isFr ? 'Seuil rentabilité :' : 'Break-even:'}</span>
                <span className="font-bold text-slate-100 font-mono">{bp.completeVersion.breakEvenMonthlyRevenue} {sym}/m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. CAREER SHORTLIST CARD (Section 14)
  if (coPilotData.careerShortlist && coPilotData.careerShortlist.length > 0) {
    const cs = coPilotData.careerShortlist;
    return (
      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6 text-left">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {isFr ? 'Voies de Reconversion Réalistes' : 'Realistic Career Pathways'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFr ? 'Filières en tension avec formation accessible' : 'In-demand sectors with accessible training'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cs.map(job => (
            <div key={job.id} className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400">
                  {isFr ? `Compatibilité : ${job.compatibilityScore}%` : `Match: ${job.compatibilityScore}%`}
                </span>
                {job.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    {job.badge}
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-white">{job.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{job.whyMatches}</p>
              <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Durée formation :' : 'Training time:'}</span>
                  <span className="font-bold text-slate-100">{job.trainingTimeMonths} {isFr ? 'mois' : 'months'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Salaire visé :' : 'Target salary:'}</span>
                  <span className="font-bold text-slate-100 font-mono">
                    {job.expectedSalaryRange.min} - {job.expectedSalaryRange.realistic} {sym}/m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isFr ? 'Premier pas :' : 'First step:'}</span>
                  <span className="font-bold text-indigo-300">{job.firstStep}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
