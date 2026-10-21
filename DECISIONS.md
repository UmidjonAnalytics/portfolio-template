# Decisions

Judgment calls made while building, and why. Read this before changing the architecture.

## Firebase project & accounts

- **New project `abror-ashurov-portfolio`** was created with the Firebase CLI as requested, with a
  web app registered and Firestore created in `eur3`. Firestore rules are deployed.
- **The admin user was not created by me.** I never create accounts or handle passwords, so the
  owner creates the Email/Password user in Firebase Console (Authentication → Users). The email
  is already in the allowlist. The password that was pasted into the chat should be considered
  exposed and not reused.
- **Admin = email allowlist inside the rules** (`adminEmails()` in `firestore.rules`, same list in
  `storage.rules`, mirrored in `NEXT_PUBLIC_ADMIN_EMAILS`). Alternatives considered: an
  `admins/{uid}` document (needs the UID before the user exists and an extra console step) and
  custom claims (needs a backend). The email list is the simplest thing a student can edit: one line.
  Because Firebase Auth sign-up is open by default, the owner should create their user before
  sharing the config publicly, or enable "Restrict user creation" in Authentication → Settings.
- **Firebase Storage is not enabled.** New Firebase projects require the Blaze plan to create the
  default bucket, and the brief says free tiers only — this will be true for every student too. So
  uploads have a **fallback**: images are compressed client-side to WebP (≤ 650 KB) and stored as
  data URIs in a `media` collection; PDFs ≤ 700 KB likewise. `NEXT_PUBLIC_MEDIA_MODE=auto` tries
  Storage first and falls back automatically; `.env.local` is set to `firestore` for this project.
  If the owner later enables Storage (Blaze), switch to `auto`/`storage` and deploy `storage.rules`.
  The abstraction is one string ("media reference"), so nothing else in the app changes.

## Data & real-time

- **No composite indexes.** Public queries filter only on `published == true` and sort by `order`
  on the client. That keeps setup at "paste the rules" with no index deployment.
- **One `SiteDataProvider`** subscribes to every public collection once with `onSnapshot`; the
  header, sections and nav all derive from the same data, so a new certificate flips the section and
  the nav link in the same render (measured 57 ms save → visible in another tab on the emulator).
- **Hero "Projects" counter** falls back to the number of published projects when the manual
  value is empty, so a beginner gets a live counter without configuring anything.
- **Clear all data** deletes every collection, messages and uploaded media and resets the profile,
  but **keeps site settings** (colour, language, SEO), otherwise the site name and colour would
  vanish along with the content. After clearing, the hero shows "Your Name" / "Data Analyst"
  fallbacks and the dashboard checklist lists everything to add.
- **Seed via the admin button uses the signed-in user**; the CLI script signs in with
  `SEED_EMAIL` / `SEED_PASSWORD` from `.env.local`. Both go through the same rules as a normal
  user, so no service-account key has to be downloaded. The rules therefore allow the admin to
  create `messages` (visitors are restricted to a validated shape).
- **Blog** was not in the public-site list but is in the admin/empty-state list, so it exists as a
  hidden-when-empty section with `/blog/<slug>` post pages.

## Languages & theme

- **Uzbek in Latin script**, phrased naturally rather than word-for-word.
- Static UI strings live in `/locales/*.json`; dynamic fields are `{ en, ru, uz }` with `pick()`
  falling back to English then to any non-empty language.
- **Title / description are React-rendered `<title>`/`<meta>` tags** (React 19 hoisting) from
  `SeoSync`, not static Next metadata: they come from Firestore and must follow the language switch.
  Next's own metadata title was removed because it kept re-applying itself over the client value.
- **Pre-paint script** in `<head>` applies theme, language and accent from `localStorage` before
  hydration. Site defaults from Settings are cached into `localStorage` (`site-defaults`) so a
  returning visitor gets the configured default theme without a flash on the very first paint.
- **Accent colour is one CSS variable** (`--accent`); hover/soft/glow variants are derived with
  `color-mix()` so any hex from the settings page produces a coherent palette in both themes.
  Chart colours are separate tokens (`--chart-1..5`) tuned per theme for contrast.

## UI

- **Fonts**: Unbounded (display) + Manrope (body) + JetBrains Mono (numbers). Chosen for a
  distinctive but credible look and because all three ship Cyrillic glyphs (many "designer" fonts
  such as Bricolage or Fraunces do not, which would break Russian).
- **Desktop nav appears from 1280 px**. With nine sections plus language and theme controls the
  full nav overflowed at 1024 px, so tablets and small laptops get the slide-in drawer.
- **Icons**: lucide-react 1.x removed brand icons, so GitHub / LinkedIn / Telegram glyphs are local
  SVGs in `components/ui/BrandIcons.tsx`.
- **Rich text** uses Tiptap with a minimal toolbar and DOMPurify on render. Chart data is edited as
  validated JSON with an "Insert example" button — a full chart builder was out of scope.
- **Project modal** uses a custom focus trap (no extra dependency), arrow keys navigate within the
  currently filtered list, Esc closes, focus returns to the opening card.
- **Seed links** to GitHub / verification pages point at the sites' roots or generic verify pages
  rather than fabricated deep links that would 404. `embedUrl` is empty in the seed because there is
  no guaranteed-stable public dashboard to embed; the iframe slot works with any allow-listed URL.

## Tooling

- **ESLint**: `react-hooks/set-state-in-effect` (React Compiler rule) is disabled in
  `eslint.config.mjs`. The app deliberately syncs React state from browser-only sources
  (localStorage, matchMedia, Firestore snapshots) after mount, which is the documented pattern for
  hydration-safe reads; the rule flags every such effect. Everything else in the recommended sets is
  on and clean.
- **Turbopack root** is pinned in `next.config.ts` because a stray `package-lock.json` in the home
  directory made Next warn about the workspace root.
- **Verification** was done against the Firebase Emulator Suite (Auth + Firestore + Storage) with a
  throwaway emulator-only account, so no real data or real password was touched. The emulator data
  was not exported. Screenshots were limited because the desktop app's browser pane stopped painting
  frames mid-session; behaviour was verified through the DOM instead (see the summary).

## Deployment

- **GitHub**: public repo pushed as requested.
- **Vercel**: the CLI token on this machine is invalid and logging in requires the owner's browser,
  so the project is deploy-ready but not deployed. Import the repo in the Vercel dashboard, paste the
  `NEXT_PUBLIC_*` variables, and add the Vercel domain to Firebase → Authentication → Authorized
  domains.

## Intake form (added 2026-10-21)

- **Our own form instead of Google Forms.** Answers are saved in the site's own data shape and
  exported as one file that a customer site imports, so nothing is retyped. Google Forms cannot
  autosave drafts across devices, preview uploads, or validate per step.
- **The order code is the key.** No customer accounts: an 8-character random code (about 850
  billion possibilities) in the link is what lets someone open, save and submit one form. Codes
  cannot be listed, and submitting locks the form until the owner reopens it.
- **Files in Firestore, split into chunks.** Cloud Storage needs Blaze. A Firestore document is
  capped at 1 MiB, so files are stored as data-URI pieces of about 900 KB. Customers can upload but
  never read files back; tiny previews live inside the form document instead. The same chunking was
  added to customer sites' media, which previously capped CVs at 700 KB.
- **A file in between, not a cross-project connection.** The orders project and each customer's
  project are different Firebase projects. Moving data as one downloaded JSON file needs no shared
  credentials and works the same for every customer.
- **Uzbek only, no translation.** Text is imported in the language the customer wrote it in.
- **Language toggle built.** Sites can now offer one, two or three languages. The switcher hides
  disabled languages, and disappears when only one is left.
- **Any-language validation.** The admin panel used to require an English version of every text,
  which would have made an Uzbek-only site uneditable. It now requires at least one language.
- **Uzbek dates formatted by hand.** Chrome ships no Uzbek month names and printed "2024 M03". The
  site now writes "Mar 2024" and "15-mart 2024".
- **Verified on the emulator** end to end: a code issued in the admin, the whole form filled as an
  anonymous visitor on a 375 px screen, resumed after a reload from Firestore alone, submitted,
  exported, imported into a site, and the public site checked. 24 rule checks were run as an
  anonymous visitor and as the admin. Testing caught one bug before release: a PDF has no preview,
  and that empty field made Firestore reject every later autosave. It is fixed.

## Orders deployment (added 2026-10-22)

- **A separate Firebase project, `portfolio-anketa`,** holds every order, so no customer project
  ever contains another customer's data.
- **Hosted on Firebase Hosting, not Vercel.** The app has no server code, so it now builds as a
  static export (`STATIC_EXPORT=true`). That keeps the whole orders system in one Google account,
  and the Vercel CLI on this machine was not logged in. The only dynamic page, `/blog/[slug]`, is
  prerendered once for a placeholder slug and reads the real slug from the address bar; Hosting
  routes every `/blog/…` address to it. Normal builds for Vercel are unchanged.
- **Rules are generated per project.** `firestore.rules` used to carry one hard-coded admin list
  for every site, which would have let a customer's admin read the orders project. `npm run
  release` now writes the list from the env file's `NEXT_PUBLIC_ADMIN_EMAILS`, so the site's own
  allowlist and its rules always match.
- **Orders-only mode** (`NEXT_PUBLIC_INTAKE_ONLY=true`) forwards `/` to the form and reduces the
  admin menu to Buyurtmalar, so customers never land on an empty portfolio.
