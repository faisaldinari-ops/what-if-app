// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Layers,
  HelpCircle,
  ShieldCheck,
  FolderKanban,
  Edit3,
  GitBranch,
  Sliders,
  Download,
  AlertTriangle
} from 'lucide-react';

import {
  SupportedLang,
  SupportedCurrency,
  translations,
  formatCurrency
} from './i18n';

import {
  SimData,
  createDefaultSim,
  runMultiScenarioSim,
  ScenarioType,
  SimResultPoint,
  AssumptionSource,
  GoalConfig
} from './logic/engine';

import { Nav } from './components/Nav';
import { TimelineBar } from './components/TimelineBar';
import { ScenarioCards } from './components/ScenarioCards';
import { SimulationChart } from './components/SimulationChart';
import { StressTestSection } from './components/StressTestSection';
import { ButterflySection } from './components/ButterflySection';
import { BreakingPointSection } from './components/BreakingPointSection';
import { ReversibilitySection } from './components/ReversibilitySection';
import { GoalsSection } from './components/GoalsSection';
import { CompareView } from './components/CompareView';
import { MyFuturesView } from './components/MyFuturesView';
import { OnboardingModal } from './components/OnboardingModal';
import { AssumptionsDrawer } from './components/AssumptionsDrawer';
import { ExplainModal } from './components/ExplainModal';
import { ForkModal } from './components/ForkModal';
import { SecondaryPages } from './components/SecondaryPages';

const STORAGE_KEY_FUTURES = 'whatif_saved_futures_v2';
const STORAGE_KEY_LANG = 'whatif_lang_pref';
const STORAGE_KEY_CURRENCY = 'whatif_currency_pref';
const STORAGE_KEY_CURRENT_ID = 'whatif_current_sim_id';

export const App: React.FC = () => {
  // 1. Language & Currency State
  const [lang, setLang] = useState<SupportedLang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    return saved === 'fr' || saved === 'es' ? saved : 'en';
  });

  const [currency, setCurrency] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENCY);
    return saved === 'USD' || saved === 'GBP' || saved === 'CHF' ? saved : 'EUR';
  });

  // 2. Navigation State
  const [currentView, setCurrentView] = useState<string>('simulator');

  // 3. Saved Futures State
  const [futures, setFutures] = useState<SimData[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FUTURES);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved futures', e);
    }
    const defaultSim = createDefaultSim('business', 'Quit Job to Launch a Business');
    return [defaultSim];
  });

  // 4. Current Simulation State
  const [currentSimId, setCurrentSimId] = useState<string | number>(() => {
    const savedId = localStorage.getItem(STORAGE_KEY_CURRENT_ID);
    return savedId || futures[0]?.id || 'default-sim';
  });

  const currentSim: SimData = useMemo(() => {
    const found = futures.find(f => String(f.id) === String(currentSimId));
    return found || futures[0] || createDefaultSim('business', 'New Decision');
  }, [futures, currentSimId]);

  // 5. Timeline Selected Checkpoint
  const [selectedMonth, setSelectedMonth] = useState<number>(12); // Default to 1 Year (12M)

  // 6. Modals & Drawers
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);
  const [showForkModal, setShowForkModal] = useState<boolean>(false);
  const [explainModal, setExplainModal] = useState<{
    isOpen: boolean;
    scenarioType: ScenarioType;
    metric: string;
  }>({
    isOpen: false,
    scenarioType: 'expected',
    metric: 'cash'
  });

  // Home view quick-input state
  const [homeInput, setHomeInput] = useState('');

  // Persist language and currency
  const handleLangChange = (newLang: SupportedLang) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY_LANG, newLang);
  };

  const handleCurrencyChange = (newCurr: SupportedCurrency) => {
    setCurrency(newCurr);
    localStorage.setItem(STORAGE_KEY_CURRENCY, newCurr);
  };

  // Persist futures to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FUTURES, JSON.stringify(futures));
      localStorage.setItem(STORAGE_KEY_CURRENT_ID, String(currentSimId));
    } catch (e) {
      console.error('Error saving futures to localStorage', e);
    }
  }, [futures, currentSimId]);

  // Run simulation engine whenever active simulation changes
  const scenarios = useMemo(() => {
    return runMultiScenarioSim(currentSim);
  }, [currentSim]);

  const t = translations[lang];

  // Helper to update current simulation properties
  const updateCurrentSim = (updater: (prev: SimData) => SimData) => {
    setFutures(prev =>
      prev.map(item => {
        if (String(item.id) === String(currentSim.id)) {
          const updated = updater(item);
          return { ...updated, lastModified: new Date().toISOString() };
        }
        return item;
      })
    );
  };

  const handleUpdateField = (field: keyof SimData, val: any, source: AssumptionSource = 'USER') => {
    updateCurrentSim(prev => ({
      ...prev,
      [field]: val,
      assumptionsSource: {
        ...(prev.assumptionsSource || {}),
        [field]: source
      }
    }));
  };

  const handleUpdateCustomMods = (growthMod: number, expMod: number) => {
    updateCurrentSim(prev => ({
      ...prev,
      customGrowthMod: growthMod,
      customExpenseMod: expMod
    }));
  };

  const handleUpdateGoals = (newGoals: GoalConfig[]) => {
    updateCurrentSim(prev => ({
      ...prev,
      goals: newGoals
    }));
  };

  // CRUD actions for Futures
  const handleCreateNewSim = () => {
    setShowOnboarding(true);
  };

  const handleCompleteOnboarding = (newSim: SimData) => {
    setFutures(prev => [newSim, ...prev]);
    setCurrentSimId(newSim.id);
    setShowOnboarding(false);
    setCurrentView('simulator');
  };

  const handleOpenSim = (sim: SimData) => {
    setCurrentSimId(sim.id);
    setCurrentView('simulator');
  };

  const handleRenameSim = (id: string | number, newName: string) => {
    setFutures(prev =>
      prev.map(f => (String(f.id) === String(id) ? { ...f, name: newName, lastModified: new Date().toISOString() } : f))
    );
  };

  const handleDuplicateSim = (sim: SimData) => {
    const dup: SimData = {
      ...sim,
      id: `sim-${Date.now()}`,
      name: `${sim.name} (${t.futures.duplicate_btn})`,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    setFutures(prev => [dup, ...prev]);
    setCurrentSimId(dup.id);
  };

  const handleDeleteSim = (id: string | number) => {
    if (futures.length <= 1) {
      alert('You must have at least one active simulation.');
      return;
    }
    const remaining = futures.filter(f => String(f.id) !== String(id));
    setFutures(remaining);
    if (String(currentSimId) === String(id)) {
      setCurrentSimId(remaining[0].id);
    }
  };

  const handleExportSimJSON = (sim: SimData) => {
    const jsonStr = JSON.stringify(sim, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sim.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_scenario.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download entire App / Project source code for user query:
  // "Donne moi lappli sur un fichier stp" / "Je veux télécharger le fichier ou puis je le trouver"
  const handleDownloadAppSource = () => {
    const backupData = {
      appName: 'WHAT IF? - Life Decision Simulator',
      exportedAt: new Date().toISOString(),
      activeDecision: currentSim,
      allFutures: futures,
      settings: { lang, currency }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'what_if_life_decision_simulator.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmFork = (forked: SimData) => {
    setFutures(prev => [forked, ...prev]);
    setCurrentSimId(forked.id);
    setSelectedMonth(0);
    setCurrentView('simulator');
  };

  // Start from Home prompt input
  const handleStartFromHome = (catKey?: string) => {
    const targetCategory = catKey || 'business';
    const newSim = createDefaultSim(targetCategory, homeInput.trim() || t.placeholder_input);
    if (homeInput.trim()) {
      newSim.description = homeInput.trim();
    }
    setFutures(prev => [newSim, ...prev]);
    setCurrentSimId(newSim.id);
    setCurrentView('simulator');
  };

  const expectedPointCash = scenarios.expected.find(p => p.m === selectedMonth)?.cash ?? currentSim.savings;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* 1. Global Navigation Bar */}
      <Nav
        currentView={currentView}
        onNavigate={setCurrentView}
        lang={lang}
        onLangChange={handleLangChange}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        onNewSimulation={handleCreateNewSim}
        onDownloadSource={handleDownloadAppSource}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* ==================================================== */}
        {/* VIEW: HOME / LANDING EXPLORER                        */}
        {/* ==================================================== */}
        {currentView === 'home' && (
          <div className="py-8 sm:py-16 space-y-12 animate-in fade-in duration-200 text-center max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Life Decision Engine</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {t.tagline}
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Test the long-term compound consequences of major life choices. Zero guesswork, zero black box—100% transparent mathematics.
              </p>
            </div>

            {/* Quick Prompt Bar */}
            <div className="space-y-4">
              <div className="relative flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
                <input
                  id="home-decision-input"
                  type="text"
                  placeholder={t.placeholder_input}
                  value={homeInput}
                  onChange={e => setHomeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleStartFromHome()}
                  className="w-full h-13 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white text-sm font-medium transition-all"
                />
                <button
                  id="home-start-btn"
                  onClick={() => handleStartFromHome()}
                  className="h-13 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 flex-shrink-0"
                >
                  <span>{t.cta_start}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Category Quick Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {Object.keys(t.categories).map(catKey => (
                  <button
                    key={catKey}
                    id={`home-chip-${catKey}`}
                    onClick={() => handleStartFromHome(catKey)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    {t.categories[catKey as keyof typeof t.categories]}
                  </button>
                ))}
              </div>
            </div>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 text-left">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="font-bold text-white text-sm block">1. Multi-Scenario</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Simulate Conservative, Expected, Optimistic and Custom paths without opaque AI predictions.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="font-bold text-white text-sm block">2. Stress & Solvency</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Subject your choice to income loss, cost hikes, shocks, and calculate your exact 12-month breaking point.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2">
                <span className="font-bold text-white text-sm block">3. Butterfly Effect</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Isolate one single variable and trace its causal chain directly to 5-year net cashflow.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: SIMULATOR (PRIMARY ENGINE)                     */}
        {/* ==================================================== */}
        {currentView === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Simulation Header & Active Scenario Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {t.categories[currentSim.category as keyof typeof t.categories] || currentSim.category}
                  </span>
                  {currentSim.forkedFrom && (
                    <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-900 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <GitBranch className="w-2.5 h-2.5" />
                      <span>{t.futures.branch_badge}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {currentSim.name}
                </h2>
                {currentSim.description && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {currentSim.description}
                  </p>
                )}
              </div>

              {/* Top Quick Actions */}
              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                {/* Edit Assumptions Drawer Trigger */}
                <button
                  id="open-assumptions-drawer-btn"
                  onClick={() => setShowAssumptions(true)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.assumptions.title}</span>
                </button>

                {/* Compare View Switcher */}
                <button
                  id="open-compare-view-btn"
                  onClick={() => setCurrentView('compare')}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
                >
                  {t.nav.compare}
                </button>

                {/* New Simulation */}
                <button
                  id="sim-header-new-btn"
                  onClick={handleCreateNewSim}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.ui.new_sim}</span>
                </button>
              </div>
            </div>

            {/* 1. Global Timeline Bar */}
            <TimelineBar
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              lang={lang}
              onOpenForkModal={() => setShowForkModal(true)}
            />

            {/* 2. 4 Scenario Cards */}
            <ScenarioCards
              scenarios={scenarios}
              selectedMonth={selectedMonth}
              lang={lang}
              currency={currency}
              simData={currentSim}
              onUpdateCustomMods={handleUpdateCustomMods}
              onExplain={(type, metric) =>
                setExplainModal({
                  isOpen: true,
                  scenarioType: type,
                  metric
                })
              }
            />

            {/* 3. Simulation 60-Month Chart */}
            <SimulationChart
              scenarios={scenarios}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              lang={lang}
              currency={currency}
            />

            {/* 4. Stress Test Section */}
            <StressTestSection
              simData={currentSim}
              lang={lang}
              currency={currency}
            />

            {/* 5. Butterfly Effect Section (Change One Thing) */}
            <ButterflySection
              simData={currentSim}
              lang={lang}
              currency={currency}
            />

            {/* 6. Breaking Point Section (12M Solvency Limit) */}
            <BreakingPointSection
              simData={currentSim}
              lang={lang}
              currency={currency}
            />

            {/* 7. Reversibility Section */}
            <ReversibilitySection
              simData={currentSim}
              lang={lang}
              currency={currency}
            />

            {/* 8. Milestone Goals Section */}
            <GoalsSection
              simData={currentSim}
              scenarios={scenarios}
              lang={lang}
              currency={currency}
              onUpdateGoals={handleUpdateGoals}
            />
          </div>
        )}

        {/* ==================================================== */}
        {/* VIEW: COMPARE FUTURES                                */}
        {/* ==================================================== */}
        {currentView === 'compare' && (
          <CompareView
            scenarios={scenarios}
            selectedMonth={selectedMonth}
            simData={currentSim}
            lang={lang}
            currency={currency}
            onBackToSim={() => setCurrentView('simulator')}
          />
        )}

        {/* ==================================================== */}
        {/* VIEW: MY FUTURES                                     */}
        {/* ==================================================== */}
        {currentView === 'futures' && (
          <MyFuturesView
            futures={futures}
            currentSimId={currentSimId}
            onOpenSim={handleOpenSim}
            onNewSim={handleCreateNewSim}
            onRenameSim={handleRenameSim}
            onDuplicateSim={handleDuplicateSim}
            onDeleteSim={handleDeleteSim}
            onExportSim={handleExportSimJSON}
            lang={lang}
            currency={currency}
          />
        )}

        {/* ==================================================== */}
        {/* SECONDARY PAGES (How, Examples, FAQ, About, etc.)    */}
        {/* ==================================================== */}
        {(currentView === 'how' ||
          currentView === 'examples' ||
          currentView === 'faq' ||
          currentView === 'about' ||
          currentView === 'privacy' ||
          currentView === 'terms') && (
          <SecondaryPages
            page={currentView as any}
            onSelectExample={ex => {
              setFutures(prev => [ex, ...prev]);
              setCurrentSimId(ex.id);
              setCurrentView('simulator');
            }}
            onGoToSim={() => setCurrentView('simulator')}
            lang={lang}
            currency={currency}
          />
        )}
      </main>

      {/* Safety / Regulatory Disclaimer Footer Banner */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-slate-400 font-semibold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.app_name} — {t.tagline}</span>
          </div>
          <p className="leading-relaxed text-[11px]">
            {t.ui.safety_disclaimer}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] pt-1 text-slate-400">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-white">
              {t.nav.privacy}
            </button>
            <span>•</span>
            <button onClick={() => setCurrentView('terms')} className="hover:text-white">
              {t.nav.terms}
            </button>
            <span>•</span>
            <button onClick={() => setCurrentView('about')} className="hover:text-white">
              {t.nav.about}
            </button>
            <span>•</span>
            <button onClick={() => setCurrentView('faq')} className="hover:text-white">
              {t.nav.faq}
            </button>
          </div>
        </div>
      </footer>

      {/* Onboarding Category-Aware Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleCompleteOnboarding}
        lang={lang}
        currency={currency}
      />

      {/* Transparent Assumptions Drawer */}
      <AssumptionsDrawer
        isOpen={showAssumptions}
        onClose={() => setShowAssumptions(false)}
        simData={currentSim}
        onUpdateField={handleUpdateField}
        lang={lang}
        currency={currency}
      />

      {/* Explain This Modal */}
      <ExplainModal
        isOpen={explainModal.isOpen}
        onClose={() => setExplainModal(prev => ({ ...prev, isOpen: false }))}
        scenarioType={explainModal.scenarioType}
        metric={explainModal.metric}
        simData={currentSim}
        selectedMonth={selectedMonth}
        lang={lang}
        currency={currency}
      />

      {/* Fork Checkpoint Modal */}
      <ForkModal
        isOpen={showForkModal}
        onClose={() => setShowForkModal(false)}
        simData={currentSim}
        checkpointMonth={selectedMonth}
        expectedPointCash={expectedPointCash}
        onConfirmFork={handleConfirmFork}
        lang={lang}
        currency={currency}
      />
    </div>
  );
};

export default App;
