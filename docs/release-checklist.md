# Release Checklist

Use this checklist before making a public release or submitting OpenMaintainer to an external program.

## Local validation

- [x] `npm run validate`
- [x] Confirm demo mode loads at `/`
- [x] Confirm `/api/repository?repo=demo` returns analysis
- [x] Confirm no secrets are committed

## Repository readiness

- [x] Public GitHub repository exists
- [x] README includes screenshot and live preview
- [x] License is visible
- [x] CI is passing on `main`
- [x] Issue templates and PR template are present

## Deployment readiness

- [x] Preview deployment created
- [x] Deployment link added to README
- [x] Demo path works without credentials
- [x] Optional credentials are documented but not required
- [x] Vercel authentication has been completed locally or in CI

## Codex for OSS readiness

- [x] Application narrative in `docs/codex-for-oss-application.md` is current
- [x] GitHub repository URL is public
- [x] Live preview URL is available
- [ ] OpenAI Organization ID is collected separately from account settings
