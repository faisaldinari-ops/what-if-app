// src/services/ai/telemetryService.ts

export interface TelemetryRecord {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  taskType: string;
  llmCalls: number;
  searchCalls: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  estimatedCostUsd: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  fallbackReason?: string;
  status: 'success' | 'rate_limited' | 'error' | 'budget_capped';
}

export interface TelemetrySummary {
  costTodayUsd: number;
  costThisMonthUsd: number;
  hardDailyBudgetUsd: number;
  isDailyBudgetExceeded: boolean;
  allowPaidAi: boolean;
  tokensConsumedToday: {
    input: number;
    output: number;
    total: number;
  };
  totalRequestsToday: number;
  cacheHitRatePct: number;
  topProvider: string;
  blockedRequestsCount: number;
  activeProviders: string[];
  recentEvents: TelemetryRecord[];
}

class TelemetryService {
  private records: TelemetryRecord[] = [];
  private blockedCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Pricing constants (per 1M tokens) for conservative cost calculation
  private readonly PRICING: Record<string, { inputPerM: number; outputPerM: number }> = {
    'gemini-2.5-flash': { inputPerM: 0.15, outputPerM: 0.60 },
    'gemini-3.8-flash': { inputPerM: 0.25, outputPerM: 1.00 },
    'gemini-free': { inputPerM: 0.0, outputPerM: 0.0 },
    'groq-llama-3.1-8b': { inputPerM: 0.0, outputPerM: 0.0 }, // Free tier
    'openrouter-free': { inputPerM: 0.0, outputPerM: 0.0 },
    'cloudflare-free': { inputPerM: 0.0, outputPerM: 0.0 },
    'deterministic': { inputPerM: 0.0, outputPerM: 0.0 }
  };

  public getHardDailyBudget(): number {
    const envVal = typeof process !== 'undefined' ? process.env.HARD_DAILY_BUDGET_USD : undefined;
    if (envVal) {
      const parsed = parseFloat(envVal);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 0.50; // Default $0.50/day hard cap to eliminate billing surprises
  }

  public isPaidAiAllowed(): boolean {
    if (typeof process === 'undefined') return false;
    return process.env.ALLOW_PAID_AI === 'true'; // Strict default FALSE
  }

  public recordCacheEvent(hit: boolean): void {
    if (hit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
  }

  public recordBlockedRequest(reason: string): void {
    this.blockedCount++;
    this.records.unshift({
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      provider: 'none',
      model: 'none',
      taskType: 'security_block',
      llmCalls: 0,
      searchCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      estimatedCostUsd: 0,
      cacheHit: false,
      fallbackUsed: false,
      fallbackReason: reason,
      status: 'rate_limited'
    });
    if (this.records.length > 200) this.records.pop();
  }

  public recordOperation(record: Omit<TelemetryRecord, 'id' | 'timestamp'>): TelemetryRecord {
    const fullRecord: TelemetryRecord = {
      ...record,
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };

    this.records.unshift(fullRecord);
    if (this.records.length > 200) {
      this.records.pop();
    }

    return fullRecord;
  }

  public estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.PRICING[model] || { inputPerM: 0.20, outputPerM: 0.80 };
    const cost = (inputTokens / 1_000_000) * pricing.inputPerM + (outputTokens / 1_000_000) * pricing.outputPerM;
    return Math.round(cost * 1_000_000) / 1_000_000;
  }

  public getSummary(): TelemetrySummary {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let costToday = 0;
    let costMonth = 0;
    let inputTokensToday = 0;
    let outputTokensToday = 0;
    let requestsToday = 0;
    const providerCounts: Record<string, number> = {};

    for (const r of this.records) {
      const time = new Date(r.timestamp).getTime();
      if (time >= startOfDay) {
        costToday += r.estimatedCostUsd;
        inputTokensToday += r.inputTokens;
        outputTokensToday += r.outputTokens;
        requestsToday++;
        providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
      }
      if (time >= startOfMonth) {
        costMonth += r.estimatedCostUsd;
      }
    }

    let topProvider = 'deterministic';
    let maxCount = 0;
    for (const [prov, count] of Object.entries(providerCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topProvider = prov;
      }
    }

    const totalCacheEvents = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheEvents > 0 ? Math.round((this.cacheHits / totalCacheEvents) * 100) : 0;

    const hardBudget = this.getHardDailyBudget();

    return {
      costTodayUsd: Math.round(costToday * 10000) / 10000,
      costThisMonthUsd: Math.round(costMonth * 10000) / 10000,
      hardDailyBudgetUsd: hardBudget,
      isDailyBudgetExceeded: costToday >= hardBudget,
      allowPaidAi: this.isPaidAiAllowed(),
      tokensConsumedToday: {
        input: inputTokensToday,
        output: outputTokensToday,
        total: inputTokensToday + outputTokensToday
      },
      totalRequestsToday: requestsToday,
      cacheHitRatePct: cacheHitRate,
      topProvider,
      blockedRequestsCount: this.blockedCount,
      activeProviders: ['deterministic', 'gemini-free', 'groq-free', 'openrouter-free'],
      recentEvents: this.records.slice(0, 30)
    };
  }
}

export const telemetry = new TelemetryService();
