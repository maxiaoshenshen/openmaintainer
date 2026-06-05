# OpenMaintainer

[![Tests](https://img.shields.io/badge/Tests-54%20passed-22c55e)](https://github.com/maxiaoshenshen/openmaintainer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000)](https://vercel.com)

**The AI-native workbench that turns OSS maintenance chaos into calm control.**

Every open-source maintainer knows the grind: endless issue triage, PR reviews that pile up, contributors waiting for replies, release checklists that never end. OpenMaintainer is the cockpit that makes it all visible, manageable, and human.

> "Finally, a tool that understands what maintainers actually do." — OSS contributor (anonymized)

![OpenMaintainer dashboard](public/screenshots/dashboard.png)

<!-- Screen recording: https://openmaintainer.vercel.app/demo.mp4 -->

## Live

- **App**: [openmaintainer.vercel.app](https://openmaintainer.vercel.app)
- **Repo**: [github.com/maxiaoshenshen/openmaintainer](https://github.com/maxiaoshenshen/openmaintainer)

## What It Solves

### The Pain Points

| What drains maintainers | What OpenMaintainer does |
|------------------------|-------------------------|
| 200 open issues, 40 need reproduction details | Auto-generates reproduction request kits for incomplete bug reports |
| Contributors blocked for days on simple questions | SLA queue surfaces overdue threads before they become friction |
| Reviewing a 50-comment PR from a stranger | PR review handoff kit gives reviewers a focused briefing in 30 seconds |
| "Which issues should a new contributor start with?" | Contributor starter kit packages approachable issues into ready-to-go task packets |
| Release day anxiety — what am I forgetting? | Release readiness gate blocks unsafe releases with explicit blockers and warnings |
| Every maintainer has their own tribal knowledge | Public status brief shares maintainer state with contributors proactively |

### Three Things That Make It Different

1. **Maintainer stays in charge.** Every label, reply, review, and release decision is human-approved. AI output is a draft, not a decree.

2. **No credentials required to start.** Demo mode works out of the box. Add a GitHub token for higher API limits. Add an OpenAI key for model-backed analysis. Or don't — the deterministic fallback is useful on its own.

3. **One cockpit, not ten tabs.** GitHub doesn't give you a maintainer cockpit. OpenMaintainer does: inbox, impact queue, SLA tracker, release gate, focus plan, digest, and CLI commands — all in one place.

## Quick Start

```bash
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter `demo` or any public GitHub repository like `vercel/next.js`.

### Optional Credentials

```bash
cp .env.example .env.local
# Add GITHUB_TOKEN for higher rate limits
# Add OPENAI_API_KEY for model-backed analysis
```

For a maintainer-focused walkthrough, see [Maintainer Quickstart](docs/maintainer-quickstart.md).

## Features

### Inspection & Analysis
- Repository inspection for any public GitHub repo
- Deterministic issue triage (works without API keys)
- Optional OpenAI-powered structured analysis
- Repository health score and quality signals
- OSS readiness checklist
- Trend memory: compare current state with previous snapshot

### Contributor Queue
- **Impact queue**: Which contributors are blocked and what unblocks them
- **SLA tracker**: Overdue threads, at-risk maintainer responses
- **Reproduction kit**: Auto-generated comments requesting missing details
- **Starter kit**: Approachable issues packaged for first-time contributors
- **Unblock kit**: Copyable replies and GitHub CLI commands to resolve friction
- **Reply outbox**: All contributor replies in one copyable send queue

### Review Desk
- PR review summaries with risk indicators
- Review handoff kit: focus areas, validation steps, GitHub CLI commands
- Decision log: auditable record of ready/review/blocked actions

### Release Cockpit
- Release readiness gate: go/no-go with explicit blockers and warnings
- Weekly digest with priorities and deferrals
- Release note draft generator
- Ownership routing: who owns release, triage, review, and safety

### Maintenance Rhythm
- Daily/weekly/release playbooks
- Command queue: staged GitHub CLI batches behind human approval
- Focus plan: top 3 daily priorities from release gate, SLA, review handoff, and commands
- Public status brief for GitHub Discussions, pinned issues, or README updates
- Codex for Open Source application packet (for maintainers seeking funding)

### Integrations
- GitHub CLI handoff commands
- Snapshot import/export for team collaboration
- Local settings store per repository
- English / 中文 interface switch

## Architecture

```
src/
  app/              # Next.js App Router — UI and API routes
  components/
    dashboard.tsx   # The maintainer cockpit (2700+ lines, fully interactive)
  lib/
    maintainer-analysis.ts    # Core triage, PR review, health, release notes
    maintainer-command-queue.ts # Staged GitHub CLI execution queue
    response-sla.ts           # Contributor thread SLA ranking
    repro-kit.ts              # Reproduction request generator
    contributor-starter-kit.ts # First-contribution task packet builder
    pr-review-handoff.ts      # PR review briefing generator
    release-readiness-gate.ts  # Release go/no-go gate
    maintainer-focus-plan.ts  # Daily focus plan generator
    contributor-status-brief.ts # Public status brief generator
    contributor-reply-outbox.ts # Unified reply send queue
    maintainer-decision-log.ts  # Auditable decision record
    maintainer-ownership-routing.ts # Role-based handoff router
    github.ts              # GitHub API client
    openai-analyzer.ts     # OpenAI Responses API integration
    types.ts               # Shared TypeScript types
```

## Testing

```bash
npm run test       # 54 tests, 24 test files
npm run lint
npm run typecheck
npm run build
npm run validate   # CI gate: test + lint + typecheck + build
```

## Evaluator & Launch Materials

- [Maintainer Quickstart](docs/maintainer-quickstart.md): how an OSS maintainer can use the workbench in 10 minutes.
- [Launch Checklist](docs/launch-checklist.md): repository, deployment, trust, and community launch readiness.
- [OpenAI Pro Reward Application](docs/openai-pro-application.md): application packet for the OpenAI Pro reward.
- [Codex for OSS Application](docs/codex-for-oss-application.md): support narrative for OSS-focused programs.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
