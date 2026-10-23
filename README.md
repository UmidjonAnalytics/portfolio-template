# Data Analyst Portfolio + Admin Panel

A production-ready, reusable portfolio website for a data analyst with a secure admin panel.
Trilingual (English / Russian / Uzbek), light + dark mode, real-time content from Firestore,
deployed to Vercel on free tiers only. Built to be cloned for students: every content section is
hidden until the first item is published, so an empty portfolio still looks finished.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Firebase (Firestore, Auth,
Storage) · Framer Motion · Recharts · Tiptap · dnd-kit · Vercel.

Companion docs: [DATA-MODEL.md](DATA-MODEL.md) · [STUDENT-GUIDE.md](STUDENT-GUIDE.md) ·
[DECISIONS.md](DECISIONS.md) · [CHECKLIST.md](CHECKLIST.md) · [HANDOVER.md](HANDOVER.md) · [PRODUCT-PLAN.md](PRODUCT-PLAN.md) · [INTAKE.md](INTAKE.md)

---

## How it works

- **Public site** (`/`): hero, about, skills, projects, experience, certificates, education,
  testimonials, blog, contact. Everything except hero / about / contact is Firestore-driven and
  disappears (section **and** nav link) when it has zero published items.
- **Intake form** (`/forma`, owner's deployment only): a 9-step Uzbek questionnaire that customers fill
  after paying; its answers export as one file that a customer site imports. See [INTAKE.md](INTAKE.md).
- **Admin panel** (`/admin`): Firebase email/password login, dashboard with completeness checklist,
  full CRUD for every collection with EN/RU/UZ tabs, drag-and-drop ordering, publish/draft toggles,
  image + CV upload, inbox, site settings, seed / clear demo data.
- **Real time:** every list uses `onSnapshot`, so saving in the admin updates any open public tab
  within ~1 second, no refresh.

## Folder structure

```
.
├─ locales/                 en.json · ru.json · uz.json  (all static UI strings)
├─ scripts/seed.ts          CLI seeding / clearing (npm run seed, npm run seed:clear)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx         fonts, pre-paint theme script, providers
│  │  ├─ (public)/          public site: layout (header/footer), page.tsx, blog/[slug]
│  │  └─ admin/             admin panel: layout (auth guard), login, dashboard, one page per collection
│  ├─ components/
│  │  ├─ ui/                Button, Modal (focus trap), Section, Reveal, Skeleton, SmartImage, Badge, switchers
│  │  ├─ public/            Hero, About, Skills, Projects (+Card, Modal, InteractiveChart), Experience,
│  │  │                     Certificates, Education, Testimonials, Blog, Contact, Header, Footer, SeoSync
│  │  └─ admin/             AdminShell (guard + sidebar), CrudPage (generic list/editor), form fields,
│  │                        MediaField (uploads), RichTextEditor (Tiptap), EmptyState
│  └─ lib/
│     ├─ types.ts           data model (see DATA-MODEL.md)
│     ├─ firebase.ts        Firebase init + emulator wiring + admin allowlist
│     ├─ i18n.tsx           LocaleProvider, t() for static strings, tr() for Firestore fields
│     ├─ theme.tsx          ThemeProvider + pre-paint script (no white flash)
│     ├─ site-data.tsx      one provider subscribing to all public collections in real time
│     ├─ hooks.ts           useCollection / useDocument (onSnapshot), misc hooks
│     ├─ media.ts           upload / resolve media refs (Storage, or Firestore fallback on free plan)
│     ├─ placeholders.ts    programmatic SVG placeholder images for the seed
│     ├─ seed/              demo content + seedAll() / clearAll()
│     └─ utils.ts           helpers
├─ firestore.rules · storage.rules · firestore.indexes.json · firebase.json
├─ .env.example             copy to .env.local
└─ DATA-MODEL.md · STUDENT-GUIDE.md · DECISIONS.md · CHECKLIST.md
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (zero warnings expected) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Fill Firestore with the demo analyst (needs `SEED_EMAIL` / `SEED_PASSWORD` in `.env.local`) |
| `npm run seed:clear` | Delete all content (settings are kept) |
| `npm run emulators` | Firebase Auth + Firestore + Storage emulators (needs Java) |
| `npm run release -- <env file>` | Static build + this site's own Firestore rules + Firebase Hosting deploy, all for the project in that env file. The rules' admin list comes from its `NEXT_PUBLIC_ADMIN_EMAILS` |
| `npm run release -- <env file> --rules` | Deploy only that site's rules |
| `npm run deploy:rules` | Deploys `firestore.rules` exactly as committed to the default project. Prefer `release`, which sets the right admins per project |

## Environment variables

Copy `.env.example` to `.env.local` (git-ignored) and fill in the values from Firebase Console →
Project settings → Your apps.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `<project>.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app id |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Comma-separated admin emails (must match the allowlist in `firestore.rules` / `storage.rules`) |
| `NEXT_PUBLIC_MEDIA_MODE` | `auto` (default), `storage` or `firestore` — where uploads are kept |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used for Open Graph metadata |
| `NEXT_PUBLIC_USE_EMULATORS` | `true` only when developing against the local emulators |
| `NEXT_PUBLIC_INTAKE_ENABLED` | `true` only on your own deployment: turns on the intake form at `/forma` and Admin → Buyurtmalar. See [INTAKE.md](INTAKE.md) |
| `NEXT_PUBLIC_INTAKE_ONLY` | `true` for a deployment that exists only for orders: `/` forwards to the form and the admin shows only Buyurtmalar |
| `NEXT_PUBLIC_DESIGN_DEMO` | `true` only on the demo site: adds a "Try designs" panel so visitors can switch styles and layouts (not saved) |
| `SEED_EMAIL`, `SEED_PASSWORD` | Admin credentials used **only** by `npm run seed` on your machine |

All `NEXT_PUBLIC_*` values are safe to expose: Firebase web config is public by design and the
security rules are what protect the data.

## Setting up a new copy (for a student)

1. **Firebase** → create a project, add a Web app, enable **Authentication → Email/Password**,
   create the admin user, create a **Firestore** database. (Storage is optional; new projects need the
   Blaze plan for it. Without it, uploads are stored compressed inside Firestore automatically.)
2. Put the web config into `.env.local`; put the admin email into `NEXT_PUBLIC_ADMIN_EMAILS`
   **and** into the `adminEmails()` list in `firestore.rules` (and `storage.rules`).
3. `firebase use <project-id>` then `npm run deploy:rules` (or paste the rules in the console).
4. `npm install && npm run dev` → open http://localhost:3000/admin, sign in, press
   **Settings → Seed demo data** to see the design, then **Clear all data** and start adding content.
5. **Vercel** → import the GitHub repo, add the same `NEXT_PUBLIC_*` variables, deploy.
   Add the Vercel domain to Firebase → Authentication → Settings → Authorized domains.

## Local development against the emulators

```bash
npm run emulators
```

Then create a file `.env.development.local` with:

```
NEXT_PUBLIC_USE_EMULATORS=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-portfolio
NEXT_PUBLIC_FIREBASE_API_KEY=fake-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=demo-portfolio.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:1:web:1
NEXT_PUBLIC_MEDIA_MODE=auto
```

Create a user in the Auth emulator UI (http://127.0.0.1:4000) with an email from the allowlist,
then `npm run dev`. Delete `.env.development.local` to go back to the real project.

## Security model

- `firestore.rules`: public read of `site/*`, `media/*` and **published** items only; all writes
  require a signed-in user whose email is in the allowlist; `messages` is create-only for visitors
  (shape validated) and readable only by the admin.
- `storage.rules`: public read, admin-only writes limited to images/PDF under 15 MB.
- The admin UI additionally checks `NEXT_PUBLIC_ADMIN_EMAILS` and redirects anonymous visitors to
  `/admin/login`. Rules are the real gate; the UI check is only UX.
- Rich text is sanitised with DOMPurify before rendering. Iframe embeds are limited to hosts in
  Settings → embed allowlist and rendered in a sandbox.

## Licence

MIT — reuse it for yourself and your students.
