// src/services/ai/projectAnalyzer.ts
import { UserExtractedData, MissingQuestion, DecisionAnalysis } from '../../types/decision';
import { parseProjectWithRules } from './ruleBasedParser';
import { calculateFeasibility } from '../../logic/feasibilityEngine';
import { SupportedLang, SupportedCurrency } from '../../i18n';

export interface AnalysisResponse {
  data: UserExtractedData;
  missingQuestions: MissingQuestion[];
  isReadyForAnalysis: boolean;
  analysis?: DecisionAnalysis;
  aiEnhanced?: boolean;
}

/**
 * Centralized AI Service:
 * Connects to server-side `/api/analyze-project` where Gemini handles natural language extraction.
 * If server is offline, times out, or encounters errors, seamlessly falls back
 * to the deterministic rule-based parser without breaking user flow.
 */
export async function analyzeProjectInput(
  prompt: string,
  existingData?: Partial<UserExtractedData>,
  lang: SupportedLang = 'fr',
  currency: SupportedCurrency = 'EUR'
): Promise<AnalysisResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch('/api/analyze-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        existingData,
        lang,
        currency
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        // Run deterministic calculation on structured output
        let analysis: DecisionAnalysis | undefined = undefined;
        if (json.isReadyForAnalysis) {
          analysis = calculateFeasibility(json.data, lang, currency);
          // If the AI provided tailored advice, enrich the summary gently
          if (json.aiSummary && analysis) {
            analysis.verdictSummary = json.aiSummary;
          }
        }
        return {
          data: json.data,
          missingQuestions: json.missingQuestions || [],
          isReadyForAnalysis: !!json.isReadyForAnalysis,
          analysis,
          aiEnhanced: true
        };
      }
    }
  } catch (err) {
    // Network / timeout / serverless error -> graceful fallback
    console.warn('AI service proxy unavailable, falling back to rule-based parser:', err);
  }

  // Graceful rule-based fallback
  const parsed = parseProjectWithRules(prompt, existingData, lang);
  let analysis: DecisionAnalysis | undefined = undefined;
  if (parsed.isReadyForAnalysis) {
    analysis = calculateFeasibility(parsed.data, lang, currency);
  }

  return {
    data: parsed.data,
    missingQuestions: parsed.missingQuestions,
    isReadyForAnalysis: parsed.isReadyForAnalysis,
    analysis,
    aiEnhanced: false
  };
}
