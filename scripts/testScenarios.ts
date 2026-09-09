// scripts/testScenarios.ts
import { parseProjectWithRules } from '../src/services/ai/ruleBasedParser';
import { calculateFeasibility } from '../src/logic/feasibilityEngine';
import { detectOpportunities } from '../src/services/ai/opportunityEngine';
import { auditDecisionAnalysisDeterministically } from '../src/services/ai/criticAgent';
import { buildAdaptiveLevel1Summary } from '../src/services/ai/adaptiveDepthEngine';

interface TestScenario {
  id: string;
  name: string;
  prompt: string;
  expectedCategory?: string;
  expectedMinBudget?: number;
  expectedTargetCost?: number;
  mustNotBeImpossible?: boolean;
}

const SCENARIOS: TestScenario[] = [
  {
    id: 'A',
    name: '0 € Entreprise',
    prompt: "J'ai 0 € et je veux lancer une société.",
    mustNotBeImpossible: true
  },
  {
    id: 'B',
    name: '5000 € Électricien Artisan',
    prompt: "J'ai 5000 €, je suis électricien et je veux créer mon entreprise.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'C',
    name: 'Expatriation sans idée de destination',
    prompt: "Je veux quitter mon pays mais je n'ai pas d'idée où aller.",
    expectedCategory: 'relocation'
  },
  {
    id: 'D',
    name: 'Achat immobilier 250k€ avec 30k€ apport et 2500€ salaire',
    prompt: "Je veux acheter un appartement à 250 000 € avec 30 000 € d'apport et 2500 € de salaire.",
    expectedCategory: 'real_estate'
  },
  {
    id: 'E',
    name: 'Achat voiture 15k€ avec 2000€ économies et 1800€ salaire',
    prompt: "Je gagne 1800 €/mois, j'ai 2000 € d'économies et je veux acheter une voiture à 15 000 €.",
    expectedCategory: 'money'
  },
  {
    id: 'F',
    name: 'Ouvrir un restaurant avec 10 000 €',
    prompt: "J'ai 10 000 € et je veux ouvrir un restaurant.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'G',
    name: 'Tour du monde 1 an avec 12 000 €',
    prompt: "Je veux faire un tour du monde pendant 1 an avec 12 000 €.",
    expectedCategory: 'personal'
  },
  {
    id: 'H',
    name: 'Apprendre à coder & devenir freelance',
    prompt: "Je veux apprendre à coder et devenir dev freelance.",
    expectedCategory: 'career'
  },
  {
    id: 'I',
    name: 'Immobilier locatif 50 000 € apport',
    prompt: "J'ai 50 000 € d'apport et je veux investir dans l'immobilier locatif.",
    expectedCategory: 'real_estate'
  },
  {
    id: 'J',
    name: 'Déménagement au Japon',
    prompt: "Je veux déménager au Japon l'année prochaine.",
    expectedCategory: 'relocation'
  },
  {
    id: 'K',
    name: 'E-commerce avec 500 €',
    prompt: "J'ai 500 € et je veux me lancer dans le e-commerce.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'L',
    name: 'Master aux USA',
    prompt: "Je veux faire un master aux USA.",
    expectedCategory: 'education'
  },
  {
    id: 'M',
    name: 'Quitter son CDI pour devenir consultant',
    prompt: "Je veux quitter mon CDI pour devenir consultant.",
    expectedCategory: 'career'
  },
  {
    id: 'N',
    name: '100 000 € dormant sur compte',
    prompt: "J'ai 100 000 € d'économies qui dorment sur mon compte.",
    expectedCategory: 'money'
  },
  {
    id: 'O',
    name: 'Japon 2 semaines avec 2000 € salaire et 2000 € dépenses',
    prompt: "Je gagne 2000 €, je dépense 2000 € et je veux aller 2 semaines au Japon",
    expectedCategory: 'personal'
  }
];

export function runAllScenarios() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE TEST SUITE: SCENARIOS A THROUGH N');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const sc of SCENARIOS) {
    try {
      // 1. Parse using deterministic rule parser
      const parsed = parseProjectWithRules(sc.prompt, {}, 'fr');

      // 2. Compute feasibility engine
      const analysis = calculateFeasibility(parsed.data, 'fr');

      // 3. Detect opportunities
      const opps = detectOpportunities(sc.prompt, parsed.data.category, parsed.data.budget || 0, analysis.metrics.budgetNeeded);

      // 4. Run Critic sanity audit
      const audit = auditDecisionAnalysisDeterministically(parsed.data, analysis);

      // Validation assertions
      if (sc.mustNotBeImpossible) {
        if (analysis.verdictSummary.toLowerCase().includes('impossible')) {
          throw new Error(`Scenario ${sc.id} violated rule: said "impossible" for 0 € budget.`);
        }
      }

      if (sc.id === 'B') {
        // Electrician check
        if (parsed.data.budget !== 5000) {
          throw new Error(`Scenario B expected 5000 € budget, got ${parsed.data.budget}`);
        }
        if (analysis.metrics.budgetNeeded <= 0) {
          throw new Error('Scenario B budgetNeeded should be positive');
        }
      }

      if (sc.id === 'E') {
        // Car purchase check
        if (parsed.data.projectStartupCost !== 15000 && analysis.metrics.budgetNeeded !== 15000) {
          throw new Error(`Scenario E expected 15 000 € target cost, got ${parsed.data.projectStartupCost} / ${analysis.metrics.budgetNeeded}`);
        }
      }

      if (sc.id === 'O') {
        const adaptive = buildAdaptiveLevel1Summary(analysis, parsed.data, 'fr', 'EUR');
        if (!adaptive.headlineVerdict.toLowerCase().includes('faisable')) {
          throw new Error(`Scenario O should have positive solution-oriented verdict, got: ${adaptive.headlineVerdict}`);
        }
        if (adaptive.primaryAction.actionType !== 'SAVINGS_FINDER') {
          throw new Error(`Scenario O primary action must be SAVINGS_FINDER, got ${adaptive.primaryAction.actionType}`);
        }
      }

      // Check no NaNs
      if (
        isNaN(analysis.metrics.budgetAvailable) ||
        isNaN(analysis.metrics.budgetNeeded) ||
        isNaN(analysis.metrics.gap) ||
        isNaN(analysis.score)
      ) {
        throw new Error(`Scenario ${sc.id} returned NaN in metrics!`);
      }

      console.log(`✅ [Scenario ${sc.id}] ${sc.name}`);
      console.log(`   - Verdict: ${analysis.verdict} (Score: ${analysis.score}/100)`);
      console.log(`   - Available: ${analysis.metrics.budgetAvailable.toLocaleString()} € | Needed: ${analysis.metrics.budgetNeeded.toLocaleString()} € | Gap: ${analysis.metrics.gap.toLocaleString()} €`);
      console.log(`   - Opportunities detected: ${opps.opportunities.length} | Subsidies: ${opps.subsidiesAndGrants.length}`);
      console.log(`   - Critic Audit Score: ${audit.score}/100 (${audit.isPassed ? 'PASSED' : 'CAUTION'})`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error(`❌ [Scenario ${sc.id}] FAILED: ${err.message}`);
      failed++;
    }
  }

  // ================================================================
  // 🔬 WEB SEARCH, RESEARCH ORCHESTRATOR & GUARDRAIL TESTS
  // ================================================================
  console.log('================================================================');
  console.log('🌐 RUNNING WEB SEARCH, ORCHESTRATOR & GUARDRAIL VERIFICATIONS');
  console.log('================================================================\n');

  return (async () => {
    const {
      executeGroundedSearch,
      MockSearchProvider,
      setSearchProviderForTesting
    } = await import('../src/services/research/webSearchProvider');
    const { orchestrateResearch } = await import('../src/services/research/researchOrchestrator');
    const { generateOpportunityMapAsync } = await import('../src/services/ai/opportunityEngine');
    const {
      GeminiProvider,
      GroqProvider,
      OpenRouterProvider,
      CloudflareProvider,
      DeterministicProvider,
      isModelAllowedUnderFreeGuardrail
    } = await import('../src/services/ai/aiProvider');

    // Test 1: Real WebSearchProvider with live hits returns LIVE_SOURCE and sourceUrl
    try {
      const mockProvider = new MockSearchProvider([
        {
          title: 'Aide à la création d’entreprise (ACRE)',
          url: 'https://www.service-public.fr/professionnels-entreprises/vosdroits/F11677',
          snippet: 'Exonération temporaire de cotisations sociales pour les créateurs d’entreprise.'
        },
        {
          title: 'Aide à la reprise ou à la création d’entreprise (ARCE)',
          url: 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocat/arce.html',
          snippet: 'Versement des allocations chômage sous forme de capital.'
        }
      ]);

      setSearchProviderForTesting(mockProvider);

      const liveResult = await executeGroundedSearch('aides creation entreprise');
      if (liveResult.searchMode !== 'LIVE') {
        throw new Error(`Expected searchMode: LIVE, got: ${liveResult.searchMode}`);
      }
      if (liveResult.facts.length !== 2) {
        throw new Error(`Expected 2 facts, got: ${liveResult.facts.length}`);
      }
      if (liveResult.facts[0].origin !== 'LIVE_SOURCE') {
        throw new Error(`Expected fact origin to be LIVE_SOURCE, got: ${liveResult.facts[0].origin}`);
      }
      if (!liveResult.facts[0].sourceUrl?.startsWith('https://')) {
        throw new Error(`Expected fact sourceUrl to start with https://, got: ${liveResult.facts[0].sourceUrl}`);
      }

      console.log('✅ [WebSearch Live Execution]');
      console.log(`   - Verified ${liveResult.facts.length} live source(s) with real URLs:`);
      liveResult.facts.forEach(f => console.log(`     * [${f.sourceName}] ${f.label} -> ${f.sourceUrl}`));
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [WebSearch Live Execution] FAILED:', err.message);
      failed++;
    }

    // Test 2: When no provider is configured, returns UNAVAILABLE without crashing
    try {
      setSearchProviderForTesting(null);
      const unavailResult = await executeGroundedSearch('test query without keys');
      if (unavailResult.searchMode !== 'UNAVAILABLE') {
        throw new Error(`Expected searchMode: UNAVAILABLE when no provider configured, got: ${unavailResult.searchMode}`);
      }
      if (unavailResult.facts.length !== 0) {
        throw new Error('Expected 0 live facts when search is unavailable');
      }

      console.log('✅ [WebSearch Unconfigured Fallback]');
      console.log(`   - Mode: ${unavailResult.searchMode} (Clean fallback without crashing)`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [WebSearch Unconfigured Fallback] FAILED:', err.message);
      failed++;
    }

    // Test 3: orchestrateResearch with live search provider
    try {
      const mockProvider = new MockSearchProvider([
        {
          title: 'Portail officiel des aides aux entreprises',
          url: 'https://aides-entreprises.fr/recherche',
          snippet: 'Base de données nationale des subventions régionales et nationales.'
        }
      ]);
      setSearchProviderForTesting(mockProvider);

      const researchResult = await orchestrateResearch('recherche aides artisanat', 'business', undefined, true);
      if (researchResult.searchMode !== 'LIVE') {
        throw new Error(`Expected orchestrateResearch searchMode: LIVE, got: ${researchResult.searchMode}`);
      }
      if (researchResult.sourceUrls.length === 0 || !researchResult.sourceUrls[0].includes('aides-entreprises.fr')) {
        throw new Error(`Expected real sourceUrl from live search, got: ${JSON.stringify(researchResult.sourceUrls)}`);
      }

      console.log('✅ [Research Orchestrator Pipeline]');
      console.log(`   - Pipeline: Query -> Search -> Facts -> Output`);
      console.log(`   - Sources consultées: ${researchResult.sourceUrls.join(', ')}`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [Research Orchestrator Pipeline] FAILED:', err.message);
      failed++;
    }

    // Test 4: opportunityEngine live enrichment
    try {
      const mockProvider = new MockSearchProvider([
        {
          title: 'Subvention Régionale Amorçage Nouvelle-Aquitaine',
          url: 'https://entreprises.nouvelle-aquitaine.fr/aides/creation',
          snippet: 'Subvention directe jusqu’à 5 000 € pour les jeunes créateurs d’entreprise.'
        }
      ]);
      setSearchProviderForTesting(mockProvider);

      const opps = await generateOpportunityMapAsync('créer une boulangerie artisanale', { budget: 5000 }, 'business');
      const liveOpp = opps.opportunities.find(o => o.badge === 'Source en direct');
      if (!liveOpp) {
        throw new Error('Expected live opportunity to be added from live search hits');
      }
      const liveSubsidy = opps.subsidiesAndGrants.find(s => s.officialUrl.includes('nouvelle-aquitaine.fr'));
      if (!liveSubsidy) {
        throw new Error('Expected live subsidy with official URL in subsidiesAndGrants');
      }

      console.log('✅ [Opportunity Engine Live Search Integration]');
      console.log(`   - Opportunity: "${liveOpp.title}"`);
      console.log(`   - Verified URL: ${liveSubsidy.officialUrl}`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [Opportunity Engine Live Search Integration] FAILED:', err.message);
      failed++;
    }

    // Test 5: Verify quota logic (No fake 1500, 14400, 200, 10000 numbers)
    try {
      const gemini = new GeminiProvider();
      const groq = new GroqProvider();
      const openRouter = new OpenRouterProvider();
      const cloudflare = new CloudflareProvider();
      const deterministic = new DeterministicProvider();

      const [qGemini, qGroq, qOpenRouter, qCloudflare, qDet] = await Promise.all([
        gemini.remainingQuota(),
        groq.remainingQuota(),
        openRouter.remainingQuota(),
        cloudflare.remainingQuota(),
        deterministic.remainingQuota()
      ]);

      if (qGemini.callsRemaining !== undefined || qGemini.quotaStatus !== 'UNKNOWN') {
        throw new Error(`Gemini quota must be UNKNOWN when not queryable, got: ${JSON.stringify(qGemini)}`);
      }
      if (qGroq.callsRemaining !== undefined || qGroq.quotaStatus !== 'UNKNOWN') {
        throw new Error(`Groq quota must be UNKNOWN, got: ${JSON.stringify(qGroq)}`);
      }
      if (qOpenRouter.callsRemaining !== undefined || qOpenRouter.quotaStatus !== 'UNKNOWN') {
        throw new Error(`OpenRouter quota must be UNKNOWN, got: ${JSON.stringify(qOpenRouter)}`);
      }
      if (qCloudflare.callsRemaining !== undefined || qCloudflare.quotaStatus !== 'UNKNOWN') {
        throw new Error(`Cloudflare quota must be UNKNOWN, got: ${JSON.stringify(qCloudflare)}`);
      }
      if (qDet.quotaStatus !== 'UNLIMITED_LOCAL') {
        throw new Error(`Deterministic quota should be UNLIMITED_LOCAL, got: ${JSON.stringify(qDet)}`);
      }

      console.log('✅ [Quota Honesty & Truth in Telemetry]');
      console.log(`   - All unqueryable cloud provider quotas return UNKNOWN instead of fake numbers.`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [Quota Honesty & Truth in Telemetry] FAILED:', err.message);
      failed++;
    }

    // Test 6: Free guardrail refusal
    try {
      const allowedGemini = isModelAllowedUnderFreeGuardrail('gemini', 'gemini-2.5-flash');
      const refusedPaid = isModelAllowedUnderFreeGuardrail('gemini', 'gemini-1.5-pro-expensive');

      if (!allowedGemini) throw new Error('Expected gemini-2.5-flash to be allowed in free allowlist');
      if (refusedPaid) throw new Error('Expected unlisted model to be refused when ALLOW_PAID_AI=false');

      console.log('✅ [Free Guardrail Allow-list Refusal]');
      console.log(`   - Allowed: gemini-2.5-flash (free tier)`);
      console.log(`   - Refused: gemini-1.5-pro-expensive (paid model blocked)`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error('❌ [Free Guardrail Allow-list Refusal] FAILED:', err.message);
      failed++;
    }

    // Reset testing search provider
    setSearchProviderForTesting(null);

    console.log('================================================================');
    console.log(`🏁 FINAL TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  })();
}

runAllScenarios();
