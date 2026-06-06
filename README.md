# OpenMaintainer

**The all-in-one AI-powered workbench for open source maintainers.**

OpenMaintainer helps OSS maintainers analyze repositories, manage contributors, track performance, and ship with confidence.

## Features

### Dashboard
- Real-time repository health monitoring
- Maintainer inbox with prioritized tasks
- Contributor impact tracking
- Response SLA management

### Analysis Tools
- **Community Health Analysis** - 5 key metrics: response time, diversity, issue resolution, engagement, documentation
- **Performance Monitoring** - Track response times, quality metrics, and productivity
- **Repository Scoring** - Comprehensive health score based on multiple factors

### Contributor Management
- **Onboarding System** - Smart starter issue suggestions, learning resources, 10-step checklist
- **Contributor Journey Map** - Track contributor growth and engagement
- **Unblock Kit** - Tools to help contributors get unstuck

### Release Management
- **Release Planning** - Automated version calculation, feature extraction
- **Changelog Generation** - Automatic changelog creation
- **Release Readiness** - Checklist and scoring for release preparation

### Code Review
- **AI Code Review Assistant** - Automated PR analysis and scoring
- **Finding Categorization** - Issues, suggestions, and praise
- **Approval Recommendations** - Approve, request changes, or comment

### Incident Response
- **Security Detection** - Automatic security vulnerability detection
- **Bug Tracking** - Comprehensive bug and regression monitoring
- **Severity Classification** - Critical, high, medium, low prioritization

### Sprint Planning
- **Issue Prioritization** - AI-powered issue ranking
- **Velocity Tracking** - Team capacity and velocity metrics
- **Release Estimation** - Predict release dates based on backlog

### Dependencies
- **Dependency Tracking** - Monitor outdated and vulnerable dependencies
- **License Analysis** - Ensure open source compliance
- **Risk Scoring** - Supply chain security assessment

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/repo/analyze` | Full repository analysis |
| `GET /api/health-report` | Community health report |
| `GET /api/sprint-plan` | Sprint planning data |
| `GET /api/performance` | Performance metrics |
| `GET /api/code-review` | PR code review |
| `GET /api/release` | Release planning |
| `GET /api/dependencies` | Dependency analysis |
| `GET /api/health` | API health check |
| `GET /api/metrics` | Prometheus metrics |
| `GET /api/search` | Repository search |

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables

```bash
GITHUB_TOKEN=your_github_token_here
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── repo/
│   │   ├── health/
│   │   ├── metrics/
│   │   └── ...
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   └── dashboard/         # Dashboard components
└── lib/                   # Core business logic
    ├── github-api.ts      # GitHub API integration
    ├── maintainer-inbox.ts
    ├── community-health.ts
    ├── performance-monitor.ts
    ├── release-manager.ts
    ├── code-review-assistant.ts
    └── ...
```

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Testing**: Vitest
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Test Coverage

```
Test Files  82 passed
Tests      476 passed
```

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Production**: https://openmaintainer.vercel.app
- **GitHub**: https://github.com/maxiaoshenshen/openmaintainer

---

Built with ❤️ for the OSS community
