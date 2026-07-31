# Admin credentials setup example

## Local development (quick)

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=LocalDevOnly!234
NEXTAUTH_SECRET=dev-secret-change-me-please-32chars
NEXTAUTH_URL=http://localhost:3000
```

## Production (recommended)

1. Choose a strong password.
2. Hash it:

```bash
npm run hash-password -- "YourStrongPasswordHere!"
```

3. Set on Vercel:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2a$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXTAUTH_SECRET=<openssl rand -base64 32>
AUTH_SECRET=<same as NEXTAUTH_SECRET>
NEXTAUTH_URL=https://your-domain.vercel.app
```

4. Do **not** set `ADMIN_PASSWORD` in production when a hash is available.
