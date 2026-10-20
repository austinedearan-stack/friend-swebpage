# What changed (20 Oct 2026)

## Folders
- `GitHub/friend-swebpage` was newer than `projects/funny website` (it had your Swahili text edits and the build-stamp fix). It's now the main copy, and the projects folder was mirrored from it, so they're identical.
- `images/` was copied into the repo. The originals are git-ignored (too big); the site uses compressed copies in `src/assets/photos/` (15–64 KB each).

## Three pages instead of one long scroll
- **Check-in** (`#/checkin`, plus the plain link): Brenda's page with all your words unchanged. It's off the menu, so friends don't see it.
- **Friends** (`#/friends`): same flow with the friend words and a new green "lab notebook" look.
- **Announcements** (`#/announcements`): new dark neon notice board styled on your photos. It has pinned posts, categories (important / event / fun / info), filters, live event countdowns, cover photos, links, auto-expiry and "read more".
- **Navigation:** a proper menu at the top, and switching pages plays a portal animation.
- **Steps:** check-in and friends go one step at a time (hello → check-in → tomorrow → extras → game). There's a progress bar and next/back buttons, the phone's back button works, and answers are kept.

## Rick & Morty touches (all drawn from scratch as SVG, scrapbook style)
- **Portal:** in the collage, in the page transition, in the loader and on the extras step.
- **Flying saucer:** in the collage, crossing the top of the screen now and then, and on the announcements page. It also flies past when you win a best-of-three match in rock-paper-scissors.
- **Blue helper:** pops up and waves after you pick a mood.
- **Portal gun:** zaps when you answer "tomorrow".
- **Hidden pickle:** an Easter egg in the collage. Asking for 6 compliments gets a "wubba lubba dub dub".
- **Not used:** the DeviantArt images. They have the artists' watermark and signature.

## Admin panel (`#admin`)
- **Pages & words:** turn pages on or off, show or hide them in the menu, rename menu labels, choose the home page, copy each page's link, and edit every text.
- **Posts:** write, edit, pin, reorder, schedule and delete announcements, with a live preview.
- **Publish:** publish live (with Supabase) or download `site-config.json` (without it), set a page's default look, and download a backup.

## Live backend (Supabase)
- Connected to the project `efybxzxoamwtjnrcryqx`. Its address and public key are in `src/config/backend.json`.
- Checked against the real project: the tables and the two starter posts exist, visitors can read but every write is refused, and the admin list is hidden from the public.
- Still to do (README → "Live backend"): switch off "Allow new users to sign up", add yourself under Authentication → Users, set the Site URL and Redirect URL, then log in and press **publish now** once.
- **Once connected:** you log in with an email magic link instead of the passphrase, announcements go live the moment you save them, and words go live when you press "publish now".
- **Until then:** the site works exactly as before, from `site-config.json`.

## Checked
- `npm run build` passes.
- `npm test` passes: 115 automated checks across both builds.
  - **Normal build:** every page, step, Easter egg, theme feature, the admin panel, phone and desktop widths, and reduced motion.
  - **Live build against a simulated Supabase:** live words and posts, offline fallback, magic-link login, a non-admin login being refused, and publishing.
- The login and publishing steps were tested against a simulated Supabase. They'll be confirmed for real the first time you log in.

## Your next steps
1. Look it over: `npm run dev`, then open the three links.
2. Push from `GitHub/friend-swebpage`. I committed locally but did not push.
3. Finish the Supabase steps listed above.
4. Brenda's current link still opens her check-in. If you'd rather the plain link open Friends, change "home page" in the admin panel.
