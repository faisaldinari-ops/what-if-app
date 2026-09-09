// src/services/ai/aiProvider.ts
import { GoogleGenAI } from '@google/genai';
import { parseProjectWithRules } from './ruleBasedParser';

export interface AIOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  timeoutMs?: number;
  model?: string;
}

export interface QuotaInfo {
  callsRemaining?: number;
  resetTime?: string;
  quotaStatus?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isFreeTier: boolean;
  generate(prompt: string, options?: AIOptions): Promise<string>;
  classify(text: string, categories: string[]): Promise<string>;
  extractStructuredData<T>(prompt: string, schemaDescription: string): Promise<T>;
  healthCheck(): Promise<boolean>;
  remainingQuota(): Promise<QuotaInfo>;
  estimatedCost(tokens: { input: number; output: number }): number;
}

/**
 * STRICT FREE MODEL ALLOWLIST (ALLOW_PAID_AI=false)
 * Only zero-cost/free-tier models explicitly registered here are authorized.
 * If ALLOW_PAID_AI=false and a model is not on this list: REFUSAL.
 */
export const FREE_MODEL_ALLOWLIST: Record<string, string[]> = {
  gemini: [
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ],
  groq: [
    'llama-3.1-8b-instant',
    'llama-3.2-3b-preview',
    'llama-3.2-1b-preview',
    'mixtral-8x7b-32768'
  ],
  openrouter: [
    'meta-llama/llama-3.2-3b-instruct:free',
    'meta-llama/llama-3.1-8b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'mistralai/mistral-7b-instruct:free'
  ],
  cloudflare: [
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/meta/llama-3.2-1b-instruct'
  ],
  deterministic: ['RuleBasedEngine', 'DeterministicEngine']
};

export function isModelAllowedUnderFreeGuardrail(providerId: string, modelName: string): boolean {
  const allowPaid = typeof process !== 'undefined' && process.env.ALLOW_PAID_AI === 'true';
  if (allowPaid) return true;
  if (providerId === 'deterministic') return true;

  const allowedList = FREE_MODEL_ALLOWLIST[providerId] || [];
  return allowedList.some((m) => m.toLowerCase() === modelName.toLowerCase());
}

export function assertFreeModelAllowed(providerId: string, modelName: string): void {
  if (!isModelAllowedUnderFreeGuardrail(providerId, modelName)) {
    throw new Error(
      `[FREE_GUARDRAIL_REFUSAL] Model "${modelName}" for provider "${providerId}" is NOT in FREE_MODEL_ALLOWLIST and ALLOW_PAID_AI is false. Request REFUSED.`
    );
  }
}

/**
 * 1. GEMINI PROVIDER (Google GenAI Free Tier)
 */
export class GeminiProvider implements AIProvider {
  public id = 'gemini';
  public name = 'Google Gemini (Free Tier)';
  public isFreeTier = true;
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI | null {
    if (!this.client && typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
      this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return this.client;
  }

  public async healthCheck(): Promise<boolean> {
    const ai = this.getClient();
    return !!ai;
  }

  public async generate(prompt: string, options?: AIOptions): Promise<string> {
    const ai = this.getClient();
    if (!ai) throw new Error('GEMINI_API_KEY is not configured');

    const modelName = options?.model || 'gemini-2.5-flash';
    assertFreeModelAllowed(this.id, modelName);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: options?.systemInstruction,
        temperature: options?.temperature ?? 0.2,
        maxOutputTokens: options?.maxTokens ?? 1000,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  public async classify(text: string, categories: string[]): Promise<string> {
    const prompt = `Classify this text into EXACTLY ONE of these categories: ${categories.join(', ')}.\n\nText: "${text}"\nOutput ONLY the category name and nothing else.`;
    const res = await this.generate(prompt, { temperature: 0.0, maxTokens: 20 });
    const match = categories.find((c) => res.toLowerCase().includes(c.toLowerCase()));
    return match || categories[0];
  }

  public async extractStructuredData<T>(prompt: string, schemaDescription: string): Promise<T> {
    const fullPrompt = `${prompt}\n\nYou MUST respond strictly in valid JSON conforming to this schema:\n${schemaDescription}`;
    const raw = await this.generate(fullPrompt, {
      responseFormat: 'json',
      temperature: 0.1,
      maxTokens: 1200
    });
    return JSON.parse(raw) as T;
  }

  public async remainingQuota(): Promise<QuotaInfo> {
    return { callsRemaining: undefined, quotaStatus: 'UNKNOWN' };
  }

  public estimatedCost(tokens: { input: number; output: number }): number {
    // Gemini Flash Free Tier is 0 cost up to quota
    return 0;
  }
}

/**
 * 2. GROQ PROVIDER (Groq Free Tier - Llama 3.1 8B Instant)
 */
export class GroqProvider implements AIProvider {
  public id = 'groq';
  public name = 'Groq (Free Tier - LLaMA 3.1 8B)';
  public isFreeTier = true;

  private getApiKey(): string | undefined {
    return typeof process !== 'undefined' ? process.env.GROQ_API_KEY : undefined;
  }

  public async healthCheck(): Promise<boolean> {
    return !!this.getApiKey();
  }

  public async generate(prompt: string, options?: AIOptions): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 7000);

    try {
      const messages: any[] = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const modelName = options?.model || 'llama-3.1-8b-instant';
      assertFreeModelAllowed(this.id, modelName);

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1000,
          response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  public async classify(text: string, categories: string[]): Promise<string> {
    const prompt = `Classify this text into EXACTLY ONE of these categories: ${categories.join(', ')}.\nText: "${text}"\nOutput ONLY the category name.`;
    const res = await this.generate(prompt, { temperature: 0.0, maxTokens: 20 });
    const match = categories.find((c) => res.toLowerCase().includes(c.toLowerCase()));
    return match || categories[0];
  }

  public async extractStructuredData<T>(prompt: string, schemaDescription: string): Promise<T> {
    const fullPrompt = `${prompt}\nRespond strictly with valid JSON schema: ${schemaDescription}`;
    const raw = await this.generate(fullPrompt, { responseFormat: 'json', temperature: 0.1 });
    return JSON.parse(raw) as T;
  }

  public async remainingQuota(): Promise<QuotaInfo> {
    return { callsRemaining: undefined, quotaStatus: 'UNKNOWN' };
  }

  public estimatedCost(): number {
    return 0; // Free tier
  }
}

/**
 * 3. OPENROUTER PROVIDER (OpenRouter Free Tier)
 */
export class OpenRouterProvider implements AIProvider {
  public id = 'openrouter';
  public name = 'OpenRouter Free';
  public isFreeTier = true;

  private getApiKey(): string | undefined {
    return typeof process !== 'undefined' ? process.env.OPENROUTER_API_KEY : undefined;
  }

  public async healthCheck(): Promise<boolean> {
    return !!this.getApiKey();
  }

  public async generate(prompt: string, options?: AIOptions): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

    const modelName = options?.model || 'meta-llama/llama-3.2-3b-instruct:free';
    assertFreeModelAllowed(this.id, modelName);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 8000);

    try {
      const messages: any[] = [];
      if (options?.systemInstruction) {
        messages.push({ role: 'system', content: options.systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://whatif.app',
          'X-Title': 'WHAT IF Decision CoPilot'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxTokens ?? 1000
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        throw new Error(`OpenRouter API error ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      return json.choices?.[0]?.message?.content || '';
    } finally {
      clearTimeout(timeout);
    }
  }

  public async classify(text: string, categories: string[]): Promise<string> {
    const prompt = `Classify this text into one category: ${categories.join(', ')}.\nText: "${text}"\nOutput only category.`;
    const res = await this.generate(prompt, { temperature: 0.0, maxTokens: 20 });
    const match = categories.find((c) => res.toLowerCase().includes(c.toLowerCase()));
    return match || categories[0];
  }

  public async extractStructuredData<T>(prompt: string, schemaDescription: string): Promise<T> {
    const fullPrompt = `${prompt}\nOutput valid JSON according to: ${schemaDescription}`;
    const raw = await this.generate(fullPrompt, { temperature: 0.1 });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON from OpenRouter');
    return JSON.parse(jsonMatch[0]) as T;
  }

  public async remainingQuota(): Promise<QuotaInfo> {
    return { callsRemaining: undefined, quotaStatus: 'UNKNOWN' };
  }

  public estimatedCost(): number {
    return 0;
  }
}

/**
 * 4. CLOUDFLARE WORKERS AI PROVIDER
 */
export class CloudflareProvider implements AIProvider {
  public id = 'cloudflare';
  public name = 'Cloudflare Workers AI Free';
  public isFreeTier = true;

  private getCredentials(): { apiKey?: string; accountId?: string } {
    if (typeof process === 'undefined') return {};
    return {
      apiKey: process.env.CLOUDFLARE_API_KEY,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID
    };
  }

  public async healthCheck(): Promise<boolean> {
    const { apiKey, accountId } = this.getCredentials();
    return !!apiKey && !!accountId;
  }

  public async generate(prompt: string, options?: AIOptions): Promise<string> {
    const { apiKey, accountId } = this.getCredentials();
    if (!apiKey || !accountId) throw new Error('CLOUDFLARE credentials not configured');

    const modelName = options?.model || '@cf/meta/llama-3.1-8b-instruct';
    assertFreeModelAllowed(this.id, modelName);

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            ...(options?.systemInstruction ? [{ role: 'system', content: options.systemInstruction }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: options?.maxTokens ?? 1000
        })
      }
    );

    if (!res.ok) {
      throw new Error(`Cloudflare AI error ${res.status}: ${await res.text()}`);
    }
    const json = await res.json();
    return json.result?.response || '';
  }

  public async classify(text: string, categories: string[]): Promise<string> {
    const prompt = `Classify into one of: ${categories.join(', ')}.\nText: "${text}"\nOutput category name only.`;
    const res = await this.generate(prompt, { maxTokens: 20 });
    const match = categories.find((c) => res.toLowerCase().includes(c.toLowerCase()));
    return match || categories[0];
  }

  public async extractStructuredData<T>(prompt: string, schemaDescription: string): Promise<T> {
    const fullPrompt = `${prompt}\nReturn JSON strictly matching: ${schemaDescription}`;
    const raw = await this.generate(fullPrompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON returned from Cloudflare');
    return JSON.parse(jsonMatch[0]) as T;
  }

  public async remainingQuota(): Promise<QuotaInfo> {
    return { callsRemaining: undefined, quotaStatus: 'UNKNOWN' };
  }

  public estimatedCost(): number {
    return 0;
  }
}

/**
 * 5. DETERMINISTIC FALLBACK PROVIDER (ZERO COST, NEVER FAILS)
 * Uses high-performance regex parsing, benchmark lookup, and mathematical logic.
 */
export class DeterministicProvider implements AIProvider {
  public id = 'deterministic';
  public name = 'Deterministic Engine (Niveau 0 - Zero Token)';
  public isFreeTier = true;

  public async healthCheck(): Promise<boolean> {
    return true; // Always healthy
  }

  public async generate(prompt: string): Promise<string> {
    return `Analyse déterministe WHAT IF pour : ${prompt}`;
  }

  public async classify(text: string, categories: string[]): Promise<string> {
    const lower = text.toLowerCase();
    for (const cat of categories) {
      if (lower.includes(cat.toLowerCase())) return cat;
    }
    return categories[0];
  }

  public async extractStructuredData<T>(prompt: string): Promise<T> {
    const parsed = parseProjectWithRules(prompt, undefined, 'fr');
    return {
      projectTitle: parsed.data.projectTitle,
      category: parsed.data.category,
      budget: parsed.data.budget,
      monthlyIncome: parsed.data.monthlyIncome,
      monthlyExpenses: parsed.data.monthlyExpenses,
      projectStartupCost: parsed.data.projectStartupCost,
      missingQuestions: parsed.missingQuestions,
      isReadyForAnalysis: parsed.isReadyForAnalysis
    } as unknown as T;
  }

  public async remainingQuota(): Promise<QuotaInfo> {
    return { callsRemaining: undefined, quotaStatus: 'UNLIMITED_LOCAL' };
  }

  public estimatedCost(): number {
    return 0;
  }
}
