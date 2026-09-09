// src/services/ai/opportunityEngine.ts
import { UserContext, ProjectDomain } from '../../types/context';
import { DestinationShortlistOption } from '../../types/planning';
import { GroundedFact } from '../../types/provenance';
import { buildDynamicRelocationShortlist } from '../research/researchOrchestrator';
import { executeGroundedSearch } from '../research/webSearchProvider';
import {
  BenefitOpportunity,
  OpportunityCategory,
  EligibilityStatus,
  OpportunityValueType,
  OptimizedBudgetBreakdown,
  CombinationStrategy,
  UserOpportunityProfile
} from '../../types/opportunities';
import { OFFICIAL_OPPORTUNITIES_CATALOG, OpportunityTemplate } from './opportunityDatabase';

export interface UnconsideredOpportunity {
  id: string;
  type: 'country_alternative' | 'subsidy_aid' | 'cost_reduction' | 'zero_budget_pivot' | 'faster_timeline';
  title: string;
  tagline: string;
  description: string;
  impactScore: number; // 0 to 100
  financialGainOrSaving: string;
  actionRequired: string;
  badge?: string;
}

export interface OpportunityEngineResult {
  headlineRecommendation: string;
  opportunityScore: number; // Overall score 0-100
  cautionAlert?: {
    title: string;
    message: string;
    actionBeforeSpending: string;
  };
  topOpportunities: BenefitOpportunity[];
  allOpportunities: BenefitOpportunity[];
  budgetOptimization: OptimizedBudgetBreakdown;
  combinationStrategy?: CombinationStrategy;
  opportunities: UnconsideredOpportunity[];
  alternativeDestinations?: DestinationShortlistOption[];
  subsidiesAndGrants: Array<{
    name: string;
    organization: string;
    estimatedAmount: string;
    eligibilityCriteria: string;
    officialUrl: string;
  }>;
  scenarios: {
    prudent: { title: string; cost: number; durationMonths: number; description: string; risk: string };
    normal: { title: string; cost: number; durationMonths: number; description: string; risk: string };
    ambitious: { title: string; cost: number; durationMonths: number; description: string; risk: string };
  };
  liveSearchConducted?: boolean;
  liveFacts?: GroundedFact[];
  verifiedSources?: string[];
}

/**
 * Calculates a rigorous composite opportunity score (0 to 100)
 */
function computeOpportunityScore(
  item: OpportunityTemplate,
  status: EligibilityStatus,
  targetCost: number
): number {
  let score = 0;

  // 1. Financial value relative to project cost (max 35 pts)
  const ratio = targetCost > 0 ? item.baseEstimatedAmount / targetCost : 0.5;
  if (ratio >= 0.5) score += 35;
  else if (ratio >= 0.25) score += 28;
  else if (ratio >= 0.1) score += 20;
  else score += 12;

  // 2. Eligibility status & certainty (max 30 pts)
  if (status === 'PROBABLEMENT_ELIGIBLE') score += 30;
  else if (status === 'A_VERIFIER') score += 18;
  else if (status === 'INFOS_MANQUANTES') score += 14;
  else score += 0;

  // 3. Official Source Quality (max 15 pts)
  if (item.sourceUrl.includes('.gouv.fr') || item.sourceUrl.includes('service-public.fr') || item.sourceUrl.includes('urssaf.fr') || item.sourceUrl.includes('francetravail.fr')) {
    score += 15;
  } else if (item.sourceUrl.includes('bpifrance') || item.sourceUrl.includes('initiative-france') || item.sourceUrl.includes('adie.org')) {
    score += 14;
  } else {
    score += 10;
  }

  // 4. Difficulty & Speed of access (max 10 pts)
  if (item.applicationDifficulty === 'facile') score += 10;
  else if (item.applicationDifficulty === 'moyen') score += 6;
  else score += 3;

  // 5. Active & Non-expired (max 10 pts)
  if (!item.isExpired) score += 10;

  return Math.min(100, Math.max(10, Math.round(score)));
}

/**
 * Evaluates the exact eligibility of a template given the user prompt & profile
 */
function evaluateEligibility(
  template: OpportunityTemplate,
  pLower: string,
  userProfile?: Partial<UserContext> & UserOpportunityProfile
): { status: EligibilityStatus; missingInfo: string[] } {
  const missing: string[] = [];

  // Jobseeker check
  if (template.requiresJobseeker) {
    if (userProfile?.employmentStatus === 'jobseeker' || pLower.includes('chomage') || pLower.includes('pole emploi') || pLower.includes('france travail') || pLower.includes('sans emploi')) {
      // Confirmed
    } else if (userProfile?.employmentStatus === 'employee' || userProfile?.employmentStatus === 'freelance') {
      return { status: 'NON_ELIGIBLE', missingInfo: ['Réservé aux demandeurs d’emploi inscrits'] };
    } else {
      missing.push('Statut d’inscription à France Travail');
    }
  }

  // Under 26 check
  if (template.requiresUnder26) {
    if (userProfile?.ageRange === 'under_26' || pLower.includes('jeune') || pLower.includes('etudiant') || pLower.includes('20 ans') || pLower.includes('22 ans') || pLower.includes('24 ans')) {
      // Confirmed
    } else if (userProfile?.ageRange === '26_49' || userProfile?.ageRange === '50_plus') {
      return { status: 'NON_ELIGIBLE', missingInfo: ['Réservé aux moins de 26 ans'] };
    } else {
      missing.push('Âge exact (réservé aux moins de 26 ans)');
    }
  }

  // Rural or QPV check
  if (template.requiresRuralOrQpv) {
    if (userProfile?.locationType === 'rural_zrr' || userProfile?.locationType === 'qpv_urban' || pLower.includes('campagne') || pLower.includes('village') || pLower.includes('rural') || pLower.includes('zone franche')) {
      // Confirmed
    } else if (userProfile?.locationType === 'france_standard') {
      return { status: 'NON_ELIGIBLE', missingInfo: ['Commune non située en zone de revitalisation rurale'] };
    } else {
      missing.push('Commune d’implantation (pour vérifier le zonage ZRR / FRR)');
    }
  }

  if (missing.length > 0) {
    return { status: 'A_VERIFIER', missingInfo: missing };
  }

  return { status: 'PROBABLEMENT_ELIGIBLE', missingInfo: [] };
}

/**
 * Detects unseen possibilities, public aids, financial leverages and savings for any user project.
 */
export function detectOpportunities(
  prompt: string,
  domain: ProjectDomain | string,
  budget: number = 0,
  targetCost: number = 3000,
  userProfile?: Partial<UserContext> & UserOpportunityProfile
): OpportunityEngineResult {
  const pLower = (prompt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const dLower = String(domain || '').toLowerCase();

  const isBusiness =
    dLower === 'business' ||
    dLower === 'entrepreneurship' ||
    dLower === 'commerce' ||
    dLower === 'digital_project' ||
    pLower.includes('entreprise') ||
    pLower.includes('societe') ||
    pLower.includes('lancer') ||
    pLower.includes('creer') ||
    pLower.includes('electricien') ||
    pLower.includes('artisan') ||
    pLower.includes('plombier') ||
    pLower.includes('restaurant') ||
    pLower.includes('business') ||
    pLower.includes('startup');

  const isVehicle = pLower.includes('voiture') || pLower.includes('auto') || pLower.includes('vehicule') || pLower.includes('permis');
  const isRealEstate = dLower === 'real_estate' || pLower.includes('appartement') || pLower.includes('maison') || pLower.includes('immobilier') || pLower.includes('achat') && pLower.includes('250');
  const isEducation = dLower === 'education' || dLower === 'career' || pLower.includes('formation') || pLower.includes('apprendre') || pLower.includes('coder') || pLower.includes('master') || pLower.includes('etudes') || pLower.includes('quitter');
  const isRelocation = dLower === 'relocation' || pLower.includes('quitter mon pays') || pLower.includes('partir') || pLower.includes('soleil') || pLower.includes('japon') || pLower.includes('demenager');

  // ============================================================================
  // MATCH FROM COMPREHENSIVE OFFICIAL DATABASE
  // ============================================================================
  const matchedOpportunities: BenefitOpportunity[] = [];

  for (const template of OFFICIAL_OPPORTUNITIES_CATALOG) {
    let match = false;

    if (isBusiness && (template.requiresBusinessCreation || template.domains.includes('entrepreneurship') || template.domains.includes('business'))) {
      match = true;
    }
    if (isVehicle && (template.requiresVehicule || template.tags.includes('voiture'))) {
      match = true;
    }
    if (isRealEstate && (template.requiresRealEstate || template.domains.includes('real_estate'))) {
      match = true;
    }
    if (isEducation && (template.requiresEducation || template.domains.includes('career') || template.domains.includes('education'))) {
      match = true;
    }
    if (template.domains.includes('digital_project') && (pLower.includes('site') || pLower.includes('code') || pLower.includes('web') || pLower.includes('e-commerce') || pLower.includes('ecommerce'))) {
      match = true;
    }

    if (match) {
      const { status, missingInfo } = evaluateEligibility(template, pLower, userProfile);
      const score = computeOpportunityScore(template, status, targetCost);

      // Tailor value to project scale if needed
      let estimatedVal = template.baseEstimatedAmount;
      if (template.id === 'aid_arce_francetravail' && targetCost > 10000) {
        estimatedVal = Math.min(14000, Math.round(targetCost * 0.45));
      }
      if (template.id === 'aid_pret_honneur_initiative') {
        estimatedVal = Math.min(20000, Math.max(4000, Math.round(targetCost * 0.35)));
      }

      matchedOpportunities.push({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        potentialValue: template.potentialValue,
        estimatedNumericValue: estimatedVal,
        valueType: template.valueType,
        eligibilityStatus: status,
        eligibilityConditions: template.eligibilityConditions,
        missingInformation: missingInfo,
        officialSource: template.officialSource,
        sourceUrl: template.sourceUrl,
        retrievedAt: template.retrievedAt,
        deadline: template.deadline,
        geographicScope: template.geographicScope,
        applicationDifficulty: template.applicationDifficulty,
        estimatedTime: template.estimatedTime,
        confidence: template.confidence,
        whyRelevant: template.whyRelevant,
        whatToGet: template.whatToGet,
        requiredDocuments: template.requiredDocuments,
        whereToApply: template.whereToApply,
        nextStep: template.nextStep,
        isExpired: template.isExpired,
        cumulableWith: template.cumulableWith,
        incompatibleWith: template.incompatibleWith,
        opportunityScore: score,
        badge: score >= 85 ? 'Top Recommandation' : template.category === 'aide_publique' ? 'Aide Publique' : 'Financement Aidé'
      });
    }
  }

  // Ensure high quality sorting
  matchedOpportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  // Top 3-4 opportunities
  const topOpportunities = matchedOpportunities.slice(0, 4);

  // ============================================================================
  // CAUTION ALERT ("NE PAIE PAS AVANT D'AVOIR VÉRIFIÉ" - SECTION 9)
  // ============================================================================
  let cautionAlert: OpportunityEngineResult['cautionAlert'] | undefined;
  if (isBusiness || isVehicle || isRealEstate || targetCost >= 3000) {
    cautionAlert = {
      title: 'Règle d’or : Ne payez rien avant d’avoir vérifié ces dispositifs !',
      message:
        'La grande majorité des aides d’État, exonérations (ACRE) et subventions au matériel exigent d’être demandées AVANT la signature des devis ou l’immatriculation. Tout acompte versé avant dépôt peut rendre l’aide caduque.',
      actionBeforeSpending: 'Vérifiez l’ACRE et les aides régionales avant tout achat de matériel ou de véhicule.'
    };
  }

  // ============================================================================
  // OPTIMIZED BUDGET CALCULATION (SECTION 10)
  // ============================================================================
  let confirmedGrants = 0;
  let probableSavings = 0;
  let accessibleFinancing = 0;

  const confirmedList: Array<{ label: string; amount: number }> = [];
  const probableList: Array<{ label: string; amount: number }> = [];
  const toVerifyList: Array<{ label: string; amount: number }> = [];

  for (const opp of matchedOpportunities) {
    if (opp.eligibilityStatus === 'PROBABLEMENT_ELIGIBLE') {
      if (opp.valueType === 'direct_grant') {
        confirmedGrants += opp.estimatedNumericValue;
        confirmedList.push({ label: opp.name, amount: opp.estimatedNumericValue });
      } else if (opp.valueType === 'tax_saving' || opp.valueType === 'cost_avoidance') {
        probableSavings += opp.estimatedNumericValue;
        probableList.push({ label: opp.name, amount: opp.estimatedNumericValue });
      } else if (opp.valueType === 'zero_interest_loan') {
        accessibleFinancing += opp.estimatedNumericValue;
        probableList.push({ label: `${opp.name} (Prêt 0%)`, amount: opp.estimatedNumericValue });
      }
    } else if (opp.eligibilityStatus === 'A_VERIFIER') {
      toVerifyList.push({ label: opp.name, amount: opp.estimatedNumericValue });
    }
  }

  // Cap the reduction to not exceed targetCost
  const totalOffset = confirmedGrants + probableSavings;
  const netRemaining = Math.max(0, targetCost - totalOffset);

  const budgetOptimization: OptimizedBudgetBreakdown = {
    initialBudgetNeeded: targetCost,
    confirmedGrants,
    probableSavings,
    accessibleFinancing,
    optimizedNetRemaining: netRemaining,
    breakdown: {
      confirmed: confirmedList,
      probable: probableList,
      toVerify: toVerifyList
    }
  };

  // ============================================================================
  // COMBINATION ENGINE (SECTION 15)
  // ============================================================================
  let combinationStrategy: CombinationStrategy | undefined;
  if (isBusiness) {
    combinationStrategy = {
      title: 'Combinaison Gagnante Création Sécurisée (Montage sans risque)',
      description: 'Ce plan combine 4 leviers légalement cumulables pour minimiser votre apport personnel et éviter le crédit bancaire lourd.',
      totalMobilized: budget + (confirmedGrants > 0 ? confirmedGrants : 6000) + (accessibleFinancing > 0 ? accessibleFinancing : 8000) + 4000,
      combinedSteps: [
        {
          stepNumber: 1,
          title: `Apport Personnel Initial (${budget.toLocaleString()} €)`,
          impact: 'Sert de socle de confiance et de trésorerie de démarrage immédiate.',
          type: 'capital'
        },
        {
          stepNumber: 2,
          title: 'ACRE + ARCE France Travail (Capitalisation des droits chômage)',
          impact: 'Débloque 60 % de vos droits chômage sans dette et divise vos cotisations par 2.',
          type: 'grant'
        },
        {
          stepNumber: 3,
          title: 'Prêt d’Honneur Initiative France (0 % sans caution)',
          impact: 'Apporte 5 000 € à 15 000 € de quasi-fonds propres remboursables sur 36 à 60 mois.',
          type: 'loan'
        },
        {
          stepNumber: 4,
          title: 'Véhicule & Matériel en LLD / Occasion Reconditionnée',
          impact: 'Économise 4 000 € à 8 000 € de sorties d’argent comptant au démarrage.',
          type: 'saving'
        }
      ],
      compatibilityRules: [
        'ACRE et ARCE sont 100 % cumulables lors de la création d’entreprise.',
        'Attention : L’ARCE (versement en capital) n’est PAS cumulable avec le maintien mensuel de l’allocation ARE.',
        'Le Prêt d’Honneur Initiative France est cumulable avec le microcrédit ADIE et tout prêt bancaire.',
        'Les exonérations ZRR / FRR sont cumulables avec l’ensemble des dispositifs d’amorçage.'
      ]
    };
  } else if (isVehicle) {
    combinationStrategy = {
      title: 'Montage Auto Serein (Prime + Occasion Révisée)',
      description: 'Associer la prime d’État à une occasion garantie pour éviter d’engager un crédit disproportionné.',
      totalMobilized: budget + 2500,
      combinedSteps: [
        {
          stepNumber: 1,
          title: 'Prime à la Conversion / Éco-chèque',
          impact: 'Jusqu’à 3 000 € d’aide publique déduits directement du prix d’achat.',
          type: 'grant'
        },
        {
          stepNumber: 2,
          title: 'Occasion Crit’Air 1 Récente à 8 000 € - 10 000 €',
          impact: 'Divise par deux la dette par rapport à un véhicule neuf ou haut de gamme.',
          type: 'saving'
        }
      ],
      compatibilityRules: [
        'La prime à la conversion est cumulable avec les aides régionales pour les véhicules peu polluants.'
      ]
    };
  }

  // ============================================================================
  // BACKWARD COMPATIBLE LEGACY PROPS
  // ============================================================================
  const opportunities: UnconsideredOpportunity[] = [];
  const subsidiesAndGrants: Array<{
    name: string;
    organization: string;
    estimatedAmount: string;
    eligibilityCriteria: string;
    officialUrl: string;
  }> = [];

  // Populate legacy subsidiesAndGrants from matchedOpportunities
  for (const opp of matchedOpportunities) {
    if (opp.category === 'aide_publique' || opp.category === 'exoneration_fiscale' || opp.category === 'pret_aide') {
      subsidiesAndGrants.push({
        name: opp.name,
        organization: opp.officialSource,
        estimatedAmount: opp.potentialValue,
        eligibilityCriteria: opp.eligibilityConditions.join('. '),
        officialUrl: opp.sourceUrl
      });
    }
  }

  // Populate legacy opportunities
  if (isBusiness) {
    if (budget <= 0 || pLower.includes('0 €') || pLower.includes('sans apport')) {
      opportunities.push({
        id: 'opp_zero_capital_lean',
        type: 'zero_budget_pivot',
        title: 'Démarrage Lean par la Prestation de Service & Préventes',
        tagline: 'Générer du chiffre d’affaires avant d’engager la moindre dépense',
        description: 'Vendez votre expertise ou proposez des précommandes fermes : vos premiers clients financent votre équipement initial sans emprunt.',
        impactScore: 98,
        financialGainOrSaving: 'Permet de démarrer avec 0 € d’emprunt bancaire',
        actionRequired: 'Définir 1 offre de service claire et décrocher 2 précommandes avant toute immatriculation.',
        badge: 'Stratégie 0 €'
      });
    }
    if (pLower.includes('electricien') || pLower.includes('artisan') || pLower.includes('plombier') || pLower.includes('batiment')) {
      opportunities.push(
        {
          id: 'opp_leasing_vehicule',
          type: 'cost_reduction',
          title: 'Location Longue Durée (LLD) ou Véhicule d’Occasion',
          tagline: 'Préserve 80 % de ton capital de départ',
          description: 'Plutôt que d’immobiliser 10 000 € à 15 000 € dans un utilitaire neuf, optez pour une LLD ou démarrez avec votre véhicule actuel réaménagé.',
          impactScore: 90,
          financialGainOrSaving: 'Économie immédiate de 4 000 € de trésorerie',
          actionRequired: 'Conserver la trésorerie pour le stock de fournitures et l’outillage certifié (NF C 15-100).',
          badge: 'Fort impact trésorerie'
        },
        {
          id: 'opp_apporteur_affaires',
          type: 'faster_timeline',
          title: 'Partenariats avec Maîtres d’Œuvre & Agences Immobilières locales',
          tagline: 'Flux constant de chantiers sans budget publicitaire',
          description: 'Proposez un accord de sous-traitance ou de recommandation pour les chantiers de rénovation et de mise aux normes obligatoires.',
          impactScore: 85,
          financialGainOrSaving: 'CA prévisionnel de 2 500 € à 4 000 € dès le 2e mois',
          actionRequired: 'Prendre contact avec 5 agences de gestion locative de proximité.',
          badge: 'Acquisition rapide'
        }
      );
    } else {
      opportunities.push({
        id: 'opp_lean_mvp',
        type: 'cost_reduction',
        title: 'Lancement en Micro-Entreprise / Auto-Entrepreneur Lean',
        tagline: 'Zéro frais fixes de structure et franchise de TVA',
        description: 'Démarrer sous le régime de la micro-entreprise permet de tester le modèle sans comptable obligatoire ni charges en l’absence de CA.',
        impactScore: 90,
        financialGainOrSaving: 'Économie de 2 000 € de frais juridiques et comptables',
        actionRequired: 'Immatriculation gratuite sur le guichet unique de l’INPI.',
        badge: 'Optimisation juridique'
      });
    }
  } else if (pLower.includes('site') || dLower === 'digital_project') {
    opportunities.push({
      id: 'opp_free_stack',
      type: 'zero_budget_pivot',
      title: 'Architecture Cloud Gratuite (Zero-Cost Stack)',
      tagline: 'Hébergement, base de données et nom de domaine à 0 €',
      description: 'Hébergez gratuitement sur Vercel, utilisez Supabase en formule Free Tier, et commencez avec un sous-domaine gratuit.',
      impactScore: 95,
      financialGainOrSaving: 'Économie de 300 € à 1 200 € / an',
      actionRequired: 'Déployer la maquette sur Vercel avec le dépôt GitHub lié.',
      badge: '100 % Gratuit'
    });
  } else if (isRelocation) {
    const relocationRes = buildDynamicRelocationShortlist(userProfile || { budget, goal: prompt });
    opportunities.push(
      {
        id: 'opp_reloc_cost',
        type: 'country_alternative',
        title: 'Optimisation Géographique : Villes Côtières Secondaires',
        tagline: 'Divise le loyer par deux par rapport aux capitales',
        description: 'En Espagne (Valence ou Alicante) ou au Portugal (Setúbal ou Braga), la vie est 30 à 45 % moins chère avec le même ensoleillement.',
        impactScore: 92,
        financialGainOrSaving: '500 € à 700 € d’économies de loyer par mois',
        actionRequired: 'Cibler des villes reliées par train ou aéroport low-cost.',
        badge: 'Pouvoir d’achat max'
      },
      {
        id: 'opp_remote_work',
        type: 'subsidy_aid',
        title: 'Visas Nomades Digitaux ou Emploi Bilingue Européen',
        tagline: 'Garder un salaire d’Europe du Nord tout en vivant au soleil',
        description: 'Les pays méditerranéens offrent des régimes fiscaux favorables et un accès de plein droit aux ressortissants UE.',
        impactScore: 89,
        financialGainOrSaving: '+40 % de pouvoir d’achat net réel',
        actionRequired: 'Vérifier l’éligibilité au statut de travailleur indépendant européen (formulaire A1 / NIE).',
        badge: 'Fiscalité optimisée'
      }
    );

    return {
      headlineRecommendation: 'Nous avons identifié 3 alternatives à haut ensoleillement et les aides à la mobilité associées.',
      opportunityScore: 88,
      cautionAlert,
      topOpportunities,
      allOpportunities: matchedOpportunities,
      budgetOptimization,
      combinationStrategy,
      opportunities,
      alternativeDestinations: relocationRes.shortlist,
      subsidiesAndGrants,
      scenarios: {
        prudent: {
          title: 'Installation Échelonnée (Colocation / Ville Secondaire)',
          cost: Math.round(targetCost * 0.6),
          durationMonths: 6,
          description: 'Arriver avec 2 mois de trésorerie en colocation le temps de trouver son 1er emploi local.',
          risk: 'Faible'
        },
        normal: {
          title: 'Installation Équilibrée (Studio Ville Moyenne)',
          cost: targetCost,
          durationMonths: 4,
          description: 'Caution, 1er loyer et 3 mois de dépenses courantes sécurisés.',
          risk: 'Modéré'
        },
        ambitious: {
          title: 'Installation Premium (Centre-Ville Littoral)',
          cost: Math.round(targetCost * 1.5),
          durationMonths: 2,
          description: 'Appartement individuel avec vue dégagée et 6 mois de trésorerie de secours.',
          risk: 'Calculé'
        }
      }
    };
  } else if (isVehicle) {
    opportunities.push(
      {
        id: 'opp_car_budget',
        type: 'cost_reduction',
        title: 'Occasion Crit’Air 1 Récente à 8 000 € - 10 000 €',
        tagline: 'Évite l’endettement excessif sur 5 ans',
        description: 'Avec un salaire net de 1 800 €, emprunter 15 000 € génère des mensualités de ~280 €/mois + 120 € d’assurance/carburant (22 % de votre salaire). Un véhicule à 9 000 € divise la charge de moitié.',
        impactScore: 94,
        financialGainOrSaving: '6 000 € d’économies directes + 1 200 € d’intérêts évités',
        actionRequired: 'Explorer les occasions fiables de 4-6 ans révisées avec garantie 12 mois.',
        badge: 'Décision financière saine'
      },
      {
        id: 'opp_credit_auto',
        type: 'subsidy_aid',
        title: 'Prime à la Conversion & Éco-chèques régionaux',
        tagline: 'Jusqu’à 1 500 € à 3 000 € d’aides publiques',
        description: 'Vérifier si votre ancien véhicule est éligible à la prime à la conversion pour l’achat d’un véhicule Crit’Air 1 ou électrique d’occasion.',
        impactScore: 80,
        financialGainOrSaving: 'Jusqu’à 3 000 € de subvention publique',
        actionRequired: 'Tester son éligibilité sur le simulateur officiel primealaconversion.gouv.fr.',
        badge: 'Aide d’État'
      }
    );
  }

  // Calculate global opportunity score for headline
  const avgScore = topOpportunities.length > 0
    ? Math.round(topOpportunities.reduce((acc, curr) => acc + curr.opportunityScore, 0) / topOpportunities.length)
    : 75;

  return {
    headlineRecommendation:
      topOpportunities.length > 0
        ? `WHAT IF? a identifié ${matchedOpportunities.length} leviers, aides et financements pouvant réduire votre effort initial de ${Math.round(confirmedGrants + probableSavings).toLocaleString()} €.`
        : 'Voici les leviers stratégiques et alternatives d’optimisation identifiés pour sécuriser votre projet.',
    opportunityScore: avgScore,
    cautionAlert,
    topOpportunities,
    allOpportunities: matchedOpportunities,
    budgetOptimization,
    combinationStrategy,
    opportunities,
    subsidiesAndGrants,
    scenarios: {
      prudent: {
        title: 'Scénario Minimum Cash (Amorçage Lean & Aides Maximales)',
        cost: Math.round(targetCost * 0.55),
        durationMonths: 6,
        description: 'Mobilise les exonérations ACRE, l’occasion garantie et les aides publiques pour minimiser votre apport.',
        risk: 'Minimal'
      },
      normal: {
        title: 'Scénario Standard (Déploiement Équilibré)',
        cost: targetCost,
        durationMonths: 4,
        description: 'Équilibre sain entre apport personnel, prêt d’honneur à 0 % et confort d’exécution.',
        risk: 'Modéré'
      },
      ambitious: {
        title: 'Scénario Accéléré (Levier Bancaire & Croissance Rapide)',
        cost: Math.round(targetCost * 1.4),
        durationMonths: 2,
        description: 'Effet de levier maximal avec matériel neuf, stock complet et communication de lancement intensive.',
        risk: 'Exigeant'
      }
    }
  };
}

/**
 * Enriches opportunities with live web search results from verified government/public portals.
 * Extracts real official URLs and facts, adding them directly to the opportunity matrix.
 */
export async function enrichOpportunitiesWithLiveSearch(
  baseResult: OpportunityEngineResult,
  prompt: string,
  domain?: ProjectDomain
): Promise<OpportunityEngineResult> {
  const isBusiness =
    domain === 'business' ||
    domain === 'digital_project' ||
    /entreprise|société|societe|créer|creer|micro|sasu|sarl|eurl|artisan|commerce/i.test(prompt);

  const query = isBusiness
    ? `aides subventions creation reprise entreprise ${prompt}`
    : `aides financements dispositifs officiels ${prompt}`;

  const searchRes = await executeGroundedSearch(query, {
    priorityCategory: 'official_aids',
    maxResults: 5
  });

  if (searchRes.searchMode === 'LIVE' && searchRes.facts.length > 0) {
    const verifiedSources: string[] = [];
    const newSubsidies = [...baseResult.subsidiesAndGrants];
    const newOpportunities = [...baseResult.opportunities];

    for (const fact of searchRes.facts) {
      if (fact.sourceUrl) {
        verifiedSources.push(fact.sourceUrl);

        // Add to subsidies & grants if URL is not already present
        const alreadyExists = newSubsidies.some((s) => s.officialUrl === fact.sourceUrl);
        if (!alreadyExists) {
          newSubsidies.push({
            name: fact.label,
            organization: fact.sourceName || 'Portail Officiel',
            estimatedAmount: 'Variable selon statut et critères territoriaux',
            eligibilityCriteria: 'Consulter les critères officiels sur le portail',
            officialUrl: fact.sourceUrl
          });
        }

        // Add to unconsidered opportunities
        newOpportunities.push({
          id: `opp_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          type: 'subsidy_aid',
          title: fact.label,
          tagline: `Source en direct : ${fact.sourceName || 'Portail Officiel'}`,
          description: String(fact.value),
          impactScore: 90,
          financialGainOrSaving: 'Dispositif ou subvention à mobiliser',
          actionRequired: `Consulter la démarche officielle : ${fact.sourceUrl}`,
          badge: 'Source en direct'
        });
      }
    }

    return {
      ...baseResult,
      subsidiesAndGrants: newSubsidies,
      opportunities: newOpportunities,
      liveSearchConducted: true,
      liveFacts: searchRes.facts,
      verifiedSources
    };
  }

  return {
    ...baseResult,
    liveSearchConducted: false,
    liveFacts: [],
    verifiedSources: []
  };
}

/**
 * Async generator for opportunity map that triggers live web search when configured.
 */
export async function generateOpportunityMapAsync(
  prompt: string,
  userProfile?: Partial<UserContext>,
  domain?: ProjectDomain
): Promise<OpportunityEngineResult> {
  const syncResult = detectOpportunities(
    prompt,
    domain || 'general',
    userProfile?.budget || 0,
    (userProfile as any)?.projectStartupCost || 3000,
    userProfile as any
  );
  return enrichOpportunitiesWithLiveSearch(syncResult, prompt, domain);
}

export const generateOpportunityMap = detectOpportunities;

