# Studio Terra Verde Preview Site

Static Slovak review site for Studio Terra Verde.

The visible page copy is generated from the Markdown files in `content/`.

## Pages

- `index.html` - Domov
- `projekcia.html` - Projekcia
- `realizacia-a-udrzba.html` - Realizácia a údržba
- `interierova-zelen.html` - Interiérová zeleň
- `velkoformatove-kvetinace.html` - Veľkoformátové kvetináče
- `referencie.html` - Referencie
- `kontakt.html` - Kontakt

## Local Preview

Open `index.html` directly in a browser.

If a local server is preferred:

```powershell
python -m http.server 4173
```

Then visit:

```text
http://127.0.0.1:4173/
```

## Deploy

This is a static site. Deploy the repository root to any static host such as Netlify, Vercel, Cloudflare Pages, GitHub Pages, or ordinary web hosting.

Required files:

- `*.html`
- `styles.css`
- `script.js`
- `assets/`
- `sources/terra-verde-logo-dark.jpeg`

## Regenerate Pages

After editing Markdown in `content/`, regenerate the HTML pages:

```powershell
node build-pages.mjs
```
