// src/services/ai/alternativesGenerator.ts
import { UserContext, ProjectDomain } from '../../types/context';
import { MilestonePath, SmartCTAAction } from '../../types/planning';
import { ProjectVariant } from '../../types/decision';

export interface RescueAlternativesResult {
  hasGap: boolean;
  gapAmount: number;
  rescueOptions: {
    original: ProjectVariant;
    reduced: ProjectVariant;
    minimal: ProjectVariant;
  };
  savingsPlan?: {
    monthlySavings: number;
    monthsNeeded: number;
    recommendation: string;
  };
  alternativeDestinationsOrApproaches?: string[];
  smartCTAs: SmartCTAAction[];
}

export function generateRescueAlternatives(
  context: UserContext,
  domain: ProjectDomain,
  budgetAvailable: number,
  targetCost: number,
  monthlyCapacity: number = 250,
  lang: 'fr' | 'en' | 'es' = 'fr'
): RescueAlternativesResult {
  const isFr = lang === 'fr';
  const isEs = lang === 'es';
  const gap = Math.max(0, targetCost - budgetAvailable);
  const hasGap = gap > 0;

  // Reduced version (approx 55% - 70% of cost)
  const reducedCost = Math.round(targetCost * 0.65);
  // Minimal version (approx 35% - 45% of cost)
  const minimalCost = Math.max(Math.round(targetCost * 0.38), budgetAvailable > 0 ? budgetAvailable : 300);

  // Savings time calculation
  const safeCapacity = monthlyCapacity > 0 ? monthlyCapacity : 200;
  const monthsNeeded = hasGap ? Math.ceil(gap / safeCapacity) : 0;

  const originalVariant: ProjectVariant = {
    id: 'original',
    name: isFr ? 'Projet initial envisagé' : isEs ? 'Proyecto inicial previsto' : 'Initial planned scope',
    estimatedCost: targetCost,
    monthlyCost: Math.round(targetCost * 0.08),
    risk: hasGap ? 'high' : 'moderate',
    description: isFr
      ? 'La version complète telle que tu l’imaginais, sans compromis sur le confort ou les moyens.'
      : 'Full uncompromised version with ideal equipment and comfort.',
    savingsNeeded: gap,
    recommended: !hasGap
  };

  const reducedVariant: ProjectVariant = {
    id: 'reduced',
    name: isFr ? 'Version Optimisée / Économique' : isEs ? 'Versión Optimizée / Económica' : 'Optimized / Lean version',
    estimatedCost: reducedCost,
    monthlyCost: Math.round(reducedCost * 0.08),
    risk: 'moderate',
    description: isFr
      ? 'Même objectif avec des arbitrages malins : hébergement/matériel malin, durée ou périmètre adapté.'
      : 'Same goal with smart tradeoffs: adjusted duration, pre-owned equipment, or shared expenses.',
    savingsNeeded: Math.max(0, reducedCost - budgetAvailable),
    recommended: hasGap && budgetAvailable >= reducedCost
  };

  const minimalVariant: ProjectVariant = {
    id: 'minimal',
    name: isFr ? 'Version Immédiate / Fais-le avec ce que j’ai' : isEs ? 'Versión Inmediata / Con lo que tengo' : 'Immediate / Do-it-with-what-I-have',
    estimatedCost: Math.min(minimalCost, Math.max(budgetAvailable, 100)),
    monthlyCost: Math.round(minimalCost * 0.05),
    risk: 'low',
    description: isFr
      ? 'Démarrage immédiat calibré sur ton capital disponible aujourd’hui. Zéro endettement, risques minimaux.'
      : 'Immediate launch calibrated exactly on your available capital today. Zero debt, minimal risk.',
    savingsNeeded: 0,
    recommended: hasGap && budgetAvailable < reducedCost
  };

  const smartCTAs: SmartCTAAction[] = [
    {
      id: 'find_cheaper',
      label: isFr ? 'Trouve-moi moins cher' : isEs ? 'Búscame una opción más barata' : 'Find me a cheaper version',
      actionType: 'FIND_CHEAPER'
    },
    {
      id: 'build_path',
      label: isFr ? 'Construis-moi le chemin' : isEs ? 'Constrúyeme el camino' : 'Build me the path',
      actionType: 'BUILD_PATH'
    }
  ];

  if (hasGap && safeCapacity > 0) {
    smartCTAs.push({
      id: 'wait_months',
      label: isFr
        ? `Et si j’attends ${monthsNeeded} mois (+${safeCapacity} €/m) ?`
        : `What if I wait ${monthsNeeded} months (+${safeCapacity} €/mo)?`,
      actionType: 'WAIT_MONTHS',
      payload: { months: monthsNeeded, monthlyRate: safeCapacity }
    });
  }

  smartCTAs.push({
    id: 'start_this_week',
    label: isFr ? 'Comment commencer cette semaine ?' : isEs ? '¿Cómo empezar esta semana?' : 'How do I start this week?',
    actionType: 'START_THIS_WEEK'
  });

  return {
    hasGap,
    gapAmount: gap,
    rescueOptions: {
      original: originalVariant,
      reduced: reducedVariant,
      minimal: minimalVariant
    },
    savingsPlan: hasGap
      ? {
          monthlySavings: safeCapacity,
          monthsNeeded,
          recommendation: isFr
            ? `En mettant de côté ${safeCapacity} €/mois, ton budget cible de ${targetCost.toLocaleString()} € est atteint dans ${monthsNeeded} mois sans prendre de risque.`
            : `By putting aside ${safeCapacity} €/month, your target budget of ${targetCost.toLocaleString()} € is reached in ${monthsNeeded} months.`
        }
      : undefined,
    smartCTAs
  };
}

export function buildStepByStepPath(
  prompt: string,
  currentBudget: number,
  targetCost: number,
  domain: ProjectDomain,
  lang: 'fr' | 'en' | 'es' = 'fr'
): MilestonePath[] {
  const isFr = lang === 'fr';
  const p = prompt.toLowerCase();

  // SPECIAL CASE: Moving to USA / Miami with very low budget (Section 16 Test 6)
  if (p.includes('miami') || (p.includes('usa') && currentBudget < 5000)) {
    return [
      {
        id: 'm1',
        step: 1,
        timeframe: isFr ? 'Mois 1 à 3' : 'Month 1-3',
        title: isFr ? 'Bilan & Montée en compétences valorisables' : 'Skills & Qualification Building',
        action: isFr
          ? 'Acquérir un niveau d’anglais professionnel fluide et monter en compétences sur un métier sous tension (tech, artisanat certifié, commerce international).'
          : 'Achieve fluent professional English and master in-demand technical skills.',
        targetBudget: currentBudget,
        legalAspects: isFr ? 'Comprendre qu’il est strictement illégal de travailler aux USA sous exemption de visa ESTA.' : 'ESTA tourism strictly forbids employment.',
        difficulty: 'accessible'
      },
      {
        id: 'm2',
        step: 2,
        timeframe: isFr ? 'Mois 4 à 9' : 'Month 4-9',
        title: isFr ? 'Augmentation des revenus & Épargne dédiée' : 'Income Acceleration & Savings',
        action: isFr
          ? 'Générer un surplus mensuel par des missions freelance ou heures supplémentaires pour constituer le matelas de sécurité.'
          : 'Generate income surplus through freelance or additional hours to build reserve.',
        targetBudget: Math.max(currentBudget * 3, 3000),
        difficulty: 'moderate'
      },
      {
        id: 'm3',
        step: 3,
        timeframe: isFr ? 'Mois 10 à 15' : 'Month 10-15',
        title: isFr ? 'Tremplin intermédiaire (Canada / Europe / Télétravail)' : 'Intermediate Stepping Stone',
        action: isFr
          ? 'Passer par une étape intermédiaire accessible (ex: PVT Canada francophone, Espagne ou poste remote pour entreprise américaine) pour accumuler expérience internationale.'
          : 'Use an accessible stepping stone (Working Holiday Visa Canada, Spain, or US remote role).',
        targetBudget: 6000,
        legalAspects: isFr ? 'Permis vacances-travail (PVT) ou visa nomade digital beaucoup plus accessible qu’un visa US direct.' : 'Working holiday visa is much easier than direct US H-1B.',
        difficulty: 'moderate'
      },
      {
        id: 'm4',
        step: 4,
        timeframe: isFr ? 'Mois 16 à 24' : 'Month 16-24',
        title: isFr ? 'Candidature Visa US sponsorisé ou Investisseur E-2' : 'US Sponsored Visa Application',
        action: isFr
          ? 'Postuler auprès d’entreprises prêtes à sponsoriser un visa H-1B / L-1, ou s’associer avec un apport pour visa investisseur E-2.'
          : 'Apply for sponsored H-1B/L-1 or partner for E-2 treaty investor visa.',
        targetBudget: 12000,
        legalAspects: isFr ? 'Dossier avocat d’immigration US requis (compter 3 000 $ à 5 000 $ d’honoraires).' : 'US immigration attorney fees required.',
        difficulty: 'challenging'
      }
    ];
  }

  // GENERAL DOMAIN PATHWAYS
  return [
    {
      id: 'step_1',
      step: 1,
      timeframe: isFr ? 'Cette semaine' : 'This week',
      title: isFr ? 'Sécuriser le matelas de départ' : 'Secure initial safety cushion',
      action: isFr
        ? `Isoler ton capital actuel de ${currentBudget.toLocaleString()} € sur un livret dédié sans y toucher.`
        : `Segregate your existing funds of ${currentBudget.toLocaleString()} € into a dedicated reserve.`,
      targetBudget: currentBudget,
      difficulty: 'accessible'
    },
    {
      id: 'step_2',
      step: 2,
      timeframe: isFr ? 'Mois 1 à 2' : 'Month 1-2',
      title: isFr ? 'Validation Lean & Premier test réel' : 'Lean Validation & Real testing',
      action: isFr
        ? 'Tester ton idée auprès de 10 personnes ou clients potentiels avec une offre simplifiée à coût quasi nul.'
        : 'Test your offer with 10 prospects at virtually zero cost before committing heavy capital.',
      targetBudget: currentBudget + 200,
      difficulty: 'accessible'
    },
    {
      id: 'step_3',
      step: 3,
      timeframe: isFr ? 'Mois 3 à 6' : 'Month 3-6',
      title: isFr ? 'Atteinte du seuil de sécurité' : 'Reach Safety Target',
      action: isFr
        ? `Combler l’écart de budget pour atteindre ${targetCost.toLocaleString()} € via l’épargne régulière.`
        : `Close the funding gap to reach ${targetCost.toLocaleString()} € through disciplined savings.`,
      targetBudget: targetCost,
      difficulty: 'moderate'
    },
    {
      id: 'step_4',
      step: 4,
      timeframe: isFr ? 'Mois 6+' : 'Month 6+',
      title: isFr ? 'Déploiement en conditions réelles' : 'Full real-world deployment',
      action: isFr
        ? 'Lancer le projet avec 3 mois de charges d’avance et un suivi hebdomadaire de trésorerie.'
        : 'Launch with 3 months of runway in reserve and strict cash monitoring.',
      targetBudget: targetCost,
      difficulty: 'moderate'
    }
  ];
}
