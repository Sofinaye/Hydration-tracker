# Hydration-tracker

## Run locally

```bash
cd web
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). To open from another device on the same network:

```bash
npm run dev -- --host
```

## Deploy to GitHub Pages

This repo includes a workflow (`.github/workflows/deploy-github-pages.yml`) that builds `web/` and publishes `web/dist` to GitHub Pages.

1. Push this repository to GitHub (if you have not already).
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the workflow manually under **Actions**).

Your site will be available at:

`https://<your-username>.github.io/<repository-name>/`

The build sets `BASE_PATH` to `/<repository-name>/` so asset URLs match GitHub’s project-site path.

**Note:** If the repository is named `<username>.github.io` (user site at the domain root), change the workflow env `BASE_PATH` to `/` or adjust `vite.config.ts` accordingly.