// src/components/MyFuturesView.tsx
import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Play,
  Edit2,
  Copy,
  Trash2,
  Download,
  GitBranch,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData } from '../logic/engine';

interface MyFuturesViewProps {
  futures: SimData[];
  currentSimId: string;
  onOpenSim: (sim: SimData) => void;
  onNewSim: () => void;
  onRenameSim: (id: string, newName: string) => void;
  onDuplicateSim: (sim: SimData) => void;
  onDeleteSim: (id: string) => void;
  onExportSim: (sim: SimData) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const MyFuturesView: React.FC<MyFuturesViewProps> = ({
  futures,
  currentSimId,
  onOpenSim,
  onNewSim,
  onRenameSim,
  onDuplicateSim,
  onDeleteSim,
  onExportSim,
  lang,
  currency
}) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filtered = futures.filter(f => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartRename = (f: SimData) => {
    setEditingId(f.id);
    setEditingName(f.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSim(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">{t.futures.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.futures.subtitle}</p>
        </div>

        <button
          id="futures-create-new-btn"
          onClick={onNewSim}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>{t.ui.new_sim}</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="futures-search-input"
            type="text"
            placeholder={t.futures.search_placeholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category filter */}
        <select
          id="futures-category-filter"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-medium"
        >
          <option value="all">{t.futures.filter_category}: All</option>
          {Object.keys(t.categories).map(catKey => (
            <option key={catKey} value={catKey}>
              {t.categories[catKey as keyof typeof t.categories]}
            </option>
          ))}
        </select>
      </div>

      {/* Futures Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
          <FolderKanban className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">{t.futures.no_futures}</p>
          <button
            onClick={onNewSim}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold"
          >
            {t.ui.new_sim}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(sim => {
            const isCurrent = sim.id === currentSimId;
            const isEditing = editingId === sim.id;

            return (
              <div
                key={sim.id}
                id={`future-card-${sim.id}`}
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-indigo-500/80 bg-slate-900/90 shadow-md ring-1 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {t.categories[sim.category as keyof typeof t.categories] || sim.category}
                    </span>

                    {sim.forkedFrom && (
                      <span className="text-[9px] font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-900 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5" />
                        <span>{t.futures.branch_badge}</span>
                      </span>
                    )}
                  </div>

                  {/* Title or Rename Input */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 my-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="h-8 px-2 rounded bg-slate-900 border border-indigo-500 text-white text-xs font-bold w-full"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveRename(sim.id)}
                        className="p-1 rounded bg-indigo-600 text-white"
                        title="Save name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-white tracking-tight line-clamp-1">
                      {sim.name}
                    </h3>
                  )}

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                    {sim.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {t.futures.last_modified}:{' '}
                      {new Date(sim.lastModified || sim.createdAt).toLocaleDateString(
                        lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US'
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <button
                    id={`open-sim-${sim.id}`}
                    onClick={() => onOpenSim(sim)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{t.futures.open_btn}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      id={`rename-sim-${sim.id}`}
                      onClick={() => handleStartRename(sim)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title={t.futures.rename_btn}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`duplicate-sim-${sim.id}`}
                      onClick={() => onDuplicateSim(sim)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title={t.futures.duplicate_btn}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`export-sim-${sim.id}`}
                      onClick={() => onExportSim(sim)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                      title={t.futures.export_json}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      id={`delete-sim-${sim.id}`}
                      onClick={() => onDeleteSim(sim.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title={t.futures.delete_btn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
