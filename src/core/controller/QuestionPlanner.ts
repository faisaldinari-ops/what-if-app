// src/core/controller/QuestionPlanner.ts
import { ProjectState, NextBestAction } from '../types';
import { MissingQuestion } from '../../types/decision';

export interface PlannedQuestion {
  question: MissingQuestion;
  nextAction: NextBestAction;
  ctaLabel: string;
  explanationNote?: string;
  informationGain: number; // 0-1
  userFriction: number; // 0-1 (lower is better)
  decisionImpact: number; // 0-1
}

export class QuestionPlanner {
  static selectNextBestQuestion(state: ProjectState, lang: 'fr' | 'en' | 'es' = 'fr'): PlannedQuestion {
    const isFr = lang === 'fr';
    const isEs = lang === 'es';

    // 0. Relocation: "leaving the country" is asked before anything else for this domain,
    // because it changes which facts matter next (a holiday needs dates; settling abroad needs
    // visa/budget/target country; working abroad needs qualifications/job search facts).
    if (state.missingCriticalFacts.includes('relocationGoal')) {
      const q: MissingQuestion = {
        id: 'relocationGoal',
        field: 'customAnswers',
        type: 'choice',
        question: isFr
          ? 'Tu veux surtout voyager, t\'installer ailleurs, ou repartir de zéro en travaillant dans un autre pays ?'
          : isEs
          ? '¿Quieres sobre todo viajar, instalarte en otro lugar, o empezar de cero trabajando en otro país?'
          : 'Are you mainly looking to travel, settle somewhere new, or start fresh working in another country?',
        options: [
          {
            label: isFr ? '✈️ Juste voyager' : isEs ? '✈️ Solo viajar' : '✈️ Just travel',
            value: 'travel'
          },
          {
            label: isFr ? '🏡 M\'installer durablement' : isEs ? '🏡 Instalarme de forma duradera' : '🏡 Settle there long-term',
            value: 'settle'
          },
          {
            label: isFr ? '💼 Travailler / repartir de zéro là-bas' : isEs ? '💼 Trabajar / empezar de cero allí' : '💼 Work / start over there',
            value: 'work'
          }
        ]
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.9,
        userFriction: 0.15,
        decisionImpact: 0.9
      };
    }

    const reqIntent = state.requestIntent.value;
    const isEstimateCost = reqIntent === 'ESTIMATE_COST';
    const isBusiness = state.activeDomains.includes('business') || state.activeDomains.includes('digital_project') || state.primaryIntent.value === 'START_BUSINESS';
    const isDigitalProject = state.activeDomains.includes('digital_project');
    const isTravel = state.activeDomains.includes('travel') || state.primaryIntent.value === 'LEAVE_OR_TRAVEL';
    const rawLower = state.rawGoal.toLowerCase();

    // 1. Business: operating model is the single highest-impact question for cost estimation,
    // whether the person explicitly asked "how much does it cost" or just described launching
    // a business in general — both paths need it before CostEstimator can produce a real figure.
    if (isBusiness && state.missingCriticalFacts.includes('operatingModel')) {
      // Check if operating model is known
      if (state.operatingModel.value === 'UNKNOWN') {
        if (isDigitalProject) {
          const digitalQuestion: MissingQuestion = {
            id: 'operatingModel',
            field: 'customAnswers',
            type: 'choice',
            question: isFr
              ? 'Le coût dépend surtout de comment tu veux le créer. Tu comptes plutôt :'
              : isEs
              ? 'El coste depende sobre todo de cómo quieres crearlo. ¿Tienes previsto:'
              : 'The cost mainly depends on how you want to build it. Are you planning to:',
            explanation: isFr
              ? 'Des outils gratuits (créateur de site + hébergement gratuit) permettent de démarrer à 0 €, contre plusieurs centaines/milliers d’euros pour du développement sur-mesure.'
              : isEs
              ? 'Las herramientas gratuitas permiten empezar con 0 €, frente a varios cientos o miles de euros para desarrollo a medida.'
              : 'Free tools (site builder + free hosting) let you start at €0, versus several hundred/thousand euros for custom development.',
            options: [
              {
                label: isFr ? '🆓 Le faire moi-même, gratuitement (no-code)' : isEs ? '🆓 Hacerlo yo mismo, gratis (no-code)' : '🆓 Do it myself for free (no-code)',
                value: 'diy_free'
              },
              {
                label: isFr ? '💻 Faire développer sur-mesure (freelance/agence)' : isEs ? '💻 Encargar desarrollo a medida' : '💻 Have it custom-built (freelancer/agency)',
                value: 'custom_dev'
              },
              {
                label: isFr ? '❓ Je ne sais pas encore' : isEs ? '❓ No lo sé todavía' : '❓ Not sure yet',
                value: 'unknown'
              }
            ]
          };

          return {
            question: digitalQuestion,
            nextAction: 'RESEARCH',
            ctaLabel: isFr ? 'Estimer le coût' : isEs ? 'Estimar coste' : 'Estimate Cost',
            informationGain: 0.95,
            userFriction: 0.15,
            decisionImpact: 0.95
          };
        }

        const isBeauty =
          rawLower.includes('ongle') ||
          rawLower.includes('cil') ||
          rawLower.includes('beaute') ||
          rawLower.includes('esthetique');

        const beautyQuestion: MissingQuestion = {
          id: 'operatingModel',
          field: 'customAnswers',
          type: 'choice',
          question: isFr
            ? 'Le coût change énormément selon la façon dont tu veux démarrer. Tu comptes plutôt :'
            : isEs
            ? 'El coste varía mucho según la forma de empezar. ¿Tienes previsto:'
            : 'The cost varies dramatically based on how you start. Are you planning to:',
          explanation: isFr
            ? 'Le matériel professionnel reste similaire, mais louer un local commercial multiplie les coûts par 10 (bail, normes d’aération ERP).'
            : isEs
            ? 'El material es similar, pero alquilar un local comercial multiplica los costes.'
            : 'The core professional equipment is similar, but renting a commercial salon involves lease deposits and safety regulations.',
          options: [
            {
              label: isFr ? '🏠 Travailler de chez moi' : isEs ? '🏠 Trabajar desde casa' : '🏠 Work from home',
              value: 'home'
            },
            {
              label: isFr ? '🚗 Me déplacer chez les clientes' : isEs ? '🚗 A domicilio de clientes' : '🚗 Mobile (at clients’ homes)',
              value: 'mobile'
            },
            {
              label: isFr ? '🏢 Louer un local / salon' : isEs ? '🏢 Alquilar un local' : '🏢 Rent a salon / premises',
              value: 'salon'
            },
            {
              label: isFr ? '❓ Je ne sais pas encore' : isEs ? '❓ No lo sé todavía' : '❓ Not sure yet',
              value: 'unknown'
            }
          ]
        };

        return {
          question: beautyQuestion,
          nextAction: 'RESEARCH',
          ctaLabel: isFr ? 'Estimer le coût' : isEs ? 'Estimar coste' : 'Estimate Cost',
          informationGain: 0.95,
          userFriction: 0.15,
          decisionImpact: 0.95
        };
      }
    }

    // 2. Disambiguate Intent / Domain if ambiguous
    if (state.missingCriticalFacts.includes('intent_or_domain')) {
      const q: MissingQuestion = {
        id: 'disambiguate_intent',
        field: 'customAnswers',
        type: 'choice',
        question: isFr ? 'Tu souhaites surtout :' : isEs ? 'Quieres principalmente:' : 'Do you mainly want to:',
        options: [
          {
            label: isFr ? '🏖️ Voyager quelques semaines' : isEs ? '🏖️ Viajar unas semanas' : '🏖️ Travel for a few weeks',
            value: 'LEAVE_OR_TRAVEL'
          },
          {
            label: isFr ? '🌍 Partir vivre à l’étranger' : isEs ? '🌍 Mudarte al extranjero' : '🌍 Relocate abroad',
            value: 'RELOCATE'
          },
          {
            label: isFr ? '💼 Créer une entreprise / activité' : isEs ? '💼 Crear un negocio' : '💼 Start a business',
            value: 'START_BUSINESS'
          },
          {
            label: isFr ? '🔄 Changer complètement de vie' : isEs ? '🔄 Cambio de vida completo' : '🔄 Change life completely',
            value: 'LIFE_CHANGE'
          }
        ]
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.9,
        userFriction: 0.2,
        decisionImpact: 0.9
      };
    }

    // 3. Travel: Destination
    if (state.missingCriticalFacts.includes('destinationLocation')) {
      const q: MissingQuestion = {
        id: 'destinationLocation',
        field: 'customAnswers',
        type: 'text',
        question: isFr
          ? 'Tu as déjà une destination en tête ?'
          : isEs
          ? '¿Tienes ya un destino en mente?'
          : 'Do you have a destination in mind?',
        placeholder: isFr ? 'ex. Japon, Thaïlande, Espagne, ou "Pas d’idée précise"' : 'e.g. Japan, Spain, or open'
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.8,
        userFriction: 0.25,
        decisionImpact: 0.8
      };
    }

    // 3b. Travel: Origin (needed to estimate flight/transport cost)
    if (state.missingCriticalFacts.includes('originLocation')) {
      const q: MissingQuestion = {
        id: 'originLocation',
        field: 'customAnswers',
        type: 'text',
        question: isFr
          ? 'Tu pars de quelle ville ?'
          : isEs
          ? '¿Desde qué ciudad viajas?'
          : 'What city are you traveling from?',
        placeholder: isFr ? 'ex. Paris, Marseille, Lyon' : 'e.g. Paris, London, New York'
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.6,
        userFriction: 0.2,
        decisionImpact: 0.6
      };
    }

    // 4. Travel: Duration
    if (state.missingCriticalFacts.includes('duration')) {
      const q: MissingQuestion = {
        id: 'duration',
        field: 'customAnswers',
        type: 'choice',
        question: isFr
          ? 'Combien de temps souhaites-tu partir ?'
          : isEs
          ? '¿Cuánto tiempo quieres irte?'
          : 'How long do you want to go for?',
        options: [
          { label: isFr ? 'Moins d’une semaine' : 'Under a week', value: '5_days' },
          { label: isFr ? '1 à 2 semaines' : '1 to 2 weeks', value: '14_days' },
          { label: isFr ? '1 mois ou plus' : '1 month or more', value: '30_days' }
        ]
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.75,
        userFriction: 0.15,
        decisionImpact: 0.75
      };
    }

    // 4b. Purchase / real estate: the price of the thing itself is required before anything
    // else — we must never substitute a category benchmark (e.g. "car" -> 10 000 €) for what
    // the person is actually buying.
    if (state.missingCriticalFacts.includes('itemPrice')) {
      const isRealEstate = state.activeDomains.includes('real_estate');
      const q: MissingQuestion = {
        id: 'itemPrice',
        field: 'customAnswers',
        type: 'number',
        question: isFr
          ? (isRealEstate ? 'Quel est le prix du bien que tu vises (ou une fourchette) ?' : 'Quel est le prix de ce que tu veux acheter ?')
          : isEs
          ? (isRealEstate ? '¿Cuál es el precio del inmueble (o un rango)?' : '¿Cuál es el precio de lo que quieres comprar?')
          : (isRealEstate ? 'What is the price of the property you have in mind (or a range)?' : 'What is the price of the thing you want to buy?'),
        placeholder: isRealEstate ? 'ex. 250 000' : 'ex. 15 000'
      };

      return {
        question: q,
        nextAction: 'ASK',
        ctaLabel: isFr ? 'Continuer' : isEs ? 'Continuar' : 'Continue',
        informationGain: 0.95,
        userFriction: 0.2,
        decisionImpact: 0.95
      };
    }

    // 5. If budget is explicitly required (e.g. CHECK_AFFORDABILITY or purchasing)
    if (state.missingCriticalFacts.includes('availableBudget')) {
      const q: MissingQuestion = {
        id: 'availableBudget',
        field: 'budget',
        type: 'number',
        question: isFr
          ? 'Quel est ton budget ou épargne disponible pour ce projet ?'
          : isEs
          ? '¿De cuánto presupuesto o ahorros dispones?'
          : 'What is your available budget or savings for this project?',
        placeholder: 'ex. 2 000'
      };

      return {
        question: q,
        nextAction: 'CALCULATE',
        ctaLabel: isFr ? 'Calculer la faisabilité' : isEs ? 'Calcular viabilidad' : 'Calculate Feasibility',
        informationGain: 0.85,
        userFriction: 0.3,
        decisionImpact: 0.9
      };
    }

    // 6. If we need income (e.g. for savings plan)
    if (state.missingCriticalFacts.includes('monthlyIncome') || state.missingCriticalFacts.includes('monthlyExpenses')) {
      const isIncome = state.missingCriticalFacts.includes('monthlyIncome');
      const q: MissingQuestion = {
        id: isIncome ? 'monthlyIncome' : 'monthlyExpenses',
        field: isIncome ? 'monthlyIncome' : 'monthlyExpenses',
        type: 'number',
        question: isFr
          ? (isIncome ? 'Combien gagnes-tu chaque mois net ?' : 'À combien s\'élèvent tes dépenses incompressibles (loyer, courses, etc.) par mois ?')
          : 'What is your monthly ' + (isIncome ? 'income?' : 'expenses?'),
        explanation: isFr ? 'Cela me permettra de calculer combien de mois d\'épargne il te faudra pour atteindre ton objectif.' : undefined,
        placeholder: isIncome ? 'ex. 2 200' : 'ex. 1 500'
      };

      return {
        question: q,
        nextAction: 'CALCULATE',
        ctaLabel: isFr ? 'Continuer' : 'Continue',
        informationGain: 0.9,
        userFriction: 0.3,
        decisionImpact: 0.8
      };
    }

    // Default fallback question
    const defaultQ: MissingQuestion = {
      id: 'general_info',
      field: 'customAnswers',
      type: 'text',
      question: isFr
        ? 'Peux-tu m’en dire un peu plus sur tes priorités ?'
        : 'Can you tell me a bit more about your priorities?'
    };

    return {
      question: defaultQ,
      nextAction: 'ASK',
      ctaLabel: isFr ? 'Continuer' : 'Continue',
      informationGain: 0.5,
      userFriction: 0.3,
      decisionImpact: 0.5
    };
  }
}
