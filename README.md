# OpenMaintainer

**The all-in-one AI-powered workbench for open source maintainers.**

[Live Demo](https://openmaintainer.vercel.app) · [GitHub](https://github.com/maxiaoshenshen/openmaintainer)

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

Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

Built with Next.js 16 + TypeScript + Tailwind CSS.

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Core maintainer logic (234 modules)
- `src/components/` — React components (Dashboard, etc.)

---

## For Maintainers

### Single Repository Mode
Enter any GitHub repository to get instant analysis.

### Portfolio Mode
Manage multiple repositories in one view. Track cross-repo health and contributor engagement.

### API Integration
Use the API endpoints for programmatic access:

```
GET /api/repo/analyze?repo=owner/name
GET /api/health-report?repo=owner/name
GET /api/code-review?repo=owner/name&pr=123
```

---

## License

MIT

---

*Built with ❤️ for the OSS maintainer community*
