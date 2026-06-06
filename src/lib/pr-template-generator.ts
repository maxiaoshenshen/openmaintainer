/**
 * PR Template Generator
 * Creates customizable PR templates for repositories
 */
export interface PRTemplateConfig {
  types: string[];
  sections: string[];
  requireChecklist: boolean;
  requireTesting: boolean;
  allowDraft: boolean;
}

export interface PRTemplate {
  name: string;
  description: string;
  body: string;
  labels: string[];
}

export interface TemplateType {
  value: string;
  label: string;
  labelZh: string;
}

export function getTemplateTypes(): TemplateType[] {
  return [
    { value: "feature", label: "Feature", labelZh: "新功能" },
    { value: "bugfix", label: "Bug Fix", labelZh: "错误修复" },
    { value: "refactor", label: "Refactor", labelZh: "重构" },
    { value: "docs", label: "Documentation", labelZh: "文档" },
    { value: "test", label: "Test", labelZh: "测试" },
    { value: "chore", label: "Chore", labelZh: "维护" },
    { value: "security", label: "Security", labelZh: "安全" },
    { value: "performance", label: "Performance", labelZh: "性能" },
  ];
}

export function generatePRTemplate(config: PRTemplateConfig): PRTemplate {
  const typeSection = config.types.length > 0 
    ? `## Type\n${config.types.map(t => `- [ ] ${t}`).join('\n')}`
    : '';

  const checklistSection = config.requireChecklist
    ? `## Checklist\n- [ ] Code follows project style guidelines\n- [ ] Documentation updated (if needed)\n- [ ] Tests added/updated${config.requireTesting ? '\n- [ ] Tests pass locally' : ''}`
    : '';

  const bodySections = config.sections.join('\n\n');
  
  const body = [
    typeSection,
    bodySections,
    checklistSection,
  ].filter(Boolean).join('\n\n');

  const labels = config.types.map(t => t.toLowerCase().replace(/\s+/g, '-'));

  return {
    name: "Pull Request Template",
    description: "Standard PR template for maintainers",
    body,
    labels,
  };
}

export function generateSecurityPRTemplate(): PRTemplate {
  return {
    name: "Security Pull Request",
    description: "Template for security-related changes",
    body: `## Security Fix

### Description
Describe the security issue being addressed.

### Vulnerable Code
\`\`\`
// Code before fix
\`\`\`

### Fixed Code
\`\`\`
// Code after fix
\`\`\`

### Impact Assessment
- Severity: (Critical/High/Medium/Low)
- CVSS Score (if applicable):
- Affected versions:

### Testing
- [ ] Security test cases added
- [ ] No regression in existing functionality
- [ ] Code review by security team

### Related Issues
Fixes #
Related to CVE-XXXX-XXXX`,
    labels: ["security", "bug"],
  };
}
