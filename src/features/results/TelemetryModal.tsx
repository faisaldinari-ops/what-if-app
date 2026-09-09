// src/features/results/TelemetryModal.tsx
import React, { useState, useEffect } from 'react';
import { SupportedLang } from '../../i18n';
import { Activity, ShieldCheck, Zap, X, Database, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { TelemetrySummary } from '../../services/ai/telemetryService';

interface TelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: SupportedLang;
}

export const TelemetryModal: React.FC<TelemetryModalProps> = ({ isOpen, onClose, lang }) => {
  const [data, setData] = useState<TelemetrySummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.warn('Unable to load telemetry endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'fr' ? 'Observabilité & Maîtrise des Coûts' : 'Cost & Telemetry Observability'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'fr'
                  ? 'Gouvernance stricte des tokens et des dépenses API'
                  : 'Strict token governance and API expense limits'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Dépense Jour' : 'Cost Today'}
            </span>
            <span className="text-lg font-extrabold text-emerald-400">
              ${data?.costTodayUsd.toFixed(4) || '0.0000'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Plafond : ${data?.hardDailyBudgetUsd.toFixed(2) || '0.50'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Tokens Aujourd’hui' : 'Tokens Today'}
            </span>
            <span className="text-lg font-extrabold text-indigo-300">
              {data?.tokensConsumedToday.total.toLocaleString() || '0'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              In: {data?.tokensConsumedToday.input || 0} / Out: {data?.tokensConsumedToday.output || 0}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Taux Hit Cache' : 'Cache Hit Rate'}
            </span>
            <span className="text-lg font-extrabold text-indigo-400">
              {data?.cacheHitRatePct || 0} %
            </span>
            <span className="text-[10px] text-slate-500 block">
              {lang === 'fr' ? 'Zéro token consommé' : 'Zero token cost'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'fr' ? 'Requêtes Bloquées' : 'Blocked Requests'}
            </span>
            <span className="text-lg font-extrabold text-slate-300">
              {data?.blockedRequestsCount || 0}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Spam / Cooldown
            </span>
          </div>
        </div>

        {/* Cost Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-emerald-300 block">
              {lang === 'fr' ? 'Garantie Zéro Bascule Automatique Payante' : 'Zero Automatic Paid Fallback Guarantee'}
            </span>
            <p className="text-emerald-200/80 leading-relaxed">
              {lang === 'fr'
                ? `Le paramètre ALLOW_PAID_AI est configuré sur ${data?.allowPaidAi ? 'ACTIF' : 'INACTIF (par défaut)'}. En cas de dépassement du budget journalier ou d’indisponibilité des quotas gratuits, WHAT IF? bascule automatiquement sur le moteur déterministe Niveau 0 sans jamais générer de facture imprévue.`
                : 'ALLOW_PAID_AI is strictly restricted. If quotas are exhausted, WHAT IF? immediately switches to deterministic fallback.'}
            </p>
          </div>
        </div>

        {/* Active Providers Chain */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300">
            {lang === 'fr' ? 'Chaîne de Fallback des Modèles :' : 'Model Fallback Chain:'}
          </span>
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-1.5 font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>1. Google Gemini Flash (Free Tier)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>2. Groq LLaMA 3.1 8B Instant (Free Tier)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>3. OpenRouter Free Models</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>4. Moteur Déterministe WHAT IF? (Niveau 0 - 0 Token)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            {lang === 'fr' ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
