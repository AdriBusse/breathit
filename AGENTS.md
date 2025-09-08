# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: App Router pages, layouts, and styles (`globals.css`).
- `public/`: Static assets served at the root (e.g., `/favicon.ico`).
- `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`: Tooling and build config.
- Use the `@/*` alias (see `tsconfig.json`) for imports, e.g., `import x from "@/lib/x"`.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js in dev mode (Turbopack) at `http://localhost:3000`.
- `npm run build`: Create a production build.
- `npm start`: Run the production server.
- `npm run lint`: Run ESLint with Next.js rules.

## Coding Style & Naming Conventions
- TypeScript strict mode is enabled; prefer explicit types on public APIs.
- Indentation: 2 spaces; keep files UTF‑8, LF line endings.
- React components: PascalCase (`BreathTimer.tsx`); hooks/utilities: camelCase (`useBreathing.ts`).
- Routes and files inside `app/`: folder-based routing; prefer kebab-case for route segments.
- Default to Server Components; add `"use client"` only when interactivity is required.
- Styling: Tailwind CSS (via PostCSS). Co-locate small component styles; keep globals in `src/app/globals.css`.

## Testing Guidelines
- No test runner is configured yet. Recommended: Vitest + React Testing Library for unit tests; Playwright for e2e.
- Place unit tests next to source as `*.test.ts`/`*.test.tsx` or under `src/__tests__/`.
- Aim for meaningful coverage of critical logic (timers, state, and interaction handlers).
- Example (after adding Vitest): `npx vitest run` or `npm test`.

## Commit & Pull Request Guidelines
- Commits: clear, imperative subject; scope when helpful. Conventional style encouraged, e.g., `feat(timer): add inhale/exhale phases`.
- PRs: include summary, rationale, and screenshots/GIFs for UI changes; link related issues; note breaking changes and manual steps.
- Keep PRs focused and small; add `README`/docs updates when behavior changes.

## Security & Configuration Tips
- Store secrets in `.env.local` (never commit); access via `process.env` and Next.js runtime config.
- Validate user input and avoid leaking env values to the client bundle; use Server Components or API routes for sensitive logic.
