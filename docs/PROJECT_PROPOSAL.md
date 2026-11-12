# Project Proposal: Where Is It? — Campus Lost & Found Management System

## 1. Project Overview

**Where Is It?** is a centralized, three-tier full-stack web application built for university campuses so students, faculty members, university staff, and campus administrators can efficiently report lost or found items, search verified listings, submit confidential ownership claims, and coordinate safe item returns.

## 2. Problem Statement

On university campuses, misplaced items such as student ID cards, laptops, calculators, lab equipment, and keys are commonly reported across fragmented channels (WhatsApp groups, social media pages, physical noticeboards, or isolated department desks). This leads to:
- Low recovery rates due to poor searchability.
- Privacy risks when sensitive contact details or item identifiers are posted publicly.
- Fraudulent or unverified claims without an audit trail.
- Lack of administrative visibility into returned vs. unclaimed inventory.

## 3. Objectives

1. Provide a unified web portal with dedicated **Lost Items** and **Found Items** browsing, keyword search, multi-filter controls, and pagination.
2. Enforce **admin moderation** before reports appear publicly, preventing spam and protecting sensitive user data.
3. Implement a **confidential ownership claim workflow** where private identifying proof and supporting evidence files are stored securely and visible only to the claimant and administrators.
4. Provide real-time database-driven **notifications** and an **administrator audit log** (`admin_activity_logs`).
5. Deliver a clean, responsive, accessible SaaS-grade interface using HTML5, Tailwind CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL.

## 4. Target Users

- **Students:** Report lost/found belongings, search items, submit claims, track status, manage profile.
- **Faculty & University Staff:** Report classroom/lab/office items, coordinate handovers, track claims.
- **Administrators:** Moderate reports, verify ownership claims, confirm item returns, manage categories and user accounts, audit activity logs, and configure desk settings.

## 5. Technology Stack

- **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (ES6+), Fetch API, Vite
- **Backend:** Node.js, Express.js REST API, `mysql2`, `bcrypt`, `express-session`, `express-mysql-session`, `helmet`, `express-rate-limit`, `express-validator`, `csrf-csrf`, `multer`
- **Database:** MySQL (InnoDB engine, foreign keys, indexes, transactions)
- **Deployment Target:** GitHub, Vercel (Frontend), Node.js PaaS (Backend), Managed MySQL

## 6. Limitations & Scope Boundaries

- Physical item handover still occurs in person at the Campus Lost & Found Desk with University ID verification.
- Notification delivery is in-app (database-backed) rather than SMTP email/SMS push in this release.
- Local disk uploads (`backend/uploads/items/` and `backend/private_uploads/evidence/`) require persistent volumes or object storage (e.g., S3/R2) in ephemeral cloud environments.

