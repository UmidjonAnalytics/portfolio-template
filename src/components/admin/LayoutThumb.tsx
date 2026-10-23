"use client";

import type { LayoutBlock } from "@/lib/design";

// Tiny schematic of each layout, drawn on a 64 × 40 grid.
// Shape: [x, y, w, h, tone, radius]. Tone 0 = block, 1 = accent, 2 = text, 3 = ring.
type Shape = [number, number, number, number, 0 | 1 | 2 | 3, number?];

const grid = (cols: number, rows: number, opts: { x?: number; y?: number; w?: number; h?: number; gap?: number; image?: boolean } = {}): Shape[] => {
  const { x = 4, y = 5, w = 56, h = 30, gap = 2.5, image = false } = opts;
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  const out: Shape[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const cx = x + c * (cw + gap);
      const cy = y + r * (ch + gap);
      out.push([cx, cy, cw, ch, 0, 1.5]);
      if (image) out.push([cx + 1.5, cy + ch * 0.62, cw * 0.6, 1.6, 2]);
    }
  return out;
};

const lines = (x: number, y: number, widths: number[], step = 4.5): Shape[] => widths.map((w, i) => [x, y + i * step, w, 2, i === 0 ? 2 : 0] as Shape);

const THUMBS: Record<string, Shape[]> = {
  "hero.split": [...lines(5, 9, [26, 20, 22]), [5, 27, 10, 4, 1, 2], [40, 5, 19, 30, 0, 2]],
  "hero.centered": [[26, 3, 12, 12, 0, 6], [17, 19, 30, 3, 2], [20, 25, 24, 2, 0], [22, 29, 20, 2, 0], [27, 33, 10, 4, 1, 2]],
  "hero.minimal": [[5, 7, 46, 8, 2, 1], [5, 19, 32, 2, 0], [5, 23.5, 38, 2, 0], [5, 30, 10, 4, 1, 2], [17, 30, 10, 4, 0, 2]],

  "skills.cards": [...grid(3, 2), ...[0, 1, 2].flatMap((c) => [0, 1].map((r) => [6 + c * 19.2, 13 + r * 16.2, 10 - r * 3, 1.8, 1] as Shape))],
  "skills.rings": [0, 1, 2, 3].map((i) => [5 + i * 14.5, 13, 11, 11, 3] as Shape),
  "skills.chips": [
    [4, 5, 27, 30, 0, 1.5],
    [33, 5, 27, 30, 0, 1.5],
    [7, 9, 10, 3.5, 2, 1.7],
    [18.5, 9, 9, 3.5, 2, 1.7],
    [7, 15, 13, 3.5, 2, 1.7],
    [36, 9, 12, 3.5, 2, 1.7],
    [36, 15, 8, 3.5, 2, 1.7],
    [45.5, 15, 10, 3.5, 2, 1.7],
  ],
  "skills.table": [[4, 5, 56, 5, 2], ...[0, 1, 2, 3].flatMap((r) => [[4, 12 + r * 6, 14, 2, 0], [34, 12 + r * 6, 24 - r * 4, 2, 1]] as Shape[])],

  "projects.grid": grid(3, 2, { image: true }),
  "projects.compact": grid(4, 3),
  "projects.stacked": [
    [4, 4, 26, 15, 0, 1.5],
    ...lines(33, 6, [22, 18, 20]),
    [34, 21, 26, 15, 0, 1.5],
    ...lines(4, 23, [22, 18, 20]),
  ],
  "projects.carousel": [[8, 4, 48, 26, 0, 1.5], [10, 6, 22, 22, 2, 1], [25, 34, 6, 2, 1, 1], [33, 34, 2, 2, 0, 1], [37, 34, 2, 2, 0, 1]],
  "projects.swipe": [[4, 6, 22, 24, 0, 1.5], [29, 6, 22, 24, 0, 1.5], [54, 6, 22, 24, 0, 1.5], [48, 34, 4, 3, 0, 1], [54, 34, 4, 3, 2, 1]],

  "experience.timeline": [[8, 3, 1, 34, 0], ...[0, 1, 2].flatMap((i) => [[6.5, 5 + i * 12, 4, 4, 1, 2], ...lines(14, 5 + i * 12, [24, 34], 4)] as Shape[])],
  "experience.cards": grid(2, 2, { image: true }),
  "experience.zigzag": [[31.5, 3, 1, 34, 0], [4, 5, 24, 9, 0, 1.5], [36, 16, 24, 9, 0, 1.5], [4, 27, 24, 9, 0, 1.5], [30, 7.5, 4, 4, 1, 2], [30, 18.5, 4, 4, 1, 2], [30, 29.5, 4, 4, 1, 2]],

  "certificates.grid": grid(3, 1, { y: 8, h: 24, image: true }),
  "certificates.slider": [[4, 8, 24, 24, 0, 1.5], [31, 8, 24, 24, 0, 1.5], [58, 8, 24, 24, 0, 1.5]],
  "certificates.list": [0, 1, 2].flatMap((i) => [[4, 5 + i * 11, 10, 8, 0, 1], ...lines(17, 6 + i * 11, [26, 18], 3.5), [50, 7 + i * 11, 10, 4, 1, 2]] as Shape[]),

  "education.cards": [...grid(2, 1, { y: 9, h: 22 }), [7, 12, 5, 5, 1, 1.5], [36.3, 12, 5, 5, 1, 1.5]],
  "education.timeline": [[8, 3, 1, 34, 0], ...[0, 1].flatMap((i) => [[5.5, 6 + i * 16, 6, 6, 3], ...lines(15, 6 + i * 16, [26, 36, 30], 4)] as Shape[])],
  "education.list": [[4, 5, 56, 30, 0, 1.5], ...[0, 1, 2].flatMap((i) => [[7, 9 + i * 9, 10, 2, 1], [21, 9 + i * 9, 26, 2, 2], [21, 12.5 + i * 9, 34, 1.6, 0]] as Shape[])],

  "testimonials.carousel": [[12, 5, 40, 24, 0, 1.5], ...lines(16, 10, [30, 28, 20]), [27, 34, 6, 2, 1, 1], [35, 34, 2, 2, 0, 1]],
  "testimonials.grid": grid(3, 1, { y: 7, h: 26, image: true }),
  "testimonials.wall": [[4, 4, 17, 18, 0, 1.5], [4, 24, 17, 12, 0, 1.5], [23.5, 4, 17, 11, 0, 1.5], [23.5, 17, 17, 19, 0, 1.5], [43, 4, 17, 15, 0, 1.5], [43, 21, 17, 15, 0, 1.5]],

  "blog.grid": grid(3, 1, { y: 7, h: 26, image: true }),
  "blog.list": [0, 1, 2].flatMap((i) => [[4, 4 + i * 11.5, 14, 9, 0, 1], ...lines(21, 5 + i * 11.5, [28, 36], 4)] as Shape[]),
  "blog.featured": [[4, 4, 56, 16, 0, 1.5], [6, 6, 28, 12, 2, 1], ...grid(3, 1, { y: 23, h: 13 })],
};

const TONE = ["text-line-strong", "text-accent", "text-fg-2", "text-accent"];

export function LayoutThumb({ block, layout }: { block: LayoutBlock; layout: string }) {
  const shapes = THUMBS[`${block}.${layout}`] ?? [];
  return (
    <svg viewBox="0 0 64 40" className="w-full h-auto block" aria-hidden="true">
      <rect x="0" y="0" width="64" height="40" rx="3" className="fill-surface-2" />
      {shapes.map(([x, y, w, h, tone, r], i) =>
        tone === 3 ? (
          <circle key={i} cx={x + w / 2} cy={y + h / 2} r={w / 2 - 1} fill="none" strokeWidth="2" stroke="currentColor" className={TONE[tone]} strokeDasharray={`${(w - 2) * 2.2} 99`} />
        ) : (
          <rect key={i} x={x} y={y} width={w} height={h} rx={r ?? 0.6} fill="currentColor" className={TONE[tone]} opacity={tone === 0 ? 0.55 : tone === 2 ? 0.7 : 1} />
        ),
      )}
    </svg>
  );
}
