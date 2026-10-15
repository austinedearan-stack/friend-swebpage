# Austine checking in 💌

A tiny, playful check-in website: greeting → mood check-in → "ready for tomorrow?" → little extras → rock-paper-scissors, plus Easter eggs and a full theme studio ("make it yours").

React + Vite, plain CSS variables, no backend, no tracking, no accounts. Fonts are bundled locally.

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
ADMIN_PASS="your passphrase" npm test   # after a build: clicks through every feature in headless Chrome
```

(Tests need a one-time `npx playwright install chromium-headless-shell`.)

## Personalising it

All words, the live mode and the default look live in **one file: `src/config/site-config.json`**. You can edit it by hand, or use the in-browser editor:

1. Open the site with `#admin` on the end, e.g. `https://you.github.io/checkin/#admin`.
2. Enter your passphrase (only its SHA-256 hash is stored in the repo). To change it, use the studio's ★ publish tab, or run `npm run hash -- "new passphrase"` and paste the result into `admin.passphraseHash`.
3. In the studio, the **✎ words** tab edits every line of text for both modes. The admin bar at the top switches the **live mode** (personal ↔ friend).
4. Edits preview instantly, but **only in your browser**. To make them live: ★ publish → *download site-config.json* → replace `src/config/site-config.json` in the repo (on GitHub: open the file → pencil icon → paste, or "Add file → Upload files"). The site redeploys itself in about 1 minute, and the link stays the same.

Other bits: `{name}` in any text becomes the recipient's name. Theme presets live in `src/config/themes.js`.

### Who can change what

| Where | What it holds | Who can change it |
|---|---|---|
| `site-config.json` (published) | all words, live mode, default look | only you, by redeploying |
| this browser (localStorage) | a visitor's own look, saved themes, your admin draft | that visitor, on that device |
| share link (`#theme=…`) | **only the look** (colours, fonts, layout) | anyone can make one |

A link can never change the words or the mode. Mode/content URL parameters are ignored entirely, and visitor mode-switching is off unless you turn on `visitorCanSwitchMode`.

The `#admin` passphrase only keeps the editor out of sight. It isn't real security (it's a static site), and it doesn't need to be: anything done in someone's browser stays in that browser. Don't put anything truly private in `site-config.json`. The repo and the deployed JS are public, so anyone determined could read the text.

## Deploy (GitHub Pages, free)

1. Create a new repository on github.com (e.g. `checkin`). Private repos need a paid plan for Pages, so use public.
2. In this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "first check-in"
   git remote add origin https://github.com/<you>/checkin.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Watch the **Actions** tab. When it's green, the site is at `https://<you>.github.io/checkin/`.

No routing config is needed (single page, relative asset paths). Cloudflare Pages / Netlify also work: build command `npm run build`, output folder `dist`.

### Updating later

Edit (or upload a new) `src/config/site-config.json` or any file, commit to `main`, and it redeploys automatically.

## Phone test checklist

- [ ] Link opens fast on mobile data; no sideways scrolling
- [ ] Greeting, start button and "skip to tomorrow" work
- [ ] All 4 moods give a reply; "change my answer" works
- [ ] Every tomorrow answer reacts; the closing note appears
- [ ] Extras buttons and rock-paper-scissors (incl. best of three) work
- [ ] Tap the title 5×, flip the polaroid, boop the heart sticker
- [ ] "make it yours" opens as a bottom sheet; presets change the page; it's remembered after refresh
- [ ] Share link opens the same look on another phone
- [ ] `#admin` asks for the passphrase (then lock it again)
