# GALILEA PROJECT HANDOFF

## Purpose

This is the takeover document for the existing **GMAHK GALILEA BALIKPAPAN** production website. This is not a new project. Work from the existing repository and preserve working functionality.

## Project separation

This repository contains the GMAHK Galilea website. Do not confuse it with the separate Majelis Galilea / Notulen Gereja project. The latter must not be deployed, refactored, or otherwise changed as part of this work. Instagram Reels is also explicitly out of scope for the current revision cycle unless the user asks for it.

## Source of truth

Use the actual repository, Git history, and production behavior as the source of truth. Validate this document against the code before making changes.

Repository: https://github.com/roulanx/gmahk-galilea
Production: https://gmahk-galilea.vercel.app/

## Current architecture

Viewer: Vercel static/cinematic frontend (`index.html`)
Vercel API: `api/` proxy routes, admin entry, media/PDF/OG helpers
Public backend: Google Apps Script + Google Sheets (`apps-script-backend/Website.gs`)
Admin backend: Google Apps Script (`apps-script-backend/Admin.gs`)
Admin UI: `apps-script-backend/Admins.html`
Vercel bridge: `apps-script-backend/VercelApi.gs`

The README describes the intended flow as: Jemaat → Viewer Vercel → `/api/gas` → Apps Script API → Google Sheets; Admin → `/admin` → Apps Script Admin with Google login and draft/approval workflow.

## Latest repository state

The latest known commit is `a6abb5348e0e91c698b0ecc2897c90dbf798d1f1` with message **Stabilize admin portal and presentation resources** (2026-09-03). Its parent includes the realistic presentation background work. Inspect the actual latest tree and history before changing anything.

The repository currently includes:
- `api/admin.js`
- `api/gas.js`
- `api/media.js`
- `api/mission.js`
- `api/quarterly-pdf.js`
- `api/weekly-bulletin.js`
- `apps-script-backend/Admin.gs`
- `apps-script-backend/Admins.html`
- `apps-script-backend/VercelApi.gs`
- `apps-script-backend/Website.gs`
- `index.html`
- project test files and Vercel configuration

## Ongoing / latest revision priorities

### P0 — production stability
- Build/runtime failures
- Broken production routes
- Critical API failures
- Authentication/security failures
- Vercel deployment failures

### P1 — admin/backend
The admin portal is intended to support multi-role access, draft/approval/revision workflow, audit logging, content management, schedules, photos, services, and system health.

Verify end-to-end persistence:
Admin input → backend/API → Google Sheets/storage → reload → public viewer receives the updated data.

Do not consider an admin form complete merely because its UI saves locally or shows a success toast. Test actual persistence and viewer synchronization.

Current `Admin.gs` includes roles VIEWER/EDITOR/APPROVER/SUPERADMIN, workflow states, audit infrastructure, entity definitions, and `adminGetDashboardSummary()`. The dashboard summary was deliberately separated from bootstrap so login can render before heavier statistics/source checks finish. Preserve this architecture unless testing shows a real defect.

### P2 — viewer/presentation
Verify and finish:
- Ringkasan Terdekat / nearest upcoming schedule
- date/year and WITA logic
- past/current/upcoming schedule states
- Sion presentation
- Alkitab presentation
- fullscreen presentation
- realistic configurable presentation backgrounds
- readable TV/projector presentation
- light/dark presentation themes
- offline/wake-lock/presentation controls where already implemented

The repository already contains presentation-related version markers and tests for schedule, Bible, song, projector mode, theme switching, motion, and realistic backgrounds. Do not recreate existing functionality blindly.

### P3 — integrations
Verify:
- Sekolah Sabat API
- Renungan Pagi Advent
- AWR Borneo
- Sabbath discussion video
- PDF/weekly bulletin generation
- media/thumbnail routes

AWR requirement: show one latest video plus the previous three where the current implementation expects a compact presentation. Do not create a huge AWR block.

### P4 — polish
- Responsive desktop/tablet/mobile
- Typography
- Accessibility
- Reduced motion
- Loading/error/empty states
- Performance/cache
- Visual consistency

## Important existing requirements

### Schedule
The nearest upcoming relevant schedule should be reliably computed from actual WITA date/time data. Past entries should become inactive/gray where intended; upcoming entries should remain readable; the nearest upcoming item should be emphasized. Avoid hard-coded current years.

### Sion
Sion and theme-song presentation should be suitable for church/TV use with large text and clean controls. The requested direction includes realistic Christian/sanctuary backgrounds that can be switched or adjusted rather than being permanently forced. Preserve the existing configurable presentation theme/background system.

### Alkitab
Bible presentation should have correct book order, chapter/verse navigation, fullscreen presentation, large readable typography, and configurable realistic background/theme treatment.

### Admin
Admin access is based on Google account + role. Never weaken backend authorization merely to make UI navigation work. UI hiding is not authorization.

The admin backend currently creates/maintains `Website Admin`, `Website Workflow`, and `Website Audit` infrastructure and records audit events. Preserve this audit trail.

### Backend
Public content is backed by Google Sheets/Apps Script. Current code includes cache handling and entity/content schemas. Changes must preserve compatibility with existing spreadsheet data and avoid destructive migrations.

### Instagram
Instagram/Reels is out of scope for this revision cycle.

## Testing protocol

Before changes:
1. Inspect latest tree and recent commits.
2. Inspect `README.md`, `HASIL_PENGUJIAN.md`, package/test configuration, Vercel configuration, proxy allowlist, Apps Script bridge, public backend, admin backend, and admin UI.
3. Reproduce suspected issues instead of assuming they exist.

After changes:
1. Run `npm run check`.
2. Validate JavaScript parsing and project assertions.
3. Test public routes and dynamic APIs.
4. Test admin authentication/roles where access is available.
5. Test create/edit/persist/reload/viewer synchronization.
6. Test mobile/tablet/desktop.
7. Test light/dark and reduced motion.
8. Test presentation modes.
9. Inspect production deployment after deployment.
10. Inspect runtime errors and network failures where available.

## Deployment rules

Do not create a new repository or Vercel project. Keep the existing production deployment. Never expose environment-variable secrets. Never request passwords/tokens in chat. Use official authorization/integration mechanisms.

Before deployment, inspect the diff and ensure unrelated work is not overwritten. After deployment, perform a production smoke test.

## Design direction

The site should feel premium, cinematic, modern, immersive, elegant, and church-appropriate. Prefer the existing matcha/green visual direction, realistic sanctuary imagery, strong editorial typography, subtle motion, generous spacing, and excellent TV/mobile readability. Avoid generic AI-dashboard styling, excessive rounding, excessive borders, neon effects, clutter, and navy-heavy styling.

## Definition of done

A revision is done only when:
- The feature works from the real user flow.
- Data persists when persistence is expected.
- Public viewer reflects admin changes.
- No existing working feature is broken.
- Tests pass.
- Production deployment succeeds.
- Production smoke test passes.
- Changes are committed with a clear commit message.

## Agent takeover instruction

When another coding agent takes over this project, it must first inspect the repository and this document, then audit the current implementation and production state. It should not ask the user to paste the source code manually. If GitHub/Vercel/browser access is unavailable in that agent environment, it should request the official integration/authorization or explain the exact unavailable capability; it must not ask for passwords, API tokens, or secrets.

Work sequence:
**inspect → reproduce → plan → implement focused fix → test → inspect diff → commit → deploy → production smoke test → report results.**
