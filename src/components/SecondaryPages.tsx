// src/components/SecondaryPages.tsx
import React from 'react';
import {
  HelpCircle,
  ShieldCheck,
  Calculator,
  Compass,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, createDefaultSim, getCategoryBenchmarkPresets } from '../logic/engine';

interface SecondaryPagesProps {
  page: 'how' | 'examples' | 'faq' | 'about' | 'privacy' | 'terms';
  onSelectExample: (sim: SimData) => void;
  onGoToSim: () => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const SecondaryPages: React.FC<SecondaryPagesProps> = ({
  page,
  onSelectExample,
  onGoToSim,
  lang,
  currency
}) => {
  const t = translations[lang];

  // Real examples with realistic category benchmark values
  const examplesList: SimData[] = [
    {
      ...createDefaultSim('business', 'Bootstrapped SaaS Startup'),
      description: 'Leaving corporate tech to build a micro-SaaS with 18 months of personal runway.',
      savings: 45000,
      personalExpenses: 2800,
      startupCost: 5000,
      income: 0,
      initialBusinessRevenue: 800,
      businessMonthlyCosts: 450,
      expectedAnnualRevenueGrowth: 45,
      monthsBeforeRevenue: 4
    },
    {
      ...createDefaultSim('career', 'Career Pivot to AI Engineering'),
      description: 'Taking 6 months off to complete intensive training and transition to high-growth tech.',
      savings: 30000,
      income: 0,
      expenses: 2400,
      expectedNewIncome: 6200,
      transitionMonths: 6,
      transitionCost: 8000,
      growth: 6
    },
    {
      ...createDefaultSim('education', 'Executive MBA Program'),
      description: 'Financing a 2-year part-time executive master while continuing partial employment.',
      savings: 50000,
      income: 3200,
      expenses: 2500,
      tuition: 22000,
      studyDuration: 24,
      incomeDuringStudies: 3200,
      expectedIncomeAfterStudies: 7500,
      growth: 7
    },
    {
      ...createDefaultSim('moving', 'Relocation to Low-Cost Tech Hub'),
      description: 'Moving from high-rent capital to a vibrant secondary city with lower living expenses.',
      savings: 25000,
      income: 4800,
      expenses: 3400,
      currentRent: 1900,
      movingCost: 3500,
      newRent: 950,
      expectedNewIncome: 4800,
      estimatedNewExpenses: 2100,
      growth: 4
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 py-4">
      {/* 1. HOW IT WORKS */}
      {page === 'how' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.how.title}</h2>
            <p className="text-sm text-slate-400">{t.how.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Calculator className="w-4 h-4" />
                <span>{t.how.step1_title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{t.how.step1_desc}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>{t.how.step2_title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{t.how.step2_desc}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Compass className="w-4 h-4" />
                <span>{t.how.step3_title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{t.how.step3_desc}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.how.step4_title}</span>
              </div>
              <p className="text-slate-300 leading-relaxed">{t.how.step4_desc}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-white text-sm">Strict Deterministic Formula</h4>
            <p className="leading-relaxed font-mono text-[11px] text-slate-300">
              Cash(t) = Savings₀ - UpfrontCost + Σ [NetIncome(i) - NetExpenses(i)]
            </p>
            <p className="leading-relaxed">
              WHAT IF? never predicts the future. We project the strict compounding consequences of your transparent mathematical assumptions so you can identify solvency limits before committing.
            </p>
          </div>
        </div>
      )}

      {/* 2. EXAMPLES */}
      {page === 'examples' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.examples.title}</h2>
            <p className="text-sm text-slate-400">{t.examples.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examplesList.map(ex => (
              <div
                key={ex.name}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-indigo-600/70 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {t.categories[ex.category as keyof typeof t.categories] || ex.category}
                  </span>
                  <h3 className="text-base font-bold text-white">{ex.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{ex.description}</p>
                </div>

                <button
                  onClick={() => onSelectExample(ex)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center justify-between shadow-sm"
                >
                  <span>{t.examples.load_example}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. FAQ */}
      {page === 'faq' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.faq.title}</h2>
            <p className="text-sm text-slate-400">{t.faq.subtitle}</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1.5 text-xs">
              <h3 className="font-bold text-white text-sm">{t.faq.q1}</h3>
              <p className="text-slate-300 leading-relaxed">{t.faq.a1}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1.5 text-xs">
              <h3 className="font-bold text-white text-sm">{t.faq.q2}</h3>
              <p className="text-slate-300 leading-relaxed">{t.faq.a2}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1.5 text-xs">
              <h3 className="font-bold text-white text-sm">{t.faq.q3}</h3>
              <p className="text-slate-300 leading-relaxed">{t.faq.a3}</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-1.5 text-xs">
              <h3 className="font-bold text-white text-sm">{t.faq.q4}</h3>
              <p className="text-slate-300 leading-relaxed">{t.faq.a4}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABOUT */}
      {page === 'about' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.about.title}</h2>
            <p className="text-sm text-slate-400">{t.about.subtitle}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>{t.about.p1}</p>
            <p>{t.about.p2}</p>
            <p>{t.about.p3}</p>
          </div>
        </div>
      )}

      {/* 5. PRIVACY */}
      {page === 'privacy' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.privacy.title}</h2>
            <p className="text-sm text-slate-400">{t.privacy.subtitle}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>{t.privacy.p1}</p>
            <p>{t.privacy.p2}</p>
            <p>{t.privacy.p3}</p>
          </div>
        </div>
      )}

      {/* 6. TERMS */}
      {page === 'terms' && (
        <div className="space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-black text-white tracking-tight">{t.terms.title}</h2>
            <p className="text-sm text-slate-400">{t.terms.subtitle}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-4 text-xs text-slate-300 leading-relaxed">
            <p>{t.terms.p1}</p>
            <p>{t.terms.p2}</p>
            <p>{t.terms.p3}</p>
          </div>
        </div>
      )}

      {/* Back to simulator bottom CTA */}
      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={onGoToSim}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <span>{t.ui.back_to_sim}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
