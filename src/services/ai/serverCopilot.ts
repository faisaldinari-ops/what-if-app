// src/services/ai/serverCopilot.ts
import { parseProjectWithRules } from './ruleBasedParser';
import { aiRouter } from './aiRouter';
import { antiAbuse } from './rateLimiter';
import { cacheService } from './cacheService';
import { telemetry } from './telemetryService';
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

  // 4. Try structured AI extraction via AI Router
  const schemaDescription = `{
    "projectTitle": string,
    "category": "entrepreneurship" | "money" | "real_estate" | "career" | "education" | "relocation" | "personal" | "other",
    "location": string or null,
    "budget": number or null,
    "monthlyIncome": number or null,
    "monthlyExpenses": number or null,
    "projectStartupCost": number or null,
    "projectMonthlyRunningCost": number or null,
    "projectExpectedRevenue": number or null,
    "monthsBeforeRevenue": number or null,
    "missingQuestions": [
      {
        "id": string,
        "field": "budget" | "monthlyIncome" | "monthlyExpenses",
        "question": string,
        "explanation": string,
        "type": "number" | "text" | "choice",
        "placeholder": string,
        "unit": string
      }
    ],
    "isReadyForAnalysis": boolean,
    "aiSummary": string
  }`;

  try {
    const aiResult = await aiRouter.extractStructuredData<any>(
      `Analyze user project: "${prompt}"\nCurrency: ${currency}\nExisting data: ${JSON.stringify(req.existingData || {})}`,
      schemaDescription,
      'json_extraction',
      lang,
      currency
    );

    const parsed = aiResult.data || {};

    // Merge with existing data & deterministic fallback rules
    const ruleFallback = parseProjectWithRules(prompt, req.existingData, lang);

    const finalData: UserExtractedData = {
      prompt,
      projectTitle: parsed.projectTitle || ruleFallback.data.projectTitle || 'Mon Projet',
      category: parsed.category || ruleFallback.data.category || 'entrepreneurship',
      location: parsed.location || req.existingData?.location || ruleFallback.data.location,
      budget:
        parsed.budget !== null && parsed.budget !== undefined
          ? parsed.budget
          : req.existingData?.budget !== undefined
          ? req.existingData.budget
          : ruleFallback.data.budget,
      monthlyIncome:
        parsed.monthlyIncome !== null && parsed.monthlyIncome !== undefined
          ? parsed.monthlyIncome
          : req.existingData?.monthlyIncome !== undefined
          ? req.existingData.monthlyIncome
          : ruleFallback.data.monthlyIncome,
      monthlyExpenses:
        parsed.monthlyExpenses !== null && parsed.monthlyExpenses !== undefined
          ? parsed.monthlyExpenses
          : req.existingData?.monthlyExpenses !== undefined
          ? req.existingData.monthlyExpenses
          : ruleFallback.data.monthlyExpenses,
      projectStartupCost:
        parsed.projectStartupCost || req.existingData?.projectStartupCost || ruleFallback.data.projectStartupCost,
      projectMonthlyRunningCost:
        parsed.projectMonthlyRunningCost ||
        req.existingData?.projectMonthlyRunningCost ||
        ruleFallback.data.projectMonthlyRunningCost,
      projectExpectedRevenue:
        parsed.projectExpectedRevenue ||
        req.existingData?.projectExpectedRevenue ||
        ruleFallback.data.projectExpectedRevenue,
      monthsBeforeRevenue:
        parsed.monthsBeforeRevenue || req.existingData?.monthsBeforeRevenue || ruleFallback.data.monthsBeforeRevenue,
      timelineMonths: req.existingData?.timelineMonths || ruleFallback.data.timelineMonths || 12,
      customAnswers: req.existingData?.customAnswers || {}
    };

    const hasBudget = finalData.budget !== undefined && finalData.budget !== null;
    const hasIncome = finalData.monthlyIncome !== undefined && finalData.monthlyIncome !== null;
    const hasExpenses = finalData.monthlyExpenses !== undefined && finalData.monthlyExpenses !== null;

    const isReady = hasBudget && hasIncome && hasExpenses;
    const rawQuestions = parsed.missingQuestions || ruleFallback.missingQuestions || [];
    const filteredQuestions = isReady
      ? []
      : rawQuestions
          .filter((q: any) => {
            if (q.field === 'budget' && hasBudget) return false;
            if (q.field === 'monthlyIncome' && hasIncome) return false;
            if (q.field === 'monthlyExpenses' && hasExpenses) return false;
            return true;
          })
          .slice(0, 3);

    const responsePayload: ProjectAnalysisResult = {
      data: finalData,
      missingQuestions: filteredQuestions,
      isReadyForAnalysis: isReady || filteredQuestions.length === 0,
      aiSummary: parsed.aiSummary,
      providerUsed: aiResult.providerUsed,
      fallback: aiResult.fallbackUsed,
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
