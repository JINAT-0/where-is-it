# Database Setup & Documentation (`where_is_it_db`)

This directory contains the MySQL / MariaDB relational schema and seeded demo data for **Where Is It? — Campus Lost & Found Management System**.

## Files

- `schema.sql` — Creates `where_is_it_db` with InnoDB tables, foreign keys, indexes, and session storage.
- `seed.sql` — Inserts default categories, bcrypt-hashed demo accounts, realistic lost/found reports, sample claims, notifications, admin logs, and system settings.

## Tables Created

1. `users` — Students, faculty, staff, and administrators (`ACTIVE` / `SUSPENDED`).
2. `categories` — Item classification categories.
3. `items` — Lost and found item reports with moderation (`PENDING_REVIEW`, `APPROVED`, `REJECTED`) and resolution (`OPEN`, `MATCHED`, `CLAIMED`, `RETURNED`, `CLOSED`) states.
4. `claims` — Ownership claims on `FOUND` items with private verification details and evidence references.
5. `notifications` — User notifications for submissions, moderation decisions, claims, returns, and announcements.
6. `admin_activity_logs` — Immutable audit trail of administrator moderation and system actions.
7. `system_settings` — Campus Lost & Found desk configuration key-value settings.
8. `sessions` — Persistent Express session storage (`express-mysql-session`).

## Demo Account Credentials

All demo accounts in `seed.sql` use bcrypt-hashed passwords:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| Administrator | Campus Administrator | `admin@campus.edu` | `Admin@1234` |
| Student | Sadia Rahman | `sadia.rahman@campus.edu` | `Student@1234` |
| Student | Rafiq Ahmed | `rafiq.ahmed@campus.edu` | `Student@1234` |
| Faculty | Dr. Hasan Karim | `dr.karim@campus.edu` | `Faculty@1234` |
| Staff | Tariq Mahmood | `tariq.mahmood@campus.edu` | `Staff@1234` |

## Importing via MySQL CLI

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Or using the backend helper script:

```bash
npm --prefix backend run db:setup
```

