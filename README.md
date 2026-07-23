# Plaza Management ERP

A real, deployable web app for construction record management — Daily Entry,
Materials, Suppliers, Customers, Shops, Apartments, Sales, Installments,
Reports, and Settings — backed by your Supabase (Postgres) database.

## 1. What's inside
- `app/` — the Next.js pages (App Router)
- `components/ERP.jsx` — the entire application UI
- `lib/db.js` — every database read/write goes through here
- `lib/supabaseClient.js` — connects to your Supabase project

## 2. Set your Supabase keys
Copy `.env.local.example` to `.env.local` and make sure it has your project's
URL and **anon** key (already filled in with your values — double check them
in Supabase → Settings → API if you ever rotate keys).

## 3. Run it locally (optional, to test before deploying)
You'll need Node.js installed (version 18 or newer) — https://nodejs.org

```bash
npm install
npm run dev
```
Open http://localhost:3000 in your browser.

## 4. Deploy it for real (so you get a live website URL)
See DEPLOY.md for the full step-by-step guide using GitHub + Vercel (free).
