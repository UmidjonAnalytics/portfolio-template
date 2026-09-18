"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import type { ChartType, ProjectChart } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: ChartType[] = ["bar", "line", "area"];

export function useChartColors() {
  const { resolved } = useTheme();
  const [colors, setColors] = useState({ series: ["#0f8b8d", "#e08a2e", "#6c5ce7", "#2d9cdb", "#d64f79"], grid: "#e6e6e0", text: "#6b7280" });
  useEffect(() => {
    const cs = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
    // Resolve color-mix() values by painting them on a probe element.
    const probe = document.createElement("span");
    probe.style.display = "none";
    document.body.appendChild(probe);
    const resolve = (v: string) => {
      probe.style.color = v;
      return getComputedStyle(probe).color || v;
    };
    setColors({
      series: [1, 2, 3, 4, 5].map((i) => resolve(read(`--chart-${i}`, "#0f8b8d"))),
      grid: resolve(read("--chart-grid", "#e6e6e0")),
      text: resolve(read("--chart-text", "#6b7280")),
    });
    probe.remove();
  }, [resolved]);
  return colors;
}

export function InteractiveChart({ chart, className }: { chart: ProjectChart; className?: string }) {
  const { t, tr } = useLocale();
  const colors = useChartColors();
  const [type, setType] = useState<ChartType>(chart.type ?? "bar");
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    setType(chart.type ?? "bar");
    setHidden(new Set());
  }, [chart]);

  const series = useMemo(() => chart.series.filter((s) => !hidden.has(s.key)), [chart.series, hidden]);

  const toggle = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (next.size < chart.series.length - 1) next.add(key);
      return next;
    });

  const common = {
    data: chart.data,
    margin: { top: 12, right: 12, left: -12, bottom: 0 },
  };
  const axisProps = { stroke: colors.text, fontSize: 12, tickLine: false, axisLine: false };
  const tooltipStyle = { borderRadius: 10, fontSize: 13 };

  const colorOf = (i: number, custom?: string) => custom || colors.series[i % colors.series.length];

  return (
    <div className={cn("card p-4 sm:p-5", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h4 className="font-semibold">{t("projects.chart.title")}</h4>
        <div className="inline-flex rounded-full border border-line bg-surface-2 p-0.5" role="group" aria-label={t("projects.chart.type")}>
          {TYPES.map((ty) => (
            <button
              key={ty}
              type="button"
              onClick={() => setType(ty)}
              aria-pressed={type === ty}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-bold transition",
                type === ty ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
              )}
            >
              {t(`projects.chart.${ty}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("projects.chart.series")}>
        {chart.series.map((s, i) => {
          const off = hidden.has(s.key);
          const name = tr(s.name);
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              aria-pressed={!off}
              aria-label={t("projects.chart.toggle", { name })}
              className={cn(
                "inline-flex items-center gap-2 h-8 px-3 rounded-full border text-xs font-semibold transition",
                off ? "border-line text-muted line-through opacity-70" : "border-line-strong text-fg bg-surface",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(i, s.color), opacity: off ? 0.3 : 1 }} aria-hidden="true" />
              {name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart {...common}>
              <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: colors.grid, opacity: 0.5 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => {
                const i = chart.series.findIndex((x) => x.key === s.key);
                return <Bar key={s.key} dataKey={s.key} name={tr(s.name)} fill={colorOf(i, s.color)} radius={[6, 6, 0, 0]} maxBarSize={38} isAnimationActive />;
              })}
            </BarChart>
          ) : type === "line" ? (
            <LineChart {...common}>
              <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => {
                const i = chart.series.findIndex((x) => x.key === s.key);
                return (
                  <Line key={s.key} type="monotone" dataKey={s.key} name={tr(s.name)} stroke={colorOf(i, s.color)} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: colorOf(i, s.color) }} activeDot={{ r: 5 }} />
                );
              })}
            </LineChart>
          ) : (
            <AreaChart {...common}>
              <defs>
                {chart.series.map((s, i) => (
                  <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorOf(i, s.color)} stopOpacity={0.45} />
                    <stop offset="95%" stopColor={colorOf(i, s.color)} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={colors.grid} vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey={chart.xKey} {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {series.map((s) => {
                const i = chart.series.findIndex((x) => x.key === s.key);
                return (
                  <Area key={s.key} type="monotone" dataKey={s.key} name={tr(s.name)} stroke={colorOf(i, s.color)} strokeWidth={2.5} fill={`url(#grad-${s.key})`} />
                );
              })}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Validate a chart JSON object coming from the admin form. Returns an error string or null. */
export function validateChart(value: unknown): string | null {
  if (!value || typeof value !== "object") return "Chart must be an object";
  const c = value as Partial<ProjectChart>;
  if (!c.type || !TYPES.includes(c.type)) return 'type must be "bar", "line" or "area"';
  if (!c.xKey || typeof c.xKey !== "string") return "xKey must be a string";
  if (!Array.isArray(c.series) || c.series.length === 0) return "series must be a non-empty array";
  for (const s of c.series) {
    if (!s || typeof s.key !== "string") return "each series needs a string key";
    if (!s.name || typeof s.name !== "object" || typeof s.name.en !== "string") return "each series needs name: { en: ... }";
  }
  if (!Array.isArray(c.data) || c.data.length === 0) return "data must be a non-empty array";
  for (const row of c.data) {
    if (!row || typeof row !== "object") return "each data row must be an object";
    if (!(c.xKey in row)) return `each data row needs the "${c.xKey}" key`;
  }
  return null;
}
