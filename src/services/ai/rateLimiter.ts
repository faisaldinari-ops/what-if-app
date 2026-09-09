// src/services/ai/rateLimiter.ts
import { telemetry } from './telemetryService';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
  remainingRequests?: number;
}

export interface RequestAiBudget {
  maxLLMCalls: number;
  maxSearchCalls: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxExecutionTimeMs: number;
  maxEstimatedCostUsd: number;
}

export const DEFAULT_REQUEST_BUDGET: RequestAiBudget = {
  maxLLMCalls: 2,
  maxSearchCalls: 2,
  maxInputTokens: 3000,
  maxOutputTokens: 1000,
  maxExecutionTimeMs: 8000,
  maxEstimatedCostUsd: 0.005
};

export class RequestBudgetTracker {
  private startTime: number;
  public llmCalls: number = 0;
  public searchCalls: number = 0;
  public inputTokens: number = 0;
  public outputTokens: number = 0;
  public estimatedCostUsd: number = 0;
  public budget: RequestAiBudget;

  constructor(budget: RequestAiBudget = DEFAULT_REQUEST_BUDGET) {
    this.startTime = Date.now();
    this.budget = budget;
  }

  public canMakeLLMCall(): boolean {
    if (this.llmCalls >= this.budget.maxLLMCalls) return false;
    if (Date.now() - this.startTime > this.budget.maxExecutionTimeMs) return false;
    if (this.estimatedCostUsd >= this.budget.maxEstimatedCostUsd) return false;
    return true;
  }

  public canMakeSearchCall(): boolean {
    if (this.searchCalls >= this.budget.maxSearchCalls) return false;
    if (Date.now() - this.startTime > this.budget.maxExecutionTimeMs) return false;
    return true;
  }

  public recordLLMCall(inputTokens: number, outputTokens: number, cost: number): void {
    this.llmCalls++;
    this.inputTokens += inputTokens;
    this.outputTokens += outputTokens;
    this.estimatedCostUsd += cost;
  }

  public recordSearchCall(): void {
    this.searchCalls++;
  }

  public getElapsedTimeMs(): number {
    return Date.now() - this.startTime;
  }
}

interface ClientTracking {
  timestamps: number[];
  lastRequestTime: number;
  lastPromptHash?: string;
}

class AntiAbuseService {
  private clientHistory = new Map<string, ClientTracking>();
  private readonly MAX_REQUESTS_PER_MINUTE = 20;
  private readonly COOLDOWN_MS = 1500; // Minimum 1.5s between requests to prevent click spam
  private readonly MAX_PROMPT_LENGTH = 4000;

  /**
   * Evaluates if a request from a given client IP / session is permitted.
   */
  public checkRateLimit(clientId: string, prompt: string): RateLimitResult {
    // 1. Max prompt length verification
    if (prompt && prompt.length > this.MAX_PROMPT_LENGTH) {
      telemetry.recordBlockedRequest('Prompt length exceeded');
      return {
        allowed: false,
        reason: `La longueur de votre texte (${prompt.length} caractères) dépasse la limite autorisée de ${this.MAX_PROMPT_LENGTH} caractères.`
      };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    let record = this.clientHistory.get(clientId);

    if (!record) {
      record = {
        timestamps: [now],
        lastRequestTime: now,
        lastPromptHash: this.hashPrompt(prompt)
      };
      this.clientHistory.set(clientId, record);
      return { allowed: true, remainingRequests: this.MAX_REQUESTS_PER_MINUTE - 1 };
    }

    // 2. Cooldown check (prevent accidental rapid double-clicks)
    if (now - record.lastRequestTime < this.COOLDOWN_MS) {
      telemetry.recordBlockedRequest('Cooldown violation');
      return {
        allowed: false,
        reason: 'Veuillez patienter un instant avant de relancer une analyse.',
        retryAfterSeconds: 2
      };
    }

    // 3. Prompt deduplication (exact identical query within 5 seconds)
    const currentHash = this.hashPrompt(prompt);
    if (record.lastPromptHash === currentHash && now - record.lastRequestTime < 5_000) {
      telemetry.recordBlockedRequest('Duplicate request spam');
      return {
        allowed: false,
        reason: 'Requête identique déjà en cours de traitement.',
        retryAfterSeconds: 3
      };
    }

    // 4. Sliding window rate limit (20 requests per minute)
    record.timestamps = record.timestamps.filter((t) => t > oneMinuteAgo);

    if (record.timestamps.length >= this.MAX_REQUESTS_PER_MINUTE) {
      telemetry.recordBlockedRequest('Sliding window quota exceeded');
      return {
        allowed: false,
        reason: 'Trop de requêtes effectuées en une minute. Veuillez patienter 30 secondes.',
        retryAfterSeconds: 30
      };
    }

    // Record request
    record.timestamps.push(now);
    record.lastRequestTime = now;
    record.lastPromptHash = currentHash;

    // Prune map if overly large
    if (this.clientHistory.size > 5000) {
      const oldestKey = this.clientHistory.keys().next().value;
      if (oldestKey) this.clientHistory.delete(oldestKey);
    }

    return {
      allowed: true,
      remainingRequests: this.MAX_REQUESTS_PER_MINUTE - record.timestamps.length
    };
  }

  private hashPrompt(str: string): string {
    if (!str) return '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }
}

export const antiAbuse = new AntiAbuseService();
