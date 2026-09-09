// scripts/testScenarios.ts
import { parseProjectWithRules } from '../src/services/ai/ruleBasedParser';
import { calculateFeasibility } from '../src/logic/feasibilityEngine';
import { detectOpportunities } from '../src/services/ai/opportunityEngine';
import { auditDecisionAnalysisDeterministically } from '../src/services/ai/criticAgent';

interface TestScenario {
  id: string;
  name: string;
  prompt: string;
  expectedCategory?: string;
  expectedMinBudget?: number;
  expectedTargetCost?: number;
  mustNotBeImpossible?: boolean;
}

const SCENARIOS: TestScenario[] = [
  {
    id: 'A',
    name: '0 € Entreprise',
    prompt: "J'ai 0 € et je veux lancer une société.",
    mustNotBeImpossible: true
  },
  {
    id: 'B',
    name: '5000 € Électricien Artisan',
    prompt: "J'ai 5000 €, je suis électricien et je veux créer mon entreprise.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'C',
    name: 'Expatriation sans idée de destination',
    prompt: "Je veux quitter mon pays mais je n'ai pas d'idée où aller.",
    expectedCategory: 'relocation'
  },
  {
    id: 'D',
    name: 'Achat immobilier 250k€ avec 30k€ apport et 2500€ salaire',
    prompt: "Je veux acheter un appartement à 250 000 € avec 30 000 € d'apport et 2500 € de salaire.",
    expectedCategory: 'real_estate'
  },
  {
    id: 'E',
    name: 'Achat voiture 15k€ avec 2000€ économies et 1800€ salaire',
    prompt: "Je gagne 1800 €/mois, j'ai 2000 € d'économies et je veux acheter une voiture à 15 000 €.",
    expectedCategory: 'money'
  },
  {
    id: 'F',
    name: 'Ouvrir un restaurant avec 10 000 €',
    prompt: "J'ai 10 000 € et je veux ouvrir un restaurant.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'G',
    name: 'Tour du monde 1 an avec 12 000 €',
    prompt: "Je veux faire un tour du monde pendant 1 an avec 12 000 €.",
    expectedCategory: 'personal'
  },
  {
    id: 'H',
    name: 'Apprendre à coder & devenir freelance',
    prompt: "Je veux apprendre à coder et devenir dev freelance.",
    expectedCategory: 'career'
  },
  {
    id: 'I',
    name: 'Immobilier locatif 50 000 € apport',
    prompt: "J'ai 50 000 € d'apport et je veux investir dans l'immobilier locatif.",
    expectedCategory: 'real_estate'
  },
  {
    id: 'J',
    name: 'Déménagement au Japon',
    prompt: "Je veux déménager au Japon l'année prochaine.",
    expectedCategory: 'relocation'
  },
  {
    id: 'K',
    name: 'E-commerce avec 500 €',
    prompt: "J'ai 500 € et je veux me lancer dans le e-commerce.",
    expectedCategory: 'entrepreneurship'
  },
  {
    id: 'L',
    name: 'Master aux USA',
    prompt: "Je veux faire un master aux USA.",
    expectedCategory: 'education'
  },
  {
    id: 'M',
    name: 'Quitter son CDI pour devenir consultant',
    prompt: "Je veux quitter mon CDI pour devenir consultant.",
    expectedCategory: 'career'
  },
  {
    id: 'N',
    name: '100 000 € dormant sur compte',
    prompt: "J'ai 100 000 € d'économies qui dorment sur mon compte.",
    expectedCategory: 'money'
  }
];

export function runAllScenarios() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE TEST SUITE: SCENARIOS A THROUGH N');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const sc of SCENARIOS) {
    try {
      // 1. Parse using deterministic rule parser
      const parsed = parseProjectWithRules(sc.prompt, {}, 'fr');

      // 2. Compute feasibility engine
      const analysis = calculateFeasibility(parsed.data, 'fr');

      // 3. Detect opportunities
      const opps = detectOpportunities(sc.prompt, parsed.data.category, parsed.data.budget || 0, analysis.metrics.budgetNeeded);

      // 4. Run Critic sanity audit
      const audit = auditDecisionAnalysisDeterministically(parsed.data, analysis);

      // Validation assertions
      if (sc.mustNotBeImpossible) {
        if (analysis.verdictSummary.toLowerCase().includes('impossible')) {
          throw new Error(`Scenario ${sc.id} violated rule: said "impossible" for 0 € budget.`);
        }
      }

      if (sc.id === 'B') {
        // Electrician check
        if (parsed.data.budget !== 5000) {
          throw new Error(`Scenario B expected 5000 € budget, got ${parsed.data.budget}`);
        }
        if (analysis.metrics.budgetNeeded <= 0) {
          throw new Error('Scenario B budgetNeeded should be positive');
        }
      }

      if (sc.id === 'E') {
        // Car purchase check
        if (parsed.data.projectStartupCost !== 15000 && analysis.metrics.budgetNeeded !== 15000) {
          throw new Error(`Scenario E expected 15 000 € target cost, got ${parsed.data.projectStartupCost} / ${analysis.metrics.budgetNeeded}`);
        }
      }

      // Check no NaNs
      if (
        isNaN(analysis.metrics.budgetAvailable) ||
        isNaN(analysis.metrics.budgetNeeded) ||
        isNaN(analysis.metrics.gap) ||
        isNaN(analysis.score)
      ) {
        throw new Error(`Scenario ${sc.id} returned NaN in metrics!`);
      }

      console.log(`✅ [Scenario ${sc.id}] ${sc.name}`);
      console.log(`   - Verdict: ${analysis.verdict} (Score: ${analysis.score}/100)`);
      console.log(`   - Available: ${analysis.metrics.budgetAvailable.toLocaleString()} € | Needed: ${analysis.metrics.budgetNeeded.toLocaleString()} € | Gap: ${analysis.metrics.gap.toLocaleString()} €`);
      console.log(`   - Opportunities detected: ${opps.opportunities.length} | Subsidies: ${opps.subsidiesAndGrants.length}`);
      console.log(`   - Critic Audit Score: ${audit.score}/100 (${audit.isPassed ? 'PASSED' : 'CAUTION'})`);
      console.log('');
      passed++;
    } catch (err: any) {
      console.error(`❌ [Scenario ${sc.id}] FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log(`🏁 TEST RESULTS: ${passed}/${SCENARIOS.length} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllScenarios();
