# Neon DB Setup Guide

Follow these steps once to connect The Ledger to Neon and go live.

---

## Step 1 — Install the new packages

```bash
npm install
```

This installs `drizzle-orm`, `@neondatabase/serverless`, `next-auth`, `bcryptjs`, and removes the old Supabase packages.

---

## Step 2 — Create a Neon project

1. Go to [neon.tech](https://neon.tech) and sign up (free tier is plenty).
2. Click **New Project** → give it a name (e.g. `the-ledger`).
3. Choose a region close to you.
4. Once created, go to **Connection Details**.
5. Select **Pooled connection** from the dropdown.
6. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 3 — Set your environment variables

Open `.env.local` and fill in the two blank values:

```env
DATABASE_URL=postgresql://user:password@ep-xxxxx-pooler.region.aws.neon.tech/neondb?sslmode=require

AUTH_SECRET=<generate below>
```

**To generate AUTH_SECRET**, run this in your terminal:

```bash
npx auth secret
```

Copy the output and paste it as the value for `AUTH_SECRET`.

Also set mock mode to false when you're ready to use the real DB:

```env
NEXT_PUBLIC_USE_MOCK_DATA=false
```

---

## Step 4 — Push the schema to Neon

Drizzle will read `src/backend/lib/db/schema.ts` and create all the tables for you:

```bash
npm run db:push
```

This creates the following tables in your Neon database:
- `users` — accounts (email + hashed password + sharing toggle)
- `categories` — global and user-specific expense categories
- `invoices` — generated parent statements
- `transactions` — individual expenses
- `parental_links` — multiple shareable parent view links per user

---

## Step 5 — Seed the default categories

In the [Neon SQL Editor](https://console.neon.tech), run this to add the default categories:

```sql
INSERT INTO categories (user_id, name, color) VALUES
  (NULL, 'Fuel',          '#f59e0b'),
  (NULL, 'Groceries',     '#10b981'),
  (NULL, 'Fast Food',     '#ef4444'),
  (NULL, 'Transport',     '#3b82f6'),
  (NULL, 'Stationery',    '#8b5cf6'),
  (NULL, 'Clothing',      '#ec4899'),
  (NULL, 'Accommodation', '#14b8a6'),
  (NULL, 'Entertainment', '#f97316'),
  (NULL, 'Other',         '#6b7280');
```

`user_id = NULL` means global — visible to all users.

---

## Step 6 — Run the app

```bash
npm run dev
```

Go to `http://localhost:3000/signup` and create your first account. Everything is real now.

---

## Optional — Drizzle Studio (DB browser)

If you want a visual browser for your database:

```bash
npm run db:studio
```

Opens a local GUI at `https://local.drizzle.studio` where you can view, edit and query your Neon tables.

---

## Environment Variables Summary

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection Details → Pooled connection string |
| `AUTH_SECRET` | Run `npx auth secret` in your terminal |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Set to `false` for production, `true` for local mock dev |

---

## Architecture notes

| Old (Supabase) | New |
|---|---|
| `@supabase/ssr` + `@supabase/supabase-js` | `@neondatabase/serverless` + `drizzle-orm` |
| Supabase Auth (magic links, JWTs via Supabase) | Auth.js v5 with Credentials provider (email + password) |
| `supabase.from("table").select(...)` | `db.select().from(table).where(...)` |
| RLS policies | Auth checked in every server action via `auth()` |
| `get_parental_view` RPC | Direct Drizzle join in the server component |
| `profiles` table (separate) | Merged into `users` table |
| Single `parental_key` on profile | `parental_links` table (many per user) |
