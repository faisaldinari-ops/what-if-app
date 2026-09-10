import { DecisionController } from './src/core/controller/DecisionController';

async function run() {
  let state = null;
  let frontendAnswers = {};
  
  const turns = [
    "Je veux partir loin mais j'ai pas de sous.",
    "Voyager",
    "Marseille",
    "J'ai 500 €.",
    "Je peux partir n'importe quand."
  ];

  for (const t of turns) {
    console.log("USER:", t);
    
    // Simulate frontend intercepting the answer based on the previous question
    if (state && state.missingCriticalFacts) {
      const q = state.missingCriticalFacts[0];
      if (q === 'intent_or_domain') frontendAnswers['disambiguate_intent'] = 'LEAVE_OR_TRAVEL';
      if (q === 'originLocation') frontendAnswers['originLocation'] = 'Marseille';
      if (q === 'availableBudget') frontendAnswers['availableBudget'] = '500';
      if (q === 'duration') frontendAnswers['duration'] = '14'; frontendAnswers['destinationLocation'] = 'flexible';
    }

    const res = await DecisionController.processTurn(t, state, 'fr', 'EUR', frontendAnswers);
    if (res.type === 'NEEDS_INFORMATION') {
      console.log("WHAT IF?:", res.question.question);
      state = res.state;
    } else {
      console.log("WHAT IF?: READY FOR RECOMMENDATION!");
      state = res.state;
    }
    console.log("STATE:", { 
       intent: state.primaryIntent.value, 
       origin: state.originLocation.value, 
       budget: state.availableBudget.value,
       missing: state.missingCriticalFacts
    });
    console.log("-----------------------");
  }
}

run().catch(console.error);
