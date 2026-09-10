// src/services/ai/adaptiveDepthEngine.ts
import { UserExtractedData, DecisionAnalysis } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';

export type AdaptiveDepthType =
  | 'simple' // e.g. travel, gadgets, everyday personal project
  | 'personal_decision' // e.g. career shift, moving countries, sabbatical
  | 'complex' // e.g. real estate purchase, rental investment
  | 'entrepreneur' // e.g. freelance, artisan, shop, food truck
  | 'strategic'; // e.g. SME expansion, multi-sites, hiring 10+ employees

export interface CompressibleExpenseLever {
  id: string;
  categoryName: string;
  iconName: string;
  typicalMonthlySaving: number;
  currentEstimatedExpense: number;
  tip: string;
}

export interface AdaptiveLevel1Summary {
  depthType: AdaptiveDepthType;
  depthLabel: string;
  badgeStyle: 'emerald' | 'amber' | 'indigo' | 'rose';
  headlineVerdict: string;
  humanExplanation: string;
  keyFigure: {
    value: string;
    label: string;
    subtext: string;
  };
  primaryAction: {
    label: string;
    actionType: 'SAVINGS_FINDER' | 'ACTION_PLAN' | 'OPPORTUNITIES' | 'VARIANTS' | 'SMART_CTA';
    targetMonthlySavings?: number;
    totalGap?: number;
    monthsHorizon?: number;
  };
  secondaryAction?: {
    label: string;
    actionType: 'SAVINGS_FINDER' | 'ACTION_PLAN' | 'OPPORTUNITIES' | 'VARIANTS' | 'FULL_FINANCIALS';
  };
  // Specific to Entrepreneur mode
  entrepreneurCards?: {
    icon: string;
    title: string;
    subtitle: string;
    badge: string;
    items: string[];
  }[];
  // Specific to Simple mode (Gap-to-Goal milestones)
  simpleMilestones?: {
    stepTitle: string;
    detail: string;
    timing: string;
  }[];
  compressibleLevers: CompressibleExpenseLever[];
}

/**
 * Classifies a project request into one of 5 adaptive depth levels.
 */
export function classifyAdaptiveDepth(
  prompt: string,
  category?: string,
  data?: Partial<UserExtractedData>
): AdaptiveDepthType {
  const p = (prompt + ' ' + (data?.projectTitle || '')).toLowerCase();

  // 1. Strategic: SME with multiple staff, capital raises, multi-location
  if (
    p.includes('salariés') ||
    p.includes('salaries') ||
    p.includes('employés') ||
    p.includes('filiale') ||
    p.includes('implantation') ||
    p.includes('levée de fonds') ||
    p.includes('succursale') ||
    p.includes('croissance externe') ||
    p.includes('franchise')
  ) {
    return 'strategic';
  }

  // 2. Entrepreneur: Business creation, artisan, freelance, trade, restaurant, e-commerce, beauty, services
  if (
    category === 'entrepreneurship' ||
    p.includes('entreprise') ||
    p.includes('société') ||
    p.includes('societe') ||
    p.includes('boite') ||
    p.includes('boîte') ||
    p.includes('creer ma') ||
    p.includes('créer ma') ||
    p.includes('lancer ma') ||
    p.includes('lancer mon') ||
    p.includes('ongle') ||
    p.includes('cil') ||
    p.includes('faux cils') ||
    p.includes('esthétique') ||
    p.includes('esthetique') ||
    p.includes('beaute') ||
    p.includes('beauté') ||
    p.includes('artisan') ||
    p.includes('électricien') ||
    p.includes('electricien') ||
    p.includes('plombier') ||
    p.includes('toilettage') ||
    p.includes('soudure') ||
    p.includes('btp') ||
    p.includes('food truck') ||
    p.includes('restaurant') ||
    p.includes('barber') ||
    p.includes('salon') ||
    p.includes('boutique') ||
    p.includes('commerce') ||
    p.includes('e-commerce') ||
    p.includes('freelance') ||
    p.includes('startup') ||
    p.includes('micro-entreprise') ||
    p.includes('vendre')
  ) {
    return 'entrepreneur';
  }

  // 3. Complex: Real Estate / Big mortgages / heavy investments
  if (
    category === 'real_estate' ||
    p.includes('appartement') ||
    p.includes('maison') ||
    p.includes('immobilier') ||
    p.includes('crédit immobilier') ||
    p.includes('locatif') ||
    p.includes('scpi') ||
    p.includes('notaire')
  ) {
    return 'complex';
  }

  // 4. Personal Decision: Life transitions, quitting jobs, relocation
  if (
    category === 'relocation' ||
    category === 'career' ||
    category === 'education' ||
    p.includes('quitter mon') ||
    p.includes('démissionner') ||
    p.includes('expatri') ||
    p.includes('changer de pays') ||
    p.includes('déménager') ||
    p.includes('sabbatique') ||
    p.includes('reconversion') ||
    p.includes('reprendre des études')
  ) {
    return 'personal_decision';
  }

  // 5. Simple: Travel, purchase, vacation, consumer goal
  return 'simple';
}

/**
 * Returns compressible expense categories with actionable benchmarks
 */
export function getStandardCompressibleLevers(lang: SupportedLang): CompressibleExpenseLever[] {
  if (lang === 'fr') {
    return [
      {
        id: 'groceries',
        categoryName: 'Courses & Alimentation',
        iconName: 'ShoppingBag',
        typicalMonthlySaving: 90,
        currentEstimatedExpense: 450,
        tip: 'Privilégier marques distributeurs, batch-cooking et paniers anti-gaspi (-20%).'
      },
      {
        id: 'outings',
        categoryName: 'Sorties, Bars & Restos',
        iconName: 'Utensils',
        typicalMonthlySaving: 80,
        currentEstimatedExpense: 220,
        tip: 'Limiter à 1 sortie resto/semaine et privilégier apéros à domicile.'
      },
      {
        id: 'subscriptions',
        categoryName: 'Abonnements & Numérique',
        iconName: 'Smartphone',
        typicalMonthlySaving: 35,
        currentEstimatedExpense: 85,
        tip: 'Résilier les streaming redondants et passer sur un forfait mobile sans engagement à 9,99 €.'
      },
      {
        id: 'housing_bills',
        categoryName: 'Énergie & Assurances',
        iconName: 'Zap',
        typicalMonthlySaving: 45,
        currentEstimatedExpense: 140,
        tip: 'Renégocier assurance habitation et comparer les fournisseurs d’électricité en ligne.'
      },
      {
        id: 'transport',
        categoryName: 'Transport & Déplacements',
        iconName: 'Car',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 160,
        tip: 'Éco-conduite, covoiturage ponctuel et révision de la formule assurance auto.'
      },
      {
        id: 'extras',
        categoryName: 'Petits plaisirs & Cafés',
        iconName: 'Coffee',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 70,
        tip: 'Éviter les snacks et cafés à emporter quotidiens (règle des 48h avant achat impulsif).'
      }
    ];
  } else if (lang === 'es') {
    return [
      {
        id: 'groceries',
        categoryName: 'Supermercado y Comida',
        iconName: 'ShoppingBag',
        typicalMonthlySaving: 80,
        currentEstimatedExpense: 400,
        tip: 'Marcas blancas y planificación semanal.'
      },
      {
        id: 'outings',
        categoryName: 'Ocio, Bares y Restaurantes',
        iconName: 'Utensils',
        typicalMonthlySaving: 70,
        currentEstimatedExpense: 200,
        tip: 'Reducir salidas a restaurantes a una por semana.'
      },
      {
        id: 'subscriptions',
        categoryName: 'Suscripciones y Móvil',
        iconName: 'Smartphone',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 75,
        tip: 'Optimizar tarifas de móvil y streaming.'
      },
      {
        id: 'housing_bills',
        categoryName: 'Energía y Seguros',
        iconName: 'Zap',
        typicalMonthlySaving: 40,
        currentEstimatedExpense: 130,
        tip: 'Comparar contratos de luz y seguros del hogar.'
      },
      {
        id: 'transport',
        categoryName: 'Transporte',
        iconName: 'Car',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 150,
        tip: 'Transporte público y optimización de trayectos.'
      },
      {
        id: 'extras',
        categoryName: 'Extras cotidianos',
        iconName: 'Coffee',
        typicalMonthlySaving: 25,
        currentEstimatedExpense: 60,
        tip: 'Evitar compras impulsivas.'
      }
    ];
  } else {
    return [
      {
        id: 'groceries',
        categoryName: 'Groceries & Food',
        iconName: 'ShoppingBag',
        typicalMonthlySaving: 90,
        currentEstimatedExpense: 450,
        tip: 'Store brands, meal planning, and reduced food waste.'
      },
      {
        id: 'outings',
        categoryName: 'Dining Out & Entertainment',
        iconName: 'Utensils',
        typicalMonthlySaving: 80,
        currentEstimatedExpense: 220,
        tip: 'Limit dining out to once a week and favor homemade gatherings.'
      },
      {
        id: 'subscriptions',
        categoryName: 'Digital & Subscriptions',
        iconName: 'Smartphone',
        typicalMonthlySaving: 35,
        currentEstimatedExpense: 85,
        tip: 'Audit recurring streaming subs and switch to SIM-only phone plans.'
      },
      {
        id: 'housing_bills',
        categoryName: 'Energy & Insurances',
        iconName: 'Zap',
        typicalMonthlySaving: 45,
        currentEstimatedExpense: 140,
        tip: 'Renegotiate home policy and compare utility tariffs.'
      },
      {
        id: 'transport',
        categoryName: 'Transport & Commuting',
        iconName: 'Car',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 160,
        tip: 'Carpooling, transit passes, and car insurance policy audit.'
      },
      {
        id: 'extras',
        categoryName: 'Daily Coffees & Impulse Buys',
        iconName: 'Coffee',
        typicalMonthlySaving: 30,
        currentEstimatedExpense: 70,
        tip: 'Apply the 48-hour rule to avoid daily impulse purchases.'
      }
    ];
  }
}

/**
 * Builds the Level 1 5-second ultra-intelligent, solution-oriented summary
 */
export function buildAdaptiveLevel1Summary(
  analysis: DecisionAnalysis,
  data: UserExtractedData,
  lang: SupportedLang,
  currency: SupportedCurrency
): AdaptiveLevel1Summary {
  const depthType = classifyAdaptiveDepth(data.prompt, data.category, data);
  const levers = getStandardCompressibleLevers(lang);

  const budgetAvailable = analysis.metrics.budgetAvailable;
  const budgetNeeded = analysis.metrics.budgetNeeded;
  const gap = analysis.metrics.gap; // available - needed
  const monthlyIncome = data.monthlyIncome || 0;
  const monthlyExpenses = data.monthlyExpenses || 0;
  const currentMargin = monthlyIncome - monthlyExpenses;

  // Depth labels
  const depthLabels = {
    simple: lang === 'fr' ? 'Projet personnel & Voyage' : lang === 'es' ? 'Proyecto personal y viaje' : 'Personal & Travel Project',
    personal_decision: lang === 'fr' ? 'Transition de vie & Mobilité' : lang === 'es' ? 'Transición de vida' : 'Life Transition & Move',
    complex: lang === 'fr' ? 'Projet patrimonial / Immobilier' : lang === 'es' ? 'Proyecto inmobiliario' : 'Real Estate / Asset Project',
    entrepreneur: lang === 'fr' ? 'Création d’entreprise & Activité pro' : lang === 'es' ? 'Creación de empresa' : 'Business Launch & Freelance',
    strategic: lang === 'fr' ? 'Développement stratégique PME' : lang === 'es' ? 'Estrategia de empresa' : 'SME Strategic Expansion'
  };

  // 1. Calculate realistic monthly savings target if there is a gap
  let targetSavingsMonthly = 300;
  let monthsHorizon = 8;

  if (gap < 0) {
    const missing = Math.abs(gap);
    // Target 6-12 months horizon
    if (currentMargin > 100) {
      targetSavingsMonthly = currentMargin;
      monthsHorizon = Math.max(1, Math.ceil(missing / targetSavingsMonthly));
    } else {
      // Need to free up savings through expenses optimization
      // Typical achievable savings is 250€ - 400€
      const sumTypicalSavings = levers.reduce((acc, l) => acc + l.typicalMonthlySaving, 0); // ~310€
      targetSavingsMonthly = Math.min(500, Math.max(150, Math.round(sumTypicalSavings / 10) * 10));
      monthsHorizon = Math.max(1, Math.ceil(missing / targetSavingsMonthly));
    }
  }

  // 2. Format Human Verdict & Headline (5-Second Rule: Positive & Solution-Oriented)
  let headlineVerdict = '';
  let humanExplanation = '';
  let badgeStyle: 'emerald' | 'amber' | 'indigo' | 'rose' = 'emerald';
  let keyFigure = {
    value: formatCurrency(budgetNeeded, currency),
    label: lang === 'fr' ? 'Budget cible' : 'Target budget',
    subtext: ''
  };

  if (gap >= 0) {
    badgeStyle = 'emerald';
    headlineVerdict =
      lang === 'fr'
        ? 'TON PROJET EST FAISABLE DÈS MAINTENANT'
        : lang === 'es'
        ? 'TU PROYECTO ES VIABLE AHORA MISMO'
        : 'YOUR PROJECT IS FEASIBLE RIGHT NOW';

    humanExplanation =
      lang === 'fr'
        ? `Ton capital de départ (${formatCurrency(budgetAvailable, currency)}) finance l'intégralité du démarrage estimé (${formatCurrency(budgetNeeded, currency)}). Tu as les voyants au vert pour démarrer.`
        : `Your upfront capital (${formatCurrency(budgetAvailable, currency)}) covers estimated launch requirements (${formatCurrency(budgetNeeded, currency)}). You're ready to proceed.`;

    keyFigure = {
      value: formatCurrency(gap, currency),
      label: lang === 'fr' ? 'Excédent protecteur disponible' : 'Available safety cushion',
      subtext:
        lang === 'fr'
          ? `Budget nécessaire de ${formatCurrency(budgetNeeded, currency)} 100% financé`
          : `Target cost of ${formatCurrency(budgetNeeded, currency)} fully funded`
    };
  } else if (gap < 0 && (monthlyIncome > 0 || depthType === 'simple')) {
    // GAP-TO-GOAL: Solution engine!
    badgeStyle = 'indigo';
    headlineVerdict =
      lang === 'fr'
        ? `FAISABLE EN TROUVANT ${targetSavingsMonthly} €/MOIS`
        : lang === 'es'
        ? `VIABLE AHORRANDO ${targetSavingsMonthly} €/MES`
        : `FEASIBLE BY SAVING ${formatCurrency(targetSavingsMonthly, currency)}/MO`;

    if (currentMargin <= 0 && monthlyIncome > 0 && monthlyExpenses > 0) {
      humanExplanation =
        lang === 'fr'
          ? `Tu dépenses actuellement tout ce que tu gagnes (${formatCurrency(monthlyIncome, currency)}/mois). En optimisant tes charges compressibles de ${targetSavingsMonthly} €/mois, ton projet est financé dans ${monthsHorizon} mois.`
          : `You are currently spending your entire monthly income (${formatCurrency(monthlyIncome, currency)}/mo). By trimming ${formatCurrency(targetSavingsMonthly, currency)}/mo from everyday bills, your project is fully funded in ${monthsHorizon} months.`;
    } else {
      humanExplanation =
        lang === 'fr'
          ? `Il te manque ${formatCurrency(Math.abs(gap), currency)} pour financer ce projet sereinement. En épargnant ${targetSavingsMonthly} € par mois, tu es prêt à partir dans ${monthsHorizon} mois.`
          : `You are missing ${formatCurrency(Math.abs(gap), currency)} to launch comfortably. By setting aside ${formatCurrency(targetSavingsMonthly, currency)} per month, you are ready in ${monthsHorizon} months.`;
    }

    keyFigure = {
      value: `${monthsHorizon} ${lang === 'fr' ? 'mois' : 'months'}`,
      label:
        lang === 'fr'
          ? `Délai avec ${targetSavingsMonthly} €/mois d’épargne`
          : `Timeline with ${formatCurrency(targetSavingsMonthly, currency)}/mo savings`,
      subtext:
        lang === 'fr'
          ? `Écart total de ${formatCurrency(Math.abs(gap), currency)} à réunir`
          : `Total shortfall of ${formatCurrency(Math.abs(gap), currency)} to bridge`
    };
  } else if (analysis.score >= 45) {
    badgeStyle = 'amber';
    headlineVerdict =
      lang === 'fr'
        ? 'FAISABLE EN ADAPTANT LA FORMULE'
        : lang === 'es'
        ? 'VIABLE ADAPTANDO EL FORMATO'
        : 'FEASIBLE WITH ADJUSTMENTS';

    humanExplanation =
      lang === 'fr'
        ? `Le budget complet de départ est un peu serré (${formatCurrency(budgetAvailable, currency)} pour ${formatCurrency(budgetNeeded, currency)}), mais une formule allégée ou phasée permet de démarrer immédiatement sans risque.`
        : `The full upfront scope is tight (${formatCurrency(budgetAvailable, currency)} vs ${formatCurrency(budgetNeeded, currency)}), but a lean or phased launch allows you to start immediately without financial risk.`;

    keyFigure = {
      value: formatCurrency(Math.abs(gap), currency),
      label: lang === 'fr' ? 'Écart à combler ou négocier' : 'Gap to bridge or reduce',
      subtext:
        lang === 'fr'
          ? 'Accessible via version allégée ou aides publiques'
          : 'Accessible via lean launch or public grants'
    };
  } else {
    // Low capital or high risk
    badgeStyle = 'amber';
    headlineVerdict =
      lang === 'fr'
        ? 'FAISABLE AVEC CAPITAL DE DÉPART & AIDES'
        : lang === 'es'
        ? 'VIABLE CON CAPITAL INICIAL Y AYUDAS'
        : 'FEASIBLE WITH SEED CAPITAL & GRANTS';

    humanExplanation =
      lang === 'fr'
        ? `L’investissement nécessaire (${formatCurrency(budgetNeeded, currency)}) dépasse tes liquidités actuelles (${formatCurrency(budgetAvailable, currency)}). Pour ne pas courir de risque, il faut mobiliser des aides publiques ou débuter en micro-format.`
        : `The required setup capital (${formatCurrency(budgetNeeded, currency)}) exceeds current savings (${formatCurrency(budgetAvailable, currency)}). Leverage public subsidies or start lean to prevent liquidity shock.`;

    keyFigure = {
      value: formatCurrency(Math.abs(gap), currency),
      label: lang === 'fr' ? 'Financement ou aides à mobiliser' : 'Funding / Grants required',
      subtext:
        lang === 'fr'
          ? 'Des dispositifs publics et micro-crédits sont disponibles'
          : 'Public programs and seed funding are available'
    };
  }

  // 3. Primary & Secondary CTA Selection (Smart & Simple)
  let primaryAction: AdaptiveLevel1Summary['primaryAction'];
  let secondaryAction: AdaptiveLevel1Summary['secondaryAction'] = {
    label: lang === 'fr' ? 'Voir le plan concret' : 'View concrete roadmap',
    actionType: 'ACTION_PLAN'
  };

  if (gap < 0 && (depthType === 'simple' || monthlyIncome > 0)) {
    primaryAction = {
      label:
        lang === 'fr'
          ? `🎯 M'aider à trouver ${targetSavingsMonthly} €/mois d'économies`
          : lang === 'es'
          ? `🎯 Ayúdame a encontrar ${targetSavingsMonthly} €/mes`
          : `🎯 Help me find ${formatCurrency(targetSavingsMonthly, currency)}/mo in savings`,
      actionType: 'SAVINGS_FINDER',
      targetMonthlySavings: targetSavingsMonthly,
      totalGap: Math.abs(gap),
      monthsHorizon
    };
    secondaryAction = {
      label: lang === 'fr' ? 'Explorer les options moins chères' : 'Explore lower cost options',
      actionType: 'VARIANTS'
    };
  } else if (depthType === 'entrepreneur' || depthType === 'strategic') {
    primaryAction = {
      label:
        lang === 'fr'
          ? '🚀 Découvrir les étapes de lancement'
          : lang === 'es'
          ? '🚀 Ver los pasos de lanzamiento'
          : '🚀 Discover launch steps',
      actionType: 'ACTION_PLAN'
    };
    secondaryAction = {
      label:
        lang === 'fr'
          ? '🎁 Voir les aides & exonérations mobilisables'
          : '🎁 View eligible subsidies & tax reliefs',
      actionType: 'OPPORTUNITIES'
    };
  } else {
    primaryAction = {
      label:
        lang === 'fr'
          ? '🚀 Dérouler mon plan d’action concret'
          : lang === 'es'
          ? '🚀 Ver mi plan de acción'
          : '🚀 Review my concrete action plan',
      actionType: 'ACTION_PLAN'
    };
    secondaryAction = {
      label: lang === 'fr' ? 'Tester la version allégée' : 'Test lean variant',
      actionType: 'VARIANTS'
    };
  }

  // 4. Entrepreneur-specific highlights cards
  let entrepreneurCards: AdaptiveLevel1Summary['entrepreneurCards'];
  if (depthType === 'entrepreneur' || depthType === 'strategic') {
    const isArtisan = (data.prompt + ' ' + (data.projectTitle || '')).toLowerCase().includes('électricien') ||
      (data.prompt + ' ' + (data.projectTitle || '')).toLowerCase().includes('artisan');

    entrepreneurCards = [
      {
        icon: 'Briefcase',
        title: lang === 'fr' ? 'Statut & Régime fiscal' : 'Legal Status & Taxes',
        subtitle: lang === 'fr' ? 'Micro-entreprise recommandée au départ' : 'Sole proprietorship first',
        badge: lang === 'fr' ? 'Charges allégées' : 'Reduced overhead',
        items: [
          lang === 'fr' ? 'Franchise de TVA jusqu’à 36 800 € (services)' : 'VAT exemption under threshold',
          lang === 'fr' ? 'Exonération ACRE : 50% de cotisations la 1ère année' : 'ACRE relief: 50% social tax cut Yr 1',
          lang === 'fr' ? 'Comptabilité simplifiée sans commissaire aux comptes' : 'Simplified bookkeeping'
        ]
      },
      {
        icon: 'ShieldCheck',
        title: lang === 'fr' ? 'Obligations & Matériel' : 'Equipment & Requirements',
        subtitle: isArtisan ? (lang === 'fr' ? 'Assurance décennale obligatoire' : 'Decennial warranty required') : (lang === 'fr' ? 'Équipement de base et assurance RC' : 'Core kit & liability insurance'),
        badge: lang === 'fr' ? 'Priorité légale' : 'Mandatory step',
        items: [
          isArtisan
            ? (lang === 'fr' ? 'CAP/BEP ou 3 ans d’expérience pour immatriculation CMA' : 'Certification proof required')
            : (lang === 'fr' ? 'Assurance Responsabilité Civile Professionnelle (RC Pro)' : 'Professional liability coverage'),
          lang === 'fr' ? 'Outillage essentiel neuf ou d’occasion garanti' : 'Essential toolkit (new or certified refurbs)',
          lang === 'fr' ? 'BFR de 2 mois pour couvrir les délais d’encaissement clients' : '2-month cash runway for client payment terms'
        ]
      },
      {
        icon: 'PiggyBank',
        title: lang === 'fr' ? 'Financements & Aides' : 'Funding & Subsidies',
        subtitle: lang === 'fr' ? 'Leviers pour compléter tes fonds propres' : 'Programs to supplement your equity',
        badge: lang === 'fr' ? 'Non dilutif' : 'Non-dilutive',
        items: [
          lang === 'fr' ? 'Maintien ARE ou versement ARCE (60% droits chômage)' : 'ARCE lump-sum or ongoing unemployment allowance',
          lang === 'fr' ? 'Prêt d’honneur Initiative France / Réseau Entreprendre à taux 0' : '0% interest honor loan (up to €10,000)',
          lang === 'fr' ? 'Garantie bancaire Bpifrance création' : 'Bpifrance bank guarantee backing'
        ]
      }
    ];
  }

  // 5. Simple mode milestone projection (domain-aware)
  const isBusinessOrEntrepreneur =
    depthType === 'entrepreneur' ||
    depthType === 'strategic' ||
    data.category === 'entrepreneurship';

  const simpleMilestones = isBusinessOrEntrepreneur
    ? [
        {
          stepTitle: lang === 'fr' ? 'Étape 1 : Immatriculation & Sécurisation légale' : 'Step 1: Legal Registration & Insurance',
          detail:
            lang === 'fr'
              ? 'Déclaration gratuite sur le guichet unique INPI et souscription de la RC Pro.'
              : 'Free online registration at INPI and professional liability insurance setup.',
          timing: 'J+7'
        },
        {
          stepTitle: lang === 'fr' ? 'Étape 2 : Acquisition matériel homologué' : 'Step 2: Procure Certified Equipment',
          detail:
            lang === 'fr'
              ? 'Achat du kit pro essentiel et des consommables aux normes CE sans endettement.'
              : 'Procure essential compliant starter gear and consumables with available capital.',
          timing: 'Mois 1'
        },
        {
          stepTitle: lang === 'fr' ? 'Étape 3 : Lancement & 10 premières clientes' : 'Step 3: Launch & Initial Customers',
          detail:
            lang === 'fr'
              ? 'Validation de l’offre, premières réservations payantes et réinvestissement des bénéfices.'
              : 'First paying client bookings and reinvestment of early revenues.',
          timing: 'Mois 2-3'
        }
      ]
    : [
        {
          stepTitle: lang === 'fr' ? 'Mois 1 : Déclenchement du plan d’épargne' : 'Month 1: Savings Plan Start',
          detail:
            lang === 'fr'
              ? `Automatiser un virement de ${targetSavingsMonthly} €/mois sur un livret dédié dès la paie.`
              : `Automate a ${formatCurrency(targetSavingsMonthly, currency)} transfer to dedicated savings on payday.`,
          timing: 'J+7'
        },
        {
          stepTitle: lang === 'fr' ? 'Mois 4 : Mi-parcours & Réservation anticipée' : 'Month 4: Mid-point & Bookings',
          detail:
            lang === 'fr'
              ? 'Capacité de bloquer les dépenses prioritaires au meilleur tarif hors saison.'
              : 'Lock in priority bookings at early-bird discount rates.',
          timing: `Mois 4 (${formatCurrency(targetSavingsMonthly * 4, currency)})`
        },
        {
          stepTitle: lang === 'fr' ? `Mois ${monthsHorizon} : Budget 100% réuni` : `Month ${monthsHorizon}: Goal Reached`,
          detail:
            lang === 'fr'
              ? `Le montant de ${formatCurrency(budgetNeeded, currency)} est entièrement sécurisé sans découvert ni crédit conso.`
              : `Full target of ${formatCurrency(budgetNeeded, currency)} secured with zero high-interest consumer debt.`,
          timing: `Mois ${monthsHorizon}`
        }
      ];

  return {
    depthType,
    depthLabel: depthLabels[depthType],
    badgeStyle,
    headlineVerdict,
    humanExplanation,
    keyFigure,
    primaryAction,
    secondaryAction,
    entrepreneurCards,
    simpleMilestones,
    compressibleLevers: levers
  };
}
