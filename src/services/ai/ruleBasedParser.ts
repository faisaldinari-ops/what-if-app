// src/services/ai/ruleBasedParser.ts
import { ProjectCategory, UserExtractedData, MissingQuestion, BenchmarkArchetype } from '../../types/decision';
import { SupportedLang } from '../../i18n';

export const BENCHMARK_ARCHETYPES: BenchmarkArchetype[] = [
  {
    category: 'entrepreneurship',
    keywords: ['électricien', 'electricien', 'artisan', 'plombier', 'chauffagiste', 'menuisier', 'btp'],
    defaultTitle: 'Artisan / Entreprise d’Électricité',
    estimatedStartupCost: 0, // Outillage de mesure, EPI, décennale, stage/formalités, communication
    estimatedMonthlyCost: 0, // Assurance décennale, carburant, expert-comptable
    estimatedRevenue: 0,
    rampUpMonths: 2,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Nécessité impérative d’une qualification reconnue (CAP/BEP ou 3 ans d’expérience - Loi Raffarin)',
      'Souscription obligatoire de l’assurance responsabilité civile décennale',
      'Délais d’encaissement des premiers chantiers clients'
    ],
    reducedVariantDescription: 'Démarrage en sous-traitance ou interventions dépannages avec véhicule personnel avant d’acheter un utilitaire floqué.',
    reducedCostRatio: 0.45,
    minimalVariantDescription: 'Activité de petit bricolage / dépannage d’urgence avec caisse d’outils de base et statuts micro-entreprise.',
    minimalCostRatio: 0.20
  },
  {
    category: 'entrepreneurship',
    keywords: ['food truck', 'foodtruck', 'camion pizza', 'snack', 'restauration mobile', 'street food'],
    defaultTitle: 'Food Truck / Restauration Mobile',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 3,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Emplacement et autorisations municipales incertaines',
      'Saisonnalité marquée et météo défavorable',
      'Pannes mécaniques du véhicule'
    ],
    reducedVariantDescription: 'Remorque tractée d’occasion ou stand de marché éphémère avant d’acheter le camion complet.',
    reducedCostRatio: 0.55,
    minimalVariantDescription: 'Stand street food en pop-up / traiteur événementiel sans véhicule dédié.',
    minimalCostRatio: 0.28
  },
  {
    category: 'entrepreneurship',
    keywords: ['barber', 'barbershop', 'salon de coiffure', 'coiffeur', 'coiffure', 'peluquería', 'hair salon'],
    defaultTitle: 'Salon de Coiffure / Barber Shop',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 4,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Frais de bail commercial et dépôt de garantie élevés',
      'Délai de fidélisation de la clientèle locale',
      'Charges fixes incompressibles du local'
    ],
    reducedVariantDescription: 'Location de fauteuil dans un salon existant (chair rental) pour démarrer sans bail.',
    reducedCostRatio: 0.35,
    minimalVariantDescription: 'Coiffure à domicile / clientèle privée avec kit professionnel portable.',
    minimalCostRatio: 0.15
  },
  {
    category: 'entrepreneurship',
    keywords: ['restaurant', 'bistrot', 'brasserie', 'café', 'coffee shop', 'bar'],
    defaultTitle: 'Restaurant / Café',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 5,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Normes d’hygiène et extraction coûteuse',
      'Pertes sur denrées périssables',
      'Fonds de commerce onéreux'
    ],
    reducedVariantDescription: 'Dark kitchen en livraison ou comptoir de vente à emporter avec surface réduite.',
    reducedCostRatio: 0.45,
    minimalVariantDescription: 'Comptoir éphémère / kiosque de boissons et pâtisseries.',
    minimalCostRatio: 0.22
  },
  {
    category: 'entrepreneurship',
    keywords: ['marque de vêtements', 'vetement', 'mode', 'clothing brand', 'textile', 'fashion', 't-shirt'],
    defaultTitle: 'Marque de Vêtements Indépendante',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 4,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Stocks invendus et immobilisation de trésorerie',
      'Coût élevé d’acquisition client sur les réseaux sociaux',
      'Délais de fabrication et retours produits'
    ],
    reducedVariantDescription: 'Impression à la demande (print-on-demand) sans stock initial pour valider le style.',
    reducedCostRatio: 0.35,
    minimalVariantDescription: 'Micro-capsule de 30 pièces en précommande exclusive avant production.',
    minimalCostRatio: 0.18
  },
  {
    category: 'entrepreneurship',
    keywords: ['application', 'app', 'application mobile', 'saas', 'software', 'logiciel', 'plateforme'],
    defaultTitle: 'Application / Produit Numérique',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 6,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Délais de développement sous-estimés',
      'Difficulté à trouver les 100 premiers utilisateurs payants',
      'Frais d’API et d’hébergement si montée en charge'
    ],
    reducedVariantDescription: 'Prototype no-code (Bubble, Webflow) ou service concierge manuel avant de coder.',
    reducedCostRatio: 0.30,
    minimalVariantDescription: 'Page d’atterrissage avec liste d’attente et pré-ventes pour tester l’intérêt réel.',
    minimalCostRatio: 0.10
  },
  {
    category: 'career',
    keywords: ['indépendant', 'freelance', 'freelancer', 'quitter mon travail', 'démissionner', 'quitter mon cdi', 'agence', 'consultant', 'consulting'],
    defaultTitle: 'Transition Freelance / Consultant',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 3,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Irrégularité des missions les premiers mois',
      'Perte de la sécurité sociale ou du chômage si mauvaise anticipation',
      'Délai de paiement des clients'
    ],
    reducedVariantDescription: 'Démarrage en micro-entreprise le soir et week-end avant de démissionner.',
    reducedCostRatio: 0.40,
    minimalVariantDescription: 'Négociation d’une rupture conventionnelle et mission freelance signée en amont.',
    minimalCostRatio: 0.20
  },
  {
    category: 'real_estate',
    keywords: ['acheter un appartement', 'achat immobilier', 'maison', 'logement', 'appartement', 'propriétaire', 'comprar casa', 'buy apartment', 'mortgage', 'crédit immobilier'],
    defaultTitle: 'Acquisition Immobilière',
    estimatedStartupCost: 0, // Apport + frais notaire
    estimatedMonthlyCost: 0, // Mensualité crédit + charges
    estimatedRevenue: 0,
    rampUpMonths: 2,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Taux d’endettement supérieur au seuil prudentiel de 33-35%',
      'Frais de notaire et travaux imprévus',
      'Hausse de taxe foncière ou charges de copropriété'
    ],
    reducedVariantDescription: 'Acheter une surface légèrement plus compacte ou en périphérie proche pour réduire l’emprunt de 20%.',
    reducedCostRatio: 0.75,
    minimalVariantDescription: 'Poursuivre la location 12 mois de plus pour doubler l’apport personnel et obtenir de meilleurs taux.',
    minimalCostRatio: 0.40
  },
  {
    category: 'relocation',
    keywords: ['espagne', 'déménager', 'expatrier', 'vivre à', 'spain', 'déménagement', 'mudarse', 'relocate', 'changer de pays', 'étranger'],
    defaultTitle: 'Expatriation / Déménagement',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 2,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Frais de caution, agence et double loyer temporaire',
      'Décalage entre coût de la vie estimé et réalité locale',
      'Délai pour trouver un emploi ou formaliser le statut fiscal (NIE, empadronamiento)'
    ],
    reducedVariantDescription: 'Sous-location meublée de 3 mois pour valider la ville avant bail long terme.',
    reducedCostRatio: 0.60,
    minimalVariantDescription: 'Séjour exploratoire de 3 semaines en télétravail avant déménagement définitif.',
    minimalCostRatio: 0.25
  },
  {
    category: 'education',
    keywords: ['études', 'reprendre des études', 'formation', 'bootcamp', 'master', 'diplôme', 'reconversion'],
    defaultTitle: 'Reprise d’Études / Formation Pro',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 6,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Période prolongée avec revenus réduits ou nuls',
      'Financement CPF ou aides régionales incertains',
      'Délai de retour sur investissement sur le salaire'
    ],
    reducedVariantDescription: 'Formation en alternance rémunérée ou cours du soir / distanciel à son rythme.',
    reducedCostRatio: 0.35,
    minimalVariantDescription: 'Auto-formation certifiante en ligne tout en conservant son emploi actuel.',
    minimalCostRatio: 0.15
  },
  {
    category: 'personal',
    keywords: ['japon', 'voyage', 'vacances', 'semaines au', 'semaine au', 'road trip', 'voyager', 'séjour', 'partir au japon'],
    defaultTitle: 'Voyage / Séjour au Japon (2 semaines)',
    estimatedStartupCost: 0, // Vols A/R (~900€), hébergement 14 nuits (~900€), vie & transports (~600€)
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 1,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Variation du coût des billets d’avion selon la saison (haute saison)',
      'Frais de change et paiements carte bancaire à l’étranger',
      'Assurance voyage et santé non comprise'
    ],
    reducedVariantDescription: 'Séjour de 10 jours en hébergement type guesthouse moderne, ramenant le coût à 1 600 €.',
    reducedCostRatio: 0.65,
    minimalVariantDescription: 'Voyage hors saison avec vols avec escale et JR Pass régional, ramenant le coût à 1 200 €.',
    minimalCostRatio: 0.50
  },
  {
    category: 'personal',
    keywords: ['voiture', 'acheter une voiture', 'véhicule', 'auto', 'car', 'moto', 'sabbatique', 'tour du monde'],
    defaultTitle: 'Achat Véhicule / Projet Personnel',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 1,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Dépréciation rapide du bien',
      'Coûts cachés (assurance, entretien, carburant)',
      'Immobilisation d’épargne de précaution'
    ],
    reducedVariantDescription: 'Modèle d’occasion récent vérifié ou motorisation plus sobre, réduisant le coût de 40%.',
    reducedCostRatio: 0.60,
    minimalVariantDescription: 'Location ponctuelle (autopartage / LOA courte) selon le besoin réel.',
    minimalCostRatio: 0.20
  }
];

export function extractNumbersFromText(text: string): {
  budget?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  cost?: number;
} {
  const result: {
    budget?: number;
    monthlyIncome?: number;
    monthlyExpenses?: number;
    cost?: number;
  } = {};

  const cleanText = text.replace(/[\u202F\u00A0]/g, ' ').toLowerCase();

  // 1. Budget / savings patterns: "j'ai 5000 €", "budget de 8000", "avec 20k", "épargne 15 000"
  if (
    cleanText.includes('sans apport') ||
    cleanText.includes('sans épargne') ||
    cleanText.includes("pas d'épargne") ||
    cleanText.includes("aucune épargne") ||
    cleanText.includes("rien de côté") ||
    cleanText.includes("j'ai 0") ||
    cleanText.includes("avec 0")
  ) {
    result.budget = 0;
  } else {
    const budgetMatches = cleanText.match(
      /(?:j['’]ai|avec|budget|épargne|apport|capital|économies|tengo|ahorros|i have|savings of|capital of)\s*(?:de\s*)?([0-9]+(?:\s*[0-9]{3})*|[0-9]+k)\s*(?:€|\$|£|chf|euros|euros?|dollars?)/i
    );
    if (budgetMatches && budgetMatches[1]) {
      result.budget = parseAmountString(budgetMatches[1]);
    }
  }

  // 2. Income patterns: "je gagne 2 400 €/mois", "salaire de 3000 €", "revenu 2500", "gano 2400", "earn 3000"
  const incomeMatches = cleanText.match(
    /(?:je gagne|salaire|revenu|revenus|gano|salario|earn|income|salary|make)\s*(?:de\s*)?([0-9]+(?:\s*[0-9]{3})*|[0-9]+k)\s*(?:€|\$|£|chf|euros?|dollars?)?(?:\s*(?:\/|par|al|per)\s*(?:mois|m|mes|month))?/i
  );
  if (incomeMatches && incomeMatches[1]) {
    result.monthlyIncome = parseAmountString(incomeMatches[1]);
  }

  // 3. Expenses patterns: "je dépense 1 600", "charges de 1200 €", "gastos de 1500", "spend 1200"
  const expenseMatches = cleanText.match(
    /(?:dépense|dépenses|charges|loyer|gastos|gasto|spend|expenses|living costs)\s*(?:de\s*)?([0-9]+(?:\s*[0-9]{3})*|[0-9]+k)\s*(?:€|\$|£|chf|euros?|dollars?)?(?:\s*(?:\/|par|al|per)\s*(?:mois|m|mes|month))?/i
  );
  if (expenseMatches && expenseMatches[1]) {
    result.monthlyExpenses = parseAmountString(expenseMatches[1]);
  }

  // 4. Target Cost / Asset Price patterns: "acheter une voiture à 15 000 €", "voiture à 15000", "coût de 10000 €"
  const costMatches = cleanText.match(
    /(?:acheter|achat|acquéreur|voiture à|auto à|prix de|coût de|d’un montant de|d'une valeur de|valeur de)\s*([0-9]+(?:\s*[0-9]{3})*|[0-9]+k)\s*(?:€|\$|£|chf|euros?|dollars?)/i
  );
  if (costMatches && costMatches[1]) {
    result.cost = parseAmountString(costMatches[1]);
  }

  // 5. Standalone currency amounts if not matched above and not already used
  if (result.budget === undefined) {
    const allAmounts = [...cleanText.matchAll(/([0-9]+(?:\s*[0-9]{3})*|[0-9]+k)\s*(?:€|\$|£|chf|euros)/gi)];
    for (const match of allAmounts) {
      const parsed = parseAmountString(match[1]);
      if (parsed !== result.monthlyIncome && parsed !== result.monthlyExpenses && parsed !== result.cost) {
        result.budget = parsed;
        break;
      }
    }
  }

  if (result.budget === undefined && result.monthlyIncome !== undefined && result.monthlyExpenses !== undefined) {
    result.budget = 0;
  }

  return result;
}

function parseAmountString(val: string): number {
  let s = val.replace(/\s+/g, '').toLowerCase();
  if (s.endsWith('k')) {
    return parseFloat(s.slice(0, -1)) * 1000;
  }
  return parseFloat(s) || 0;
}

export function matchArchetype(prompt: string): BenchmarkArchetype {
  const p = prompt.toLowerCase();
  for (const arch of BENCHMARK_ARCHETYPES) {
    for (const kw of arch.keywords) {
      if (p.includes(kw.toLowerCase())) {
        return arch;
      }
    }
  }

  // Default fallback archetype
  return {
    category: 'entrepreneurship',
    keywords: [],
    defaultTitle: 'Projet d’activité indépendante',
    estimatedStartupCost: 0,
    estimatedMonthlyCost: 0,
    estimatedRevenue: 0,
    rampUpMonths: 4,
    minimumSafetyBuffer: 0,
    typicalRisks: [
      'Délais de démarrage plus longs qu’anticipé',
      'Charges fixes à régler avant les premières rentrées d’argent',
      'Nécessité de conserver une épargne de sécurité'
    ],
    reducedVariantDescription: 'Démarrage à échelle modeste pour tester l’activité avant gros investissements.',
    reducedCostRatio: 0.50,
    minimalVariantDescription: 'Version test minimale (MVP) avec outillage de base.',
    minimalCostRatio: 0.20
  };
}

export function parseProjectWithRules(
  prompt: string,
  existingData?: Partial<UserExtractedData>,
  lang: SupportedLang = 'fr'
): {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
} {
  const numbers = extractNumbersFromText(prompt);
  const archetype = matchArchetype(prompt);

  // Extract location if present
  let location: string | undefined = existingData?.location;
  const locMatch = prompt.match(/(?:à|en|au|dans|in|at)\s+([A-ZÀ-Ÿ][a-zà-ÿ\-]+(?:\s+[A-ZÀ-Ÿ][a-zà-ÿ\-]+)?)/);
  if (locMatch && locMatch[1] && !location) {
    const candidate = locMatch[1].trim();
    const stopWords = ['mon', 'ma', 'mes', 'un', 'une', 'des', 'le', 'la', 'les', 'ce', 'cet', 'cette', 'ces', 'il', 'me', 'te', 'se', 'nous', 'vous', 'eux', 'lui', 'my', 'the', 'a', 'an'];
    if (!stopWords.includes(candidate.toLowerCase())) {
      location = candidate;
    }
  }

  // Build merged data
  const budget = existingData?.budget !== undefined ? existingData.budget : numbers.budget;
  const monthlyIncome = existingData?.monthlyIncome !== undefined ? existingData.monthlyIncome : numbers.monthlyIncome;
  const monthlyExpenses = existingData?.monthlyExpenses !== undefined ? existingData.monthlyExpenses : numbers.monthlyExpenses;

  // Title
  let projectTitle = existingData?.projectTitle;
  if (!projectTitle) {
    // Generate clean concise title from archetype
    projectTitle = archetype.defaultTitle;
    if (location) {
      projectTitle += ` (${location})`;
    }
  }

  const data: UserExtractedData = {
    prompt: existingData?.prompt || prompt,
    projectTitle,
    category: archetype.category,
    location,
    budget: budget !== undefined ? budget : undefined,
    monthlyIncome: monthlyIncome !== undefined ? monthlyIncome : undefined,
    monthlyExpenses: monthlyExpenses !== undefined ? monthlyExpenses : undefined,
    projectStartupCost: existingData?.projectStartupCost || numbers.cost || archetype.estimatedStartupCost,
    projectMonthlyRunningCost: existingData?.projectMonthlyRunningCost || archetype.estimatedMonthlyCost,
    projectExpectedRevenue: existingData?.projectExpectedRevenue || archetype.estimatedRevenue,
    monthsBeforeRevenue: existingData?.monthsBeforeRevenue || archetype.rampUpMonths,
    timelineMonths: existingData?.timelineMonths || 12,
    customAnswers: existingData?.customAnswers || {}
  };

  // Determine missing critical questions (Max 1 to 3, never re-asking already answered items)
  const missingQuestions: MissingQuestion[] = [];

  // 1. Budget check: Is capital known?
  if (data.budget === undefined) {
    missingQuestions.push({
      id: 'budget',
      field: 'budget',
      question:
        lang === 'fr'
          ? 'De combien d’argent disposes-tu actuellement pour ce projet (épargne / apport) ?'
          : lang === 'es'
          ? '¿De cuánto dinero dispones actualmente para este proyecto (ahorros / capital)?'
          : 'How much money do you currently have available for this project (savings / capital)?',
      explanation:
        lang === 'fr'
          ? 'Indispensable pour calculer ta marge de sécurité et ton besoin éventuel de financement.'
          : lang === 'es'
          ? 'Indispensable para calcular tu margen de seguridad y necesidades de financiación.'
          : 'Crucial for calculating your safety cushion and funding requirements.',
      type: 'number',
      placeholder: 'ex. 8 000',
      unit: '€'
    });
  }

  // 2. Current monthly income check
  if (data.monthlyIncome === undefined) {
    missingQuestions.push({
      id: 'monthlyIncome',
      field: 'monthlyIncome',
      question:
        lang === 'fr'
          ? 'Combien gagnes-tu actuellement par mois (salaire, revenus) ?'
          : lang === 'es'
          ? '¿Cuánto ingresas actualmente al mes (salario, ingresos netos)?'
          : 'How much do you currently earn per month (salary, net income)?',
      explanation:
        lang === 'fr'
          ? 'Permet d’évaluer si tu conserves une entrée d’argent pendant la phase de lancement.'
          : lang === 'es'
          ? 'Permite saber si conservas ingresos durante la fase de lanzamiento.'
          : 'Helps determine whether you have an active income stream while launching.',
      type: 'number',
      placeholder: 'ex. 2 400',
      unit: '€'
    });
  }

  // 3. Current fixed living expenses check
  if (data.monthlyExpenses === undefined) {
    missingQuestions.push({
      id: 'monthlyExpenses',
      field: 'monthlyExpenses',
      question:
        lang === 'fr'
          ? 'À combien s’élèvent tes dépenses personnelles mensuelles incompressibles (loyer, factures, vie) ?'
          : lang === 'es'
          ? '¿A cuánto ascienden tus gastos personales fijos al mes (alquiler, facturas, vida)?'
          : 'What are your monthly living expenses (rent, bills, essentials)?',
      explanation:
        lang === 'fr'
          ? 'Sert à calculer ton autonomie financière réelle (runway) sans te mettre en danger.'
          : lang === 'es'
          ? 'Sirve para calcular tu autonomía real en meses (runway) sin exponerte.'
          : 'Used to calculate your real financial runway in months without risk of insolvency.',
      type: 'number',
      placeholder: 'ex. 1 500',
      unit: '€'
    });
  }

  // Limit to max 3 questions
  const selectedQuestions = missingQuestions.slice(0, 3);
  const isReadyForAnalysis = selectedQuestions.length === 0;

  return {
    data,
    missingQuestions: selectedQuestions,
    isReadyForAnalysis
  };
}
