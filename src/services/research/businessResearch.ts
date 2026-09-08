// src/services/research/businessResearch.ts
import { BusinessBlueprint } from '../../types/planning';
import { ResearchFact } from '../../types/research';

export function getBusinessBlueprint(prompt: string, availableBudget: number = 0): {
  blueprint: BusinessBlueprint;
  facts: ResearchFact[];
} {
  const p = prompt.toLowerCase();

  // 1. Electrician / Plumber / Tradesperson
  if (p.includes('électricien') || p.includes('electricien') || p.includes('plombier') || p.includes('artisan')) {
    return {
      blueprint: {
        businessType: 'Artisan du BTP / Électricien indépendant',
        minimalVersion: {
          title: 'Lancement Agile (Solo & Outillage indispensable)',
          description: 'Démarrage en micro-entreprise avec outillage électroportatif pro essentiel, assurance décennale, et véhicule personnel existant aménagé sommairement.',
          startupCost: 2800,
          monthlyRunningCost: 420, // Décennale, logiciel devis/facture, carburant
          recommendedReserve: 2500,
          breakEvenMonthlyRevenue: 2200,
          risk: 'low',
          estimatedLaunchWeeks: 3
        },
        realisticVersion: {
          title: 'Artisan Équipé (Véhicule dédié & Stock de départ)',
          description: 'Achat d’un utilitaire d’occasion en leasing ou crédit-bail, pack complet outillage de contrôle/sécurité certifié, flocage véhicule et site vitrine local.',
          startupCost: 7500,
          monthlyRunningCost: 850,
          recommendedReserve: 4500,
          breakEvenMonthlyRevenue: 3800,
          risk: 'medium',
          estimatedLaunchWeeks: 6
        },
        completeVersion: {
          title: 'Entreprise BTP Évolutive (Stock complet & Apport véhicule neuf)',
          description: 'Structure en société (SASU / SARL), utilitaire neuf équipé, compte pro avec découvert autorisé négocié, outillage complet et budget pub géolocalisée Google Local Services.',
          startupCost: 16000,
          monthlyRunningCost: 1450,
          recommendedReserve: 8000,
          breakEvenMonthlyRevenue: 5600,
          risk: 'medium',
          estimatedLaunchWeeks: 10
        }
      },
      facts: [
        {
          label: 'Garantie Décennale obligatoire électricien',
          value: 'Environ 900 € à 1 500 € / an selon l’expérience',
          source: 'Fédération Française du Bâtiment (FFB) 2025',
          confidence: 'high',
          isEstimate: false
        },
        {
          label: 'Stage de préparation à l’installation (SPI)',
          value: 'Facultatif depuis la loi PACTE (0 € d’obligation légale)',
          source: 'Chambre de Métiers et de l’Artisanat (CMA)',
          confidence: 'high',
          isEstimate: false
        }
      ]
    };
  }

  // 2. Barber Shop / Salon de coiffure
  if (p.includes('barber') || p.includes('coiffure') || p.includes('salon')) {
    return {
      blueprint: {
        businessType: 'Barber Shop / Salon de coiffure',
        minimalVersion: {
          title: 'Location de fauteuil ou Barber à domicile',
          description: 'Exercice en fauteuil partagé dans un salon existant ou prestations privées haut de gamme à domicile. Zéro bail commercial contraignant.',
          startupCost: 2200,
          monthlyRunningCost: 650, // Location fauteuil + consommables
          recommendedReserve: 2000,
          breakEvenMonthlyRevenue: 2400,
          risk: 'low',
          estimatedLaunchWeeks: 4
        },
        realisticVersion: {
          title: 'Boutique Barber Indépendant (Reprise de bail modeste)',
          description: 'Reprise d’un bail commercial 2 fauteuils dans une ville moyenne, aménagement vintage soigné, caisse aux normes et stock produits barbe/cheveux.',
          startupCost: 14500,
          monthlyRunningCost: 2100, // Loyer, électricité, charges, logiciel
          recommendedReserve: 5000,
          breakEvenMonthlyRevenue: 4200,
          risk: 'medium',
          estimatedLaunchWeeks: 12
        },
        completeVersion: {
          title: 'Concept Store Barber Premium (3+ fauteuils, salarié)',
          description: 'Emplacement n°1 ou centre-ville animé, fauteuils Takara Belmont, espace boisson/lounge, premier barbier employé à temps partiel.',
          startupCost: 32000,
          monthlyRunningCost: 4800,
          recommendedReserve: 12000,
          breakEvenMonthlyRevenue: 8500,
          risk: 'high',
          estimatedLaunchWeeks: 18
        }
      },
      facts: [
        {
          label: 'Diplôme requis (BP Coiffure ou équivalence)',
          value: 'BP Coiffure ou BM obligatoire pour ouvrir un salon physique avec salariés',
          source: 'Loi n° 46-1173 réglementant les conditions d’accès à la profession de coiffeur',
          confidence: 'high',
          isEstimate: false
        },
        {
          label: 'Caution et pas-de-porte commercial moyen',
          value: 'Compter 3 à 6 mois de loyer d’avance pour un bail 3/6/9',
          source: 'Fédération Nationale de l’Immobilier (FNAIM) 2025',
          confidence: 'high',
          isEstimate: false
        }
      ]
    };
  }

  // 3. Digital Project / Site internet / Application / SaaS
  if (p.includes('site') || p.includes('application') || p.includes('app') || p.includes('saas') || p.includes('plateforme')) {
    return {
      blueprint: {
        businessType: 'Projet Digital (Site / App / SaaS)',
        minimalVersion: {
          title: 'Version 100% Gratuite (0 € MVP)',
          description: 'Hébergement sur plateformes gratuites (Vercel, Cloudflare, GitHub Pages), base de données gratuite (Supabase Free tier), nom de sous-domaine gratuit et outils no-code freemium.',
          startupCost: 0,
          monthlyRunningCost: 0,
          recommendedReserve: 0,
          breakEvenMonthlyRevenue: 0,
          risk: 'low',
          estimatedLaunchWeeks: 1
        },
        realisticVersion: {
          title: 'Version Économique Pro (30 € - 100 €)',
          description: 'Nom de domaine personnalisé (.com ou .fr), hébergement pro sans badge publicitaire, boîte email pro Google Workspace, outil d’emailing et compte bancaire pro en ligne.',
          startupCost: 65,
          monthlyRunningCost: 25,
          recommendedReserve: 200,
          breakEvenMonthlyRevenue: 80,
          risk: 'low',
          estimatedLaunchWeeks: 2
        },
        completeVersion: {
          title: 'Version Croissance / Startup',
          description: 'Dépôt de marque à l’INPI, abonnement outils IA avancés, budget publicité d’acquisition test (Meta / Google Ads), statut juridique SASU.',
          startupCost: 850,
          monthlyRunningCost: 190,
          recommendedReserve: 1500,
          breakEvenMonthlyRevenue: 600,
          risk: 'medium',
          estimatedLaunchWeeks: 4
        }
      },
      facts: [
        {
          label: 'Nom de domaine + email professionnel',
          value: 'Environ 12 € à 25 € / an pour un .fr ou .com',
          source: 'Tarifs AFNIC / Registrars 2025',
          confidence: 'high',
          isEstimate: false
        },
        {
          label: 'Tiers gratuits d’hébergement web moderne',
          value: 'Vercel, Supabase, Cloudflare Pages offrent des quotas généreux à 0 €',
          source: 'Spécifications officielles des fournisseurs cloud',
          confidence: 'high',
          isEstimate: false
        }
      ]
    };
  }

  // General Business Default
  return {
    blueprint: {
      businessType: 'Activité indépendante / Prestation de service',
      minimalVersion: {
        title: 'Formule Agile Solo (Moyens du bord)',
        description: 'Démarrage en micro-entreprise sans local commercial ni charges fixes lourdes. Test direct auprès d’un premier cercle de clients.',
        startupCost: Math.min(1500, Math.max(200, availableBudget * 0.4)),
        monthlyRunningCost: 150,
        recommendedReserve: 1500,
        breakEvenMonthlyRevenue: 1200,
        risk: 'low',
        estimatedLaunchWeeks: 3
      },
      realisticVersion: {
        title: 'Formule Recommandée (Équipement & Présence)',
        description: 'Équipement professionnel adapté, communication locale ou digitale, outils de gestion et trésorerie de sécurité de 3 mois.',
        startupCost: Math.min(6000, Math.max(1200, availableBudget * 0.8)),
        monthlyRunningCost: 450,
        recommendedReserve: 3500,
        breakEvenMonthlyRevenue: 2400,
        risk: 'medium',
        estimatedLaunchWeeks: 6
      },
      completeVersion: {
        title: 'Formule Ambitieuse (Société & Communication forte)',
        description: 'Création de société, investissement initial dans du matériel neuf garanti, campagne d’acquisition payante et accompagnement comptable dédié.',
        startupCost: Math.max(10000, availableBudget * 1.5),
        monthlyRunningCost: 950,
        recommendedReserve: 6000,
        breakEvenMonthlyRevenue: 4000,
        risk: 'high',
        estimatedLaunchWeeks: 12
      }
    },
    facts: [
      {
        label: 'Statut Micro-Entreprise en France',
        value: 'Immatriculation 100% gratuite sur le guichet unique de l’INPI',
        source: 'INPI & Urssaf 2025',
        confidence: 'high',
        isEstimate: false
      },
      {
        label: 'Cotisations sociales auto-entrepreneur',
        value: 'Cotisations payées uniquement au prorata du chiffre d’affaires réel encaissé (0 € si 0 CA)',
        source: 'Code de la Sécurité Sociale',
        confidence: 'high',
        isEstimate: false
      }
    ]
  };
}
