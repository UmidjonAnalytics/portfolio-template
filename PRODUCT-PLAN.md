# Product plan: selling portfolio websites

Turning this codebase from one portfolio into a repeatable product sold to students and others.

Written 2026-10-21. This document is the starting context for the next working session.

---

## The five decisions

| # | Decision | Recommendation |
| --- | --- | --- |
| 1 | Where it is hosted | **Firebase only.** Static export to Firebase Hosting. Drop Vercel. |
| 2 | How the customer logs in | **Sign in with Google.** No passwords to create or share. |
| 3 | Who owns the project | **The customer, from day one.** You join as a temporary Owner and leave at the end. |
| 4 | How content is collected | **Two stages:** a pre-sale brief, then a guided wizard inside the admin panel. |
| 5 | How the site is customised | **Presets first,** per-section controls behind an "Advanced" toggle. |

Everything below explains these and lists what has to be built.

---

## 1. Platform: Firebase only

### Why it works

The app is already a perfect fit. Every one of the 55 components except the root layout is a
client component, there are no API routes, no server actions and no middleware. All data arrives in
the browser from Firestore. Nothing runs on a server.

That means it can be exported as plain static files and served from Firebase Hosting, with no
Vercel account anywhere in the picture.

### What the free Spark plan gives you

| Service | Free quota |
| --- | --- |
| Hosting | 10 GB storage, 360 MB/day transfer |
| Firestore | 1 GiB stored, 10 GiB/month egress, 50K reads/day, 20K writes/day |
| Authentication | 50K monthly active users |
| Cloud Storage | **Not available — requires the paid Blaze plan** |
| App Hosting | **Not available — requires the paid Blaze plan** |

In practice, 360 MB/day of transfer at roughly 400 KB per page load is about 900 visits a day, and
the Firestore egress budget covers roughly 10,000 image-heavy visits a month. A student portfolio
will not come close. Custom domains and HTTPS certificates are included free.

Cloud Storage being Blaze-only is why the app already stores uploaded images inside Firestore as
compressed WebP. That fallback stops being a workaround and becomes the design.

### What has to change

1. **Static export.** Set `output: "export"` and `images.unoptimized: true` in `next.config.ts`.
2. **The blog route.** `/blog/[slug]` is the only dynamic route and cannot be prerendered, because
   slugs live in Firestore at runtime. Fix it with a Firebase Hosting rewrite that sends `/blog/**`
   to one page which reads the slug from `location.pathname`. Two lines in `firebase.json`.
3. **Tighter image compression.** Drop the upload target from 650 KB to about 150 KB at 1200 px.
   Portfolio screenshots do not need more, and it multiplies the free egress budget by four.
4. **A deploy script.** `npm run release` to build and `firebase deploy` in one step.

### What you give up

Preview deployments on every push, and deploying by `git push`. Since you deploy for the customer
and they never touch the code, neither matters.

---

## 2. Ownership: invert it

The current model creates the project in your account and transfers it at the end. That transfer is
the painful part, and it is painful precisely because Google Cloud IAM is not a beginner tool.

**So do not transfer anything. Have the customer own it from the first minute.**

### The onboarding call, about five minutes

With the customer on a screen share, or following a screenshot guide in Uzbek and Russian:

1. They open `console.firebase.google.com` and sign in with their own Gmail.
2. **Add project** → they type the name → Continue three times.
3. **Project settings → Users and permissions → Add member** → your email → role **Owner**.
4. Done. They close the browser and send you nothing else.

From that point you build everything inside their project. At delivery you remove yourself under
the same Users and permissions screen. There is no invitation for them to accept, no transfer to
approve, and no window where you own their site.

### Why this is better for you too

- Google limits how many projects one account can create. Customer-owned projects never touch
  your quota, so there is no ceiling on how many you can sell.
- You are never holding someone else's business on your account.
- If a customer disappears, nothing of theirs is left in your console.
- If they later stop paying you for support, they lose nothing. That is what they bought.

### The fallback

If a customer genuinely cannot do step 2, create the project yourself and add them as Owner at the
end, exactly as described in [HANDOVER.md](HANDOVER.md). Keep this as the exception, not the rule.

---

## 3. Login: Google instead of passwords

Switch Firebase Authentication from Email/Password to **Google sign-in**.

- The customer clicks one button. There is no password to invent, send, or reset.
- You never handle their credentials, which removes the most awkward part of every handover so far.
- The admin allowlist works unchanged. The rules already check `request.auth.token.email`, so
  swapping the sign-in method needs no change to `firestore.rules`.
- Almost everyone in your market already has a Gmail account, which is also what they need for
  Firebase anyway. One account for everything.

**To build:** replace the email and password form on `/admin/login` with a Google button, keep
email and password as a hidden fallback for the rare customer without Gmail, and delete the
password reset flow.

**One rule to keep:** the admin allowlist stays. With Google sign-in anyone can authenticate, so the
allowlist is the only thing separating a visitor from the owner. It is already enforced in the
security rules, not just the interface.

---

## 4. Collecting the content

This is where most of the delivery time goes today, so it deserves the most design.

### The problem with a Google Form

A form collects answers into a spreadsheet, and then you retype everything into the admin panel.
That is the slow part, and it is slow once per customer forever.

### Two stages instead

**Stage A — the pre-sale brief.** A short document and a Google Form or Telegram bot, sent the
moment someone buys. Its only job is to make them gather materials before the work starts:

- Photo, CV as PDF, certificate scans, project screenshots.
- Which languages they want. Which sections apply to them.
- Their preferred accent colour and one example site they like.
- Their Gmail address, for the Firebase step.

Collect **files** here, not prose. Files are what people forget.

**Stage B — the in-product wizard.** The written content is entered by the customer, in the admin
panel, into a guided wizard that writes straight to Firestore in the right shape. No retyping by
you, ever.

On first login, if the profile is empty, the admin panel opens a wizard instead of the dashboard:

1. Who you are: name, job titles, tagline.
2. About you: bio, location, languages, availability.
3. Your photo and CV.
4. How to reach you: at least one contact method.
5. Your skills: pick from a prepared list of 40 common analyst tools, set levels with sliders.
6. Your first project: guided through problem, approach, result and metrics with examples beside
   each field.
7. Anything else: experience, certificates, education, each skippable.

Each step saves as it goes, mandatory fields are enforced per step, and the wizard can be left and
resumed. The completeness checklist already on the dashboard becomes the "what is still missing"
view after the wizard is done.

**The hardest field is the project write-up,** because beginners freeze at a blank box. Put a worked
example and a sentence-starter beside each of problem, approach and result. The seed data already
contains eight good examples to draw from.

### The content checklist to send them

See the appendix at the end of this document.

---

## 5. Per-section design settings

### The data model

Replace the current `sections: Record<SectionKey, boolean>` with a richer per-section object:

```ts
interface SectionStyle {
  enabled: boolean;
  order: number;                    // lets the owner reorder sections on the page
  layout: string;                   // variants differ per section, see table below
  background: "none" | "tint" | "mesh" | "grain" | "gradient" | "image";
  backgroundImage?: string;         // media ref, used when background === "image"
  animation: "none" | "fade" | "slide" | "zoom" | "stagger";
  speed: "slow" | "normal" | "fast";
  density: "compact" | "normal" | "spacious";
  columns?: 1 | 2 | 3 | 4;          // grid sections only
}

// in SiteSettings
sectionStyles: Record<SectionKey, SectionStyle>;
```

### The layout variants worth building

| Section | Variants |
| --- | --- |
| Hero | split, centred, full-bleed image, minimal |
| Skills | bars, radial gauges, tag cloud, grouped cards |
| Projects | grid, list, masonry, carousel, featured-first |
| Experience | timeline, cards, compact list |
| Certificates | grid, carousel, stacked slides, logo wall |
| Education | timeline, cards |
| Testimonials | carousel, grid, single quote |
| Blog | cards, list, magazine |

Start with two variants per section and add more once the structure is proven. The structure is the
work; each extra variant after that is an afternoon.

### The interface, and the warning that comes with it

A beginner handed 7 sections × 6 settings will freeze, and the result will usually look worse than
the default. So build it in this order:

1. **Theme presets first.** Four or five named looks, each setting every section at once. Something
   like Minimal, Bold, Classic, Editorial. One click, immediate result. Most customers will stop here
   and be happy, and every site you deliver will look intentional.
2. **Per-section controls behind an "Advanced" toggle,** on each section's own admin page rather
   than buried in Settings. Editing projects is where you think about how projects should look.
3. **A live preview pane.** The site already updates in real time from Firestore, so an iframe of
   the public site beside the controls needs almost no new plumbing and makes the whole feature
   feel safe to experiment with.

### Guard rails

Keep the choices constrained. Offer six background styles, not a colour picker for every surface.
Offer three speeds, not a milliseconds field. Every setting you expose is a way for a customer to
make their own site look broken and then ask you to fix it.

---

## 6. Build order

**Phase 1 — make it a product.** Static export and Firebase Hosting, Google sign-in, the deploy
script, tighter image compression, repo made private. After this you can deliver a site without
Vercel and without handling anyone's password.

**Phase 2 — make delivery fast.** The onboarding wizard, the pre-sale brief and checklist, and a
one-command setup script that takes a Firebase project id and produces a deployed site. This is the
phase that decides how many customers you can serve.

**Phase 3 — make it worth paying for.** Theme presets, then per-section layout variants, then the
advanced controls and the live preview.

**Phase 4 — polish.** More layout variants, more skill presets, a gallery of finished examples to
show prospects.

Phase 1 and 2 are the business. Phase 3 is the thing customers will think they are buying.

---

## 7. Things to settle before building

- **Price and what it includes.** Specifically whether a year of "I will fix it" is bundled, since
  that is the cost that grows with every customer.
- **Make the repository private.** It is public right now. You are about to sell what is in it.
- **Domains.** Whether you resell `.uz` domains or each customer buys their own. Buying their own
  avoids every transfer problem, at the cost of another thing to explain.
- **Support boundary.** Where "I will help you" ends. Put it in writing before the first sale.
- **One language or three.** Trilingual is a strong selling point, but it triples what the customer
  has to write. Consider making Russian and Uzbek optional extras rather than default.

---

## Appendix: the content brief to send customers

Send this the moment someone buys, before any technical step.

**Files to prepare**

- One photo of yourself. Shoulders up, good light, any modern phone is fine. Portrait orientation.
- Your CV as a PDF.
- Certificate images or screenshots, one file each.
- For every project: two or three screenshots of your dashboard, chart or spreadsheet.

**Basic information**

- Full name as it should appear on the site.
- Two or three job titles you want to be known by.
- One sentence describing what you do.
- City and country.
- Languages you speak and your level in each.
- Whether you are looking for work, open to freelance, or neither.
- Email, phone, Telegram, LinkedIn and GitHub. Any you do not have, we leave out.
- Your Gmail address, which becomes your login.

**For each project, three or four is enough to start**

- What was the problem? Who had it and why did it matter?
- What did you do about it? Which tools?
- What changed as a result? Give at least one number, even an estimate.
- Two or three key numbers to highlight, for example "6 hours to 15 minutes".
- Links to GitHub or a live dashboard, if any.

**If you have them**

- Jobs: company, role, dates, and two or three things you achieved there.
- Certificates: name, who issued it, date, credential number, verification link.
- Education: school, degree, field, dates.
- Testimonials: ask a teacher, client or colleague for two sentences.

**Design**

- One colour you want as the accent.
- One website you like the look of.
- Light or dark as the default.

Anything on this list you do not have yet is fine. Those sections stay hidden until you add them,
and the site still looks finished without them.
