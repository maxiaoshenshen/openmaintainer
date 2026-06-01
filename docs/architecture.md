# Architecture

OpenMaintainer is split into four layers.

## 1. UI

`src/components/dashboard.tsx` is a client component that renders the maintainer cockpit. It owns repository input, maintainer settings, loading states, language switching, and calls to route handlers.

## 2. Route handlers

`src/app/api/repository/route.ts` accepts a repository input, optional previous snapshot, optional maintainer settings, and returns repository data plus deterministic analysis.

`src/app/api/analyze/route.ts` accepts repository data plus optional maintainer settings and returns either OpenAI-backed analysis or deterministic fallback analysis.

## 3. Core logic

`src/lib/maintainer-analysis.ts` contains pure TypeScript logic for:

- Issue category and priority
- Suggested labels
- Maintainer reply drafts
- Pull request review summaries
- Repository health score
- OSS readiness checks
- Repository quality signals for queue age, label coverage, and review load
- Maintainer settings for quality thresholds, release cadence, and preferred labels
- Trend memory that compares the current analysis with a previous snapshot
- Browser-local snapshot storage for repeat inspections without a backend database
- Snapshot import/export as a portable JSON bundle with schema versioning
- Similar issue clusters
- Copyable maintainer actions for GitHub workflow handoff
- Safe GitHub CLI commands that require maintainer execution
- Repository playbooks that organize actions into daily, weekly, and release rhythms
- Weekly maintainer digest with priorities, deferrals, and release readiness
- Release note drafts

This layer is tested with Vitest and must stay usable without network access.

## 4. Adapters

`src/lib/github.ts` parses repository inputs and fetches public GitHub repository data.

`src/lib/openai-analyzer.ts` calls the OpenAI Responses API when `OPENAI_API_KEY` exists. It falls back to deterministic analysis on missing credentials or provider failure.

## CI

`.github/workflows/ci.yml` runs `npm run validate` on pull requests and pushes to `main`.

## Design constraints

- No client-side access to secrets
- Demo mode must remain functional
- AI output is advisory, not authoritative
- English is the primary product language
- Chinese compatibility should improve access without fragmenting the product
