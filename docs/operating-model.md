# Operating Model

OpenMaintainer is designed to be continuously improved with AI assistance and human review.

## Maintenance rhythm

- Review open issues weekly.
- Keep the deterministic analysis layer tested.
- Treat AI analysis changes as product behavior changes.
- Update roadmap entries when shipped.
- Keep the demo path working without secrets.

## AI-maintained workflow

AI agents may:

- Draft implementation plans
- Write tests first
- Implement focused changes
- Run validation commands
- Update documentation
- Draft release notes

Human maintainers should approve:

- Public releases
- Security policy changes
- Repository permissions
- Production credentials
- Official program applications

## Quality bar

Every merged change should answer:

- Does this reduce maintainer workload?
- Can it run without private credentials?
- Is the output reviewable by a human?
- Is the behavior covered by tests or documented as a UI-only change?
