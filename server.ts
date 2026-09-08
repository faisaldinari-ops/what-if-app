// server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { parseProjectWithRules } from './src/services/ai/ruleBasedParser';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '2mb' }));

// Lazy initialization for Gemini AI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Server-side project analysis endpoint (protecting API key from client)
app.post('/api/analyze-project', async (req, res) => {
  try {
    const { prompt, existingData, lang = 'fr', currency = 'EUR' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      // No Gemini API key provided -> inform client to proceed with rule-based extraction
      return res.json({
        fallback: true,
        message: 'No GEMINI_API_KEY configured, using deterministic parser'
      });
    }

    const systemInstruction = `You are WHAT IF?, a sharp, realistic, empathetic life-decision and project feasibility co-pilot.
Analyze the user's project request and extract known variables.
CRITICAL RULES:
1. NEVER invent numbers the user did not say as facts. If unknown, leave null or provide industry benchmark.
2. Check if budget (available savings/capital), current income, and current living expenses are provided.
3. If crucial data is missing to assess viability, generate MAXIMUM 1 to 3 short, direct questions.
4. If the user already provided budget and income, do NOT ask for them again!
5. Output valid JSON adhering to the required schema.

Language of response: ${lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : 'English'}.`;

    const userMessage = `User Input: "${prompt}"
Existing known data: ${JSON.stringify(existingData || {})}
Currency: ${currency}

Please analyze and return JSON with:
{
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
  "isReadyForAnalysis": boolean (true if budget, income, expenses are all known or can be evaluated),
  "aiSummary": string (2-3 human sentences explaining the core realistic situation)
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userMessage,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const text = response.text?.trim();
    if (!text) {
      return res.json({ fallback: true });
    }

    const parsed = JSON.parse(text);

    // Merge with existing data
    const finalData = {
      prompt,
      projectTitle: parsed.projectTitle || 'Nouveau Projet',
      category: parsed.category || 'entrepreneurship',
      location: parsed.location || existingData?.location,
      budget: parsed.budget !== null && parsed.budget !== undefined ? parsed.budget : existingData?.budget,
      monthlyIncome:
        parsed.monthlyIncome !== null && parsed.monthlyIncome !== undefined ? parsed.monthlyIncome : existingData?.monthlyIncome,
      monthlyExpenses:
        parsed.monthlyExpenses !== null && parsed.monthlyExpenses !== undefined ? parsed.monthlyExpenses : existingData?.monthlyExpenses,
      projectStartupCost: parsed.projectStartupCost || existingData?.projectStartupCost,
      projectMonthlyRunningCost: parsed.projectMonthlyRunningCost || existingData?.projectMonthlyRunningCost,
      projectExpectedRevenue: parsed.projectExpectedRevenue || existingData?.projectExpectedRevenue,
      monthsBeforeRevenue: parsed.monthsBeforeRevenue || existingData?.monthsBeforeRevenue,
      timelineMonths: existingData?.timelineMonths || 12,
      customAnswers: existingData?.customAnswers || {}
    };

    const hasBudget = finalData.budget !== undefined && finalData.budget !== null;
    const hasIncome = finalData.monthlyIncome !== undefined && finalData.monthlyIncome !== null;
    const hasExpenses = finalData.monthlyExpenses !== undefined && finalData.monthlyExpenses !== null;

    const isReady = hasBudget && hasIncome && hasExpenses;
    const filteredQuestions = isReady
      ? []
      : (parsed.missingQuestions || []).filter((q: any) => {
          if (q.field === 'budget' && hasBudget) return false;
          if (q.field === 'monthlyIncome' && hasIncome) return false;
          if (q.field === 'monthlyExpenses' && hasExpenses) return false;
          return true;
        }).slice(0, 3);

    return res.json({
      data: finalData,
      missingQuestions: filteredQuestions,
      isReadyForAnalysis: isReady || filteredQuestions.length === 0,
      aiSummary: parsed.aiSummary
    });
  } catch (err) {
    console.warn('Gemini AI unavailable or rate-limited, serving deterministic parser:', err);
    const { prompt, existingData, lang = 'fr' } = req.body;
    const ruleResult = parseProjectWithRules(prompt, existingData, lang);
    return res.json({
      data: ruleResult.data,
      missingQuestions: ruleResult.missingQuestions,
      isReadyForAnalysis: ruleResult.isReadyForAnalysis,
      aiSummary: undefined,
      fallback: true
    });
  }
});

// Vite middleware in dev or static files in production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WHAT IF? Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
