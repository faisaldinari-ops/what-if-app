// src/App.tsx
import React, { useState, useEffect } from 'react';
import { SupportedLang, SupportedCurrency } from './i18n';
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from './types/decision';
import { analyzeProjectInput } from './services/ai/projectAnalyzer';
import { calculateFeasibility } from './logic/feasibilityEngine';

import { TopBar } from './components/ui/TopBar';
import { HeroInput } from './features/project-input/HeroInput';
import { SmartQuestionnaire } from './features/project-input/SmartQuestionnaire';
import { FeasibilityHero } from './features/results/FeasibilityHero';
import { KeyMetricsGrid } from './features/results/KeyMetricsGrid';
import { MainProblemCard } from './features/results/MainProblemCard';
import { ActionPlanSection } from './features/results/ActionPlanSection';
import { SolutionVariantsSection } from './features/results/SolutionVariantsSection';
import { ScenariosSection } from './features/scenarios/ScenariosSection';
import { DetailedAnalysisDrawer } from './features/results/DetailedAnalysisDrawer';
import { ShareReportModal } from './features/results/ShareReportModal';
import { SavedProjectsDrawer } from './features/projects/SavedProjectsDrawer';

import { Share2, PlusCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

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

  // Active analysis state
  const [activeData, setActiveData] = useState<UserExtractedData | null>(null);
  const [missingQuestions, setMissingQuestions] = useState<MissingQuestion[]>([]);
  const [activeAnalysis, setActiveAnalysis] = useState<DecisionAnalysis | null>(null);

  // Modals & Drawers
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

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

  // 4. Initial Prompt Submission
  const handleInitialSubmit = async (prompt: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await analyzeProjectInput(prompt, undefined, lang, currency);
      setActiveData(res.data);

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
  const handleQuestionnaireSubmit = (updatedData: UserExtractedData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const calculated = calculateFeasibility(updatedData, lang, currency);
      setActiveData(updatedData);
      setActiveAnalysis(calculated);
      saveCurrentAnalysis(calculated);
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
  const handleUseMarketDefaults = () => {
    if (!activeData) return;
    setIsLoading(true);
    try {
      const calculated = calculateFeasibility(activeData, lang, currency);
      setActiveAnalysis(calculated);
      saveCurrentAnalysis(calculated);
      setViewState('results');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a fresh project
  const handleNewProject = () => {
    setActiveData(null);
    setActiveAnalysis(null);
    setMissingQuestions([]);
    setErrorMessage(null);
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
            {/* Top Navigation Back */}
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

            {/* 1. Verdict & Score (Feasibility Hero) */}
            <FeasibilityHero
              verdict={activeAnalysis.verdict}
              verdictTitle={activeAnalysis.verdictTitle}
              verdictSummary={activeAnalysis.verdictSummary}
              score={activeAnalysis.score}
              projectTitle={activeAnalysis.userInput.projectTitle}
              lang={lang}
            />

            {/* 2. Key Metrics Grid (4 to 6 numbers maximum) */}
            <KeyMetricsGrid
              budgetAvailable={activeAnalysis.metrics.budgetAvailable}
              budgetNeeded={activeAnalysis.metrics.budgetNeeded}
              gap={activeAnalysis.metrics.gap}
              monthlyMargin={activeAnalysis.metrics.monthlyMargin}
              realisticMonths={activeAnalysis.metrics.realisticMonths}
              lang={lang}
              currency={currency}
            />

            {/* 3. Main Problem (Single priority) */}
            <MainProblemCard
              title={activeAnalysis.mainProblem.title}
              description={activeAnalysis.mainProblem.description}
              priorityLevel={activeAnalysis.mainProblem.priorityLevel}
              lang={lang}
            />

            {/* 4. Action Plan: "Comment je le fais ?" (Central feature!) */}
            <ActionPlanSection steps={activeAnalysis.actionPlan} lang={lang} />

            {/* 5. Mode "Trouve-moi une solution" (3 Variants: Original, Reduced, Minimal) */}
            <SolutionVariantsSection
              variants={activeAnalysis.variants}
              lang={lang}
              currency={currency}
            />

            {/* 6. 3 Scenarios: Prudent, Réaliste, Favorable */}
            <ScenariosSection
              scenarios={activeAnalysis.scenarios}
              lang={lang}
              currency={currency}
            />

            {/* 7. Detailed Analysis Drawer (Stress tests, Breaking point, Hypotheses) */}
            <DetailedAnalysisDrawer
              analysis={activeAnalysis}
              lang={lang}
              currency={currency}
            />
          </div>
        )}
      </main>

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
    </div>
  );
};
export default App;
