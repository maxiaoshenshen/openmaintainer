# Contributing to OpenMaintainer

Thank you for your interest in contributing! OpenMaintainer is an open-source project built by and for OSS maintainers.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
├── components/
│   └── dashboard.tsx      # Main dashboard component (3400+ lines)
└── lib/                   # Core logic (234 modules)
    ├── maintainer-*.ts     # Maintainer workflow modules
    ├── contributor-*.ts   # Contributor management
    ├── release-*.ts       # Release management
    └── types.ts           # TypeScript types
```

## Key Modules

- `maintainer-analysis.ts` — Core repository analysis logic
- `maintainer-inbox.ts` — Priority inbox with pain scoring
- `contributor-impact.ts` — Contributor value tracking
- `release-readiness-gate.ts` — Release checklist and gates
- `code-review-assistant.ts` — Automated PR review

## Adding New Features

1. Add types to `src/lib/types.ts`
2. Implement logic in a new or existing `src/lib/*.ts` module
3. Wire up the component in `src/components/dashboard.tsx`
4. Add tests in `src/lib/*.test.ts`

## Code Style

- Run `npm run lint` before committing
- TypeScript strict mode is disabled (for flexibility during rapid development)
- Use meaningful variable names and add comments for complex logic

## Pull Requests

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
