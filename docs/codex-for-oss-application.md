# Codex for Open Source Application Narrative

## Repository

OpenMaintainer is an AI-native workbench for open-source maintainers.

- GitHub: https://github.com/maxiaoshenshen/openmaintainer
- Live preview: https://openmaintainer.vercel.app

## Why it qualifies

OpenMaintainer directly supports the workflows highlighted by the Codex for Open Source program: issue triage, pull request review, release workflow support, maintainer automation, and code quality. The project is built as public OSS, works in demo mode without credentials, and can use Codex or API credits to improve maintainer productivity while keeping humans in control.

The MVP already includes tested deterministic maintainer logic, optional OpenAI analysis, OSS readiness scoring, similar issue detection, release draft export, and CI validation.

## Maintainer role

Primary maintainer.

## Intended API credit usage

API credits would be used for:

- Issue classification and priority drafts
- Missing-information prompts for bug reports
- Pull request summaries and risk analysis
- Release note drafts
- Multilingual maintainer response drafts
- Evaluation loops for AI suggestion quality

## Human review policy

OpenMaintainer does not apply labels, merge pull requests, publish releases, or write official maintainer responses without human approval. AI output is presented as a draft.

## Suggested form text

Why does this repository qualify?

```text
OpenMaintainer is an OSS workbench for maintainers to triage issues, review PRs, draft release notes, and monitor repository health. It directly targets maintainer workflows named by the Codex for Open Source program, runs in demo mode without secrets, and uses AI only for human-reviewed drafts.
```

How will you use API credits?

```text
Use credits for maintainer automation: issue classification, PR summaries, risk analysis, release-note drafts, multilingual response drafts, and evaluation of AI suggestion quality. Human maintainers will review all AI output before labels, replies, merges, or releases.
```
