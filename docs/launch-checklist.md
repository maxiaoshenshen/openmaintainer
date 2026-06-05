# Launch Checklist

Use this checklist before sharing OpenMaintainer with OSS maintainers, funders, reviewers, or community channels.

## Product Readiness

- [x] Production URL is live: [openmaintainer.vercel.app](https://openmaintainer.vercel.app)
- [x] Demo mode works without credentials
- [x] Public repository inspection works for `owner/name`
- [x] Dashboard has anchored workspaces for Focus, Contributors, Review, Release, and Docs
- [x] Screenshot is visible in the README
- [x] English is the primary product language
- [x] Chinese interface support exists for Chinese-speaking developers

## Repository Readiness

- [x] Public GitHub repository is available
- [x] README explains the problem, features, setup, and architecture
- [x] MIT license is visible
- [x] Contributing guide is present
- [x] Security policy is present
- [x] Issue templates are present
- [x] PR template is present
- [x] Funding metadata is present

## Engineering Readiness

- [x] `npm run test`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] GitHub CI is green on `main`
- [x] Production smoke workflow is green
- [x] Vercel production deployment is ready

## Trust And Safety

- [x] Demo mode requires no credentials
- [x] GitHub token is optional and documented
- [x] OpenAI API key is optional and documented
- [x] Deterministic fallback works without model access
- [x] AI outputs are framed as human-reviewed drafts
- [x] No committed secrets
- [x] Security disclosure path is documented

## OpenAI Pro Reward Packet

- [x] Application narrative exists in `docs/openai-pro-application.md`
- [x] Codex for OSS packet exists in `docs/codex-for-oss-application.md`
- [x] Live app URL is included
- [x] GitHub repository URL is included
- [x] Test count and CI evidence are current
- [ ] OpenAI Organization ID is collected separately from account settings
- [ ] Final application is submitted by the human account owner

## Community Launch Copy

Short version:

```text
OpenMaintainer is an AI-native workbench for OSS maintainers. It turns issues, PRs, contributor replies, release gates, and status updates into one human-approved maintenance cockpit.

Try it: https://openmaintainer.vercel.app
Repo: https://github.com/maxiaoshenshen/openmaintainer
```

Maintainer-focused version:

```text
I built OpenMaintainer for open-source maintainers who are tired of juggling triage, overdue contributor replies, PR handoffs, and release readiness in separate tabs.

It works in demo mode without credentials, supports optional GitHub/OpenAI upgrades, and keeps humans in charge of every command and reply.

Try it: https://openmaintainer.vercel.app
Repo: https://github.com/maxiaoshenshen/openmaintainer
```

## Suggested Launch Channels

- GitHub profile README or pinned repository
- OSS maintainer communities
- Hacker News `Show HN`
- Reddit communities focused on open source and developer tools
- X / Twitter developer audience
- LinkedIn founder or open-source post
- OpenAI / Codex program submission materials

## Post-Launch Metrics

Track these manually until analytics are added:

- GitHub stars
- GitHub issues opened by external users
- Maintainers who tried their own repository
- Repositories analyzed in demo conversations
- Feature requests around integrations
- Reports of confusing or unsafe generated output

## Next Product Bets

The best next iterations after launch are:

- Add a public demo video or GIF
- Add a saved repository workspace
- Add GitHub OAuth for authenticated users
- Add shareable public maintainer report links
- Add analytics for demo-to-real-repo conversion
- Add maintainer interview notes to the roadmap
