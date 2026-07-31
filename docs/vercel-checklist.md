# Vercel deployment verification checklist

Use this after the first production deploy.

## Environment

- [ ] `MONGODB_URI` set (Atlas `mongodb+srv://…`)
- [ ] `MONGODB_DB_NAME` set
- [ ] `NEXTAUTH_URL` matches production URL (https://…)
- [ ] `NEXTAUTH_SECRET` / `AUTH_SECRET` set to a long random value
- [ ] `ADMIN_USERNAME` set
- [ ] `ADMIN_PASSWORD_HASH` set (not plain password)
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` set (Live Mode)
- [ ] `RAZORPAY_WEBHOOK_SECRET` set and matches the Dashboard webhook config

## MongoDB Atlas

- [ ] Cluster is running
- [ ] Database user can read/write
- [ ] Network Access allows Vercel egress (`0.0.0.0/0` or known ranges)
- [ ] First registration creates `registrations` + `counters`
- [ ] Indexes exist on `registration_id` (unique)

## Razorpay

- [ ] Webhook added in Dashboard: `<APP_URL>/api/webhooks/razorpay`, event `payment_link.paid`
- [ ] A real registration creates a live `payment_links` entry with correct amount/reference_id
- [ ] Paying the link flips the registration to `approved` within seconds (webhook)
- [ ] Bad/missing webhook signature is rejected with 400 (check function logs)

## Public flow

- [ ] Landing page loads with event date/venue
- [ ] Pricing cards show ₹1000 per person
- [ ] Form validation works (phone, email, chapter, consent)
- [ ] Live amount updates when member count changes
- [ ] Successful submit redirects to `/register/success/BNI-AFL-####`
- [ ] Confirmation page shows registration details + amount
- [ ] "Pay now via UPI" opens the Razorpay-hosted payment page
- [ ] "I've paid — refresh status" reconciles status if the webhook is delayed

## Admin flow

- [ ] `/admin` redirects unauthenticated users to `/admin/login`
- [ ] Login works with production credentials
- [ ] Dashboard metrics match known sample/real data
- [ ] Registrations table search/filter works
- [ ] Detail page can approve/reject (manual override)
- [ ] Payment Link column opens the Razorpay link
- [ ] CSV export downloads and includes required columns
- [ ] Logout works

## Resilience

- [ ] Redeploy does **not** wipe registrations
- [ ] No reliance on local JSON / SQLite / writable disk
- [ ] Large invalid files are rejected with a clear error
- [ ] Mobile sticky CTA and form remain usable on phone width

## Content polish

- [ ] Update WhatsApp contacts
- [ ] Confirm chapter list for the event
