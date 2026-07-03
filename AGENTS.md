# Zippy Digital Solutions — Engineering Standard v1.1 (July 2026)

> **This file is read by AI coding assistants (Claude, Gemini, Copilot, Cursor, etc.) before generating code in this repository.**
> Every file, folder, component, and API endpoint you produce MUST follow the rules below. If a request conflicts with these rules, flag it — don't silently deviate.

**Applies to:** FitPrime, AIMIND CRM, Plenora, and any future Zippy Digital Solutions product built in this repo.

**Stack:** Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis + BullMQ (backend), React + Vite + TanStack (web), React Native + Expo (mobile).

---

## 1. Core Principles (non-negotiable)

1. **Feature-based, not type-based at the top level.** Group by domain (e.g. `gyms`, `bookings`, `users`), not by dumping everything into one giant `components/` or `routes/` folder.
2. **Separation of concerns.** UI never talks directly to the database. Business logic never lives inside a React component. Every layer has one job.
3. **One file, one responsibility.** If a file does more than one clear thing, split it.
4. **File size limit as a smell test.** If a file crosses ~200–250 lines, that's a signal to split it — not a hard rule, but stop and ask "does this file do too much?"
5. **No magic numbers/colors/strings.** Everything comes from a constants/tokens file.
6. **Design for the next feature, not just this one.** Before writing a module, ask: "if I need to add X next month, will this structure survive it, or will I have to rewrite it?"

---

## 2. Backend Folder Structure (Node/Express/Prisma)

```
src/
  modules/                    # one folder per domain/feature
    auth/
      auth.controller.ts      # handles req/res only
      auth.service.ts         # business logic
      auth.routes.ts          # route definitions
      auth.validation.ts      # zod/joi schemas
      auth.types.ts           # TS interfaces/types
      auth.test.ts
    gyms/
      gyms.controller.ts
      gyms.service.ts
      gyms.routes.ts
      gyms.validation.ts
      gyms.types.ts
    bookings/
      ...same pattern
  jobs/                       # BullMQ workers/queues
    email.worker.ts
    checkin-expiry.worker.ts
  middlewares/
    auth.middleware.ts
    error-handler.middleware.ts
    rate-limit.middleware.ts
  lib/                        # shared infra (db client, redis client, logger)
    prisma.ts
    redis.ts
    logger.ts
    errors/
      app-error.ts
      not-found.error.ts
      validation.error.ts
      unauthorized.error.ts
      conflict.error.ts
  config/
    env.ts                    # validated env vars (never process.env scattered around)
    constants.ts
  utils/
    async-handler.ts
    pagination.ts
    send-success.ts           # shared response envelope helper
  types/
    express.d.ts              # global type augmentation
  app.ts                      # express app setup
  server.ts                   # entrypoint, listens on port
prisma/
  schema.prisma
  migrations/
```

**Rules:**
- Controllers never contain business logic — they call services and return responses.
- Services never touch `req`/`res` — they're pure business logic, reusable by workers/scripts too.
- Every module exposes its routes via its own `*.routes.ts`, mounted centrally in `app.ts`.
- Validation schemas live next to the module they validate, not in one global file.
- Shared/cross-module code goes in `lib/` or `utils/` — never duplicate logic across modules.

---

## 3. Frontend Folder Structure (React + Vite + TanStack)

```
src/
  features/                   # one folder per feature/domain
    auth/
      components/
        LoginForm.tsx
        SignupForm.tsx
      hooks/
        useAuth.ts
      api/
        auth.api.ts           # TanStack Query calls for this feature
      types.ts
    gyms/
      components/
        GymCard.tsx
        GymList.tsx
        GymFilters.tsx
      hooks/
        useGyms.ts
      api/
        gyms.api.ts
      types.ts
  components/                 # shared, reusable, dumb UI components ONLY
    ui/                       # buttons, inputs, modals, cards — no business logic
      Button.tsx
      Input.tsx
      Modal.tsx
    layout/
      Header.tsx
      Sidebar.tsx
      PageContainer.tsx
  design-system/
    tokens.ts                 # spacing, colors, typography, radii (see section 5)
    theme.ts
  routes/                     # if using file-based or centralized routing
    index.tsx
  lib/
    api-client.ts             # axios/fetch instance, interceptors
    queryClient.ts
  hooks/                      # truly global hooks only (useDebounce, useMediaQuery)
  utils/
    formatters.ts
    validators.ts
  types/
    global.d.ts
```

**Rules:**
- `components/ui/` = dumb, reusable, zero business logic, zero API calls. A `Button` never knows about "bookings."
- `features/*/components/` = smart components tied to a domain, allowed to use hooks/API for that feature.
- Every feature owns its own API layer (`api/*.api.ts`) using TanStack Query — no calling `fetch` directly inside components.
- No file should import three folders deep across features — if two features need to share logic, that logic moves to `lib/` or `hooks/`.

---

## 4. Mobile Folder Structure (React Native + Expo)

Same feature-based philosophy as web, adapted for Expo Router:

```
app/                          # Expo Router screens (file-based routing)
  (tabs)/
    index.tsx
    gyms.tsx
    profile.tsx
  gym/[id].tsx
src/
  features/                   # same pattern as web
    gyms/
      components/
      hooks/
      api/
      types.ts
  components/
    ui/                       # shared native components (Button, Card, etc.)
  design-system/
    tokens.ts                 # SAME spacing/color scale as web where possible
  lib/
    api-client.ts
    storage.ts                # expo-secure-store wrapper
  hooks/
  utils/
```

**Rule:** Keep `app/` screens thin — a screen file just composes feature components, it doesn't contain business logic or big JSX trees itself.

---

## 5. Design System — Spacing, Color, Typography

### 5.1 Spacing (8pt grid — no arbitrary values)
Every margin, padding, and gap must come from this scale. Never hardcode `padding: 13px`.

| Token | Value |
|-------|-------|
| `xs`  | 4px   |
| `sm`  | 8px   |
| `md`  | 16px  |
| `lg`  | 24px  |
| `xl`  | 32px  |
| `2xl` | 48px  |
| `3xl` | 64px  |

- Component internal padding: `sm`–`md` (8–16px)
- Space between related elements (label + input): `xs`–`sm`
- Space between unrelated sections: `xl`–`2xl`
- Screen edge padding (mobile): `md` (16px) minimum, `lg` (24px) for tablets

### 5.2 Color — Warm Amber-Gold Palette (Minimal, Motivating theme)

Every component must reference semantic colors from the design system tokens, never raw hex values directly. The application uses a warm amber-gold theme with a dark premium base.

*   **Theme Specifications**:
    *   `color.brand.primary`: `#F0A020` (Amber / Brand Gold)
    *   `color.brand.primaryDark`: `#D9860F` (Dark Amber / Gold)
    *   `color.brand.primaryLight`: `#FCE6B8` (Soft Amber Tint)
    *   `color.brand.primaryMuted`: `#FBF6EC` (Cream/Soft Amber Card Accent)
    *   `color.background.primary`: `#231D14` (Very dark warm brown-black background)
    *   `color.background.secondary`: `#2D251C` (Dark warm brown card/surface background)
    *   `color.text.primary`: `#FFFFFF` (Pure white for high-contrast titles)
    *   `color.text.secondary`: `#A39686` (Warm muted brown-gray body text to keep contrast comfortable against the amber tints)
    *   `color.text.muted`: `#6D6154` (Muted warm brown-gray for captions)
    *   `color.border.default`: `#3A3025` (Warm brown border)
    *   `color.status.success`: `#2E7D32` (Active Pass - Green)
    *   `color.status.error`: `#C62828` (Expired Session - Red)
    *   `color.status.info`: `#1976D2` (Cooldown - Blue)


### 5.3 Typography scale

| Token     | Size | Weight   | Line-height |
|-----------|------|----------|-------------|
| `display` | 32px | bold     | 1.2         |
| `h1`      | 24px | bold     | 1.3         |
| `h2`      | 20px | semibold | 1.3         |
| `h3`      | 18px | semibold | 1.4         |
| `body`    | 16px | regular  | 1.5         |
| `bodySm`  | 14px | regular  | 1.5         |
| `caption` | 12px | regular  | 1.4         |

### 5.4 Radii & elevation

| Token       | Value | Use case           |
|-------------|-------|---------------------|
| `radius.sm` | 4px   | inputs, chips       |
| `radius.md` | 8px   | cards, buttons      |
| `radius.lg` | 16px  | modals, sheets      |

---

## 6. Mobile Responsiveness & Touch Rules

- **Minimum tap target: 44×44px** (Apple HIG) / 48×48px (Material). Never make a button, icon, or tab smaller than this.
- **Breakpoints (web):** mobile `< 640px`, tablet `640–1024px`, desktop `> 1024px`.
- Design mobile-first: build the mobile layout first, then expand up.
- Bottom-sheet / bottom-nav patterns for mobile web, not hover-dependent menus.
- Forms: stack fields vertically on mobile, no side-by-side inputs under 640px.
- Always test spacing at 375px width (iPhone SE) as the worst case.

---

## 7. Scalability Rules

1. **Barrel exports per feature** (`features/gyms/index.ts`) — import from one clean path.
2. **API versioning from day one**: `/api/v1/...` — never unversioned routes.
3. **Feature flags** (`flags.ts`) — ship half-built features behind a toggle.
4. **Shared types** via `types/` or `@your-app/shared-types` package in monorepos.
5. **Config over hardcoding**: cooldowns, limits, prices go in `config/constants.ts`.
6. **Every new module follows the exact same file pattern** shown in sections 2–4.

---

## 8. Naming Conventions

| What         | Convention                    | Example                              |
|------------- |-------------------------------|--------------------------------------|
| Util/config files   | `kebab-case.ts`        | `api-client.ts`, `async-handler.ts`  |
| Components   | `PascalCase.tsx`              | `GymCard.tsx`, `LoginForm.tsx`       |
| Folders      | `kebab-case` or lowercase     | `bookings/`, `design-system/`        |
| Domain folders | Always plural               | `gyms/` not `gym/`                   |
| Booleans     | prefix `is`/`has`/`should`    | `isLoading`, `hasError`              |
| Functions    | verb-first                    | `getUserById`, `calculateCooldown`   |
| Constants    | `SCREAMING_SNAKE_CASE`        | `MAX_RETRY_COUNT`                    |
| Config objects | `camelCase`                 | `dbConfig`, `redisOptions`           |

---

## 9. API Response Envelope

Every endpoint returns one predictable shape:

```ts
// Success
{ success: true, data: T, meta?: { page: number; pageSize: number; total: number } }

// Error
{ success: false, code: string, message: string }
```

- Use a shared `sendSuccess(res, data, meta?)` helper — controllers never hand-roll `res.json({...})`.
- List endpoints always include `meta.total`.
- Frontend API layer unwraps `.data` once at the query level.

---

## 10. Error Handling (backend)

```ts
// lib/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,          // e.g. "GYM_NOT_FOUND"
    public isOperational = true   // true = expected, false = bug
  ) { super(message); }
}
```

- Services throw typed `AppError` subclasses, never raw strings.
- `error-handler.middleware.ts` is the ONLY place that turns errors into HTTP responses.
- Operational errors → return their message/code. Non-operational → "something went wrong" + log full stack.
- Async handlers wrapped with `async-handler.ts` so errors always reach middleware.

---

## 11. Database Transaction Patterns

- **Simple multi-write** → `prisma.$transaction([...])` array form.
- **Conditional logic between writes** → interactive `prisma.$transaction(async (tx) => { ... })`, passing `tx` everywhere.
- Transactions live inside the service method that owns the operation — never spread across controllers.
- Side effects (email, queue job) happen AFTER the transaction commits, never inside.
- Set reasonable `timeout` on interactive transactions.

---

## 12. Client State Philosophy

| State type                         | Tool                                |
|------------------------------------|-------------------------------------|
| Server data (gyms, bookings, etc.) | TanStack Query — never duplicate    |
| Shared client state (auth, theme)  | Zustand (one store per domain)      |
| Local UI state (modal open, etc.)  | `useState`/`useReducer`             |
| Form state (3+ fields)             | React Hook Form                     |

**Rule:** If closing the screen should reset it → local state. If it survives navigation → Zustand. If it comes from the server → TanStack Query, never mirrored into Zustand.

---

## 13. Testing Strategy

- **Unit tests** (most): test `*.service.ts` in isolation, mock Prisma/Redis.
- **Integration tests** (fewer): test controllers + routes against test DB via Supertest.
- **E2E tests** (fewest): critical flows only — signup, check-in, payments.
- A module isn't "done" until service has tests for happy path + at least one edge case.

---

## 14. Environment & Deployment

- Separate `.env.development`, `.env.staging`, `.env.production` — never one shared `.env`.
- `env.ts` validates and exports typed env vars.
- Environment-specific config keyed by `NODE_ENV` in `config/` — no inline `if (env === 'production')`.
- Dockerize early: `Dockerfile` + `docker-compose.yml` (app + Postgres + Redis).
- CI before merge: lint + typecheck (`tsc --noEmit`) + unit tests.
- Migrations via `prisma migrate` as a deploy step, never manual.

---

## 15. Logging & Observability

- Structured JSON logs (Pino), never `console.log` in production.
- Every request gets a **request ID** (generated in middleware), included in every log line.
- Minimum fields: `timestamp`, `level`, `requestId`, `userId`, `message`. Errors add `stack` + `AppError.code`.
- Log levels: `error` (broken), `warn` (unexpected but handled), `info` (key events), `debug` (dev-only).
- Never log sensitive data (passwords, tokens, payment details).
- BullMQ workers log job start/success/failure with job ID.

---

## 16. Checklist Before Marking a Feature "Done"

- [ ] Business logic is in a service/hook, not inline in a controller/component
- [ ] All spacing uses tokens, no raw px values
- [ ] All colors use semantic tokens, no raw hex
- [ ] Tap targets ≥ 44px on all interactive mobile elements
- [ ] Layout tested at 375px, 768px, and 1440px widths
- [ ] No file exceeds ~250 lines without a good reason
- [ ] New API routes are versioned and validated with a schema
- [ ] Feature folder follows the exact structure in sections 2–4
- [ ] Errors are typed `AppError` subclasses, not raw strings
- [ ] Service has unit tests for happy path + at least one edge case
- [ ] Key events logged with structured fields (requestId, userId, code)

---

## Changelog

- **v1.1 — July 2026**: Added API response envelope standard (§9), database transaction patterns (§11), changelog.
- **v1.0 — July 2026**: Initial version — folder structures, design tokens, error handling, client state, testing, deployment, logging.
