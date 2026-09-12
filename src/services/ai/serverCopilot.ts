// src/services/ai/serverCopilot.ts
//
// Server-side entry point for the /api/analyze-project route. This must stay a thin wrapper
// (sanitization, rate-limiting, caching) around the SAME single brain the frontend uses
// (DecisionController, via analyzeProjectInput) — never a second, independently-reasoning
// pipeline. Previously this endpoint ran its own AI-router extraction + rule-parser fallback,
// entirely bypassing DecisionController; that made it a second decision-maker capable of
// producing different answers to the same question than the UI does. Fixed to delegate.
import { parseProjectWithRules } from './ruleBasedParser';
import { antiAbuse } from './rateLimiter';
import { cacheService } from './cacheService';
import { analyzeProjectInput } from './projectAnalyzer';
import { UserExtractedData, MissingQuestion } from '../../types/decision';

export interface ProjectAnalysisRequest {
  prompt: string;
  existingData?: Partial<UserExtractedData>;
  lang?: 'fr' | 'en' | 'es';
  currency?: string;
  clientId?: string;
}

export interface ProjectAnalysisResult {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
  aiSummary?: string;
  fallback?: boolean;
  providerUsed?: string;
  cacheHit?: boolean;
  rateLimited?: boolean;
  error?: string;
}

/**
 * Sanitizes user input against prompt injection attempts.
 */
export function sanitizeInput(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .slice(0, 4000)
    .replace(/\b(ignore (all )?previous instructions|system:\s*|you are now a|jailbreak)\b/gi, '')
    .trim();
}

/**
 * Unified, hardened analysis handler used across Express and Vercel Serverless.
 */
export async function handleProjectAnalysis(
  req: ProjectAnalysisRequest
): Promise<{ status: number; body: ProjectAnalysisResult }> {
  const rawPrompt = req.prompt || '';
  const lang = req.lang || 'fr';
  const currency = req.currency || 'EUR';
  const clientId = req.clientId || 'anonymous_client';

  // 1. Sanitize input
  const prompt = sanitizeInput(rawPrompt);
  if (!prompt) {
    return {
      status: 400,
      body: {
        data: parseProjectWithRules('', req.existingData, lang).data,
        missingQuestions: [],
        isReadyForAnalysis: false,
        error: 'Le prompt est vide ou invalide.'
      }
    };
  }

  // 2. Anti-abuse, rate limit, and cooldown check
  const rateLimit = antiAbuse.checkRateLimit(clientId, prompt);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      body: {
        data: parseProjectWithRules(prompt, req.existingData, lang).data,
        missingQuestions: [],
        isReadyForAnalysis: false,
        rateLimited: true,
        error: rateLimit.reason || 'Trop de requêtes. Veuillez patienter un instant.'
      }
    };
  }

  // 3. Multi-level cache check
  const cacheKey = cacheService.normalizePrompt(prompt, lang, currency);
  const cachedResponse = cacheService.get<ProjectAnalysisResult>(cacheKey);
  if (cachedResponse) {
    return {
      status: 200,
      body: {
        ...cachedResponse,
        cacheHit: true
      }
    };
  }

  // 4. Delegate to the single brain (DecisionController), the same path the frontend uses.
  try {
    const result = await analyzeProjectInput(prompt, req.existingData, lang, currency as any);

    const responsePayload: ProjectAnalysisResult = {
      data: result.data,
      missingQuestions: result.missingQuestions,
      isReadyForAnalysis: result.isReadyForAnalysis,
      aiSummary: result.coreResponse?.type === 'RECOMMENDATION' ? result.analysis?.verdictSummary : undefined,
      providerUsed: 'decision_controller',
      fallback: false,
      cacheHit: false
    };

    // Cache the completed result
    cacheService.set(cacheKey, responsePayload, 'analysis_response');

    return {
      status: 200,
      body: responsePayload
    };
  } catch (err: any) {
    console.warn('[handleProjectAnalysis] Fallback triggered:', err?.message || err);
    const ruleFallback = parseProjectWithRules(prompt, req.existingData, lang);
    const responsePayload: ProjectAnalysisResult = {
      data: ruleFallback.data,
      missingQuestions: ruleFallback.missingQuestions,
      isReadyForAnalysis: ruleFallback.isReadyForAnalysis,
      providerUsed: 'deterministic',
      fallback: true,
      cacheHit: false
    };

    return {
      status: 200,
      body: responsePayload
    };
  }
}
