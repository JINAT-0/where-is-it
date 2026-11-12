# Software Requirements Specification (SRS) — Where Is It?

## 1. Introduction

This document specifies the functional requirements, non-functional requirements, system architecture, and behavioral diagrams for **Where Is It? — Campus Lost & Found Management System**.

## 2. Functional Requirements

### FR-1: Authentication & Account Management
- **FR-1.1:** Users can register as `STUDENT`, `FACULTY`, or `STAFF` with full name, unique university email, unique university ID, department, and password. Public registration as `ADMIN` is prohibited.
- **FR-1.2:** Passwords are hashed using `bcrypt` before database storage.
- **FR-1.3:** Users authenticate via session-based cookies persisted in MySQL (`sessions` table).
- **FR-1.4:** Authenticated users can update their profile and change their password.
- **FR-1.5:** Suspended users (`SUSPENDED`) are blocked from logging in and active sessions are invalidated.

### FR-2: Lost & Found Item Reporting
- **FR-2.1:** Authenticated users can submit Lost or Found item reports with category, description, location, date, approximate time, contact note, and optional image upload (`JPG`, `JPEG`, `PNG`, `WebP` up to 5 MB).
- **FR-2.2:** Newly submitted reports default to `PENDING_REVIEW` moderation status and `OPEN` resolution status.
- **FR-2.3:** Owners can edit or delete their own reports when not `CLAIMED`, `RETURNED`, or `CLOSED`. Editing a reviewed report resets moderation to `PENDING_REVIEW`.

### FR-3: Search, Filtering & Item Details
- **FR-3.1:** Public Lost Items and Found Items pages display only `APPROVED` reports.
- **FR-3.2:** Users can search by keyword and filter by category, location, date, resolution status, and sort order (`newest`/`oldest`) with pagination.
- **FR-3.3:** Item detail views protect private user information (emails and university IDs are never exposed publicly).

### FR-4: Ownership Claims & Return Coordination
- **FR-4.1:** Authenticated users can submit ownership claims on eligible `APPROVED` `FOUND` items (`OPEN`/`MATCHED`) with explanation, identifying details, and optional private evidence image.
- **FR-4.2:** Users cannot claim their own found report or submit duplicate active claims for the same item.
- **FR-4.3:** Private claim details and evidence files are stored outside public web directories and accessible only to the claimant and administrators.
- **FR-4.4:** Claimants can withdraw `PENDING` claims.
- **FR-4.5:** Administrators can approve or reject claims and confirm physical handover (`COMPLETED` claim / `RETURNED` item) inside atomic MySQL transactions.

### FR-5: Notifications
- **FR-5.1:** System generates notifications for report submission, approval, rejection, claim submission, claim approval/rejection, item return, and admin broadcasts.
- **FR-5.2:** Users can view unread counts, mark individual notifications read, and mark all notifications read.

### FR-6: Administration & Governance
- **FR-6.1:** Administrators access real-time dashboard statistics, user management (suspend/reactivate), report moderation, claim verification, category CRUD, activity logs, and system settings.
- **FR-6.2:** Every administrative action is recorded in `admin_activity_logs`.

## 3. Non-Functional Requirements

- **NFR-1 Security:** Parameterized SQL queries prevent SQL injection; `helmet`, `csrf-csrf`, `express-rate-limit`, `express-validator`, HTTP-only cookies, and HTML escaping prevent CSRF, XSS, brute-force attacks, and broken access control.
- **NFR-2 Usability & Responsiveness:** Responsive across desktop, laptop, tablet, and mobile viewports with loading, empty, error, and confirmation states.
- **NFR-3 Reliability & Data Integrity:** InnoDB foreign keys, unique constraints, and multi-step MySQL transactions prevent partial state updates.
- **NFR-4 Maintainability:** Modular separation across routes, controllers, services, validators, middleware, and frontend ES6 modules.

## 4. System Architecture Diagram

```mermaid
flowchart LR
    B["Browser (HTML5 / Tailwind / Vanilla JS)"] -->|Fetch API + Session Cookie + CSRF Header| F["Vite Dev Server / Vercel Static Host"]
    B -->|REST API /api/v1| E["Node.js + Express.js Server"]
    E --> M["Security Middleware (Helmet, CORS, Rate Limit, CSRF, Auth, Multer)"]
    M --> S["Controllers & Services Layer"]
    S -->|mysql2 Parameterized Queries & Transactions| D[("MySQL Database (where_is_it_db)")]
    S -->|Public Item Photos| U1["uploads/items/"]
    S -->|Private Claim Evidence| U2["private_uploads/evidence/"]
```

## 5. Use Case Diagram

```mermaid
flowchart TB
    Guest(["Campus Visitor / Guest"])
    Member(["Student / Faculty / Staff"])
    Admin(["Campus Administrator"])

    UC1["Browse & Search Approved Items"]
    UC2["Register & Log In"]
    UC3["Report Lost / Found Item"]
    UC4["Manage Own Reports"]
    UC5["Submit Ownership Claim + Private Evidence"]
    UC6["Track Notifications & Profile"]
    UC7["Moderate Reports (Approve / Reject)"]
    UC8["Verify Claims & Confirm Return"]
    UC9["Manage Users, Categories, Logs & Settings"]

    Guest --> UC1
    Guest --> UC2
    Member --> UC1
    Member --> UC3
    Member --> UC4
    Member --> UC5
    Member --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
```

## 6. Data Flow Diagram (Level 0 & Level 1)

```mermaid
flowchart LR
    U["Campus User"] -->|Report Form + Image| P1["1.0 Report & Moderation Process"]
    P1 -->|PENDING_REVIEW Item| DB1[("items table")]
    A["Administrator"] -->|Approve / Reject| P1
    P1 -->|Status Alert| DB2[("notifications table")]

    U -->|Claim Form + Evidence| P2["2.0 Claim Verification Process"]
    P2 -->|PENDING Claim| DB3[("claims table")]
    A -->|Approve & Confirm Return| P2
    P2 -->|Update RETURNED| DB1
    P2 -->|Audit Entry| DB4[("admin_activity_logs")]
```

## 7. Activity Diagram (Lost/Found Recovery Lifecycle)

```mermaid
flowchart TD
    Start(["Start: Item Found on Campus"]) --> Submit["Finder Submits Found Report"]
    Submit --> Pending["Status: PENDING_REVIEW"]
    Pending --> Review{"Admin Moderation"}
    Review -->|Reject| Rejected["Status: REJECTED + Reason Sent"]
    Review -->|Approve| Approved["Status: APPROVED & OPEN"]
    Approved --> Claim["Owner Submits Claim + Identifying Details"]
    Claim --> Verify{"Admin Verifies Proof"}
    Verify -->|Reject| ClaimRejected["Claim REJECTED + Owner Notified"]
    Verify -->|Approve| ClaimApproved["Claim APPROVED + Item CLAIMED"]
    ClaimApproved --> Handover["In-Person ID Check at Lost & Found Desk"]
    Handover --> Returned["Admin Confirms Return: Claim COMPLETED / Item RETURNED"]
    Returned --> End(["End"])
```

## 8. Sequence Diagram (Ownership Claim & Return Flow)

```mermaid
sequenceDiagram
    actor Owner as Claimant (Student/Faculty/Staff)
    participant UI as Frontend SPA
    participant API as Express REST API
    participant DB as MySQL (InnoDB)
    actor Admin as Campus Administrator

    Owner->>UI: Submit Claim Form + Private Evidence
    UI->>API: POST /api/v1/claims (with CSRF & Session Cookie)
    API->>DB: BEGIN TRANSACTION -> Insert claim (PENDING) + Notifications
    DB-->>API: Committed
    API-->>UI: 201 Created

    Admin->>UI: Open Claim Management & Review Private Evidence
    UI->>API: GET /api/v1/claims/:id/evidence
    API-->>UI: Authorized Evidence File Stream
    Admin->>UI: Click Approve Claim
    UI->>API: PATCH /api/v1/admin/claims/:id/approve
    API->>DB: BEGIN -> Claim APPROVED, Item CLAIMED, Log & Notify
    DB-->>API: Committed
    API-->>UI: 200 OK

    Admin->>UI: Confirm Physical Handover Return
    UI->>API: PATCH /api/v1/admin/claims/:id/complete
    API->>DB: BEGIN -> Claim COMPLETED, Item RETURNED, Log & Notify
    DB-->>API: Committed
    API-->>UI: 200 OK
```

