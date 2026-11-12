# User, Admin, Installation & Deployment Manual

## 1. Installation & Local Setup Guide (Windows / VS Code)

### Prerequisites
- **Node.js** v18+ (tested with Node v24.12.0) and **npm**
- **MySQL 8.0** or **MariaDB 10.4+** (e.g., MySQL Workbench or XAMPP MySQL)
- **Git**

### Step-by-Step Setup

1. **Install all dependencies (root, backend, frontend):**
   ```bash
   npm run install:all
   ```

2. **Start MySQL Server:**
   - Using MySQL Service / MySQL Workbench, or XAMPP Control Panel (`Start` MySQL on port `3306`).

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   - Update `DB_USER`, `DB_PASSWORD`, `SESSION_SECRET`, and `CSRF_SECRET` in `.env` as needed.

4. **Create Database, Tables & Seed Demo Data:**
   ```bash
   npm --prefix backend run db:setup
   ```
   *(Alternatively, import `database/schema.sql` then `database/seed.sql` via MySQL Workbench or CLI.)*

5. **Start Frontend and Backend Simultaneously:**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend REST API: `http://localhost:5000/api/v1`

---

## 2. User Manual (Students, Faculty & Staff)

1. **Register / Log In:** Visit `/register` to create an account with your University ID, department, and campus role (`STUDENT`, `FACULTY`, or `STAFF`), or use `/login`.
2. **Browse Lost & Found Items:** Use `/lost-items` and `/found-items` to search by keyword, category, campus location, date, status, and sort order.
3. **Report a Lost or Found Item:** Navigate to **Dashboard → Report Lost Item** or **Report Found Item**. Submitted reports enter `PENDING_REVIEW` until approved by an administrator.
4. **Submit an Ownership Claim:** Open an approved **Found Item** detail page, fill in your explanation, private identifying details, and optional evidence image, then click **Submit Ownership Claim**.
5. **Track Status & Notifications:** Check **My Reports**, **My Claims**, and **Notifications** in your dashboard sidebar.

---

## 3. Administrator Manual

1. **Moderation Queue:** Open **Admin Dashboard → Report Management** to approve or reject newly submitted reports (rejection requires a reason sent to the reporter).
2. **Claim Verification & Handover:** Open **Admin Dashboard → Claim Management** to inspect private identifying details and secure evidence attachments.
   - Click **Approve Claim** once details match (automatically sets item to `CLAIMED` and notifies claimant to visit the Lost & Found Desk).
   - After checking the claimant's physical University ID at pickup, click **Confirm Safe Return** to mark the claim `COMPLETED` and the item `RETURNED`.
3. **User & Category Governance:** Suspend/reactivate accounts under **User Management**, manage item categories under **Category Management**, audit actions under **Activity Logs**, and broadcast campus announcements under **System Settings**.

---

## 4. Deployment Guide (GitHub, Vercel, Node.js Host & Managed MySQL)

> **Important Architecture Note:** Vercel hosts the **static Vite frontend** (`frontend/dist`). Express.js (`backend/`) and MySQL (`where_is_it_db`) must be deployed separately on a Node.js hosting service (such as Render, Railway, or a VPS) and a managed MySQL provider (such as Railway MySQL, PlanetScale/Aiven, or DigitalOcean Managed MySQL).

### A. Push to GitHub
1. Verify `.env`, `node_modules/`, `backend/uploads/*`, and `backend/private_uploads/*` are excluded via `.gitignore`.
2. Commit and push to your GitHub repository.

### B. Managed MySQL Setup
1. Provision a MySQL database on your cloud provider.
2. Run `database/schema.sql` and `database/seed.sql` against the remote database.

### C. Backend Deployment (Render / Railway / VPS)
1. Set Root Directory to `backend` (Start Command: `node server.js`).
2. Configure production environment variables:
   - `NODE_ENV=production`
   - `PORT=5000` (or provider-assigned port)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`
   - `SESSION_SECRET` (64+ random characters)
   - `CSRF_SECRET` (64+ random characters)
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
3. **File Storage Requirement:** Cloud PaaS containers often use ephemeral filesystems. Mount a persistent disk volume at `/app/uploads` and `/app/private_uploads` or integrate object storage (AWS S3 / Cloudflare R2) so uploaded item images and private claim evidence persist across restarts.

### D. Frontend Deployment (Vercel)
1. Import the GitHub repository in Vercel and set **Root Directory** to `frontend`.
2. Build Command: `npm run build` | Output Directory: `dist`.
3. Add Environment Variable: `VITE_API_BASE_URL=https://your-backend-domain.com/api/v1`.
4. `frontend/vercel.json` handles SPA client-side route rewrites automatically.

---

## 5. Known Limitations & Future Improvements

### Limitations
- Uploaded images and private claim evidence are stored on the local server filesystem in this academic release.
- Notifications are stored and viewed inside the web portal without external SMTP email or push notifications.
- Image matching and keyword suggestions are text-based rather than AI/visual similarity based.

### Future Improvements
- Integrate cloud object storage (AWS S3 / Cloudflare R2) with signed URLs for private claim evidence.
- Add automated email notifications via Nodemailer/SMTP for claim approvals and pickup reminders.
- Add automatic potential-match suggestions comparing new `LOST` reports against `FOUND` reports by category, location, and keywords.
- Add QR code sticker generation for physical Lost & Found desk inventory tagging.

