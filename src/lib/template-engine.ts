/**
 * Template Engine
 * Generates PR/Issue templates and boilerplate
 */

export type TemplateType = 'pr' | 'issue' | 'changelog' | 'release-notes' | 'contributing';

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  default?: string;
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  content: string;
  variables: TemplateVariable[];
  category: string;
  tags: string[];
  language: string;
}

export interface TemplateContext {
  [key: string]: string | number | boolean | string[];
}

/**
 * Parse template variables
 */
export function parseTemplateVariables(template: Template): TemplateVariable[] {
  const regex = /\{\{(\w+)(?::([^}]+))?\}\}/g;
  const matches: TemplateVariable[] = [];
  let match;
  
  while ((match = regex.exec(template.content)) !== null) {
    const [full, name, options] = match;
    if (!matches.find(v => v.name === name)) {
      matches.push({
        name,
        description: `Variable: ${name}`,
        required: false,
        options: options ? options.split('|') : undefined,
      });
    }
  }
  
  return [...template.variables, ...matches];
}

/**
 * Render template with variables
 */
export function renderTemplate(template: Template, context: TemplateContext): string {
  let content = template.content;
  
  // Replace all {{variable}} patterns
  content = content.replace(/\{\{(\w+)(?::([^}]+))?\}\}/g, (match, name, defaultValue) => {
    if (context[name] !== undefined) {
      const value = context[name];
      if (Array.isArray(value)) return value.join(', ');
      return String(value);
    }
    return defaultValue || '';
  });
  
  return content;
}

/**
 * Get built-in templates
 */
export function getBuiltInTemplates(language = 'en'): Template[] {
  const t = (key: string) => translations[language]?.[key] || translations.en[key] || key;
  
  return [
    {
      id: 'pr-standard',
      name: t('pr.standard.name'),
      type: 'pr',
      description: t('pr.standard.description'),
      content: `# {{type}}: {{title}}

## Description
{{description}}

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
{{#if testing_required}}- [ ] Tests added/updated
{{/if}}
{{#if checklist_items}}
{{#each checklist_items}}
- [ ] {{this}}
{{/each}}
{{/if}}

## Related Issues
{{#if related_issues}}
Closes {{related_issues}}
{{else}}
Fixes #
{{/if}}

## Screenshots (if applicable)
{{#if screenshots}}
{{#each screenshots}}
![{{name}}]({{url}})
{{/each}}
{{/if}}
`,
      variables: [
        { name: 'title', description: 'PR title', required: true },
        { name: 'description', description: 'Detailed description', required: true },
        { name: 'type', description: 'Change type', required: true, options: ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'] },
        { name: 'testing_required', description: 'Is testing required?', required: false, default: 'true' },
        { name: 'checklist_items', description: 'Custom checklist items', required: false },
        { name: 'related_issues', description: 'Related issue numbers', required: false },
        { name: 'screenshots', description: 'Screenshot URLs', required: false },
      ],
      category: 'General',
      tags: ['standard', 'beginner-friendly'],
      language,
    },
    {
      id: 'pr-security',
      name: t('pr.security.name'),
      type: 'pr',
      description: t('pr.security.description'),
      content: `# [SECURITY] {{title}}

## Security Impact
{{security_impact}}

## Vulnerable Code
\`\`\`
{{vulnerable_code}}
\`\`\`

## Fix Applied
{{fix_description}}

## CVE Reference (if applicable)
{{cve_id}}

## Testing
- [ ] Verified fix resolves the vulnerability
- [ ] No regressions in related functionality
- [ ] Performance impact assessed

## Additional Notes
{{additional_notes}}
`,
      variables: [
        { name: 'title', description: 'Brief description', required: true },
        { name: 'security_impact', description: 'Describe the security impact', required: true },
        { name: 'vulnerable_code', description: 'Show vulnerable code (optional)', required: false },
        { name: 'fix_description', description: 'How the fix works', required: true },
        { name: 'cve_id', description: 'CVE ID (if available)', required: false },
        { name: 'additional_notes', description: 'Any additional notes', required: false },
      ],
      category: 'Security',
      tags: ['security', 'cve'],
      language,
    },
    {
      id: 'issue-bug',
      name: t('issue.bug.name'),
      type: 'issue',
      description: t('issue.bug.description'),
      content: `# Bug Report: {{title}}

## Description
{{description}}

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
{{expected}}

## Actual Behavior
{{actual}}

## Environment
- OS: {{os}}
- Version: {{version}}
- Node/Runtime: {{runtime}}

## Error Message
\`\`\`
{{error_message}}
\`\`\`

## Additional Context
{{additional_context}}
`,
      variables: [
        { name: 'title', description: 'Bug title', required: true },
        { name: 'description', description: 'Brief description', required: true },
        { name: 'expected', description: 'What you expected', required: true },
        { name: 'actual', description: 'What actually happened', required: true },
        { name: 'os', description: 'Operating system', required: false },
        { name: 'version', description: 'App version', required: false },
        { name: 'runtime', description: 'Runtime version', required: false },
        { name: 'error_message', description: 'Error message', required: false },
        { name: 'additional_context', description: 'Additional context', required: false },
      ],
      category: 'Bug Reports',
      tags: ['bug', 'triage-needed'],
      language,
    },
    {
      id: 'issue-feature',
      name: t('issue.feature.name'),
      type: 'issue',
      description: t('issue.feature.description'),
      content: `# Feature Request: {{title}}

## Problem Statement
{{problem}}

## Proposed Solution
{{solution}}

## Use Cases
{{#each use_cases}}
- {{this}}
{{/each}}

## Alternatives Considered
{{alternatives}}

## Additional Context
{{additional_context}}
`,
      variables: [
        { name: 'title', description: 'Feature title', required: true },
        { name: 'problem', description: 'Problem it solves', required: true },
        { name: 'solution', description: 'How it solves the problem', required: true },
        { name: 'use_cases', description: 'Use cases', required: false },
        { name: 'alternatives', description: 'Alternatives considered', required: false },
        { name: 'additional_context', description: 'Additional context', required: false },
      ],
      category: 'Feature Requests',
      tags: ['enhancement', 'feature'],
      language,
    },
    {
      id: 'changelog-standard',
      name: t('changelog.name'),
      type: 'changelog',
      description: t('changelog.description'),
      content: `# Changelog

All notable changes to this project will be documented in this file.

## [{{version}}] - {{date}}

### Added
{{#each added}}
- {{this}}
{{/each}}

### Changed
{{#each changed}}
- {{this}}
{{/each}}

### Deprecated
{{#each deprecated}}
- {{this}}
{{/each}}

### Removed
{{#each removed}}
- {{this}}
{{/each}}

### Fixed
{{#each fixed}}
- {{this}}
{{/each}}

### Security
{{#each security}}
- {{this}}
{{/each}}

---
Generated by OpenMaintainer
`,
      variables: [
        { name: 'version', description: 'Version number', required: true },
        { name: 'date', description: 'Release date', required: true },
        { name: 'added', description: 'New features', required: false },
        { name: 'changed', description: 'Changes', required: false },
        { name: 'deprecated', description: 'Deprecated features', required: false },
        { name: 'removed', description: 'Removed features', required: false },
        { name: 'fixed', description: 'Bug fixes', required: false },
        { name: 'security', description: 'Security fixes', required: false },
      ],
      category: 'Release',
      tags: ['release', 'changelog'],
      language,
    },
  ];
}

const translations: Record<string, Record<string, string>> = {
  en: {
    'pr.standard.name': 'Standard PR',
    'pr.standard.description': 'Standard pull request template',
    'pr.security.name': 'Security Fix',
    'pr.security.description': 'Security-related pull request',
    'issue.bug.name': 'Bug Report',
    'issue.bug.description': 'Bug report template',
    'issue.feature.name': 'Feature Request',
    'issue.feature.description': 'Feature request template',
    'changelog.name': 'Changelog Entry',
    'changelog.description': 'Standard changelog format',
  },
  zh: {
    'pr.standard.name': '标准 PR',
    'pr.standard.description': '标准 Pull Request 模板',
    'pr.security.name': '安全修复',
    'pr.security.description': '安全相关的 Pull Request',
    'issue.bug.name': 'Bug 报告',
    'issue.bug.description': 'Bug 报告模板',
    'issue.feature.name': '功能请求',
    'issue.feature.description': '功能请求模板',
    'changelog.name': '更新日志',
    'changelog.description': '标准更新日志格式',
  },
};

/**
 * Search templates
 */
export function searchTemplates(
  templates: Template[],
  query: string,
  filters?: { type?: TemplateType; tags?: string[] }
): Template[] {
  let results = templates;
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
  
  if (filters?.type) {
    results = results.filter(t => t.type === filters.type);
  }
  
  if (filters?.tags?.length) {
    results = results.filter(t =>
      filters.tags!.some(tag => t.tags.includes(tag))
    );
  }
  
  return results;
}

/**
 * Export template as file
 */
export function exportTemplate(template: Template, format: 'md' | 'yaml' = 'md'): string {
  if (format === 'yaml') {
    return `# .github/ISSUE_TEMPLATE/${template.id}.yml
name: ${template.name}
description: ${template.description}
labels: [${template.tags.join(', ')}]
body:
${template.variables.map(v => `  - type: ${v.required ? 'input' : 'input'}
    id: ${v.name}
    attributes:
      label: ${v.name}
      description: ${v.description}
    validations:
      required: ${v.required}
`).join('')}`;
  }
  
  return template.content;
}
