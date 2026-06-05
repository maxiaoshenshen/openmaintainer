# OpenAI Pro Reward Application — OpenMaintainer

## Applicant

- **Name**: Xiao Shen (马晓申)
- **GitHub**: [@xiaoshenshen](https://github.com/maxiaoshenshen)
- **Project**: [openmaintainer](https://github.com/maxiaoshenshen/openmaintainer)
- **Live**: [openmaintainer.vercel.app](https://openmaintainer.vercel.app)
- **Email**: (contact via GitHub)

## How OpenMaintainer Helps Open-Source Maintainers

Open-source maintainers are the backbone of modern software infrastructure. Yet the tools they rely on — GitHub Issues, PR review queues, release checklists — are scattered, manual, and relentless. OpenMaintainer gives them a cockpit.

### Real Problems Solved

| Pain point | What we built |
|---|---|
| "I have 200 open issues — which should I prioritize?" | Deterministic triage queue + AI copilot analysis |
| "A contributor has been waiting 5 days for a reply" | SLA queue surfaces overdue threads automatically |
| "I keep forgetting to ask for reproduction steps" | Auto-generated reproduction request kits |
| "How do I turn approachable issues into first-contribution tasks?" | Contributor starter kit |
| "Release day — what am I forgetting?" | Release readiness gate with explicit blockers and warnings |
| "My contributors don't know what's going on" | Public status brief for GitHub Discussions / README |

### Who It's For

- Individual OSS maintainers managing popular repositories
- Small teams sharing maintenance load
- Open-source projects seeking funding through Codex for Open Source
- Maintainers applying for OpenAI Pro reward through the Codex program

### What Sets It Apart

1. **Zero-setup demo mode** — Works immediately, no API keys required. Useful before credentials are added.
2. **Deterministic fallback** — Core triage and quality signals work purely from local logic. No LLM dependency.
3. **Maintainer agency** — Every action is human-approved. AI output is a draft, not an automatic decision.
4. **Bilingual by design** — English primary, Chinese path available. Targets global OSS community first.

## Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (100% typed)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest — 54 tests, 24 test files
- **CI**: GitHub Actions (test + lint + typecheck + build gate on every push)
- **Deployment**: Vercel

## Evidence of Impact

- 20+ maintainer workflow features shipped in 5 days
- 54 passing tests with 100% CI validation
- Live production deployment at openmaintainer.vercel.app
- Demo mode enables instant try-without-credentials experience
- Deterministic triage works for any public GitHub repository
- Codex for Open Source application packet built-in for maintainers seeking funding

## Why This Qualifies for OpenAI Pro

OpenMaintainer was built with AI-native tooling (Codex/Claude) from day one. The project demonstrates that:

1. **High-complexity, full-stack application** built end-to-end with AI assistance
2. **Solving a real, underserved need** — OSS maintainer tooling is an underexplored category
3. **Production-quality engineering** — 54 tests, type safety, CI/CD, semantic versioning
4. **AI helping AI** — The tool that helps maintainers is itself maintained with AI
5. **Global-first design** — English primary, bilingual interface, worldwide accessibility

## Links

- Live app: https://openmaintainer.vercel.app
- GitHub: https://github.com/maxiaoshenshen/openmaintainer
- CI/CD: `.github/workflows/` in repository
- Tests: `src/lib/*.test.ts` and `src/components/*.test.tsx` — 54 tests across 24 files
