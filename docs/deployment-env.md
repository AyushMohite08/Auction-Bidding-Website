# Deployment Environment Guide

This project uses HttpOnly cookies for auth, so frontend/backend domain setup affects cookie settings.

## Local Development

Use this when the frontend runs on Vite and the backend runs locally.

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

Backend `.env`:

```env
JWT_ACCESS_SECRET=use_a_long_random_access_secret
JWT_REFRESH_SECRET=use_a_different_long_random_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000
API_PAUSED=false
API_PAUSED_MESSAGE=Service temporarily unavailable. Please try again later.
MAX_AUCTION_IMAGE_SIZE_MB=5
IMAGEKIT_PRIVATE_KEY=private_your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=public_your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_UPLOAD_FOLDER=/auction-items
RATE_LIMIT_GENERAL_MAX=600
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_REGISTER_MAX=5
RATE_LIMIT_BID_MAX=30
RATE_LIMIT_AUCTION_CREATE_MAX=10
VENDOR_MONTHLY_AUCTION_LIMIT=20
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## JWT Secrets

The backend signs two different JWTs:

- `JWT_ACCESS_SECRET`: signs the short-lived access token used by normal API requests.
- `JWT_REFRESH_SECRET`: signs the longer-lived refresh token used to restore a session.
- `JWT_ACCESS_EXPIRES_IN`: default `15m`; keep this short.
- `JWT_REFRESH_EXPIRES_IN`: default `7d`; this controls how long a browser session can be refreshed.

Use different long random values for access and refresh secrets. If one token type is ever exposed, separate secrets prevent that from automatically compromising the other token type.

Generate a strong secret in PowerShell:

```powershell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

Or generate one with Node:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Run the command twice: once for `JWT_ACCESS_SECRET`, once for `JWT_REFRESH_SECRET`.

`JWT_SECRET` is supported only as a fallback for older env files. For deployment, prefer setting `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` explicitly.

## Rate Limits And Vendor Quota

These limits use in-memory counters. That is simple and fine for one backend instance. If you later run multiple backend instances, move rate-limit state to a shared store such as Redis or your hosting provider's KV service.

| Env value | Default | Window | Keyed by | Protects |
| --- | ---: | --- | --- | --- |
| `RATE_LIMIT_GENERAL_MAX` | `600` | 15 minutes | IP address | Broad API abuse and accidental loops |
| `RATE_LIMIT_AUTH_MAX` | `5` | 15 minutes | IP + role + email | Password guessing |
| `RATE_LIMIT_REGISTER_MAX` | `5` | 1 hour | IP address | Account spam |
| `RATE_LIMIT_BID_MAX` | `30` | 5 minutes | Logged-in user, fallback IP | Rapid bid spam |
| `RATE_LIMIT_AUCTION_CREATE_MAX` | `10` | 1 hour | Logged-in vendor, fallback IP | Expensive image-processing/upload attempts |
| `VENDOR_MONTHLY_AUCTION_LIMIT` | `20` | Database calendar month | Vendor user id | Free-tier usage and listing spam |

Notes:

- Successful logins are not counted by the failed-login limiter.
- Rejected, cancelled, pending, approved, active, sold, and expired auctions all count toward `VENDOR_MONTHLY_AUCTION_LIMIT`.
- Keep the defaults for a personal/free-tier deployment unless real users are being blocked.
- Increase `RATE_LIMIT_GENERAL_MAX` first if normal browsing feels constrained.
- Increase `RATE_LIMIT_BID_MAX` only if legitimate live auctions need faster repeat bids.
- Increase `VENDOR_MONTHLY_AUCTION_LIMIT` only after confirming your database and ImageKit free-tier usage can handle the extra listings.

## Same-Site Production

Use this when frontend and backend are under the same site, for example:

```text
https://example.com
https://example.com/api
```

or subdomains under the same parent site:

```text
https://example.com
https://api.example.com
```

Backend `.env`:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
FRONTEND_ORIGINS=https://example.com
```

If cookies must be shared across subdomains, add:

```env
AUTH_COOKIE_DOMAIN=.example.com
```

Frontend `.env`:

```env
VITE_API_URL=https://example.com/api
```

or:

```env
VITE_API_URL=https://api.example.com/api
```

## Cross-Site Production

Use this when frontend and backend are on different sites, for example frontend on Vercel and backend on another hosted domain.

Backend `.env`:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
FRONTEND_ORIGINS=https://your-frontend-domain.com
```

Usually omit `AUTH_COOKIE_DOMAIN` unless you own a shared parent domain.

Frontend `.env`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Important Rules

- `AUTH_COOKIE_SAME_SITE=none` requires `AUTH_COOKIE_SECURE=true`.
- Local HTTP development should use `AUTH_COOKIE_SECURE=false` and `AUTH_COOKIE_SAME_SITE=lax`.
- `FRONTEND_ORIGINS` must contain exact frontend origins, including protocol and port.
- Do not include URL paths in `FRONTEND_ORIGINS`.
- Auction images are uploaded server-side to ImageKit after Sharp converts them to WebP.
- Keep `IMAGEKIT_PRIVATE_KEY` only in backend environment variables.
- `MAX_AUCTION_IMAGE_SIZE_MB=5` protects free-tier image and compute usage.
- Do not use backend local filesystem storage for user-uploaded auction images.
- Rate limits use in-memory counters in this version, which is enough for one backend instance.
- `VENDOR_MONTHLY_AUCTION_LIMIT` blocks new vendor auction creation after the monthly limit is reached.
- Use `API_PAUSED=true` as a manual safety switch when a free-tier database or hosting limit is close. It returns `503` for API routes and prevents new socket/scheduler DB work.
- Database connection failures are returned as `503` instead of generic `500` responses where backend controllers can detect them.
- Keep JWT secrets long, random, and different in production.
- Keep `SOCKET_DEBUG=false` unless diagnosing realtime connection behavior.

## Deployment Checklist

- Set production env values for DB, JWT secrets, cookies, CORS, ImageKit, rate limits, and `API_PAUSED=false`.
- Run `database_setup.sql` for a fresh database, or run the files in `backend/migrations` in order for an existing database.
- Create or seed at least one admin user manually.
- Confirm `FRONTEND_ORIGINS` exactly matches the deployed frontend origin.
- Confirm frontend `VITE_API_URL` points to the deployed backend `/api` URL.
- Run backend `npm audit --omit=dev` and frontend `npm audit --omit=dev`.
- Run frontend `npm run lint` and `npm run build`.
- Confirm only one backend instance runs the scheduler, or move scheduler work to a separate worker before scaling horizontally.
- Keep `SOCKET_DEBUG=false` in production unless you are actively diagnosing realtime connections.
