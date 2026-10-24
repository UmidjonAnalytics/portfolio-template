# Going public

Everything you do to start selling, then what you do for each sale. Links are to the live orders
project, `portfolio-anketa`.

---

## 1. Once, before the first post (about 15 minutes)

1. **Your admin login.** In the Firebase console, open
   [Authentication → Sign-in method](https://console.firebase.google.com/project/portfolio-anketa/authentication/providers)
   and enable **Email/Password**. Then go to
   [Users](https://console.firebase.google.com/project/portfolio-anketa/authentication/users) →
   **Add user** with `umidjonarslonov.analytics@gmail.com` and a new password.
2. **Fill the demo.** Sign in at <https://portfolio-anketa.web.app/admin> → **Settings → Danger
   zone → Seed demo data**. The demo person is made up (Jasur Karimov) and has no real contacts.
3. **Pick the demo's look.** Admin → **Design**. Classic is a safe first impression.
4. **Try it as a customer, on your phone:**
   - <https://portfolio-anketa.web.app> → **O‘zimniki qilib ko‘rish** → type a name, add a photo,
     switch styles.
   - <https://portfolio-anketa.web.app/forma?namuna=1> — the order form, nothing saved.

## 2. The post

- Text: [docs/offer/telegram-post-uz.txt](docs/offer/telegram-post-uz.txt)
- Video: [docs/offer/video/promo-devices.mp4](docs/offer/video/promo-devices.mp4), 25 s, the real
  site scrolling on laptop, tablet and phone in six styles. Remake it with `scripts/promo/`
  (instructions at the top of `record.mjs`).
- Older, shorter versions that also show the form and the referral bonus: `promo-<voice>.mp4`,
  `promo.gif` and `scene-1.png` … `scene-5.png` in the same folder.

Post the video with the text as its caption, then pin it.

## 3. Each sale

1. **Payment arrives.** Ask whether someone referred them. If yes, ask for that person's 6-letter
   code.
2. **Admin → Buyurtmalar.** Type their name, the referral code if any, tick **O‘quvchim** for your
   own students, press **Havola yaratish**. The link is copied — send it on Telegram.
3. **They fill the form.** Watch the status: Ochilmagan → To‘ldirilmoqda 4/9 → **Yuborildi**. On the
   thank-you screen they see their own referral code.
4. **Sayt fayli** downloads everything as one file. Build the site (section 4).
5. **Referral.** If this customer was referred, the **Takliflar** box at the top of Buyurtmalar shows
   who brought them. Send 50 000 so‘m to that person's card (ask for the card number on Telegram;
   it is never stored on the site) and tick **qaytarildi**.
6. **Their own code.** The gift button on their row copies a ready message with their referral
   code, to send them when you hand over the site.

## 4. Building the customer's site (Firebase only)

1. **Their project, their Gmail.** On a short call, the customer opens
   [console.firebase.google.com](https://console.firebase.google.com) with their Gmail → **Add
   project** → any name → Continue to the end. Then **Project settings → Users and permissions →
   Add member** → your email → **Owner**. Details: [PRODUCT-PLAN.md §2](PRODUCT-PLAN.md).
2. **In their project:** Build → **Firestore Database → Create database** (production mode, any
   region near Uzbekistan, e.g. `europe-central2`). Build → **Authentication → Get started →
   Email/Password**. Project settings → **Your apps → Web (</>)** → register → copy the config.
3. **Env file on your computer:** copy `.env.example` to `.env.<name>` (git-ignored). Paste the
   config, set `NEXT_PUBLIC_ADMIN_EMAILS=<their Gmail>,umidjonarslonov.analytics@gmail.com`,
   `NEXT_PUBLIC_SITE_URL=https://<project-id>.web.app`, and leave `INTAKE_*` and `DESIGN_DEMO`
   false.
4. **Publish:** `npm run release -- .env.<name>`
5. **Logins.** In their Authentication → Users, add yourself and add them (any temporary password).
   They set their own password with **Forgot password?** on the login page; you never learn it.
6. **Fill it.** Sign in at `https://<project-id>.web.app/admin` → **Settings → Danger zone → Import
   from intake form** → the Sayt fayli. Check every section; pick layouts in **Design** together.
7. **Domain.** Hosting → **Add custom domain** → `<name>.uz` → add the DNS records it shows at
   ahost. HTTPS turns on by itself within a few hours.
8. **Hand over.** Remove your email from `NEXT_PUBLIC_ADMIN_EMAILS` in `.env.<name>`, run
   `npm run release -- .env.<name>`, delete your user in their Authentication, and remove yourself
   under Users and permissions. Then delete their order in Buyurtmalar to free space (their referral
   code is kept).
