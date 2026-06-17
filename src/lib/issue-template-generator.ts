export interface IssueTemplate {
  name: string;
  description: string;
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
  milestone?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

export interface TemplateSchema {
  id: string;
  name: string;
  description: string;
  variables: TemplateVariable[];
  sections: {
    title: string;
    description?: string;
    inputType: 'text' | 'textarea' | 'select' | 'multiselect' | 'checklist';
    options?: { label: string; value: string }[];
    required: boolean;
  }[];
}

export function createBugTemplate(): IssueTemplate {
  return {
    name: 'Bug Report',
    description: 'Report a bug in the project',
    title: '[Bug] ',
    body: `## Description
Describe the bug clearly.

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: 
- Version: 

## Screenshots (optional)
`,
    labels: ['bug']
  };
}

export function createFeatureTemplate(): IssueTemplate {
  return {
    name: 'Feature Request',
    description: 'Suggest a new feature',
    title: '[Feature] ',
    body: `## Feature Description
Describe the feature you want.

## Problem It Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Any alternatives you've considered?

## Additional Context
Any other information?
`,
    labels: ['enhancement']
  };
}

export function createQuestionTemplate(): IssueTemplate {
  return {
    name: 'Question',
    description: 'Ask a question',
    title: '[Question] ',
    body: `## Question
What do you want to ask?

## Context
Provide relevant context.

## What I've Tried
What have you already tried?
`,
    labels: ['question']
  };
}

export function createPRReviewTemplate(): IssueTemplate {
  return {
    name: 'Pull Request Review',
    description: 'Template for reviewing pull requests',
    title: '[Review] ',
    body: `## Type of Review
- [ ] Code Review
- [ ] Security Review
- [ ] Performance Review
- [ ] Documentation Review

## Summary
Brief summary of the changes.

## Changes Made
List the key changes.

## Testing
How was this tested?

## Feedback
Your feedback here.
`,
    labels: ['review']
  };
}

export function createSchema(
  name: string,
  description: string,
  sections: TemplateSchema['sections']
): TemplateSchema {
  const variables: TemplateVariable[] = [];
  sections.forEach(s => {
    if (s.inputType === 'text' || s.inputType === 'textarea') {
      variables.push({
        name: s.title.toLowerCase().replace(/\s+/g, '_'),
        description: s.description || s.title,
        required: s.required
      });
    }
  });

  return {
    id: `schema-${Date.now()}`,
    name,
    description,
    variables,
    sections
  };
}

export function generateIssueFromTemplate(
  template: IssueTemplate,
  variables: Record<string, string>
): { title: string; body: string; labels: string[] } {
  let body = template.body;
  
  Object.entries(variables).forEach(([key, value]) => {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  return {
    title: template.title + (variables.title || ''),
    body,
    labels: template.labels
  };
}

export function getDefaultTemplates(): IssueTemplate[] {
  return [
    createBugTemplate(),
    createFeatureTemplate(),
    createQuestionTemplate(),
    createPRReviewTemplate()
  ];
}
