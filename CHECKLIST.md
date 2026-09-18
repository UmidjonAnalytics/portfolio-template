# Manual QA checklist

Run through this after deploying or after any larger change. Items marked **(auto)** were also
verified by the automated pass described in DECISIONS.md.

## Build & code quality

- [ ] `npm run build` completes with zero errors **(auto)**
- [ ] `npm run typecheck` passes **(auto)**
- [ ] `npm run lint` passes with zero warnings **(auto)**

## Empty state (fresh project / after "Clear all data")

- [ ] Public site shows hero, about and contact only; no empty headings, no "coming soon"
- [ ] Header nav shows only About and Contact
- [ ] Hero counters are hidden when all stats are empty
- [ ] Download CV button is hidden when no CV
- [ ] Contact direct buttons are hidden when their field is empty
- [ ] Admin dashboard checklist lists everything that is missing
- [ ] Every admin section shows a friendly empty state with an "Add your first …" button

## Real-time behaviour

- [ ] Open the public site in tab A and the admin panel in tab B
- [ ] In B add and publish one certificate → in A the Certificates section AND the nav link appear within ~1 s without refresh **(auto, via emulator)**
- [ ] In B unpublish it → section and nav link disappear in A
- [ ] In B change the accent colour and save → A recolours immediately
- [ ] In B change the profile name → A hero updates immediately

## Languages

- [ ] EN / RU / UZ switch in header and footer changes all static UI text (no English leftovers in RU/UZ) **(auto)**
- [ ] Dynamic content switches language; an item without RU/UZ translation falls back to EN
- [ ] `<html lang>` follows the active language **(auto)**
- [ ] Language choice survives a reload (localStorage) **(auto)**
- [ ] Admin forms: EN / RU / UZ tabs store three translations; the fallback hint appears for empty translations
- [ ] Uzbek is Latin script and reads naturally

## Theme

- [ ] Toggle in header switches light/dark; choice survives reload **(auto)**
- [ ] First visit respects the OS `prefers-color-scheme`
- [ ] No white flash on load in dark mode (hard-refresh with cache disabled)
- [ ] Check contrast in both themes: tool badges, KPI cards, modal, chart palette, toasts, admin tables

## Projects

- [ ] Filter chips (tools + domains) combine correctly; "Clear filters" resets **(auto)**
- [ ] Search filters by title/summary/text **(auto)**
- [ ] Sort: Newest / Most impactful / A–Z; featured stays pinned on top **(auto)**
- [ ] Grid ↔ list toggle; choice is remembered **(auto)**
- [ ] Card hover lifts and reveals key metrics
- [ ] Featured project has the glowing border
- [ ] Modal: problem / approach / results, animated KPI cards, gallery, links
- [ ] Modal: ← → move between projects, Esc closes, focus is trapped, focus returns to the card **(auto: arrows + Esc)**
- [ ] Interactive chart renders; series toggles work; bar/line/area switch works
- [ ] Iframe embed shows only for allow-listed hosts; other hosts show the blocked message + external link

## Certificates

- [ ] Card grid with thumbnail, issuer, date, credential ID
- [ ] Verify button opens the verification URL in a new tab
- [ ] Clicking the thumbnail opens the lightbox with the full image; Esc closes

## Other sections

- [ ] Experience timeline shows "Present" for open-ended roles
- [ ] Education timeline
- [ ] Testimonials carousel: arrows, dots, autoplay pauses on hover
- [ ] Blog cards link to `/blog/<slug>`; post page renders rich text; unknown slug shows not-found message

## Contact

- [ ] Validation errors show for empty name / bad email / short message
- [ ] Successful submit shows confirmation and the message appears in Admin → Messages as unread **(auto)**
- [ ] Unread badge in admin sidebar updates live

## Admin

- [ ] `/admin` while logged out redirects to `/admin/login` **(auto)**
- [ ] Wrong password shows a friendly error; "Forgot password" sends the reset email
- [ ] A signed-in user whose email is not in the allowlist sees the "not an admin" screen
- [ ] Dashboard stats and completeness % are correct
- [ ] Every collection: create, edit, delete, publish/unpublish, drag-and-drop reorder (order survives reload)
- [ ] Image upload shows a preview and progress; replace and remove work
- [ ] CV upload and replace work; public "Download CV" downloads the new file
- [ ] Toast appears on every save
- [ ] Settings: accent colour, default language/theme, section toggles, SEO, favicon, GA id, embed allowlist all persist
- [ ] Danger zone: "Seed demo data" fills the site; "Clear all data" empties it (typing DELETE required)
- [ ] Sign out returns to the login page

## Responsive & accessibility

- [ ] 375 px: no horizontal scroll, mobile nav drawer slides in, all sections readable
- [ ] 768 px: two-column grids, nav drawer still used
- [ ] 1440 px: full desktop nav, three-column grids
- [ ] Tab through the page: visible focus rings everywhere, skip-to-content link works
- [ ] All icon-only buttons have `aria-label`s; images have alt text
- [ ] Reduced-motion OS setting disables the typing effect and reveal animations

## Security

- [ ] Firestore rules deployed: anonymous read of a draft item is denied
- [ ] Anonymous write to any collection except `messages` create is denied
- [ ] Anonymous read of `messages` is denied
- [ ] Storage rules deployed (only if Storage is enabled)
- [ ] `.env.local` is not committed; `.env.example` is
