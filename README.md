# The Ledger

A personal expense tracker and invoice generator. Log your spending, mark billable items, and share a live invoice statement link with parents — no account needed on their end.

---

## Features

- **Expense tracking** — Log transactions with categories, dates, amounts, and notes
- **Invoice management** — Mark transactions as billable and group them into invoices
- **Parental share links** — Generate multiple shareable links so parents can view outstanding invoices without logging in
- **Analytics** — Spending trends, category breakdowns, and status overviews
- **Responsive** — Full desktop sidebar layout with a mobile bottom-nav fallback

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon (serverless PostgreSQL) |
| ORM | Drizzle ORM |
| Auth | Auth.js v5 (Credentials + JWT) |
| Charts | Recharts |
| Animations | Framer Motion |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled) |
| `AUTH_SECRET` | Random secret for Auth.js JWT signing — generate with `npx auth secret` |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Set to `true` to run the app with local mock data (no DB required) |

> See [`NEON_SETUP.md`](./NEON_SETUP.md) for step-by-step instructions on creating your Neon project and pushing the schema.

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Drizzle schema to Neon |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── analytics/
│   │   ├── invoices/
│   │   ├── add/
│   │   └── settings/
│   ├── (auth)/         # Public auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/auth/       # Auth.js API handler
│   └── view/[parental_key]/  # Public parental invoice view
├── backend/
│   ├── actions/        # Server actions (data, auth, transactions, parental-links)
│   └── lib/
│       ├── auth/       # Auth.js configuration
│       ├── db/         # Drizzle client + schema
│       ├── mock-data.ts
│       └── types/
└── frontend/
    └── components/     # Reusable UI components
```

---

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com) with zero additional configuration — Next.js build settings are detected automatically.

Set the three environment variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_USE_MOCK_DATA`) in your Vercel project settings under **Settings → Environment Variables**.

---

## Mock Mode

Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` to run the app entirely on local mock data. No database or Auth.js session is required. Useful for UI development and demos.
