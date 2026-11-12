# Entity-Relationship Diagram & Database Documentation

## 1. Entity-Relationship Diagram (`where_is_it_db`)

```mermaid
erDiagram
    USERS ||--o{ ITEMS : submits
    USERS ||--o{ CLAIMS : files
    USERS ||--o{ CLAIMS : reviews
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ADMIN_ACTIVITY_LOGS : performs
    USERS ||--o{ SYSTEM_SETTINGS : updates
    CATEGORIES ||--o{ ITEMS : classifies
    ITEMS ||--o{ CLAIMS : receives
    ITEMS ||--o{ NOTIFICATIONS : references
    CLAIMS ||--o{ NOTIFICATIONS : references

    USERS {
        int id PK
        varchar full_name
        varchar email UK
        varchar university_id UK
        varchar department
        enum role
        varchar password_hash
        enum account_status
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        int id PK
        varchar name UK
        varchar description
        timestamp created_at
    }

    ITEMS {
        int id PK
        int user_id FK
        int category_id FK
        varchar item_name
        text description
        enum report_type
        varchar location
        date event_date
        varchar approximate_time
        varchar contact_info
        varchar image_path
        enum moderation_status
        enum resolution_status
        varchar rejection_reason
        timestamp created_at
        timestamp updated_at
    }

    CLAIMS {
        int id PK
        int item_id FK
        int claimant_id FK
        text explanation
        text identifying_details
        varchar evidence_path
        enum status
        varchar admin_notes
        int reviewed_by FK
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        varchar title
        text message
        varchar notification_type
        int related_item_id FK
        int related_claim_id FK
        tinyint is_read
        timestamp created_at
    }

    ADMIN_ACTIVITY_LOGS {
        int id PK
        int admin_id FK
        varchar action
        varchar target_type
        int target_id
        text details
        timestamp created_at
    }

    SYSTEM_SETTINGS {
        varchar setting_key PK
        text setting_value
        varchar description
        int updated_by FK
        timestamp updated_at
    }
```

## 2. Schema Highlights & Constraints

- **Engine:** `InnoDB` across all tables to support foreign keys and ACID transactions.
- **Character Set:** `utf8mb4` / `utf8mb4_unicode_ci` (and `utf8mb4_bin` for `sessions`).
- **Uniqueness Constraints:** `users.email`, `users.university_id`, and `categories.name`.
- **Referential Integrity:**
  - Deleting a user cascades to their items, claims, and notifications.
  - Deleting a category with existing items is blocked (`ON DELETE RESTRICT`) to prevent orphaned reports.
  - Deleting an item cascades to claims (`ON DELETE CASCADE`) and sets `related_item_id` to `NULL` on notifications (`ON DELETE SET NULL`).
- **Indexes:** Composite index `idx_items_type_mod` accelerates public Lost/Found browsing; `idx_notifications_user_read` accelerates unread badge counts.

