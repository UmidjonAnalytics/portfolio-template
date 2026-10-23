# Intake form ("anketa")

Our own form for collecting everything needed to build a customer's site. It replaces a Google
Form because it can do three things a Google Form cannot:

1. **Save as the customer types,** so they can stop and continue later, even on another device.
2. **Take files properly** — photo, CV, project screenshots and certificates — with previews,
   automatic image compression, and CVs up to 10 MB.
3. **Export straight into the site.** A submitted form becomes one site file that the customer's
   site imports in one click. Nothing is retyped.

The form itself is in Uzbek only. The admin pages around it follow the admin panel's language.

---

## How a sale works

```
Customer pays
   └─► you create a link in Admin → Buyurtmalar, it is copied automatically
         └─► you send the link on Telegram
               └─► customer fills the form at /forma?kod=XXXXXXXX (autosaves)
                     └─► you watch the status: Ochilmagan → To‘ldirilmoqda 4/9 → Yuborildi
                           └─► "Sayt fayli" downloads sayt-<name>-<code>.json
                                 └─► in the CUSTOMER'S site: Admin → Settings → Danger zone → Import
                                       └─► review, adjust, hand over
```

1. **Create the link.** Admin → **Buyurtmalar** → type the customer's name, tick **O‘quvchim** if
   they are your student (the 1:1 call bonus), press **Havola yaratish**. The link is copied.
2. **Send it.** The link is personal: whoever has it can fill that one form, nobody else can.
3. **Watch.** The list updates live and shows how far they got.
4. **Review.** The eye button shows every answer and lets you download each file.
5. **Export.** When the status is **Yuborildi**, press **Sayt fayli**. You get one JSON file
   with all text and files inside.
6. **Import.** Sign in to the customer's own site, go to **Settings → Danger zone → Import from
   intake form**, choose the file, confirm. Profile, skills, projects, experience, certificates,
   education, testimonials, languages, style, accent colour and theme are all filled in. Block
   layouts are left at their defaults; pick them with the customer in **Admin → Design**.
7. **Track your own progress** with the stage dropdown: Yangi → Sayt yig‘ilmoqda → Topshirildi.

If a customer needs to change something after submitting, press **Qayta ochish** (the circular
arrow). Their link works again until they resubmit.

When the site is delivered, delete the order (bin icon). That removes the form and every uploaded
file, which keeps your free Firestore storage from filling up.

---

## What the form asks

| Step | Contents | Required |
| --- | --- | --- |
| 1. Siz haqingizda | Full name, Gmail, phone, Telegram | Name, Gmail, phone |
| 2. Domen va tillar | Three `.uz` domain options with suggestions from the name; which site languages; default language; which language they write in | One domain, one language |
| 3. Profil | Up to three job titles, one-line tagline, bio, city, spoken languages, availability | Title, tagline, bio (100+ characters), city |
| 4. Rasm va rezyume | Photo with do/don't guidance, CV as PDF | Photo |
| 5. Ko‘nikmalar | 28 common skills to tick, a level for each, custom skills | At least 3 |
| 6. Loyihalar | Up to 8 projects: title, summary, domain, tools, date, problem, approach, result, 3 key numbers, up to 3 screenshots, links, "best project" | At least 1, complete |
| 7. Tajriba va sertifikatlar | Jobs, certificates with images, education, testimonials | All optional |
| 8. Aloqa va dizayn | Which contacts appear on the site, site style (picks a matching colour), accent colour, light or dark, an example site, notes | — |
| 9. Tekshirish | Summary with edit buttons, two confirmations: the information is real, and the site does not guarantee a job | Both confirmations |

Every field a beginner might freeze at has an example beside it. The project step has worked
examples for problem, approach and result.

**Languages:** text goes into the site in the language the customer wrote it in. Tarjima is not
included, and the form says so. The site's buttons and menus are already in all three languages.

---

## Where it runs

The form has its own Firebase project, **`portfolio-anketa`**, separate from every customer:

- Form: <https://portfolio-anketa.web.app/forma> (the bare address forwards there)
- Admin: <https://portfolio-anketa.web.app/admin> → **Buyurtmalar**
- Config: `.env.orders` on your computer (git-ignored), with `NEXT_PUBLIC_INTAKE_ONLY=true`, so the
  site shows only the form and the admin shows only Buyurtmalar.

To publish a change to the form:

```bash
npm run release -- .env.orders
```

That builds the site, generates this project's own security rules from `NEXT_PUBLIC_ADMIN_EMAILS`
in `.env.orders`, and deploys both. Only the emails in that file can see orders; customer admins
listed in other projects are never written into these rules.

The form is switched off by default, so every customer site built from this template returns 404
at `/forma`.

### Setting it up again from scratch

1. Create a Firebase project with Firestore, and enable Authentication → Email/Password.
2. Copy `.env.example` to a new env file, fill in the project's web config, and set
   `NEXT_PUBLIC_ADMIN_EMAILS` to your email, `NEXT_PUBLIC_INTAKE_ENABLED=true` and
   `NEXT_PUBLIC_INTAKE_ONLY=true`.
3. `npm run release -- <that env file>`, then create your admin user in the Firebase console.

---

## Files and limits

Cloud Storage needs the paid Blaze plan, so all files live in Firestore on the free plan.

- **Images** are resized in the browser to at most 1600 px and compressed, usually to 30–400 KB.
- **CVs and other files** up to 10 MB are split into ~900 KB pieces, because one Firestore
  document holds at most 1 MiB. The same splitting is used on customer sites, so a large CV
  imports and downloads intact.
- Firestore's free plan holds 1 GiB. A typical submission is 1–5 MB, so a few hundred orders fit,
  and deleting delivered orders frees the space.

---

## Security

- An order code is 8 characters from a 31-letter alphabet, about 850 billion possibilities, and it
  is the only key to that form. Codes cannot be listed by anyone but you.
- Visitors can create and update only their own form, and only until it is submitted.
- Uploaded files can be created by a customer but read back **only by you**, so a leaked link does
  not expose anyone's CV.
- Nobody but you can read, list or delete orders.

All of this is enforced in `firestore.rules`, not just in the interface.

---

## Changing the form

| To change | Edit |
| --- | --- |
| The skill list, project domains, tools, colour presets | `src/lib/intake/catalog.ts` |
| Which fields are required and the error messages | `src/lib/intake/validate.ts` |
| Questions, hints and examples | `src/components/intake/steps.tsx` |
| How answers map onto the site | `src/lib/intake/to-package.ts` |
