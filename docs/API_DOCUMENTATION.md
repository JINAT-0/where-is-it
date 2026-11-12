# REST API Documentation — Where Is It?

**Base URL:** `http://localhost:5000/api/v1` (or `/api/v1` via Vite proxy)

All responses follow a consistent JSON envelope:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation message",
  "data": {}
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error summary",
  "errors": [{ "field": "email", "message": "Please enter a valid email address" }]
}
```

> **Security Note:** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require an `x-csrf-token` header obtained from `GET /api/v1/auth/csrf-token` along with session and CSRF cookies (`credentials: "include"`).

---

## 1. Authentication Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/auth/csrf-token` | Public | Issues a CSRF cookie and returns `csrfToken`. |
| `POST` | `/auth/register` | Public | Registers a `STUDENT`, `FACULTY`, or `STAFF` account and starts a session. |
| `POST` | `/auth/login` | Public | Authenticates email & password via `bcrypt` and regenerates session. |
| `POST` | `/auth/logout` | Public/Auth | Destroys the MySQL session and clears the session cookie. |
| `GET` | `/auth/me` | Required | Returns the currently authenticated user profile. |

---

## 2. User Endpoints (`/users`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/dashboard` | Required | Returns user's summary counts, recent reports, and recent claims. |
| `GET` | `/users/profile` | Required | Returns user's profile fields. |
| `PUT` | `/users/profile` | Required | Updates `full_name`, `university_id`, and `department`. |
| `PUT` | `/users/change-password` | Required | Verifies current password and updates password hash. |

---

## 3. Categories Endpoint (`/categories`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | Lists all available item categories ordered alphabetically. |

---

## 4. Item Report Endpoints (`/items`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/items` | Public | Lists `APPROVED` items. Query params: `search`, `type` (`LOST`\|`FOUND`), `category`, `location`, `date`, `status`, `sort` (`newest`\|`oldest`), `page`, `limit`. |
| `GET` | `/items/my` | Required | Lists the authenticated user's own reports across all moderation states. |
| `GET` | `/items/:id` | Optional | Returns item details. Unapproved items are visible only to owner or `ADMIN`. |
| `POST` | `/items` | Required | Creates a new report (`multipart/form-data`, optional `image` field). Starts as `PENDING_REVIEW`. |
| `PUT` | `/items/:id` | Owner/Admin | Updates report details. Non-admin edits reset moderation to `PENDING_REVIEW`. |
| `DELETE` | `/items/:id` | Owner/Admin | Deletes report (owners cannot delete `CLAIMED` or `RETURNED` items). |

---

## 5. Ownership Claim Endpoints (`/claims`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/claims/my` | Required | Lists claims submitted by the authenticated user. |
| `POST` | `/claims` | Required | Submits a claim on an `APPROVED` `FOUND` item (`multipart/form-data`, optional `evidence`). |
| `GET` | `/claims/:id` | Claimant/Admin | Returns private claim details. |
| `GET` | `/claims/:id/evidence` | Claimant/Admin | Streams the private evidence image file. |
| `PUT` | `/claims/:id/withdraw` | Claimant | Withdraws a `PENDING` claim. |

---

## 6. Notification Endpoints (`/notifications`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Required | Returns user notifications, `unreadCount`, and pagination metadata. |
| `PATCH` | `/notifications/:id/read` | Required | Marks a specific notification as read. |
| `PATCH` | `/notifications/read-all` | Required | Marks all notifications for the current user as read. |

---

## 7. Administrator Endpoints (`/admin`)

All endpoints under `/api/v1/admin` require `role === 'ADMIN'`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | Returns live DB statistics, pending queues, and recent audit logs. |
| `GET` | `/admin/users` | Lists users with `search`, `role`, `status`, and pagination. |
| `PATCH` | `/admin/users/:id/status` | Sets `account_status` to `ACTIVE` or `SUSPENDED` and logs action. |
| `GET` | `/admin/items` | Lists all reports regardless of moderation status with filters. |
| `PATCH` | `/admin/items/:id/approve` | Approves report (`APPROVED`), notifies reporter, and logs action. |
| `PATCH` | `/admin/items/:id/reject` | Rejects report with `rejection_reason`, notifies reporter, and logs action. |
| `PATCH` | `/admin/items/:id/return` | Marks item `RETURNED` and completes approved claims in a transaction. |
| `DELETE` | `/admin/items/:id` | Deletes an item report and records admin activity log. |
| `GET` | `/admin/claims` | Lists all claims with claimant and item info. |
| `PATCH` | `/admin/claims/:id/approve` | Approves claim, sets item `CLAIMED`, rejects competing claims, notifies users. |
| `PATCH` | `/admin/claims/:id/reject` | Rejects claim with `admin_notes` and notifies claimant. |
| `PATCH` | `/admin/claims/:id/complete` | Confirms physical return (`COMPLETED` claim & `RETURNED` item). |
| `GET` | `/admin/categories` | Lists categories with item counts. |
| `POST` | `/admin/categories` | Creates a new category. |
| `PUT` | `/admin/categories/:id` | Updates a category. |
| `DELETE` | `/admin/categories/:id` | Deletes an unused category. |
| `GET` | `/admin/activity-logs` | Lists paginated `admin_activity_logs`. |
| `GET` | `/admin/settings` | Fetches `system_settings` key-value configuration. |
| `PUT` | `/admin/settings` | Updates `system_settings`. |
| `POST` | `/admin/announcements` | Broadcasts an `ANNOUNCEMENT` notification to all active users. |

