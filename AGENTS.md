# Repository Guidelines
1. 不要使用 window.open
2. 有关需求的修改，请完善到prd文档中

## Project Structure & Module Organization
- Root: `manifest.json`, `package.json`, build config; keep MV3 permissions minimal.
- `src/content/`: detect inputs, inject floating button and input-side UI.
- `src/background/`: message routing, AI/model calls, storage writes.
- `src/popup/`: React + Tailwind UI for card-style suggestions and actions.
- `src/storage/`: `chrome.storage.local` wrapper, schema/version utilities.
- `src/assets/`: icons, images, static assets.
- `test/`: unit/integration and supporting scripts; mirror source structure where possible.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start dev servers for popup/content/background with hot reload.
- `npm run build`: produce `dist/` for MV3 zip/crx packaging.
- `npm run lint`: ESLint + Tailwind/classnames linting.
- `npm run format`: Prettier formatting.
- `npm test`: Jest/@testing-library suite.
- `npm run test:e2e`: Playwright or equivalent end-to-end flow.

## Coding Style & Naming Conventions
- TypeScript + React, 2-space indentation, `strict` enabled; prefer typed Chrome API wrappers/hooks, avoid `any`.
- Naming: camelCase for vars/functions, PascalCase for components/types, kebab-case for files/dirs.
- Tailwind: use theme tokens for color/radius/shadow; avoid ad-hoc values.
- Keep modules small and separated by feature (content vs background vs popup vs storage).

## Testing Guidelines
- Write unit/UI tests near sources or under `test/` as `*.test.ts[x]`.
- Mock `chrome.*` APIs; avoid real network in tests.
- Cover key flows: input analysis, message passing, storage reads/writes, popup rendering, phrasebook interactions.
- Run `npm test` before PR; add `npm run test:e2e` for regressions in critical flows.

## Commit & Pull Request Guidelines
- Commits: `type: summary` (e.g., `feat: add popup sentence cards`).
- PRs: short description, linked issue, screenshots/recordings for UI, note regression risks and any permission changes.

## Security & Configuration Tips
- Keep `permissions` and `host_permissions` minimal; remove unused entries.
- Store API keys/secrets in `.env.local` or build-time vars; commit only placeholders.
- Data flow: content -> background (AI + storage) -> popup reads via storage API; keep messages schema-stable.
- Plan storage migrations for `chrome.storage.local`/IndexedDB when schemas evolve.
