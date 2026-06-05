# Contributing to OpenMaintainer

Thank you for your interest in contributing to OpenMaintainer! This project is built to help OSS maintainers reduce friction and stay in control.

## Quick Start

```bash
git clone https://github.com/maxiaoshenshen/openmaintainer.git
cd openmaintainer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter `demo` or any public GitHub repository.

## Development

```bash
npm test          # Run tests
npm run lint      # Check code style
npm run typecheck # TypeScript check
npm run validate  # Full CI gate
```

## Project Structure

```
src/
  app/              # Next.js App Router
  components/
    dashboard.tsx   # Main maintainer cockpit
  lib/
    *.ts             # Domain logic for each feature
```

## Adding New Features

1. Add TypeScript types to `src/lib/types.ts`
2. Implement domain logic in `src/lib/`
3. Add UI components to `src/components/dashboard.tsx`
4. Add tests in `src/components/*.test.tsx`
5. Run `npm run validate` before submitting

## Reporting Issues

Please include:
- Repository URL (if applicable)
- Expected vs actual behavior
- Steps to reproduce
- Browser/OS version

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to make OSS maintenance better.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
