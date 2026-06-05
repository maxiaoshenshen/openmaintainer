# Maintainer Quickstart

Use this guide when you want to try OpenMaintainer on a real OSS repository in about 10 minutes.

## 1. Start With Demo Mode

Open [openmaintainer.vercel.app](https://openmaintainer.vercel.app) and enter:

```text
demo
```

Demo mode is the safest first run. It shows every workspace without requiring GitHub or OpenAI credentials.

## 2. Inspect A Public Repository

Enter a public GitHub repository in `owner/name` format, for example:

```text
vercel/next.js
```

OpenMaintainer will build a maintainer snapshot with:

- Repository health and quality signals
- Issue triage actions
- Contributor impact queue
- PR review handoff
- Release readiness gate
- OSS evidence pack

If GitHub rate limits are low, add `GITHUB_TOKEN` locally or in Vercel.

## 3. Read The Workspaces In Order

Use the dashboard tabs as a daily maintainer flow:

| Workspace | What to decide |
|---|---|
| Focus | What are the top 3 actions today? |
| Contributors | Who is blocked and what reply unblocks them? |
| Review | Which PR needs review attention and what should reviewers check? |
| Release | Is this repository ready to release? |
| Docs | What evidence can be shared with contributors, funders, or reviewers? |

The goal is not to automate maintainer judgment. The goal is to make judgment faster, calmer, and easier to explain.

## 4. Copy Only Human-Approved Actions

OpenMaintainer drafts:

- GitHub CLI commands
- Contributor replies
- Reproduction requests
- Review handoff notes
- Public status briefs

Treat every draft as a prepared clipboard item. Review it, edit it, then run or post it yourself.

## 5. Export A Snapshot

Use the snapshot controls when you want a repeatable before/after view of a repository.

Good moments to export:

- Before a weekly maintenance session
- Before release preparation
- Before a contributor push
- Before applying for OSS support or funding

Import the previous snapshot later to see drift, improvements, and remaining risk.

## 6. Add Optional Credentials

For local development:

```bash
cp .env.example .env.local
```

Then add values as needed:

```bash
GITHUB_TOKEN=ghp_your_token_here
OPENAI_API_KEY=sk_your_key_here
OPENMAINTAINER_MODEL=gpt-5.4-mini
```

Credentials are optional:

- Without `GITHUB_TOKEN`, demo mode and lower-rate public GitHub access still work.
- Without `OPENAI_API_KEY`, deterministic analysis still works.
- With both, the product becomes more useful for real repository operations.

## Maintainer Safety Rules

- Never let AI post directly to GitHub without human review.
- Never paste secrets into the repository input.
- Keep security issues outside public triage until disclosure is handled.
- Use generated commands as drafts, not authority.
- Prefer small weekly maintenance sessions over rare heroic cleanups.

## First Useful Session

For a real project, a strong first 10-minute session is:

1. Enter your repository.
2. Open `Focus` and pick one action.
3. Open `Contributors` and copy one overdue reply.
4. Open `Review` and prepare one PR handoff.
5. Open `Release` and record the biggest blocker.
6. Export the snapshot for the next session.

That is enough to turn OpenMaintainer from a dashboard into a working maintenance habit.
