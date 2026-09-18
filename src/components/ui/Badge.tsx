import { cn } from "@/lib/utils";

const TOOL_STYLES: Record<string, string> = {
  Excel: "bg-[#1d6f42]/12 text-[#166534] dark:text-[#4ade80] dark:bg-[#1d6f42]/25",
  "Power BI": "bg-[#f2c811]/18 text-[#7a5b00] dark:text-[#fcd34d] dark:bg-[#f2c811]/20",
  SQL: "bg-[#0ea5e9]/12 text-[#075985] dark:text-[#7dd3fc] dark:bg-[#0ea5e9]/22",
  Python: "bg-[#3b82f6]/12 text-[#1e40af] dark:text-[#93c5fd] dark:bg-[#3b82f6]/22",
  Tableau: "bg-[#e97627]/14 text-[#9a3412] dark:text-[#fdba74] dark:bg-[#e97627]/22",
  "Google Sheets": "bg-[#0f9d58]/12 text-[#065f46] dark:text-[#6ee7b7] dark:bg-[#0f9d58]/22",
};

export function ToolBadge({ tool, className, size = "sm" }: { tool: string; className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        TOOL_STYLES[tool] ?? "bg-surface-2 text-fg-2 border border-line",
        className,
      )}
    >
      {tool}
    </span>
  );
}

export function Badge({ children, className, tone = "neutral" }: { children: React.ReactNode; className?: string; tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-surface-2 text-fg-2 border border-line",
    accent: "bg-accent-soft text-accent-strong border border-transparent",
    success: "bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success border border-transparent",
    warning: "bg-[color-mix(in_oklab,var(--warning)_16%,transparent)] text-warning border border-transparent",
    danger: "bg-danger-soft text-danger border border-transparent",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
