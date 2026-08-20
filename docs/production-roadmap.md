# Production Roadmap

This document tracks larger architectural follow-ups identified during the
2026-08-17 production-readiness pass. These were deliberately **not** done in
that pass (which focused on production-blocking fixes: a critical login
vulnerability, a build-breaking syntax error, a broken local dev API URL,
hardcoded gym IDs, and scratch-script cleanup) because each of these is a
larger, higher-risk piece of work that deserves its own planning and testing
cycle.

## 1. Replace the Mongoose→Prisma adapter shim

`backend/models/MongooseAdapter.js` implements a hand-rolled translator that
lets every model in `backend/models/*.js` (e.g. `User.js`, `Member.js`) expose
a Mongoose-style query API (`.findOne`, `.findById`, `$or`, `$regex`, etc.)
while the actual persistence is Prisma/Postgres. This is a real maintenance
and correctness risk:
- Every Mongoose operator has to be manually re-implemented and kept in sync
  with Prisma's query semantics — subtle mismatches are easy to introduce and
  hard to spot in review.
- `backend/models/OTP.js` still uses **real** Mongoose (not the adapter) and
  has a latent bug in its `pre('save')` hook: it calls `next()` only when the
  OTP is *not* modified, and never calls `next()` on the normal (OTP is
  being set) path — relies entirely on Mongoose's implicit promise-resolution
  behavior for async hooks, which is fragile and worth fixing/simplifying
  regardless of the wider migration.
- New engineers need to understand two different persistence paradigms to
  safely change a single model.

**Recommendation**: phase out the adapter by migrating models to native
Prisma calls one at a time (start with low-traffic models), verifying each
with the existing Jest suite plus manual smoke tests, rather than a single
big-bang rewrite.

## 2. Establish real `prisma migrate` history

`backend/package.json`'s `build` script currently runs
`prisma generate && prisma db push --accept-data-loss` directly against the
database on every deploy. There is no `backend/prisma/migrations/` directory
at all — `schema.prisma` is pushed straight to the DB with no history, no
review step, and no rollback path. Any future breaking change (making a
column non-nullable, renaming/dropping a field) can silently drop data on
deploy.

**Recommendation**: run `prisma migrate dev` locally against a copy of the
current schema to generate a baseline migration, verify it's a no-op against
production, then switch the deploy pipeline to `prisma migrate deploy` and
require schema changes to go through a generated migration file from then on.

## 3. Standardize controller error handling

`backend/middleware/errorMiddleware.js` provides a centralized `errorHandler`
that normalizes error responses to `{ success, code, message, stack }`, and
most controllers reach it correctly via `catchAsync` + `throw`. However:
- `classController.js` and `leadController.js` wrap every handler body in a
  redundant manual `try/catch(error) { next(error) }` even though
  `catchAsync` already does this — harmless but adds noise.
- Some handlers in those same files return raw `res.status(x).json({message})`
  directly instead of throwing, bypassing the centralized formatter — so two
  different error-response shapes coexist across the API depending on which
  controller you hit.

**Recommendation**: standardize all controllers on `catchAsync` + `throw new
Error(...)` (or a custom `AppError`), remove the redundant manual try/catch
wrappers, and replace hand-rolled `res.json({message})` error responses with
thrown errors so every endpoint returns the same shape.

## 4. Standardize frontend error/notification UX

Several pages (`Leads.jsx`, `Members.jsx`, `Classes.jsx`, `MemberClasses.jsx`)
use blocking `alert()`/`window.confirm()` for errors and confirmations, while
`MemberDashboard.jsx` and others use the toast system
(`frontend/src/components/ui/Toast.jsx`). This is an inconsistent UX across
the app.

**Recommendation**: migrate remaining `alert()`/`window.confirm()` call sites
to the toast system (and a proper confirm-dialog component for destructive
actions), page by page.

## 5. Lead → Member conversion silent failure

`frontend/src/pages/Members.jsx` — if creating a member from a converted lead
succeeds but the follow-up `PUT /leads/:id` (marking the lead "Converted")
fails, the error is only `console.error`'d with no user-facing feedback,
leaving the member created but the lead still showing its old status with no
visibility to the operator.

**Recommendation**: surface this failure via toast (e.g. "Member created, but
we couldn't update the lead — please mark it Converted manually") and/or add
a retry affordance.

## 6. Misc lint findings to clean up

Caught by `npm run lint` in `frontend/` but not part of the 2026-08-17 pass:
- Unused variables in `frontend/src/pages/Members.jsx` (dead status-count
  calculations from an earlier iteration).
- `react-hooks/exhaustive-deps` / `react-hooks/set-state-in-effect` issues in
  `frontend/src/pages/Settings.jsx` and
  `frontend/src/pages/superadmin/AdminManagement.jsx`.

## 7. `flow.md` portal-gateway spec is unimplemented

`flow.md` describes a pre-login "Gateway Selector" screen (Staffs & Partners
/ H4 Users / Fitpass Users) for the mobile app. As of this pass,
`App-Code/app/(auth)/landing.tsx` just redirects straight to `/login` — the
gateway screen, portal-aware `useAuth` validation, and `NavigationGuard`
routing described in the spec don't exist yet. Note: `App-Code`'s
`LoginForm.tsx` already has its own portal-selection UI built directly into
the login screen (H4 vs FitPass cards), which may already satisfy the intent
of the spec in a different shape — worth reconciling the doc with the actual
implementation before building the separate `/landing` screen described.
