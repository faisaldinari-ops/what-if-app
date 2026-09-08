// src/features/project-input/HeroInput.tsx
import React, { useState } from 'react';
import { ArrowRight, Sparkles, Compass, ShieldCheck } from 'lucide-react';
import { SupportedLang } from '../../i18n';

interface HeroInputProps {
  lang: SupportedLang;
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export const HeroInput: React.FC<HeroInputProps> = ({ lang, onSubmit, isLoading = false }) => {
  const [prompt, setPrompt] = useState('');

  const quickPrompts =
    lang === 'fr'
      ? [
          'J’ai 5 000 € et je veux ouvrir un food truck.',
          'J’ai 20 000 €, je gagne 2 800 €/mois, je dépense 1 600 € et je veux ouvrir un barber shop.',
          'Je gagne 2 400 €/mois et je veux acheter un appartement.',
          'Je veux quitter mon travail pour devenir indépendant.',
          'J’ai 3 000 € et je veux créer une marque de vêtements.',
          'Je veux déménager en Espagne.',
          'Je veux ouvrir un restaurant mais je ne sais pas combien il me faut.',
          'Je veux lancer une application avec 1 500 €.',
          'Je veux acheter une voiture à 30 000 €.'
        ]
      : lang === 'es'
      ? [
          'Tengo 5 000 € y quiero abrir un food truck.',
          'Tengo 20 000 €, gano 2 800 €/mes, gasto 1 600 € y quiero abrir una peluquería.',
          'Gano 2 400 €/mes y quiero comprar un piso.',
          'Quiero dejar mi trabajo para ser autónomo.',
          'Tengo 3 000 € y quiero crear una marca de ropa.',
          'Quiero mudarme a España.',
          'Quiero abrir un restaurante pero no sé cuánto dinero necesito.',
          'Quiero lanzar una aplicación con 1 500 €.',
          'Quiero comprar un coche de 30 000 €.'
        ]
      : [
          'I have $5,000 and I want to launch a food truck.',
          'I have $20,000, earn $2,800/mo, spend $1,600 and want to open a barber shop.',
          'I earn $2,400/month and want to buy an apartment.',
          'I want to leave my job to become a freelancer.',
          'I have $3,000 and want to create a clothing brand.',
          'I want to relocate to Spain.',
          'I want to open a restaurant but do not know how much I need.',
          'I want to launch a mobile app with $1,500.',
          'I want to buy a $30,000 car.'
        ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = prompt.trim();
    if (clean && !isLoading) {
      onSubmit(clean);
    }
  };

  const handleSelectPrompt = (p: string) => {
    setPrompt(p);
    onSubmit(p);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center text-center">
      {/* Brand Title */}
      <div className="space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>WHAT IF?</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          {lang === 'fr'
            ? 'Et si ton projet était possible ?'
            : lang === 'es'
            ? '¿Y si tu proyecto fuera posible?'
            : 'What if your project were possible?'}
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto font-normal">
          {lang === 'fr'
            ? 'Explique-moi simplement ce que tu veux faire.'
            : lang === 'es'
            ? 'Cuéntame de forma sencilla lo que quieres hacer.'
            : 'Simply describe what you want to achieve.'}
        </p>
      </div>

      {/* Main Conversational Input */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-2 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-transparent text-white text-base sm:text-lg placeholder-slate-500 p-4 resize-none focus:outline-none leading-relaxed"
            placeholder={
              lang === 'fr'
                ? 'Exemple : j’ai 8 000 €, je gagne 2 300 € par mois et j’aimerais ouvrir un petit commerce. Est-ce possible ?'
                : lang === 'es'
                ? 'Ejemplo: tengo 8 000 €, gano 2 300 € al mes y me gustaría abrir un pequeño comercio. ¿Es viable?'
                : 'Example: I have $8,000, earn $2,300 per month and would like to open a small shop. Is it feasible?'
            }
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 border-t border-slate-800/60">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 self-start sm:self-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'fr'
                ? 'Analyse confidentielle & calculs 100% transparents'
                : lang === 'es'
                ? 'Análisis confidencial y cálculos transparentes'
                : 'Confidential analysis & deterministic calculation'}
            </span>

            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>
                    {lang === 'fr'
                      ? 'Analyse en cours...'
                      : lang === 'es'
                      ? 'Analizando...'
                      : 'Analyzing...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {lang === 'fr'
                      ? 'Analyser mon projet'
                      : lang === 'es'
                      ? 'Analizar mi proyecto'
                      : 'Analyze my project'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Reassurance subtext */}
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          {lang === 'fr'
            ? 'WHAT IF? analyse ton projet, ton budget, les risques et les différentes façons de le rendre réalisable.'
            : lang === 'es'
            ? 'WHAT IF? analiza tu proyecto, tu presupuesto, los riesgos y las opciones para hacerlo viable.'
            : 'WHAT IF? analyzes your plan, budget, risks and the exact paths to make it achievable.'}
        </p>
      </form>

      {/* Quick Prompts Suggestions */}
      <div className="w-full mt-10 space-y-3 text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          {lang === 'fr'
            ? 'Ou clique sur un exemple fréquent :'
            : lang === 'es'
            ? 'O elige un ejemplo habitual:'
            : 'Or try a popular question:'}
        </p>

        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPrompt(qp)}
              className="text-xs sm:text-sm text-slate-300 bg-slate-900/80 hover:bg-slate-800 hover:text-white border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-xl transition-colors text-left focus:outline-none"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
