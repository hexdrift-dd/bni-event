# BNI Event Registration

Production-ready Next.js (App Router) registration site for a BNI event, designed for **Vercel** with **MongoDB Atlas** (documents + GridFS for payment proofs). No local JSON/SQLite filesystem persistence.

## Features

- Public event landing page + registration form
- Live contribution calculator
- Confirmation page with a per-registration Razorpay UPI Payment Link
- Automatic payment confirmation via Razorpay webhook (signature-verified)
- Admin login, dashboard metrics, registrations table, detail view
- CSV export
- Durable cloud storage for registrations (MongoDB)

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- React Hook Form + Zod
- MongoDB (official driver) + GridFS
- Auth.js / NextAuth credentials for admin
- Server CSV helper (`src/lib/csv.ts`)

## Architecture

```
Browser → Server Actions / Route Handlers → MongoDB Atlas
  - registrations collection
  - counters (registration IDs)
  - GridFS payment_proofs bucket
Admin → NextAuth session → protected /admin + file/CSV APIs
```

All writes go to MongoDB. The app never depends on writable local disk on Vercel.

## Folder structure

```
src/app/                 # Pages, server actions, API routes
src/components/          # UI, form, admin components
src/lib/                 # pricing, csv, auth, mongodb, validators, constants
src/types/               # Shared types
docs/mongodb-setup.md    # Atlas + GridFS setup
scripts/                 # Hash password, pricing tests, seed, sample CSV
public/                  # Static assets (QR placeholder)
```

## 1) MongoDB setup

See [docs/mongodb-setup.md](docs/mongodb-setup.md).

Quick start:

1. Create an Atlas cluster and database user.
2. Allow network access for local + Vercel.
3. Set `MONGODB_URI` and `MONGODB_DB_NAME`.
4. Optional seed: `node --env-file=.env.local scripts/seed-mongodb.mjs`

## 2) Admin auth setup

1. Generate secrets:

```bash
openssl rand -base64 32
```

Set both `NEXTAUTH_SECRET` and `AUTH_SECRET` to that value (or either one).

2. Hash an admin password:

```bash
npm run hash-password -- "your-strong-password"
```

3. Set:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<paste hash>
```

For local development only, `ADMIN_PASSWORD` plain-text fallback is supported if hash is empty. Prefer hash in production.

## 3) Razorpay setup (UPI Payment Links)

Each registration gets its own Razorpay UPI Payment Link, pre-filled with the
calculated amount and the registrant's details.

1. Create Razorpay **Live Mode** API keys at
   [dashboard.razorpay.com/app/keys](https://dashboard.razorpay.com/app/keys).
   UPI Payment Links only work in Live Mode, not Test Mode.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. In the Razorpay Dashboard, go to **Settings > Webhooks** and add a webhook:
   - URL: `<NEXT_PUBLIC_APP_URL>/api/webhooks/razorpay`
   - Active events: `payment_link.paid`
   - Copy the generated secret into `RAZORPAY_WEBHOOK_SECRET`.
4. On successful payment, the webhook automatically marks the registration
   as `approved` (signature + amount are verified server-side). Admins can
   still override the status manually from `/admin/registrations/[id]`.

## 4) Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### Useful scripts

```bash
npm run test:pricing
npm run hash-password -- "password"
npm run seed
npx tsx scripts/sample-csv-export.ts
```

## 5) Event configuration

Edit `src/lib/constants.ts` for:

- Event name / date / venue / region
- Chapters, categories
- Pricing rules
- Payment note / contact details
- WhatsApp contacts
- Registration ID prefix (`BNI-AFL`)

Pricing engine: `src/lib/pricing.ts`

- ₹1000 per person
- Total = members × ₹1000

## 6) Vercel deployment

1. Push repo to GitHub.
2. Import project in Vercel.
3. Add all env vars from `.env.example`.
4. Set `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to your production URL.
5. Ensure Atlas Network Access allows Vercel (often `0.0.0.0/0` for serverless).
6. Deploy.
7. Verify with `docs/vercel-checklist.md`.

### Required env vars on Vercel

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (or `AUTH_SECRET`)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 7) Pages

| Route | Purpose |
|------|---------|
| `/` | Landing + registration |
| `/register/success/[registrationId]` | Confirmation + Razorpay UPI payment link |
| `/admin/login` | Admin login |
| `/admin` | Dashboard metrics |
| `/admin/registrations` | Table + filters + CSV |
| `/admin/registrations/[id]` | Detail / approve / reject |

## 8) Security notes

- Admin routes protected by middleware + server `requireAdmin()`
- Payment proof downloads (legacy) require an admin session
- Payment files stored in MongoDB GridFS, not `/public`
- Razorpay webhook requests are verified via HMAC-SHA256 signature
  (`RAZORPAY_WEBHOOK_SECRET`) before any registration is marked approved
- Prefer `ADMIN_PASSWORD_HASH` over plain `ADMIN_PASSWORD`

## 9) Sample credentials example

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=LocalDevOnly!234
# After hashing:
# ADMIN_PASSWORD_HASH=$2a$12$...
```

Generate hash with `npm run hash-password -- "LocalDevOnly!234"`.

## License

Private event registration template — customize for your chapter.
