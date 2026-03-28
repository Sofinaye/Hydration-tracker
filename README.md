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

### One-time setup on GitHub

1. Push this repository to GitHub (if you have not already).
2. Open your repo on **github.com** (in a browser).
3. Go to **Settings** (repo settings, not your profile) → **Pages** (left sidebar).
4. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).  
   If you leave “Deploy from a branch”, GitHub may show a generic or README-style page instead of this app.
5. Go to the **Actions** tab (top bar of the repo, next to **Pull requests**).
6. In the left sidebar, click **Deploy to GitHub Pages**.
7. Open the latest workflow run: it should finish with a **green** checkmark. If it is red, open the failed job and read the error log.

After a successful run, **Settings → Pages** shows **Your site is live at …** — use that URL (it matches your username and repo name).

### Site URL

`https://<your-username>.github.io/<repository-name>/`

The build sets `BASE_PATH` to `/<repository-name>/` so JS/CSS paths work on a project site.

### “I only see an instruction page” or the README

Usually one of these:

- **Pages source is wrong** — In **Settings → Pages**, source must be **GitHub Actions**, not a branch. Change it, then run the workflow again (**Actions** → **Deploy to GitHub Pages** → **Run workflow** if needed).
- **Workflow never succeeded** — Fix errors under **Actions**; the site only updates after a green run.
- **Wrong URL** — Use the link from **Settings → Pages**, or open `https://<user>.github.io/<exact-repo-name>/` (repo name must match your GitHub repo name).

### Note on `<username>.github.io` repos

If the repository is named `<username>.github.io` (user site at the domain root), change the workflow env `BASE_PATH` to `/` or adjust `vite.config.ts` accordingly.