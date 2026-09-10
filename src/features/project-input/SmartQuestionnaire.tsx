// src/features/project-input/SmartQuestionnaire.tsx
import React, { useState } from 'react';
import { MissingQuestion, UserExtractedData } from '../../types/decision';
import { SupportedLang, SupportedCurrency } from '../../i18n';
import { ArrowRight, HelpCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

interface SmartQuestionnaireProps {
  questions: MissingQuestion[];
  initialData: UserExtractedData;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onSubmitAnswers: (updatedData: UserExtractedData) => void;
  onUseMarketDefaults: () => void;
  isLoading?: boolean;
}

export const SmartQuestionnaire: React.FC<SmartQuestionnaireProps> = ({
  questions,
  initialData,
  lang,
  currency,
  onSubmitAnswers,
  onUseMarketDefaults,
  isLoading = false
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    questions.forEach(q => {
      init[q.id] = '';
    });
    return init;
  });

  const handleInputChange = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const mergedData: UserExtractedData = {
      ...initialData,
      customAnswers: {
        ...initialData.customAnswers,
        ...answers
      }
    };

    // Apply numerical / structured answers to matching fields
    questions.forEach(q => {
      const val = answers[q.id];
      if (val !== undefined && val !== '') {
        if (q.type === 'number') {
          const num = parseFloat(String(val).replace(/\s+/g, ''));
          if (!isNaN(num)) {
            (mergedData as any)[q.field] = num;
          }
        } else {
          (mergedData as any)[q.field] = val;
        }
      }
    });

    onSubmitAnswers(mergedData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {initialData.projectTitle ||
                (lang === 'fr' ? 'Ton projet' : lang === 'es' ? 'Tu proyecto' : 'Your project')}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {questions.length === 1 && questions[0].id === 'operatingModel'
              ? (lang === 'fr'
                  ? 'Précisons ton mode d’exercice pour estimer le coût exact :'
                  : lang === 'es'
                  ? 'Concretemos tu forma de empezar para estimar el coste exacto:'
                  : 'Let’s clarify your operating model to estimate the exact startup cost:')
              : (lang === 'fr'
                  ? `Très bien. Pour calculer précisément ton projet, il me manque ${questions.length} information${questions.length > 1 ? 's' : ''} :`
                  : lang === 'es'
                  ? `Muy bien. Para calcular la viabilidad exacta, faltan ${questions.length} dato${questions.length > 1 ? 's' : ''}:`
                  : `Great. To calculate feasibility accurately, we just need ${questions.length} key piece${questions.length > 1 ? 's' : ''} of information:`)}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400">
            {questions.length === 1 && questions[0].id === 'operatingModel'
              ? (lang === 'fr'
                  ? 'Le matériel reste le même, mais un local commercial implique un bail et des charges fixes 10x plus élevées.'
                  : 'Costs differ substantially between home-based, mobile, or commercial salon setups.')
              : (lang === 'fr'
                  ? 'Nous réutilisons tout ce que tu as déjà indiqué sans jamais te le redemander.'
                  : lang === 'es'
                  ? 'Reutilizamos lo que ya has indicado sin volver a preguntarlo.'
                  : 'We already saved everything you mentioned and will never ask twice.')}
          </p>
        </div>

        {/* Dynamic Questions List */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2 text-left">
              <label className="block text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                <span>{q.question}</span>
              </label>

              {q.explanation && (
                <p className="text-xs text-slate-400 pl-7 leading-relaxed">{q.explanation}</p>
              )}

              <div className="pl-7">
                {q.type === 'number' ? (
                  <div className="relative max-w-xs">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={answers[q.id] || ''}
                      onChange={e => handleInputChange(q.id, e.target.value)}
                      placeholder={q.placeholder || 'ex. 1 500'}
                      className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-base font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'CHF'}
                    </span>
                  </div>
                ) : q.type === 'choice' && q.options ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {q.options.map(opt => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => handleInputChange(q.id, opt.value)}
                        className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                          answers[q.id] === opt.value
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={e => handleInputChange(q.id, e.target.value)}
                    placeholder={q.placeholder || 'Ton indication...'}
                    className="w-full max-w-md bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                )}
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onUseMarketDefaults}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 cursor-pointer focus:outline-none order-2 sm:order-1"
            >
              {lang === 'fr'
                ? 'Je ne sais pas encore, utiliser les estimations moyennes'
                : lang === 'es'
                ? 'No lo sé todavía, usar estimaciones de mercado'
                : 'I do not know yet, use standard sector benchmarks'}
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 order-1 sm:order-2 cursor-pointer"
            >
              {isLoading ? (
                <span>
                  {lang === 'fr' ? 'Calcul en cours...' : lang === 'es' ? 'Calculando...' : 'Calculating...'}
                </span>
              ) : (
                <>
                  <span>
                    {questions.length === 1 && questions[0].id === 'operatingModel'
                      ? (lang === 'fr' ? 'Estimer le coût' : lang === 'es' ? 'Estimar coste' : 'Estimate Cost')
                      : (lang === 'fr'
                          ? 'Lancer l’analyse de faisabilité'
                          : lang === 'es'
                          ? 'Calcular viabilidad'
                          : 'Run Feasibility Analysis')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
