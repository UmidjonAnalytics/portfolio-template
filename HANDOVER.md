# Handover checklist

Transferring the whole project to **Abror Ashurov** — GitHub [@AshurovAS](https://github.com/AshurovAS),
email `abrorashurov922@gmail.com`.

> ⚠️ **Check the email first.** It was given as `Abrorashurov922@gamil.com`. `gamil.com` is a
> well-known misspelling of `gmail.com`, so it is written as `abrorashurov922@gmail.com` everywhere
> in this project. If the real address is different, fix it in the four places listed in
> [Changing the admin email](#changing-the-admin-email) before doing anything else — a wrong address
> here means Abror cannot log in, and a stranger who owns that address could.

---

## 1. What has to change hands

| Asset | Where it lives | Current owner |
| --- | --- | --- |
| Source code | GitHub `UmidjonAnalytics/data-analyst-portfolio` | Umidjon |
| Content + login (database) | Firebase project `abror-ashurov-portfolio` | Umidjon's Google account |
| Hosting | Vercel project | Umidjon's Vercel account |
| Domain | `.uz` domain at ahost.uz (if bought) | Umidjon's ahost account |

All four are separate accounts. Handing over the code alone is not enough — without Firebase, Abror
cannot log in or edit anything.

---

## 2. The code (GitHub)

**Recommended: keep your copy, give Abror his own.** You plan to reuse this codebase for other
students, so do not transfer the repository away. Instead:

1. Open your repo → **Settings** → scroll to **Template repository** → tick the box.
2. Send Abror the repo link. He clicks **Use this template** → **Create a new repository**, which
   gives him an independent copy under `AshurovAS` that you no longer control.
3. Your repo stays as the master template for the next student.

**Alternative, if you want to hand the repository itself over:** repo → Settings → Danger Zone →
**Transfer ownership** → type `AshurovAS`. You lose access unless he adds you back, so fork it to
your own account first if you want to keep a copy.

**Simplest middle ground:** repo → Settings → Collaborators → **Add people** → `AshurovAS`. You both
keep full access to the same repository.

---

## 3. The database and login (Firebase)

This is the important one. Without it Abror owns a website he cannot edit.

1. Open the [Firebase Console](https://console.firebase.google.com/project/abror-ashurov-portfolio/settings/iam)
   for project `abror-ashurov-portfolio`.
2. **Users and permissions** → **Add member** → `abrorashurov922@gmail.com` → role **Owner** → Add.
   He gets an email invitation and must accept it.
3. **Authentication** → **Users** → **Add user** → his email and a temporary password. Send him the
   password through a private channel, never in a public chat, and tell him to change it with
   "Forgot password?" at first login.
4. **Authentication** → **Settings** → make sure self sign-up is still disabled, so only the users
   you create can exist.
5. Once Abror confirms he can log in at `/admin`, remove yourself:
   - Delete your user under Authentication → Users.
   - Remove your email from the admin lists (see below) and redeploy the rules.
   - Remove yourself under Users and permissions.

Do step 5 **last**. If you remove yourself before he is in, nobody can administer the site.

The project is on the free Spark plan, so there is no billing account to transfer.

---

## 4. Hosting (Vercel)

Vercel cannot move a project between personal accounts directly, so the clean way is for Abror to
deploy his own copy:

1. Abror creates a Vercel account and signs in with GitHub.
2. **Add New → Project** → imports his copy of the repository.
3. He adds these environment variables (copy the values from your `.env.local`, they are the same
   Firebase project). All are safe to be public and should be marked **Config**, not Sensitive:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_ADMIN_EMAILS
   NEXT_PUBLIC_MEDIA_MODE
   NEXT_PUBLIC_SITE_URL
   ```

   Never add `SEED_EMAIL` or `SEED_PASSWORD` to Vercel. They are only for the local seed script.
4. Deploy, then add the new Vercel URL under Firebase → Authentication → Settings →
   **Authorized domains**, or login will fail on that URL.
5. Delete your own Vercel project once his is working, so there are not two live copies writing to
   the same database.

**Or, if you want to keep one deployment and just share it:** upgrade to a Vercel Team and invite
him. That costs money, so the copy approach above is usually better.

---

## 5. The domain

If you already bought the `.uz` domain for him:

1. In your ahost.uz panel, use the domain transfer / change owner option, or ask ahost support to
   move it to his account. Uzbek registrars usually need a written request plus ID documents.
2. Until that happens, the simplest thing is to point the existing domain at **his** Vercel project:
   in Vercel, add the domain to his project, then update the A and CNAME records in your ahost DNS
   panel to the values Vercel shows.
3. Add the domain to Firebase → Authentication → Authorized domains.
4. Set `NEXT_PUBLIC_SITE_URL` in his Vercel project to `https://thedomain.uz` and redeploy.

If you have not bought it yet, let him buy it in his own account. That avoids the transfer entirely.

---

## 6. What to send Abror

- The repository link.
- His Firebase login email and temporary password, sent privately.
- [STUDENT-GUIDE.md](STUDENT-GUIDE.md) — plain-English instructions for logging in, adding his first
  project, adding a certificate later, and changing his photo and CV. This is the only document he
  needs to use the site.
- A note that the site currently contains **demo data for a fictional analyst**. When he is ready,
  he goes to Admin → Settings → Danger zone → **Clear all data** and starts adding his own. The
  sections stay hidden until he publishes his first item in each.

For working on the code itself, point him at [README.md](README.md),
[DATA-MODEL.md](DATA-MODEL.md), [DECISIONS.md](DECISIONS.md) and [CHECKLIST.md](CHECKLIST.md).

---

## Changing the admin email

The admin list appears in four places and all four must agree:

| File | What to change |
| --- | --- |
| `firestore.rules` | the `adminEmails()` list |
| `storage.rules` | the list inside `isAdmin()` |
| `.env.local` | `NEXT_PUBLIC_ADMIN_EMAILS` (local machine only, never committed) |
| Vercel | the `NEXT_PUBLIC_ADMIN_EMAILS` environment variable, then redeploy |

Emails must be lowercase and comma-separated. After editing the two rules files, deploy them:

```bash
npm run deploy:rules
```

Right now both addresses are listed, so you and Abror can both administer the site during the
handover. Remove yours once he is set up.

---

## Quick order of operations

1. Confirm the correct email address.
2. Make the repo a template, tell Abror to create his copy.
3. Add him as Firebase Owner, create his Auth user, send the password privately.
4. He deploys to his own Vercel and adds the env vars.
5. Add his Vercel URL to Firebase authorized domains.
6. He logs in to `/admin` and confirms he can edit.
7. Move the domain, if there is one.
8. Only then: remove your email from the admin lists, redeploy rules, delete your Firebase user,
   remove yourself from the Firebase project, delete your Vercel project.
