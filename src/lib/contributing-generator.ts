// CONTRIBUTING.md Generator for OpenMaintainer
// Helps create comprehensive contributing guidelines

import type { Repository } from './types';

export interface ContributingConfig {
  repository: Repository;
  includeCodeOfConduct: boolean;
  includePRTemplate: boolean;
  includeIssueTemplate: boolean;
  includeTestGuide: boolean;
  includeStyleGuide: boolean;
  communicationChannels: string[];
}

export interface ContributingDocument {
  content: string;
  sections: string[];
  estimatedReadTime: number;
}

const CODE_OF_CONDUCT_TEMPLATE = `## Contributor Covenant Code of Conduct

### Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socioeconomic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

### Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior:

* The use of sexualized language or imagery and unwelcome sexual attention
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information without explicit permission
* Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement.
All complaints will be reviewed and investigated promptly and fairly.
`;

export function generateContributingGuide(config: ContributingConfig): ContributingDocument {
  const sections: string[] = [];
  let content = '';

  // Header
  content += `# Contributing to ${config.repository.fullName}\n\n`;
  content += `Thank you for your interest in contributing to ${config.repository.name}!\n\n`;
  content += `This document provides guidelines and instructions for contributing.\n\n`;
  sections.push('Introduction');

  // Code of Conduct
  if (config.includeCodeOfConduct) {
    content += `---\n\n## Code of Conduct\n\n`;
    content += CODE_OF_CONDUCT_TEMPLATE;
    content += `\n---\n\n`;
    sections.push('Code of Conduct');
  }

  // Getting Started
  content += `## Getting Started\n\n`;
  content += `### Prerequisites\n\n`;
  content += `- Node.js 18+ and npm\n`;
  content += `- Git installed on your machine\n`;
  content += `- A GitHub account\n\n`;
  content += `### Fork and Clone\n\n`;
  content += `\`\`\`bash\n`;
  content += `# Fork the repository on GitHub\n`;
  content += `git clone https://github.com/YOUR_USERNAME/${config.repository.name}.git\n`;
  content += `cd ${config.repository.name}\n`;
  content += `npm install\n`;
  content += `\`\`\`\n\n`;
  sections.push('Getting Started');

  // Development Setup
  content += `## Development Setup\n\n`;
  content += `### 1. Create a Feature Branch\n\n`;
  content += `\`\`\`bash\n`;
  content += `git checkout -b feature/your-feature-name\n`;
  content += `\`\`\`\n\n`;
  content += `### 2. Make Your Changes\n\n`;
  content += `Write your code and ensure all tests pass:\n\n`;
  content += `\`\`\`bash\n`;
  content += `npm run test\n`;
  content += `npm run lint\n`;
  content += `\`\`\`\n\n`;
  sections.push('Development Setup');

  // Testing Guide
  if (config.includeTestGuide) {
    content += `## Testing\n\n`;
    content += `We maintain high test coverage. Please ensure:\n\n`;
    content += `- All existing tests pass\n`;
    content += `- New features include tests\n`;
    content += `- Bug fixes include regression tests\n\n`;
    content += `Run tests with:\n\n`;
    content += `\`\`\`bash\n`;
    content += `npm test          # Run all tests\n`;
    content += `npm run test:watch # Watch mode\n`;
    content += `npm run coverage   # Generate coverage report\n`;
    content += `\`\`\`\n\n`;
    sections.push('Testing');
  }

  // Pull Request Process
  content += `## Pull Request Process\n\n`;
  content += `### 1. Describe Your Changes\n\n`;
  content += `Include a clear description of:\n`;
  content += `- What problem does this solve?\n`;
  content += `- What is the solution?\n`;
  content += `- What are the potential side effects?\n\n`;
  content += `### 2. Follow the Template\n\n`;
  content += `Fill out the PR template completely.\n\n`;
  content += `### 3. Address Review Feedback\n\n`;
  content += `Be responsive to code review comments.\n\n`;
  content += `### 4. Merge Requirements\n\n`;
  content += `- All CI checks must pass\n`;
  content += `- At least one approval required\n`;
  content += `- Branch must be up to date with main\n\n`;
  content += `### 5. After Merging\n\n`;
  content += `Delete your branch after the PR is merged.\n\n`;
  sections.push('Pull Request Process');

  // Style Guide
  if (config.includeStyleGuide) {
    content += `## Style Guide\n\n`;
    content += `### JavaScript/TypeScript\n\n`;
    content += `- Use TypeScript for new code\n`;
    content += `- Follow the existing code style\n`;
    content += `- Use meaningful variable names\n`;
    content += `- Add comments for complex logic\n\n`;
    content += `### Git Commits\n\n`;
    content += `Follow [Conventional Commits](https://www.conventionalcommits.org/):\n\n`;
    content += `\`\`\`\n`;
    content += `feat: add new feature\n`;
    content += `fix: resolve bug\n`;
    content += `docs: update documentation\n`;
    content += `test: add tests\n`;
    content += `refactor: restructure code\n`;
    content += `\`\`\`\n\n`;
    sections.push('Style Guide');
  }

  // Communication
  if (config.communicationChannels.length > 0) {
    content += `## Communication\n\n`;
    content += `For questions or discussions:\n\n`;
    config.communicationChannels.forEach((channel) => {
      content += `- ${channel}\n`;
    });
    content += `\n`;
    sections.push('Communication');
  }

  // Footer
  content += `---\n\n`;
  content += `**Thank you for contributing!**\n\n`;
  content += `Your contributions make open source great.\n`;

  const wordCount = content.split(/\s+/).length;
  const estimatedReadTime = Math.ceil(wordCount / 200);

  return {
    content,
    sections,
    estimatedReadTime,
  };
}

export function generateIssueTemplate(config: { repository: string; labels?: string[] }): string {
  return `---
name: Bug Report
about: Create a report to help us improve
title: '[Bug] '
labels: bug
assignees: ''
---

## Description
<!-- A clear and concise description of what the bug is. -->

## Steps to Reproduce
<!-- Steps to reproduce the behavior -->
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
<!-- A clear and concise description of what you expected to happen. -->

## Actual Behavior
<!-- A clear and concise description of what actually happened. -->

## Screenshots
<!-- If applicable, add screenshots to help explain your problem. -->

## Environment
 - OS: [e.g. macOS, Windows, Linux]
 - Version: [e.g. 1.0.0]

## Additional Context
<!-- Add any other context about the problem here. -->
`;
}

export function generatePRTemplate(config: { repository: string; branchPolicy?: string }): string {
  return `## Description
<!-- Briefly describe the changes in this PR -->

## Type of Change
<!-- What kind of change does this PR introduce? -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
<!-- Put an 'x' in the boxes that apply -->
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Related Issues
<!-- Link to related issues using 'Fixes #123' -->
Fixes #

## Screenshots
<!-- If applicable, add screenshots before/after -->
`;
}
