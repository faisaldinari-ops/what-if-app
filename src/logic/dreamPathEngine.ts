// src/logic/dreamPathEngine.ts
import { FeasibilityState, LifePlan, GroundedFact } from '../types/provenance';
import { ProjectDomain, UserContext } from '../types/context';
import { createGroundedFact } from '../services/research/sourceValidator';

export interface DreamPreservationResult {
  feasibilityState: FeasibilityState;
  headlineVerdict: string;
  whySummary: string;
  plan: LifePlan;
  savingsPlan?: {
    monthlySavingsCapacity: number;
    gapToFinance: number;
    monthsNeededRealistic: number;
    monthsNeededPrudent: number;
    monthsNeededAggressive: number;
    recommendedMilestoneAmount: number;
  };
  minimalViableVersion: {
    title: string;
    description: string;
    immediateCost: number;
    timeToFirstStepWeeks: number;
  };
  freeActionsToday: string[];
  facts: GroundedFact[];
}

/**
 * The Dream Preservation Engine turns any "impossible today" into an actionable, honest path.
 * Rule: NEVER tell a user "It's impossible" just because they currently lack money.
 * If user has 0 €, determine what starts today for free, calculate saving runway, and preserve the underlying dream.
 */
export function buildDreamPath(
  prompt: string,
  domain: ProjectDomain,
  userBudget?: number,
  targetCost: number = 3000,
  monthlyIncome?: number,
  monthlyExpenses?: number,
  userProfile?: Partial<UserContext>
): DreamPreservationResult {
  const facts: GroundedFact[] = [];
  const budget = userBudget !== undefined ? userBudget : 0;
  const isZeroBudget = budget === 0;

  // 1. Calculate realistic savings capacity
  let monthlyCapacity = 0;
  if (monthlyIncome !== undefined && monthlyExpenses !== undefined) {
    monthlyCapacity = Math.max(0, monthlyIncome - monthlyExpenses);
  }

  const gap = Math.max(0, targetCost - budget);

  // Determine Feasibility State
  let feasibilityState: FeasibilityState = 'POSSIBLE_NOW';
  if (isZeroBudget && targetCost > 500) {
    feasibilityState = 'POSSIBLE_WITH_PLAN';
  } else if (gap > 0 && monthlyCapacity > 0) {
    const months = gap / monthlyCapacity;
    feasibilityState = months <= 24 ? 'POSSIBLE_WITH_PLAN' : 'NOT_REALISTIC_YET';
  } else if (gap > 0 && monthlyCapacity === 0 && !isZeroBudget) {
    feasibilityState = 'POSSIBLE_WITH_PLAN';
  }

  // 2. Savings trajectory calculations
  let savingsPlan = undefined;
  if (gap > 0) {
    const realisticMonthly = monthlyCapacity > 0 ? monthlyCapacity : 200;
    const prudentMonthly = Math.max(50, Math.round(realisticMonthly * 0.7));
    const aggressiveMonthly = Math.round(realisticMonthly * 1.3);

    savingsPlan = {
      monthlySavingsCapacity: monthlyCapacity,
      gapToFinance: gap,
      monthsNeededRealistic: Math.ceil(gap / Math.max(1, realisticMonthly)),
      monthsNeededPrudent: Math.ceil(gap / Math.max(1, prudentMonthly)),
      monthsNeededAggressive: Math.ceil(gap / Math.max(1, aggressiveMonthly)),
      recommendedMilestoneAmount: Math.round(targetCost * 0.4) // first essential milestone
    };

    facts.push(
      createGroundedFact(
        'savings_math',
        'Capacité d’épargne calculée',
        `${monthlyCapacity} €/mois (Revenus ${monthlyIncome ?? '?'} € - Charges ${monthlyExpenses ?? '?'} €)`,
        'Calcul déterministe WHAT IF?',
        undefined,
        false,
        false,
        'Formule arithmétique pure sans projection spéculative.'
      )
    );
  }

  // 3. Domain Specific "0 € Start / Minimal Viable Version"
  let freeActionsToday: string[] = [];
  let minimalVersion = {
    title: 'Version Essentielle / MVP',
    description: 'Démarrage agile avec le strict minimum fonctionnel.',
    immediateCost: 0,
    timeToFirstStepWeeks: 1
  };

  if (domain === 'digital_project' || (prompt.toLowerCase().includes('site') && isZeroBudget)) {
    freeActionsToday = [
      'Créer un compte GitHub et Vercel/Netlify (100 % gratuit pour projets personnels)',
      'Déclarer gratuitement une micro-entreprise sur le Guichet Unique INPI (0 € de frais)',
      'Construire la maquette ou le prototype avec des outils gratuits (Figma, VS Code)',
      'Contacter 10 clients potentiels sur LinkedIn pour valider le besoin avant d’investir 1 €'
    ];

    minimalVersion = {
      title: 'Site / MVP 100 % Gratuit (Bootstrap)',
      description: 'Hébergement gratuit sur Vercel/GitHub Pages avec sous-domaine gratuit, base de données Supabase/Firebase free tier, et design Tailwind.',
      immediateCost: 0,
      timeToFirstStepWeeks: 1
    };
  } else if (domain === 'business') {
    freeActionsToday = [
      'Réaliser une étude de marché terrain gratuite (interroger 20 prospects réels)',
      'Tester la demande par des pré-commandes ou devis sans engagement',
      'Créer une fiche Google Business Profile gratuite pour tester la visibilité locale',
      'Rejoindre un incubateur public ou un réseau d’accompagnement gratuit (BGE, France Active)'
    ];

    minimalVersion = {
      title: 'Lancement en Prestation de Service Directe',
      description: 'Démarrage sans local commercial ni stock initial lourd : intervenir chez le client avec son outillage existant ou en sous-traitance pour accumuler le capital de départ.',
      immediateCost: Math.min(budget, 500),
      timeToFirstStepWeeks: 2
    };
  } else if (domain === 'travel') {
    freeActionsToday = [
      'Créer une alerte prix sur les comparateurs de vols pour repérer les creux tarifaires',
      'Télécharger les guides de voyage gratuits et cartes hors-ligne (Maps.me / Google Maps)',
      'Identifier les hébergements alternatifs gratuits (Couchsurfing, échange de logement, volontariat HelpX / Workaway)'
    ];

    minimalVersion = {
      title: 'Voyage Raccourci ou Destination Proche',
      description: 'Réduire la durée de quelques jours ou choisir un itinéraire direct en transports économiques pour respecter votre budget disponible immédiat.',
      immediateCost: budget,
      timeToFirstStepWeeks: 1
    };
  } else if (domain === 'relocation') {
    freeActionsToday = [
      'Explorer les plateformes d’emploi locales et postuler à distance',
      'Vérifier les formalités d’équivalence de diplôme (procédure ENIC-NARIC)',
      'Commencer l’apprentissage quotidien de la langue locale via des applications gratuites'
    ];

    minimalVersion = {
      title: 'Installation Échelonnée ou Colocation',
      description: 'Arriver avec un hébergement temporaire en colocation ou sous-location le temps de décrocher le premier contrat de travail local.',
      immediateCost: budget,
      timeToFirstStepWeeks: 4
    };
  } else {
    // General Life Change / Career
    freeActionsToday = [
      'Faire le bilan gratuit de ses compétences transférables',
      'Suivre des cours en ligne certifiants gratuits (OpenClassrooms, Coursera audit, MOOC)',
      'Échanger avec 3 professionnels en poste pour comprendre la réalité du quotidien'
    ];
  }

  // 4. Build NOW / NEXT / LATER framework
  const nowStage = {
    title: 'AUJOURD’HUI : Valider & Démarrer à 0 €',
    description: 'Ce que vous pouvez concrètement lancer dès cette semaine sans débourser un centime.',
    actions: freeActionsToday,
    cost: minimalVersion.immediateCost,
    timeline: 'Semaines 1 à 4'
  };

  const nextStage = {
    title: 'PROCHAINE ÉTAPE : Constituer le Premier Socle',
    description:
      gap > 0
        ? `Épargner ou générer les premiers ${savingsPlan ? savingsPlan.recommendedMilestoneAmount : Math.round(targetCost * 0.4)} € indispensables pour sécuriser l'opération.`
        : 'Sécuriser les formalités et lancer les premières démarches officielles.',
    milestones: [
      gap > 0
        ? `Mettre de côté environ ${savingsPlan?.monthlySavingsCapacity || 150} € par mois pour atteindre le palier minimum.`
        : 'Finaliser les enregistrements officiels et contrats nécessaires.',
      'Valider les premières victoires opérationnelles (1er client, 1ère réservation, ou 1er entretien).'
    ],
    cost: gap > 0 ? (savingsPlan ? savingsPlan.recommendedMilestoneAmount : 1000) : targetCost,
    timeline: gap > 0 && savingsPlan ? `Mois 1 à ${Math.min(12, Math.ceil(savingsPlan.monthsNeededRealistic / 2))}` : 'Mois 2 à 3'
  };

  const laterStage = {
    title: 'DANS UN SECOND TEMPS : Déploiement Complet',
    description: 'Atteindre la version idéale de votre projet avec toutes les garanties et le confort souhaité.',
    goals: [
      'Autonomie financière et trésorerie de sécurité de 3 à 6 mois',
      'Consolidation de la situation administrative et professionnelle',
      'Passage à l’échelle ou investissements de confort'
    ],
    cost: targetCost,
    timeline: gap > 0 && savingsPlan ? `Mois ${savingsPlan.monthsNeededRealistic} et au-delà` : 'Mois 6 à 12'
  };

  // 5. Build Alternatives
  const alternatives = [
    {
      title: 'Lancement par Paliers (Recommandé)',
      summary: 'Démarrer avec la version minimale pour générer des premiers flux avant tout investissement.',
      costDifference: `Économie immédiate de ${Math.round(gap)} €`,
      reason: 'Supprime le risque de surendettement et permet d’ajuster le tir en cours de route.'
    },
    {
      title: 'Modèle Alternatif à Faible Intensité Capitalistique',
      summary: 'Privilégier le service, la prestation ou l’affiliation plutôt que l’achat d’actifs lourds.',
      costDifference: 'Coût divisé par 3',
      reason: 'Permet d’avancer même avec 0 € d’apport initial.'
    }
  ];

  // 6. Formulate Honest, Constructive Tone
  let headlineVerdict = 'OUI, TON PROJET EST RÉALISTE DÈS MAINTENANT';
  let whySummary = 'Vos ressources et vos paramètres actuels couvrent les besoins estimés pour lancer cette démarche sereinement.';

  if (feasibilityState === 'POSSIBLE_WITH_PLAN') {
    if (isZeroBudget) {
      headlineVerdict = 'OUI, MAIS EN COMMENÇANT PAR LE DÉMARRAGE SANS FRAIS';
      whySummary =
        'Votre capital actuel est de 0 €, ce qui empêche la version clé en main immédiate. Cependant, il existe une méthode éprouvée pour amorcer le projet gratuitement dès aujourd’hui et financer la suite par étapes.';
    } else {
      headlineVerdict = 'OUI, MAIS AVEC UN PLAN D’ÉPARGNE STRUCTURÉ';
      whySummary = `Il vous manque environ ${gap} € pour sécuriser la version complète. Avec une capacité d’épargne réaliste, vous pouvez combler cet écart en ${savingsPlan?.monthsNeededRealistic || 6} mois sans vous mettre en danger.`;
    }
  } else if (feasibilityState === 'NOT_REALISTIC_YET') {
    headlineVerdict = 'PAS ENCORE DANS CETTE FORME, MAIS UN CHEMIN EXISTE';
    whySummary =
      'Dans sa version complète, ce projet créerait une tension financière trop forte aujourd’hui. Pour le réussir, il faut d’abord réduire le périmètre de départ ou augmenter vos marges mensuelles avant d’engager les frais.';
  }

  return {
    feasibilityState,
    headlineVerdict,
    whySummary,
    plan: {
      headline: headlineVerdict,
      feasibilityState,
      whySummary,
      now: nowStage,
      next: nextStage,
      later: laterStage,
      alternatives
    },
    savingsPlan,
    minimalViableVersion: minimalVersion,
    freeActionsToday,
    facts
  };
}
