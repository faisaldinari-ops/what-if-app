// src/services/research/webSearchProvider.ts
import { ResearchTask } from '../../types/research';
import { GroundedFact } from '../../types/provenance';

export interface SearchOptions {
  domains?: string[];
  maxResults?: number;
  priorityCategory?: 'official_aids' | 'travel' | 'business' | 'general';
}

export interface SearchProviderHit {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchProviderResult {
  query: string;
  providerId: string;
  retrievedAt: string;
  hits: SearchProviderHit[];
}

export interface SearchProvider {
  id: string;
  name: string;
  isConfigured(): boolean;
  healthCheck(): Promise<boolean>;
  search(query: string, options?: SearchOptions): Promise<SearchProviderResult>;
}

export interface WebSearchResult {
  query: string;
  retrievedAt: string;
  facts: GroundedFact[];
  summary: string;
  sourceName?: string;
  sourceUrl?: string;
  searchMode: 'LIVE' | 'UNAVAILABLE';
}

/**
 * Official French public administration and public aid domains
 */
export const OFFICIAL_FRENCH_DOMAINS = [
  'service-public.fr',
  'economie.gouv.fr',
  'entreprises.gouv.fr',
  'urssaf.fr',
  'francetravail.fr',
  'bpifrance-creation.fr',
  'impots.gouv.fr',
  'aides-entreprises.fr'
];

/**
 * Cleanly extracts a human-readable domain or authority title from a URL
 */
function extractDomainName(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host.includes('service-public.fr')) return 'Service-Public.fr';
    if (host.includes('bpifrance-creation.fr')) return 'Bpifrance Création';
    if (host.includes('francetravail.fr')) return 'France Travail';
    if (host.includes('urssaf.fr')) return 'URSSAF';
    if (host.includes('economie.gouv.fr')) return 'Ministère de l’Économie (economie.gouv.fr)';
    if (host.includes('entreprises.gouv.fr')) return 'Portail Entreprises (entreprises.gouv.fr)';
    if (host.includes('impots.gouv.fr')) return 'DGFiP (impots.gouv.fr)';
    if (host.includes('aides-entreprises.fr')) return 'Répertoire Aides-Entreprises';
    return host;
  } catch {
    return 'Source Web Externe';
  }
}

/**
 * 1. TAVILY SEARCH PROVIDER (https://tavily.com)
 */
export class TavilySearchProvider implements SearchProvider {
  public id = 'tavily';
  public name = 'Tavily Web Search API';

  private getApiKey(): string | undefined {
    return typeof process !== 'undefined' ? process.env.TAVILY_API_KEY : undefined;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    return this.isConfigured();
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchProviderResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('[TavilySearchProvider] TAVILY_API_KEY is not configured');
    }

    const payload: Record<string, any> = {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: options?.maxResults || 5
    };

    if (options?.domains && options.domains.length > 0) {
      payload.include_domains = options.domains;
    }

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`[TavilySearchProvider] HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const hits: SearchProviderHit[] = (data.results || []).map((item: any) => ({
      title: item.title || 'Donnée web',
      url: item.url,
      snippet: item.content || item.snippet || '',
      publishedDate: item.published_date,
      score: item.score
    }));

    return {
      query,
      providerId: this.id,
      retrievedAt: new Date().toISOString(),
      hits
    };
  }
}

/**
 * 2. SERPER SEARCH PROVIDER (https://serper.dev - Google Search API)
 */
export class SerperSearchProvider implements SearchProvider {
  public id = 'serper';
  public name = 'Serper Google Search API';

  private getApiKey(): string | undefined {
    return typeof process !== 'undefined' ? process.env.SERPER_API_KEY : undefined;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    return this.isConfigured();
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchProviderResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('[SerperSearchProvider] SERPER_API_KEY is not configured');
    }

    let finalQuery = query;
    if (options?.domains && options.domains.length > 0) {
      const siteClauses = options.domains.map((d) => `site:${d}`).join(' OR ');
      finalQuery = `(${siteClauses}) ${query}`;
    }

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: finalQuery,
        num: options?.maxResults || 5
      })
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`[SerperSearchProvider] HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const hits: SearchProviderHit[] = (data.organic || []).map((item: any) => ({
      title: item.title || 'Résultat Google',
      url: item.link,
      snippet: item.snippet || '',
      publishedDate: item.date
    }));

    return {
      query,
      providerId: this.id,
      retrievedAt: new Date().toISOString(),
      hits
    };
  }
}

/**
 * 3. BRAVE SEARCH PROVIDER (https://brave.com/search/api/)
 */
export class BraveSearchProvider implements SearchProvider {
  public id = 'brave';
  public name = 'Brave Search API';

  private getApiKey(): string | undefined {
    return typeof process !== 'undefined' ? process.env.BRAVE_SEARCH_API_KEY : undefined;
  }

  public isConfigured(): boolean {
    const key = this.getApiKey();
    return typeof key === 'string' && key.trim().length > 0;
  }

  public async healthCheck(): Promise<boolean> {
    return this.isConfigured();
  }

  public async search(query: string, options?: SearchOptions): Promise<SearchProviderResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('[BraveSearchProvider] BRAVE_SEARCH_API_KEY is not configured');
    }

    const count = options?.maxResults || 5;
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Subscription-Token': apiKey,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`[BraveSearchProvider] HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const hits: SearchProviderHit[] = (data.web?.results || []).map((item: any) => ({
      title: item.title || 'Résultat Brave',
      url: item.url,
      snippet: item.description || ''
    }));

    return {
      query,
      providerId: this.id,
      retrievedAt: new Date().toISOString(),
      hits
    };
  }
}

/**
 * 4. MOCK SEARCH PROVIDER (Deterministic / Local Testing)
 */
export class MockSearchProvider implements SearchProvider {
  public id = 'mock';
  public name = 'Mock Search Provider for Testing';
  private mockHits: SearchProviderHit[] = [];

  constructor(mockHits?: SearchProviderHit[]) {
    if (mockHits) this.mockHits = mockHits;
  }

  public setMockHits(hits: SearchProviderHit[]): void {
    this.mockHits = hits;
  }

  public isConfigured(): boolean {
    return true;
  }

  public async healthCheck(): Promise<boolean> {
    return true;
  }

  public async search(query: string): Promise<SearchProviderResult> {
    return {
      query,
      providerId: this.id,
      retrievedAt: new Date().toISOString(),
      hits: this.mockHits
    };
  }
}

// Active provider instance (can be overridden for unit/integration testing)
let activeSearchProvider: SearchProvider | null | 'FORCE_UNAVAILABLE' = null;

export function setSearchProviderForTesting(provider: SearchProvider | null | 'FORCE_UNAVAILABLE'): void {
  activeSearchProvider = provider;
}

export function getActiveSearchProvider(): SearchProvider | null {
  if (activeSearchProvider === 'FORCE_UNAVAILABLE') return null;
  if (activeSearchProvider) return activeSearchProvider;

  const tavily = new TavilySearchProvider();
  if (tavily.isConfigured()) return tavily;

  const serper = new SerperSearchProvider();
  if (serper.isConfigured()) return serper;

  const brave = new BraveSearchProvider();
  if (brave.isConfigured()) return brave;

  return null;
}

/**
 * Detects if a query targets public administration aids, business subsidies, or rights
 */
function isOfficialAidQuery(query: string): boolean {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return (
    q.includes('aide') ||
    q.includes('subvention') ||
    q.includes('acre') ||
    q.includes('arce') ||
    q.includes('creer') ||
    q.includes('creation') ||
    q.includes('entreprise') ||
    q.includes('societe') ||
    q.includes('chomage') ||
    q.includes('statut') ||
    q.includes('fiscalite') ||
    q.includes('droit') ||
    q.includes('dispositif') ||
    q.includes('pret d’honneur') ||
    q.includes('pret d\'honneur')
  );
}

/**
 * REAL LIVE WEB SEARCH EXECUTOR
 *
 * Requirements:
 * - If a provider is configured: queries external Web and returns LIVE_SOURCE facts with verified sourceUrl.
 * - If no provider is configured: returns searchMode: 'UNAVAILABLE' without crashing.
 * - INTERDICTION ABSOLUE: Never fabricates or invents a source URL or consults phantom databases.
 */
export async function executeGroundedSearch(
  taskOrQuery: ResearchTask | string,
  options?: SearchOptions
): Promise<WebSearchResult> {
  const query = typeof taskOrQuery === 'string' ? taskOrQuery : taskOrQuery.query;
  const retrievedAt = new Date().toISOString();
  const provider = getActiveSearchProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      query,
      retrievedAt,
      facts: [],
      summary: 'Recherche web en direct non configurée. Recours aux référentiels internes certifiés.',
      searchMode: 'UNAVAILABLE'
    };
  }

  // Automatic domain prioritization for French public aids and business administration
  const shouldPrioritizeOfficial = isOfficialAidQuery(query) || options?.priorityCategory === 'official_aids';
  const effectiveDomains = options?.domains || (shouldPrioritizeOfficial ? OFFICIAL_FRENCH_DOMAINS : undefined);

  try {
    const result = await provider.search(query, {
      ...options,
      domains: effectiveDomains,
      maxResults: options?.maxResults || 5
    });

    const facts: GroundedFact[] = [];

    for (let i = 0; i < result.hits.length; i++) {
      const hit = result.hits[i];
      // STRICT FILTER: A source must have a real HTTP / HTTPS URL
      if (!hit.url || (!hit.url.startsWith('http://') && !hit.url.startsWith('https://'))) {
        continue;
      }

      const domainName = extractDomainName(hit.url);

      facts.push({
        id: `live_fact_${i + 1}_${Date.now()}`,
        label: hit.title || `Source web vérifiée (${domainName})`,
        value: hit.snippet || 'Information externe consultée en direct.',
        origin: 'LIVE_SOURCE',
        sourceName: domainName,
        sourceUrl: hit.url,
        retrievedAt: result.retrievedAt,
        confidence: 'high',
        freshness: 'LIVE',
        isLegalWarning: false,
        notes: `Extrait en direct via ${provider.name}.`
      });
    }

    if (facts.length === 0) {
      return {
        query,
        retrievedAt,
        facts: [],
        summary: `Recherche effectuée sur le Web via ${provider.name} mais aucun résultat direct pertinent retourné.`,
        searchMode: 'LIVE'
      };
    }

    return {
      query,
      retrievedAt,
      facts,
      summary: `Recherche en direct validée via ${provider.name} (${facts.length} source(s) réellement consultée(s)).`,
      sourceName: facts[0].sourceName,
      sourceUrl: facts[0].sourceUrl,
      searchMode: 'LIVE'
    };
  } catch (err: any) {
    console.warn(`[executeGroundedSearch] Provider ${provider.name} error: ${err.message || err}. Falling back to internal benchmarks.`);
    return {
      query,
      retrievedAt,
      facts: [],
      summary: `Erreur lors de la recherche externe (${err.message || 'problème réseau'}). Bascule sur référentiels internes certifiés.`,
      searchMode: 'UNAVAILABLE'
    };
  }
}
