// src/services/ai/aiRouter.ts
import {
  AIProvider,
  GeminiProvider,
  GroqProvider,
  OpenRouterProvider,
  CloudflareProvider,
  DeterministicProvider,
  AIOptions,
  FREE_MODEL_ALLOWLIST,
  isModelAllowedUnderFreeGuardrail
} from './aiProvider';
import { telemetry } from './telemetryService';
import { cacheService } from './cacheService';

export type TaskComplexity = 'intent_classification' | 'json_extraction' | 'synthesis' | 'deep_reasoning';

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN';
}

export class AIRouter {
  private providers: Map<string, AIProvider> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private deterministicFallback: DeterministicProvider;

  constructor() {
    this.deterministicFallback = new DeterministicProvider();
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new GroqProvider());
    this.registerProvider(new OpenRouterProvider());
    this.registerProvider(new CloudflareProvider());
    this.registerProvider(this.deterministicFallback);
  }

  private registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
    this.circuitBreakers.set(provider.id, {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED'
    });
  }

  private isCircuitAvailable(providerId: string): boolean {
    const cb = this.circuitBreakers.get(providerId);
    if (!cb) return true;
    if (cb.state === 'OPEN') {
      // Re-evaluate after 60 seconds cooldown
      if (Date.now() - cb.lastFailureTime > 60_000) {
        cb.state = 'CLOSED';
        cb.failures = 0;
        return true;
      }
      return false;
    }
    return true;
  }

  private recordFailure(providerId: string): void {
    const cb = this.circuitBreakers.get(providerId);
    if (cb) {
      cb.failures++;
      cb.lastFailureTime = Date.now();
      if (cb.failures >= 3) {
        cb.state = 'OPEN';
        console.warn(`[AIRouter] Circuit breaker OPEN for provider: ${providerId} (3 consecutive failures).`);
      }
    }
  }

  private recordSuccess(providerId: string): void {
    const cb = this.circuitBreakers.get(providerId);
    if (cb) {
      cb.failures = 0;
      cb.state = 'CLOSED';
    }
  }

  /**
   * Returns ordered fallback chain of providers based on task complexity.
   * Priority: ZERO / LEAST COST provider first, Gemini only for deep reasoning.
   */
  public getCandidateProviders(task: TaskComplexity): AIProvider[] {
    const chain: AIProvider[] = [];
    const allowPaidAi = typeof process !== 'undefined' && process.env.ALLOW_PAID_AI === 'true';

    const checkAndAdd = (id: string) => {
      const p = this.providers.get(id);
      if (!p) return;
      if (!this.isCircuitAvailable(id)) return;

      // STRICT FREE GUARDRAIL: When ALLOW_PAID_AI=false, only explicitly authorized free-tier models are accepted
      if (!allowPaidAi) {
        if (!p.isFreeTier && id !== 'deterministic') {
          console.warn(`[AIRouter] Refusing paid provider "${id}" because ALLOW_PAID_AI is false.`);
          return;
        }
        const allowedModels = FREE_MODEL_ALLOWLIST[id];
        if (!allowedModels || allowedModels.length === 0) {
          console.warn(`[AIRouter] Refusing provider "${id}" because no models exist in FREE_MODEL_ALLOWLIST.`);
          return;
        }
      }

      chain.push(p);
    };

    // Budget guard: if daily budget is exceeded, force deterministic / free only
    const summary = telemetry.getSummary();
    if (summary.isDailyBudgetExceeded) {
      console.warn('[AIRouter] Daily budget exceeded. Forcing free/deterministic providers.');
      chain.push(this.deterministicFallback);
      return chain;
    }

    if (task === 'intent_classification') {
      // Classification: fastest, cheapest model first
      checkAndAdd('groq');
      checkAndAdd('openrouter');
      checkAndAdd('gemini');
    } else if (task === 'json_extraction') {
      // JSON Extraction: Groq or Gemini Flash
      checkAndAdd('gemini');
      checkAndAdd('groq');
      checkAndAdd('openrouter');
      checkAndAdd('cloudflare');
    } else if (task === 'synthesis') {
      // Synthesis
      checkAndAdd('gemini');
      checkAndAdd('groq');
      checkAndAdd('openrouter');
    } else {
      // Deep reasoning
      checkAndAdd('gemini');
      checkAndAdd('groq');
      checkAndAdd('openrouter');
    }

    // Always append deterministic engine as ultimate guarantee
    chain.push(this.deterministicFallback);
    return chain;
  }

  /**
   * Executes structured data extraction through the least costly available provider,
   * falling back automatically through the chain without crashing.
   */
  public async extractStructuredData<T>(
    prompt: string,
    schemaDescription: string,
    task: TaskComplexity = 'json_extraction',
    lang = 'fr',
    currency = 'EUR'
  ): Promise<{ data: T; providerUsed: string; fallbackUsed: boolean }> {
    // 1. Check multi-level cache first!
    const cacheKey = cacheService.normalizePrompt(prompt, lang, currency);
    const cached = cacheService.get<T>(cacheKey);
    if (cached) {
      telemetry.recordOperation({
        provider: 'cache',
        model: 'in-memory-lru',
        taskType: task,
        llmCalls: 0,
        searchCalls: 0,
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: 1,
        estimatedCostUsd: 0,
        cacheHit: true,
        fallbackUsed: false,
        status: 'success'
      });
      return { data: cached, providerUsed: 'cache', fallbackUsed: false };
    }

    const candidates = this.getCandidateProviders(task);
    const startTime = Date.now();
    let lastError: any = null;

    for (let i = 0; i < candidates.length; i++) {
      const provider = candidates[i];
      const isFallback = i > 0;

      // Quick health check
      const healthy = await provider.healthCheck().catch(() => false);
      if (!healthy && provider.id !== 'deterministic') {
        continue;
      }

      try {
        const result = await provider.extractStructuredData<T>(prompt, schemaDescription);
        this.recordSuccess(provider.id);

        const latency = Date.now() - startTime;
        const inputTokens = Math.round(prompt.length / 4);
        const outputTokens = Math.round(JSON.stringify(result).length / 4);
        const cost = provider.estimatedCost({ input: inputTokens, output: outputTokens });

        telemetry.recordOperation({
          provider: provider.id,
          model: provider.name,
          taskType: task,
          llmCalls: provider.id === 'deterministic' ? 0 : 1,
          searchCalls: 0,
          inputTokens,
          outputTokens,
          latencyMs: latency,
          estimatedCostUsd: cost,
          cacheHit: false,
          fallbackUsed: isFallback,
          status: 'success'
        });

        // Store into cache
        cacheService.set(cacheKey, result, 'analysis_response');

        return {
          data: result,
          providerUsed: provider.id,
          fallbackUsed: isFallback
        };
      } catch (err: any) {
        lastError = err;
        this.recordFailure(provider.id);
        console.warn(`[AIRouter] Provider ${provider.id} failed: ${err.message || err}. Attempting fallback...`);
      }
    }

    // Ultimate safety: call deterministic fallback directly
    const deterministicResult = await this.deterministicFallback.extractStructuredData<T>(prompt);
    telemetry.recordOperation({
      provider: 'deterministic',
      model: 'RuleBasedEngine',
      taskType: task,
      llmCalls: 0,
      searchCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: Date.now() - startTime,
      estimatedCostUsd: 0,
      cacheHit: false,
      fallbackUsed: true,
      fallbackReason: lastError?.message || 'All external providers failed',
      status: 'success'
    });

    return {
      data: deterministicResult,
      providerUsed: 'deterministic',
      fallbackUsed: true
    };
  }
}

export const aiRouter = new AIRouter();
