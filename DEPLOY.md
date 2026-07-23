# Deploying Plaza Management ERP — Step by Step

This gets you a real, permanent website URL (like `plaza-erp.vercel.app`)
that you and your team can open from any phone, tablet, or computer.

We'll use **GitHub** (to store the code) + **Vercel** (to host it, free).
Total time: about 15–20 minutes, and no coding required.

---

## Step 1 — Create a GitHub account (skip if you have one)
1. Go to https://github.com and sign up (free).

## Step 2 — Create a new repository
1. Click the **+** icon (top right) → **New repository**.
2. Name it `plaza-management-erp`.
3. Keep it **Private** (recommended, since this holds business data).
4. Click **Create repository**.

## Step 3 — Upload the project files
1. On the new repository page, click **uploading an existing file**.
2. Unzip the `plaza-erp.zip` file I gave you on your computer.
3. Drag ALL the files and folders (package.json, app/, components/, lib/,
   etc.) into the GitHub upload box.
   - **Important:** Do NOT upload a `.env.local` file if you create one —
     it contains your keys and should never go on GitHub. The `.gitignore`
     file already prevents this if you use Git directly; if uploading via
     the website, just don't drag that file in.
4. Scroll down, click **Commit changes**.

## Step 4 — Create a Vercel account
1. Go to https://vercel.com/signup
2. Choose **Continue with GitHub** and authorize it.

## Step 5 — Import your project into Vercel
1. On the Vercel dashboard, click **Add New… → Project**.
2. Find `plaza-management-erp` in the list and click **Import**.
3. Vercel will detect it's a Next.js app automatically.

## Step 6 — Add your Supabase keys (Environment Variables)
Before clicking Deploy, expand **Environment Variables** and add these two:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xkakvzopvgtwlgyauyke.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key from Supabase → Settings → API) |

## Step 7 — Deploy
1. Click **Deploy**.
2. Wait ~1 minute. Vercel will give you a live URL like
   `https://plaza-management-erp.vercel.app`.
3. Open it — this is your real, working ERP, backed by your Supabase
   database, accessible from anywhere.

---

## After deployment
- Any changes I help you make later, you re-upload to GitHub (or I can
  guide you to connect Git properly for one-click updates), and Vercel
  redeploys automatically.
- **Custom domain (optional):** In Vercel → Project → Settings → Domains,
  you can point a domain you own (e.g. `erp.yourplaza.com`) to this app.
- **Backups:** Supabase automatically backs up your database. For extra
  safety on a business-critical system, check Supabase → Settings →
  Database → Backups, and consider upgrading from the Free plan if you're
  storing years of real financial records — the free tier has lower
  backup retention and can pause inactive projects.
- **Security note:** Right now, anyone with your app's URL can read/write
  data (there's no login). Once you're comfortable with the app, tell me
  and I'll add real user login (Supabase Auth) so only your team can
  access it.
