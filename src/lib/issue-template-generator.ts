/**
 * Issue Template Generator
 * Creates structured issue templates for better bug reports
 */
export interface IssueTemplate {
  name: string;
  description: string;
  body: string;
  labels: string[];
  assignees?: string[];
}

export function generateBugReportTemplate(): IssueTemplate {
  return {
    name: "Bug Report",
    description: "Report a bug to help us improve",
    body: `## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Version: [e.g. 1.0.0]
- Node version: [e.g. 18.0.0]

## Screenshots
If applicable, add screenshots to help explain your problem.

## Additional Context
Add any other context about the problem here.

\`\`\`
Error logs here
\`\`\``,
    labels: ["bug"],
  };
}

export function generateFeatureRequestTemplate(): IssueTemplate {
  return {
    name: "Feature Request",
    description: "Suggest a new feature or enhancement",
    body: `## Feature Summary
A brief one-sentence summary of the feature.

## Problem Statement
Describe the problem this feature would solve.

## Proposed Solution
Describe the solution you'd like to see.

## Alternatives Considered
Describe any alternative solutions you've considered.

## Use Cases
1. As a [user type], I want to [goal] so that [benefit].
2. ...

## Additional Context
Add any other context or mockups about the feature request here.`,
    labels: ["enhancement", "feature"],
  };
}

export function generateQuestionTemplate(): IssueTemplate {
  return {
    name: "Question",
    description: "Ask a question about the project",
    body: `## Question
What do you want to know?

## Context
Provide relevant context for your question.

## What I've Tried
Describe what you've already tried.

## Additional Information
Add any other relevant information.`,
    labels: ["question"],
  };
}
