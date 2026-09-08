// src/components/SimulationChart.tsx
import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { SupportedLang, SupportedCurrency, translations, formatCurrency } from '../i18n';
import { ScenarioType, SimResultPoint } from '../logic/engine';

interface SimulationChartProps {
  scenarios: Record<ScenarioType, SimResultPoint[]>;
  selectedMonth: number;
  onSelectMonth: (m: number) => void;
  lang: SupportedLang;
  currency: SupportedCurrency;
}

export const SimulationChart: React.FC<SimulationChartProps> = ({
  scenarios,
  selectedMonth,
  onSelectMonth,
  lang,
  currency
}) => {
  const t = translations[lang];

  // Merge the points of all 4 scenarios by month
  const chartData = (scenarios.expected || []).map((pt, idx) => {
    const m = pt.m;
    const cons = scenarios.conservative?.[idx]?.cash ?? 0;
    const exp = pt.cash;
    const opt = scenarios.optimistic?.[idx]?.cash ?? 0;
    const cust = scenarios.custom?.[idx]?.cash ?? 0;

    let monthLabel = `${m}m`;
    if (m === 0) monthLabel = t.timeline.today;
    else if (m === 12) monthLabel = t.timeline.m12;
    else if (m === 36) monthLabel = t.timeline.m36;
    else if (m === 60) monthLabel = t.timeline.m60;

    return {
      m,
      monthLabel,
      conservative: cons,
      expected: exp,
      optimistic: opt,
      custom: cust
    };
  });

  const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
      return `${Math.round(value / 1000)}k`;
    }
    return `${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2 min-w-[190px]">
          <div className="font-bold text-white pb-1.5 border-b border-slate-800 flex items-center justify-between">
            <span>{dataPoint.monthLabel}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {dataPoint.m === 0 ? 'Month 0' : `Month ${dataPoint.m}`}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                {t.scenarios.conservative}
              </span>
              <span className="font-bold text-white">
                {formatCurrency(dataPoint.conservative, currency, lang)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
                {t.scenarios.expected}
              </span>
              <span className="font-bold text-white">
                {formatCurrency(dataPoint.expected, currency, lang)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                {t.scenarios.optimistic}
              </span>
              <span className="font-bold text-white">
                {formatCurrency(dataPoint.optimistic, currency, lang)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-violet-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                {t.scenarios.custom}
              </span>
              <span className="font-bold text-white">
                {formatCurrency(dataPoint.custom, currency, lang)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            {t.scenarios.end_projection} (60 {t.metrics.months})
          </h3>
          <p className="text-xs text-slate-400">
            {t.app_name} — {t.scenarios.projection_at} {selectedMonth === 0 ? t.timeline.today : `${selectedMonth} ${t.metrics.months}`}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>{t.scenarios.conservative}</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>{t.scenarios.expected}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sky-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>{t.scenarios.optimistic}</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span>{t.scenarios.custom}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const clickedM = e.activePayload[0].payload.m;
                onSelectMonth(clickedM);
              }
            }}
          >
            <defs>
              <linearGradient id="gradExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradOptimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="monthLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickFormatter={formatYAxis}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference zero line */}
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.6} />

            {/* Areas and Curves */}
            <Area
              type="monotone"
              dataKey="optimistic"
              stroke="#38bdf8"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradOptimistic)"
            />
            <Area
              type="monotone"
              dataKey="expected"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#gradExpected)"
            />
            <Area
              type="monotone"
              dataKey="conservative"
              stroke="#f59e0b"
              strokeWidth={2}
              fillOpacity={0}
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="custom"
              stroke="#a855f7"
              strokeWidth={1.5}
              fillOpacity={0}
              strokeDasharray="2 2"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
