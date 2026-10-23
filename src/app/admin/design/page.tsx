"use client";

import { doc, setDoc } from "firebase/firestore";
import { ArrowDown, ArrowUp, ExternalLink, Monitor, Moon, RotateCcw, Save, Smartphone, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/AdminShell";
import { FormSection } from "@/components/admin/fields";
import { LayoutThumb } from "@/components/admin/LayoutThumb";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  BACKGROUND_KEYS,
  DENSITY_KEYS,
  LAYOUTS,
  MOTION_KEYS,
  SPEED_KEYS,
  STYLES,
  defaultDesign,
  styleMeta,
  type BackgroundKey,
  type LayoutBlock,
  type SiteDesign,
  type StyleMeta,
} from "@/lib/design";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";
import { PREVIEW_MESSAGE, PREVIEW_QUERY, useSiteData } from "@/lib/site-data";
import { useTheme } from "@/lib/theme";
import type { SectionKey } from "@/lib/types";
import { cn, isValidHex } from "@/lib/utils";

const ACCENTS = ["#0f8b8d", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#217346", "#0f172a"];

const FONT: Record<StyleMeta["font"], string> = {
  sans: "var(--font-sans)",
  serif: 'Georgia, "Times New Roman", serif',
  mono: "var(--font-mono)",
  office: '"Segoe UI", Calibri, Arial, sans-serif',
};

/** Same patterns as globals.css, for the background picker. */
const PATTERN: Record<Exclude<BackgroundKey, "auto">, React.CSSProperties> = {
  plain: {},
  grid: {
    backgroundImage: "linear-gradient(var(--line-strong) 1px, transparent 1px), linear-gradient(90deg, var(--line-strong) 1px, transparent 1px)",
    backgroundSize: "12px 12px",
  },
  dots: { backgroundImage: "radial-gradient(var(--line-strong) 1.2px, transparent 1.6px)", backgroundSize: "9px 9px" },
  lines: { backgroundImage: "linear-gradient(transparent calc(100% - 1px), var(--line-strong) 0)", backgroundSize: "100% 10px" },
  glow: { backgroundImage: "radial-gradient(70% 70% at 20% 10%, var(--accent-soft), transparent 70%), radial-gradient(60% 60% at 90% 90%, var(--accent-soft), transparent 70%)" },
};

const DESKTOP_WIDTH = 1280;
const MOBILE_WIDTH = 390;

interface Draft {
  design: SiteDesign;
  accent: string;
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cn(
            "h-9 px-3.5 rounded-full border text-sm font-semibold transition",
            value === o ? "bg-accent text-accent-fg border-accent" : "border-line text-fg-2 hover:bg-surface-2",
          )}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

function StyleCard({ meta, active, dark, onPick }: { meta: StyleMeta; active: boolean; dark: boolean; onPick: () => void }) {
  const { t } = useLocale();
  const [bg, surface, fg, line, accent] = meta.swatch[dark ? "dark" : "light"];
  const radius = meta.key === "mono" ? 0 : meta.key === "excel" ? 1 : 4;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn("text-left rounded-2xl border-2 p-2 transition", active ? "border-accent" : "border-line hover:border-line-strong")}
    >
      <div className="relative h-20 rounded-xl overflow-hidden border border-line" style={{ background: bg }}>
        {meta.background === "grid" && <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`, backgroundSize: "22px 8px", opacity: 0.6 }} />}
        {meta.background === "dots" && <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(${line} 1px, transparent 1.4px)`, backgroundSize: "7px 7px" }} />}
        {meta.background === "lines" && <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(transparent calc(100% - 1px), ${line} 0)`, backgroundSize: "100% 9px" }} />}
        <div className="absolute left-2.5 top-2.5 right-2.5 bottom-2.5 flex gap-2">
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <span className="text-lg font-bold leading-none" style={{ color: fg, fontFamily: FONT[meta.font] }}>
              Aa
            </span>
            <span className="h-1.5 w-12 rounded-full" style={{ background: fg, opacity: 0.35 }} />
            <span className="h-3 w-9" style={{ background: accent, borderRadius: meta.key === "classic" || meta.key === "notebook" ? 99 : radius }} />
          </div>
          <div className="w-12 border" style={{ background: surface, borderColor: line, borderRadius: radius * 2 }} />
        </div>
      </div>
      <p className="mt-2 px-1 text-sm font-semibold">{t(`admin.design.styles.${meta.key}.name`)}</p>
      <p className="px-1 text-xs text-muted leading-snug">{t(`admin.design.styles.${meta.key}.desc`)}</p>
    </button>
  );
}

function LayoutPicker({ block, value, onPick }: { block: LayoutBlock; value: string; onPick: (layout: string) => void }) {
  const { t } = useLocale();
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 xl:grid-cols-3 gap-2" role="radiogroup">
      {LAYOUTS[block].map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={value === l}
          onClick={() => onPick(l)}
          className={cn("rounded-xl border-2 p-1.5 text-left transition", value === l ? "border-accent" : "border-line hover:border-line-strong")}
        >
          <LayoutThumb block={block} layout={l} />
          <span className="mt-1 block text-[11px] font-semibold leading-tight">{t(`admin.design.layouts.${block}.${l}`)}</span>
        </button>
      ))}
    </div>
  );
}

/** The public site in an iframe, scaled down to the panel, fed the unsaved design. */
function Preview({ draft, focus }: { draft: Draft; focus: string | null }) {
  const { t } = useLocale();
  const { resolved } = useTheme();
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [mode, setMode] = useState<"light" | "dark">(resolved);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [nonce, setNonce] = useState(0);

  const post = useCallback(
    (extra: { focus?: string } = {}) => {
      frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, design: draft.design, accent: draft.accent, theme: mode, ...extra }, location.origin);
    },
    [draft, mode],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === frame.current?.contentWindow && e.data?.type === `${PREVIEW_MESSAGE}-ready`) post();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [post]);

  useEffect(() => post(), [post]);
  useEffect(() => {
    if (focus) post({ focus });
    // Only when the focused block changes, not on every draft edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = device === "desktop" ? DESKTOP_WIDTH : MOBILE_WIDTH;
  const scale = size.w ? Math.min(1, size.w / width) : 1;
  const tool = "h-8 w-8 inline-flex items-center justify-center rounded-full transition";

  return (
    <div className="card p-3 flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 px-1 pb-2">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">{t("admin.design.preview")}</span>
        <div className="flex items-center gap-1">
          <div className="inline-flex rounded-full border border-line p-0.5">
            <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} aria-label={t("admin.design.desktop")} title={t("admin.design.desktop")} className={cn(tool, device === "desktop" ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
              <Monitor className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setDevice("mobile")} aria-pressed={device === "mobile"} aria-label={t("admin.design.mobile")} title={t("admin.design.mobile")} className={cn(tool, device === "mobile" ? "bg-fg text-bg" : "text-muted hover:text-fg")}>
              <Smartphone className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
            aria-label={mode === "dark" ? t("theme.light") : t("theme.dark")}
            title={mode === "dark" ? t("theme.light") : t("theme.dark")}
            className={cn(tool, "border border-line text-muted hover:text-fg")}
          >
            {mode === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => setNonce((n) => n + 1)} aria-label={t("admin.design.replay")} title={t("admin.design.replay")} className={cn(tool, "border border-line text-muted hover:text-fg")}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div ref={box} className="relative flex-1 min-h-[26rem] rounded-xl overflow-hidden bg-surface-2 border border-line">
        {size.w > 0 && (
          <iframe
            key={nonce}
            ref={frame}
            src={`/?${PREVIEW_QUERY}`}
            title={t("admin.design.preview")}
            className="absolute top-0 border-0 bg-bg origin-top-left"
            style={{
              width,
              height: size.h / scale,
              transform: `scale(${scale})`,
              left: device === "mobile" ? Math.max(0, (size.w - width * scale) / 2) : 0,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function DesignPage() {
  const { t } = useLocale();
  const { settings, loading, profileExists, visibleSections } = useSiteData();
  const { resolved, applyAccent } = useTheme();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  // Bumped on every pick so choosing the same block twice still scrolls the preview.
  const focusSeq = useRef(0);

  useEffect(() => {
    if (!loading.settings && (!draft || !dirty)) setDraft({ design: settings.design, accent: settings.accentColor });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, loading.settings]);

  const change = (patch: Partial<SiteDesign>, accent?: string) => {
    setDraft((d) => (d ? { design: { ...d.design, ...patch }, accent: accent ?? d.accent } : d));
    setDirty(true);
  };

  const save = async () => {
    if (!draft) return;
    if (!isValidHex(draft.accent)) {
      toast.error(t("admin.settings.accentHint"));
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "site", "settings"), { design: draft.design, accentColor: draft.accent, updatedAt: Date.now() }, { merge: true });
      applyAccent(draft.accent);
      toast.success(t("admin.crud.savedToast"));
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return (
      <>
        <PageHeader title={t("admin.design.title")} subtitle={t("admin.design.subtitle")} />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const { design } = draft;
  const style = styleMeta(design.style);
  const pickLayout = (block: LayoutBlock, layout: string) => {
    change({ layouts: { ...design.layouts, [block]: layout } });
    setFocus(`${block === "hero" ? "top" : block}:${++focusSeq.current}`);
  };
  const move = (key: SectionKey, delta: -1 | 1) => {
    const order = [...design.order];
    const i = order.indexOf(key);
    const j = i + delta;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    change({ order });
    setFocus(`${key}:${++focusSeq.current}`);
  };

  const arrow = "h-8 w-8 inline-flex items-center justify-center rounded-full border border-line text-muted hover:text-fg hover:bg-surface-2 transition disabled:opacity-30 disabled:pointer-events-none";

  return (
    <>
      <PageHeader
        title={t("admin.design.title")}
        subtitle={t("admin.design.subtitle")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => change(defaultDesign(), styleMeta("classic").accent)}
              title={t("admin.design.reset")}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("admin.design.reset")}
            </Button>
            <Button href="/" external variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {t("admin.design.openSite")}
            </Button>
            <Button onClick={save} loading={saving} disabled={!dirty}>
              {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        }
      />

      {!profileExists && <p className="mb-4 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">{t("admin.design.emptyHint")}</p>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,25rem)_minmax(0,1fr)] items-start">
        <div className="space-y-6 order-2 xl:order-1">
          <div className="card p-5 space-y-6">
            <FormSection title={t("admin.design.style")} description={t("admin.design.styleHint")}>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-3">
                {STYLES.map((s) => (
                  <StyleCard key={s.key} meta={s} dark={resolved === "dark"} active={design.style === s.key} onPick={() => change({ style: s.key }, s.accent)} />
                ))}
              </div>
            </FormSection>

            <FormSection title={t("admin.design.accent")}>
              {style.lockedAccent ? (
                <p className="text-sm text-muted">{t("admin.design.accentLocked")}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {ACCENTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => change({}, c)}
                      aria-label={c}
                      aria-pressed={draft.accent.toLowerCase() === c}
                      className={cn("h-8 w-8 rounded-full border-2 transition", draft.accent.toLowerCase() === c ? "border-fg scale-110" : "border-transparent")}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={isValidHex(draft.accent) ? draft.accent : "#0f8b8d"}
                    onChange={(e) => change({}, e.target.value)}
                    aria-label={t("admin.design.accent")}
                    className="h-8 w-10 rounded-lg border border-line bg-surface cursor-pointer"
                  />
                </div>
              )}
            </FormSection>

            <FormSection title={t("admin.design.background")}>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_KEYS.map((b) => {
                  const shown = b === "auto" ? style.background : b;
                  return (
                    <button
                      key={b}
                      type="button"
                      aria-pressed={design.background === b}
                      onClick={() => change({ background: b })}
                      className={cn("rounded-xl border-2 p-1.5 text-left transition", design.background === b ? "border-accent" : "border-line hover:border-line-strong")}
                    >
                      <span className="block h-10 rounded-lg bg-surface border border-line" style={PATTERN[shown]} />
                      <span className="mt-1 block text-[11px] font-semibold leading-tight">{t(`admin.design.backgrounds.${b}`)}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>

            <FormSection title={t("admin.design.motion")} description={t("admin.design.motionHint")}>
              <Segmented value={design.motion} options={MOTION_KEYS} onChange={(motion) => change({ motion })} label={(m) => t(`admin.design.motions.${m}`)} />
              {design.motion !== "none" && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-muted">{t("admin.design.speed")}</p>
                  <Segmented value={design.speed} options={SPEED_KEYS} onChange={(speed) => change({ speed })} label={(s) => t(`admin.design.speeds.${s}`)} />
                </div>
              )}
            </FormSection>

            <FormSection title={t("admin.design.density")}>
              <Segmented value={design.density} options={DENSITY_KEYS} onChange={(density) => change({ density })} label={(d) => t(`admin.design.densities.${d}`)} />
            </FormSection>
          </div>

          <div className="card p-5">
            <FormSection title={t("admin.design.sections")} description={t("admin.design.sectionsHint")}>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold">{t("admin.design.hero")}</p>
                  <LayoutPicker block="hero" value={design.layouts.hero} onPick={(l) => pickLayout("hero", l)} />
                </div>
                {design.order.map((key, i) => (
                  <div key={key} className="pt-5 border-t border-line">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        <span className="mr-2 font-mono text-xs text-muted tabular-nums">{i + 1}</span>
                        {t(`nav.${key}`)}
                        {!visibleSections.includes(key) && <span className="ml-2 text-xs font-normal text-muted">· {t("admin.design.hidden")}</span>}
                      </p>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => move(key, -1)} disabled={i === 0} aria-label={t("admin.design.moveUp")} title={t("admin.design.moveUp")} className={arrow}>
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => move(key, 1)} disabled={i === design.order.length - 1} aria-label={t("admin.design.moveDown")} title={t("admin.design.moveDown")} className={arrow}>
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {key in LAYOUTS && <LayoutPicker block={key as LayoutBlock} value={design.layouts[key as LayoutBlock]} onPick={(l) => pickLayout(key as LayoutBlock, l)} />}
                  </div>
                ))}
              </div>
            </FormSection>
          </div>
        </div>

        <div className="order-1 xl:order-2 xl:sticky xl:top-6 h-[32rem] xl:h-[calc(100vh-3rem)]">
          <Preview draft={draft} focus={focus} />
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end xl:hidden">
        <Button onClick={save} loading={saving} disabled={!dirty}>
          {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </>
  );
}
