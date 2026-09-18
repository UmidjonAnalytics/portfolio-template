/**
 * Programmatic SVG placeholders used by the seed data. Everything is generated locally as
 * `data:image/svg+xml` URIs, so the demo never depends on an external image host.
 */

function svgDataUri(svg: string): string {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace(/\s{2,}/g, " ").trim());
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Deterministic pseudo-random generator so the same seed always draws the same picture. */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const TOOL_HUES: Record<string, number> = {
  Excel: 145,
  "Power BI": 42,
  SQL: 205,
  Python: 225,
  Tableau: 195,
  "Google Sheets": 130,
};

export interface CoverOptions {
  title: string;
  tool?: string;
  seed?: number;
  /** "bars" | "line" | "donut" | "grid" */
  motif?: "bars" | "line" | "donut" | "grid";
}

/** 1200x750 project cover: gradient background, faint grid, one chart motif and the tool label. */
export function coverSvg({ title, tool = "", seed = 1, motif = "bars" }: CoverOptions): string {
  const hue = TOOL_HUES[tool] ?? 190;
  const rand = rng(seed * 7919 + title.length);
  const W = 1200;
  const H = 750;
  let shapes = "";

  if (motif === "bars") {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const h = 90 + rand() * 340;
      const x = 150 + i * 100;
      shapes += `<rect x="${x}" y="${H - 120 - h}" width="60" height="${h}" rx="10" fill="hsl(${hue} 70% ${62 + (i % 3) * 8}%)" opacity="${0.55 + rand() * 0.4}"/>`;
    }
  } else if (motif === "line") {
    const pts: string[] = [];
    const n = 12;
    let y = H - 200 - rand() * 100;
    for (let i = 0; i <= n; i++) {
      y += (rand() - 0.6) * 90;
      y = Math.max(150, Math.min(H - 140, y));
      pts.push(`${120 + (i * (W - 240)) / n},${y}`);
    }
    shapes += `<polyline points="${pts.join(" ")}" fill="none" stroke="hsl(${hue} 80% 70%)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
    shapes += `<polygon points="120,${H - 120} ${pts.join(" ")} ${W - 120},${H - 120}" fill="hsl(${hue} 80% 70%)" opacity="0.18"/>`;
    for (const p of pts) {
      const [px, py] = p.split(",");
      shapes += `<circle cx="${px}" cy="${py}" r="11" fill="white" opacity="0.9"/>`;
    }
  } else if (motif === "donut") {
    const cx = W / 2;
    const cy = H / 2 + 30;
    const r = 210;
    const parts = [0.42, 0.28, 0.18, 0.12];
    let a = -Math.PI / 2;
    parts.forEach((p, i) => {
      const a2 = a + p * Math.PI * 2;
      const x1 = cx + r * Math.cos(a);
      const y1 = cy + r * Math.sin(a);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      const large = p > 0.5 ? 1 : 0;
      shapes += `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}" fill="none" stroke="hsl(${hue + i * 25} 70% ${60 + i * 7}%)" stroke-width="70" opacity="0.9"/>`;
      a = a2 + 0.03;
    });
  } else {
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 4; j++) {
        const v = rand();
        shapes += `<rect x="${170 + i * 150}" y="${140 + j * 130}" width="120" height="100" rx="14" fill="hsl(${hue} 70% 65%)" opacity="${0.15 + v * 0.7}"/>`;
      }
  }

  const label = tool ? `<text x="72" y="${H - 64}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="white" opacity="0.9" letter-spacing="4">${esc(tool.toUpperCase())}</text>` : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="hsl(${hue} 45% 18%)"/>
        <stop offset="1" stop-color="hsl(${hue + 40} 50% 30%)"/>
      </linearGradient>
      <pattern id="p" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M60 0H0V60" fill="none" stroke="white" stroke-opacity="0.07"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#p)"/>
    <circle cx="${W - 160}" cy="120" r="220" fill="hsl(${hue + 60} 70% 60%)" opacity="0.12"/>
    ${shapes}
    ${label}
  </svg>`;
  return svgDataUri(svg);
}

/** Square avatar with initials on a gradient. */
export function avatarSvg(name: string, hue = 190): string {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 35%)"/><stop offset="1" stop-color="hsl(${hue + 50} 60% 55%)"/></linearGradient></defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <circle cx="320" cy="80" r="120" fill="white" opacity="0.08"/>
    <text x="200" y="228" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="150" font-weight="700" fill="white" opacity="0.95">${esc(initials)}</text>
  </svg>`;
  return svgDataUri(svg);
}

/** Portrait placeholder for the hero: abstract silhouette on a warm gradient. */
export function portraitSvg(name: string, hue = 190): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 40% 22%)"/><stop offset="1" stop-color="hsl(${hue + 35} 45% 40%)"/></linearGradient>
      <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 30% 80%)"/><stop offset="1" stop-color="hsl(${hue} 30% 60%)"/></linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#bg)"/>
    <circle cx="640" cy="160" r="240" fill="white" opacity="0.06"/>
    <circle cx="400" cy="380" r="150" fill="url(#body)"/>
    <path d="M120 1000 C120 720 240 640 400 640 C560 640 680 720 680 1000 Z" fill="url(#body)"/>
    <text x="400" y="960" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="700" fill="white" opacity="0.7" letter-spacing="6">${esc(name.toUpperCase())}</text>
  </svg>`;
  return svgDataUri(svg);
}

/** Landscape certificate: frame, ribbon, title, issuer. */
export function certificateSvg(title: string, issuer: string, hue = 40): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fdfcf8"/><stop offset="1" stop-color="#f1efe6"/></linearGradient></defs>
    <rect width="1200" height="850" fill="url(#g)"/>
    <rect x="40" y="40" width="1120" height="770" fill="none" stroke="hsl(${hue} 50% 45%)" stroke-width="6"/>
    <rect x="60" y="60" width="1080" height="730" fill="none" stroke="hsl(${hue} 50% 45%)" stroke-width="2" stroke-dasharray="8 8"/>
    <text x="600" y="190" text-anchor="middle" font-family="Georgia, serif" font-size="34" letter-spacing="10" fill="#6b6459">CERTIFICATE OF COMPLETION</text>
    <text x="600" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="62" font-weight="700" fill="#2b2924">${esc(title)}</text>
    <text x="600" y="420" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" fill="#6b6459">issued by ${esc(issuer)}</text>
    <line x1="380" y1="470" x2="820" y2="470" stroke="hsl(${hue} 50% 45%)" stroke-width="3"/>
    <circle cx="600" cy="620" r="80" fill="hsl(${hue} 70% 55%)"/>
    <circle cx="600" cy="620" r="62" fill="none" stroke="white" stroke-width="4" opacity="0.7"/>
    <path d="M560 700 L580 790 L600 760 L620 790 L640 700 Z" fill="hsl(${hue} 70% 45%)"/>
    <text x="600" y="632" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="white">✓</text>
  </svg>`;
  return svgDataUri(svg);
}

/** Small square logo tile with a monogram. */
export function logoSvg(text: string, hue = 200): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" rx="40" fill="hsl(${hue} 55% 45%)"/>
    <text x="100" y="124" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="80" font-weight="800" fill="white">${esc(text.slice(0, 2).toUpperCase())}</text>
  </svg>`;
  return svgDataUri(svg);
}

/** Dashboard screenshot look-alike used in project galleries. */
export function dashboardSvg(title: string, hue = 200, seed = 1): string {
  const rand = rng(seed * 104729 + title.length);
  let tiles = "";
  for (let i = 0; i < 4; i++) {
    tiles += `<rect x="${60 + i * 275}" y="120" width="245" height="120" rx="14" fill="white"/>
      <text x="${84 + i * 275}" y="165" font-family="Inter, Arial, sans-serif" font-size="18" fill="#7a7f87">KPI ${i + 1}</text>
      <text x="${84 + i * 275}" y="215" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="700" fill="#1f2937">${Math.round(rand() * 900 + 100)}${["K", "%", "", "K"][i]}</text>`;
  }
  let bars = "";
  for (let i = 0; i < 14; i++) {
    const h = 40 + rand() * 220;
    bars += `<rect x="${90 + i * 46}" y="${600 - h}" width="28" rx="6" height="${h}" fill="hsl(${hue + (i % 2) * 30} 65% 55%)"/>`;
  }
  let line = "";
  const pts: string[] = [];
  for (let i = 0; i <= 10; i++) pts.push(`${800 + i * 34},${560 - rand() * 200}`);
  line = `<polyline points="${pts.join(" ")}" fill="none" stroke="hsl(${hue} 70% 50%)" stroke-width="5" stroke-linejoin="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750">
    <rect width="1200" height="750" fill="#eef1f5"/>
    <rect x="0" y="0" width="1200" height="80" fill="hsl(${hue} 45% 28%)"/>
    <text x="60" y="50" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="white">${esc(title)}</text>
    ${tiles}
    <rect x="60" y="280" width="700" height="400" rx="16" fill="white"/>
    ${bars}
    <rect x="790" y="280" width="350" height="400" rx="16" fill="white"/>
    ${line}
  </svg>`;
  return svgDataUri(svg);
}
