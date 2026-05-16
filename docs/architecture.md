# Backend Architecture

This document describes the current backend architecture. It is intentionally simple: Express routes define endpoints, controllers handle request/response flow, services hold reusable/security-sensitive helpers, and the MySQL model owns SQL and transactions.

## Runtime Overview

- `backend/server.js` creates the Express app, HTTP server, Socket.IO server, CORS config, static upload serving, and route mounts.
- Public auction routes are mounted at `/api`.
- Auth routes are mounted at `/api/auth`.
- Uploaded auction images are served from `/uploads`.
- The expiry scheduler starts with the server and checks ended auctions every minute.
- Socket.IO currently broadcasts notification events through `new_notification`.

## Folder Structure

```text
backend/
  config/        environment parsing and deployment config
  constants/     roles, statuses, and shared constants
  controllers/   HTTP request flow and response handling
  middleware/    auth, role checks, JSON checks, origin guard
  models/        MySQL pool, SQL queries, and transactions
  routes/        Express route declarations
  services/      reusable business/security helpers
  utils/         cookies, JWT, and fallback HTTP handlers
  migrations/    incremental DB migration scripts
  uploads/       local uploaded files, ignored by git
```

Current key files:

- `config/env.js`: reads env values for DB, CORS origins, cookie/JWT settings, and uploads.
- `models/rdsModel.js`: MySQL data layer and transaction helper.
- `controllers/authController.js`: auth/profile/account endpoints.
- `controllers/auctionController.js`: auction, bidding, change-request, vendor, customer, and admin endpoint flow.
- `services/authService.js`: email/password validation, bcrypt, token issuing, safe user output.
- `services/auctionService.js`: auction parsing, date formatting, edit-field helpers, and validation helpers.

## Request Flow

1. Request enters Express in `server.js`.
2. CORS allows configured frontend origins and credentials.
3. `requireAllowedOrigin` blocks unsafe cross-origin writes from unapproved origins.
4. Routes select middleware and controller.
5. `requireAuth` reads the HttpOnly access cookie, verifies JWT, confirms user and role still exist, then sets `req.user`.
6. Controllers validate request shape, call model/service functions, and return JSON.
7. SQL and transactions stay in `rdsModel.js`.
8. Unknown routes and unexpected errors go through `utils/http.js`.

## Auth Design

- Auth uses HttpOnly JWT cookies, not localStorage.
- Login/register responses return `{ success, user }`; tokens are not returned in JSON.
- Access and refresh cookie names, same-site mode, secure mode, and expiry are configured through env.
- Public registration allows only `customer` and `vendor`.
- Admin users are created manually or seeded in the database.
- A single user row can have multiple roles through `user_roles`.
- Login is role-specific: `/api/auth/login/customer`, `/api/auth/login/vendor`, `/api/auth/login/admin`.
- Passwords are stored with bcrypt.
- Deleted users are soft deleted and blocked from future login/refresh.

## Data Model

Main tables:

- `users`: one row per email, profile fields, password hash, soft-delete columns.
- `user_roles`: many roles per user without duplicating the user row.
- `auctions`: auction details, status, bid prices, winner, popcorn settings, and local image URL.
- `bids`: bid history for each auction.
- `auction_change_requests`: vendor requests for post-bid/post-start controlled changes.
- `auction_audit_logs`: admin/vendor status changes, edits, cancellations, and request decisions.

Important rules:

- Bid writes, auction locking, auction deletion/cancellation, and expiry processing use transactions.
- Historical bids and auction records are preserved when users are soft deleted.
- Vendor-created auctions start as `pending`.

## Auction Lifecycle

Auction statuses:

```text
pending -> approved/rejected
approved/active -> sold/expired
pending/rejected -> cancelled
```

Behavior:

- Vendor creates auctions in `pending`.
- Admin approves or rejects pending auctions.
- Customers can bid only on approved/active auctions that have started and not ended.
- Bid amount must be higher than current bid or minimum bid.
- Vendor can lock an approved/active auction with bids; highest bid becomes winner and locked price.
- Scheduler expires ended auctions automatically.
- Auctions without bids expire without winner.

## Auction Management

Vendor edit rules:

- `pending`: can edit item name, description, minimum bid, image, start time, end time, and popcorn settings.
- `approved/active` before start and before bids: can edit description, end time, and popcorn settings.
- after bidding starts or bids exist: direct edit is blocked; vendor must create a change request.
- sold, expired, cancelled, or locked auctions cannot be edited by vendor.

Admin edit rules:

- Admin cannot change `vendor_id`.
- Before bids, admin can edit auction fields.
- After bids exist, admin can emergency-edit only description and end time, and must provide a reason.
- Sold, expired, and cancelled auctions cannot be edited.

Change requests:

- Vendors can request only `description` and `endTime`.
- Admin approval applies the requested change if the auction can still accept it.
- Admin rejection stores an admin note.

## Popcorn Bidding

Popcorn bidding is optional per auction.

- `popcorn_enabled`: enables anti-sniping behavior.
- `popcorn_trigger_seconds`: final window that can trigger extension, default `60`.
- `popcorn_extension_minutes`: extension amount, default `5`.
- `popcorn_extended`: prevents repeated extensions.
- `popcorn_notice`: persisted note for bidders/viewers.

When a valid bid lands inside the trigger window and the auction has not already been extended, the backend extends `end_time` once, saves the notice, and emits a Socket.IO notification.

## Deployment Notes

- Configure frontend origins with `FRONTEND_ORIGINS`.
- Cross-domain cookie deployments should use `AUTH_COOKIE_SAME_SITE=none` and `AUTH_COOKIE_SECURE=true`.
- Local development can use same-site lax cookies.
- The current storage is local disk under `backend/uploads`.
- The current database is MySQL through `mysql2/promise`.
- Future production scaling can move uploads to S3/object storage and Socket.IO fanout to a shared adapter, but that is not part of the current implementation.
