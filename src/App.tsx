// src/App.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { SupportedLang, SupportedCurrency } from './i18n';
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from './types/decision';
import { CoPilotResponse, SmartCTAAction } from './types/planning';
import { analyzeProjectInput } from './services/ai/projectAnalyzer';
import { calculateFeasibility } from './logic/feasibilityEngine';
import { buildAdaptiveLevel1Summary } from './services/ai/adaptiveDepthEngine';

import { TopBar } from './components/ui/TopBar';
import { HeroInput } from './features/project-input/HeroInput';
import { SmartQuestionnaire } from './features/project-input/SmartQuestionnaire';
import { AdaptiveVerdictHero } from './features/results/AdaptiveVerdictHero';
import { SavingsSolutionFinderModal } from './features/results/SavingsSolutionFinderModal';
import { FeasibilityHero } from './features/results/FeasibilityHero';
import { KeyMetricsGrid } from './features/results/KeyMetricsGrid';
import { MainProblemCard } from './features/results/MainProblemCard';
import { RecommendationCard } from './features/results/RecommendationCard';
import { DomainSpecificCard } from './features/results/DomainSpecificCard';
import { SmartCTASection } from './features/results/SmartCTASection';
import { ActionPlanSection } from './features/results/ActionPlanSection';
import { SolutionVariantsSection } from './features/results/SolutionVariantsSection';
import { MilestonesPathSection } from './features/results/MilestonesPathSection';
import { ScenariosSection } from './features/scenarios/ScenariosSection';
import { DetailedAnalysisDrawer } from './features/results/DetailedAnalysisDrawer';
import { ShareReportModal } from './features/results/ShareReportModal';
import { SavedProjectsDrawer } from './features/projects/SavedProjectsDrawer';
import { CopilotTrustStrip } from './features/results/CopilotTrustStrip';
import { OpportunityRadar } from './features/results/OpportunityRadar';
import { CriticAuditCard } from './features/results/CriticAuditCard';
import { TelemetryModal } from './features/results/TelemetryModal';

import { Share2, ArrowLeft, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const STORAGE_SAVED_PROJECTS = 'whatif_saved_decisions_v3';
const STORAGE_LANG = 'whatif_lang_v3';
const STORAGE_CURRENCY = 'whatif_currency_v3';

export const App: React.FC = () => {
  // 1. Language & Currency preferences
  const [lang, setLang] = useState<SupportedLang>(() => {
    const saved = localStorage.getItem(STORAGE_LANG);
    return saved === 'fr' || saved === 'es' || saved === 'en' ? (saved as SupportedLang) : 'fr';
  });

  const [currency, setCurrency] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem(STORAGE_CURRENCY);
    return saved === 'EUR' || saved === 'USD' || saved === 'GBP' || saved === 'CHF'
      ? (saved as SupportedCurrency)
      : 'EUR';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_LANG, lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CURRENCY, currency);
  }, [currency]);

  // 2. Application Flow State
  const [viewState, setViewState] = useState<'input' | 'questionnaire' | 'results'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active analysis & co-pilot state
  const [activeData, setActiveData] = useState<UserExtractedData | null>(null);
  const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<DecisionAnalysis | null>(null);
  const [activeCoPilot, setActiveCoPilot] = useState<CoPilotResponse | null>(null);
  const [showFullFinancials, setShowFullFinancials] = useState(false);

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSavingsFinderOpen, setIsSavingsFinderOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  // 3. Saved projects list in localStorage
  const [savedProjects, setSavedProjects] = useState<DecisionAnalysis[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_PROJECTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved projects', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_PROJECTS, JSON.stringify(savedProjects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [savedProjects]);

  // Helper to persist current analysis to saved list
  const saveCurrentAnalysis = (analysis: DecisionAnalysis) => {
    setSavedProjects(prev => {
      const filtered = prev.filter(p => p.id !== analysis.id);
      return [analysis, ...filtered];
    });
  };

  // Level 1 Adaptive Summary calculation (5-second rule)
  const adaptiveSummary = useMemo(() => {
    if (!activeAnalysis) return null;
    return buildAdaptiveLevel1Summary(activeAnalysis, activeAnalysis.userInput, lang, currency);
  }, [activeAnalysis, lang, currency]);

  const handlePrimaryAction = () => {
    if (!adaptiveSummary) return;
    const type = adaptiveSummary.primaryAction.actionType;
    if (type === 'SAVINGS_FINDER') {
      setIsSavingsFinderOpen(true);
    } else if (type === 'ACTION_PLAN') {
      const el = document.getElementById('action-plan-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'OPPORTUNITIES') {
      const el = document.getElementById('opportunity-radar-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'VARIANTS') {
      const el = document.getElementById('solution-variants-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSecondaryAction = () => {
    if (!adaptiveSummary?.secondaryAction) return;
    const type = adaptiveSummary.secondaryAction.actionType;
    if (type === 'SAVINGS_FINDER') {
      setIsSavingsFinderOpen(true);
    } else if (type === 'ACTION_PLAN') {
      const el = document.getElementById('action-plan-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'OPPORTUNITIES') {
      const el = document.getElementById('opportunity-radar-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'VARIANTS') {
      const el = document.getElementById('solution-variants-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (type === 'FULL_FINANCIALS') {
      setShowFullFinancials(true);
      const el = document.getElementById('full-financials-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApplySavings = (monthlySaved: number) => {
    if (!activeAnalysis || !activeData) return;
    const oldExpenses = activeData.monthlyExpenses !== undefined ? activeData.monthlyExpenses : 2000;
    const newExpenses = Math.max(0, oldExpenses - monthlySaved);
    const updatedData: UserExtractedData = {
      ...activeData,
      monthlyExpenses: newExpenses
    };
    setActiveData(updatedData);
    const reCalculated = calculateFeasibility(updatedData, lang, currency);
    setActiveAnalysis(reCalculated);
    saveCurrentAnalysis(reCalculated);
  };

  // 4. Initial Prompt Submission
  const handleInitialSubmit = async (prompt: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await analyzeProjectInput(prompt, undefined, lang, currency);
      setActiveData(res.data);
      if (res.coPilot) {
        setActiveCoPilot(res.coPilot);
      }

      if (res.isReadyForAnalysis && res.analysis) {
        setActiveAnalysis(res.analysis);
        saveCurrentAnalysis(res.analysis);
        setViewState('results');
      } else if (res.missingQuestions && res.missingQuestions.length > 0) {
        setMissingQuestions(res.missingQuestions);
        setViewState('questionnaire');
      } else {
        // Compute immediately with standard defaults
        const calculated = calculateFeasibility(res.data, lang, currency);
        setActiveAnalysis(calculated);
        saveCurrentAnalysis(calculated);
        setViewState('results');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(
        lang === 'fr'
          ? 'Je n’ai pas réussi à analyser cette partie. Tes données sont conservées. Réessaie.'
          : lang === 'es'
          ? 'No se ha podido completar este análisis. Tus datos están a salvo. Por favor, inténtalo de nuevo.'
          : 'Could not complete the analysis. Your data is preserved. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Questionnaire Submission
  const handleQuestionnaireSubmit = async (updatedData: UserExtractedData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await analyzeProjectInput(updatedData.prompt, updatedData, lang, currency);
      setActiveData(updatedData);
      if (res.coPilot) {
        setActiveCoPilot(res.coPilot);
      }
      if (res.analysis) {
        setActiveAnalysis(res.analysis);
        saveCurrentAnalysis(res.analysis);
      } else {
        const calculated = calculateFeasibility(updatedData, lang, currency);
        setActiveAnalysis(calculated);
        saveCurrentAnalysis(calculated);
      }
      setViewState('results');
    } catch (err) {
      console.error('Questionnaire error:', err);
      setErrorMessage(
        lang === 'fr'
          ? 'Erreur lors du calcul de faisabilité. Réessaie.'
          : 'Error calculating feasibility. Please retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback if user chooses "Utiliser les estimations du secteur"
  const handleUseMarketDefaults = async () => {
    if (!activeData) return;
    setIsLoading(true);
    try {
      const res = await analyzeProjectInput(activeData.prompt, activeData, lang, currency);
      if (res.coPilot) setActiveCoPilot(res.coPilot);
      const calculated = res.analysis || calculateFeasibility(activeData, lang, currency);
      setActiveAnalysis(calculated);
      saveCurrentAnalysis(calculated);
      setViewState('results');
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Smart CTA Execution
  const handleExecuteCTA = (cta: SmartCTAAction) => {
    if (!activeData) return;

    if (cta.actionType === 'WAIT_MONTHS' && cta.payload?.months && cta.payload?.monthlyRate) {
      const extra = cta.payload.months * cta.payload.monthlyRate;
      const newBudget = (activeData.budget || 0) + extra;
      const newPrompt = `${activeData.prompt} (Avec ${newBudget.toLocaleString()} € de budget après ${cta.payload.months} mois d'épargne)`;
      handleInitialSubmit(newPrompt);
    } else if (cta.actionType === 'FIND_CHEAPER') {
      const newPrompt = `Trouve-moi une version optimisée ou moins chère pour : ${activeData.prompt}`;
      handleInitialSubmit(newPrompt);
    } else if (cta.actionType === 'BUILD_PATH') {
      const el = document.getElementById('milestones-path-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (cta.actionType === 'START_THIS_WEEK') {
      const minimal = activeAnalysis?.variants.minimal;
      const targetName = minimal?.name || 'Version minimale';
      const cost = minimal?.estimatedCost || 500;
      const newPrompt = `Comment lancer cette semaine avec mes moyens la version lean : ${targetName} (${cost} €) ?`;
      handleInitialSubmit(newPrompt);
    } else if (cta.actionType === 'CHANGE_COUNTRY') {
      const newPrompt = `Quelles sont les meilleures destinations alternatives pour : ${activeData.prompt} ?`;
      handleInitialSubmit(newPrompt);
    }
  };

  // Start a fresh project
  const handleNewProject = () => {
    setActiveData(null);
    setActiveAnalysis(null);
    setActiveCoPilot(null);
    setMissingQuestions([]);
    setErrorMessage(null);
    setShowFullFinancials(false);
    setViewState('input');
  };

  // Select a saved project
  const handleSelectSavedProject = (proj: DecisionAnalysis) => {
    setActiveAnalysis(proj);
    setActiveData(proj.userInput);
    setViewState('results');
  };

  const handleDeleteSavedProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <TopBar
        lang={lang}
        onSelectLang={setLang}
        currency={currency}
        onSelectCurrency={setCurrency}
        savedCount={savedProjects.length}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onNewProject={handleNewProject}
        hasActiveProject={viewState !== 'input'}
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
      />

      {/* Error Notice */}
      {errorMessage && (
        <div className="max-w-2xl mx-auto mt-4 px-4 w-full">
          <div className="p-4 rounded-2xl border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs sm:text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline cursor-pointer hover:text-white"
            >
              {lang === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {/* VIEW 1: HERO INPUT (Ultra-simple conversational start) */}
        {viewState === 'input' && (
          <HeroInput lang={lang} onSubmit={handleInitialSubmit} isLoading={isLoading} />
        )}

        {/* VIEW 2: SMART QUESTIONNAIRE (1 to 3 dynamic questions if data missing) */}
        {viewState === 'questionnaire' && activeData && (
          <SmartQuestionnaire
            questions={missingQuestions}
            initialData={activeData}
            lang={lang}
            currency={currency}
            onSubmitAnswers={handleQuestionnaireSubmit}
            onUseMarketDefaults={handleUseMarketDefaults}
            isLoading={isLoading}
          />
        )}

        {/* VIEW 3: RESULTS (Crystal-clear decision analysis & action plan) */}
        {viewState === 'results' && activeAnalysis && (
          <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 pb-28">
            {/* Top Navigation Back & Share */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setViewState('input')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors focus:outline-none cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>
                  {lang === 'fr'
                    ? 'Poser une autre question'
                    : lang === 'es'
                    ? 'Hacer otra consulta'
                    : 'Ask another question'}
                </span>
              </button>

              <button
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {lang === 'fr' ? 'Partager le rapport' : 'Share Report'}
                </span>
              </button>
            </div>

            {/* ==================================================================== */}
            {/* NIVEAU 1 : RÈGLE DES 5 SECONDES (VERDICT, CHIFFRE CLÉ, ACTION IMMÉDIATE) */}
            {/* ==================================================================== */}
            {adaptiveSummary && (
              <AdaptiveVerdictHero
                summary={adaptiveSummary}
                projectTitle={activeAnalysis.userInput.projectTitle}
                lang={lang}
                currency={currency}
                onExecutePrimaryAction={handlePrimaryAction}
                onExecuteSecondaryAction={handleSecondaryAction}
                onOpenSavingsFinder={() => setIsSavingsFinderOpen(true)}
                onOpenFullFinancials={() => setShowFullFinancials(true)}
                onScrollToSection={id => {
                  const el = document.getElementById(id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}

            {/* ==================================================================== */}
            {/* NIVEAU 2 : PLAN CONCRET & SOLUTIONS (ACCESSIBLE, SANS JARGON)         */}
            {/* ==================================================================== */}
            <div className="space-y-6 pt-2">
              {/* Priorité n°1 & Ce que je te recommande */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MainProblemCard
                  title={activeCoPilot?.mainObstacle.title || activeAnalysis.mainProblem.title}
                  description={activeCoPilot?.mainObstacle.description || activeAnalysis.mainProblem.description}
                  priorityLevel={activeAnalysis.mainProblem.priorityLevel}
                  lang={lang}
                />
                <RecommendationCard
                  recommendationText={
                    activeCoPilot?.recommendationShortPlan ||
                    (lang === 'fr'
                      ? '1. Conserve un matelas de sécurité. 2. Démarre par la version optimisée ou lean. 3. Active les aides disponibles pour sécuriser ton lancement.'
                      : '1. Preserve a safety buffer. 2. Start with the leanest viable version. 3. Claim all eligible grants and subsidies.')
                  }
                  lang={lang}
                />
              </div>

              {/* 2. Key Metrics Grid (Chiffres clés de trésorerie) */}
              <KeyMetricsGrid
                budgetAvailable={activeAnalysis.metrics.budgetAvailable}
                budgetNeeded={activeAnalysis.metrics.budgetNeeded}
                gap={activeAnalysis.metrics.gap}
                monthlyMargin={activeAnalysis.metrics.monthlyMargin}
                realisticMonths={activeAnalysis.metrics.realisticMonths}
                lang={lang}
                currency={currency}
              />

              {/* 2.1 Moteur d'aides & Opportunités (Radar des aides) */}
              <div id="opportunity-radar-section">
                <OpportunityRadar
                  prompt={activeAnalysis.userInput.prompt}
                  domain={activeCoPilot?.domainAnalysis?.domain || activeAnalysis.userInput.category}
                  budget={activeAnalysis.metrics.budgetAvailable}
                  targetCost={activeAnalysis.metrics.budgetNeeded}
                  lang={lang}
                  currency={currency}
                />
              </div>

              {/* 3. Plan d'Action étape par étape */}
              <div id="action-plan-section">
                <ActionPlanSection steps={activeAnalysis.actionPlan} lang={lang} />
              </div>

              {/* 4. Mode "Trouve-moi une solution" (3 Variantes : Originale, Allégée, Minimale) */}
              <div id="solution-variants-section">
                <SolutionVariantsSection
                  variants={activeAnalysis.variants}
                  lang={lang}
                  currency={currency}
                />
              </div>

              {/* 5. "Construis-moi le chemin" : Jalons & Trajectoire */}
              {activeCoPilot?.constructedPath && (
                <MilestonesPathSection
                  milestones={activeCoPilot.constructedPath}
                  lang={lang}
                  currency={currency}
                />
              )}

              {/* 6. Intelligence spécifique au domaine (Voyage, Reconversations, Entreprise) */}
              <DomainSpecificCard
                coPilotData={activeCoPilot || undefined}
                lang={lang}
                currency={currency}
              />

              {/* 7. Smart CTAs */}
              {activeCoPilot?.smartCTAs && activeCoPilot.smartCTAs.length > 0 && (
                <SmartCTASection
                  ctas={activeCoPilot.smartCTAs}
                  lang={lang}
                  onExecuteCTA={handleExecuteCTA}
                />
              )}
            </div>

            {/* ==================================================================== */}
            {/* NIVEAU 3 : ANALYSE COMPLÈTE & CRASH-TESTS (REFERMÉ PAR DÉFAUT)       */}
            {/* ==================================================================== */}
            <div id="full-financials-section" className="pt-6 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setShowFullFinancials(prev => !prev)}
                className="w-full py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-sm sm:text-base font-bold text-slate-200 transition-all cursor-pointer shadow-md"
              >
                <span className="flex items-center gap-2">
                  <span>
                    {showFullFinancials
                      ? (lang === 'fr' ? 'Masquer l’analyse financière détaillée' : 'Hide detailed financial analysis')
                      : (lang === 'fr' ? '🔍 Voir l’analyse financière complète (Scénarios & Crash-tests)' : '🔍 View full financial analysis (Scenarios & Stress-tests)')}
                  </span>
                </span>
                {showFullFinancials ? <ChevronUp className="w-5 h-5 text-indigo-400" /> : <ChevronDown className="w-5 h-5 text-indigo-400" />}
              </button>

              {showFullFinancials && (
                <div className="space-y-8 pt-6">
                  {/* Score classique et jauge de faisabilité */}
                  <FeasibilityHero
                    verdict={activeAnalysis.verdict}
                    verdictTitle={activeCoPilot?.headlineVerdict || activeAnalysis.verdictTitle}
                    verdictSummary={activeCoPilot?.whySummary || activeAnalysis.verdictSummary}
                    score={activeAnalysis.score}
                    projectTitle={activeAnalysis.userInput.projectTitle}
                    lang={lang}
                  />

                  {/* Scenarios: Prudent, Réaliste, Favorable */}
                  <ScenariosSection
                    scenarios={activeAnalysis.scenarios}
                    lang={lang}
                    currency={currency}
                  />

                  {/* Audit de Rigueur de l'Agent Critique */}
                  <CriticAuditCard
                    input={activeAnalysis.userInput}
                    analysis={activeAnalysis}
                    coPilot={activeCoPilot || undefined}
                    lang={lang}
                  />

                  {/* Data Grounding & Provenance (Transparency Strip) */}
                  <CopilotTrustStrip
                    facts={activeCoPilot?.researchData?.facts}
                    lang={lang}
                  />

                  {/* Detailed Analysis Drawer (Stress tests, Breaking point, Data Provenance) */}
                  <DetailedAnalysisDrawer
                    analysis={activeAnalysis}
                    lang={lang}
                    currency={currency}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Interactive Savings Solution Finder Modal */}
      {isSavingsFinderOpen && activeAnalysis && (
        <SavingsSolutionFinderModal
          isOpen={isSavingsFinderOpen}
          onClose={() => setIsSavingsFinderOpen(false)}
          gapNeeded={Math.abs(activeAnalysis.metrics.gap || activeAnalysis.metrics.budgetNeeded)}
          targetMonthlySavings={adaptiveSummary?.targetSavingsMonthly || 300}
          currentExpenses={activeData?.monthlyExpenses || 2000}
          lang={lang}
          currency={currency}
          onApplySavings={handleApplySavings}
        />
      )}

      {/* Share Report Modal */}
      {isShareModalOpen && activeAnalysis && (
        <ShareReportModal
          analysis={activeAnalysis}
          lang={lang}
          currency={currency}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {/* Saved Projects Drawer */}
      <SavedProjectsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedProjects={savedProjects}
        onSelectProject={handleSelectSavedProject}
        onDeleteProject={handleDeleteSavedProject}
        lang={lang}
        currency={currency}
      />

      {/* Telemetry & Cost Observability Modal */}
      <TelemetryModal
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        lang={lang}
      />
    </div>
  );
};

export default App;
