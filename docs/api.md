# Auction Backend API

Base API URL for local Postman testing:

```text
apiUrl = http://localhost:3000/api
```

The backend uses HttpOnly cookie authentication. Do not send `Authorization: Bearer` tokens. After login/register, Postman should store the cookies automatically and send them on protected requests.

## Postman Setup

Create these environment variables:

```text
apiUrl = http://localhost:3000/api
vendorEmail = vendor1@test.com
customerEmail = customer1@test.com
password = Test@1234
auctionId =
customerId =
changeRequestId =
```

For JSON requests:

```text
Content-Type: application/json
```

For file upload requests, use `form-data` and let Postman set the multipart `Content-Type` automatically.

Seeded local admin:

```json
{
  "email": "admin@test.com",
  "password": "Admin@123",
  "role": "admin"
}
```

## Auth APIs

### Register

`POST {{apiUrl}}/auth/register`

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "name": "Vendor One",
  "email": "{{vendorEmail}}",
  "password": "{{password}}",
  "role": "vendor"
}
```

Allowed public roles: `customer`, `vendor`.

Expected:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Vendor One",
    "email": "vendor1@test.com",
    "role": "vendor"
  }
}
```

Notes:

- Sets HttpOnly access and refresh cookies.
- Does not return JWT tokens.
- If the email already exists, the same password can be used to add another role to the same user.
- Password rule: at least 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 symbol, and no spaces.

### Login

`POST {{apiUrl}}/auth/login/:role`

Examples:

```text
POST {{apiUrl}}/auth/login/vendor
POST {{apiUrl}}/auth/login/customer
POST {{apiUrl}}/auth/login/admin
```

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "email": "{{vendorEmail}}",
  "password": "{{password}}"
}
```

Expected:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Vendor One",
    "email": "vendor1@test.com",
    "role": "vendor"
  }
}
```

### Refresh Session

`POST {{apiUrl}}/auth/refresh`

Headers: none required.

Expected:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Vendor One",
    "email": "vendor1@test.com",
    "role": "vendor"
  }
}
```

### Logout

`POST {{apiUrl}}/auth/logout`

Expected:

```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### Get Current User

`GET {{apiUrl}}/auth/me`

Requires: logged-in cookie session.

Expected:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "Vendor One",
    "email": "vendor1@test.com",
    "role": "vendor"
  },
  "roles": ["vendor"]
}
```

### Update Profile

`PATCH {{apiUrl}}/auth/me`

Requires: logged-in cookie session.

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "name": "Updated Name",
  "contact_info": "9999999999"
}
```

Email cannot be edited.

### Change Password

`PATCH {{apiUrl}}/auth/me/password`

Requires: logged-in cookie session.

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "currentPassword": "Test@1234",
  "newPassword": "New@Test123"
}
```

### Delete Account

`DELETE {{apiUrl}}/auth/me`

Requires: logged-in cookie session.

Deletion is soft delete. It is blocked when:

- customer is the highest bidder on an active/approved auction
- vendor has unresolved auctions

## Public Auction APIs

### List All Auctions

`GET {{apiUrl}}/auctions`

Public.

### List Active Auctions

`GET {{apiUrl}}/auctions/active`

Public. Returns approved/active auctions whose `end_time` has not passed.

### Get Auction By ID

`GET {{apiUrl}}/auctions/:id`

Public.

Example:

```text
GET {{apiUrl}}/auctions/{{auctionId}}
```

### Get Auction Bids

`GET {{apiUrl}}/auctions/:id/bids`

Public.

Example:

```text
GET {{apiUrl}}/auctions/{{auctionId}}/bids
```

## Vendor APIs

Vendor APIs require login through:

```text
POST {{apiUrl}}/auth/login/vendor
```

### Create Auction

`POST {{apiUrl}}/vendor/upload`

Body type: `form-data`

Fields:

```text
itemName = Test Watch
description = Initial auction description
minBid = 100
startTime = 2026-05-16T14:43:00.913Z
endTime = 2026-05-16T15:14:00.913Z
popcornEnabled = true
popcornExtensionMinutes = 5
popcornTriggerSeconds = 60
itemImage = file
```

Expected:

```json
{
  "message": "Auction created successfully.",
  "auction": {
    "id": 1,
    "status": "pending"
  }
}
```

Notes:

- New vendor auctions default to `pending`.
- `startTime` and `endTime` can be ISO strings.
- Popcorn settings are optional. Defaults are disabled, 5 extension minutes, 60 trigger seconds.
- `popcornExtensionMinutes` must be between `1` and `5`.
- `popcornTriggerSeconds` is measured in seconds and must be between `1` and `300`.

### List My Auctions

`GET {{apiUrl}}/vendor/auctions`

### Update My Auction

`PATCH {{apiUrl}}/vendor/auctions/:id`

Body type: `form-data`

Example:

```text
description = Updated description
minBid = 120
endTime = 2026-05-16T16:00:00.000Z
itemImage = file
```

Vendor edit rules:

- `pending`: can edit item name, description, min bid, image, start time, end time, and popcorn settings.
- `approved/active` before start and before bids: can edit description, end time, and popcorn settings.
- after bids or after start: direct edit is blocked; use change request.
- sold, expired, cancelled, or locked auctions cannot be edited.

### Cancel My Auction

`DELETE {{apiUrl}}/vendor/auctions/:id`

Only allowed for `pending` or `rejected` auctions.

### Lock Auction

`POST {{apiUrl}}/vendor/auctions/:id/lock`

Locks the auction as sold using the current highest bid.

Expected:

```json
{
  "message": "Auction locked successfully!",
  "success": true,
  "winnerId": "customer-id",
  "finalPrice": "150.00"
}
```

### Create Auction Change Request

`POST {{apiUrl}}/vendor/auctions/:id/change-requests`

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "description": "Requested description update",
  "endTime": "2026-05-16T16:30:00.000Z",
  "reason": "Need update after discussion"
}
```

Only `description` and `endTime` can be requested.

### List My Change Requests

`GET {{apiUrl}}/vendor/auction-change-requests`

## Customer APIs

Customer APIs require login through:

```text
POST {{apiUrl}}/auth/login/customer
```

### Place Bid

`POST {{apiUrl}}/customer/bid`

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "auctionId": 1,
  "newBidAmount": 150
}
```

Expected:

```json
{
  "success": true,
  "previousUserId": null,
  "popcornExtended": false,
  "popcornNotice": null,
  "newEndTime": null
}
```

Bid rules:

- auction must be approved/active
- auction must have started
- auction must not be expired or locked
- bid must be higher than current bid or minimum bid
- if popcorn is enabled and the bid lands inside the final trigger window, end time extends once
- popcorn extension is capped at 5 minutes and trigger window is capped at 300 seconds

### Get My Bid History

`GET {{apiUrl}}/customer/:customerId/bid-history`

Customer can only access their own history. Admin can access any customer history.

### Get My Wins

`GET {{apiUrl}}/customer/:customerId/wins`

Customer can only access their own wins. Admin can access any customer wins.

### Get My Stats

`GET {{apiUrl}}/customer/:customerId/stats`

Customer can only access their own stats. Admin can access any customer stats.

## Admin APIs

Admin APIs require login through:

```text
POST {{apiUrl}}/auth/login/admin
```

### Approve Or Reject Auction

`PATCH {{apiUrl}}/admin/auctions/:id/status`

Headers:

```text
Content-Type: application/json
```

Body:

```json
{
  "newStatus": "approved"
}
```

Allowed statuses:

```text
approved
rejected
```

Only `pending` auctions can be approved or rejected.

### Admin Update Auction

`PATCH {{apiUrl}}/admin/auctions/:id`

Body type: `form-data`

Example before bids:

```text
itemName = Updated Item
description = Updated description
minBid = 200
startTime = 2026-05-16T14:43:00.913Z
endTime = 2026-05-16T15:14:00.913Z
popcornEnabled = true
popcornExtensionMinutes = 5
popcornTriggerSeconds = 60
itemImage = file
```

Example after bids:

```text
description = Emergency updated description
endTime = 2026-05-16T16:30:00.000Z
reason = Approved after vendor request
```

Admin rules:

- cannot change `vendor_id`
- before bids: can edit auction fields
- after bids: can edit only `description` and `endTime`, and `reason` is required
- sold, expired, or cancelled auctions cannot be edited

### List Auction Change Requests

`GET {{apiUrl}}/admin/auction-change-requests`

### Approve Or Reject Change Request

`PATCH {{apiUrl}}/admin/auction-change-requests/:id/status`

Headers:

```text
Content-Type: application/json
```

Approve body:

```json
{
  "status": "approved",
  "adminNote": "Approved"
}
```

Reject body:

```json
{
  "status": "rejected",
  "adminNote": "Not acceptable"
}
```

Approving applies the requested auction changes only if the auction can still accept them.

## Recommended Postman Test Order

1. Register vendor.
2. Register customer.
3. Login vendor.
4. Create auction.
5. Vendor edit while pending.
6. Login admin.
7. Approve auction.
8. Login customer.
9. Place bid.
10. Check customer bid history/stats.
11. Login vendor.
12. Confirm direct edit after bid is blocked.
13. Create vendor change request.
14. Login admin.
15. Approve or reject change request.
16. Login vendor.
17. Lock auction.
18. Test refresh/logout.

## Common Responses

Unauthenticated:

```json
{
  "success": false,
  "message": "Authentication is required."
}
```

Wrong role:

```json
{
  "success": false,
  "message": "Access forbidden."
}
```

Invalid JSON:

```json
{
  "success": false,
  "message": "Invalid JSON body."
}
```

Wrong content type for JSON route:

```json
{
  "success": false,
  "message": "Content-Type must be application/json."
}
```

## Cookie Notes

Postman will show the `auction_access` and `auction_refresh` cookies. That is expected for testing. In browsers, these cookies are HttpOnly, so frontend JavaScript cannot read them.

For frontend requests later:

```js
axios.defaults.withCredentials = true;
```

Do not store JWTs in `localStorage`, session storage, or JS state.
