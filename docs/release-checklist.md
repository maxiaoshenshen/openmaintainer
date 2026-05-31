# Release Checklist

Use this checklist before making a public release or submitting OpenMaintainer to an external program.

## Local validation

- [ ] `npm run validate`
- [ ] Confirm demo mode loads at `/`
- [ ] Confirm `/api/repository?repo=demo` returns analysis
- [ ] Confirm no secrets are committed

## Repository readiness

- [ ] Public GitHub repository exists
- [ ] README includes screenshot and live preview
- [ ] License is visible
- [ ] CI is passing on `main`
- [ ] Issue templates and PR template are present

## Deployment readiness

- [ ] Preview deployment created
- [ ] Deployment link added to README
- [ ] Demo path works without credentials
- [ ] Optional credentials are documented but not required

## Codex for OSS readiness

- [ ] Application narrative in `docs/codex-for-oss-application.md` is current
- [ ] GitHub repository URL is public
- [ ] Live preview URL is available
- [ ] OpenAI Organization ID is collected separately from account settings
