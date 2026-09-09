// src/types/opportunities.ts

export type OpportunityCategory =
  | 'aide_publique'              // Subventions d'État, régionales ou locales
  | 'exoneration_fiscale'        // ACRE, ZFU, exonérations de cotisations ou d'impôt
  | 'pret_aide'                  // Prêt d'honneur à taux 0%, microcrédit, prêt garanti
  | 'accompagnement_gratuit'     // Chambres des métiers, Bpifrance, incubateurs publics
  | 'formation_financee'         // CPF, Transition Pro, FAF
  | 'reduction_materiel'         // LLD/leasing, reconditionné, mutualisation
  | 'dispositif_jeune_emploi'    // Moins de 26 ans, demandeur d'emploi, contrats aidés
  | 'aide_logement_mobilite'     // Prime à la conversion, Visale, Action Logement
  | 'alternative_gratuite';      // Outils open source, freemium, crédits cloud startup

export type EligibilityStatus =
  | 'PROBABLEMENT_ELIGIBLE'      // Conditions remplies d'après les données fournies
  | 'A_VERIFIER'                 // Potentiellement éligible, conditions à confirmer
  | 'NON_ELIGIBLE'               // Exclu par les critères (âge, statut, localisation)
  | 'INFOS_MANQUANTES';          // Nécessite des informations complémentaires

export type OpportunityValueType =
  | 'direct_grant'               // Versement d'argent direct (subvention, prime)
  | 'tax_saving'                 // Économie de charges ou d'impôt
  | 'zero_interest_loan'         // Prêt à taux 0 % ou financement sans garantie
  | 'in_kind_service'            // Prestation ou accompagnement gratuit d'une valeur marchande
  | 'cost_avoidance';            // Économie directe sur achat (location, reconditionné, freemium)

export interface BenefitOpportunity {
  id: string;
  name: string;
  category: OpportunityCategory;
  description: string;
  potentialValue: string;        // Ex: "Jusqu'à 3 000 €", "60 % du reliquat ARE"
  estimatedNumericValue: number; // Valeur estimée pour le calcul financier optimisé
  valueType: OpportunityValueType;
  eligibilityStatus: EligibilityStatus;
  eligibilityConditions: string[];
  missingInformation: string[];  // Ex: ["Statut France Travail", "Âge exact"]
  officialSource: string;        // Ex: "URSSAF / Service-Public.fr"
  sourceUrl: string;             // Lien officiel vérifié
  retrievedAt: string;           // Date de référence (ex: "Septembre 2026")
  deadline: string | null;       // Ex: "Permanent", "Avant immatriculation"
  geographicScope: 'local' | 'regional' | 'national' | 'european' | 'international';
  applicationDifficulty: 'facile' | 'moyen' | 'complexe';
  estimatedTime: string;         // Ex: "2 à 3 semaines", "Immédiat"
  confidence: 'elevee' | 'moyenne' | 'faible';
  whyRelevant: string;           // Explication personnalisée pour le projet
  whatToGet: string;             // Ce que l'utilisateur débloque concrètement
  requiredDocuments: string[];   // Documents justificatifs habituels
  whereToApply: string;          // Organisme ou portail officiel
  nextStep: string;              // Action concrète immédiate à entreprendre
  isExpired: boolean;            // Faux si actif, vrai si dispositif clos
  cumulableWith: string[];       // Noms des dispositifs compatibles
  incompatibleWith?: string[];   // Dispositifs à ne pas cumuler en même temps
  opportunityScore: number;      // Score composite 0 à 100
  badge?: string;                // Ex: "Priorité #1", "0 € d'apport"
}

export interface OptimizedBudgetBreakdown {
  initialBudgetNeeded: number;
  confirmedGrants: number;
  probableSavings: number;
  accessibleFinancing: number;
  optimizedNetRemaining: number;
  breakdown: {
    confirmed: Array<{ label: string; amount: number }>;
    probable: Array<{ label: string; amount: number }>;
    toVerify: Array<{ label: string; amount: number }>;
  };
}

export interface CombinationStrategy {
  title: string;
  description: string;
  combinedSteps: Array<{
    stepNumber: number;
    title: string;
    impact: string;
    type: 'capital' | 'grant' | 'loan' | 'saving';
  }>;
  totalMobilized: number;
  compatibilityRules: string[];
}

export interface UserOpportunityProfile {
  employmentStatus?: 'jobseeker' | 'employee' | 'freelance' | 'student' | 'retired' | 'other';
  ageRange?: 'under_26' | '26_49' | '50_plus';
  locationType?: 'france_standard' | 'rural_zrr' | 'qpv_urban' | 'europe' | 'international';
  departmentOrCity?: string;
  projectStage?: 'idea' | 'creation' | 'takeover' | 'existing';
  hasDisabilityRecognition?: boolean;
}

export interface OpportunityEngineOutput {
  headlineRecommendation: string;
  opportunityScore: number;      // Score global d'opportunité pour ce projet (0 à 100)
  cautionAlert?: {
    title: string;
    message: string;
    actionBeforeSpending: string;
  };
  topOpportunities: BenefitOpportunity[];
  allOpportunities: BenefitOpportunity[];
  budgetOptimization: OptimizedBudgetBreakdown;
  combinationStrategy?: CombinationStrategy;
  scenarios: {
    minimumCash: { title: string; cost: number; durationMonths: number; description: string; risk: string };
    prudent: { title: string; cost: number; durationMonths: number; description: string; risk: string };
    accelerated: { title: string; cost: number; durationMonths: number; description: string; risk: string };
  };
  // Compatibilité ascendante avec les composants et tests précédents
  opportunities: Array<{
    id: string;
    type: 'country_alternative' | 'subsidy_aid' | 'cost_reduction' | 'zero_budget_pivot' | 'faster_timeline';
    title: string;
    tagline: string;
    description: string;
    impactScore: number;
    financialGainOrSaving: string;
    actionRequired: string;
    badge?: string;
  }>;
  subsidiesAndGrants: Array<{
    name: string;
    organization: string;
    estimatedAmount: string;
    eligibilityCriteria: string;
    officialUrl: string;
  }>;
}
