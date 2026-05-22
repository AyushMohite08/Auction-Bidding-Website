# Auction Bidding System

A full-stack auction platform built with React, Node.js, Express, MySQL, and Socket.IO.

The backend currently supports secure HttpOnly cookie authentication, role-based access, vendor auction management, admin approval workflows, customer bidding, account management, change requests, audit logs, and one-time popcorn bidding extensions.

## Features

- Role-specific auth for customers, vendors, and admins.
- Single user record per email with multiple roles through `user_roles`.
- HttpOnly JWT cookies for browser-safe sessions.
- Vendor auction creation, editing, cancellation, and locking.
- Admin auction approval/rejection and controlled auction edits.
- Customer bidding, bid history, wins, and stats.
- Vendor change requests for post-bid auction updates.
- One-time popcorn bidding extension for last-minute bids, capped at 5 extension minutes and a 300-second trigger window.
- Automatic auction expiry scheduler.
- Socket.IO notification events.
- Local image uploads for auction items.

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client

Backend:

- Node.js
- Express
- MySQL 8
- Socket.IO
- JWT
- bcryptjs
- multer

## Project Structure

```text
backend/
  config/        env parsing and deployment config
  constants/     roles, statuses, shared constants
  controllers/   request/response flow
  middleware/    auth, role, JSON, origin checks
  models/        MySQL queries and transactions
  routes/        Express routes
  services/      reusable auth/auction/scheduler helpers
  utils/         cookies, JWT, HTTP fallback handlers
  migrations/    database migration scripts

frontend/
  src/
    api/         Axios client
    components/  shared UI components
    contexts/    auth/session context
    hooks/       socket hooks
    pages/       app pages

docs/
  api.md          Postman/API reference
  architecture.md current backend architecture
```

## Prerequisites

- Node.js 18 or newer
- MySQL 8
- npm

## Setup

Clone the repository:

```bash
git clone <repo-url>
cd <repo-folder>
```

Install backend dependencies:

```bash
cd backend
npm install
```

Create backend env file:

```bash
copy .env.example .env
```

Update `backend/.env` with your MySQL credentials and JWT secrets.

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

Create frontend env file:

```bash
copy .env.example .env
```

Default local frontend env:

```env
VITE_API_URL=http://localhost:3000/api
```

## Database Setup

Create and load the database schema:

```bash
mysql -u root -p < database_setup.sql
```

The setup creates:

- `users`
- `user_roles`
- `auctions`
- `bids`
- `auction_change_requests`
- `auction_audit_logs`

Admin users are not publicly registerable. Create an admin manually in the database or seed one for local testing.

## Running Locally

Start backend:

```bash
cd backend
npm start
```

Backend runs on:

```text
http://localhost:3000
```

Start frontend:

```bash
cd frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Environment Notes

Backend uses these important env values:

```env
RDS_HOST=localhost
RDS_USER=root
RDS_PASS=your_database_password_here
RDS_DB=auction_db
RDS_PORT=3306

JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret

AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax

FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173
UPLOAD_DIR=uploads
SOCKET_DEBUG=false
```

For cross-domain HTTPS deployments, use:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
FRONTEND_ORIGINS=https://your-frontend-domain.com
```

Keep `SOCKET_DEBUG=false` unless you are diagnosing realtime connections. In multi-instance deployments, run the auction expiry scheduler in only one backend process or move it to a dedicated worker.

Do not store JWTs in localStorage. The frontend should use cookies with:

```js
withCredentials: true
```

## API Documentation

See [docs/api.md](docs/api.md) for:

- Postman setup
- Auth APIs
- Vendor APIs
- Customer APIs
- Admin APIs
- Recommended test order
- Common error responses

See [docs/architecture.md](docs/architecture.md) for the current backend architecture.

## Useful Backend Scripts

```bash
npm start
npm run dev
```

## Notes

- `backend/uploads/` is local runtime storage and is ignored by git.
- `.env` files are ignored by git. Commit only `.env.example`.
- `node_modules/`, build output, logs, and generated archives should not be committed.

## License

MIT License. See [LICENSE](LICENSE).

## Author

Ayush Mohite
