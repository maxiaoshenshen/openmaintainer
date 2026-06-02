# Architecture

OpenMaintainer is split into four layers.

## 1. UI

`src/components/dashboard.tsx` is a client component that renders the maintainer cockpit. It owns repository input, maintainer settings, loading states, language switching, and calls to route handlers.

## 2. Route handlers

`src/app/api/repository/route.ts` accepts a repository input, optional previous snapshot, optional maintainer settings, and returns repository data, deterministic analysis, contributor impact, the evidence pack, the contributor unblock kit, the response SLA queue, the reproduction request kit, the contributor starter kit, and the pull request review handoff kit.

`src/app/api/analyze/route.ts` accepts repository data plus optional maintainer settings and returns either OpenAI-backed analysis or deterministic fallback analysis.

`src/app/api/inbox/route.ts` accepts a pasted list of GitHub repositories and returns a multi-repository maintainer inbox. It uses demo portfolio data when no valid repositories are provided, so the workflow remains usable without credentials.

## 3. Core logic

`src/lib/inbox-input.ts` normalizes multiline, comma-separated, and GitHub URL repository lists for the live inbox builder.

`src/lib/maintainer-inbox.ts` ranks multiple repositories by maintainer pain using issue load, review age, readiness gaps, health score, and available next actions.

`src/lib/contributor-impact.ts` converts issues and pull requests into a contributor-facing unblock queue, ranking who is waiting and which maintainer action will help them move.

`src/lib/response-sla.ts` ranks contributor threads against maintainer response targets, showing overdue, at-risk, and on-track waits.

`src/lib/repro-kit.ts` converts incomplete bug reports into contributor-friendly reproduction checklists, maintainer comment drafts, and GitHub CLI comment commands.

`src/lib/contributor-starter-kit.ts` converts approachable issues into first contribution task packets with branch names, acceptance criteria, PR checklists, and maintainer guidance comments.

`src/lib/pr-review-handoff.ts` converts risky pull requests into focused review handoff packages with validation steps, maintainer commands, and contributor-visible review comments.

`src/lib/unblock-kit.ts` converts blocked contributor impact into a copyable maintainer execution package with reply drafts and GitHub CLI commands.

`src/lib/maintainer-command-queue.ts` stages maintainer actions into a prioritized GitHub CLI command queue with review gates for close and release commands.

`src/lib/oss-evidence.ts` turns repository analysis and contributor impact into a Codex for Open Source evidence pack, including a form-ready application packet with official field answers and 500-character answer limits.

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
- Browser-local maintainer settings storage keyed by repository
- Similar issue clusters
- Duplicate cleanup actions that draft canonical-thread comments and safe close commands
- Stale issue follow-up actions based on maintainer response thresholds
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
