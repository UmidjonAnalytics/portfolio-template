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
