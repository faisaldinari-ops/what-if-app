// src/features/projects/SavedProjectsDrawer.tsx
import React from 'react';
import { DecisionAnalysis } from '../../types/decision';
import { SupportedLang, SupportedCurrency, formatCurrency } from '../../i18n';
import { X, FolderKanban, Trash2, ArrowRight, Sparkles, Clock } from 'lucide-react';

interface SavedProjectsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProjects: DecisionAnalysis[];
  onSelectProject: (project: DecisionAnalysis) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const SavedProjectsDrawer: React.FC<SavedProjectsDrawerProps> = ({
  isOpen,
  onClose,
  savedProjects,
  onSelectProject,
  onDeleteProject,
  lang,
  currency
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col text-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              {lang === 'fr'
                ? 'Mes projets analysés'
                : lang === 'es'
                ? 'Mis proyectos guardados'
                : 'My Saved Projects'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedProjects.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                {lang === 'fr' ? 'Aucun projet sauvegardé' : 'No saved projects yet'}
              </p>
              <p className="text-xs">
                {lang === 'fr'
                  ? 'Tes analyses futures apparaîtront ici automatiquement.'
                  : 'Your analyzed scenarios will be saved here automatically.'}
              </p>
            </div>
          ) : (
            savedProjects.map(proj => {
              const badgeColor =
                proj.score >= 75
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                  : proj.score >= 45
                  ? 'text-amber-400 bg-amber-950/40 border-amber-800/40'
                  : 'text-rose-400 bg-rose-950/40 border-rose-800/40';

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSelectProject(proj);
                    onClose();
                  }}
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500/70 hover:bg-slate-900/90 transition-all cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {proj.userInput.projectTitle}
                    </h4>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}
                    >
                      {proj.score}/100
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {proj.verdictSummary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(proj.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={e => onDeleteProject(proj.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
