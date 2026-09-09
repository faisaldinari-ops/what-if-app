// src/services/research/sourceValidator.ts
import { ConfidenceLevel } from '../../types/context';
import { DataOrigin, Freshness, GroundedFact } from '../../types/provenance';

export type SourceTier =
  | 'official' // Government, ministries, official legal journals
  | 'international_body' // OECD, Eurostat, World Bank, UN
  | 'recognized_platform' // Verified travel/job platforms (when queried)
  | 'specialized' // Trade unions, chambers of commerce, official associations
  | 'general_benchmark' // Industry average, estimated benchmark
  | 'unverified';

export interface SourceValidationResult {
  sourceName: string;
  sourceUrl?: string;
  tier: SourceTier;
  confidence: ConfidenceLevel;
  freshness: Freshness;
  isLegitimate: boolean;
  provenance: DataOrigin;
  notes?: string;
}

/**
 * Validates and classifies information sources.
 * Rule: NEVER invent a source. If no live lookup occurred, transparently mark as ESTIMATE or ASSUMPTION.
 */
export function validateSourceProvenance(
  sourceName?: string,
  retrievedAt?: string,
  isLiveQuery: boolean = false
): SourceValidationResult {
  const currentYear = 2026;

  if (!sourceName || sourceName.trim() === '') {
    return {
      sourceName: 'Estimation indicative (sans source externe directe)',
      tier: 'general_benchmark',
      confidence: 'low',
      freshness: 'UNKNOWN',
      isLegitimate: false,
      provenance: 'ESTIMATE',
      notes: 'Aucune source externe directe disponible ; valeur basée sur des ordres de grandeur généraux.'
    };
  }

  const s = sourceName.toLowerCase();

  // Tier 1: Official / Governmental
  if (
    s.includes('service-public') ||
    s.includes('legifrance') ||
    s.includes('urssaf') ||
    s.includes('impots.gouv') ||
    s.includes('insee') ||
    s.includes('travail-emploi.gouv') ||
    s.includes('state.gov') ||
    s.includes('uscis') ||
    s.includes('gov.uk') ||
    s.includes('boe.es') ||
    s.includes('diario') ||
    s.includes('ministère') ||
    s.includes('ministry') ||
    s.includes('ambassade') ||
    s.includes('consulat')
  ) {
    return {
      sourceName,
      tier: 'official',
      confidence: 'high',
      freshness: isLiveQuery ? 'LIVE' : 'RECENT',
      isLegitimate: true,
      provenance: isLiveQuery ? 'LIVE_SOURCE' : 'INTERNAL_BENCHMARK',
      notes: 'Source officielle gouvernementale ou administrative.'
    };
  }

  // Tier 2: International bodies
  if (
    s.includes('eurostat') ||
    s.includes('oecd') ||
    s.includes('ocde') ||
    s.includes('banque mondiale') ||
    s.includes('world bank') ||
    s.includes('imf') ||
    s.includes('fmi')
  ) {
    return {
      sourceName,
      tier: 'international_body',
      confidence: 'high',
      freshness: isLiveQuery ? 'LIVE' : 'RECENT',
      isLegitimate: true,
      provenance: isLiveQuery ? 'LIVE_SOURCE' : 'INTERNAL_BENCHMARK',
      notes: 'Institution statistique internationale de référence.'
    };
  }

  // Tier 3: Specialized trade / legal bodies
  if (
    s.includes('cma') ||
    s.includes('cci') ||
    s.includes('ffb') ||
    s.includes('capeb') ||
    s.includes('ordre') ||
    s.includes('barreau') ||
    s.includes('chambre des métiers')
  ) {
    return {
      sourceName,
      tier: 'specialized',
      confidence: 'high',
      freshness: isLiveQuery ? 'LIVE' : 'RECENT',
      isLegitimate: true,
      provenance: isLiveQuery ? 'LIVE_SOURCE' : 'INTERNAL_BENCHMARK',
      notes: 'Organisme professionnel officiel / chambre consulaire.'
    };
  }

  // Tier 4: Recognized platforms (only if truly live or explicitly tracked benchmark)
  if (
    s.includes('numbeo') ||
    s.includes('glassdoor') ||
    s.includes('indeed') ||
    s.includes('skyscanner') ||
    s.includes('kayak') ||
    s.includes('booking')
  ) {
    return {
      sourceName: isLiveQuery ? sourceName : `${sourceName} (Référentiel indicatif)`,
      tier: 'recognized_platform',
      confidence: isLiveQuery ? 'high' : 'medium',
      freshness: isLiveQuery ? 'LIVE' : 'RECENT',
      isLegitimate: true,
      provenance: isLiveQuery ? 'LIVE_SOURCE' : 'INTERNAL_BENCHMARK',
      notes: isLiveQuery
        ? 'Données de plateforme agrégée en temps réel.'
        : 'Données indicatives issues de référentiels de marché.'
    };
  }

  // General or fallback
  return {
    sourceName,
    tier: 'general_benchmark',
    confidence: 'medium',
    freshness: 'RECENT',
    isLegitimate: true,
    provenance: 'INTERNAL_BENCHMARK',
    notes: 'Données issues de référentiels sectoriels indicatifs.'
  };
}

/**
 * Creates a verified GroundedFact object enforcing transparency.
 */
export function createGroundedFact(
  id: string,
  label: string,
  value: string | number,
  sourceName?: string,
  sourceUrl?: string,
  isLive: boolean = false,
  isLegalWarning: boolean = false,
  notes?: string
): GroundedFact {
  const validated = validateSourceProvenance(sourceName, undefined, isLive);

  return {
    id,
    label,
    value,
    origin: validated.provenance,
    sourceName: validated.sourceName,
    sourceUrl,
    retrievedAt: isLive ? new Date().toISOString() : '2026',
    confidence: validated.confidence,
    freshness: validated.freshness,
    isLegalWarning,
    notes: notes || validated.notes
  };
}
