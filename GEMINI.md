# Gemini Instructions — GYM-CRM Monorepo

Read and follow `./AGENTS.md` before writing any code. It contains the Zippy Digital Solutions Engineering Standard v1.1.

## Project Layout
- `backend/`   — Node.js + Express + Prisma (see AGENTS.md §2)
- `frontend/`  — React + Vite + TanStack (see AGENTS.md §3)
- `App-Code/`  — React Native + Expo mobile app (see AGENTS.md §4 + App-Code/AGENTS.md)

## Non-negotiables
- Feature-based folder structure, not type-based
- **Design Theme:** Use the premium **Warm Amber-Gold Palette** (Primary: `#F0A020`/`#D9860F`, BG: `#231D14`, Body text: Warm muted brown-gray `#A39686`, Success: Active Pass green, Error: Expired Session red).
- All spacing/colors/typography from design tokens — no magic values
- Controllers = req/res only, Services = business logic only
- API versioning (`/api/v1/...`) from day one
- Typed errors (`AppError` subclasses), never raw strings
- Structured JSON logging with request IDs

