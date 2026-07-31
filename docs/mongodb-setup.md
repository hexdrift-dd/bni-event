# MongoDB setup

## 1) Create a cluster

1. Create a project/cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (recommended for Vercel).
2. Add a database user with read/write access.
3. Network Access → allow your IP for local dev, and `0.0.0.0/0` (or Vercel IPs) for production.
4. Connect → Drivers → copy the `mongodb+srv://...` URI.

## 2) Environment variables

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=bni_event
```

## 3) Collections (auto-created)

The app creates these on first use:

| Collection | Purpose |
|---|---|
| `registrations` | Event registration records |
| `counters` | Atomic registration ID sequence (`BNI-AFL-0001`, …) |
| `registration_audit_logs` | Status/action history |
| `payment_proofs.files` / `payment_proofs.chunks` | GridFS payment screenshots |

Indexes are ensured automatically for `registration_id` (unique), `created_at`, `payment_status`, `chapter`, and `phone`.

## 4) Seed sample data (optional)

```bash
node --env-file=.env.local scripts/seed-mongodb.mjs
```

## 5) Payment proofs

Uploads go to **MongoDB GridFS** (`payment_proofs` bucket).  
Admin download URL: `/api/files/payment-proof/[fileId]` (admin session required).

No local disk writes are used — safe for Vercel serverless.
