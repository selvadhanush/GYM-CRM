# Claude Instructions

Read and follow the engineering standard in `../AGENTS.md` (root) and `./AGENTS.md` (mobile-specific) before writing any code.

## Quick Reference
- **Stack:** React Native + Expo SDK 57 + TypeScript
- **Standard:** Zippy Digital Solutions Engineering Standard v1.1
- **Docs:** https://docs.expo.dev/versions/v57.0.0/
- **Structure:** Feature-based (`src/features/`) + thin Expo Router screens (`app/`)
- **Design tokens:** All spacing, colors, typography from `src/design-system/tokens.ts` using the premium **Warm Amber-Gold Palette** (Primary: `#F0A020`/`#D9860F`, Background: `#231D14`, Muted body text: `#A39686`, Success: green, Error: red).
- **State:** TanStack Query (server) | Zustand (client) | React Hook Form (forms)
- **Naming:** PascalCase components, camelCase hooks, kebab-case utils, plural domain folders

