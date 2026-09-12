// src/core/specialists/CostEstimator.ts
import { CostItem, OperatingModel } from '../types';

export interface CostEstimateResult {
  minimumEstimate: number;
  maximumEstimate: number;
  currency: string;
  costItems: CostItem[];
  operatingModel: OperatingModel;
  sources: Array<{ name: string; url?: string; note?: string }>;
  assumptions: string[];
  summary: string;
}

export class CostEstimator {
  static estimate(
    activity: string,
    operatingModel: OperatingModel = 'unknown',
    currency: string = 'EUR'
  ): CostEstimateResult {
    const act = activity.toLowerCase();

    // 0. Digital project (website, app, SaaS, e-commerce): cost is dominated by build approach,
    // not physical equipment — a free/DIY path genuinely exists and must be offered before any
    // paid estimate, per the "never declare impossible at 0€ without checking free options" rule.
    if (
      act.includes('site') ||
      act.includes('web') ||
      act.includes('application') ||
      act.includes('app ') ||
      act.includes('saas') ||
      act.includes('logiciel') ||
      act.includes('e-commerce') ||
      act.includes('ecommerce') ||
      act.includes('boutique en ligne') ||
      act.includes('plateforme')
    ) {
      return this.estimateDigitalProject(operatingModel, currency);
    }

    // 1. Beauty: Nails and/or Eyelashes (Prothésie ongulaire / Extensions de cils)
    if (
      act.includes('ongle') ||
      act.includes('cil') ||
      act.includes('faux cils') ||
      act.includes('esthetique') ||
      act.includes('manucure') ||
      act.includes('beaute')
    ) {
      return this.estimateBeautyNailsLashes(operatingModel, currency);
    }

    // 2. Electrician / Artisan
    if (act.includes('electr') || act.includes('artisan') || act.includes('plombier')) {
      return this.estimateArtisanElectrician(operatingModel, currency);
    }

    // 3. Tech / Dev / Freelance
    if (act.includes('dev') || act.includes('code') || act.includes('consultant') || act.includes('freelance')) {
      return this.estimateTechFreelance(operatingModel, currency);
    }

    // 4. Restaurant / Food
    if (act.includes('restaurant') || act.includes('snack') || act.includes('food truck') || act.includes('cafe')) {
      return this.estimateFoodRestaurant(operatingModel, currency);
    }

    // Generic business fallback
    return this.estimateGenericBusiness(activity, operatingModel, currency);
  }

  private static estimateBeautyNailsLashes(
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    const isHome = model === 'home';
    const isMobile = model === 'mobile';
    const isSalon = model === 'salon';

    const sources = [
      {
        name: 'Guichet Unique INPI / Entreprises.gouv.fr',
        url: 'https://formalites.entreprises.gouv.fr',
        note: 'Immatriculation gratuite en micro-entreprise (0 € de frais légaux d’enregistrement).'
      },
      {
        name: 'DGCCRF & Réglementation Sanitaire Esthétique',
        url: 'https://www.economie.gouv.fr/dgccrf/Securite/Produits-cosmetiques',
        note: 'Normes d’hygiène, désinfection des instruments et conformité CE des colles et gels.'
      },
      {
        name: 'Tarifs référents fournisseurs grossistes professionnels de l’esthétique',
        note: 'Moyennes constatées sur le matériel professionnel (lampes UV/LED, ponceuses, consommables certifiés).'
      }
    ];

    if (isSalon) {
      const items: CostItem[] = [
        {
          id: 'salon_lease',
          category: 'Immobilier & Bail',
          label: 'Dépôt de garantie bail commercial (3 mois) & frais d’entrée',
          min: 2400,
          max: 5500,
          isMandatory: true,
          source: 'Fédération Française des Salons de Beauté',
          notes: 'Varie fortement selon la zone géographique et la surface du local.'
        },
        {
          id: 'salon_works',
          category: 'Locaux',
          label: 'Aménagement, mise aux normes ERP, accessibilité & extraction d’air',
          min: 3000,
          max: 9000,
          isMandatory: true,
          source: 'Réglementation ERP / Hygiène',
          notes: 'Ventilation obligatoire pour les émanations de colles et poussières d’ongles.'
        },
        {
          id: 'salon_furniture',
          category: 'Mobilier & Accueil',
          label: 'Mobilier salon (Tables manucure aspirantes, fauteuils clients, comptoir, éclairage)',
          min: 1500,
          max: 4000,
          isMandatory: true,
          source: 'Grossistes Mobilier Esthétique'
        },
        {
          id: 'tech_equipment',
          category: 'Matériel Professionnel',
          label: 'Lampes UV/LED pro 48W+, ponceuses professionnelles avec aspiration',
          min: 300,
          max: 700,
          isMandatory: true,
          source: 'Catalogues Pro Esthétique'
        },
        {
          id: 'consumables',
          category: 'Stock Initial',
          label: 'Stock démarrage gels, vernis, boîtes d’extensions cils, colles médicales CE',
          min: 400,
          max: 1000,
          isMandatory: true,
          source: 'Grossistes Onglerie & Regard'
        },
        {
          id: 'hygiene',
          category: 'Hygiène & Conformité',
          label: 'Stérilisateur autoclave/UV, bacs à ultrasons, désinfectants hospitaliers, EPI',
          min: 150,
          max: 400,
          isMandatory: true,
          source: 'Norme DGCCRF'
        },
        {
          id: 'admin_pos',
          category: 'Gestion & Assurance',
          label: 'Caisse enregistreuse certifiée NF525, TPE bancaire et assurance RC Pro',
          min: 350,
          max: 900,
          isMandatory: true,
          source: 'INPI / Assurances Pro'
        }
      ];

      const minTotal = items.reduce((acc, i) => acc + i.min, 0);
      const maxTotal = items.reduce((acc, i) => acc + i.max, 0);

      return {
        minimumEstimate: minTotal,
        maximumEstimate: maxTotal,
        currency,
        costItems: items,
        operatingModel: 'salon',
        sources,
        assumptions: [
          'Création en micro-entreprise ou société unipersonnelle.',
          'Local commercial de 20 à 45 m² avec bail professionnel ou commercial 3/6/9.',
          'Conformité ERP (Établissement Recevant du Public) obligatoire.'
        ],
        summary: `Pour ouvrir un salon dédié aux ongles et faux cils dans un local commercial, le coût de démarrage se situe entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} €, principalement porté par le bail, les travaux d'agencement et les normes d'aération.`
      };
    }

    // Home or Mobile (or default lean home model)
    const items: CostItem[] = [
      {
        id: 'tech_uv_drill',
        category: 'Matériel Technique',
        label: 'Lampe UV/LED professionnelle (48W+) & ponceuse manucure avec embouts titane/céramique',
        min: 150,
        max: 280,
        isMandatory: true,
        source: 'Grossistes pro esthétique',
        notes: 'Matériel durable certifié CE pour éviter la surchauffe et garantir la polymérisation rapide.'
      },
      {
        id: 'nails_consumables',
        category: 'Consommables Ongles',
        label: 'Gels UV/polygel de construction, primers, vernis semi-permanents, cleaner, limes, pads',
        min: 180,
        max: 350,
        isMandatory: true,
        source: 'Marques professionnelles européennes',
        notes: 'Kit de départ permettant de réaliser entre 40 et 80 poses complètes.'
      },
      {
        id: 'lashes_kit',
        category: 'Kit Extensions de Cils',
        label: 'Boîtes de cils (soie/vison synthétique), colle médicale certifiée CE, pinces de précision & patchs',
        min: 120,
        max: 250,
        isMandatory: true,
        source: 'Fournisseurs spécialistes du regard',
        notes: 'Colle à séchage 1 à 2 secondes et pinces isolantes ultra-fines.'
      },
      {
        id: 'hygiene_sanitizing',
        category: 'Hygiène & Sécurité',
        label: 'Désinfectant instruments/surfaces de qualité médicale, gants nitrile, masques, bac de trempage',
        min: 70,
        max: 140,
        isMandatory: true,
        source: 'Arrêté du 12 décembre 2008 & DGCCRF',
        notes: 'Indispensable pour protéger clientes et praticienne de tout risque fongique ou bactérien.'
      },
      {
        id: 'lighting_furniture',
        category: 'Éclairage & Poste de travail',
        label: isMobile
          ? 'Table pliante mobile légère, mallette trolley professionnelle à roulettes & lampe nomade'
          : 'Lampe demi-lune (Half-moon daylight) ou lampe loupe sur pied & repose-main ergonomique',
        min: isMobile ? 120 : 80,
        max: isMobile ? 240 : 180,
        isMandatory: true,
        source: 'Mobilier pro esthétique',
        notes: 'Un éclairage sans ombre est indispensable pour la précision des extensions de cils.'
      },
      {
        id: 'admin_insurance',
        category: 'Légal & Assurance',
        label: 'Immatriculation micro-entreprise (0 €) & Assurance Responsabilité Civile Pro (RC Pro)',
        min: 60,
        max: 150,
        isMandatory: true,
        source: 'formalites.entreprises.gouv.fr / Assureurs spécialisés',
        notes: 'La création sur le guichet unique est gratuite. L’assurance RC Pro coûte environ 60 à 150 €/an.'
      }
    ];

    if (isMobile) {
      items.push({
        id: 'travel_fuel',
        category: 'Déplacements',
        label: 'Carburant et frais de déplacement des 2 premiers mois',
        min: 80,
        max: 160,
        isMandatory: false,
        source: 'Barème kilométrique moyen',
        notes: 'À ajuster selon ton rayon d’intervention géographique.'
      });
    }

    const minTotal = items.reduce((acc, i) => acc + i.min, 0);
    const maxTotal = items.reduce((acc, i) => acc + i.max, 0);

    const modelLabel = isMobile
      ? 'au domicile des clientes (en déplacement)'
      : isHome
      ? 'chez toi (à domicile)'
      : 'en mode indépendant lean (à domicile ou mobile)';

    return {
      minimumEstimate: minTotal,
      maximumEstimate: maxTotal,
      currency,
      costItems: items,
      operatingModel: model || 'home',
      sources,
      assumptions: [
        'Démarrage sous le statut micro-entrepreneur (frais d’immatriculation à 0 € sur l’INPI).',
        'Prestations combinées ongles (semi-permanent/gel) et extensions de cils (cil à cil/volume russe).',
        'Aucun loyer commercial à payer (activité exercée chez toi ou directement chez les clientes).'
      ],
      summary: `Pour démarrer une activité d'onglerie et faux cils ${modelLabel}, le budget réel nécessaire pour le matériel professionnel complet, l'hygiène et l'assurance se situe entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} €.`
    };
  }

  private static estimateArtisanElectrician(
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    const items: CostItem[] = [
      {
        id: 'tools',
        category: 'Outillage professionnel isolé 1000V',
        label: 'Valise d’outillage isolé certifié 1000V & VAT (Vérificateur d’Absence de Tension)',
        min: 600,
        max: 1200,
        isMandatory: true,
        source: 'Norme NF C 18-510'
      },
      {
        id: 'machinery',
        category: 'Électroportatif',
        label: 'Perforateur, rainureuse avec aspirateur plâtre/béton, visseuses pro',
        min: 800,
        max: 1800,
        isMandatory: true,
        source: 'Grossistes outillage'
      },
      {
        id: 'decennale',
        category: 'Assurances obligatoires',
        label: 'Garantie Décennale électricien & RC Pro artisanale (acompte ou première année)',
        min: 1200,
        max: 2200,
        isMandatory: true,
        source: 'Fédération Française du Bâtiment (FFB)'
      },
      {
        id: 'consumables',
        category: 'Fournitures de départ',
        label: 'Gaines, câbles, disjoncteurs, boîtes de dérivation, appareillages',
        min: 500,
        max: 1200,
        isMandatory: true,
        source: 'Fournisseurs matériel électrique pro'
      }
    ];

    const minTotal = items.reduce((acc, i) => acc + i.min, 0);
    const maxTotal = items.reduce((acc, i) => acc + i.max, 0);

    return {
      minimumEstimate: minTotal,
      maximumEstimate: maxTotal,
      currency,
      costItems: items,
      operatingModel: model,
      sources: [
        { name: 'FFB & CMA (Chambre de Métiers et de l’Artisanat)' },
        { name: 'Norme NF C 15-100 & NF C 18-510' }
      ],
      assumptions: ['Possession préalable d’un moyen de transport utilitaire.'],
      summary: `Pour démarrer en artisan électricien indépendant, le budget d’équipement de sécurité, outillage 1000V et assurance décennale obligatoire se situe entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} € (hors achat de camionnette).`
    };
  }

  private static estimateTechFreelance(
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    const items: CostItem[] = [
      {
        id: 'laptop',
        category: 'Matériel informatique',
        label: 'Ordinateur portable performant avec écran haute résolution',
        min: 800,
        max: 2000,
        isMandatory: true,
        source: 'Tarifs constructeurs informatique'
      },
      {
        id: 'saas_hosting',
        category: 'Outils & Hébergement',
        label: 'Nom de domaine, suite bureautique pro, licences d’outils de développement',
        min: 120,
        max: 350,
        isMandatory: true,
        source: 'Tarifs SaaS publics'
      },
      {
        id: 'bank_insurance',
        category: 'Compte pro & Assurance',
        label: 'Compte bancaire dédié pro et assurance RC Pro Tech / Cyber',
        min: 100,
        max: 300,
        isMandatory: true,
        source: 'Neo-banques pro et assureurs freelance'
      }
    ];

    const minTotal = items.reduce((acc, i) => acc + i.min, 0);
    const maxTotal = items.reduce((acc, i) => acc + i.max, 0);

    return {
      minimumEstimate: minTotal,
      maximumEstimate: maxTotal,
      currency,
      costItems: items,
      operatingModel: 'online',
      sources: [{ name: 'Maison des Freelances & INPI' }],
      assumptions: ['Activité 100% digitale télétravail ou remote.'],
      summary: `Pour débuter comme dev ou consultant freelance, le budget de démarrage se situe entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} €, essentiellement concentré sur le poste de travail et les outils professionnels.`
    };
  }

  private static estimateFoodRestaurant(
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    const isFoodTruck = model === 'mobile';
    const minTotal = isFoodTruck ? 15000 : 35000;
    const maxTotal = isFoodTruck ? 40000 : 120000;

    return {
      minimumEstimate: minTotal,
      maximumEstimate: maxTotal,
      currency,
      costItems: [
        {
          id: 'equipment',
          category: 'Cuisine pro & Hygiène',
          label: 'Équipement de cuisson inox, froid professionnel positif/négatif, bac dégraisseur',
          min: isFoodTruck ? 8000 : 20000,
          max: isFoodTruck ? 20000 : 50000,
          isMandatory: true,
          source: 'Fournisseurs CHR (Cafés, Hôtels, Restaurants)'
        },
        {
          id: 'lease_vehicle',
          category: isFoodTruck ? 'Véhicule équipé' : 'Bail & Dépôt',
          label: isFoodTruck ? 'Camion Food Truck homologué VASP' : 'Droit au bail ou pas-de-porte commercial',
          min: isFoodTruck ? 6000 : 12000,
          max: isFoodTruck ? 18000 : 45000,
          isMandatory: true,
          source: 'Bourse de commerce CHR'
        }
      ],
      operatingModel: model,
      sources: [{ name: 'UMIH (Union des Métiers et des Industries de l’Hôtellerie)' }],
      assumptions: ['Formation hygiène HACCP obligatoire comprise.'],
      summary: `Dans la restauration, le budget de démarrage dépend du format : comptez entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} € selon que vous optez pour un concept nomade (food truck) ou un restaurant avec salle assise.`
    };
  }

  private static estimateDigitalProject(
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    // Free/DIY path: no-code builders and free hosting tiers genuinely let someone launch a
    // basic website/landing page/MVP at 0€ (only a domain name is a real, small, optional cost).
    if (model === 'diy_free') {
      return {
        minimumEstimate: 0,
        maximumEstimate: 15,
        currency,
        costItems: [
          {
            id: 'hosting',
            category: 'Hébergement',
            label: 'Hébergement gratuit (GitHub Pages, Netlify, Vercel, Cloudflare Pages)',
            min: 0,
            max: 0,
            isMandatory: true,
            source: 'Offres gratuites des hébergeurs'
          },
          {
            id: 'builder',
            category: 'Outil de création',
            label: 'Créateur de site gratuit (Carrd, WordPress.com, Framer free tier) ou code fait soi-même',
            min: 0,
            max: 0,
            isMandatory: true,
            source: 'Offres gratuites des éditeurs'
          },
          {
            id: 'domain',
            category: 'Nom de domaine',
            label: 'Nom de domaine personnalisé (optionnel — un sous-domaine gratuit fonctionne aussi)',
            min: 0,
            max: 15,
            isMandatory: false,
            source: 'Registrars (OVH, Namecheap, Google Domains)'
          }
        ],
        operatingModel: model,
        sources: [{ name: 'GitHub Pages / Netlify / Vercel — offres gratuites' }],
        assumptions: [
          'Site statique ou vitrine simple, sans base de données ni fonctionnalités serveur complexes.',
          'Pas de nom de domaine personnalisé si le budget est strictement 0 € (sous-domaine gratuit type .vercel.app / .netlify.app).'
        ],
        summary: 'Un site simple peut être lancé à coût quasi nul avec un créateur de site gratuit et un hébergement gratuit ; seul un nom de domaine personnalisé (optionnel) coûte quelques euros par an.'
      };
    }

    // Custom development (freelance dev, or paying an agency): real cost, but still wide range.
    if (model === 'custom_dev') {
      return {
        minimumEstimate: 800,
        maximumEstimate: 5000,
        currency,
        costItems: [
          {
            id: 'dev_work',
            category: 'Développement',
            label: 'Développement sur-mesure (freelance ou agence, selon la complexité)',
            min: 600,
            max: 4000,
            isMandatory: true,
            source: 'Tarifs moyens constatés freelances (Malt, Codeur.com)'
          },
          {
            id: 'hosting_paid',
            category: 'Hébergement & domaine',
            label: 'Hébergement payant, nom de domaine, certificat SSL',
            min: 50,
            max: 300,
            isMandatory: true,
            source: 'Hébergeurs (OVH, Vercel Pro, AWS)'
          },
          {
            id: 'design',
            category: 'Design',
            label: 'Design / identité visuelle (si non fait soi-même)',
            min: 150,
            max: 700,
            isMandatory: false,
            source: 'Moyennes constatées du secteur'
          }
        ],
        operatingModel: model,
        sources: [{ name: 'Places de marché freelance (Malt, Codeur.com)' }],
        assumptions: ['Site ou app avec fonctionnalités sur-mesure (base de données, comptes utilisateurs, paiement...).'],
        summary: 'Un site ou une app avec développement sur-mesure coûte en général entre 800 € et 5 000 € selon la complexité et si tu fais appel à un freelance ou une agence.'
      };
    }

    // Operating model not yet known: no estimate should be produced yet (the QuestionPlanner
    // is responsible for asking free/DIY vs custom-dev before this is ever called in practice).
    return {
      minimumEstimate: 0,
      maximumEstimate: 5000,
      currency,
      costItems: [],
      operatingModel: model,
      sources: [],
      assumptions: ['Fourchette large car le mode de création (gratuit/no-code ou développement sur-mesure) n’est pas encore précisé.'],
      summary: 'Le coût dépend surtout de la manière dont tu veux créer ton site : gratuitement avec des outils no-code, ou en développement sur-mesure.'
    };
  }

  private static estimateGenericBusiness(
    activity: string,
    model: OperatingModel,
    currency: string
  ): CostEstimateResult {
    const isSalon = model === 'salon';
    const minTotal = isSalon ? 5000 : 500;
    const maxTotal = isSalon ? 18000 : 2000;

    return {
      minimumEstimate: minTotal,
      maximumEstimate: maxTotal,
      currency,
      costItems: [
        {
          id: 'setup_gear',
          category: 'Équipement de base',
          label: 'Matériel et équipement initial lié à l’activité',
          min: isSalon ? 3000 : 300,
          max: isSalon ? 12000 : 1200,
          isMandatory: true,
          source: 'Moyennes constatées du secteur'
        },
        {
          id: 'admin_legal',
          category: 'Frais légaux & Assurance',
          label: 'Assurance professionnelle RC Pro et immatriculation',
          min: 100,
          max: 350,
          isMandatory: true,
          source: 'INPI / formalites.entreprises.gouv.fr'
        }
      ],
      operatingModel: model,
      sources: [{ name: 'INPI & Bpifrance Création' }],
      assumptions: ['Activité démarrée en micro-entreprise.'],
      summary: `Pour lancer ce type d’activité, l’investissement de départ initial se situe entre ${minTotal.toLocaleString()} € et ${maxTotal.toLocaleString()} € selon le matériel choisi et le mode d’exercice.`
    };
  }
}
