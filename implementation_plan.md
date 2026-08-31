# Comprehensive Security Hardening and UI/UX Polish Implementation Plan

## Goal Description
Implement the complete checklist of 22 Security hardening measures and 17 UI/UX Polish & Mobile responsiveness items across the Multi Hosting Platform control plane.

## Checklist Breakdown & Proposed Changes

### 1. Security Architecture Hardening
- **Environment & Git Hygiene**:
  - Audit `.gitignore` in root, backend, and frontend to ensure no secrets, database files (`*.sqlite`, `*.sqlite-wal`), `.env`, or sensitive keys can ever be committed.
  - Audit `config/env.ts` to ensure default fallback keys are rejected in `production` and all secrets are strictly sanitized from logs and error payloads.
- **Access Control & Permissions**:
  - Ensure all sensitive routes enforce `authenticate` and `requireAdmin` middleware.
  - Implement project resource ownership enforcement: regular users can only read, update, start, stop, restart, upload files to, or delete their own projects. Admins have global multi-tenant visibility.
- **Injection & Input Sanitization**:
  - Verify 100% of SQLite database queries use parameterized SQL prepared statements.
  - Strengthen path traversal sanitization in `FileService` and `ZipSlip` guards (`path.resolve`, null byte detection `\0`, `..` elimination).
  - Add input validation on slugs, custom domains, and document roots via Zod.
- **Resource Constraints / Spending Cap**:
  - Enforce Docker container resource limits on all project containers (`--memory 256m --memory-swap 512m --cpus 0.5 --pids-limit 100`).
  - Enforce max upload file size (100MB) with clean `413 Payload Too Large` error handling.
- **Security Headers, CORS & Rate Limiting**:
  - Configure Helmet security headers with strict CSP, HSTS, XSS protection, and frame options.
  - Add trust proxy support and configure rate limiters on API and authentication routes (`authLimiter`, `globalLimiter`).
  - Sanitize all production error responses to hide internal stack traces (`NODE_ENV=production`).

---

### 2. UI/UX Polish & Mobile Responsiveness
- **Mobile Menu & Responsive Drawer**:
  - Implement a sliding mobile navigation drawer with hamburger toggle in `Navbar.tsx` and backdrop overlay.
  - Ensure sidebar collapses gracefully on screens `< 1024px`.
- **Favicon, Page Titles & SEO Metadata**:
  - Update `frontend/index.html` with a modern SVG server favicon, viewport meta, theme-color, and descriptive title: `Multi Hosting — Cloud Control Plane`.
  - Add dynamic page titles on route changes via a `useDocumentTitle` hook or `<Helmet>` style title updater.
- **Custom 404 Page**:
  - Create `frontend/src/pages/NotFound.tsx` with a stylish 404 card, error illustration, and 1-click button back to `/`.
  - Configure catch-all `*` route in `App.tsx`.
- **Clickable Logo, Mailto Links & Dynamic Copyright**:
  - Ensure logo in Navbar & auth screens is clickable (`<Link to="/">`).
  - Wrap user email in `mailto:` link.
  - Update all footer/sidebar copyright references to dynamic current year.
- **No Horizontal Scroll & Overflow Fixes**:
  - Apply `overflow-x-hidden` on main layout containers.
  - Ensure all tables, log viewers, and code blocks have responsive internal scrolling (`overflow-x-auto`) without breaking page width.
- **Action Feedback & Error Messaging**:
  - Standardize toast notification messages for project actions (Start, Stop, Restart, Delete, Deploy, Save File, Reset DB Password, Update Settings).

---

## Verification Plan
1. **Unit & Integration Tests**: Run `npm test` on backend (25+ tests covering auth, rate limiting, path traversal, port allocation, and database isolation).
2. **Build Verification**: Run `npm run build` on both backend and frontend.
3. **Deployment**: Deploy updated control plane to `192.168.0.245`.
4. **Live Verification**:
   - Test mobile drawer toggle at `< 768px` viewport.
   - Test custom 404 page at `/non-existent-route`.
   - Test project start/stop/restart/delete with instant toast feedback.
   - Verify all 17 projects remain active with HTTP 200 responses.
