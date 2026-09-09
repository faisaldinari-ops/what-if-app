// src/services/research/businessProvider.ts
import { BusinessBlueprint } from '../../types/planning';
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface BusinessAssessment {
  blueprint: BusinessBlueprint;
  facts: GroundedFact[];
  legalFormalities: string[];
  mandatoryInsurances: string[];
  zeroBudgetFeasible: boolean;
  zeroBudgetStrategy?: string;
}

/**
 * Generates grounded business blueprints dynamically across any sector.
 * Includes explicit 0 € start strategies for digital and low-barrier businesses.
 */
export function assessBusinessFeasibility(
  prompt: string,
  availableBudget: number = 0,
  targetCountry: string = 'France'
): BusinessAssessment {
  const p = prompt.toLowerCase();
  const facts: GroundedFact[] = [];
  const legalFormalities: string[] = [];
  const mandatoryInsurances: string[] = [];

  // 1. Digital project / Website / Software / Freelancing at 0 €
  if (
    p.includes('site') ||
    p.includes('digital') ||
    p.includes('web') ||
    p.includes('application') ||
    p.includes('freelance') ||
    p.includes('saas') ||
    p.includes('e-commerce') ||
    p.includes('blog') ||
    (availableBudget === 0 && !p.includes('restaurant') && !p.includes('barber') && !p.includes('bâtiment'))
  ) {
    facts.push(
      createGroundedFact(
        'inpi_free_registration',
        'Immatriculation d’entreprise individuelle (France)',
        'Gratuit (0 € de frais légaux d’immatriculation pour micro-entreprise)',
        'Guichet Unique INPI / formalites.entreprises.gouv.fr',
        'https://formalites.entreprises.gouv.fr',
        false,
        false,
        'Aucun capital social minimum requis. Statut micro-entreprise exonéré de TVA jusqu’au seuil de franchise.'
      ),
      createGroundedFact(
        'free_digital_infrastructure',
        'Infrastructures digitales gratuites de démarrage',
        'Hébergement gratuit (Vercel, Netlify, GitHub Pages, Cloudflare)',
        'Documentation Cloud & Open-Source 2026',
        undefined,
        false,
        false,
        'Possibilité technique totale de construire et déployer un MVP sans dépenser 1 €.'
      )
    );

    legalFormalities.push(
      'Déclaration de début d’activité en micro-entreprise sur le Guichet Unique (0 €)',
      'Déclaration mensuelle ou trimestrielle du chiffre d’affaires à l’URSSAF (0 € si 0 € de CA)',
      'Compte bancaire dédié séparé (obligatoire seulement si CA > 10 000 € 2 années de suite)'
    );

    mandatoryInsurances.push('Assurance Responsabilité Civile Professionnelle (recommandée, non obligatoire pour le pur digital)');

    return {
      blueprint: {
        businessType: 'Projet Numérique / Service Digital Agile',
        minimalVersion: {
          title: 'Version 0 € (Bootstrap 100 % Gratuit)',
          description: 'Lancement immédiat en micro-entreprise avec outils gratuits : hébergement gratuit (Vercel/GitHub), base de données gratuite (Firebase/Supabase), acquisition 100 % organique (réseaux, prospection directe, contenu).',
          startupCost: 0,
          monthlyRunningCost: 0,
          recommendedReserve: 0,
          breakEvenMonthlyRevenue: 1,
          risk: 'low',
          estimatedLaunchWeeks: 1
        },
        realisticVersion: {
          title: 'Version Pro Indépendante (Nom de domaine & Outils essentiels)',
          description: 'Achat d’un nom de domaine personnalisé (.com/.fr), hébergement pro sans limitation, boîte email professionnelle (Google Workspace ou Proton), et petit budget d’outillage SaaS.',
          startupCost: 150,
          monthlyRunningCost: 45,
          recommendedReserve: 500,
          breakEvenMonthlyRevenue: 250,
          risk: 'low',
          estimatedLaunchWeeks: 3
        },
        completeVersion: {
          title: 'Structure SASU & Budget d’Acquisition Client',
          description: 'Création de société (frais de greffe et annonce légale ~300 €), identité visuelle par un designer, budget publicitaire initial (Google Ads / Meta) et outils marketing d’automatisation.',
          startupCost: 2500,
          monthlyRunningCost: 350,
          recommendedReserve: 3000,
          breakEvenMonthlyRevenue: 1500,
          risk: 'medium',
          estimatedLaunchWeeks: 8
        }
      },
      facts,
      legalFormalities,
      mandatoryInsurances,
      zeroBudgetFeasible: true,
      zeroBudgetStrategy:
        'Commencez par valider l’intérêt client et construire le produit avec l’écosystème gratuit avant tout investissement payant. La micro-entreprise ne vous coûte rien tant que vous ne facturez pas.'
    };
  }

  // 2. Agriculture / Special projects (e.g. Snail farm in Romania / Élevage escargots Roumanie)
  if (p.includes('escargot') || p.includes('snail') || p.includes('héliciculture') || p.includes('agricole') || p.includes('ferme')) {
    facts.push(
      createGroundedFact(
        'snail_farming_standards',
        'Élevage hélicicole (Héliciculture) & Normes Sanitaires',
        'Parc d’élevage extérieur ou tunnels avec brumisation, conformité sanitaire DSV',
        'Ministère de l’Agriculture / Agence sanitaire européenne',
        undefined,
        false,
        false,
        'Cycle d’élevage de 6 à 8 mois. Transformation et abattage soumis aux normes d’hygiène vétérinaires strictes.'
      ),
      createGroundedFact(
        'romania_business_conditions',
        'Implantation agricole / PME en Roumanie (SRL)',
        'Création de société SRL avec capital symbolique (1 RON), coûts fonciers très compétitifs',
        'Chambre de Commerce et d’Industrie Franco-Roumaine (CCIFER)',
        'https://www.ccifer.ro/',
        false,
        false,
        'Accès possible aux fonds européens FEADER pour le développement rural selon localisation.'
      )
    );

    legalFormalities.push(
      'Immatriculation de société (SRL en Roumanie ou statut exploitant agricole)',
      'Déclaration de cheptel et agrément sanitaire vétérinaire (ANSVSA en Roumanie)',
      'Bail rural ou titre de propriété du terrain agricole avec source d’eau certifiée'
    );

    mandatoryInsurances.push(
      'Assurance responsabilité civile exploitation agricole',
      'Assurance pertes de cheptel / aléas climatiques (fortement conseillée)'
    );

    return {
      blueprint: {
        businessType: 'Exploitation Hélicicole / Ferme d’escargots',
        minimalVersion: {
          title: 'Parc Pilote d’Expérimentation (Petite surface)',
          description: 'Terrain loué de 500 m², filets anti-fuites et clôture électrique basse tension, naissains d’escargots Gros Gris (Helix aspersa maxima), brumisation manuelle.',
          startupCost: 4500,
          monthlyRunningCost: 280,
          recommendedReserve: 2000,
          breakEvenMonthlyRevenue: 1200,
          risk: 'medium',
          estimatedLaunchWeeks: 12
        },
        realisticVersion: {
          title: 'Exploitation Semi-Professionnelle avec Transformation',
          description: 'Enclos aménagé de 2 000 m², système d’arrosage automatisé avec régulateur d’hygrométrie, laboratoire modulaire aux normes CE pour le calibrage et l’abattage, partenariats avec restaurants locaux.',
          startupCost: 14000,
          monthlyRunningCost: 650,
          recommendedReserve: 5000,
          breakEvenMonthlyRevenue: 2800,
          risk: 'medium',
          estimatedLaunchWeeks: 24
        },
        completeVersion: {
          title: 'Filière Complète (Reproduction en bâtiment chauffé + Export UE)',
          description: 'Bâtiment de reproduction climatisé pour pontes précoces, serres de grossissement, atelier de transformation surgélation/conserve agréé UE et réseau de distribution export.',
          startupCost: 42000,
          monthlyRunningCost: 1800,
          recommendedReserve: 15000,
          breakEvenMonthlyRevenue: 6500,
          risk: 'high',
          estimatedLaunchWeeks: 40
        }
      },
      facts,
      legalFormalities,
      mandatoryInsurances,
      zeroBudgetFeasible: false,
      zeroBudgetStrategy:
        'L’héliciculture nécessite impérativement un terrain irrigué, des naissains et des clôtures sécurisées. À 0 €, commencez par vous former gratuitement auprès de groupements hélicicoles et faire un stage chez un éleveur pour valider le savoir-faire avant de mobiliser du capital.'
    };
  }

  // 3. Electrician / Artisan BTP
  if (p.includes('électricien') || p.includes('electricien') || p.includes('artisan') || p.includes('plombier')) {
    facts.push(
      createGroundedFact(
        'decennale_mandatory',
        'Garantie Décennale obligatoire pour artisans du bâtiment',
        'Loi Spinetta : obligatoire dès le 1er chantier (environ 1 000 € à 1 600 € / an)',
        'Fédération Française du Bâtiment (FFB) & Code des Assurances',
        undefined,
        false,
        false,
        'Tout travail électrique sans attestation décennale constitue un délit pénal.'
      ),
      createGroundedFact(
        'cma_qualification_rules',
        'Qualification professionnelle obligatoire BTP',
        'CAP, BEP, Bac Pro ou 3 ans d’expérience professionnelle justifiée',
        'Chambre de Métiers et de l’Artisanat (CMA)',
        'https://www.artisanat.fr/',
        false,
        false
      )
    );

    legalFormalities.push(
      'Immatriculation au Registre National des Entreprises (RNE) via le Guichet Unique (0 €)',
      'Justification de qualification professionnelle (diplôme ou attestation d’expérience 3 ans)'
    );

    mandatoryInsurances.push('Assurance Responsabilité Civile Décennale (OBLIGATOIRE avant toute intervention)');

    return {
      blueprint: {
        businessType: 'Artisanat du BTP / Électricien indépendant',
        minimalVersion: {
          title: 'Démarrage Solo Agile (Véhicule perso existant)',
          description: 'Micro-entreprise, outillage électroportatif de sécurité indispensable, assurance décennale négociée mensualisée, véhicule personnel existant aménagé sommairement.',
          startupCost: 2600,
          monthlyRunningCost: 380,
          recommendedReserve: 2000,
          breakEvenMonthlyRevenue: 2000,
          risk: 'low',
          estimatedLaunchWeeks: 3
        },
        realisticVersion: {
          title: 'Artisan Équipé (Utilitaire dédié & Stock de base)',
          description: 'Utilitaire d’occasion ou LOA, outillage complet de mesure et contrôle certifié (testeur différentiel, mégohmmètre), stock de départ appareillage et protection.',
          startupCost: 7500,
          monthlyRunningCost: 750,
          recommendedReserve: 4000,
          breakEvenMonthlyRevenue: 3600,
          risk: 'medium',
          estimatedLaunchWeeks: 6
        },
        completeVersion: {
          title: 'Entreprise BTP en Société (SARL/SASU + Véhicule neuf)',
          description: 'Création de société, utilitaire neuf floqué, compte professionnel avec ligne de crédit négociée, matériel complet et adhésion à des réseaux d’apporteurs d’affaires.',
          startupCost: 16000,
          monthlyRunningCost: 1400,
          recommendedReserve: 8000,
          breakEvenMonthlyRevenue: 5500,
          risk: 'medium',
          estimatedLaunchWeeks: 10
        }
      },
      facts,
      legalFormalities,
      mandatoryInsurances,
      zeroBudgetFeasible: false,
      zeroBudgetStrategy:
        'Le métier d’électricien impose légalement une assurance décennale et un outillage de sécurité minimale. Si vous avez 0 €, travaillez d’abord quelques mois comme salarié ou intérimaire pour accumuler les 2 500 € d’outillage et de décennale indispensables.'
    };
  }

  // 4. General / Physical commerce or restaurant
  facts.push(
    createGroundedFact(
      'business_general_formalism',
      'Création d’entreprise standard',
      'Frais d’immatriculation nuls en micro-entreprise, variables en société commerciale (150-300 €)',
      'Direction Générale des Entreprises (DGE)',
      'https://entreprendre.service-public.fr',
      false,
      false
    )
  );

  return {
    blueprint: {
      businessType: 'Entreprise / Activité commerciale indépendante',
      minimalVersion: {
        title: 'Micro-Activité de Test (Démarrage allégé)',
        description: 'Vente directe ou prestation testée à petite échelle sans local commercial coûteux, validation du produit auprès des premiers clients.',
        startupCost: 1200,
        monthlyRunningCost: 200,
        recommendedReserve: 1500,
        breakEvenMonthlyRevenue: 1500,
        risk: 'low',
        estimatedLaunchWeeks: 3
      },
      realisticVersion: {
        title: 'Lancement Professionnel Structuré',
        description: 'Bail commercial ou atelier partagé, premier stock, communication locale et réserve de trésorerie de 3 mois de charges.',
        startupCost: 8000,
        monthlyRunningCost: 950,
        recommendedReserve: 4500,
        breakEvenMonthlyRevenue: 3800,
        risk: 'medium',
        estimatedLaunchWeeks: 8
      },
      completeVersion: {
        title: 'Structure Complète en Société Commerciale',
        description: 'Emplacement premium avec droit au bail, agencement professionnel, campagne marketing d’ouverture et fonds de roulement solide.',
        startupCost: 25000,
        monthlyRunningCost: 2200,
        recommendedReserve: 12000,
        breakEvenMonthlyRevenue: 7500,
        risk: 'high',
        estimatedLaunchWeeks: 16
      }
    },
    facts,
    legalFormalities,
    mandatoryInsurances,
    zeroBudgetFeasible: availableBudget === 0,
    zeroBudgetStrategy: 'Tester la demande par pré-commandes ou partenariats avant d’engager des frais fixes.'
  };
}
