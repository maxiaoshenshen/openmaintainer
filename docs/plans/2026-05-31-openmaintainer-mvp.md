# OpenMaintainer MVP Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an English-first open-source maintainer workbench that can inspect a public GitHub repository, triage issues, summarize pull requests, draft release notes, and explain repository health.

**Architecture:** A Next.js App Router application provides the dashboard and Route Handlers. Pure TypeScript modules own repository parsing, demo data, deterministic maintainer analysis, and optional OpenAI-powered analysis. The app runs without secrets in demo mode and upgrades when `GITHUB_TOKEN` or `OPENAI_API_KEY` are present.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, GitHub REST API, optional OpenAI Responses API.

---

### Task 1: Project Foundation

**Files:**
- Create: `docs/plans/2026-05-31-openmaintainer-mvp.md`
- Modify: `package.json`
- Create: `.env.example`

**Steps:**
1. Create the Next.js app scaffold.
2. Add Vitest and UI/test dependencies.
3. Add scripts for `test`, `typecheck`, and `validate`.
4. Add environment examples for optional GitHub and OpenAI credentials.
5. Run `npm install`.

### Task 2: Core Maintainer Intelligence

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/demo-data.ts`
- Create: `src/lib/maintainer-analysis.ts`
- Test: `src/lib/maintainer-analysis.test.ts`

**Steps:**
1. Write failing tests for issue classification, PR risk summaries, health scoring, and release note generation.
2. Run tests and confirm failure.
3. Implement deterministic analysis functions.
4. Run tests and confirm pass.

### Task 3: GitHub Adapter

**Files:**
- Create: `src/lib/github.ts`
- Test: `src/lib/github.test.ts`
- Create: `src/app/api/repository/route.ts`

**Steps:**
1. Write failing tests for repository URL parsing and invalid input handling.
2. Implement parser and public GitHub fetcher.
3. Add route handler that returns real GitHub data or demo data.
4. Run tests and lint.

### Task 4: Optional OpenAI Analyzer

**Files:**
- Create: `src/lib/openai-analyzer.ts`
- Create: `src/app/api/analyze/route.ts`

**Steps:**
1. Implement a safe deterministic fallback when `OPENAI_API_KEY` is absent.
2. When credentials exist, call the Responses API with structured JSON intent.
3. Never expose API keys to the client.

### Task 5: Workbench UI

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/dashboard.tsx`

**Steps:**
1. Replace template page with a dense maintainer dashboard.
2. Add repo input, queue, PR review panel, release draft, health cards, and AI assistant rail.
3. Keep visual language utilitarian, international, and readable.
4. Verify text fits desktop and mobile.

### Task 6: OSS Readiness

**Files:**
- Modify: `README.md`
- Create: `LICENSE`
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `SECURITY.md`
- Create: `ROADMAP.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/pull_request_template.md`
- Create: `docs/architecture.md`
- Create: `docs/codex-for-oss-application.md`

**Steps:**
1. Write English-first OSS docs.
2. Include Chinese contributor notes where useful.
3. Add application narrative for Codex for Open Source.

### Task 7: Verification

**Commands:**
- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run dev`

**Expected:** Tests, lint, typecheck, and production build pass. Local dev server renders the dashboard.
