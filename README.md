# OpenMaintainer - AI-Powered OSS Maintenance Workbench

[![Tests](https://img.shields.io/badge/tests-383%20passing-brightgreen)](./src/lib)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/openmaintainer?style=social)](https://twitter.com/openmaintainer)

**OpenMaintainer** is an all-in-one workbench for open source maintainers. Analyze repositories, manage contributors, ship releases with confidence, and build a thriving OSS community.

## Features

### Core Modules

- **Repository Analysis** - Comprehensive health metrics and insights
- **Contributor Impact Queue** - Prioritized list of contributors needing attention
- **PR Review Handoff** - Streamlined code review workflows
- **Release Readiness Gate** - Pre-release checklist and validation
- **Maintainer Inbox** - Unified view of all repository activity
- **Evidence Pack Export** - Generate audit-ready documentation

### Advanced Tools

- **GitHub API Integration** - Real-time data sync with GitHub
- **Webhook Handler** - Process GitHub webhooks for real-time updates
- **Crisis Alert System** - Emergency notifications and escalation
- **Security Vulnerability Tracker** - Monitor and respond to CVEs
- **Contributor Journey Map** - Track contributor growth and engagement
- **Maintainer Vacation Mode** - Automatic responses during absences

### Developer Tools

- **Prometheus Metrics** - `/api/metrics` for monitoring
- **Health Check API** - `/api/health` for service status
- **Search API** - `/api/search?q=query` for finding resources
- **Stats API** - `/api/stats` for platform analytics

## Quick Start

```bash
# Clone the repository
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## Demo

Visit [https://openmaintainer.vercel.app](https://openmaintainer.vercel.app) to try the live demo.

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── health/        # Health check endpoint
│   │   ├── metrics/       # Prometheus metrics
│   │   ├── search/        # Search API
│   │   └── stats/         # Statistics API
│   └── page.tsx          # Main dashboard
├── components/
│   └── dashboard.tsx     # Main dashboard component (3417 lines)
└── lib/                   # Core business logic
    ├── maintainer-analysis.ts     # Repository analysis engine
    ├── contributor-impact.ts     # Contributor prioritization
    ├── maintainer-inbox.ts       # Unified inbox
    ├── release-readiness-gate.ts  # Release validation
    ├── github-api.ts             # GitHub API client
    ├── webhook-handler.ts        # Webhook processing
    ├── health-checker.ts        # Service monitoring
    ├── metrics-exporter.ts      # Prometheus exporter
    └── notification-preferences.ts # Notification management
```

## API Endpoints

### Health Check
```bash
curl https://openmaintainer.vercel.app/api/health
```

### Prometheus Metrics
```bash
curl https://openmaintainer.vercel.app/api/metrics
```

### Repository Search
```bash
curl "https://openmaintainer.vercel.app/api/search?q=react&limit=5"
```

### Platform Stats
```bash
curl https://openmaintainer.vercel.app/api/stats
```

### Analyze Repository (POST)
```bash
curl -X POST https://openmaintainer.vercel.app/api/repo/analyze \
  -H "Content-Type: application/json" \
  -d '{"owner": "facebook", "repo": "react"}'
```

## Test Coverage

The project has comprehensive test coverage with 383 passing tests:

```bash
npm test
# Test Files  71 passed (71)
# Tests  383 passed (383)
```

## Modules Overview

| Module | Lines | Description |
|--------|-------|-------------|
| `dashboard.tsx` | 3,417 | Main UI component |
| `maintainer-analysis.ts` | 864 | Analysis engine |
| `i18n.ts` | 451 | Internationalization |
| `openai-analyzer.ts` | 398 | AI-powered analysis |
| `kanban-view.ts` | 339 | Kanban board view |
| `types.ts` | 747 | TypeScript definitions |

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with love for the OSS community. Special thanks to all contributors and maintainers who keep open source thriving.
