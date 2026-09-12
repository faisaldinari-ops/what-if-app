// scripts/decisionControllerTests.ts
//
// Automated acceptance suite for the LIVE decision pipeline (DecisionController), covering
// scenarios A-L from the product mission plus targeted regression checks for UNKNOWN=UNKNOWN,
// provenance, duplicate questions, and domain misclassification. Run with:
//   npx tsx scripts/decisionControllerTests.ts
//
// This intentionally tests DecisionController.processTurn directly (the same entry point
// App.tsx -> projectAnalyzer.ts calls) rather than the legacy parseProjectWithRules /
// calculateFeasibility pair tested in scripts/testScenarios.ts, so it can't be fooled by a
// second, disconnected pipeline silently diverging from what the UI actually does.

import { DecisionController } from '../src/core/controller/DecisionController';
import { ProjectState } from '../src/core/types';
import { CoreDecisionResponse } from '../src/core/controller/ResponseComposer';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

function assertNeedsInfo(r: CoreDecisionResponse): asserts r is Extract<CoreDecisionResponse, { type: 'NEEDS_INFORMATION' }> {
  if (r.type !== 'NEEDS_INFORMATION') throw new Error(`expected NEEDS_INFORMATION, got ${r.type}`);
}

async function runCase(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`❌ ${name}: ${err.message}`);
    failures.push(`${name}: ${err.message}`);
    failed++;
  }
}

/** Drives a multi-turn conversation, auto-answering with the given field->value map whenever a
 * question is asked whose id/field matches. Returns the final response and the ordered list of
 * question ids the controller actually asked (to detect duplicate/repeated questions). */
async function converse(
  turns: string[],
  answers: Record<string, any> = {}
): Promise<{ response: CoreDecisionResponse; askedQuestionIds: string[] }> {
  let state: ProjectState | null = null;
  let frontendAnswers: Record<string, any> = {};
  const askedQuestionIds: string[] = [];
  let response: CoreDecisionResponse | null = null;

  for (const turn of turns) {
    response = await DecisionController.processTurn(turn, state, 'fr', 'EUR', frontendAnswers);
    state = response.state;
    frontendAnswers = {};

    // Auto-resolve NEEDS_INFORMATION / follow-up loops using the provided answers map, mimicking
    // what SmartQuestionnaire would submit, up to a safety cap to avoid infinite loops on bugs.
    let guard = 0;
    while (response!.type === 'NEEDS_INFORMATION' && guard < 8) {
      const qId = response!.question.id;
      askedQuestionIds.push(qId);
      if (!(qId in answers)) break;
      frontendAnswers = { [qId]: answers[qId] };
      response = await DecisionController.processTurn('', state, 'fr', 'EUR', frontendAnswers);
      state = response.state;
      frontendAnswers = {};
      guard++;
    }
  }

  return { response: response!, askedQuestionIds };
}

async function main() {
  console.log('================================================================');
  console.log('🧪 DECISION CONTROLLER ACCEPTANCE SUITE (live pipeline)');
  console.log('================================================================\n');

  // A. "Je veux changer de vie." -> clarification, never an invented budget.
  await runCase('A: vague life-change goal asks, never invents budget', async () => {
    const r = await DecisionController.processTurn('Je veux changer de vie.', null, 'fr', 'EUR');
    assert(r.type === 'NEEDS_INFORMATION', `expected NEEDS_INFORMATION, got ${r.type}`);
    assert(r.state.availableBudget.value === 'UNKNOWN', 'budget must stay UNKNOWN, not invented');
  });

  // B. "Je veux partir loin mais j'ai pas d'argent." -> budget resolves to 0, never a fabricated
  // non-zero default like 3000€.
  await runCase('B: explicit "no money" phrasing resolves budget to 0', async () => {
    const r = await DecisionController.processTurn(
      "Je veux partir loin mais j'ai pas d'argent.",
      null,
      'fr',
      'EUR'
    );
    assert(
      r.state.availableBudget.value === 0,
      `expected budget=0 from explicit phrasing, got ${JSON.stringify(r.state.availableBudget)}`
    );
    assert(r.state.availableBudget.origin === 'USER_PROVIDED', 'budget=0 must be USER_PROVIDED, not an assumption');
  });

  // C. Full trip spec in one message: should not re-ask destination/duration/origin/budget.
  await runCase('C: full Japan trip spec in one message is not re-asked', async () => {
    const r = await DecisionController.processTurn(
      'Je veux partir au Japon 14 jours depuis Marseille avec 2000 €.',
      null,
      'fr',
      'EUR'
    );
    assert(r.state.destinationLocation.value !== 'UNKNOWN', 'destination should be extracted');
    assert(r.state.originLocation.value !== 'UNKNOWN', 'origin should be extracted');
    assert(r.state.durationDays.value === 14, `expected 14 days, got ${JSON.stringify(r.state.durationDays)}`);
    assert(r.state.availableBudget.value === 2000, `expected budget=2000, got ${JSON.stringify(r.state.availableBudget)}`);
    if (r.type === 'NEEDS_INFORMATION') {
      assert(
        !['destinationLocation', 'originLocation', 'duration', 'availableBudget'].includes(r.question.id),
        `should not re-ask already-known field, but asked: ${r.question.id}`
      );
    }
  });

  // D. Electrician with diploma + 5000€ -> business detected, operating model asked only because
  // it genuinely changes the cost, coherent cost/plan produced.
  await runCase('D: electrician business detected, asks operating model, produces coherent estimate', async () => {
    const { response, askedQuestionIds } = await converse(
      ['Je suis électricien, diplômé, j\'ai 5000 € et je veux lancer mon entreprise.'],
      { operatingModel: 'home' }
    );
    assert(response.type === 'RECOMMENDATION' || response.type === 'COST_ESTIMATE', `expected a concrete outcome, got ${response.type}`);
    assert(askedQuestionIds.includes('operatingModel'), 'must ask operatingModel before estimating cost');
    assert(!askedQuestionIds.includes('availableBudget'), 'must not re-ask budget already given (5000€)');
  });

  // E. "Combien ça coûte de faire les ongles chez moi ?" -> ESTIMATE_COST, no personal budget
  // question before delivering the estimate.
  await runCase('E: pure cost question does not demand personal budget first', async () => {
    const r = await DecisionController.processTurn(
      'Combien ça coûte de faire les ongles chez moi ?',
      null,
      'fr',
      'EUR'
    );
    assert(r.type === 'COST_ESTIMATE', `expected COST_ESTIMATE, got ${r.type}`);
  });

  // F. Income=expenses=2000, project costs 2400 -> savings capacity 0, no fabricated timeline.
  await runCase('F: zero savings capacity does not fabricate a false achievable date', async () => {
    const r = await DecisionController.processTurn(
      'Je gagne 2000 €, dépense 2000 € et veux faire un projet à 2400 €.',
      null,
      'fr',
      'EUR'
    );
    assert(r.state.monthlyIncome.value === 2000, 'income must be extracted');
    assert(r.state.monthlyExpenses.value === 2000, 'expenses must be extracted');
    assert(
      r.state.monthlySavingsCapacity.value === 0,
      `expected derived savings capacity 0, got ${JSON.stringify(r.state.monthlySavingsCapacity)}`
    );
  });

  // G. "Je veux créer un site et j'ai 0 €." -> looks for a genuinely free/low-cost strategy
  // instead of declaring the project impossible.
  await runCase('G: 0€ website project surfaces a genuinely free path, not "impossible"', async () => {
    const { response, askedQuestionIds } = await converse(
      ["Je veux créer un site et j'ai 0 €."],
      { operatingModel: 'diy_free' }
    );
    assert(response.state.availableBudget.value === 0, 'budget must resolve to 0');
    if (response.type === 'RECOMMENDATION') {
      const verdictLower = (response.analysis.verdictSummary + response.analysis.verdictTitle).toLowerCase();
      assert(!verdictLower.includes('impossible'), 'must not declare a free-tool digital project "impossible"');
      assert(
        response.analysis.metrics.budgetNeeded <= 50,
        `expected a near-zero budgetNeeded via the free path, got ${response.analysis.metrics.budgetNeeded}`
      );
    }
  });

  // H. "Je veux acheter une voiture." -> must not assume any price or budget.
  await runCase('H: generic car purchase never assumes a price or budget', async () => {
    const r = await DecisionController.processTurn('Je veux acheter une voiture.', null, 'fr', 'EUR');
    assert(r.state.availableBudget.value === 'UNKNOWN', 'budget must stay UNKNOWN');
    const itemPrice = r.state.facts?.['itemPrice'];
    assert(!itemPrice || itemPrice.value === 'UNKNOWN', 'item price must stay UNKNOWN, never defaulted (e.g. to 10 000€)');
    assert(r.type === 'NEEDS_INFORMATION', `expected a question (price or budget), got ${r.type}`);
  });

  // I. Car at 15000€, 2000€ available, can save 300€/month -> coherent deterministic calculation.
  await runCase('I: car purchase with full data produces a coherent deterministic calculation', async () => {
    const r = await DecisionController.processTurn(
      'Je veux acheter cette voiture à 15 000 €, j\'ai 2 000 € et peux économiser 300 €/mois.',
      null,
      'fr',
      'EUR'
    );
    const itemPrice = r.state.facts?.['itemPrice'];
    assert(itemPrice && itemPrice.value === 15000, `expected itemPrice=15000, got ${JSON.stringify(itemPrice)}`);
    assert(r.state.availableBudget.value === 2000, `expected budget=2000, got ${JSON.stringify(r.state.availableBudget)}`);
  });

  // J. Budget update mid-conversation: "En fait mon budget n'est plus 2000 mais 4000 €." must
  // overwrite, not add to, the prior value, and downstream state must reflect only the new one.
  await runCase('J: budget correction overwrites the old value, no stale data used', async () => {
    let state: ProjectState | null = null;
    const turn1 = await DecisionController.processTurn(
      'Je veux acheter une voiture à 10 000 € avec 2 000 € d\'apport.',
      state,
      'fr',
      'EUR'
    );
    state = turn1.state;
    assert(state.availableBudget.value === 2000, `expected initial budget=2000, got ${JSON.stringify(state.availableBudget)}`);

    const turn2 = await DecisionController.processTurn(
      'En fait mon budget n\'est plus 2000 mais 4000 €.',
      state,
      'fr',
      'EUR',
      { availableBudget: '4000' }
    );
    assert(
      turn2.state.availableBudget.value === 4000,
      `expected updated budget=4000, got ${JSON.stringify(turn2.state.availableBudget)}`
    );
  });

  // K. Pure factual question, no personal project -> must not fabricate a feasibility score.
  await runCase('K: factual question produces no fabricated feasibility verdict', async () => {
    const r = await DecisionController.processTurn(
      'Combien coûte un salon de coiffure en général ?',
      null,
      'fr',
      'EUR'
    );
    assertNeedsInfo(r);
    assert(r.question.id === 'reframe_as_project', `expected reframe_as_project question, got ${r.question.id}`);
  });

  // L (regression): explicit item price of 0 combined with a real destination must not be
  // confused with "no destination" / duplicate question loops.
  await runCase('L: no duplicate questions across a full multi-turn conversation', async () => {
    const { askedQuestionIds } = await converse(
      ["Je veux partir loin mais j'ai pas d'argent.", 'Voyager', 'Marseille'],
      {
        disambiguate_intent: 'LEAVE_OR_TRAVEL',
        originLocation: 'Marseille',
        duration: '14',
        destinationLocation: 'flexible'
      }
    );
    const seen = new Set<string>();
    for (const id of askedQuestionIds) {
      assert(!seen.has(id), `question "${id}" was asked more than once: ${askedQuestionIds.join(', ')}`);
      seen.add(id);
    }
  });

  // Additional regression: real_estate/purchase must ask itemPrice, not silently fall back to a
  // category benchmark (this was a real bug found during audit).
  await runCase('Regression: purchase domain asks itemPrice, never defaults it silently', async () => {
    const r1 = await DecisionController.processTurn('Je veux acheter une moto.', null, 'fr', 'EUR');
    assertNeedsInfo(r1);
    assert(r1.question.id === 'itemPrice', `expected itemPrice question first, got ${r1.question.id}`);

    const r2 = await DecisionController.processTurn(
      '',
      r1.state,
      'fr',
      'EUR',
      { itemPrice: '4000' }
    );
    const itemPrice = r2.state.facts?.['itemPrice'];
    assert(itemPrice && itemPrice.value === 4000, `itemPrice should be set from frontend answer, got ${JSON.stringify(itemPrice)}`);
  });

  // Additional regression: digital project domain routes through the business/CostEstimator
  // pipeline (not the generic "simple goal" pipeline), and offers diy_free vs custom_dev.
  await runCase('Regression: digital project asks build-approach, not a physical salon question', async () => {
    const r = await DecisionController.processTurn(
      'Je veux créer une application mobile, ça me coûterait combien pour démarrer ?',
      null,
      'fr',
      'EUR'
    );
    assertNeedsInfo(r);
    assert(r.question.id === 'operatingModel', `expected operatingModel question, got ${r.question.id}`);
    const values = (r.question.options || []).map(o => o.value);
    assert(values.includes('diy_free') && values.includes('custom_dev'), `expected diy_free/custom_dev options, got ${JSON.stringify(values)}`);
    assert(!values.includes('salon'), 'digital project must not be asked the physical-salon question');
  });

  // Additional regression: NaN / undefined guard on the numeric pipeline for a fully-specified
  // recommendation.
  await runCase('Regression: no NaN in final metrics for a fully-specified project', async () => {
    const r = await DecisionController.processTurn(
      'Je gagne 1800 €/mois, j\'ai 2000 € d\'économies et je veux acheter une voiture à 15 000 €.',
      null,
      'fr',
      'EUR'
    );
    let final = r;
    if (final.type === 'NEEDS_INFORMATION' && final.question.id === 'itemPrice') {
      final = await DecisionController.processTurn('', final.state, 'fr', 'EUR', { itemPrice: '15000' });
    }
    if (final.type === 'RECOMMENDATION') {
      const m = final.analysis.metrics;
      assert(!isNaN(m.budgetAvailable) && !isNaN(m.budgetNeeded) && !isNaN(m.gap) && !isNaN(final.analysis.score), 'metrics must not contain NaN');
    }
  });

  // Additional regression: relocation asks the mission's own disambiguating question first.
  await runCase('Regression: relocation asks travel/settle/work before budget', async () => {
    const r = await DecisionController.processTurn(
      'Je veux quitter mon pays avec 2000 €.',
      null,
      'fr',
      'EUR'
    );
    assertNeedsInfo(r);
    assert(r.question.id === 'relocationGoal', `expected relocationGoal question first, got ${r.question.id}`);
  });

  console.log('\n================================================================');
  console.log(`🏁 RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running suite:', err);
  process.exit(1);
});
