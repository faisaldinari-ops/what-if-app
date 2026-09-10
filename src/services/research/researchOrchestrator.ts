// src/services/research/researchOrchestrator.ts
import { UserContext, UserPreferences, ProjectDomain } from '../../types/context';
import { DestinationShortlistOption, TravelBreakdown, BusinessBlueprint, CareerShortlistOption } from '../../types/planning';
import { GroundedFact, ResearchResult } from '../../types/provenance';
import { LIVING_COST_DATABASE, getCountryLivingCosts } from './costOfLivingProvider';
import { assessJobMarket } from './jobsProvider';
import { checkImmigrationAndWorkLegality, checkTradeRegulation } from './regulationsProvider';
import { researchTravelCosts } from './travelProvider';
import { assessBusinessFeasibility } from './businessProvider';
import { createGroundedFact } from './sourceValidator';
import { executeGroundedSearch } from './webSearchProvider';
import { cacheService } from '../ai/cacheService';
import { telemetry } from '../ai/telemetryService';

export interface DynamicRelocationResult {
  shortlist: DestinationShortlistOption[];
  facts: GroundedFact[];
  warnings: string[];
}

/**
 * Computes Destination Compatibility Score according to explicit weighted formula:
 * - Budget compatibility: 20%
 * - Employment compatibility: 25%
 * - Language compatibility: 15%
 * - Lifestyle preferences: 15%
 * - Legal accessibility: 15%
 * - Cost of living: 10%
 * Weights adapt dynamically if user priority is set.
 */
export function calculateDestinationCompatibility(
  countryKey: string,
  userProfile: Partial<UserContext>
): {
  score: number;
  breakdown: {
    budgetScore: number;
    employmentScore: number;
    languageScore: number;
    lifestyleScore: number;
    legalScore: number;
    costOfLivingScore: number;
  };
  reasons: string[];
  constraints: string[];
} {
  const profile = LIVING_COST_DATABASE[countryKey] || getCountryLivingCosts(countryKey);
  const userBudget = userProfile.budget !== undefined ? userProfile.budget : 0;
  const userLanguages = (userProfile.languages || []).map((l) => l.language.toLowerCase());
  const userProfession = userProfile.profession || '';
  const userPrefs = userProfile.preferences || {};
  const reasons: string[] = [];
  const constraints: string[] = [];

  // 1. Budget Compatibility (20%)
  // Needed: installationBudgetRealistic
  let budgetScore = 70;
  if (userBudget >= profile.installationBudgetRealistic * 1.5) {
    budgetScore = 100;
    reasons.push(`Budget disponible (${userBudget} €) très confortable pour l'installation (~${profile.installationBudgetRealistic} € requis).`);
  } else if (userBudget >= profile.installationBudgetRealistic) {
    budgetScore = 85;
    reasons.push(`Budget disponible suffisant pour couvrir le 1er loyer, la caution et les formalités.`);
  } else if (userBudget >= profile.installationBudgetRealistic * 0.7) {
    budgetScore = 55;
    constraints.push(`Budget un peu juste : prévoir colocations ou ville secondaire pour réduire les coûts.`);
  } else {
    budgetScore = 30;
    constraints.push(`Budget sous le seuil d'installation recommandé (~${profile.installationBudgetRealistic} €) ; un plan d'épargne est conseillé.`);
  }

  // 2. Employment Compatibility (25%)
  const jobAssess = assessJobMarket(userProfession, profile.country);
  let employmentScore = 70;
  if (jobAssess.demandLevel === 'très forte') {
    employmentScore = 95;
    reasons.push(`Très forte demande locale pour le métier : ${jobAssess.profession}.`);
  } else if (jobAssess.demandLevel === 'forte') {
    employmentScore = 85;
    reasons.push(`Marché de l'emploi dynamique dans votre secteur.`);
  } else if (jobAssess.demandLevel === 'moyenne') {
    employmentScore = 65;
  } else {
    employmentScore = 45;
    constraints.push(`Marché local compétitif pour votre profil ; opportunités plus rares.`);
  }

  // 3. Language Compatibility (15%)
  let languageScore = 40;
  const countryLangs = profile.languages.map((l) => l.toLowerCase());
  const speaksDirect = countryLangs.some((cl) => userLanguages.some((ul) => ul.includes(cl) || cl.includes(ul)));
  const speaksEnglish = userLanguages.some((ul) => ul.includes('anglais') || ul.includes('english'));

  if (speaksDirect) {
    languageScore = 100;
    reasons.push(`Compatibilité linguistique totale avec les langues du pays (${profile.languages.join(', ')}).`);
  } else if (speaksEnglish && countryLangs.includes('anglais')) {
    languageScore = 85;
    reasons.push(`Anglais largement utilisé dans le milieu professionnel.`);
  } else if (speaksEnglish) {
    languageScore = 60;
    constraints.push(`L'apprentissage de la langue locale (${profile.languages[0]}) sera indispensable pour la vie quotidienne.`);
  } else {
    languageScore = 30;
    constraints.push(`Barrière linguistique significative : initiation à la langue locale requise.`);
  }

  // 4. Lifestyle & Climate Preferences (15%)
  let lifestyleScore = 70;
  if (userPrefs.climate && userPrefs.climate.includes('warm')) {
    if (profile.climate === 'warm') {
      lifestyleScore += 15;
      reasons.push(`Climat chaud et ensoleillé conforme à vos souhaits.`);
    } else {
      lifestyleScore -= 15;
    }
  }
  if (userPrefs.environment && userPrefs.environment.includes('sea')) {
    if (profile.coastal) {
      lifestyleScore += 15;
      reasons.push(`Façade maritime et accès côtier disponibles.`);
    } else {
      lifestyleScore -= 20;
    }
  }
  if (userPrefs.lifestyle?.includes('muslim_friendly') || userProfile.goal?.toLowerCase().includes('musulman')) {
    if (profile.majorityMuslim) {
      lifestyleScore += 20;
      reasons.push(`Pays à majorité musulmane, répondant à votre critère culturel et religieux.`);
    }
  }
  lifestyleScore = Math.max(10, Math.min(100, lifestyleScore));

  // 5. Legal Accessibility (15%)
  const legalCheck = checkImmigrationAndWorkLegality(profile.country, 'EU', 'work');
  let legalScore = 60;
  if (legalCheck.allowed && legalCheck.legalStatus.includes('Libre circulation')) {
    legalScore = 100;
    reasons.push(`Accès légal immédiat de plein droit (citoyenneté européenne, pas de visa requis).`);
  } else if (legalCheck.allowed) {
    legalScore = 75;
  } else {
    legalScore = 20;
    constraints.push(legalCheck.legalWarning || 'Restrictions d’accès légal ou visa de travail requis.');
  }

  // 6. Cost of Living (10%)
  let costOfLivingScore = 70;
  if (profile.costOfLivingIndexVsFrance <= 50) {
    costOfLivingScore = 100;
    reasons.push(`Coût de la vie très abordable (-${100 - profile.costOfLivingIndexVsFrance} % vs France).`);
  } else if (profile.costOfLivingIndexVsFrance <= 75) {
    costOfLivingScore = 85;
    reasons.push(`Pouvoir d'achat local avantageux.`);
  } else {
    costOfLivingScore = 55;
  }

  // Weights adaptation according to priority
  let wBudget = 0.20;
  let wJob = 0.25;
  let wLang = 0.15;
  let wLife = 0.15;
  let wLegal = 0.15;
  let wCol = 0.10;

  if (userPrefs.priority === 'salary' || userPrefs.priority === 'career_growth') {
    wJob = 0.35;
    wCol = 0.05;
  } else if (userPrefs.priority === 'cost_of_living') {
    wCol = 0.25;
    wBudget = 0.25;
    wJob = 0.15;
  } else if (userPrefs.priority === 'climate') {
    wLife = 0.30;
    wJob = 0.15;
  }

  const finalScore = Math.round(
    budgetScore * wBudget +
    employmentScore * wJob +
    languageScore * wLang +
    lifestyleScore * wLife +
    legalScore * wLegal +
    costOfLivingScore * wCol
  );

  return {
    score: Math.max(10, Math.min(99, finalScore)),
    breakdown: {
      budgetScore,
      employmentScore,
      languageScore,
      lifestyleScore,
      legalScore,
      costOfLivingScore
    },
    reasons,
    constraints
  };
}

/**
 * Evaluates an open set of destinations for relocation based on dynamic scores.
 */
export function buildDynamicRelocationShortlist(
  userProfile: Partial<UserContext>
): DynamicRelocationResult {
  const facts: GroundedFact[] = [];
  const warnings: string[] = [];

  const candidates = Object.keys(LIVING_COST_DATABASE);
  const scoredCandidates = candidates.map((key) => {
    const profile = LIVING_COST_DATABASE[key];
    const evaluation = calculateDestinationCompatibility(key, userProfile);
    return {
      key,
      profile,
      evaluation
    };
  });

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.evaluation.score - a.evaluation.score);

  // Take top 3 best matching countries
  const topMatches = scoredCandidates.slice(0, 3);

  const shortlist: DestinationShortlistOption[] = topMatches.map((item, idx) => {
    const p = item.profile;
    const e = item.evaluation;

    // Badges based on ranking & characteristics
    let badge = idx === 0 ? 'Meilleure compatibilité globale' : idx === 1 ? 'Alternative équilibrée' : 'Option à fort potentiel';
    if (p.costOfLivingIndexVsFrance < 50) badge = 'Meilleur pouvoir d’achat';

    return {
      id: item.key,
      country: p.country,
      flag: p.flag,
      compatibilityScore: e.score,
      matchReason: e.reasons.slice(0, 2).join(' ') || 'Excellente balance opportunités / coût de la vie.',
      installationBudgetRange: {
        min: Math.round(p.installationBudgetRealistic * 0.75),
        realistic: p.installationBudgetRealistic,
        comfortable: Math.round(p.installationBudgetRealistic * 1.5),
        currency: 'EUR',
        confidence: 'medium'
      },
      monthlyRentIndicative: p.monthlyRent1BedCityCenter,
      monthlyCostOfLivingIndicative: p.estimatedMonthlyTotalSingle,
      indicativeSalary: p.averageNetSalaryLocal,
      potentialJobs: [
        userProfile.profession || 'Métiers en tension locale',
        'Services & Tourisme',
        'Commerce & Artisanat'
      ],
      constraints: e.constraints.slice(0, 3),
      languageRequired: p.languages.join(', '),
      difficultyLevel: e.score >= 80 ? 'Facile' : e.score >= 65 ? 'Modéré' : 'Exigeant',
      badge
    };
  });

  // Add factual grounded sources
  topMatches.forEach((m) => {
    facts.push(
      createGroundedFact(
        `dest_fact_${m.key}`,
        `Indice de coût de la vie (${m.profile.country})`,
        `${m.profile.costOfLivingIndexVsFrance} (base 100 France) | Loyer moyen 1P : ~${m.profile.monthlyRent1BedCityCenter} €/mois`,
        'Référentiel indicatif du coût de la vie',
        undefined,
        false,
        true
      )
    );
  });

  return {
    shortlist,
    facts,
    warnings
  };
}

export interface OrchestratedResearchResult {
  query: string;
  facts: GroundedFact[];
  searchMode: 'LIVE' | 'BENCHMARK';
  sourceUrls: string[];
  summary: string;
  retrievedAt: string;
  providerUsed: string;
}

/**
 * ORCHESTRATE RESEARCH PIPELINE
 * Sequence:
 * 1. Data requirement analysis
 * 2. Cache inspection
 * 3. Live Web Search (if provider configured)
 * 4. Grounded Facts extraction
 * 5. Transparent fallback to certified internal benchmarks (if live search unavailable)
 * 6. Calculation & Synthesis
 */
export async function orchestrateResearch(
  query: string,
  domain?: ProjectDomain,
  userProfile?: Partial<UserContext>,
  forceRefresh: boolean = false
): Promise<OrchestratedResearchResult> {
  const startTime = Date.now();
  const cacheKey = `research:${domain || 'general'}:${query.trim().toLowerCase()}`;

  // 1. Cache Inspection
  if (!forceRefresh) {
    const cached = cacheService.get<OrchestratedResearchResult>(cacheKey);
    if (cached) {
      telemetry.recordOperation({
        provider: 'cache',
        model: 'research-cache',
        taskType: 'synthesis',
        llmCalls: 0,
        searchCalls: 0,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 1,
        estimatedCostUsd: 0,
        cacheHit: true,
        fallbackUsed: false,
        status: 'success'
      });
      return cached;
    }
  }

  // 2. Real Live Web Search Attempt
  const webResult = await executeGroundedSearch(query, {
    priorityCategory: domain === 'business' ? 'official_aids' : undefined,
    maxResults: 5
  });

  if (webResult.searchMode === 'LIVE' && webResult.facts.length > 0) {
    const sourceUrls = webResult.facts
      .map((f) => f.sourceUrl)
      .filter((u): u is string => typeof u === 'string' && u.length > 0);

    const orchestrated: OrchestratedResearchResult = {
      query,
      facts: webResult.facts,
      searchMode: 'LIVE',
      sourceUrls,
      summary: webResult.summary,
      retrievedAt: webResult.retrievedAt,
      providerUsed: webResult.sourceName || 'Web Search'
    };

    cacheService.set(cacheKey, orchestrated, 'live_prices');

    telemetry.recordOperation({
      provider: orchestrated.providerUsed,
      model: 'web-search-engine',
      taskType: 'synthesis',
      llmCalls: 0,
      searchCalls: 1,
      inputTokens: Math.round(query.length / 4),
      outputTokens: Math.round(JSON.stringify(webResult.facts).length / 4),
      latencyMs: Date.now() - startTime,
      estimatedCostUsd: 0,
      cacheHit: false,
      fallbackUsed: false,
      status: 'success'
    });

    return orchestrated;
  }

  // 3. Fallback to Certified Internal Benchmarks (Without fake sources)
  const facts: GroundedFact[] = [];
  const q = query.toLowerCase();

  if (domain === 'relocation' || q.includes('espagne') || q.includes('portugal') || q.includes('japon')) {
    const countryKey = q.includes('espagne') ? 'espagne' : q.includes('portugal') ? 'portugal' : q.includes('japon') ? 'japon' : 'espagne';
    const costs = getCountryLivingCosts(countryKey);
    facts.push(
      createGroundedFact(
        `bench_col_${countryKey}`,
        `Indice de coût de la vie (${costs.country})`,
        `${costs.costOfLivingIndexVsFrance} (base 100 France) | Loyer moyen studio : ~${costs.monthlyRent1BedCityCenter} €/mois`,
        'Référentiel indicatif du coût de la vie',
        undefined,
        false,
        false,
        'Données issues de référentiels statistiques sectoriels récents.'
      )
    );
  } else if (domain === 'travel' || q.includes('voyage') || q.includes('billet') || q.includes('vol')) {
    facts.push(
      createGroundedFact(
        'bench_travel_rate',
        'Ordre de grandeur transport et séjour',
        'Vols et hébergements estimés selon barèmes saisonniers indicatifs.',
        'Référentiel indicatif de mobilité et transport',
        undefined,
        false,
        false,
        'Fourchettes estimatives moyennes sans interrogation de transporteur en temps réel.'
      )
    );
  } else if (domain === 'business' || q.includes('entreprise') || q.includes('aide') || q.includes('acre')) {
    facts.push(
      createGroundedFact(
        'bench_acre_exoneration',
        'Dispositif ACRE (Exonération de cotisations sociales)',
        'Exonération partielle de charges sociales la 1ère année d’activité.',
        'Code de la sécurité sociale / Dispositif public ACRE',
        'https://www.service-public.fr/professionnels-entreprises/vosdroits/F11677',
        false,
        false,
        'Dispositif officiel d’État pour créateurs et repreneurs d’entreprise.'
      )
    );
    facts.push(
      createGroundedFact(
        'bench_arce_chomage',
        'Dispositif ARCE (Capitalisation France Travail)',
        'Versement de 60 % du reliquat des droits sous forme de capital d’amorçage.',
        'Règlementation France Travail',
        'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocat/aides-financieres-et-accompagnem/arce.html',
        false,
        false,
        'Dispositif officiel pour demandeurs d’emploi créant une entreprise.'
      )
    );
  } else {
    facts.push(
      createGroundedFact(
        'bench_general_financial',
        'Ordre de grandeur budgétaire',
        'Estimations formulées selon les ratios de trésorerie prudents (matelas de 3 à 6 mois).',
        'Référentiel interne de modélisation financière',
        undefined,
        false,
        false,
        'Modèle de calcul financier sans recherche web externe active.'
      )
    );
  }

  const orchestrated: OrchestratedResearchResult = {
    query,
    facts,
    searchMode: 'BENCHMARK',
    sourceUrls: facts.map((f) => f.sourceUrl).filter((u): u is string => !!u),
    summary: 'Recherche web en direct non active. Mobilisation des barèmes et référentiels officiels de référence.',
    retrievedAt: new Date().toISOString(),
    providerUsed: 'Certified Internal Benchmarks'
  };

  cacheService.set(cacheKey, orchestrated, 'cost_of_living');

  telemetry.recordOperation({
    provider: 'deterministic',
    model: 'benchmark-database',
    taskType: 'synthesis',
    llmCalls: 0,
    searchCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: Date.now() - startTime,
    estimatedCostUsd: 0,
    cacheHit: false,
    fallbackUsed: true,
    fallbackReason: 'Live search unavailable or unconfigured; used certified benchmarks',
    status: 'success'
  });

  return orchestrated;
}
