# Austine checking in 💌

A small scrapbook-style website with three pages:

| Page | Link | What it is |
|---|---|---|
| **Check-in** | `…/#/checkin` (also the plain link) | The personal check-in for Brenda. It's off the menu by default, so only people with the link find it. |
| **Friends** | `…/#/friends` | The same five steps with friend wording and its own "lab notebook" look. |
| **Announcements** | `…/#/announcements` | A dark neon notice board for news, events (with live countdowns) and fun posts. |

The check-in and friends pages go one step at a time: hello → check-in → tomorrow → extras → game. Each has a progress bar and next/back buttons, and the browser back button works. Switching pages opens a portal. Original Rick & Morty-style doodles (portal, saucer, portal gun, a blue helper and a hidden pickle) are drawn as SVG in `src/components/RickMorty.jsx`. All animation switches off for visitors who ask their device for reduced motion.

React + Vite, plain CSS, fonts bundled locally. There's an optional free live backend (Supabase) for posting and editing without redeploying.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm test           # clicks through every page + the admin panel in headless Chrome
```

(Tests need a one-time `npx playwright install chromium-headless-shell`. The tests build their own copies: one with the backend off, one wired to a fake Supabase. They never touch your real project.)

## The admin panel

Open the site with `#admin` on the end, e.g. `https://you.github.io/friend-swebpage/#admin`, and log in. An admin bar then appears with:

- **pages & words:** turn each page on or off, choose whether it shows in the menu, rename the menu labels, pick which page the plain link opens, copy each page's link, and edit every line of text on the check-in and friends pages and the announcements header.
- **announcements:** write, edit, pin, reorder, schedule (event countdown), auto-expire and delete posts. Each post has a type (important / event / fun / info), an optional cover photo and an optional link. "Edit" buttons also appear on the cards themselves.
- **publish:** make your changes live (see below), set the current look as a page's default, download a backup.

`{name}` in any text becomes the recipient's name.

## Live backend (Supabase): publish instantly, no redeploy

Without it, the site works exactly as before. You edit in the browser, download `site-config.json`, commit it, and GitHub redeploys (about a minute). With it, the admin logs in by email and everything is live straight away.

**One-time setup (about 5 minutes, free):**

1. Go to [supabase.com](https://supabase.com) and create a free account, then **New project**. Any name and region; save the database password somewhere.
2. In the project: **SQL Editor → New query**. Paste all of [`supabase/schema.sql`](supabase/schema.sql). **First change `you@example.com` on the last lines to your own email.** Then press **Run**.
3. **Authentication → Sign In / Providers:** turn **off** "Allow new users to sign up" (only you should have an account).
4. **Authentication → Users → Add user → Create new user** with the same email (tick **Auto Confirm User**; the password is never used).
5. **Authentication → URL Configuration:** set **Site URL** to your site, e.g. `https://austinedearan-stack.github.io/friend-swebpage/`, and add the same address under **Redirect URLs**.
6. Put two values into `src/config/backend.json`:
   - **supabaseUrl:** the project address, `https://<project-id>.supabase.co` (Project Settings → Data API, or the **Connect** button). Use the address, not a key.
   - **supabaseAnonKey:** the public key (Project Settings → API Keys). Either the `sb_publishable_…` key or the legacy `anon` key works.
   ```json
   { "supabaseUrl": "https://abcd1234.supabase.co", "supabaseAnonKey": "sb_publishable_..." }
   ```
   Both values are meant to be public. The database rules in `schema.sql` decide who can change anything.
7. Commit and push. Once deployed, open `…/#admin`, enter your email, and tap the link in the email. You're in.
8. In **★ publish**, press **publish now** once. That copies the current words into the database (until then, visitors get the words bundled in `site-config.json`).

**How it behaves:**

- **Visitors only ever read.** Only emails listed in the database's `admins` table can write. To add another admin, run `insert into public.admins (email) values ('them@example.com');` in the SQL editor and invite them under Authentication → Users.
- **Words and page settings** go live when you press **publish now**. Visitors get them the next time they open the site.
- **Announcements** go live the moment you save them. The board also refreshes itself every minute while it's open.
- **If Supabase is unreachable**, visitors see the last copy they loaded, or the bundled `site-config.json` on a first visit. Nothing breaks.
- **Free-tier note:** Supabase pauses free projects after about a week with no activity. If that happens, open the project in the Supabase dashboard and click Restore. The site keeps working from its fallback in the meantime.

## Who can change what

| Where | What it holds | Who can change it |
|---|---|---|
| Supabase (if connected) | live words, page settings, announcements | only admin emails |
| `site-config.json` | fallback words, page settings, starter announcements | only you, by redeploying |
| this browser (localStorage) | a visitor's own look per page, saved themes, the admin's unpublished draft | that visitor, on that device |
| share link (`#/page&theme=…`) | **only the look** (colours, fonts, layout) | anyone can make one |

A link can never change the words, the pages or the announcements.

"Off the menu" means hidden, not secret. On a public website, a determined person could still find the words. Don't put anything truly private on it.

## Photos

The announcement page uses five photos from `images/` (Pexels). `npm run optimize-images` crops and compresses them into `src/assets/photos/*.webp` (about 50 KB each). The full-size originals are git-ignored to keep the repo small. The two DeviantArt Rick & Morty images in `images/` aren't used: they carry the artists' watermark and signature, so the site uses original doodles instead.

## Deploy (GitHub Pages, free)

Already set up: every push to `main` builds and publishes via `.github/workflows/deploy.yml`. In the repo settings, **Pages → Source** must be **GitHub Actions**. No routing config is needed (hash links, relative asset paths).

## Phone test checklist

- [ ] Plain link opens the check-in; `#/friends` and `#/announcements` open their pages; no sideways scrolling
- [ ] Menu switches pages with the portal; the check-in tab isn't in the friends/announcements menu
- [ ] Steps: start, next/back, the step dots, and the phone's back button all work; answers survive going back
- [ ] All moods reply (the blue helper pops up); tomorrow answers react (portal gun zaps); extras and rock-paper-scissors work
- [ ] Easter eggs: title ×5, flip the polaroid, boop the heart, poke the pickle, ask for lots of compliments
- [ ] Announcements: filters, read more, countdowns, links open in a new tab
- [ ] "make it yours" changes only the current page; it's remembered after refresh
- [ ] `#admin` → login → edit a word → publish → shows on another phone
