# Testing Documentation & Test Cases

## 1. Automated Integration Test Suite

Location: `backend/tests/api.test.js`  
Framework: Node.js built-in test runner (`node --test`) + `supertest` against a real MySQL (`where_is_it_db`) database.

### Command

```bash
npm test
```

### Executed Automated Tests (9 / 9 Passed)

| ID | Test Case | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| TC-01 | API Health Check | `GET /api/v1/health` returns `200 OK` | Passed |
| TC-02 | Registration & Admin Prevention | Rejects `ADMIN` registration (`400`), registers student (`201`), rejects duplicate email (`409`) | Passed |
| TC-03 | Login, Logout & Session Invalidation | Logout destroys session (`401` on `/auth/me`), invalid password returns `401`, valid login succeeds (`200`) | Passed |
| TC-04 | Admin Route Authorization | Non-admin user receives `403 Forbidden` on `/api/v1/admin/dashboard` | Passed |
| TC-05 | Item CRUD, Ownership & Search/Filter | Creates `PENDING_REVIEW` item, hides from public list, updates own item, blocks non-owner edit/delete (`403`), searches/filters/paginates approved items | Passed |
| TC-06 | Moderation, Claim & Return Transaction | Admin approves item, prevents self-claim (`400`) & duplicate claim (`409`), hides private claim from finder (`403`), approves claim (`CLAIMED`), completes return (`RETURNED`) | Passed |
| TC-07 | Notifications, Categories, Suspension & Logs | Reads/marks notifications, creates/renames/deletes category, suspends & reactivates user, verifies admin stats & audit logs | Passed |
| TC-08 | Owner Deletion of Open Report | Owner deletes `OPEN` report (`200`) and verifies DB row removal | Passed |
| TC-09 | Multer Upload & Private Evidence Security | Rejects `.exe` upload (`400`), allows `.png` evidence, grants access to claimant & admin (`200`), blocks unrelated user (`403`) | Passed |

## 2. Manual & UI Verification Checklist

- **Frontend Production Build:** Verified via `npm run build` (`vite build` compiled `dist/` with 0 errors).
- **Live Browser End-to-End Flow:** Run `npm run dev` and verify Home, Lost Items, Found Items, Item Details, Login/Register, User Dashboard, and Admin Dashboard in Chrome/Edge at desktop (`1280px`), tablet (`768px`), and mobile (`375px`) viewports.

