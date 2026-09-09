// src/services/research/jobsProvider.ts
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface JobProfileAssessment {
  profession: string;
  targetCountry: string;
  demandLevel: 'très forte' | 'forte' | 'moyenne' | 'faible';
  indicativeGrossSalaryRange: {
    min: number;
    median: number;
    high: number;
  };
  languageRequirement: string;
  qualificationRecognitionRequired: boolean;
  qualificationNote: string;
  facts: GroundedFact[];
}

/**
 * Assesses job market viability for a specific profession in a target country.
 */
export function assessJobMarket(
  profession?: string,
  targetCountry: string = 'France'
): JobProfileAssessment {
  const p = (profession || 'Employé polyvalent').toLowerCase();
  const c = targetCountry.toLowerCase();
  const facts: GroundedFact[] = [];

  // Electrician / Trades
  if (p.includes('électricien') || p.includes('electricien') || p.includes('electrical')) {
    let medianSalary = 2600;
    if (c.includes('belgique') || c.includes('belgium')) medianSalary = 2800;
    else if (c.includes('espagne')) medianSalary = 1900;
    else if (c.includes('portugal')) medianSalary = 1350;
    else if (c.includes('maroc')) medianSalary = 600;
    else if (c.includes('slovenie') || c.includes('slovénie')) medianSalary = 1800;
    else if (c.includes('croatie')) medianSalary = 1500;

    facts.push(
      createGroundedFact(
        'job_demand_electrician',
        `Tension du marché pour électricien (${targetCountry})`,
        'Métier en pénurie structurelle / Forte demande de recrutement',
        'Pôle Emploi / Eurostat Labour Shortages Index 2025-2026',
        undefined,
        false,
        false,
        'Les électriciens qualifiés trouvent généralement un emploi ou des chantiers rapidement.'
      )
    );

    return {
      profession: 'Électricien qualifié',
      targetCountry,
      demandLevel: 'très forte',
      indicativeGrossSalaryRange: {
        min: Math.round(medianSalary * 0.8),
        median: medianSalary,
        high: Math.round(medianSalary * 1.35)
      },
      languageRequirement:
        c.includes('belgique') ? 'Français (Wallonie/Bruxelles) ou Néerlandais (Flandre)' :
        c.includes('espagne') ? 'Espagnol niveau B1/B2 recommandé pour chantiers locaux' :
        c.includes('maroc') ? 'Français et Arabe courants' :
        'Langue locale niveau intermédiaire pour coordination sur chantier',
      qualificationRecognitionRequired: true,
      qualificationNote: 'Habilitations électriques et normes de sécurité locales impératives.',
      facts
    };
  }

  // Tech / Software / Digital
  if (p.includes('dev') || p.includes('informatique') || p.includes('web') || p.includes('tech') || p.includes('data')) {
    let medianSalary = 3800;
    if (c.includes('espagne')) medianSalary = 2900;
    else if (c.includes('portugal')) medianSalary = 2400;
    else if (c.includes('maroc')) medianSalary = 1200;

    facts.push(
      createGroundedFact(
        'job_demand_tech',
        `Marché Tech / Développeur (${targetCountry})`,
        'Demande soutenue, forte compatibilité travail à distance',
        'Indices Tech Salaries / Jobboards 2025-2026',
        undefined,
        false,
        false
      )
    );

    return {
      profession: 'Métiers du numérique / Développeur',
      targetCountry,
      demandLevel: 'forte',
      indicativeGrossSalaryRange: {
        min: Math.round(medianSalary * 0.75),
        median: medianSalary,
        high: Math.round(medianSalary * 1.5)
      },
      languageRequirement: 'Anglais professionnel courant (souvent suffisant pour postes tech)',
      qualificationRecognitionRequired: false,
      qualificationNote: 'Portfolio, tests techniques et expérience priment sur l’équivalence de diplôme.',
      facts
    };
  }

  // General fallback for other or unspecified professions
  facts.push(
    createGroundedFact(
      'job_demand_general',
      `Marché général du travail (${targetCountry})`,
      'Estimation moyenne selon les statistiques d’emploi locales',
      undefined,
      undefined,
      false,
      false
    )
  );

  return {
    profession: profession || 'Profil généraliste / Reconversion',
    targetCountry,
    demandLevel: 'moyenne',
    indicativeGrossSalaryRange: {
      min: 1600,
      median: 2200,
      high: 3000
    },
    languageRequirement: 'Maîtrise de la langue du pays hôte indispensable pour la majorité des postes locaux',
    qualificationRecognitionRequired: false,
    qualificationNote: 'Vérifier si votre profession relève d’un ordre ou d’une réglementation spécifique.',
    facts
  };
}
