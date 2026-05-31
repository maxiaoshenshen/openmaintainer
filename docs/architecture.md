# Architecture

OpenMaintainer is split into four layers.

## 1. UI

`src/components/dashboard.tsx` is a client component that renders the maintainer cockpit. It owns repository input, loading states, language switching, and calls to route handlers.

## 2. Route handlers

`src/app/api/repository/route.ts` accepts a repository input and returns repository data plus deterministic analysis.

`src/app/api/analyze/route.ts` accepts repository data and returns either OpenAI-backed analysis or deterministic fallback analysis.

## 3. Core logic

`src/lib/maintainer-analysis.ts` contains pure TypeScript logic for:

- Issue category and priority
- Suggested labels
- Maintainer reply drafts
- Pull request review summaries
- Repository health score
- Release note drafts

This layer is tested with Vitest and must stay usable without network access.

## 4. Adapters

`src/lib/github.ts` parses repository inputs and fetches public GitHub repository data.

`src/lib/openai-analyzer.ts` calls the OpenAI Responses API when `OPENAI_API_KEY` exists. It falls back to deterministic analysis on missing credentials or provider failure.

## Design constraints

- No client-side access to secrets
- Demo mode must remain functional
- AI output is advisory, not authoritative
- English is the primary product language
- Chinese compatibility should improve access without fragmenting the product
