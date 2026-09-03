# Ali Vaheb — Personal Site

> Minimal dark-neon portfolio with cinema/space/terminal theme.  
> Built with vanilla HTML, CSS, JS — no framework, no build step (except a small build script).

## Project Structure

```
├── index.html              # Homepage (single‑page)
├── works.html              # Project archive (all projects)
├── frames.html             # Blog archive (all posts, filterable by tag)
│
├── css/
│   └── style.css           # All styles (dark theme, responsive)
│
├── js/
│   └── main.js             # All scripts (i18n, animations, data loading)
│
├── content/
│   ├── blog/               # 1 JSON file per blog post
│   │   ├── a-frame-from-a-film.json
│   │   ├── a-simple-thought.json
│   │   ├── a-sound-that-got-me.json
│   │   └── untitled-poem.json
│   └── projects/           # 1 JSON file per project
│       ├── LiveGrab.json
│       ├── LinkSkip.json
│       ├── PersonalSite.json
│       ├── Planify.json
│       └── PyAcademy.json
│
├── data/                   # Auto‑generated (do not edit manually)
│   ├── blog.json           # Aggregated from content/blog/*
│   └── projects.json       # Aggregated from content/projects/*
│
├── build.js                # Scans content/* → writes data/*.json
│
├── admin/
│   ├── index.html          # CMS entry point (Sveltia CMS)
│   ├── config.yml          # CMS configuration (collections, backend)
│
├── functions/
│   └── api/
│       ├── auth.js         # OAuth start (GitHub)
│       └── auth/
│           └── callback.js # OAuth callback (exchange code for token)
│
├── assets/
│   ├── logo.svg            # Site "8" logo
│   ├── letterboxd.png      # Letterboxd icon
│   └── uploads/            # Media uploaded via CMS goes here
│
├── demo-personal/          # Astro‑built demo (ignore)
├── academy/                # Python course pages (ignore)
├── planner/                # Weekly planner page (ignore)
│
└── robots.txt / sitemap.xml
```

## How to Edit Content

### Via CMS (recommended)
1. Go to `https://ali8muse.dpdns.org/admin/`
2. Login with GitHub
3. Edit blog posts or projects in the dashboard
4. Click **Save** → commits to GitHub → auto‑deploys via Cloudflare Pages

### Manually (without CMS)
1. Edit the JSON files in `content/blog/` or `content/projects/`
2. Run `node build.js` to regenerate `data/*.json`
3. Commit and push:
   ```powershell
   git add -A
   git commit -m "your message"
   git push origin main
   ```

## How to Deploy

The site is deployed on **Cloudflare Pages** (connected to GitHub).  
Pushing to `main` triggers an automatic build:

1. Cloudflare runs `node build.js`
2. Serves files from the root directory `/`
3. Custom domain: `ali8muse.dpdns.org`

> **Note:** Cloudflare Pages Build command must be set to `node build.js` with output directory `/`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JS |
| CMS | Sveltia CMS (Git‑based) |
| OAuth | Cloudflare Pages Functions |
| Hosting | Cloudflare Pages |
| Email | Web3Forms (contact form) |

## Key Conventions

- **Bilingual:** All user‑facing text has `fa` (Persian) and `en` (English) variants
- **Blog tags:** 4 categories — `frame` (یک نما), `page` (یک برگ), `word` (یک واژه), `sound` (یک آوا)
- **Language toggle:** EN/FA button in the nav — uses `localStorage` for persistence
- **Theme toggle:** Light/Dark modes — follows system preference by default