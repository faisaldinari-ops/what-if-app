// src/logic/feasibilityEngine.ts
import {
  UserExtractedData,
  DecisionAnalysis,
  FeasibilityVerdict,
  FeasibilityState,
  ActionPlanStep,
  ProjectVariant,
  ScenarioResult
} from '../types/decision';
import { matchArchetype } from '../services/ai/ruleBasedParser';
import { runSimulation, findBreakingPoint, SimData } from './engine';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../i18n';

/**
 * Computes deterministic feasibility analysis using exact mathematical inputs
 * combined with benchmark estimations where parameters are unspecified.
 */
export function calculateFeasibility(
  userInput: UserExtractedData,
  lang: SupportedLang = 'fr',
  currency: SupportedCurrency = 'EUR'
): DecisionAnalysis {
  const archetype = matchArchetype(userInput.prompt);

  // 1. Resolve effective financial values with fallbacks to realistic benchmarks
  const hasUserBudget = userInput.budget !== undefined && userInput.budget !== null;
  const budgetAvailable = Math.max(0, hasUserBudget ? userInput.budget! : 0);

  const hasUserStartupCost = userInput.projectStartupCost !== undefined && userInput.projectStartupCost !== null;
  const startupCost = Math.max(
    0,
    hasUserStartupCost ? userInput.projectStartupCost! : archetype.estimatedStartupCost
  );

  const hasUserIncome = userInput.monthlyIncome !== undefined && userInput.monthlyIncome !== null;
  const hasUserExpenses = userInput.monthlyExpenses !== undefined && userInput.monthlyExpenses !== null;

  const baselineIncome = hasUserIncome ? Math.max(0, userInput.monthlyIncome!) : 0;
  const baselineExpenses = hasUserExpenses ? Math.max(0, userInput.monthlyExpenses!) : 0;

  const projectMonthlyCost = Math.max(
    0,
    userInput.projectMonthlyRunningCost !== undefined ? userInput.projectMonthlyRunningCost : 0
  );
  const expectedRevenue = Math.max(
    0,
    userInput.projectExpectedRevenue !== undefined ? userInput.projectExpectedRevenue : archetype.estimatedRevenue
  );
  const rampUpMonths = Math.max(
    1,
    userInput.monthsBeforeRevenue !== undefined ? userInput.monthsBeforeRevenue : archetype.rampUpMonths
  );

  // 2. Core calculations
  // Safety reserve: only calculate from recurring expenses if user actually provided recurring expenses
  const safetyReserveRecommended = hasUserExpenses
    ? Math.max(archetype.minimumSafetyBuffer, Math.round(baselineExpenses * 3 + projectMonthlyCost * 2))
    : Math.round(startupCost * 0.2);

  // Strict required launch budget
  const budgetNeeded = Math.round(startupCost + (hasUserExpenses ? safetyReserveRecommended : 0));

  // Strict mathematical invariant:
  // If budgetAvailable >= startupCost, funding is secured!
  let gap = 0;
  if (budgetAvailable >= startupCost) {
    // Surplus beyond startup cost
    gap = Math.max(0, budgetAvailable - startupCost);
  } else {
    // Missing funds to launch
    gap = -(startupCost - budgetAvailable);
  }

  // Total ongoing monthly expenses when project is active
  const totalMonthlyExpenses = Math.round(baselineExpenses + projectMonthlyCost);
  // Ongoing monthly revenues
  const totalMonthlyRevenues = Math.round(
    userInput.category === 'entrepreneurship'
      ? expectedRevenue
      : baselineIncome + expectedRevenue
  );

  // Monthly margin: only calculate cash deficit if user gave expenses
  let monthlyMargin = 0;
  if (hasUserIncome && hasUserExpenses) {
    monthlyMargin = Math.round(totalMonthlyRevenues - totalMonthlyExpenses);
  } else if (hasUserExpenses && baselineExpenses > 0) {
    monthlyMargin = -Math.round(totalMonthlyExpenses);
  } else {
    monthlyMargin = 0;
  }

  // Runway calculation
  const remainingCashAfterStartup = budgetAvailable - startupCost;
  let runwayMonths: number | 'sustainable' | 'insolvent';
  if (remainingCashAfterStartup < 0) {
    runwayMonths = 'insolvent';
  } else if (!hasUserExpenses || monthlyMargin >= 0) {
    runwayMonths = 'sustainable';
  } else {
    const monthlyDeficit = Math.abs(monthlyMargin);
    runwayMonths = monthlyDeficit > 0 ? Math.round((remainingCashAfterStartup / monthlyDeficit) * 10) / 10 : 'sustainable';
  }

  // Realistic timeframe to launch safely
  let realisticMonths = 0;
  if (gap >= 0) {
    realisticMonths = Math.max(1, rampUpMonths);
  } else {
    const savingsCapacity = hasUserIncome && hasUserExpenses && baselineIncome > baselineExpenses
      ? (baselineIncome - baselineExpenses)
      : 0;
    if (savingsCapacity > 50) {
      realisticMonths = Math.min(36, Math.max(rampUpMonths, Math.ceil(Math.abs(gap) / savingsCapacity)));
    } else {
      realisticMonths = Math.max(1, rampUpMonths);
    }
  }

  // 3. Documented, deterministic Feasibility Score formula (0 to 100)
  let rawScore = 50;

  // Factor A: Capital Adequacy (ratio available / startupCost)
  const capitalRatio = startupCost > 0 ? budgetAvailable / startupCost : 1;
  if (capitalRatio >= 1.5) rawScore += 30;
  else if (capitalRatio >= 1.0) rawScore += 22;
  else if (capitalRatio >= 0.8) rawScore += 10;
  else if (capitalRatio >= 0.5) rawScore -= 10;
  else rawScore -= 25;

  // Factor B: Monthly Cashflow Cushion (only if known)
  if (hasUserIncome && hasUserExpenses) {
    if (monthlyMargin >= 500) rawScore += 12;
    else if (monthlyMargin >= 0) rawScore += 5;
    else if (monthlyMargin >= -300) rawScore -= 8;
    else rawScore -= 18;
  }

  // Factor C: Runway after startup
  if (runwayMonths === 'sustainable') rawScore += 8;
  else if (typeof runwayMonths === 'number') {
    if (runwayMonths >= 12) rawScore += 5;
    else if (runwayMonths < 6) rawScore -= 10;
  } else if (runwayMonths === 'insolvent') {
    rawScore -= 20;
  }

  // Factor D: Safety reserve coverage
  if (remainingCashAfterStartup >= safetyReserveRecommended) {
    rawScore += 5;
  }

  // Bound score mathematically between 10 and 96 (leaving room for real world uncertainty)
  const score = Math.max(10, Math.min(96, Math.round(rawScore)));

  // Three clear Feasibility States
  const feasibilityState: FeasibilityState =
    score >= 75
      ? 'POSSIBLE_NOW'
      : (score >= 40 || budgetAvailable === 0)
      ? 'POSSIBLE_WITH_PLAN'
      : 'NOT_REALISTIC_YET';

  // 4. Verdicts: strictly 3 levels
  let verdict: FeasibilityVerdict = 'conditional';
  let verdictTitle = '';
  let verdictSummary = '';

  if (score >= 75) {
    verdict = 'feasible';
    if (lang === 'fr') {
      verdictTitle = 'FAISABLE';
      verdictSummary = `Ton capital de ${formatCurrency(budgetAvailable, currency)} couvre l’essentiel des besoins initiaux et permet de conserver une réserve de sécurité. La marge prévisionnelle positive offre une bonne résilience pour démarrer.`;
    } else if (lang === 'es') {
      verdictTitle = 'VIABLE';
      verdictSummary = `Tu capital de ${formatCurrency(budgetAvailable, currency)} cubre las necesidades iniciales y permite mantener un fondo de seguridad. El margen mensual positivo aporta solidez para empezar.`;
    } else {
      verdictTitle = 'FEASIBLE';
      verdictSummary = `Your capital of ${formatCurrency(budgetAvailable, currency)} covers initial startup requirements while preserving a safety cushion. The positive projected margin provides solid execution resilience.`;
    }
  } else if (score >= 45) {
    verdict = 'conditional';
    if (lang === 'fr') {
      verdictTitle = 'FAISABLE SOUS CONDITIONS';
      verdictSummary = `Avec ${formatCurrency(budgetAvailable, currency)}, le projet dans sa forme complète est trop serré et consommerait toute ton épargne. En revanche, une version allégée ou un échelonnement de l’investissement le rend tout à fait réalisable.`;
    } else if (lang === 'es') {
      verdictTitle = 'VIABLE BAJO CONDICIONES';
      verdictSummary = `Con ${formatCurrency(budgetAvailable, currency)}, el proyecto completo resultaría demasiado ajustado y consumiría todos tus ahorros. Sin embargo, una versión más ligera o escalonada lo hace perfectamente viable.`;
    } else {
      verdictTitle = 'CONDITIONALLY FEASIBLE';
      verdictSummary = `With ${formatCurrency(budgetAvailable, currency)}, the full-scale project would strain your liquidity and exhaust your buffer. However, a lean launch or phased investment makes it entirely practical.`;
    }
  } else {
    verdict = 'too_risky';
    if (lang === 'fr') {
      verdictTitle = 'TROP RISQUÉ ACTUELLEMENT';
      verdictSummary = `En l’état, l’écart de budget (${formatCurrency(Math.abs(gap), currency)}) ou le déficit mensuel exposerait tes finances personnelles à une rupture rapide. Il est impératif de consolider ton capital ou de commencer par un modèle à coût quasi-nul.`;
    } else if (lang === 'es') {
      verdictTitle = 'DEMASIADO RIESGOSO ACTUALMENTE';
      verdictSummary = `En las condiciones actuales, el desfase de capital (${formatCurrency(Math.abs(gap), currency)}) o el flujo mensual pondría en peligro tu estabilidad. Conviene consolidar ahorros o arrancar con un modelo de coste mínimo.`;
    } else {
      verdictTitle = 'CURRENTLY TOO RISKY';
      verdictSummary = `As structured, the funding shortfall (${formatCurrency(Math.abs(gap), currency)}) or monthly burn rate creates high vulnerability. You should either build up cash reserves or launch via a zero-overhead model first.`;
    }
  }

  // 5. Main Problem Identification (Single priority focus)
  let mainProblem: {
    title: string;
    description: string;
    priorityLevel: 'critical' | 'warning' | 'info';
  };

  if (gap >= 0) {
    mainProblem = {
      title: lang === 'fr' ? 'Sécurisation des premiers clients' : lang === 'es' ? 'Validación comercial' : 'Early Customer Acquisition',
      description:
        lang === 'fr'
          ? `Ton capital de départ (${formatCurrency(budgetAvailable, currency)}) finance entièrement le démarrage (${formatCurrency(startupCost, currency)}) avec une réserve disponible de ${formatCurrency(gap, currency)}. L’enjeu prioritaire est de valider ton offre et d'acquérir tes 10 premiers clients.`
          : lang === 'es'
          ? `Tu capital inicial (${formatCurrency(budgetAvailable, currency)}) cubre completamente el arranque con una reserva de ${formatCurrency(gap, currency)}. La prioridad es captar los primeros clientes.`
          : `Your initial capital (${formatCurrency(budgetAvailable, currency)}) fully covers startup requirements with a protective cushion of ${formatCurrency(gap, currency)}. The primary focus is early client traction.`,
      priorityLevel: 'info'
    };
  } else {
    mainProblem = {
      title: lang === 'fr' ? 'Écart de trésorerie de départ' : lang === 'es' ? 'Desfase de liquidez inicial' : 'Initial Cash Shortfall',
      description:
        lang === 'fr'
          ? `Il te manque environ ${formatCurrency(Math.abs(gap), currency)} pour financer l’installation recommandée (${formatCurrency(startupCost, currency)}).`
          : lang === 'es'
          ? `Faltan aproximadamente ${formatCurrency(Math.abs(gap), currency)} para cubrir la inversión de arranque (${formatCurrency(startupCost, currency)}).`
          : `You need an additional ${formatCurrency(Math.abs(gap), currency)} to cover initial startup outlays (${formatCurrency(startupCost, currency)}).`,
      priorityLevel: 'critical'
    };
  }

  if (gap >= 0 && hasUserExpenses && monthlyMargin < 0) {
    mainProblem = {
      title: lang === 'fr' ? 'Déficit mensuel récurrent' : lang === 'es' ? 'Déficit operativo mensual' : 'Negative Monthly Cashflow',
      description:
        lang === 'fr'
          ? `Ton capital de départ suffit, mais les charges mensuelles (${formatCurrency(totalMonthlyExpenses, currency)}/mois) dépassent les rentrées estimées, créant une érosion progressive.`
          : lang === 'es'
          ? `El capital inicial es adecuado, pero los gastos mensuales (${formatCurrency(totalMonthlyExpenses, currency)}/mes) superan los ingresos previstos, erosionando tu saldo.`
          : `Initial capital is sufficient, but monthly running costs (${formatCurrency(totalMonthlyExpenses, currency)}/mo) exceed projected revenues, gradually burning cash.`,
      priorityLevel: 'warning'
    };
  }

  // 6. Action Plan: "Comment je le fais ?" (Concrete 5 steps tailored to the bottleneck)
  const actionPlan: ActionPlanStep[] = [
    {
      step: 1,
      title:
        lang === 'fr'
          ? `Sécuriser la réserve de ${formatCurrency(safetyReserveRecommended, currency)}`
          : lang === 'es'
          ? `Asegurar el fondo de reserva de ${formatCurrency(safetyReserveRecommended, currency)}`
          : `Lock in a ${formatCurrency(safetyReserveRecommended, currency)} Safety Reserve`,
      subtitle:
        lang === 'fr' ? 'Garder au moins 3 mois de charges incompressibles intouchables.' : lang === 'es' ? 'Mantener 3 meses de gastos esenciales intocables.' : 'Protect 3 months of essential overhead.',
      description:
        lang === 'fr'
          ? 'Ne jamais investir 100% de tes économies dans les frais d’installation. Cette réserve absorbe les retards de facturation ou les mois creux.'
          : lang === 'es'
          ? 'Nunca comprometas el 100% de tus ahorros en gastos de arranque. Esta reserva absorbe imprevistos o meses lentos.'
          : 'Never inject 100% of your savings into setup costs. This reserve cushions unexpected delays or slow ramp-ups.',
      impact: `${formatCurrency(safetyReserveRecommended, currency)} conservés`,
      priority: 'high'
    },
    {
      step: 2,
      title:
        lang === 'fr'
          ? 'Commencer avec une formule allégée'
          : lang === 'es'
          ? 'Arrancar con un formato escalonado'
          : 'Start with a Lean Setup',
      subtitle: archetype.reducedVariantDescription,
      description:
        lang === 'fr'
          ? `En réduisant le périmètre initial, tu divises le besoin de démarrage par deux (${formatCurrency(Math.round(startupCost * archetype.reducedCostRatio), currency)} au lieu de ${formatCurrency(startupCost, currency)}).`
          : lang === 'es'
          ? `Al ajustar la escala inicial reduces la inversión a la mitad (${formatCurrency(Math.round(startupCost * archetype.reducedCostRatio), currency)} en lugar de ${formatCurrency(startupCost, currency)}).`
          : `By trimming initial scope, you cut launch outlay in half (${formatCurrency(Math.round(startupCost * archetype.reducedCostRatio), currency)} vs ${formatCurrency(startupCost, currency)}).`,
      impact: `Économie : ~${formatCurrency(Math.round(startupCost * (1 - archetype.reducedCostRatio)), currency)}`,
      priority: 'high'
    },
    {
      step: 3,
      title:
        lang === 'fr'
          ? 'Valider la demande avant gros engagement'
          : lang === 'es'
          ? 'Validar la demanda real antes de comprometerse'
          : 'Validate Demand Before Major Commitments',
      subtitle:
        lang === 'fr' ? 'Tester avec 10 à 20 premiers clients réels.' : lang === 'es' ? 'Probar con los 10 a 20 primeros clientes reales.' : 'Test with 10 to 20 actual paying users.',
      description:
        lang === 'fr'
          ? 'Obtiens des précommandes, des acomptes ou des lettres d’intention avant de signer un bail commercial ou d’acheter du matériel lourd.'
          : lang === 'es'
          ? 'Consigue reservas previas, anticipos o cartas de intención antes de firmar alquileres o comprar maquinaria pesada.'
          : 'Secure advance deposits or letters of intent before signing leases or purchasing heavy equipment.',
      impact: 'Risque financier divisé par 3',
      priority: 'medium'
    },
    {
      step: 4,
      title:
        lang === 'fr'
          ? 'Actionner les leviers de financement non bancaires'
          : lang === 'es'
          ? 'Activar alternativas de financiación accesibles'
          : 'Deploy Non-Bank Financing Levers',
      subtitle:
        lang === 'fr'
          ? 'Micro-crédit, prêts d’honneur, aides régionales ou financement matériel.'
          : lang === 'es'
          ? 'Microcréditos, ayudas locales o leasing de equipamiento.'
          : 'Micro-loans, regional entrepreneurship grants, or equipment leasing.',
      description:
        lang === 'fr'
          ? gap < 0
            ? `Financer les ${formatCurrency(Math.abs(gap), currency)} manquants via leasing ou étalement fournisseur plutôt qu’un crédit bancaire lourd.`
            : 'Échelonner les achats d’équipement pour conserver un maximum de cash en banque.'
          : lang === 'es'
          ? 'Financiar la maquinaria mediante leasing o pago aplazado a proveedores.'
          : 'Finance equipment via leasing or vendor installment plans to preserve cash liquidity.',
      impact: `+${formatCurrency(Math.abs(gap) > 0 ? Math.abs(gap) : 3000, currency)} de marge de manœuvre`,
      priority: 'medium'
    },
    {
      step: 5,
      title:
        lang === 'fr'
          ? 'Lancement et point d’étape à 90 jours'
          : lang === 'es'
          ? 'Lanzamiento y revisión a los 90 días'
          : 'Launch & 90-Day Checkpoint',
      subtitle:
        lang === 'fr' ? 'Objectif d’équilibre mensuel sous 3 mois.' : lang === 'es' ? 'Meta de punto de equilibrio en 3 meses.' : 'Target monthly breakeven within 90 days.',
      description:
        lang === 'fr'
          ? `Si le revenu mensuel n’atteint pas au moins ${formatCurrency(Math.round(totalMonthlyExpenses * 0.8), currency)} à M+3, réajuster immédiatement les tarifs ou suspendre les charges variables.`
          : lang === 'es'
          ? `Si los ingresos no alcanzan ${formatCurrency(Math.round(totalMonthlyExpenses * 0.8), currency)} al mes 3, reajustar precios o recortar gastos variables inmediatamente.`
          : `If monthly revenue does not reach ${formatCurrency(Math.round(totalMonthlyExpenses * 0.8), currency)} by Month 3, adjust pricing immediately or freeze discretionary expenses.`,
      impact: 'Protection absolue contre la banqueroute',
      priority: 'low'
    }
  ];

  // 7. Mode "Trouve-moi une solution" (3 Variants: Original, Reduced, Minimal)
  const variants: {
    original: ProjectVariant;
    reduced: ProjectVariant;
    minimal: ProjectVariant;
  } = {
    original: {
      id: 'original',
      name: lang === 'fr' ? 'Projet initial complet' : lang === 'es' ? 'Proyecto inicial completo' : 'Full Initial Project',
      estimatedCost: startupCost,
      monthlyCost: projectMonthlyCost,
      risk: gap < 0 ? 'high' : 'moderate',
      description:
        lang === 'fr'
          ? 'Investissement standard avec local ou matériel neuf, conforme à ta vision initiale.'
          : lang === 'es'
          ? 'Inversión completa con instalaciones y equipamiento nuevo, fiel a tu idea original.'
          : 'Full capital deployment with dedicated premises or new equipment matching your initial plan.',
      savingsNeeded: startupCost + safetyReserveRecommended,
      recommended: score >= 75
    },
    reduced: {
      id: 'reduced',
      name: lang === 'fr' ? 'Version allégée (Recommandé)' : lang === 'es' ? 'Versión optimizada (Recomendada)' : 'Lean Setup (Recommended)',
      estimatedCost: Math.round(startupCost * archetype.reducedCostRatio),
      monthlyCost: Math.round(projectMonthlyCost * 0.7),
      risk: 'moderate',
      description: archetype.reducedVariantDescription,
      savingsNeeded: Math.round(startupCost * archetype.reducedCostRatio + safetyReserveRecommended * 0.8),
      recommended: score >= 45 && score < 75
    },
    minimal: {
      id: 'minimal',
      name: lang === 'fr' ? 'Version test minimale (MVP)' : lang === 'es' ? 'Versión mínima viable (MVP)' : 'Minimal Pilot (MVP)',
      estimatedCost: Math.round(startupCost * archetype.minimalCostRatio),
      monthlyCost: Math.round(projectMonthlyCost * 0.35),
      risk: 'low',
      description: archetype.minimalVariantDescription,
      savingsNeeded: Math.round(startupCost * archetype.minimalCostRatio + safetyReserveRecommended * 0.5),
      recommended: score < 45
    }
  };

  // 8. 3 Scenarios (Prudent, Réaliste, Favorable) leveraging the deterministic simulation engine
  const simDataObj: Partial<SimData> = {
    category: userInput.category,
    savings: budgetAvailable,
    income: totalMonthlyRevenues,
    expenses: totalMonthlyExpenses,
    oneOff: startupCost,
    growth: 4
  };

  const conservativePoints = runSimulation(simDataObj, 'conservative');
  const expectedPoints = runSimulation(simDataObj, 'expected');
  const optimisticPoints = runSimulation(simDataObj, 'optimistic');

  const getCheckpointCash = (pts: typeof expectedPoints, m: number) => {
    const pt = pts.find(p => p.m === m);
    return pt ? pt.cash : 0;
  };

  const scenarios: DecisionAnalysis['scenarios'] = {
    prudent: {
      label: lang === 'fr' ? 'Prudent' : lang === 'es' ? 'Prudente' : 'Conservative',
      tagline:
        lang === 'fr'
          ? 'Si l’activité démarre moins vite que prévu (-20% de revenus, +15% de charges).'
          : lang === 'es'
          ? 'Si el despegue es más lento de lo previsto (-20% ingresos, +15% costes).'
          : 'If ramp-up is slower than expected (20% lower revenue, 15% cost inflation).',
      cashM12: getCheckpointCash(conservativePoints, 12),
      cashM36: getCheckpointCash(conservativePoints, 36),
      cashM60: getCheckpointCash(conservativePoints, 60),
      monthlyNet: Math.round(conservativePoints[conservativePoints.length - 1]?.net || 0),
      runwayMonths:
        conservativePoints[3]?.cash < 0
          ? 'insolvent'
          : Math.max(1, Math.round((Math.max(0, conservativePoints[3]?.cash || 0) / (totalMonthlyExpenses * 1.15)) * 10) / 10),
      risks: archetype.typicalRisks
    },
    realistic: {
      label: lang === 'fr' ? 'Réaliste' : lang === 'es' ? 'Realista' : 'Realistic',
      tagline:
        lang === 'fr'
          ? 'Le scénario central fondé sur les estimations équilibrées de ton secteur.'
          : lang === 'es'
          ? 'El escenario central basado en los promedios contrastados de tu sector.'
          : 'The central baseline based on realistic market sector benchmarks.',
      cashM12: getCheckpointCash(expectedPoints, 12),
      cashM36: getCheckpointCash(expectedPoints, 36),
      cashM60: getCheckpointCash(expectedPoints, 60),
      monthlyNet: Math.round(expectedPoints[expectedPoints.length - 1]?.net || monthlyMargin),
      runwayMonths: runwayMonths,
      risks: [archetype.typicalRisks[0] || 'Délai d’acquisition client', 'Plafond de charges fixes']
    },
    favorable: {
      label: lang === 'fr' ? 'Favorable' : lang === 'es' ? 'Favorable' : 'Favorable',
      tagline:
        lang === 'fr'
          ? 'Si l’adoption est rapide (+30% de croissance, charges optimisées).'
          : lang === 'es'
          ? 'Si la adopción es acelerada (+30% crecimiento y costes ajustados).'
          : 'If adoption is strong (30% faster revenue growth, tight expense control).',
      cashM12: getCheckpointCash(optimisticPoints, 12),
      cashM36: getCheckpointCash(optimisticPoints, 36),
      cashM60: getCheckpointCash(optimisticPoints, 60),
      monthlyNet: Math.round(optimisticPoints[optimisticPoints.length - 1]?.net || monthlyMargin * 1.3),
      runwayMonths: 'sustainable',
      risks: ['Capacité à suivre la demande', 'Recrutement / sous-traitance à anticiper']
    }
  };

  // 9. Stress Testing Results
  const stressDropSim = runSimulation(simDataObj, 'expected', {
    overrideIncome: Math.round(totalMonthlyRevenues * 0.8)
  });
  const stressDropM12 = stressDropSim.find(p => p.m === 12)?.cash || 0;
  const incomeDropMonths =
    stressDropM12 > 0 ? ('sustainable' as const) : Math.max(1, Math.round((budgetAvailable / (totalMonthlyExpenses * 0.5)) * 10) / 10);

  const stressExpSim = runSimulation(simDataObj, 'expected', {
    overrideExpenses: Math.round(totalMonthlyExpenses * 1.2)
  });
  const stressExpM12 = stressExpSim.find(p => p.m === 12)?.cash || 0;
  const expUpMonths =
    stressExpM12 > 0 ? ('sustainable' as const) : Math.max(1, Math.round((budgetAvailable / (totalMonthlyExpenses * 1.2)) * 10) / 10);

  const delaySim = runSimulation(simDataObj, 'expected', { incomeDelayMonths: 3 });
  const delay3CashImpact = Math.round((expectedPoints.find(p => p.m === 12)?.cash || 0) - (delaySim.find(p => p.m === 12)?.cash || 0));

  const stressSummary =
    lang === 'fr'
      ? incomeDropMonths === 'sustainable'
        ? `Même avec 20% de revenus en moins, la structure financière reste pérenne à 12 mois.`
        : `Avec 20% de revenus en moins, la trésorerie s’épuise au bout de ${incomeDropMonths} mois.`
      : lang === 'es'
      ? incomeDropMonths === 'sustainable'
        ? `Incluso con un 20% menos de ingresos, el proyecto mantiene viabilidad a 12 meses.`
        : `Con un 20% menos de ingresos, la liquidez se consume en unos ${incomeDropMonths} meses.`
      : incomeDropMonths === 'sustainable'
      ? `Even with a 20% revenue drop, your finances remain viable past Month 12.`
      : `With a 20% drop in revenue, cash reserves deplete after ~${incomeDropMonths} months.`;

  // 10. Breaking Point
  const bp = findBreakingPoint(simDataObj);
  const bpSummary =
    lang === 'fr'
      ? bp.status === 'insolvent'
        ? 'Déficit immédiat au lancement : la trésorerie est dans le rouge dès le premier mois.'
        : `Ton projet devient fragile si tes charges totales dépassent ${formatCurrency(bp.maxSustainableExpenses, currency)}/mois (marge de sécurité actuelle : ${formatCurrency(bp.safetyMargin, currency)}/mois).`
      : lang === 'es'
      ? bp.status === 'insolvent'
        ? 'Déficit inmediato: saldo negativo desde el primer mes de arranque.'
        : `El proyecto se vuelve frágil si tus gastos superan ${formatCurrency(bp.maxSustainableExpenses, currency)}/mes (margen de seguridad: ${formatCurrency(bp.safetyMargin, currency)}/mes).`
      : bp.status === 'insolvent'
      ? 'Immediate deficit: cash drops below zero within month 1.'
      : `Your structure becomes fragile if monthly overhead exceeds ${formatCurrency(bp.maxSustainableExpenses, currency)}/mo (current safety buffer: ${formatCurrency(bp.safetyMargin, currency)}/mo).`;

  // 11. Data Transparency Separation
  const dataTransparency = {
    userData: [
      {
        label: lang === 'fr' ? 'Budget / Épargne déclarée' : lang === 'es' ? 'Ahorros declarados' : 'Declared Capital',
        value: userInput.budget !== undefined ? formatCurrency(userInput.budget, currency) : lang === 'fr' ? 'Non spécifié' : 'Unspecified'
      },
      {
        label: lang === 'fr' ? 'Revenu mensuel déclaré' : lang === 'es' ? 'Ingresos mensuales declarados' : 'Declared Monthly Income',
        value: userInput.monthlyIncome !== undefined ? formatCurrency(userInput.monthlyIncome, currency) : lang === 'fr' ? 'Non spécifié' : 'Unspecified'
      },
      {
        label: lang === 'fr' ? 'Dépenses personnelles' : lang === 'es' ? 'Gastos mensuales declarados' : 'Declared Living Expenses',
        value: userInput.monthlyExpenses !== undefined ? formatCurrency(userInput.monthlyExpenses, currency) : lang === 'fr' ? 'Non spécifié' : 'Unspecified'
      },
      ...(userInput.location ? [{ label: lang === 'fr' ? 'Localisation' : 'Location', value: userInput.location }] : [])
    ],
    calculatedData: [
      {
        label: lang === 'fr' ? 'Écart de financement' : lang === 'es' ? 'Diferencia financiera' : 'Financing Gap',
        value: formatCurrency(gap, currency)
      },
      {
        label: lang === 'fr' ? 'Marge nette mensuelle projet' : lang === 'es' ? 'Margen neto mensual' : 'Net Monthly Margin',
        value: `${monthlyMargin >= 0 ? '+' : ''}${formatCurrency(monthlyMargin, currency)}/mois`
      },
      {
        label: lang === 'fr' ? 'Réserve de sécurité recommandée' : lang === 'es' ? 'Reserva de seguridad sugerida' : 'Recommended Buffer',
        value: formatCurrency(safetyReserveRecommended, currency)
      },
      {
        label: lang === 'fr' ? 'Autonomie financière (Runway)' : lang === 'es' ? 'Autonomía (Runway)' : 'Financial Runway',
        value: typeof runwayMonths === 'number' ? `${runwayMonths} mois` : runwayMonths === 'sustainable' ? (lang === 'fr' ? 'Pérenne' : 'Sustainable') : (lang === 'fr' ? 'En déficit' : 'Insolvent')
      },
      {
        label: lang === 'fr' ? 'Score de faisabilité' : lang === 'es' ? 'Puntuación de viabilidad' : 'Feasibility Score',
        value: `${score}/100`
      }
    ],
    marketEstimations: [
      {
        label: lang === 'fr' ? 'Coût moyen de démarrage estimé' : lang === 'es' ? 'Coste estimado de arranque' : 'Estimated Setup Outlay',
        value: formatCurrency(startupCost, currency),
        disclaimer: lang === 'fr' ? 'Estimation basée sur les standards du secteur' : 'Sector benchmark estimation'
      },
      {
        label: lang === 'fr' ? 'Charges mensuelles d’exploitation' : lang === 'es' ? 'Gastos operativos mensuales' : 'Operating Monthly Cost',
        value: formatCurrency(projectMonthlyCost, currency),
        disclaimer: lang === 'fr' ? 'Hors imprévus et amortissements lourds' : 'Excludes irregular capital depreciation'
      },
      {
        label: lang === 'fr' ? 'Délai d’atteinte du régime de croisière' : lang === 'es' ? 'Tiempo de despegue comercial' : 'Ramp-Up Horizon',
        value: `${rampUpMonths} mois`
      }
    ],
    assumptions: [
      {
        label: lang === 'fr' ? 'Croissance annuelle de référence' : 'Annual Growth Baseline',
        value: '+4.0% / an'
      },
      {
        label: lang === 'fr' ? 'Stabilité des charges de base' : 'Expense Inflation Ceiling',
        value: 'Inflation maîtrisée sous 3%'
      },
      {
        label: lang === 'fr' ? 'Périodicité' : 'Model Resolution',
        value: 'Projections déterministes sur 60 mois'
      }
    ]
  };

  const isBusiness = userInput.category === 'entrepreneurship';

  return {
    id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    userInput,
    isSimpleGoal: !isBusiness,
    score,
    verdict,
    feasibilityState,
    verdictTitle,
    verdictSummary,
    metrics: {
      budgetAvailable,
      budgetNeeded,
      gap,
      monthlyMargin,
      realisticMonths,
      safetyReserveRecommended,
      runwayMonths
    },
    mainProblem,
    actionPlan,
    variants,
    scenarios,
    stressTest: {
      incomeDrop20Months: incomeDropMonths,
      expensesUp20Months: expUpMonths,
      delay3MonthsCashImpact: delay3CashImpact,
      summary: stressSummary
    },
    breakingPoint: {
      maxSustainableMonthlyBurn: bp.maxSustainableExpenses,
      currentMonthlyExpenses: totalMonthlyExpenses,
      monthlySafetyCushion: bp.safetyMargin,
      summary: bpSummary
    },
    dataTransparency
  };
}
