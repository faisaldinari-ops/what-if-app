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

  const projectCategories =
    lang === 'fr'
      ? [
          { label: 'Créer mon entreprise', template: 'J’ai 5 000 € et je veux ouvrir un commerce / food truck.' },
          { label: 'Partir vivre ailleurs', template: 'Je veux quitter la France pour aller vivre et travailler en Espagne.' },
          { label: 'Voyager', template: 'Je veux partir voyager 10 jours au Japon avec un budget de 1 200 €.' },
          { label: 'Changer de métier', template: 'Je gagne 2 200 €/mois et je veux changer de métier pour devenir développeur ou artisan.' },
          { label: 'Acheter quelque chose', template: 'Je gagne 2 400 €/mois et je veux acheter un appartement à 180 000 €.' },
          { label: 'Lancer un projet', template: 'Je veux créer un site web / une application mobile mais j’ai 0 €.' },
          { label: 'Je ne sais pas encore', template: 'J’ai 10 000 € d’économies de côté et je cherche le meilleur projet réaliste.' }
        ]
      : lang === 'es'
      ? [
          { label: 'Crear mi empresa', template: 'Tengo 5 000 € y quiero abrir un food truck.' },
          { label: 'Irme a vivir fuera', template: 'Quiero mudarme a España o Portugal.' },
          { label: 'Viajar', template: 'Quiero viajar a Japón 10 días.' },
          { label: 'Cambiar de trabajo', template: 'Quiero cambiar de profesión.' },
          { label: 'Comprar algo', template: 'Quiero comprar una casa.' },
          { label: 'Lanzar un proyecto', template: 'Quiero crear una web con 0 €.' },
          { label: 'Aún no lo sé', template: 'Tengo ahorros y busco un proyecto realista.' }
        ]
      : [
          { label: 'Start a business', template: 'I have $5,000 and want to launch a food truck.' },
          { label: 'Move abroad', template: 'I want to relocate to Spain.' },
          { label: 'Travel', template: 'I want to travel to Japan for 10 days.' },
          { label: 'Career change', template: 'I want to switch careers.' },
          { label: 'Buy something', template: 'I want to buy an apartment.' },
          { label: 'Launch a project', template: 'I want to build a web app with $0.' },
          { label: 'Not sure yet', template: 'I have savings and look for a realistic project.' }
        ];

  const quickPrompts =
    lang === 'fr'
      ? [
          'J’ai 5 000 € et je veux ouvrir un food truck.',
          'J’ai 20 000 €, je gagne 2 800 €/mois, je dépense 1 600 € et je veux ouvrir un barber shop.',
          'Je gagne 2 400 €/mois et je veux acheter un appartement.',
          'Je veux partir au Japon 10 jours avec 800 €.',
          'Je veux créer un site web mais j’ai 0 €.',
          'Je veux quitter mon travail pour devenir indépendant.',
          'Je veux déménager en Espagne.',
          'Je veux vivre à Miami, j’ai 300 € et pas de diplôme.'
        ]
      : lang === 'es'
      ? [
          'Tengo 5 000 € y quiero abrir un food truck.',
          'Tengo 20 000 €, gano 2 800 €/mes, gasto 1 600 € y quiero abrir una peluquería.',
          'Gano 2 400 €/mes y quiero comprar un piso.',
          'Quiero viajar a Japón 10 días con 800 €.',
          'Quiero crear una web pero tengo 0 €.',
          'Quiero mudarme a España.'
        ]
      : [
          'I have $5,000 and I want to launch a food truck.',
          'I have $20,000, earn $2,800/mo, spend $1,600 and want to open a barber shop.',
          'I earn $2,400/month and want to buy an apartment.',
          'I want to travel to Japan for 10 days with $800.',
          'I want to launch a website but have $0.',
          'I want to relocate to Spain.'
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
            ? 'Qu’est-ce que tu aimerais changer ou réaliser ?'
            : lang === 'es'
            ? '¿Qué te gustaría cambiar o lograr?'
            : 'What would you like to change or achieve?'}
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto font-normal">
          {lang === 'fr'
            ? 'Explique-moi ton projet comme tu l’expliquerais à un ami…'
            : lang === 'es'
            ? 'Explícame tu proyecto como se lo contarías a un amigo…'
            : 'Tell me about your goal like you would to a friend…'}
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
                ? 'Explique-moi ton projet comme tu l’expliquerais à un ami…'
                : lang === 'es'
                ? 'Explícame tu proyecto como se lo contarías a un amigo…'
                : 'Explain your project as you would to a friend…'
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

      {/* Section 2 Category Buttons */}
      <div className="w-full mt-6 space-y-2 text-left">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          {lang === 'fr'
            ? 'Choisir une thématique :'
            : lang === 'es'
            ? 'Elegir una categoría:'
            : 'Choose a project topic:'}
        </p>
        <div className="flex flex-wrap gap-2">
          {projectCategories.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setPrompt(cat.template);
              }}
              className="text-xs font-medium text-slate-300 bg-slate-900/60 hover:bg-indigo-950/50 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Prompts Suggestions */}
      <div className="w-full mt-8 space-y-3 text-left">
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
