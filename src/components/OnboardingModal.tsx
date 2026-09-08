// src/components/OnboardingModal.tsx
import React, { useState } from 'react';
import {
  Briefcase,
  TrendingUp,
  Coins,
  GraduationCap,
  Compass,
  Home,
  Coffee,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, createDefaultSim, getCategoryBenchmarkPresets, sanitizeNumber, AssumptionSource } from '../logic/engine';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: SimData) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
  initialCategory?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  lang,
  currency,
  initialCategory = 'business'
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState(initialCategory);
  const [simState, setSimState] = useState<SimData>(() => createDefaultSim(initialCategory));

  if (!isOpen) return null;

  const t = translations[lang];

  const categoryIcons: Record<string, React.ReactNode> = {
    career: <Briefcase className="w-5 h-5 text-indigo-400" />,
    business: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    money: <Coins className="w-5 h-5 text-amber-400" />,
    education: <GraduationCap className="w-5 h-5 text-sky-400" />,
    moving: <Compass className="w-5 h-5 text-violet-400" />,
    housing: <Home className="w-5 h-5 text-rose-400" />,
    lifestyle: <Coffee className="w-5 h-5 text-pink-400" />,
    other: <HelpCircle className="w-5 h-5 text-slate-400" />
  };

  const handleSelectCategory = (catKey: string) => {
    setCategory(catKey);
    const presets = getCategoryBenchmarkPresets(catKey);
    setSimState(prev => ({
      ...createDefaultSim(catKey, prev.name || t.ui.new_sim),
      description: prev.description,
      ...presets
    }));
  };

  const handleUpdateField = (field: keyof SimData, val: any, source: AssumptionSource = 'USER') => {
    setSimState(prev => {
      let cleaned = val;
      if (typeof prev[field] === 'number') {
        cleaned = sanitizeNumber(
          val,
          0,
          field === 'growth' || field === 'expectedAnnualRevenueGrowth' ? -99 : 0,
          field === 'growth' || field === 'expectedAnnualRevenueGrowth' ? 500 : undefined
        );
      }
      return {
        ...prev,
        [field]: cleaned,
        assumptionsSource: {
          ...(prev.assumptionsSource || {}),
          [field]: source
        }
      };
    });
  };

  const handleApplyBenchmark = (field: keyof SimData) => {
    const benchmarks = getCategoryBenchmarkPresets(category);
    if (benchmarks[field] !== undefined) {
      handleUpdateField(field, benchmarks[field], 'DEFAULT');
    }
  };

  const handlePopulateAllBenchmarks = () => {
    const benchmarks = getCategoryBenchmarkPresets(category);
    setSimState(prev => {
      const sources: Record<string, AssumptionSource> = {};
      Object.keys(benchmarks).forEach(k => {
        sources[k] = 'DEFAULT';
      });
      return {
        ...prev,
        ...benchmarks,
        assumptionsSource: {
          ...(prev.assumptionsSource || {}),
          ...sources
        }
      };
    });
  };

  const handleFinish = () => {
    onComplete({
      ...simState,
      category,
      name: simState.name.trim() || `${t.categories[category as keyof typeof t.categories] || 'Scenario'} Future`,
      lastModified: new Date().toISOString()
    });
  };

  // Helper for rendering form fields with an "I don't know" button and source indicator
  const renderField = (
    fieldKey: keyof SimData,
    label: string,
    unit: 'currency' | 'percent' | 'months' | 'number' = 'currency'
  ) => {
    const currentVal = simState[fieldKey] !== undefined ? simState[fieldKey] : '';
    const source = simState.assumptionsSource?.[fieldKey] || 'DEFAULT';
    const isDefault = source === 'DEFAULT';

    return (
      <div className="space-y-1.5" key={fieldKey}>
        <div className="flex items-center justify-between">
          <label htmlFor={`onboard-input-${fieldKey}`} className="text-xs font-semibold text-slate-200">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                isDefault
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
              }`}
            >
              {isDefault ? t.onboarding.unknown_badge : t.onboarding.user_badge}
            </span>
            <button
              type="button"
              id={`onboard-unknown-${fieldKey}`}
              onClick={() => handleApplyBenchmark(fieldKey)}
              className="text-[10px] text-slate-400 hover:text-amber-400 transition-colors underline underline-offset-2"
              title="Set to standard benchmark default"
            >
              {t.onboarding.unknown_button}
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            id={`onboard-input-${fieldKey}`}
            type="number"
            value={currentVal as any}
            onChange={e => handleUpdateField(fieldKey, e.target.value, 'USER')}
            className="w-full h-10 px-3 pr-14 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm font-medium transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
            {unit === 'currency' ? currency : unit === 'percent' ? '%' : unit === 'months' ? t.metrics.months : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">{t.onboarding.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className={step === 1 ? 'text-indigo-400 font-bold' : ''}>{t.onboarding.step1}</span>
              <span>→</span>
              <span className={step === 2 ? 'text-indigo-400 font-bold' : ''}>{t.onboarding.step2}</span>
              <span>→</span>
              <span className={step === 3 ? 'text-indigo-400 font-bold' : ''}>{t.onboarding.step3}</span>
            </div>
          </div>
          <button
            id="onboarding-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* STEP 1: Select Category */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose the life decision category to unlock custom mathematical variables tailored to your situation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(t.categories).map(catKey => {
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      id={`category-btn-${catKey}`}
                      type="button"
                      onClick={() => handleSelectCategory(catKey)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-800/80 mt-0.5">{categoryIcons[catKey]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white flex items-center justify-between">
                          <span>{t.categories[catKey as keyof typeof t.categories]}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {t.category_desc[catKey as keyof typeof t.category_desc]}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Name & Description */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="onboard-scenario-name" className="text-xs font-semibold text-slate-200">
                  {t.onboarding.name_label}
                </label>
                <input
                  id="onboard-scenario-name"
                  type="text"
                  value={simState.name}
                  onChange={e => handleUpdateField('name', e.target.value, 'USER')}
                  placeholder={t.onboarding.name_placeholder}
                  className="w-full h-11 px-3.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm font-medium transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="onboard-scenario-desc" className="text-xs font-semibold text-slate-200">
                  {t.onboarding.desc_label}
                </label>
                <textarea
                  id="onboard-scenario-desc"
                  rows={4}
                  value={simState.description}
                  onChange={e => handleUpdateField('description', e.target.value, 'USER')}
                  placeholder={t.onboarding.desc_placeholder}
                  className="w-full p-3.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm font-medium transition-all resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Selected category: <strong className="text-white">{t.categories[category as keyof typeof t.categories]}</strong></span>
                <button
                  type="button"
                  id="onboard-change-category-btn"
                  onClick={() => setStep(1)}
                  className="text-indigo-400 hover:underline text-xs"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Category-Specific Variables */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t.categories[category as keyof typeof t.categories]} {t.onboarding.step3}
                  </h3>
                  <p className="text-xs text-slate-400">{t.onboarding.review_sub}</p>
                </div>
                <button
                  type="button"
                  id="onboard-fill-all-benchmarks"
                  onClick={handlePopulateAllBenchmarks}
                  className="px-2.5 py-1.5 rounded-md border border-indigo-700 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.onboarding.fill_presets}</span>
                </button>
              </div>

              {/* Dynamic question fields based strictly on category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Always relevant core baseline */}
                {renderField('savings', t.vars.savings, 'currency')}

                {/* Category specific fields */}
                {category === 'career' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('expectedNewIncome', t.vars.expectedNewIncome, 'currency')}
                    {renderField('transitionMonths', t.vars.transitionMonths, 'months')}
                    {renderField('transitionCost', t.vars.transitionCost, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'business' && (
                  <>
                    {renderField('personalExpenses', t.vars.personalExpenses, 'currency')}
                    {renderField('startupCost', t.vars.startupCost, 'currency')}
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('initialBusinessRevenue', t.vars.initialBusinessRevenue, 'currency')}
                    {renderField('businessMonthlyCosts', t.vars.businessMonthlyCosts, 'currency')}
                    {renderField('expectedAnnualRevenueGrowth', t.vars.expectedAnnualRevenueGrowth, 'percent')}
                    {renderField('monthsBeforeRevenue', t.vars.monthsBeforeRevenue, 'months')}
                  </>
                )}

                {category === 'money' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('debt', t.vars.debt, 'currency')}
                    {renderField('recurringDebtPayment', t.vars.recurringDebtPayment, 'currency')}
                    {renderField('financialGoal', t.vars.financialGoal, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'education' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('tuition', t.vars.tuition, 'currency')}
                    {renderField('studyDuration', t.vars.studyDuration, 'months')}
                    {renderField('incomeDuringStudies', t.vars.incomeDuringStudies, 'currency')}
                    {renderField('expectedIncomeAfterStudies', t.vars.expectedIncomeAfterStudies, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'moving' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('currentRent', t.vars.currentRent, 'currency')}
                    {renderField('movingCost', t.vars.movingCost, 'currency')}
                    {renderField('newRent', t.vars.newRent, 'currency')}
                    {renderField('expectedNewIncome', t.vars.expectedNewIncome, 'currency')}
                    {renderField('estimatedNewExpenses', t.vars.estimatedNewExpenses, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'housing' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('currentRent', t.vars.currentRent, 'currency')}
                    {renderField('propertyCost', t.vars.propertyCost, 'currency')}
                    {renderField('mortgagePayment', t.vars.mortgagePayment, 'currency')}
                    {renderField('recurringHousingCosts', t.vars.recurringHousingCosts, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'lifestyle' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('newRecurringCost', t.vars.newRecurringCost, 'currency')}
                    {renderField('lifestyleOneOff', t.vars.lifestyleOneOff, 'currency')}
                    {renderField('incomeImpact', t.vars.incomeImpact, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}

                {category === 'other' && (
                  <>
                    {renderField('income', t.vars.income, 'currency')}
                    {renderField('expenses', t.vars.expenses, 'currency')}
                    {renderField('oneOff', t.vars.oneOff, 'currency')}
                    {renderField('growth', t.vars.growth, 'percent')}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <div>
            {step > 1 ? (
              <button
                type="button"
                id="onboarding-back-btn"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.onboarding.back}</span>
              </button>
            ) : (
              <span className="text-xs text-slate-500">Step 1 of 3</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {step < 3 ? (
              <button
                type="button"
                id="onboarding-continue-btn"
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>{t.onboarding.next}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                id="onboarding-finish-btn"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.onboarding.finish}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
