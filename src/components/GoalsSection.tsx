// src/components/GoalsSection.tsx
import React, { useState } from 'react';
import { Flag, Plus, Trash2, CheckCircle2, Clock, X } from 'lucide-react';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { SimData, GoalConfig, evaluateGoals, SimResultPoint, ScenarioType } from '../logic/engine';

interface GoalsSectionProps {
  simData: SimData;
  scenarios: Record<ScenarioType, SimResultPoint[]>;
  lang: SupportedLang;
  currency: SupportedCurrency;
  onUpdateGoals: (goals: GoalConfig[]) => void;
}

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  simData,
  scenarios,
  lang,
  currency,
  onUpdateGoals
}) => {
  const t = translations[lang];
  const goals = simData.goals || [];

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'savings' | 'income' | 'debt'>('savings');
  const [newTargetVal, setNewTargetVal] = useState(50000);

  const scenarioOrder: ScenarioType[] = ['conservative', 'expected', 'optimistic', 'custom'];

  const getScenarioLabel = (s: ScenarioType) => {
    switch (s) {
      case 'conservative':
        return t.scenarios.conservative;
      case 'expected':
        return t.scenarios.expected;
      case 'optimistic':
        return t.scenarios.optimistic;
      case 'custom':
        return t.scenarios.custom;
    }
  };

  const handleAddGoal = () => {
    if (!newTitle.trim()) return;
    const newGoal: GoalConfig = {
      id: `goal-${Date.now()}`,
      name: newTitle.trim(),
      type: newType,
      target: newTargetVal,
      targetMonths: 36
    };
    onUpdateGoals([...goals, newGoal]);
    setNewTitle('');
    setIsAdding(false);
  };

  const handleDeleteGoal = (id: string) => {
    onUpdateGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-900/60 text-emerald-400">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{t.goals.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.goals.subtitle}</p>
          </div>
        </div>

        {!isAdding && (
          <button
            id="goals-add-btn"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.goals.add_goal}</span>
          </button>
        )}
      </div>

      {/* Adding form */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-emerald-800/80 bg-slate-900/80 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{t.goals.add_goal}</h4>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label htmlFor="new-goal-title-input" className="text-slate-300 font-semibold">{t.goals.name_label}</label>
              <input
                id="new-goal-title-input"
                type="text"
                placeholder="e.g. 6-Month Emergency Fund"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full h-9 px-2.5 rounded bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="new-goal-type-select" className="text-slate-300 font-semibold">{t.goals.type_label}</label>
              <select
                id="new-goal-type-select"
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full h-9 px-2.5 rounded bg-slate-950 border border-slate-700 text-white text-xs"
              >
                <option value="savings">{t.goals.type_savings}</option>
                <option value="income">{t.goals.type_income}</option>
                <option value="debt_zero">{t.goals.type_debt_free}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="new-goal-target-input" className="text-slate-300 font-semibold">{t.goals.target_value}</label>
              <input
                id="new-goal-target-input"
                type="number"
                value={newTargetVal}
                onChange={e => setNewTargetVal(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded bg-slate-950 border border-slate-700 text-white text-xs font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white"
            >
              {t.ui.cancel}
            </button>
            <button
              id="save-new-goal-btn"
              onClick={handleAddGoal}
              className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
            >
              {t.ui.save}
            </button>
          </div>
        </div>
      )}

      {/* Goals Display List */}
      {goals.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500">
          No milestone goals defined yet. Add one to track when your decision achieves financial milestones.
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => {
            // Evaluate this goal across all 4 scenarios
            return (
              <div
                key={goal.id}
                id={`goal-item-${goal.id}`}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3"
              >
                {/* Goal Item Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{goal.name}</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded">
                      Target: {formatCurrency(goal.target, currency, lang)}
                    </span>
                  </div>
                  <button
                    id={`delete-goal-${goal.id}`}
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title={t.ui.delete}
                    aria-label={`Delete ${goal.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress across scenarios */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  {scenarioOrder.map(sKey => {
                    const evaluated = evaluateGoals(simData, scenarios[sKey]).find(g => g.goalId === goal.id);
                    const pct = evaluated ? evaluated.progressPercent : 0;
                    const reached = evaluated ? evaluated.reachedAtMonth : null;

                    return (
                      <div
                        key={sKey}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold">{getScenarioLabel(sKey)}</span>
                          <span className="font-bold text-white">{pct}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          {reached !== null ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              {t.goals.status_reached} {reached === 0 ? t.timeline.today : `${reached}m`}
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {t.goals.status_not_reached}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
