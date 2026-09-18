# Data model

All content lives in Cloud Firestore. Every dynamic text is stored in three languages and every
image / file is stored as a **media reference** string. The TypeScript source of truth is
[`src/lib/types.ts`](src/lib/types.ts).

## Conventions

| Concept | Shape | Notes |
| --- | --- | --- |
| Localized string | `{ en: string, ru?: string, uz?: string }` | English is required. Missing RU/UZ fall back to EN on the site. |
| Localized list | `{ en: string[], ru?: string[], uz?: string[] }` | Bullets, job titles, spoken languages. |
| Media reference | `string` | One of: `https://…` (Firebase Storage or any URL), `data:image/svg+xml…` (seed placeholders), `media:<id>` (a document in the `media` collection). |
| Month | `"YYYY-MM"` | Empty string = "present". |
| Date | `"YYYY-MM-DD"` | Blog posts only. |
| Timestamps | `number` (ms since epoch) | `createdAt` / `updatedAt`. Written by the client. |

Every list item (skills, projects, …) has these base fields:

```ts
{
  published: boolean;   // false = draft, never shown publicly
  order: number;        // 0-based position, changed by drag-and-drop in admin
  createdAt: number;
  updatedAt: number;
}
```

Public queries always use `where("published", "==", true)` and sort by `order` on the client,
so no composite indexes are needed.

## `site/profile` (single document)

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Shown in hero, header and footer |
| `titles` | LocalizedList | Rotating job titles for the typing effect |
| `tagline` | Localized | One sentence under the name |
| `bio` | Localized (HTML) | Rich text from the editor, sanitised on render |
| `location` | Localized | e.g. "Tashkent, Uzbekistan" |
| `spokenLanguages` | LocalizedList | e.g. ["English (C1)"] |
| `availability` | `"open" \| "freelance" \| "unavailable"` | Badge on the hero photo |
| `photo` | Media ref | Portrait |
| `cv` | Media ref | PDF; the "Download CV" button hides when empty |
| `email`, `phone`, `telegram`, `linkedin`, `github` | string | Each contact button hides when empty |
| `stats` | `{ projects?, yearsExperience?, tools?, studentsTaught? }` | Hero counters; `0`/empty hides a counter. `projects` falls back to the number of published projects |

## `site/settings` (single document)

| Field | Type | Description |
| --- | --- | --- |
| `siteName` | string | Header brand + browser tab |
| `accentColor` | `#rrggbb` | Applied as the `--accent` CSS variable |
| `defaultLang` | `"en" \| "ru" \| "uz"` | Used until the visitor picks a language |
| `defaultTheme` | `"light" \| "dark" \| "system"` | Used until the visitor toggles the theme |
| `sections` | `Record<SectionKey, boolean>` | Manual on/off per section (skills, projects, experience, certificates, education, testimonials, blog) |
| `seoTitle`, `seoDescription` | Localized | `<title>` and meta description |
| `favicon` | Media ref | Optional |
| `gaId` | string | Optional Google Analytics measurement id (`G-…`) |
| `embedAllowlist` | string[] | Hostnames allowed inside the project iframe |

## `skills/{id}`

| Field | Type |
| --- | --- |
| `name` | Localized |
| `icon` | string (emoji) |
| `category` | `"bi" \| "programming" \| "databases" \| "soft"` |
| `level` | number 0–100 |

## `projects/{id}`

| Field | Type | Description |
| --- | --- | --- |
| `title`, `summary`, `problem`, `approach`, `result` | Localized | Case-study text |
| `tools` | string[] | e.g. `["Power BI", "SQL"]` — used for filter chips and badges |
| `domain` | string | e.g. `"Retail"` — used for filter chips |
| `cover` | Media ref | Card image |
| `gallery` | Media ref[] | Modal image gallery |
| `metrics` | `{ label: Localized, value: string, hint?: Localized }[]` | KPI cards + hover quick-peek |
| `embedUrl` | string | Power BI / Tableau / Looker Studio iframe URL (host must be allow-listed) |
| `github`, `demo` | string | Optional links |
| `file` | Media ref | Optional downloadable file |
| `featured` | boolean | Pinned to the top with a glowing border |
| `impact` | number 1–10 | "Most impactful" sort |
| `date` | Month | "Newest" sort |
| `chart` | `ProjectChart \| null` | Optional interactive Recharts data (below) |

```ts
interface ProjectChart {
  type: "bar" | "line" | "area";          // initial type; visitors can switch
  xKey: string;                            // key of the x-axis column in `data`
  series: { key: string; name: Localized; color?: string }[];
  data: Record<string, string | number>[]; // one object per x value
}
```

## `experience/{id}`

| Field | Type |
| --- | --- |
| `company` | string |
| `role`, `location` | Localized |
| `startDate`, `endDate` | Month (empty end = present) |
| `bullets` | LocalizedList |

## `certificates/{id}`

| Field | Type |
| --- | --- |
| `title` | Localized |
| `issuer` | string |
| `date` | Month |
| `credentialId` | string |
| `verifyUrl` | string |
| `image` | Media ref |

## `education/{id}`

| Field | Type |
| --- | --- |
| `school`, `degree`, `field`, `description` | Localized |
| `startDate`, `endDate` | Month |

## `testimonials/{id}`

| Field | Type |
| --- | --- |
| `name`, `company` | string |
| `role`, `quote` | Localized |
| `avatar` | Media ref |
| `rating` | number 1–5 |

## `blog/{id}`

| Field | Type |
| --- | --- |
| `title`, `excerpt` | Localized |
| `content` | Localized (HTML) |
| `slug` | string, unique, used in `/blog/<slug>` |
| `cover` | Media ref |
| `tags` | string[] |
| `date` | Date |

## `messages/{id}` (contact form inbox)

| Field | Type |
| --- | --- |
| `name`, `email`, `message` | string |
| `createdAt` | number |
| `read` | boolean |
| `locale` | string (language the visitor was using) |

Visitors may only **create** messages (with exactly these fields); only the admin can read,
update or delete them.

## `media/{id}` (only when Firebase Storage is unavailable)

| Field | Type |
| --- | --- |
| `dataUrl` | string — compressed image (WebP) or PDF as a data URI |
| `type` | MIME type |
| `size` | bytes |
| `name` | original file name |
| `createdAt` | number |

Documents are limited to 1 MiB by Firestore, so images are compressed to ≤ 650 KB and PDFs must be
≤ 700 KB in this mode. With Firebase Storage enabled (Blaze plan) files go to Storage instead and the
reference is a plain download URL.

## Security rules summary

See [`firestore.rules`](firestore.rules) and [`storage.rules`](storage.rules).

- `site/*`, `media/*`: public read, admin write.
- Content collections: public read only when `published == true`; admin read/write everything.
- `messages`: anyone can create (validated shape), admin only for read/update/delete.
- Admin = signed-in user whose email is in the allowlist inside the rules file.
