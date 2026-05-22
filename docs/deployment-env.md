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
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_AUCTION_IMAGE_SIZE_MB=5
IMAGEKIT_PRIVATE_KEY=private_your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=public_your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
IMAGEKIT_UPLOAD_FOLDER=/auction-items
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

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
- Keep JWT secrets long, random, and different in production.
- Keep `SOCKET_DEBUG=false` unless diagnosing realtime connection behavior.
