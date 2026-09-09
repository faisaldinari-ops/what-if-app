// src/services/ai/opportunityEngine.ts
import { UserContext, ProjectDomain } from '../../types/context';
import { DestinationShortlistOption } from '../../types/planning';
import { LIVING_COST_DATABASE } from '../research/costOfLivingProvider';
import { buildDynamicRelocationShortlist } from '../research/researchOrchestrator';

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
}

/**
 * Detects unseen possibilities and financial/strategic leverage points for any user project.
 */
export function detectOpportunities(
  prompt: string,
  domain: ProjectDomain | string,
  budget: number = 0,
  targetCost: number = 3000,
  userProfile?: Partial<UserContext>
): OpportunityEngineResult {
  const pLower = (prompt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const dLower = String(domain || '').toLowerCase();
  const opportunities: UnconsideredOpportunity[] = [];
  const subsidiesAndGrants: Array<{
    name: string;
    organization: string;
    estimatedAmount: string;
    eligibilityCriteria: string;
    officialUrl: string;
  }> = [];

  // 1. BUSINESS & ENTREPRENEURSHIP OPPORTUNITIES
  const isBusiness =
    dLower === 'business' ||
    dLower === 'entrepreneurship' ||
    dLower === 'digital_project' ||
    pLower.includes('entreprise') ||
    pLower.includes('societe') ||
    pLower.includes('lancer') ||
    pLower.includes('creer') ||
    pLower.includes('business') ||
    pLower.includes('startup');

  if (isBusiness) {
    // Subsidies common to entrepreneurs in France / EU
    subsidiesAndGrants.push(
      {
        name: 'ACRE (Exonération partielle de cotisations)',
        organization: 'URSSAF / État Français',
        estimatedAmount: '~1 500 € à 3 000 € d’économies la 1ère année',
        eligibilityCriteria: 'Créateur ou repreneur d’entreprise (demandeurs d’emploi, < 26 ans, ou bénéficiaires minima sociaux)',
        officialUrl: 'https://www.service-public.fr/particuliers/vosdroits/F11677'
      },
      {
        name: 'ARCE (Capital France Travail)',
        organization: 'France Travail',
        estimatedAmount: '60 % du reliquat des droits chômage versés en 2 fois',
        eligibilityCriteria: 'Demandeur d’emploi indemnisé créant son activité',
        officialUrl: 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocat/aides-financieres-et-autres-dis/aide-a-la-reprise-ou-a-la-creat.html'
      },
      {
        name: 'Prêt d’Honneur Initiative France / Réseau Entreprendre',
        organization: 'Initiative France',
        estimatedAmount: '3 000 € à 25 000 € à taux 0 % sans caution',
        eligibilityCriteria: 'Projet de création ou reprise avec plan d’affaires validé',
        officialUrl: 'https://www.initiative-france.fr/'
      }
    );

    // 0 € / Zero Budget specific pivot
    if (budget <= 0 || pLower.includes('0 €') || pLower.includes('0€') || pLower.includes('sans apport') || pLower.includes('sans argent')) {
      opportunities.push(
        {
          id: 'opp_zero_capital_lean',
          type: 'zero_budget_pivot',
          title: 'Démarrage Lean par la Prestation de Service & Préventes',
          tagline: 'Générer du chiffre d’affaires avant d’engager la moindre dépense',
          description: 'Ne jamais bloquer sur le manque de capital. En vendant votre expertise ou en proposant des précommandes fermes, vos premiers clients financent votre équipement initial.',
          impactScore: 98,
          financialGainOrSaving: 'Permet de démarrer avec 0 € d’emprunt bancaire',
          actionRequired: 'Définir 1 offre de service claire et décrocher 2 précommandes avant toute immatriculation.',
          badge: 'Stratégie 0 €'
        },
        {
          id: 'opp_microcredit_adie',
          type: 'subsidy_aid',
          title: 'Financement ADIE (Micro-crédit solidaire jusqu’à 12 000 €)',
          tagline: 'Pour les entrepreneurs exclus du crédit bancaire classique',
          description: 'L’ADIE finance et accompagne les créateurs d’entreprise qui n’ont pas d’apport personnel ou pas d’historique bancaire favorable.',
          impactScore: 91,
          financialGainOrSaving: 'Accès immédiat à un fonds de roulement',
          actionRequired: 'Monter un dossier simplifié sur adie.org.',
          badge: 'Inclusion financière'
        }
      );
    }

    // Electrician / Artisan specific
    if (pLower.includes('electricien') || pLower.includes('artisan') || pLower.includes('plombier') || pLower.includes('batiment')) {
      opportunities.push(
        {
          id: 'opp_leasing_vehicule',
          type: 'cost_reduction',
          title: 'Location Longue Durée (LLD) ou Véhicule d’Occasion',
          tagline: 'Préserve 80 % de ton capital de départ',
          description: 'Plutôt que d’immobiliser 10 000 € à 15 000 € dans un utilitaire neuf, opter pour une LOA/LLD ou démarrer avec votre véhicule actuel réaménagé.',
          impactScore: 90,
          financialGainOrSaving: 'Économie immédiate de 4 000 € de trésorerie',
          actionRequired: 'Conserver la trésorerie pour le stock de fournitures et l’outillage professionnel certifié (NF C 15-100).',
          badge: 'Fort impact trésorerie'
        },
        {
          id: 'opp_apporteur_affaires',
          type: 'faster_timeline',
          title: 'Partenariats avec Maîtres d’Œuvre & Agences Immobilières locales',
          tagline: 'Flux constant de chantiers sans budget publicitaire',
          description: 'Proposer un accord de sous-traitance ou de recommandation pour les chantiers de rénovation et de mise aux normes obligatoires.',
          impactScore: 85,
          financialGainOrSaving: 'CA prévisionnel de 2 500 € à 4 000 € dès le 2e mois',
          actionRequired: 'Prendre contact avec 5 agences de gestion locative de proximité.',
          badge: 'Acquisition rapide'
        }
      );
    } else if (budget > 0) {
      opportunities.push(
        {
          id: 'opp_lean_mvp',
          type: 'cost_reduction',
          title: 'Lancement en Micro-Entreprise / Auto-Entrepreneur Lean',
          tagline: 'Zéro frais fixes de structure et franchise de TVA',
          description: 'Démarrer sous le régime de la micro-entreprise permet de tester le modèle sans comptable obligatoire ni charges en l’absence de chiffre d’affaires.',
          impactScore: 90,
          financialGainOrSaving: 'Économie de 2 000 € de frais juridiques et comptables',
          actionRequired: 'Immatriculation gratuite sur le guichet unique de l’INPI.',
          badge: 'Optimisation juridique'
        }
      );
    }
  } else if (pLower.includes('site') || dLower === 'digital_project') {
      // Digital / Website with 0 €
      opportunities.push(
        {
          id: 'opp_free_stack',
          type: 'zero_budget_pivot',
          title: 'Architecture Cloud Gratuite (Zero-Cost Stack)',
          tagline: 'Hébergement, base de données et nom de domaine à 0 €',
          description: 'Hébergez gratuitement sur Vercel ou Netlify, utilisez Supabase ou Firebase en formule Free Tier, et commencez avec un sous-domaine gratuit avant d’investir 10 € pour un .fr/.com.',
          impactScore: 95,
          financialGainOrSaving: 'Économie de 300 € à 1 200 € / an',
          actionRequired: 'Déployer la maquette sur Vercel avec le dépôt GitHub lié.',
          badge: '100 % Gratuit'
        },
        {
          id: 'opp_prevente',
          type: 'faster_timeline',
          title: 'Validation par Pré-commandes (Landing Page Test)',
          tagline: 'Encaisser les premiers euros avant d’avoir codé l’application complète',
          description: 'Créer une page de présentation présentant la solution et un bouton de réservation pour mesurer l’intérêt réel.',
          impactScore: 88,
          financialGainOrSaving: 'Zéro risque d’investissement à perte',
          actionRequired: 'Partager le lien dans 3 communautés professionnelles cibles.',
          badge: 'Validation marché'
        }
      );
    }

  // 2. RELOCATION & LIVING IN SUNNY DESTINATIONS
  if (domain === 'relocation' || pLower.includes('partir') || pLower.includes('soleil') || pLower.includes('vivre') || pLower.includes('changer de vie')) {
    const relocationRes = buildDynamicRelocationShortlist(userProfile || { budget, goal: prompt });

    opportunities.push(
      {
        id: 'opp_reloc_cost',
        type: 'country_alternative',
        title: 'Optimisation Géographique : Villes Côtières Secondaires',
        tagline: 'Divise le loyer par deux par rapport aux capitales',
        description: 'En Espagne (Valence ou Alicante au lieu de Barcelone) ou au Portugal (Setúbal ou Braga au lieu de Lisbonne), la vie est 30 à 45 % moins chère avec le même ensoleillement.',
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
        description: 'Les pays méditerranéens (Espagne, Portugal, Grèce, Malte) offrent des régimes fiscaux favorables et un accès de plein droit aux ressortissants UE.',
        impactScore: 89,
        financialGainOrSaving: '+40 % de pouvoir d’achat net réel',
        actionRequired: 'Vérifier l’éligibilité au statut de travailleur indépendant européen (formulaire A1 / NIE).',
        badge: 'Fiscalité optimisée'
      }
    );

    return {
      headlineRecommendation: 'Nous avons identifié 3 alternatives à haut ensoleillement compatibles avec vos paramètres.',
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
  }

  // 3. VEHICLE PURCHASE WITH SALARY (Scenario C: 1800 €/m & 15000 € car)
  if (pLower.includes('voiture') || pLower.includes('auto')) {
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

  // 4. Default Scenarios
  return {
    headlineRecommendation: 'Voici les leviers stratégiques et alternatives d’optimisation identifiés pour sécuriser votre projet.',
    opportunities,
    subsidiesAndGrants,
    scenarios: {
      prudent: {
        title: 'Scénario Prudent (Démarrage Agile / Coût Réduit)',
        cost: Math.round(targetCost * 0.6),
        durationMonths: 6,
        description: 'Conserve un matelas de sécurité maximal en éliminant les dépenses accessoires de départ.',
        risk: 'Minimal'
      },
      normal: {
        title: 'Scénario Standard (Déploiement Recommandé)',
        cost: targetCost,
        durationMonths: 4,
        description: 'Équilibre sain entre investissement initial et confort d’exécution.',
        risk: 'Modéré'
      },
      ambitious: {
        title: 'Scénario Ambitieux (Version Clé en Main)',
        cost: Math.round(targetCost * 1.4),
        durationMonths: 2,
        description: 'Tout le matériel, la visibilité et la trésorerie de confort disponibles dès le premier jour.',
        risk: 'Exigeant'
      }
    }
  };
}
