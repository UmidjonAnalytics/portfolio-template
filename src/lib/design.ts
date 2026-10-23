// ---------------------------------------------------------------------------
// Site design: a site-wide style, background, motion and spacing, plus one layout per section.
// Stored at site/settings.design. Styles are CSS token sets in globals.css ([data-style=…]).
// ---------------------------------------------------------------------------

import type { SectionKey } from "./types";

export const STYLE_KEYS = ["classic", "mono", "excel", "sql", "powerbi", "notebook"] as const;
export type StyleKey = (typeof STYLE_KEYS)[number];

export const BACKGROUND_KEYS = ["auto", "plain", "grid", "dots", "lines", "glow"] as const;
export type BackgroundKey = (typeof BACKGROUND_KEYS)[number];

export const MOTION_KEYS = ["smooth", "fade", "slide", "zoom", "none"] as const;
export type MotionKey = (typeof MOTION_KEYS)[number];

export const SPEED_KEYS = ["slow", "normal", "fast"] as const;
export type SpeedKey = (typeof SPEED_KEYS)[number];

export const DENSITY_KEYS = ["compact", "normal", "spacious"] as const;
export type DensityKey = (typeof DENSITY_KEYS)[number];

/** Layouts each block can use. The first one is the default. */
export const LAYOUTS = {
  hero: ["split", "centered", "minimal"],
  skills: ["cards", "rings", "chips", "table"],
  projects: ["grid", "compact", "stacked", "carousel", "swipe"],
  experience: ["timeline", "cards", "zigzag"],
  certificates: ["grid", "slider", "list"],
  education: ["cards", "timeline", "list"],
  testimonials: ["carousel", "grid", "wall"],
  blog: ["grid", "list", "featured"],
} as const;

export type LayoutBlock = keyof typeof LAYOUTS;
export type LayoutOf<K extends LayoutBlock> = (typeof LAYOUTS)[K][number];
export type Layouts = { [K in LayoutBlock]: LayoutOf<K> };
export const LAYOUT_BLOCKS = Object.keys(LAYOUTS) as LayoutBlock[];

/** Sections between About and Contact, in their default order. */
export const ORDERABLE_SECTIONS: SectionKey[] = ["skills", "projects", "experience", "certificates", "education", "testimonials", "blog"];

export interface SiteDesign {
  style: StyleKey;
  /** "auto" uses the style's own background. */
  background: BackgroundKey;
  motion: MotionKey;
  speed: SpeedKey;
  density: DensityKey;
  layouts: Layouts;
  order: SectionKey[];
}

export interface StyleMeta {
  key: StyleKey;
  /** Accent applied when the style is chosen; the owner can still change it. */
  accent: string;
  /** Background used when design.background is "auto". */
  background: Exclude<BackgroundKey, "auto">;
  /** true when the style fixes its own colours and ignores the accent. */
  lockedAccent?: boolean;
  /** Colours for the picker thumbnail: [bg, surface, text, line, accent]. */
  swatch: { light: [string, string, string, string, string]; dark: [string, string, string, string, string] };
  font: "sans" | "serif" | "mono" | "office";
}

export const STYLES: StyleMeta[] = [
  {
    key: "classic",
    accent: "#0f8b8d",
    background: "plain",
    font: "sans",
    swatch: { light: ["#f6f6f3", "#ffffff", "#16181c", "#e2e2dc", "#0f8b8d"], dark: ["#0c0e11", "#14171c", "#eef0f2", "#242932", "#0f8b8d"] },
  },
  {
    key: "mono",
    accent: "#0a0a0a",
    background: "plain",
    lockedAccent: true,
    font: "serif",
    swatch: { light: ["#ffffff", "#ffffff", "#0a0a0a", "#0a0a0a", "#0a0a0a"], dark: ["#000000", "#0a0a0a", "#fafafa", "#fafafa", "#fafafa"] },
  },
  {
    key: "excel",
    accent: "#217346",
    background: "grid",
    font: "office",
    swatch: { light: ["#ffffff", "#ffffff", "#1f1f1f", "#d4d4d4", "#217346"], dark: ["#1e1e1e", "#252526", "#f0f0f0", "#3c3c3c", "#33a065"] },
  },
  {
    key: "sql",
    accent: "#2f81f7",
    background: "dots",
    font: "mono",
    swatch: { light: ["#fbfbfd", "#ffffff", "#111827", "#e1e4ea", "#2f81f7"], dark: ["#0b0f14", "#11161d", "#e6edf3", "#222a35", "#2f81f7"] },
  },
  {
    key: "powerbi",
    accent: "#118dff",
    background: "plain",
    font: "office",
    swatch: { light: ["#f3f2f1", "#ffffff", "#252423", "#e1dfdd", "#118dff"], dark: ["#1b1a19", "#252423", "#f3f2f1", "#3b3a39", "#118dff"] },
  },
  {
    key: "notebook",
    accent: "#e46e1b",
    background: "lines",
    font: "mono",
    swatch: { light: ["#fffdf7", "#ffffff", "#1d1d1b", "#e8e4d8", "#e46e1b"], dark: ["#16161a", "#1e1e23", "#ececec", "#2c2c33", "#f08a3c"] },
  },
];

export function styleMeta(key: StyleKey): StyleMeta {
  return STYLES.find((s) => s.key === key) ?? STYLES[0];
}

export function defaultLayouts(): Layouts {
  return Object.fromEntries(LAYOUT_BLOCKS.map((k) => [k, LAYOUTS[k][0]])) as Layouts;
}

export function defaultDesign(): SiteDesign {
  return {
    style: "classic",
    background: "auto",
    motion: "smooth",
    speed: "normal",
    density: "normal",
    layouts: defaultLayouts(),
    order: [...ORDERABLE_SECTIONS],
  };
}

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return typeof value === "string" && (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Accepts anything (old documents, imports) and returns a complete, valid design. */
export function normalizeDesign(raw: unknown): SiteDesign {
  const base = defaultDesign();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Record<keyof SiteDesign, unknown>>;
  const rawLayouts = (r.layouts && typeof r.layouts === "object" ? r.layouts : {}) as Record<string, unknown>;
  const layouts = Object.fromEntries(LAYOUT_BLOCKS.map((k) => [k, oneOf(LAYOUTS[k], rawLayouts[k], LAYOUTS[k][0])])) as Layouts;
  const seen = new Set<SectionKey>();
  const order: SectionKey[] = [];
  for (const k of Array.isArray(r.order) ? r.order : []) {
    if (ORDERABLE_SECTIONS.includes(k as SectionKey) && !seen.has(k as SectionKey)) {
      seen.add(k as SectionKey);
      order.push(k as SectionKey);
    }
  }
  for (const k of ORDERABLE_SECTIONS) if (!seen.has(k)) order.push(k);
  return {
    style: oneOf(STYLE_KEYS, r.style, base.style),
    background: oneOf(BACKGROUND_KEYS, r.background, base.background),
    motion: oneOf(MOTION_KEYS, r.motion, base.motion),
    speed: oneOf(SPEED_KEYS, r.speed, base.speed),
    density: oneOf(DENSITY_KEYS, r.density, base.density),
    layouts,
    order,
  };
}

export function resolvedBackground(d: Pick<SiteDesign, "style" | "background">): Exclude<BackgroundKey, "auto"> {
  return d.background === "auto" ? styleMeta(d.style).background : d.background;
}

/** Text colour that reads best on the given accent: white, or near-black for light accents. */
export function accentForeground(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#ffffff";
  const lin = (c: string) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
  // Contrast against white vs against #111: pick the higher.
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.0555 ? "#ffffff" : "#111111";
}

/** Attributes on <html> that select the CSS for a design. Admin pages pass null to clear them. */
export function applyDesignAttributes(d: SiteDesign | null) {
  const html = document.documentElement;
  if (!d) {
    delete html.dataset.style;
    delete html.dataset.bg;
    delete html.dataset.density;
    return;
  }
  html.dataset.style = d.style;
  html.dataset.bg = resolvedBackground(d);
  html.dataset.density = d.density;
}
