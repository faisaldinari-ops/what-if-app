// src/services/research/careerResearch.ts
import { CareerShortlistOption } from '../../types/planning';
import { ResearchFact } from '../../types/research';

export function getCareerTransitions(
  currentJobPrompt: string,
  monthlyIncome: number = 2200
): {
  options: CareerShortlistOption[];
  facts: ResearchFact[];
} {
  const p = currentJobPrompt.toLowerCase();

  // Curate 3 high-demand career pathways adapted to common profiles
  const options: CareerShortlistOption[] = [
    {
      id: 'tech_web',
      title: 'Développeur Web / No-Code Consultant',
      compatibilityScore: 84,
      whyMatches: 'Accessible via formations intensives finançables (CPF / France Travail) ou auto-formation, forte demande pour digitalisation des PME et indépendants.',
      trainingTimeMonths: 6,
      trainingCostRange: {
        min: 0,
        realistic: 2500,
        comfortable: 6000,
        currency: 'EUR',
        confidence: 'high'
      },
      expectedSalaryRange: {
        min: 2100,
        realistic: 2800,
        comfortable: 4000,
        currency: 'EUR',
        confidence: 'high'
      },
      difficulty: 'Moyen',
      firstStep: 'Suivre un parcours gratuit de 20 heures (HTML/CSS/JavaScript ou Webflow) pour valider ton affinité avant de quitter ton poste.',
      badge: 'Forte demande & Télétravail'
    },
    {
      id: 'trade_btp',
      title: 'Technicien Énergie Renouvelable (Solaire / Pompes à chaleur)',
      compatibilityScore: 89,
      whyMatches: 'Secteur en pénurie massive de main-d’œuvre qualifiée en France et en Europe, garantissant un emploi immédiat et d’excellentes perspectives en indépendant.',
      trainingTimeMonths: 9,
      trainingCostRange: {
        min: 0,
        realistic: 1800,
        comfortable: 4500,
        currency: 'EUR',
        confidence: 'high'
      },
      expectedSalaryRange: {
        min: 2200,
        realistic: 3200,
        comfortable: 5500,
        currency: 'EUR',
        confidence: 'high'
      },
      difficulty: 'Moyen',
      firstStep: 'Demander un bilan de compétences et vérifier les titres professionnels reconnus RNCP auprès de la région ou de France Travail.',
      badge: 'Meilleure sécurité de l’emploi'
    },
    {
      id: 'digital_marketing',
      title: 'Growth & Spécialiste Acquisition Digitale (Freelance)',
      compatibilityScore: 78,
      whyMatches: 'Permet de capitaliser sur n’importe quelle expérience commerciale antérieure tout en travaillant à distance pour des clients variés.',
      trainingTimeMonths: 4,
      trainingCostRange: {
        min: 0,
        realistic: 800,
        comfortable: 2500,
        currency: 'EUR',
        confidence: 'high'
      },
      expectedSalaryRange: {
        min: 1900,
        realistic: 2700,
        comfortable: 4500,
        currency: 'EUR',
        confidence: 'medium'
      },
      difficulty: 'Facile',
      firstStep: 'Passer les certifications officielles gratuites Google Analytics et Meta Blueprint.',
      badge: 'Démarrage rapide'
    }
  ];

  const facts: ResearchFact[] = [
    {
      label: 'Financement CPF (Compte Personnel de Formation)',
      value: 'Jusqu’à 5 000 € mobilisables pour les formations certifiées Qualiopi/RNCP',
      source: 'Ministère du Travail & Caisse des Dépôts 2025',
      confidence: 'high',
      isEstimate: false
    },
    {
      label: 'Transition professionnelle (Dispositif Démissionnaire)',
      value: 'Possibilité de toucher les allocations chômage en cas de démission pour projet réel de reconversion',
      source: 'Transitions Pro & France Travail',
      confidence: 'high',
      isEstimate: false
    }
  ];

  return { options, facts };
}
