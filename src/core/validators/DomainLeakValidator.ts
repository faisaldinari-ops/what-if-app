// src/core/validators/DomainLeakValidator.ts
import { ProjectDomain } from '../types';

const TRAVEL_TERMS = [
  'billet d’avion',
  'billet d\'avion',
  'billets d’avion',
  'billets d\'avion',
  'vol a/r',
  'vols a/r',
  'vol aller-retour',
  'hebergement touristique',
  'hébergement touristique',
  'auberge de jeunesse',
  'hotel hors saison',
  'hôtel hors saison'
];

const BUSINESS_TERMS = [
  'acre',
  'arce',
  'urssaf',
  'siret',
  'siren',
  'sarl',
  'sas',
  'kbis',
  'micro-entreprise',
  'auto-entrepreneur',
  'rc pro'
];

export interface DomainLeakValidationResult {
  isValid: boolean;
  leakedTerms: string[];
  message?: string;
}

export class DomainLeakValidator {
  /**
   * Validates that text or data content does not contain terms from incompatible domains.
   */
  static validateContent(
    content: string,
    primaryDomain: ProjectDomain
  ): DomainLeakValidationResult {
    const lower = content.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const leakedTerms: string[] = [];

    if (primaryDomain === 'business') {
      for (const term of TRAVEL_TERMS) {
        const normTerm = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (lower.includes(normTerm)) {
          leakedTerms.push(term);
        }
      }
    } else if (primaryDomain === 'travel') {
      for (const term of BUSINESS_TERMS) {
        const normTerm = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // Match word boundaries where possible
        const regex = new RegExp(`\\b${normTerm}\\b`, 'i');
        if (regex.test(lower)) {
          leakedTerms.push(term);
        }
      }
    }

    return {
      isValid: leakedTerms.length === 0,
      leakedTerms,
      message:
        leakedTerms.length > 0
          ? `Domain leakage detected for domain "${primaryDomain}": [${leakedTerms.join(', ')}]`
          : undefined
    };
  }

  /**
   * Sanitizes text by removing or neutralizing leaked terms if present.
   */
  static sanitizeContent(content: string, primaryDomain: ProjectDomain): string {
    let sanitized = content;
    if (primaryDomain === 'business') {
      sanitized = sanitized
        .replace(/billets?\s+d['’]avion\s+(ou|et)\s+hébergements?/gi, 'investissements prioritaires')
        .replace(/billets?\s+d['’]avion/gi, 'équipement initial')
        .replace(/hébergements?\s+au\s+meilleur\s+tarif\s+hors\s+saison/gi, 'matériel professionnel');
    } else if (primaryDomain === 'travel') {
      sanitized = sanitized
        .replace(/exonération\s+ACRE/gi, 'réservation anticipée')
        .replace(/immatriculation\s+INPI/gi, 'formalités de passeport/visa');
    }
    return sanitized;
  }
}
