// src/services/ai/intentClassifier.ts
import { UserIntent } from '../../types/context';

export function classifyUserIntent(prompt: string): UserIntent {
  const p = prompt.toLowerCase();

  // 1. Where should I go / destinations
  if (
    p.includes('où puis-je aller') ||
    p.includes('ou puis je aller') ||
    p.includes('où aller') ||
    p.includes('ou aller') ||
    p.includes('où partir') ||
    p.includes('ou partir') ||
    p.includes('quitter la france mais je ne sais pas où') ||
    p.includes('quitter la france mais je ne sais pas ou') ||
    p.includes('ne sais pas où aller') ||
    p.includes('ne sais pas ou aller') ||
    p.includes('where can i go') ||
    p.includes('where should i go') ||
    p.includes('a dónde puedo ir') ||
    p.includes('adonde ir')
  ) {
    return 'WHERE_SHOULD_I_GO';
  }

  // 2. Can I start this business
  if (
    p.includes('lancer ma société') ||
    p.includes('lancer mon entreprise') ||
    p.includes('créer ma boîte') ||
    p.includes('ouvrir un') ||
    p.includes('ouvrir une') ||
    p.includes('mettre à mon compte') ||
    p.includes('me mettre à mon compte') ||
    p.includes('start a business') ||
    p.includes('open a shop') ||
    p.includes('montar un negocio') ||
    p.includes('abrir un')
  ) {
    return 'CAN_I_START_THIS_BUSINESS';
  }

  // 3. Can I change career
  if (
    p.includes('changer de métier') ||
    p.includes('changer de travail') ||
    p.includes('reconversion') ||
    p.includes('me reconvertir') ||
    p.includes('change career') ||
    p.includes('switch career') ||
    p.includes('cambiar de carrera') ||
    p.includes('cambiar de profesión')
  ) {
    return 'CAN_I_CHANGE_CAREER';
  }

  // 4. Can I relocate
  if (
    p.includes('partir vivre') ||
    p.includes('quitter la france') ||
    p.includes('m’expatrier') ||
    p.includes('mexpatrier') ||
    p.includes('déménager en') ||
    p.includes('déménager au') ||
    p.includes('déménager à') ||
    p.includes('vivre en espagne') ||
    p.includes('vivre à miami') ||
    p.includes('move to') ||
    p.includes('relocate') ||
    p.includes('mudarse a') ||
    p.includes('vivir en')
  ) {
    return 'CAN_I_RELOCATE';
  }

  // 5. How much should I save / how much time to save
  if (
    p.includes('combien dois-je mettre de côté') ||
    p.includes('combien mettre de côté') ||
    p.includes('combien épargner') ||
    p.includes('combien de temps pour économiser') ||
    p.includes('combien de temps pour mettre de côté') ||
    p.includes('how much should i save') ||
    p.includes('how much do i need to save') ||
    p.includes('how long to save') ||
    p.includes('cuánto debo ahorrar') ||
    p.includes('cuánto tiempo para ahorrar')
  ) {
    return 'HOW_MUCH_SHOULD_I_SAVE';
  }

  // 6. How much will it cost
  if (
    p.includes('combien ça coûte') ||
    p.includes('combien ca coute') ||
    p.includes('combien cela va me coûter') ||
    p.includes('ne sais pas combien ça coûte') ||
    p.includes('how much will it cost') ||
    p.includes('how much does it cost') ||
    p.includes('cuánto cuesta')
  ) {
    return 'HOW_MUCH_WILL_IT_COST';
  }

  // 7. Can I afford it / is it reasonable
  if (
    p.includes('est-ce que j’ai assez') ||
    p.includes('ai-je assez') ||
    p.includes('est-ce raisonnable') ||
    p.includes('est ce raisonnable') ||
    p.includes('peux-je me le permettre') ||
    p.includes('est-ce faisable') ||
    p.includes('can i afford') ||
    p.includes('do i have enough') ||
    p.includes('is it reasonable') ||
    p.includes('me alcanza') ||
    p.includes('es razonable')
  ) {
    return 'CAN_I_AFFORD_IT';
  }

  // 8. Build me a plan / How can I do it
  if (
    p.includes('comment faire') ||
    p.includes('comment je peux') ||
    p.includes('comment puis-je') ||
    p.includes('plan d’action') ||
    p.includes('plan concret') ||
    p.includes('comment commencer') ||
    p.includes('how can i do it') ||
    p.includes('how to start') ||
    p.includes('cómo puedo hacerlo')
  ) {
    return 'HOW_CAN_I_DO_IT';
  }

  // 9. What are my options / Help me decide
  if (
    p.includes('mes options') ||
    p.includes('quelles options') ||
    p.includes('quelles alternatives') ||
    p.includes('what are my options') ||
    p.includes('cuáles son mis opciones')
  ) {
    return 'WHAT_ARE_MY_OPTIONS';
  }

  if (
    p.includes('aide-moi à choisir') ||
    p.includes('hésite entre') ||
    p.includes('help me decide') ||
    p.includes('ayúdame a decidir')
  ) {
    return 'HELP_ME_DECIDE';
  }

  // 10. Default fallback based on domain hints
  if (p.includes('voyag') || p.includes('partir') || p.includes('vacance') || p.includes('trip') || p.includes('viaj')) {
    return 'CAN_I_AFFORD_IT';
  }
  if (p.includes('créer') || p.includes('site') || p.includes('app') || p.includes('business')) {
    return 'HOW_CAN_I_DO_IT';
  }

  return 'HELP_ME_DECIDE';
}
