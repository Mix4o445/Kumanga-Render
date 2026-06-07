# Deploying to Vercel

This Next.js app stores all data in **Postgres** and images in **ImageKit**.
Vercel's filesystem is read-only at runtime, so the local `data/*.json` fallback
will NOT work in production — you must supply a `DATABASE_URL`.

## 1. Push the repo to GitHub
Commit everything and push. Make sure `.env` stays gitignored (it already is).

## 2. Provision a Postgres database
Vercel does not bundle one with the repo (unlike Render's blueprint). Pick any:

- **Vercel Postgres** — Project → Storage → Create → Postgres. It auto-injects
  `POSTGRES_*` env vars; copy its `POSTGRES_URL` into `DATABASE_URL` below.
- **Neon** (https://neon.tech) — free tier. Use the **pooled** connection string
  (host contains `-pooler`).
- **Supabase** — use the **Transaction pooler** string (port `6543`).

> Use a *pooled* connection string. Vercel runs serverless functions and a
> direct (unpooled) Postgres connection can exhaust the DB's connection limit.

## 3. Import the project on Vercel
1. https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework preset is detected as **Next.js** automatically.
3. Add Environment Variables (Production + Preview):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your pooled Postgres connection string |
   | `DATABASE_SSL` | `true` (external DBs require SSL) |
   | `SESSION_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
   | `IMAGEKIT_PRIVATE_KEY` | from ImageKit dashboard |
   | `IMAGEKIT_PUBLIC_KEY` | from ImageKit dashboard |
   | `IMAGEKIT_URL_ENDPOINT` | e.g. `https://ik.imagekit.io/your_id` |
   | `IMAGEKIT_FOLDER` | `manga-site` (optional) |
   | `RESEND_API_KEY` | from Resend dashboard (for password-reset emails) |
   | `EMAIL_FROM` | verified sender, e.g. `Kumanga <noreply@yourdomain.com>` |
   | `APP_URL` | your canonical URL, e.g. `https://your-domain.com` (for email links) |

4. Click **Deploy**.

## 4. Import existing data (one time)
Load your local `data/*.json` into the new Postgres DB. Run locally:

```bash
DATABASE_URL="<your-postgres-url>" DATABASE_SSL=true \
  node scripts/import-json-to-pg.cjs
```

Re-running is safe (it upserts). Skip this if starting fresh — tables are
created automatically on first use.

## 5. Verify
Open the deployment URL. Sign up, upload a manga + chapter, confirm images load
from `ik.imagekit.io`. Redeploy and confirm data persists (that's what Postgres
guarantees vs. the old file store).

## Notes
- `SESSION_SECRET` is **required** here. Without it, the auth secret would be
  regenerated per serverless cold start and log everyone out.
- Local dev is unchanged: with `DATABASE_URL` unset, the app uses `data/*.json`.
