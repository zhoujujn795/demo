# Repository Guidelines

## Project Structure & Module Organization
This repository is currently planning-first and contains one source document: `AI 股票分析面板：用户需求与项目框架.md`.

Implementation should follow the documented target layout:
- `client/`: React + Vite frontend (`src/App.jsx`, `src/api.js`, styles).
- `server/`: Express backend (`routes/`, `services/`, `prompts/`).
- Root files: `.env.example`, `.gitignore`, `README.md`, and top-level `package.json` (optional workspace scripts).

Keep new code inside these boundaries; avoid mixing frontend and backend utilities in one folder.

## Build, Test, and Development Commands
No runnable app scripts are committed yet. When scaffolding, standardize on:
- `npm install` — install root dependencies (or per `client/` and `server/`).
- `npm run dev` — run local development (Vite + API server).
- `npm run build` — production build (frontend assets + server packaging checks).
- `npm test` — run unit/integration tests.

If separate app folders are used, mirror commands in each folder (for example, `cd client && npm run dev`).

## Coding Style & Naming Conventions
Use JavaScript/TypeScript conventions aligned with the spec:
- 2-space indentation, semicolon-consistent style, single quote consistency per formatter.
- `camelCase` for variables/functions, `PascalCase` for React components, `kebab-case` for route files.
- Service names should be explicit: `stockService`, `llmService`, `supabaseService`.

Adopt `eslint` + `prettier` early and run formatting before commits.

## Testing Guidelines
Test coverage should focus on core flows:
- API success/failure paths: `/api/analyze`, `/api/history`.
- LLM JSON validation and parse hardening.
- Input validation (empty symbol, uppercase normalization).

Recommended naming:
- Frontend tests: `*.test.jsx` under `client/src/`.
- Backend tests: `*.test.js` under `server/tests/`.

## Commit & Pull Request Guidelines
Local git history is not available in this workspace yet; use Conventional Commits by default:
- `feat: add analyze endpoint`
- `fix: handle invalid llm json`

PRs should include:
- Clear summary of behavior changes.
- Linked issue/task (if available).
- API examples or UI screenshots for user-visible changes.
- Notes on env vars, deployment impact, and manual verification steps.

## Security & Configuration Tips
Never commit real secrets. Keep `.env` local and commit only `.env.example`.  
Validate required keys at server startup (stock API, LLM API, Supabase) and fail fast with actionable errors.
