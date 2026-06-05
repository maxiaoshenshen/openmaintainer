# OpenMaintainer

**AI-Powered OSS Maintenance Workbench** — The all-in-one platform for open source maintainers who want to work smarter, not harder.

[![GitHub stars](https://img.shields.io/github/stars/maxiaoshenshen/openmaintainer)](https://github.com/maxiaoshenshen/openmaintainer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why OpenMaintainer?

Being an OSS maintainer is rewarding but relentless. You're drowning in issues, PRs, and community demands. OpenMaintainer helps you:

- **Triage Faster** — AI-powered issue categorization and duplicate detection
- **Ship with Confidence** — Release readiness gates and health scores
- **Grow Your Community** — Starter kit management and contributor nurturing
- **Protect Your Time** — SLA tracking and intelligent prioritization

## Live Demo

Try it now: [https://openmaintainer.vercel.app](https://openmaintainer.vercel.app)

No signup required. Works with any public GitHub repository.

## Key Features

### 📨 Maintainer Inbox
Unified view of all your repositories. See urgent issues, pending PRs, and community questions at a glance.

### 🔍 AI Triage
Intelligent issue categorization using OpenAI. Questions → Contributors, Bugs → Triaged, Features → Prioritized.

### 📊 Health Dashboard
Repository health scores with quality signals: label coverage, response times, PR age, review load.

### 🛡️ Release Readiness Gate
Know exactly what's blocking your next release. No surprises on release day.

### 👥 Contributor Management
Track contributor health, identify at-risk contributors, and nurture your community.

### ⏰ SLA Tracking
Never let threads go dark. Track response times and get alerts for overdue items.

### 🎯 Focus Plan
Daily maintainer rhythm. Know what to do first, second, and third.

### 🏆 Points & Achievements
Earn points for community contributions. Unlock achievements as you grow.

## Getting Started

### Quick Start

```bash
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer
npm install
npm run dev
```

Visit `http://localhost:3000` and enter any public GitHub repository URL.

### GitHub OAuth (Optional)

For full functionality:

1. Create a GitHub OAuth App at `https://github.com/settings/applications/new`
2. Set callback URL to `http://localhost:3000/api/auth/callback`
3. Add credentials to `.env.local`:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

## Architecture

OpenMaintainer is built with:

- **Next.js 16** — App Router with React Server Components
- **TypeScript** — Full type safety
- **Tailwind CSS** — Beautiful, responsive UI
- **OpenAI API** — AI-powered analysis and categorization
- **GitHub API** — Repository data and OAuth

## Contributing

Contributions welcome! This project is itself maintained with OpenMaintainer.

## License

MIT — Do whatever you want with it.

---

**Built with ❤️ for the OSS community by maintainers who understand the struggle.**
