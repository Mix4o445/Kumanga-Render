# Deploying to Render (free)

This app runs as a Next.js web service backed by **Render Postgres** (free) for
data and **ImageKit** for images. Render's filesystem is ephemeral, so all
persistent data lives in Postgres — nothing important is written to disk.

## 1. Push the repo to GitHub
Render deploys from a Git repo. Commit everything and push to a GitHub repo.

> Make sure `.env` is gitignored (it already is) — never commit your secrets.

## 2. Create the services via the Blueprint
1. In the Render dashboard: **New → Blueprint**.
2. Select your repo. Render reads `render.yaml` and proposes:
   - a free Postgres database (`manga-db`)
   - a free web service (`manga-platform`)
3. Before/after applying, set the ImageKit secrets on the web service
   (they're marked `sync: false`, so Render asks for them):
   - `IMAGEKIT_PRIVATE_KEY`
   - `IMAGEKIT_PUBLIC_KEY`
   - `IMAGEKIT_URL_ENDPOINT`  (e.g. `https://ik.imagekit.io/your_id`)
4. `DATABASE_URL` and `SESSION_SECRET` are wired automatically by the blueprint.

Click **Apply**. The first build runs `npm install && npm run build` and starts
with `npm run start -- -p $PORT`.

## 3. Import your existing data (one time)
Your current local data lives in `data/*.json`. Load it into the new Postgres DB.

Easiest: from the Render database page, copy the **External Database URL**, then
run locally (from the project root):

```bash
DATABASE_URL="<external-url-from-render>" DATABASE_SSL=true \
  node scripts/import-json-to-pg.cjs
```

You should see a count for each collection (manga, users, forum, …). The app
will now read/write that data from Postgres. Re-running is safe (it upserts).

> If you're starting fresh and don't need the local data, skip this step — the
> tables are created automatically on first use.

## 4. Verify
Open the service URL. Sign in / sign up, upload a manga, add a chapter, and
confirm images load from `ik.imagekit.io`. Trigger a redeploy and confirm your
data is still there (this is what Postgres fixes vs. the old file store).

## Notes / limits
- **Render free Postgres expires** after the trial window; for anything
  long-lived, move to a paid plan or an external free Postgres (e.g. Neon,
  Supabase). To use an external DB, set `DATABASE_URL` to its connection string
  and `DATABASE_SSL=true`.
- **Free web services sleep** after inactivity and cold-start on the next
  request — fine for a hobby site.
- Local dev needs no database: with `DATABASE_URL` unset, the app uses the
  `data/*.json` files automatically.
