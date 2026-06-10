# OpenMaintainer

**The all-in-one AI-powered workbench for open source maintainers.**

[![CI](https://github.com/maxiaoshenshen/openmaintainer/actions/workflows/ci.yml/badge.svg)](https://github.com/maxiaoshenshen/openmaintainer/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Live Demo](https://openmaintainer.vercel.app) · [GitHub](https://github.com/maxiaoshenshen/openmaintainer) · [Report Bug](https://github.com/maxiaoshenshen/openmaintainer/issues)

---

## Why OpenMaintainer?

Every OSS maintainer faces the same challenges:

- **Triage overwhelm** — Too many issues, too little time
- **Contributor drop-off** — Great contributors disappear after one bad experience
- **Review bottleneck** — PRs pile up, releases get delayed
- **Context switching** — Jumping between GitHub, Discord, and dozens of tabs

OpenMaintainer is a single workbench that handles the entire maintainer workflow — from first issue triage to release readiness.

---

## Core Features

### 📨 Maintainer Inbox
Prioritized task queue with SLA tracking. Know exactly what needs attention and when.

### 👥 Contributor Management
- **Starter Kit** — Personalized onboarding for new contributors
- **Unblock Kit** — Proactive tools to help contributors who are stuck
- **Impact Tracker** — Measure contributor value and engagement

### 🔍 Repository Analysis
- Community health scoring (5 dimensions)
- Performance monitoring
- Dependency risk assessment
- Release readiness gates

### 🚀 Release Management
- Automated changelog generation
- Release readiness checklist
- Sprint planning with velocity tracking

### 💬 Code Review
- Automated PR analysis
- Finding categorization (issues, suggestions, praise)
- Review handoff kits for async teams

---

## Quick Start

```bash
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — try demo mode or enter any GitHub repository.

---

## Architecture

Built with Next.js 16 + TypeScript + Tailwind CSS.

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Core maintainer logic (234 modules)
- `src/components/` — React components

---

## For Maintainers

### Single Repository Mode
Enter any GitHub repository to get instant analysis.

### Portfolio Mode
Manage multiple repositories in one view. Track cross-repo health and contributor engagement.

### API Integration
```bash
# Analyze a repository
curl https://openmaintainer.vercel.app/api/repo/analyze?repo=owner/name

# Get health report
curl https://openmaintainer.vercel.app/api/health-report?repo=owner/name
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

---

## License

MIT © OpenMaintainer contributors
