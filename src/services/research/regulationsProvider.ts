// src/services/research/regulationsProvider.ts
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface RegulationCheck {
  allowed: boolean;
  legalStatus: string;
  visaRequired?: string;
  mandatoryFormalities: string[];
  risks: string[];
  facts: GroundedFact[];
  legalWarning?: string;
}

/**
 * Checks immigration and employment legality rules.
 * Flags critical legal restrictions (such as working on an ESTA in the USA).
 */
export function checkImmigrationAndWorkLegality(
  destination: string,
  userCitizenship: string = 'EU', // or 'French'
  intendedActivity: 'work' | 'travel' | 'business' | 'freelance' | 'study' = 'work',
  providedVisa?: string
): RegulationCheck {
  const dest = destination.toLowerCase();
  const facts: GroundedFact[] = [];

  // Critical Case 1: USA with ESTA
  if (dest.includes('usa') || dest.includes('états-unis') || dest.includes('miami') || dest.includes('new york')) {
    if (providedVisa?.toLowerCase().includes('esta') || intendedActivity === 'work') {
      const warning =
        'ATTENTION LÉGALE STRICTE : L’ESTA (Visa Waiver Program) interdit formellement tout travail salarié ou rémunéré sur le territoire américain (INA § 217). Travailler sous ESTA expose à une expulsion immédiate et à une interdiction de territoire de 5 à 10 ans.';

      facts.push(
        createGroundedFact(
          'legal_esta_restriction',
          'Interdiction de travail sous ESTA (USA)',
          'Travail rémunéré formellement prohibé sous ESTA',
          'U.S. Citizenship and Immigration Services (USCIS) & Dept of State',
          'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html',
          false,
          true,
          'Un visa de travail dédié (H-1B, L-1, O-1, E-2 Investisseur ou J-1) est impérativement requis.'
        )
      );

      return {
        allowed: false,
        legalStatus: 'Prohibé sous statut touristique/ESTA',
        visaRequired: 'Visa de travail obligatoire (H-1B, L-1, E-2, etc.)',
        mandatoryFormalities: [
          'Offre d’emploi sponsorisée par une entreprise américaine pour H-1B',
          'Apport substantiel pour visa investisseur E-2 (minimum 80 000 $ - 100 000 $)',
          'Ou programme d’échange / stage visa J-1'
        ],
        risks: [
          'Expulsion immédiate et annulation de l’ESTA',
          'Interdiction de territoire américain de 5 à 10 ans',
          'Poursuites pénales fédérales pour travail clandestin'
        ],
        facts,
        legalWarning: warning
      };
    }
  }

  // Case 2: European Union / EEA / Switzerland
  const euCountries = [
    'espagne', 'portugal', 'italie', 'allemagne', 'belgique', 'pays-bas',
    'slovénie', 'slovenie', 'croatie', 'roumanie', 'bulgarie', 'grèce', 'grece',
    'malte', 'irlande', 'autriche', 'suède', 'suede', 'danemark', 'finlande', 'pologne'
  ];

  const isEuDestination = euCountries.some((c) => dest.includes(c));

  if (isEuDestination && (userCitizenship === 'EU' || userCitizenship.toLowerCase().includes('fr'))) {
    facts.push(
      createGroundedFact(
        'eu_freedom_movement',
        'Libre circulation des travailleurs au sein de l’Union Européenne',
        'Autorisation de travailler et de résider de plein droit (Directive 2004/38/CE)',
        'Commission Européenne - Portail Votre Europe',
        'https://europa.eu/youreurope/citizens/work/work-abroad/index_fr.htm',
        false,
        false,
        'Aucun visa requis pour les citoyens de l’UE. Enregistrement administratif local requis après 90 jours.'
      )
    );

    return {
      allowed: true,
      legalStatus: 'Libre circulation et travail de plein droit (UE)',
      mandatoryFormalities: [
        'Carte d’identité ou passeport UE en cours de validité',
        'Numéro fiscal local (ex. NIE en Espagne, NIF au Portugal, OIB en Croatie)',
        'Inscription au registre des résidents européens après 3 mois de séjour',
        'Affiliation à la sécurité sociale locale dès la prise de poste'
      ],
      risks: [
        'Délais administratifs d’obtention du numéro fiscal local (1 à 4 semaines)',
        'Reconnaissance de qualification obligatoire pour les métiers réglementés'
      ],
      facts
    };
  }

  // Case 3: General non-EU country (e.g. Japon, Maroc, Émirats, Canada, etc.)
  if (dest.includes('japon') || dest.includes('japan')) {
    facts.push(
      createGroundedFact(
        'japan_tourist_vs_work',
        'Séjour touristique vs Travail au Japon',
        'Exemption de visa touristique de 90 jours pour les citoyens français (interdiction de travailler)',
        'Ministère des Affaires Étrangères du Japon (MOFA)',
        'https://www.mofa.go.jp/j_info/visit/visa/index.html',
        false,
        false,
        'Visa de travail spécifique ou Visa Vacances-Travail (PVT 18-30 ans) nécessaire pour travailler.'
      )
    );

    return {
      allowed: intendedActivity === 'travel',
      legalStatus: intendedActivity === 'travel' ? 'Exemption visa touriste 90 jours' : 'Visa de travail requis',
      visaRequired: intendedActivity === 'travel' ? undefined : 'Certificate of Eligibility (COE) + Visa de travail ou PVT',
      mandatoryFormalities: [
        'Passeport valide pour la durée du séjour',
        'Billet de retour obligatoire à l’entrée pour les touristes',
        'Enregistrement à la mairie de quartier sous 14 jours si résident long terme'
      ],
      risks: [
        'Interdiction totale de travailler sous statut touristique',
        'Niveau de japonais N2/N1 souvent requis pour un emploi salarié local hors enseignement de langues'
      ],
      facts
    };
  }

  // Default: General international destination
  facts.push(
    createGroundedFact(
      'general_destination_regulation',
      `Réglementation séjour & travail (${destination})`,
      'Vérification auprès du consulat ou de l’ambassade recommandée',
      'Ministère de l’Europe et des Affaires étrangères (Conseils aux Voyageurs)',
      'https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/',
      false,
      false,
      'Tout travail local nécessite généralement un titre de séjour avec autorisation de travail.'
    )
  );

  return {
    allowed: true,
    legalStatus: 'Régime standard sous réserve des accords bilatéraux',
    mandatoryFormalities: [
      'Passeport en cours de validité (minimum 6 mois de validité résiduelle)',
      'Vérification des conditions de visa pour long séjour',
      'Assurance rapatriement et santé internationale'
    ],
    risks: ['Conditions de visa soumises aux quotas ou politiques migratoires nationales'],
    facts
  };
}

/**
 * Checks professional qualifications recognition (e.g. Electrician, Healthcare, etc.)
 */
export function checkTradeRegulation(
  tradeName: string,
  targetCountry: string
): {
  isRegulated: boolean;
  requiredEquivalences: string[];
  mandatoryCertifications: string[];
  facts: GroundedFact[];
} {
  const t = tradeName.toLowerCase();
  const c = targetCountry.toLowerCase();
  const facts: GroundedFact[] = [];

  if (t.includes('électricien') || t.includes('electricien') || t.includes('electrical')) {
    const isBelgium = c.includes('belgique') || c.includes('belgium');
    const isSpain = c.includes('espagne') || c.includes('spain');

    if (isBelgium) {
      facts.push(
        createGroundedFact(
          'belgium_electrician_rules',
          'Accès à la profession d’électricien en Belgique',
          'Compétences professionnelles requises (Titre de formation ou expérience prouvée)',
          'SPF Économie & Région Wallonne / Bruxelles',
          'https://economie.fgov.be/fr/themes/entreprises/creer-une-entreprise/conditions-dacces-la/competences-professionnelles',
          false,
          false,
          'Reconnaissance automatique possible avec le diplôme français (CAP/BEP/Bac Pro) via attestation UE.'
        )
      );

      return {
        isRegulated: true,
        requiredEquivalences: [
          'Attestation de qualification professionnelle européenne (Directive 2005/36/CE)',
          'Habilitation électrique RGIE (Règlement Général sur les Installations Électriques) belge'
        ],
        mandatoryCertifications: [
          'Assurance responsabilité civile professionnelle BTP',
          'Agrément RGIE pour mise en conformité des tableaux électriques'
        ],
        facts
      };
    }

    // General Electrician in EU
    facts.push(
      createGroundedFact(
        'eu_electrician_directive',
        'Reconnaissance mutuelle des qualifications électricien en UE',
        'Régie par la directive 2005/36/CE sur les qualifications professionnelles',
        'Commission Européenne - Base des professions réglementées',
        'https://ec.europa.eu/growth/tools-databases/regprof/',
        false,
        false
      )
    );

    return {
      isRegulated: true,
      requiredEquivalences: [
        'Attestation de conformité des diplômes (procédure UE)',
        'Normes électriques locales (ex. REBT en Espagne, NF C 15-100 en France, RGIE en Belgique)'
      ],
      mandatoryCertifications: [
        'Assurance RC Professionnelle / Décennale selon le pays',
        'Certification sécurité / habilitation basse tension'
      ],
      facts
    };
  }

  return {
    isRegulated: false,
    requiredEquivalences: ['Diplômes traduits ou CV au format standard Europass'],
    mandatoryCertifications: [],
    facts
  };
}
