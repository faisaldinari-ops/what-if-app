import React, { useState } from 'react';
import { DecisionAnalysis } from '../../types/decision';
import { CoPilotResponse } from '../../types/planning';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { Target, Wallet, PiggyBank, ArrowRight, Lightbulb, Clock, CheckCircle2 } from 'lucide-react';

interface SimpleGoalTrackerProps {
  analysis: DecisionAnalysis;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const SimpleGoalTracker: React.FC<SimpleGoalTrackerProps> = ({
  analysis,
  lang,
  currency
}) => {
  const [showTips, setShowTips] = useState(false);

  const { budgetAvailable, budgetNeeded, gap, monthlyMargin } = analysis.metrics;
  const isFunded = gap >= 0;
  const deficit = Math.abs(gap);
  
  // Calculate months to save. If margin <= 0, we can't calculate easily.
  const monthsToSave = (monthlyMargin && monthlyMargin > 0) ? Math.ceil(deficit / monthlyMargin) : null;

  return (
    <div className="space-y-6">
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-2">
            <Target className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {analysis.userInput.projectTitle}
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
            {analysis.verdictTitle}
          </p>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col justify-center text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
              {lang === 'fr' ? 'Budget nécessaire' : 'Required Budget'}
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
              {formatCurrency(budgetNeeded, currency)}
            </div>
          </div>
          
          <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col justify-center text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
              {lang === 'fr' ? 'Ton épargne disponible' : 'Your Available Savings'}
            </span>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight">
              {formatCurrency(budgetAvailable, currency)}
            </div>
          </div>
        </div>

        {/* Verdict Box */}
        <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left ${isFunded ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-amber-900/10 border-amber-500/20'}`}>
          <div className={`p-4 rounded-full shrink-0 ${isFunded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isFunded ? <CheckCircle2 className="w-8 h-8" /> : <Wallet className="w-8 h-8" />}
          </div>
          
          <div className="space-y-2 flex-1">
            <h3 className={`text-xl sm:text-2xl font-bold ${isFunded ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isFunded 
                ? (lang === 'fr' ? 'Tu as assez de budget !' : 'You have enough budget!')
                : (lang === 'fr' ? `Il te manque ${formatCurrency(deficit, currency)}` : `You are short by ${formatCurrency(deficit, currency)}`)}
            </h3>
            
            {!isFunded && (
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                {monthsToSave !== null && monthsToSave > 0
                  ? (lang === 'fr'
                      ? `Avec ton rythme d'économie actuel (${formatCurrency(monthlyMargin!, currency)}/mois), il te faudra environ ${monthsToSave} mois pour réunir la somme.`
                      : `At your current savings rate (${formatCurrency(monthlyMargin!, currency)}/mo), it will take you about ${monthsToSave} months to reach your goal.`)
                  : (lang === 'fr' 
                      ? 'Pour atteindre cet objectif, tu vas devoir mettre en place un plan d\'épargne.' 
                      : 'To reach this goal, you will need to set up a savings plan.')}
              </p>
            )}
            
            {isFunded && (
              <p className="text-base sm:text-lg text-emerald-200/70 leading-relaxed">
                {lang === 'fr' ? 'Ton projet est finançable immédiatement avec ton épargne.' : 'Your project is immediately fundable with your savings.'}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {!isFunded && (
          <div className="pt-4 flex justify-center">
             <button
              onClick={() => setShowTips(!showTips)}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm sm:text-base transition-colors flex items-center gap-2"
            >
              <Lightbulb className="w-5 h-5 text-amber-400" />
              {lang === 'fr' ? 'Comment économiser plus vite ?' : 'How to save faster?'}
            </button>
          </div>
        )}

        {showTips && !isFunded && (
          <div className="mt-6 p-6 sm:p-8 rounded-2xl bg-slate-950 border border-slate-800 space-y-6 animate-in slide-in-from-top-2">
            <h4 className="text-xl font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-6 h-6 text-indigo-400" />
              {lang === 'fr' ? 'Astuces pour ton plan d\'épargne' : 'Tips for your savings plan'}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-300">1</div>
                <p className="text-base text-slate-300">
                  <strong className="text-white">{lang === 'fr' ? 'Virement automatique :' : 'Automatic transfer:'}</strong> {lang === 'fr' ? 'Programme un virement vers un livret dédié dès le jour de ta paie.' : 'Set up an automatic transfer to a dedicated savings account on payday.'}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-300">2</div>
                <p className="text-base text-slate-300">
                  <strong className="text-white">{lang === 'fr' ? 'Réduire le superflu :' : 'Cut unnecessary expenses:'}</strong> {lang === 'fr' ? 'Annule les abonnements inutilisés ou mange une fois de moins au restaurant par semaine.' : 'Cancel unused subscriptions or eat out one less time per week.'}
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-slate-300">3</div>
                <p className="text-base text-slate-300">
                  <strong className="text-white">{lang === 'fr' ? 'Réserver en avance :' : 'Book early:'}</strong> {lang === 'fr' ? 'Pour un voyage, acheter ses billets 3 à 4 mois en avance permet souvent d\'économiser 20 à 30% du coût.' : 'For travel, booking tickets 3-4 months in advance can often save 20-30%.'}
                </p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
