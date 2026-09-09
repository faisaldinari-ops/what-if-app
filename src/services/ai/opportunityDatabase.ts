// src/services/ai/opportunityDatabase.ts
import { BenefitOpportunity, OpportunityCategory, EligibilityStatus, OpportunityValueType } from '../../types/opportunities';

export interface OpportunityTemplate {
  id: string;
  name: string;
  category: OpportunityCategory;
  description: string;
  potentialValue: string;
  baseEstimatedAmount: number;
  valueType: OpportunityValueType;
  officialSource: string;
  sourceUrl: string;
  retrievedAt: string;
  deadline: string | null;
  geographicScope: 'local' | 'regional' | 'national' | 'european' | 'international';
  applicationDifficulty: 'facile' | 'moyen' | 'complexe';
  estimatedTime: string;
  confidence: 'elevee' | 'moyenne' | 'faible';
  whyRelevant: string;
  whatToGet: string;
  eligibilityConditions: string[];
  requiredDocuments: string[];
  whereToApply: string;
  nextStep: string;
  isExpired: boolean;
  cumulableWith: string[];
  incompatibleWith?: string[];
  tags: string[];
  // Matchers
  domains: string[];
  requiresJobseeker?: boolean;
  requiresUnder26?: boolean;
  requiresRuralOrQpv?: boolean;
  requiresEquipmentPurchase?: boolean;
  requiresVehicule?: boolean;
  requiresRealEstate?: boolean;
  requiresEducation?: boolean;
  requiresBusinessCreation?: boolean;
}

export const OFFICIAL_OPPORTUNITIES_CATALOG: OpportunityTemplate[] = [
  // ============================================================================
  // 1. ENTREPRENEURIAT / ARTISANAT / COMMERCE
  // ============================================================================
  {
    id: 'aid_acre_urssaf',
    name: 'ACRE (Aide aux Créateurs et Repreneurs d’Entreprise)',
    category: 'exoneration_fiscale',
    description: 'Exonération de 50 % de cotisations sociales durant les 12 premiers mois d’activité. Permet d’alléger considérablement les charges au démarrage.',
    potentialValue: '1 500 € à 3 200 € d’économies sur les cotisations la 1ère année',
    baseEstimatedAmount: 2200,
    valueType: 'tax_saving',
    officialSource: 'URSSAF / Ministère de l’Économie',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F11677',
    retrievedAt: 'Septembre 2026',
    deadline: 'Demande à déposer dans les 45 jours suivant la création',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '15 jours',
    confidence: 'elevee',
    whyRelevant: 'Indispensable pour tout lancement d’activité indépendante ou artisanale : protège votre trésorerie dès le premier euro encaissé.',
    whatToGet: 'Réduction de moitié du taux de cotisations sociales (ex. ~11 % au lieu de 21,2 % en micro-entreprise de service).',
    eligibilityConditions: [
      'Demandeur d’emploi indemnisé ou non indemnisé inscrit depuis 6 mois',
      'Ou jeune de 18 à 25 ans révolus (ou jusqu’à 29 ans si reconnu handicapé)',
      'Ou bénéficiaire du RSA ou de l’ASS',
      'Créer ou reprendre une activité économique sous contrôle effectif'
    ],
    requiredDocuments: [
      'Formulaire de demande ACRE (téléchargeable sur urssaf.fr)',
      'Justificatif de situation (attestation France Travail, pièce d’identité, notification RSA)'
    ],
    whereToApply: 'Sur le portail autoentrepreneur.urssaf.fr ou auprès de votre Urssaf',
    nextStep: 'Télécharger le formulaire ACRE et le soumettre dès validation du formulaire INPI de création.',
    isExpired: false,
    cumulableWith: ['ARCE (France Travail)', 'Prêt d’Honneur Initiative France', 'Microcrédit ADIE', 'Bourse régionale'],
    tags: ['creation', 'entrepreneur', 'artisan', 'freelance', 'urssaf', 'charges'],
    domains: ['entrepreneurship', 'business', 'commerce'],
    requiresBusinessCreation: true
  },
  {
    id: 'aid_arce_francetravail',
    name: 'ARCE (Aide à la Reprise ou à la Création d’Entreprise)',
    category: 'aide_publique',
    description: 'Versement de 60 % du reliquat total de vos droits à l’assurance chômage sous forme de capital en deux versements pour financer votre trésorerie de départ.',
    potentialValue: 'Jusqu’à 60 % de vos droits chômage restants (~6 000 € à 18 000 € en capital)',
    baseEstimatedAmount: 7500,
    valueType: 'direct_grant',
    officialSource: 'France Travail',
    sourceUrl: 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocat/aides-financieres-et-autres-dis/aide-a-la-reprise-ou-a-la-creat.html',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent (demande dès immatriculation)',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '2 à 4 semaines',
    confidence: 'elevee',
    whyRelevant: 'Permet d’acheter votre premier matériel ou votre véhicule professionnel sans contracter d’emprunt bancaire lourd.',
    whatToGet: 'Deux versements par virement : le premier à la création, le second 6 mois plus tard si l’activité se poursuit.',
    eligibilityConditions: [
      'Être inscrit comme demandeur d’emploi indemnisé (bénéficiaire de l’ARE)',
      'Avoir obtenu l’ACRE',
      'Créer ou reprendre une entreprise après la rupture de contrat'
    ],
    requiredDocuments: [
      'Extrait Kbis ou attestation d’inscription au Registre National des Entreprises (RNE)',
      'Notification d’accord ACRE de l’Urssaf',
      'Formulaire de demande ARCE complété'
    ],
    whereToApply: 'Espace personnel France Travail (onglet Mes démarches)',
    nextStep: 'Informer votre conseiller France Travail de votre projet de création pour valider votre éligibilité à l’ACRE puis à l’ARCE.',
    isExpired: false,
    cumulableWith: ['ACRE', 'Prêt d’Honneur Initiative France', 'Microcrédit ADIE'],
    incompatibleWith: ['Maintien mensuel de l’ARE (il faut choisir entre l’ARCE en capital ou le maintien mensuel de l’allocation)'],
    tags: ['chomage', 'capital', 'france travail', 'tresorerie', 'creation'],
    domains: ['entrepreneurship', 'business'],
    requiresJobseeker: true,
    requiresBusinessCreation: true
  },
  {
    id: 'aid_pret_honneur_initiative',
    name: 'Prêt d’Honneur Initiative France / Réseau Entreprendre',
    category: 'pret_aide',
    description: 'Prêt personnel à 0 % d’intérêt, sans caution personnelle ni garantie requise, d’un montant de 3 000 € à 25 000 € pour renforcer vos fonds propres.',
    potentialValue: '3 000 € à 25 000 € à taux 0 % (effet levier bancaire x7)',
    baseEstimatedAmount: 8000,
    valueType: 'zero_interest_loan',
    officialSource: 'Initiative France / Bpifrance',
    sourceUrl: 'https://www.initiative-france.fr/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent (dossier examiné par comité d’agrément local mensuel)',
    geographicScope: 'national',
    applicationDifficulty: 'moyen',
    estimatedTime: '4 à 6 semaines',
    confidence: 'elevee',
    whyRelevant: 'Les banques considèrent ce prêt à 0 % comme de l’apport personnel, multipliant par 7 vos chances d’obtenir un crédit d’investissement.',
    whatToGet: 'Trésorerie remboursable sur 3 à 5 ans avec différé d’amortissement possible de 6 mois.',
    eligibilityConditions: [
      'Projet de création ou reprise d’entreprise de moins de 3 ans',
      'Plan d’affaires (business plan) et prévisionnel financier structuré',
      'Passage devant un comité local composé de chefs d’entreprise et d’experts'
    ],
    requiredDocuments: [
      'Business plan complet et compte de résultat prévisionnel sur 3 ans',
      'CV des fondateurs',
      'Devis des investissements prévus (matériel, véhicule, agencement)'
    ],
    whereToApply: 'Plateforme locale Initiative France ou Réseau Entreprendre la plus proche de chez vous',
    nextStep: 'Contacter la plateforme Initiative France de votre département pour obtenir le dossier de candidature.',
    isExpired: false,
    cumulableWith: ['ACRE', 'ARCE', 'Microcrédit ADIE', 'Garantie Bpifrance'],
    tags: ['pret 0%', 'fonds propres', 'initiative france', 'artisan', 'levier'],
    domains: ['entrepreneurship', 'business', 'commerce'],
    requiresBusinessCreation: true
  },
  {
    id: 'aid_microcredit_adie',
    name: 'Microcrédit Professionnel & Prime ADIE',
    category: 'pret_aide',
    description: 'Financement jusqu’à 12 000 € pour les créateurs qui n’ont pas accès au crédit bancaire classique, assorti d’un accompagnement gratuit personnalisé.',
    potentialValue: 'Jusqu’à 12 000 € de financement + primes régionales jusqu’à 3 000 €',
    baseEstimatedAmount: 5000,
    valueType: 'zero_interest_loan',
    officialSource: 'Association pour le Droit à l’Initiative Économique (ADIE)',
    sourceUrl: 'https://www.adie.org/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent (réponse en moins de 10 jours)',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '1 à 2 semaines',
    confidence: 'elevee',
    whyRelevant: 'Idéal si vous avez peu d’économies, aucun garant bancaire ou un profil rejeté par les banques traditionnelles.',
    whatToGet: 'Financement de trésorerie, de véhicule ou de matériel pro avec plan de remboursement adapté.',
    eligibilityConditions: [
      'Avoir un projet de création ou de développement d’entreprise',
      'Avoir besoin d’un garant solidaire sur une partie du prêt ou mobiliser le fonds de garantie'
    ],
    requiredDocuments: [
      'Pièce d’identité et justificatif de domicile',
      '3 derniers relevés bancaires',
      'Description du projet et liste des besoins matériels'
    ],
    whereToApply: 'En ligne sur adie.org ou dans l’une des 180 agences en France',
    nextStep: 'Simuler votre demande en 3 minutes sur le site adie.org.',
    isExpired: false,
    cumulableWith: ['ACRE', 'ARCE', 'Prêt d’honneur', 'Aides régionales'],
    tags: ['microcredit', 'adie', 'sans apport', 'inclusion', 'tresorerie'],
    domains: ['entrepreneurship', 'business', 'commerce']
  },
  {
    id: 'aid_cma_accompagnement',
    name: 'Accompagnement Création & Pack Artisan Chambre de Métiers (CMA)',
    category: 'accompagnement_gratuit',
    description: 'Diagnostic gratuit de votre projet, aide au montage du prévisionnel et formalités d’immatriculation prises en charge par les conseillers artisanat.',
    potentialValue: 'Économie de 800 € à 1 500 € en frais de conseil juridique et comptable',
    baseEstimatedAmount: 1000,
    valueType: 'in_kind_service',
    officialSource: 'Chambre de Métiers et de l’Artisanat (CMA France)',
    sourceUrl: 'https://www.cma-france.fr/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: 'Immédiat (rendez-vous sous 7 jours)',
    confidence: 'elevee',
    whyRelevant: 'Pour les électriciens, plombiers et artisans : vérification obligatoire des qualifications professionnelles (CAP/BEP ou 3 ans d’expérience) et accès aux aides sectorielles.',
    whatToGet: 'Rendez-vous individuel d’une heure avec un expert création + modèle de prévisionnel validé.',
    eligibilityConditions: [
      'Projet relevant du secteur de l’artisanat (bâtiment, fabrication, services, alimentation)',
      'Démarche ouverte avant ou après immatriculation'
    ],
    requiredDocuments: ['Diplôme professionnel (CAP/BEP/Bac Pro/BP) ou justificatifs d’expérience de 3 ans'],
    whereToApply: 'CMA de votre département',
    nextStep: 'Prendre rendez-vous au pôle création de votre Chambre de Métiers locale.',
    isExpired: false,
    cumulableWith: ['Toutes les aides financières'],
    tags: ['artisan', 'cma', 'electricien', 'batiment', 'conseil gratuit'],
    domains: ['entrepreneurship', 'business']
  },
  {
    id: 'aid_zfu_zrr_exoneration',
    name: 'Exonération Fiscale ZRR / FRR (France Ruralités) ou ZFU (Zones Franches)',
    category: 'exoneration_fiscale',
    description: 'Exonération totale d’impôt sur les bénéfices pendant 5 ans pour toute création ou reprise d’entreprise implantée en zone de revitalisation rurale ou zone franche urbaine.',
    potentialValue: 'Exonération totale d’impôt pendant 5 ans (jusqu’à 15 000 € à 40 000 € d’économies fiscales)',
    baseEstimatedAmount: 5000,
    valueType: 'tax_saving',
    officialSource: 'Ministère de l’Économie / Direction Générale des Finances Publiques',
    sourceUrl: 'https://entreprises.gouv.fr/fr/fiscalite/exonerations-et-credits-d-impot/zones-de-revitalisation-rurale-zrr',
    retrievedAt: 'Septembre 2026',
    deadline: 'Dispositif reconduit (France Ruralités Revitalisation)',
    geographicScope: 'local',
    applicationDifficulty: 'facile',
    estimatedTime: 'Déclaration annuelle',
    confidence: 'elevee',
    whyRelevant: 'Si vous vous installez dans une commune rurale ou une zone prioritaire, vous ne paierez aucun impôt sur vos bénéfices les premières années.',
    whatToGet: '100 % d’exonération d’IS ou d’IR pendant 5 ans, puis dégressif sur 3 ans.',
    eligibilityConditions: [
      'Siège social et activité réelle situés dans une commune classée FRR / ZRR ou ZFU',
      'Activité commerciale, artisanale ou libérale soumise à un régime réel d’imposition'
    ],
    requiredDocuments: ['Bail commercial ou attestation de domiciliation dans la commune éligible'],
    whereToApply: 'Mention sur la liasse fiscale annuelle transmise au service des impôts des entreprises (SIE)',
    nextStep: 'Vérifier si votre commune est classée ZRR / FRR sur l’observatoire des territoires (observatoire-des-territoires.gouv.fr).',
    isExpired: false,
    cumulableWith: ['ACRE', 'Prêt d’honneur', 'Toutes aides au matériel'],
    tags: ['zrr', 'frr', 'impot', 'rural', 'zfu', 'fiscalite'],
    domains: ['entrepreneurship', 'business', 'commerce'],
    requiresRuralOrQpv: true
  },
  {
    id: 'aid_france_num_tpe',
    name: 'Aides Régionales & Chèques France Num (Transition Numérique)',
    category: 'aide_publique',
    description: 'Subventions régionales pour financer la création de site web, le logiciel de devis/facturation ou le matériel informatique des artisans et commerçants.',
    potentialValue: '500 € à 2 500 € selon votre Conseil Régional',
    baseEstimatedAmount: 1000,
    valueType: 'direct_grant',
    officialSource: 'Direction Générale des Entreprises / France Num',
    sourceUrl: 'https://www.francenum.gouv.fr/aides-financieres',
    retrievedAt: 'Septembre 2026',
    deadline: 'Selon les vagues régionales en cours',
    geographicScope: 'regional',
    applicationDifficulty: 'facile',
    estimatedTime: '3 à 6 semaines',
    confidence: 'moyenne',
    whyRelevant: 'Finance vos outils de gestion de chantiers, votre logiciel de facturation certifié anti-fraude et votre présence en ligne.',
    whatToGet: 'Prise en charge de 50 % des dépenses numériques engagées (factures à l’appui).',
    eligibilityConditions: [
      'TPE de moins de 10 salariés réalisant moins de 2 M€ de chiffre d’affaires',
      'Dépenses d’au moins 450 € en solutions numériques ou accompagnement'
    ],
    requiredDocuments: ['Factures acquittées des prestataires numériques (site, logiciel, matériel)'],
    whereToApply: 'Portail des aides de votre Région ou sur francenum.gouv.fr',
    nextStep: 'Consulter la liste des aides numériques de votre région sur francenum.gouv.fr avant de commander vos logiciels.',
    isExpired: false,
    cumulableWith: ['ACRE', 'ARCE', 'Prêt d’honneur'],
    tags: ['numerique', 'site web', 'logiciel', 'france num', 'artisan'],
    domains: ['entrepreneurship', 'business', 'commerce', 'digital_project']
  },

  // ============================================================================
  // 2. ÉCONOMIES OPÉRATIONNELLES & BONS PLANS MATÉRIEL (SECTION 8 & 9)
  // ============================================================================
  {
    id: 'aid_leasing_pro_materiel',
    name: 'Location Longue Durée (LLD) / Matériel d’Occasion Pro Reconditionné',
    category: 'reduction_materiel',
    description: 'Privilégier le leasing ou l’achat reconditionné garanti au lieu de payer du matériel neuf au comptant. Conserve 80 % de votre trésorerie liquide.',
    potentialValue: 'Économie immédiate de 3 000 € à 8 000 € de trésorerie au démarrage',
    baseEstimatedAmount: 4000,
    valueType: 'cost_avoidance',
    officialSource: 'Bonne pratique financière / Conseil National de l’Artisanat',
    sourceUrl: 'https://bpifrance-creation.fr/encyclopedie/financements/credits-bancaires-aides/credit-bail-leasing',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: 'Immédiat',
    confidence: 'elevee',
    whyRelevant: 'Un utilitaire ou du gros matériel acheté au comptant assèche votre apport dès le jour 1. Une mensualité de location passe en charge d’exploitation déductible.',
    whatToGet: 'Loyer mensuel déductible fiscalement + garantie et assistance pièces incluses.',
    eligibilityConditions: ['Disposer d’un compte bancaire professionnel et d’un Kbis ou RNE'],
    requiredDocuments: ['Devis du loueur ou fournisseur de matériel professionnel'],
    whereToApply: 'Concessionnaires utilitaires pro ou loueurs spécialisés (LeasePlan, Arval, Hilti Fleet)',
    nextStep: 'Comparer les offres de LOA/LLD avec entretien inclus avant de signer un bon de commande comptant.',
    isExpired: false,
    cumulableWith: ['Toutes les aides publiques'],
    tags: ['leasing', 'materiel', 'lld', 'vehicule', 'tresorerie', 'occasion'],
    domains: ['entrepreneurship', 'business', 'commerce', 'money'],
    requiresEquipmentPurchase: true
  },
  {
    id: 'aid_free_cloud_stack',
    name: 'Stack Technologique Gratuite (Zero-Cost Hosting & No-Code)',
    category: 'alternative_gratuite',
    description: 'Déployer votre site et votre base de données à 0 € grâce aux offres gratuites généreuses (Vercel, GitHub, Supabase, Cloudflare, Airtable).',
    potentialValue: 'Économie de 600 € à 1 800 € / an d’abonnements serveurs et logiciels',
    baseEstimatedAmount: 1200,
    valueType: 'cost_avoidance',
    officialSource: 'Écosystème Open Source / Fournisseurs Cloud',
    sourceUrl: 'https://free-for.dev/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent',
    geographicScope: 'international',
    applicationDifficulty: 'facile',
    estimatedTime: 'Immédiat',
    confidence: 'elevee',
    whyRelevant: 'Ne payez aucun abonnement d’hébergement tant que vous n’avez pas vos premiers 1 000 utilisateurs payants.',
    whatToGet: 'Hébergement web mondial gratuit, base PostgreSQL gratuite, certificats SSL automatiques et sous-domaine offert.',
    eligibilityConditions: ['Utilisation standard dans les limites du Free Tier gratuit'],
    requiredDocuments: ['Aucun justificatif requis'],
    whereToApply: 'Directement sur vercel.com, github.com ou supabase.com',
    nextStep: 'Configurer votre projet sur les formules gratuites de base avant tout engagement payant.',
    isExpired: false,
    cumulableWith: ['Tous programmes'],
    tags: ['gratuit', 'cloud', 'hebergement', 'open source', 'freemium'],
    domains: ['digital_project', 'entrepreneurship', 'career']
  },

  // ============================================================================
  // 3. VÉHICULE & MOBILITÉ
  // ============================================================================
  {
    id: 'aid_prime_conversion_auto',
    name: 'Prime à la Conversion & Bonus Écologique',
    category: 'aide_logement_mobilite',
    description: 'Aide de l’État pour l’achat ou la location longue durée d’un véhicule peu polluant en mettant au rebut un ancien véhicule essence ou diesel.',
    potentialValue: 'Jusqu’à 3 000 € (véhicule thermique Crit’Air 1 récent) à 5 000 € (électrique)',
    baseEstimatedAmount: 2500,
    valueType: 'direct_grant',
    officialSource: 'Ministère de la Transition Écologique / ASP',
    sourceUrl: 'https://www.primealaconversion.gouv.fr/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Règles annuelles de la loi de finances',
    geographicScope: 'national',
    applicationDifficulty: 'moyen',
    estimatedTime: '4 à 8 semaines',
    confidence: 'elevee',
    whyRelevant: 'Si vous avez un ancien véhicule à remplacer, cette prime réduit directement la facture d’achat chez le concessionnaire ou sur dossier.',
    whatToGet: 'Déduction directe sur la facture d’achat par le professionnel ou virement bancaire de l’ASP.',
    eligibilityConditions: [
      'Mise au rebut d’un véhicule ancien (diesel avant 2011 ou essence avant 2006)',
      'Revenu fiscal de référence par part inférieur aux plafonds en vigueur',
      'Achat d’un véhicule Crit’Air 1 d’occasion ou électrique'
    ],
    requiredDocuments: ['Carte grise de l’ancien véhicule', 'Avis d’imposition', 'Facture d’achat du nouveau véhicule'],
    whereToApply: 'Sur le site primealaconversion.gouv.fr ou directement déduit par le vendeur automobile agréé',
    nextStep: 'Simuler votre éligibilité sur le barème officiel du simulateur gouvernemental avant d’acheter le véhicule.',
    isExpired: false,
    cumulableWith: ['Aides régionales pour les véhicules propres', 'Microcrédit mobilité'],
    tags: ['voiture', 'prime conversion', 'auto', 'vehicule', 'ecologie'],
    domains: ['money', 'entrepreneurship'],
    requiresVehicule: true
  },
  {
    id: 'aid_microcredit_mobilite',
    name: 'Microcrédit Mobilité (Permis & Véhicule d’Occasion)',
    category: 'pret_aide',
    description: 'Prêt accompagné jusqu’à 5 000 € à taux réduit garanti par l’État pour acheter un véhicule fiable ou financer le permis de conduire.',
    potentialValue: 'Jusqu’à 5 000 € de prêt sans conditions de ressources bancaires classiques',
    baseEstimatedAmount: 3000,
    valueType: 'zero_interest_loan',
    officialSource: 'France Travail / FASTT / CitésLab',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F21375',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '2 semaines',
    confidence: 'moyenne',
    whyRelevant: 'Permet de financer un véhicule de travail ou un moyen de locomotion pour conserver ou trouver un travail.',
    whatToGet: 'Fonds débloqués rapidement avec mensualités plafonnées à 80-120 €/mois.',
    eligibilityConditions: ['Avoir besoin d’un moyen de transport pour travailler ou rechercher un emploi'],
    requiredDocuments: ['Relevés de compte, devis d’achat ou devis d’auto-école'],
    whereToApply: 'Auprès d’un travailleur social, de France Travail ou d’associations conventionnées (ex. Crésus, Croix-Rouge)',
    nextStep: 'Demander une orientation microcrédit personnel à votre conseiller ou à l’ADIE.',
    isExpired: false,
    cumulableWith: ['Prime à la conversion', 'Aides locales'],
    tags: ['mobilite', 'voiture', 'permis', 'credit', 'emploi'],
    domains: ['money', 'career'],
    requiresVehicule: true
  },

  // ============================================================================
  // 4. IMMOBILIER & LOGEMENT
  // ============================================================================
  {
    id: 'aid_ptz_immobilier',
    name: 'Prêt à Taux Zéro (PTZ) pour Premier Achat',
    category: 'pret_aide',
    description: 'Prêt sans aucun intérêt remboursable avec un différé de 5 à 15 ans, finançant jusqu’à 40 % à 50 % de votre achat immobilier neuf ou ancien avec travaux.',
    potentialValue: 'Économie de 15 000 € à 35 000 € d’intérêts bancaires sur 20 ans',
    baseEstimatedAmount: 20000,
    valueType: 'zero_interest_loan',
    officialSource: 'Ministère du Logement / Service-Public.fr',
    sourceUrl: 'https://www.service-public.fr/particuliers/vosdroits/F10871',
    retrievedAt: 'Septembre 2026',
    deadline: 'Dispositif reconduit par la loi de finances',
    geographicScope: 'national',
    applicationDifficulty: 'moyen',
    estimatedTime: 'Intégré au dossier bancaire',
    confidence: 'elevee',
    whyRelevant: 'Un prêt à taux zéro diminue significativement la mensualité globale et permet d’acheter avec un salaire plus modeste.',
    whatToGet: 'Financement à 0 % d’intérêt complétant votre crédit principal.',
    eligibilityConditions: [
      'Ne pas avoir été propriétaire de sa résidence principale au cours des 2 dernières années (primo-accédant)',
      'Plafond de ressources selon la zone géographique et la composition du foyer',
      'Logement neuf en zone tendue ou ancien avec 25 % de travaux de rénovation énergétique en zone détendue'
    ],
    requiredDocuments: ['Dernier avis d’imposition N-2', 'Compromis de vente', 'Devis estimatif des travaux le cas échéant'],
    whereToApply: 'Directement auprès de votre banque prêteuse ou courtier en crédit',
    nextStep: 'Faire vérifier vos droits au PTZ par votre conseiller bancaire ou simuler sur le site de l’ANIL.',
    isExpired: false,
    cumulableWith: ['Prêt Action Logement', 'Épargne Logement (PEL/CEL)'],
    tags: ['immobilier', 'ptz', 'achat', 'taux zero', 'pret'],
    domains: ['real_estate'],
    requiresRealEstate: true
  },
  {
    id: 'aid_action_logement_pret',
    name: 'Prêt Accession Action Logement (ex-1% Logement)',
    category: 'pret_aide',
    description: 'Prêt à taux préférentiel très réduit (1 % à 1,5 %) jusqu’à 30 000 € accordé aux salariés du secteur privé pour financer leur résidence principale.',
    potentialValue: 'Jusqu’à 30 000 € à taux très bas (économie de 5 000 € à 10 000 € d’intérêts)',
    baseEstimatedAmount: 7000,
    valueType: 'zero_interest_loan',
    officialSource: 'Action Logement',
    sourceUrl: 'https://www.actionlogement.fr/le-pret-accession',
    retrievedAt: 'Septembre 2026',
    deadline: 'Dans la limite des enveloppes budgétaires annuelles',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '3 semaines',
    confidence: 'elevee',
    whyRelevant: 'Si vous êtes salarié d’une entreprise privée d’au moins 10 salariés, c’est un levier direct pour réduire le coût de votre emprunt.',
    whatToGet: 'Prêt complémentaire amortissable sur 25 ans maximum à taux très inférieur au marché.',
    eligibilityConditions: [
      'Salarié d’une entreprise du secteur privé non agricole d’au moins 10 salariés',
      'Respecter les plafonds de ressources PLI'
    ],
    requiredDocuments: ['Bulletin de salaire', 'Avis d’imposition', 'Attestation de l’employeur'],
    whereToApply: 'En ligne sur le portail actionlogement.fr',
    nextStep: 'Créer votre compte sur la plateforme Action Logement et vérifier les critères de votre employeur.',
    isExpired: false,
    cumulableWith: ['PTZ', 'Prêt bancaire classique'],
    tags: ['logement', 'action logement', 'salarie', 'accession', 'taux reduit'],
    domains: ['real_estate'],
    requiresRealEstate: true
  },

  // ============================================================================
  // 5. FORMATION & RECONVERSION
  // ============================================================================
  {
    id: 'aid_cpf_formation',
    name: 'Compte Personnel de Formation (CPF)',
    category: 'formation_financee',
    description: 'Droits acquis pour financer 100 % ou la quasi-totalité d’une formation qualifiante (permis, bilan de compétences, certification technique, création d’entreprise).',
    potentialValue: 'Jusqu’à 5 000 € de budget formation mobilisable',
    baseEstimatedAmount: 2500,
    valueType: 'direct_grant',
    officialSource: 'Caisse des Dépôts / Mon Compte Formation',
    sourceUrl: 'https://www.moncompteformation.gouv.fr/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: 'Immédiat (inscription en ligne)',
    confidence: 'elevee',
    whyRelevant: 'Ne payez jamais de votre poche une formation certifiée ou un permis sans avoir d’abord utilisé vos droits CPF acquis.',
    whatToGet: 'Prise en charge intégrale ou partielle des frais pédagogiques de formation.',
    eligibilityConditions: ['Avoir travaillé en tant que salarié ou indépendant en France'],
    requiredDocuments: ['Connexion FranceConnect'],
    whereToApply: 'Application officielle Mon Compte Formation',
    nextStep: 'Consulter votre solde en euros disponible sur moncompteformation.gouv.fr.',
    isExpired: false,
    cumulableWith: ['Abondement France Travail ou employeur'],
    tags: ['formation', 'cpf', 'reconversion', 'competences'],
    domains: ['career', 'education', 'entrepreneurship'],
    requiresEducation: true
  },
  {
    id: 'aid_transition_pro_ptp',
    name: 'Projet de Transition Professionnelle (PTP / Transition Pro)',
    category: 'formation_financee',
    description: 'Permet à un salarié en CDI de suivre une formation certifiante pour changer de métier tout en conservant 100 % de sa rémunération et ses frais payés.',
    potentialValue: 'Maintien de salaire pendant 6 à 12 mois + frais de formation pris en charge (15 000 € à 30 000 €)',
    baseEstimatedAmount: 18000,
    valueType: 'direct_grant',
    officialSource: 'Transitions Pro (Association régionale paritaire)',
    sourceUrl: 'https://www.transitionspro.fr/',
    retrievedAt: 'Septembre 2026',
    deadline: 'Dossier à déposer 3 mois avant le début de la formation',
    geographicScope: 'regional',
    applicationDifficulty: 'complexe',
    estimatedTime: '2 à 3 mois',
    confidence: 'elevee',
    whyRelevant: 'La voie royale pour quitter son emploi sans perte de revenus pour se former à un nouveau métier d’artisan ou de technicien.',
    whatToGet: 'Maintien de salaire mensuel garanti + prise en charge des coûts pédagogiques.',
    eligibilityConditions: [
      'Justifier d’une ancienneté d’au moins 24 mois consécutifs ou non (dont 12 mois dans l’entreprise actuelle)',
      'Formation éligible enregistrée au RNCP menant à une reconversion'
    ],
    requiredDocuments: ['Accord de l’employeur sur le calendrier d’absence', 'Devis de l’organisme de formation', 'Dossier de motivation'],
    whereToApply: 'Sur le site de votre association régionale Transitions Pro',
    nextStep: 'Télécharger le dossier Transitions Pro de votre région et solliciter un Conseil en Évolution Professionnelle (CEP) gratuit.',
    isExpired: false,
    cumulableWith: ['CPF'],
    tags: ['reconversion', 'transition pro', 'ptp', 'salaire maintenu', 'formation'],
    domains: ['career', 'education'],
    requiresEducation: true
  },

  // ============================================================================
  // 6. DISPOSITIFS JEUNES (< 26 ANS) & DEMANDEURS D'EMPLOI
  // ============================================================================
  {
    id: 'aid_contrat_engagement_jeune',
    name: 'Contrat d’Engagement Jeune (CEJ)',
    category: 'dispositif_jeune_emploi',
    description: 'Programme intensif d’accompagnement avec allocation mensuelle allant jusqu’à 528 € pour les jeunes de moins de 26 ans construisant leur projet pro.',
    potentialValue: 'Jusqu’à 528 €/mois d’allocation pendant 6 à 12 mois',
    baseEstimatedAmount: 3200,
    valueType: 'direct_grant',
    officialSource: 'Ministère du Travail / Missions Locales / France Travail',
    sourceUrl: 'https://www.1jeune1solution.gouv.fr/contrat-engagement-jeune',
    retrievedAt: 'Septembre 2026',
    deadline: 'Permanent pour les moins de 26 ans',
    geographicScope: 'national',
    applicationDifficulty: 'facile',
    estimatedTime: '1 à 2 semaines',
    confidence: 'elevee',
    whyRelevant: 'Offre un revenu de subsistance sécurisant pendant la préparation de votre projet d’entreprise ou de reconversion.',
    whatToGet: '15 à 20 heures d’accompagnement par semaine + allocation versée chaque mois.',
    eligibilityConditions: [
      'Avoir entre 16 et 25 ans révolus (jusqu’à 29 ans pour les jeunes en situation de handicap)',
      'Ne pas être en emploi durable, ni en formation ni en études'
    ],
    requiredDocuments: ['Pièce d’identité', 'RIB', 'Dernier avis fiscal personnel ou des parents'],
    whereToApply: 'Mission Locale ou agence France Travail la plus proche',
    nextStep: 'Prendre rendez-vous avec un conseiller Mission Locale ou sur 1jeune1solution.gouv.fr.',
    isExpired: false,
    cumulableWith: ['ACRE', 'Formations gratuites régionales'],
    tags: ['jeune', 'moins de 26 ans', 'cej', 'mission locale', 'allocation'],
    domains: ['career', 'education', 'entrepreneurship'],
    requiresUnder26: true
  }
];
