# Mobile App (React Native + Expo) — Agent Instructions

> **Inherits from:** `../AGENTS.md` (root engineering standard v1.2). Read that FIRST — this file only adds mobile-specific rules.

## Project Setup — Do This Before Any Feature Work

**If any of the files below don't already exist in the repo, create them FIRST, before writing any screen, component, or feature.** Rules 2, 3, 6, 7, and 12 in this document are only real if something enforces them — otherwise they're just text an agent or a tired human can talk themselves past under deadline pressure. Don't start on the actual task until this step is done.

1. **Check for `.eslintrc.js` (or `.eslintrc.json`) and `.dependency-cruiser.js` at the repo root.**
2. **If `.eslintrc` exists but lacks these, add them:**
   - `eslint-plugin-import` with `import/no-cycle: 'error'` — catches circular imports (rule 12) at lint time instead of at Metro's runtime `Require cycle` warning.
   - A scoped `no-restricted-imports` override that blocks a feature file from importing its own barrel via relative self-reference, WITHOUT blocking legitimate cross-feature barrel imports:
     ```js
     // .eslintrc.js
     overrides: [
       {
         files: ["src/features/**/*.{ts,tsx}"],
         excludedFiles: ["src/features/*/index.ts"],
         rules: {
           "no-restricted-imports": ["error", {
             patterns: [{
               group: ["./index", "../index", "../../index"],
               message: "Import sibling files inside this feature directly, not through this feature's own index.ts barrel. Barrels are for other features/screens to consume, not internal use."
             }]
           }]
         }
       }
     ]
     ```
     A naive pattern matching `src/features/*` broadly (rather than scoping to relative self-imports) will also block valid cross-feature imports through another feature's barrel — the scoping above is what makes it match only self-references. For a more scalable version of the same idea across a larger codebase, `eslint-plugin-boundaries` lets you declare allowed dependencies between element types (`feature`, `ui`, `lib`) explicitly instead of relying on relative-path pattern matching.
3. **If `.dependency-cruiser.js` doesn't exist, create it** with rules encoding the architecture, not just prose:
   - `app/` may not be imported by anything in `src/` (routes are leaves, never dependencies).
   - `src/features/{X}/**` may not import `src/features/{Y}/**` directly — only via `src/features/{Y}/index.ts`.
   - `src/components/ui/**` may not import from `src/features/**` (dumb components stay dumb).
   - No circular dependencies anywhere in `src/`.
4. **Add both to CI** (`.github/workflows/ci.yml`, per root section 14) as required checks — `eslint .` and `depcruise src` — so a violation blocks the merge, not just the local dev server.
5. **Confirm both run clean** (`npx eslint .` and `npx depcruise src`) before starting the first feature. If the repo is pre-existing and already has violations, flag them to the person rather than silently fixing or ignoring them — bulk auto-fixing an unfamiliar codebase's import graph can break things in ways that are hard to trace back.

Once these exist and pass, proceed with the folder structure and rules below as normal — they're now enforced, not just documented.

## Tech Stack

- **Framework:** React Native + Expo SDK 57
- **Routing:** Expo Router (file-based)
- **Language:** TypeScript (strict mode)
- **State:** TanStack Query (server), Zustand (client), React Hook Form (forms)
- **Docs:** https://docs.expo.dev/versions/v57.0.0/

## Folder Structure (Section 4 of root AGENTS.md)

```
app/                          # Expo Router screens — THIN, compose feature components only
  (tabs)/
    index.tsx
    gyms.tsx
    profile.tsx
  gym/[id].tsx
  _layout.tsx
src/
  features/                   # one folder per domain
    auth/
      components/
      hooks/
      api/
      types.ts
      index.ts                # barrel export
    members/
      components/
      hooks/
      api/
      types.ts
      index.ts
    dashboard/
      ...same pattern
  components/
    ui/                       # shared dumb components (Button, Card, Input, Typography, etc.)
    layout/                   # SafeAreaWrapper and other screen-level containers
  design-system/
    tokens.ts                 # spacing, colors, typography, radii — from section 5
    theme.ts                  # light/dark theme objects
  lib/
    api-client.ts             # axios/fetch instance with auth interceptor
    storage.ts                # expo-secure-store wrapper
    query-client.ts           # TanStack Query client config
    errors/                   # AppError hierarchy shared with backend conventions (section 10)
  hooks/                      # truly global hooks (useDebounce, useAppState, etc.)
  utils/
    formatters.ts
    validators.ts
  types/
    navigation.d.ts
```

## Mobile-Specific Rules

1. **Screen files in `app/` must be thin.** They import and compose components from `src/features/`. No business logic, no long JSX trees, no API calls in screen files.
2. **All spacing from `tokens.ts`.** Never `marginTop: 13` — use `spacing.md` (16).
3. **All colors from `tokens.ts` (Warm Amber-Gold Palette).** Never use raw hex codes (like `#333`). Ensure the visual styling uses the premium warm amber-gold theme (BG: `#231D14`, Primary Brand: `#F0A020`/`#D9860F`, Tint: `#FCE6B8`, Muted body text: `#A39686`).
4. **Minimum tap target: 44×44px.** Pad smaller icons to meet this.
5. **Use `expo-secure-store`** for auth tokens, never AsyncStorage.

6. **API client** lives in `src/lib/api-client.ts` — auto-attaches auth token from secure store, handles token refresh, and unwraps the `{ success, data, meta }` envelope (root section 9) so feature `api/` files work with plain typed data.
7. **No inline styles over 3 properties.** Use `StyleSheet.create()` at file bottom, referencing tokens.
8. **Test at 375px width** (iPhone SE) as baseline.
9. **`SafeAreaWrapper` is the default, not a hard rule.** Most screens use it as-is. For edge-to-edge UI (full-bleed hero images, camera views, transparent modals), use `SafeAreaWrapper` in `edges={['bottom']}` or `edges={[]}` mode — it's a thin wrapper around `useSafeAreaInsets()` that lets you apply insets selectively (e.g. push only the bottom nav down, let the header bleed under the status bar) instead of an all-or-nothing container. The rule is "know your insets and apply them on purpose," not "always pad everything."
10. **Zero unwrapped string primitives — in your own code.** Always go through `src/components/ui/Typography.tsx` for text you write. Third-party components (calendars, bottom sheets, charts) render their own internal `<Text>` and won't use your tokens — don't fight this with global overrides. Instead, wrap the third-party component once in `src/components/ui/vendor/` (e.g. `VendorCalendar.tsx`), pass its own theme/style props to match your tokens at the API level it exposes, and consume the wrapper everywhere instead of the raw library. One place absorbs the mismatch instead of it leaking through the app.
11. **Errors thrown by API calls should be typed**, matching the `AppError`/`code` shape from the backend (root section 10), so UI error states can branch on `code` instead of parsing message strings.
12. **Barrel exports (`index.ts`) are for cross-feature and screen consumption only — never import a barrel from inside its own feature.** Files inside `features/gyms/` import each other directly (`./components/GymCard`), not via `features/gyms/index.ts`. This is what actually causes Metro's `Require cycle` warnings — a barrel re-exporting something that then gets imported by a sibling file through the same barrel. Cross-feature imports (e.g. `gyms` needing something from `auth`) go through the other feature's barrel (`from '@/features/auth'`), never reaching into its internal files directly — this keeps the dependency direction one-way and visible. If two features end up needing each other's barrels, that's a signal the shared piece belongs in `lib/` or `hooks/`, not in either feature.

## Pragmatic Exceptions (read before treating any rule as absolute)

- **Simple, single-use, static screens** (an "About" screen, a static Terms page) don't need the full `components/` + `hooks/` + `api/` + `types.ts` + `index.ts` skeleton. One file — `src/features/settings/components/AboutView.tsx` — composed into a thin `app/` route is fine. The full feature structure is for anything with state, API calls, or more than ~2 sub-components. Don't build scaffolding a screen will never grow into.
- **Full-bleed / immersive screens** use `SafeAreaWrapper` with explicit `edges` rather than skipping it — see rule 9. The goal was never "pad everything," it was "never guess wrong about the notch." Selective edges achieves that without blocking hero images or camera views.
- **Third-party UI text** is expected to look slightly different from your tokens unless the library exposes a theme API — that's a vendor-wrapper problem (rule 10), not a reason to abandon `Typography.tsx` for your own text.
- When a rule and a real deadline conflict on a genuinely one-off screen, breaking the rule locally with a `// TODO: revisit structure` comment beats blocking shipping — just don't let "one-off" quietly become the pattern for the next five screens.

> **AI agent restriction:** the deadline exception above is a human judgment call, not something an agent gets to invoke on its own. If you are an AI agent (Claude Code, Cursor, or similar) working from this file: you may NOT use `// TODO: revisit structure`, `// TODO: fix later`, or any equivalent escape hatch to bypass a rule in this document — including when a task looks stuck, a type error is hard to resolve, or a deadline is mentioned in the prompt. If you hit a genuine conflict between a rule and the task (e.g. rule 12 makes a needed import impossible, or the API envelope in rule 6 doesn't match what a real endpoint returns), stop and surface the conflict to the person instead of silently working around it with a TODO. This exception exists for a human to invoke explicitly, not for an agent to reach for under pressure.

## Naming (from Section 8)

- Components: `PascalCase.tsx` (`GymCard.tsx`)
- Hooks: `camelCase.ts` prefixed with `use` (`useAuth.ts`)
- API files: `kebab-case.api.ts` (`auth.api.ts`)
- Utils/config: `kebab-case.ts` (`api-client.ts`)
- Domain folders: always plural (`members/`, `gyms/`)

## When Adding a New Feature

**Full feature** (has state, API calls, or 3+ sub-components):
1. Create folder: `src/features/{feature-name}/`
2. Add subfolders: `components/`, `hooks/`, `api/`
3. Add `types.ts` and `index.ts` (barrel export)
4. Add thin screen in `app/` that composes feature components
5. Every screen wraps content in `SafeAreaWrapper` (with appropriate `edges`); every text node uses `Typography`
6. Follow the exact same pattern as existing features
7. Import sibling files inside the feature directly, never via its own barrel (rule 12)

**Simple/static screen** (no state, no API, 1-2 sub-components):
1. Single component file under the closest relevant feature's `components/` (or `src/features/misc/components/` if it doesn't belong anywhere)
2. Thin screen in `app/` that renders it
3. No `hooks/`, `api/`, `types.ts`, or `index.ts` required — add them later if the screen grows

## Definition of Done (mobile-specific, in addition to root checklist)

- [ ] Screen file in `app/` contains no business logic or API calls — only composition
- [ ] All spacing/colors reference `tokens.ts`, zero hardcoded values
- [ ] All tap targets ≥ 44×44px
- [ ] Every screen wrapped in `SafeAreaWrapper` with intentional `edges`, not a raw `View`
- [ ] All visible text (your own code) goes through `Typography`; third-party text is isolated behind a vendor wrapper
- [ ] Cross-feature imports go through the target feature's barrel; no feature imports its own barrel internally
- [ ] Auth tokens read/written via `expo-secure-store`, never AsyncStorage
- [ ] Verified at 375px width (iPhone SE)