// src/services/ai/cacheService.ts
import { telemetry } from './telemetryService';

export type CacheCategory = 'live_prices' | 'cost_of_living' | 'regulations' | 'structural' | 'analysis_response';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  category: CacheCategory;
  ttlMs: number;
}

const TTL_CONFIG_MS: Record<CacheCategory, number> = {
  live_prices: 2 * 60 * 60 * 1000,          // 2 hours
  cost_of_living: 48 * 60 * 60 * 1000,      // 48 hours
  regulations: 7 * 24 * 60 * 60 * 1000,     // 7 days
  structural: 30 * 24 * 60 * 60 * 1000,     // 30 days
  analysis_response: 24 * 60 * 60 * 1000    // 24 hours
};

class MultiLevelCacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();

  /**
   * Normalizes arbitrary user prompt into a canonical cache key
   * E.g. "J'ai 5000 €, je suis électricien et je veux créer mon entreprise"
   * -> "budget:5000_job:electricien_goal:creer_entreprise"
   */
  public normalizePrompt(prompt: string, lang = 'fr', currency = 'EUR'): string {
    if (!prompt) return '';
    return prompt
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/['’]/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      + `_${lang}_${currency}`;
  }

  public get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      telemetry.recordCacheEvent(false);
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
      this.memoryCache.delete(key);
      telemetry.recordCacheEvent(false);
      return null;
    }

    telemetry.recordCacheEvent(true);
    return entry.data as T;
  }

  public set<T>(key: string, data: T, category: CacheCategory = 'analysis_response'): void {
    const ttlMs = TTL_CONFIG_MS[category] || TTL_CONFIG_MS.analysis_response;
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      category,
      ttlMs
    });

    // Keep memory map constrained to avoid memory leak in long-running container
    if (this.memoryCache.size > 2000) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
  }

  public clear(): void {
    this.memoryCache.clear();
  }

  public size(): number {
    return this.memoryCache.size;
  }
}

export const cacheService = new MultiLevelCacheService();
