/**
 * Contributing Guide Generator
 * Generate comprehensive CONTRIBUTING.md
 */
export interface ContributingGuide {
  sections: { title: string; content: string }[];
  codeOfConduct?: string;
}

export function generateContributingGuide(): ContributingGuide {
  return {
    sections: [
      {
        title: "Getting Started",
        content: `## Getting Started

1. Fork the repository
2. Clone your fork: \`git clone https://github.com/YOUR_USERNAME/repo.git\`
3. Create a branch: \`git checkout -b feature/your-feature\`
4. Install dependencies: \`npm install\`
5. Run tests: \`npm test\``,
      },
      {
        title: "Code Style",
        content: `## Code Style

- Use 2 spaces for indentation
- Run \`npm run lint\` before committing
- Follow existing patterns in the codebase
- Write meaningful variable names`,
      },
      {
        title: "Commit Messages",
        content: `## Commit Messages

Follow conventional commits:
- \`feat:\` for new features
- \`fix:\` for bug fixes
- \`docs:\` for documentation changes
- \`refactor:\` for code refactoring

Example: \`feat(auth): add OAuth2 support\``,
      },
      {
        title: "Pull Requests",
        content: `## Pull Requests

1. Fill out the PR template
2. Ensure all tests pass
3. Add tests for new features
4. Update documentation if needed
5. Request review from maintainers`,
      },
      {
        title: "Testing",
        content: `## Testing

- Write unit tests for all new functions
- Run \`npm test\` before submitting PR
- Aim for 80%+ code coverage`,
      },
      {
        title: "Questions?",
        content: `## Questions?

- Open an issue for bugs or feature requests
- Join our Discord for real-time discussion
- Check existing issues before creating new ones`,
      },
    ],
  };
}

export function generateCodeOfConduct(): string {
  return `# Contributor Covenant Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project team.`;
}
