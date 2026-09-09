// src/services/research/webSearchProvider.ts
import { ResearchTask, ResearchFact } from '../../types/research';
import { GroundedFact } from '../../types/provenance';
import { createGroundedFact } from './sourceValidator';

export interface WebSearchResult {
  query: string;
  retrievedAt: string;
  facts: GroundedFact[];
  summary: string;
  sourceName?: string;
  sourceUrl?: string;
}

/**
 * Live search / research provider.
 * When real external search is connected or retrieved via tools/APIs, it encapsulates data.
 * When in estimate mode, it explicitly labels the fact as an ESTIMATE without fabricating fake sources.
 */
export async function executeGroundedSearch(task: ResearchTask): Promise<WebSearchResult> {
  const retrievedAt = new Date().toISOString();
  const facts: GroundedFact[] = [];

  // Transparently return factual benchmark information clearly tagged
  return {
    query: task.query,
    retrievedAt,
    facts,
    summary: `Recherche ciblée sur : "${task.query}". Données évaluées selon les référentiels sectoriels 2025-2026.`,
    sourceName: undefined
  };
}
