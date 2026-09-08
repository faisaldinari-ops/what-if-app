// src/services/ai/questionGenerator.ts
import { UserContext, ProjectDomain } from '../../types/context';
import { MissingQuestion } from '../../types/decision';

export interface DynamicQuestionOption {
  label: string;
  value: any;
}

export function generateTargetedQuestions(
  context: UserContext,
  domain: ProjectDomain,
  lang: 'fr' | 'en' | 'es' = 'fr'
): MissingQuestion[] {
  const questions: MissingQuestion[] = [];
  const p = (context.goal || '').toLowerCase();

  const isFr = lang === 'fr';
  const isEs = lang === 'es';

  // Has budget?
  const hasBudget = context.budget !== undefined && context.budget !== null;
  // Has income?
  const hasIncome = context.monthlyIncome !== undefined && context.monthlyIncome !== null;
  // Has expenses?
  const hasExpenses = context.monthlyExpenses !== undefined && context.monthlyExpenses !== null;

  // DOMAIN 1: TRAVEL (Mode Voyage)
  if (domain === 'travel') {
    // 1. Departure / dates or duration if not known
    if (!context.durationDays && !p.match(/\b\d+\s*(?:jours?|days?|días?)\b/i)) {
      questions.push({
        id: 'durationDays',
        field: 'customAnswers' as any,
        question: isFr
          ? 'Combien de jours prévois-tu de partir ?'
          : isEs
          ? '¿Cuántos días planeas viajar?'
          : 'How many days are you planning to travel?',
        explanation: isFr
          ? 'La durée détermine directement les postes d’hébergement et de repas.'
          : 'Trip duration directly drives lodging and daily food costs.',
        type: 'choice',
        options: [
          { label: isFr ? '7 jours' : '7 days', value: 7 },
          { label: isFr ? '10 jours' : '10 days', value: 10 },
          { label: isFr ? '14 jours (2 semaines)' : '14 days (2 weeks)', value: 14 },
          { label: isFr ? '21 jours (3 semaines)' : '21 days (3 weeks)', value: 21 },
          { label: isFr ? '1 mois' : '1 month', value: 30 }
        ],
        defaultValue: 10
      });
    }

    // 2. Budget available if not known
    if (!hasBudget) {
      questions.push({
        id: 'budget',
        field: 'budget',
        question: isFr
          ? 'Quel budget total as-tu actuellement de côté pour ce voyage ?'
          : isEs
          ? '¿Con qué presupuesto total cuentas para este viaje?'
          : 'What total budget or savings do you currently have for this trip?',
        explanation: isFr
          ? 'Permet de voir immédiatement l’écart avec les coûts réels (vols, hôtels, vie sur place).'
          : 'Allows us to compare against realistic benchmark costs.',
        type: 'number',
        placeholder: 'ex. 1 500',
        unit: '€'
      });
    }

    // 3. Comfort level / travel style
    if (!context.preferences?.lifestyle) {
      questions.push({
        id: 'comfortLevel',
        field: 'customAnswers' as any,
        question: isFr
          ? 'Quel style de voyage préfères-tu ?'
          : isEs
          ? '¿Qué estilo de viaje prefieres?'
          : 'What style of travel do you prefer?',
        explanation: isFr
          ? 'Ajuste la fourchette entre hébergement économique, standard ou tout confort.'
          : 'Calibrates lodging and daily expenses.',
        type: 'choice',
        options: [
          { label: isFr ? 'Backpacker / Économique (Auberge/Guesthouse)' : 'Backpacker / Budget', value: 'budget' },
          { label: isFr ? 'Standard / Équilibré (Hôtel 3★, Airbnb)' : 'Standard / Balanced (3★ hotel)', value: 'standard' },
          { label: isFr ? 'Confort / Sans restriction (4-5★)' : 'Comfort / Premium (4-5★)', value: 'comfort' }
        ],
        defaultValue: 'standard'
      });
    }

    return questions.slice(0, 3);
  }

  // DOMAIN 2: RELOCATION / CHANGER DE PAYS (Mode Relocation)
  if (domain === 'relocation' || (domain === 'life_change' && p.includes('quitter la france'))) {
    // 1. Motivation / priority
    if (!context.preferences?.priority) {
      questions.push({
        id: 'relocationPriority',
        field: 'customAnswers' as any,
        question: isFr
          ? 'Tu veux surtout partir pour quoi ?'
          : isEs
          ? '¿Cuál es tu principal motivo para mudarte?'
          : 'What is your main priority for moving?',
        explanation: isFr
          ? 'Nous aide à sélectionner les pays les plus adaptés à tes priorités de vie.'
          : 'Helps curate countries matching your life priorities.',
        type: 'choice',
        options: [
          { label: isFr ? '☀️ Climat / Cadre de vie' : '☀️ Climate & Lifestyle', value: 'climate' },
          { label: isFr ? '💶 Coût de la vie accessible' : '💶 Affordable cost of living', value: 'cost_of_living' },
          { label: isFr ? '💼 Travail / Salaire / Carrière' : '💼 Work & Higher Salary', value: 'salary' },
          { label: isFr ? '🌿 Nouveau départ / Déconnexion' : '🌿 Fresh start / Quality of life', value: 'lifestyle' }
        ],
        defaultValue: 'cost_of_living'
      });
    }

    // 2. Budget available
    if (!hasBudget) {
      questions.push({
        id: 'budget',
        field: 'budget',
        question: isFr
          ? 'Combien as-tu d’économies disponibles pour ton installation ?'
          : isEs
          ? '¿Cuántos ahorros tienes para instalarte?'
          : 'How much savings do you have available for your move?',
        explanation: isFr
          ? 'Indispensable pour couvrir la caution, le premier loyer et la période de transition.'
          : 'Covers deposit, first months of rent, and transition runway.',
        type: 'number',
        placeholder: 'ex. 3 000',
        unit: '€'
      });
    }

    // 3. Work situation / qualifications
    if (!context.profession && !context.isRemoteFriendly) {
      questions.push({
        id: 'workMode',
        field: 'customAnswers' as any,
        question: isFr
          ? 'Comment prévois-tu de subvenir à tes besoins là-bas ?'
          : isEs
          ? '¿Cómo piensas sustentarte allí?'
          : 'How do you plan to sustain yourself there?',
        explanation: isFr
          ? 'Définit si tu as besoin d’un visa travail, d’un job local ou si tu travailles déjà à distance.'
          : 'Determines visa eligibility and income continuity.',
        type: 'choice',
        options: [
          { label: isFr ? 'Télétravail / Freelance (Remote)' : 'Remote work / Freelance', value: 'remote' },
          { label: isFr ? 'Trouver un job sur place' : 'Find a job locally', value: 'local_job' },
          { label: isFr ? 'Artisan / Métier manuel qualifié' : 'Skilled trade / Craft', value: 'trade' },
          { label: isFr ? 'Année sabbatique / Pas de travail immédiat' : 'Sabbatical / No immediate job', value: 'sabbatical' }
        ],
        defaultValue: 'local_job'
      });
    }

    return questions.slice(0, 3);
  }

  // DOMAIN 3: BUSINESS (Mode Business / Entrepreneuriat)
  if (domain === 'business') {
    // 1. Budget available if not known
    if (!hasBudget) {
      questions.push({
        id: 'budget',
        field: 'budget',
        question: isFr
          ? 'Quel apport personnel ou capital as-tu pour démarrer ?'
          : isEs
          ? '¿Con qué capital propio cuentas para arrancar?'
          : 'What initial capital or savings do you have to start?',
        explanation: isFr
          ? 'Sert à calibrer le modèle : lancement en solo avec les moyens du bord vs formule complète.'
          : 'Calibrates whether to start lean solo or complete setup.',
        type: 'number',
        placeholder: 'ex. 5 000',
        unit: '€'
      });
    }

    // 2. Personal living expenses
    if (!hasExpenses) {
      questions.push({
        id: 'monthlyExpenses',
        field: 'monthlyExpenses',
        question: isFr
          ? 'Quelles sont tes dépenses personnelles mensuelles incompressibles ?'
          : isEs
          ? '¿A cuánto ascienden tus gastos personales mensuales fijos?'
          : 'What are your incompressible monthly personal living expenses?',
        explanation: isFr
          ? 'Le plus grand risque d’un entrepreneur est de ne plus pouvoir payer son loyer personnel.'
          : 'Personal runway is the #1 survival factor for early founders.',
        type: 'number',
        placeholder: 'ex. 1 500',
        unit: '€'
      });
    }

    // 3. Premise / Vehicle / Material needs
    if (context.hasPremises === undefined) {
      questions.push({
        id: 'businessPremises',
        field: 'customAnswers' as any,
        question: isFr
          ? 'As-tu besoin d’un local commercial ou d’un véhicule pro ?'
          : isEs
          ? '¿Necesitas local comercial o vehículo profesional?'
          : 'Do you require a commercial premise or dedicated pro vehicle?',
        explanation: isFr
          ? 'Un local ou un utilitaire modifie fortement les charges fixes de démarrage.'
          : 'Premises or commercial fleet dramatically alter fixed costs.',
        type: 'choice',
        options: [
          { label: isFr ? 'Non, démarrage depuis chez moi / chez le client' : 'No, home-based / mobile service', value: 'none' },
          { label: isFr ? 'Oui, véhicule utilitaire indispensable' : 'Yes, utility vehicle required', value: 'vehicle' },
          { label: isFr ? 'Oui, boutique / salon / local commercial' : 'Yes, commercial retail shop', value: 'premises' }
        ],
        defaultValue: 'none'
      });
    }

    return questions.slice(0, 3);
  }

  // DOMAIN 4: DIGITAL PROJECT (Mode Projet Digital / 0 € ou petit budget)
  if (domain === 'digital_project') {
    // 1. Technical skills
    questions.push({
      id: 'techSkills',
      field: 'customAnswers' as any,
      question: isFr
        ? 'Sais-tu coder ou préfères-tu une solution 100% sans code / assistée par IA ?'
        : isEs
        ? '¿Sabes programar o prefieres herramientas sin código / IA?'
        : 'Do you know how to code, or do you prefer no-code / AI-assisted tools?',
      explanation: isFr
        ? 'Permet d’orienter vers les outils gratuits les plus adaptés à ton autonomie.'
        : 'Allows us to recommend free stacks matching your autonomy.',
      type: 'choice',
      options: [
        { label: isFr ? 'Aucune compétence technique (No-code / IA)' : 'No code / AI-assisted', value: 'nocode' },
        { label: isFr ? 'Bases en informatique / Débrouillard' : 'Comfortable with web tools', value: 'intermediate' },
        { label: isFr ? 'Je sais coder (Développeur)' : 'I can code (Developer)', value: 'developer' }
      ],
      defaultValue: 'nocode'
    });

    if (!hasBudget) {
      questions.push({
        id: 'budget',
        field: 'budget',
        question: isFr
          ? 'Quel budget maximal peux-tu allouer par mois pour les outils et l’hébergement ?'
          : isEs
          ? '¿Qué presupuesto mensual puedes asignar?'
          : 'What monthly budget can you allocate for hosting & tools?',
        explanation: isFr
          ? 'Même avec 0 €, il est possible de démarrer avec des formules gratuites.'
          : 'Even with 0 €, free tiers can launch your MVP.',
        type: 'number',
        placeholder: '0 (ou ex. 30)',
        unit: '€'
      });
    }

    return questions.slice(0, 2);
  }

  // DOMAIN 5: CAREER (Mode Changement de carrière)
  if (domain === 'career') {
    if (!context.monthlyIncome) {
      questions.push({
        id: 'monthlyIncome',
        field: 'monthlyIncome',
        question: isFr
          ? 'Quel est ton revenu net actuel par mois ?'
          : isEs
          ? '¿Cuál es tu ingreso neto mensual actual?'
          : 'What is your current net monthly income?',
        explanation: isFr
          ? 'Sert de référence pour évaluer la faisabilité financière d’une transition.'
          : 'Baseline to calculate transition sustainability.',
        type: 'number',
        placeholder: 'ex. 2 200',
        unit: '€'
      });
    }

    questions.push({
      id: 'transitionTime',
      field: 'customAnswers' as any,
      question: isFr
        ? 'Combien de temps peux-tu consacrer par semaine à ta reconversion ?'
        : isEs
        ? '¿Cuánto tiempo semanal puedes dedicar?'
        : 'How much time per week can you dedicate to retraining?',
      explanation: isFr
        ? 'Distingue une formation à plein temps d’un apprentissage progressif le soir.'
        : 'Separates full-time bootcamps from evenings self-study.',
      type: 'choice',
      options: [
        { label: isFr ? 'Temps plein (25h - 35h/semaine)' : 'Full time (25-35h/week)', value: 'full_time' },
        { label: isFr ? 'Temps partiel / Soirs et week-ends (5h - 15h/semaine)' : 'Part time (5-15h/week)', value: 'part_time' },
        { label: isFr ? 'Je ne sais pas encore' : 'Not sure yet', value: 'flexible' }
      ],
      defaultValue: 'part_time'
    });

    return questions.slice(0, 2);
  }

  // GENERAL FALLBACK: Ask only what truly changes the decision
  if (!hasBudget) {
    questions.push({
      id: 'budget',
      field: 'budget',
      question: isFr
        ? 'De quel montant ou épargne disposes-tu pour ce projet ?'
        : isEs
        ? '¿De qué fondos o ahorros dispones para este proyecto?'
        : 'What savings or capital do you have ready for this project?',
      explanation: isFr
        ? 'Permet d’évaluer la réserve de sécurité et l’autonomie de départ.'
        : 'Crucial to evaluate baseline financial runway.',
      type: 'number',
      placeholder: 'ex. 2 000',
      unit: '€'
    });
  }

  if (!hasIncome) {
    questions.push({
      id: 'monthlyIncome',
      field: 'monthlyIncome',
      question: isFr
        ? 'Combien gagnes-tu actuellement par mois (revenus / salaire) ?'
        : isEs
        ? '¿Cuánto ganas actualmente al mes?'
        : 'How much do you currently earn per month?',
      explanation: isFr
        ? 'Sert à calculer ta capacité d’épargne mensuelle.'
        : 'Allows calculating monthly savings capacity.',
      type: 'number',
      placeholder: 'ex. 2 300',
      unit: '€'
    });
  }

  if (!hasExpenses && questions.length < 3) {
    questions.push({
      id: 'monthlyExpenses',
      field: 'monthlyExpenses',
      question: isFr
        ? 'À combien s’élèvent tes dépenses personnelles par mois (loyer, charges, vie) ?'
        : isEs
        ? '¿Cuáles son tus gastos fijos mensuales?'
        : 'What are your personal fixed monthly expenses (rent, bills, food)?',
      explanation: isFr
        ? 'Permet d’identifier ta marge de manoeuvre réelle.'
        : 'Identifies your true discretionary breathing room.',
      type: 'number',
      placeholder: 'ex. 1 600',
      unit: '€'
    });
  }

  return questions.slice(0, 3);
}
