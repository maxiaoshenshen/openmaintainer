/**
 * PR Template Generator
 * Generate customizable PR templates for projects
 */

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  placeholder: string;
}

export interface PRTemplate {
  name: string;
  description: string;
  sections: TemplateSection[];
  labels: string[];
  checklist: string[];
}

export interface GeneratedPR {
  title: string;
  body: string;
  labels: string[];
  reviewers: string[];
  assignees: string[];
}

export const DEFAULT_SECTIONS: TemplateSection[] = [
  {
    id: 'summary',
    title: 'Summary',
    description: 'Brief description of the changes',
    required: true,
    placeholder: 'What does this PR do?',
  },
  {
    id: 'motivation',
    title: 'Motivation',
    description: 'Why is this change needed?',
    required: false,
    placeholder: 'What problem does it solve?',
  },
  {
    id: 'changes',
    title: 'Changes Made',
    description: 'Detailed list of changes',
    required: true,
    placeholder: '- Added new feature\n- Fixed bug in X\n- Refactored Y',
  },
  {
    id: 'testing',
    title: 'Testing',
    description: 'How was this tested?',
    required: true,
    placeholder: 'Added unit tests for new feature',
  },
  {
    id: 'screenshots',
    title: 'Screenshots/Recordings',
    description: 'Visual proof of changes (if applicable)',
    required: false,
    placeholder: 'Before/After screenshots or screen recording',
  },
  {
    id: 'checklist',
    title: 'Checklist',
    description: 'Ensure all items are completed',
    required: true,
    placeholder: '',
  },
  {
    id: 'related',
    title: 'Related Issues',
    description: 'Link to related issues',
    required: false,
    placeholder: 'Fixes #123, Related to #456',
  },
];

export const DEFAULT_CHECKLIST = [
  'My code follows the project style guidelines',
  'I have performed a self-review of my code',
  'I have commented my code where necessary',
  'I have made corresponding changes to the documentation',
  'My changes generate no new warnings',
  'I have added tests that prove my fix is effective',
  'New and existing unit tests pass locally',
  'I have checked that no other PRs conflict with this change',
];

export function createTemplate(config?: Partial<PRTemplate>): PRTemplate {
  return {
    name: config?.name || 'Default PR Template',
    description: config?.description || 'Standard pull request template',
    sections: config?.sections || DEFAULT_SECTIONS,
    labels: config?.labels || [],
    checklist: config?.checklist || DEFAULT_CHECKLIST,
  };
}

export function generateTemplateMarkdown(template: PRTemplate): string {
  let markdown = `# ${template.name}\n\n`;
  markdown += `${template.description}\n\n`;
  markdown += `---\n\n`;
  
  for (const section of template.sections) {
    markdown += `## ${section.title}`;
    if (section.required) markdown += ' *';
    markdown += '\n\n';
    
    if (section.description) {
      markdown += `> ${section.description}\n\n`;
    }
    
    if (section.id === 'checklist') {
      for (const item of template.checklist) {
        markdown += `- [ ] ${item}\n`;
      }
      markdown += '\n';
    } else if (section.placeholder) {
      markdown += `${section.placeholder}\n\n`;
    }
  }
  
  markdown += `---\n\n`;
  markdown += `* Required field\n`;
  
  return markdown;
}

export function validatePR(generated: GeneratedPR): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!generated.title.trim()) {
    errors.push('PR title is required');
  } else if (generated.title.length < 10) {
    errors.push('PR title should be at least 10 characters');
  }
  
  if (!generated.body.trim()) {
    errors.push('PR body/description is required');
  } else if (generated.body.length < 20) {
    errors.push('PR description should be at least 20 characters');
  }
  
  return { valid: errors.length === 0, errors };
}

export function suggestLabels(pr: GeneratedPR): string[] {
  const labels: string[] = [];
  const body = pr.body.toLowerCase();
  
  if (body.includes('fix') || body.includes('bug')) {
    labels.push('bug');
  }
  if (body.includes('feat') || body.includes('feature') || body.includes('add')) {
    labels.push('enhancement');
  }
  if (body.includes('docs') || body.includes('documentation')) {
    labels.push('documentation');
  }
  if (body.includes('test')) {
    labels.push('test');
  }
  if (body.includes('breaking')) {
    labels.push('breaking-change');
  }
  if (body.includes('security')) {
    labels.push('security');
  }
  
  return [...new Set([...labels, ...pr.labels])];
}

export function parseConventionalPRTitle(title: string): {
  type: string;
  scope?: string;
  description: string;
  isBreaking: boolean;
} {
  const match = title.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  
  if (!match) {
    return { type: 'chore', description: title, isBreaking: false };
  }
  
  const [, type, scope, isBreaking, description] = match;
  
  return {
    type: type.toLowerCase(),
    scope: scope?.toLowerCase(),
    description,
    isBreaking: !!isBreaking,
  };
}

export function generatePRFromTemplate(
  template: PRTemplate,
  answers: Record<string, string>
): GeneratedPR {
  let body = `# ${template.name}\n\n`;
  
  for (const section of template.sections) {
    if (section.id === 'checklist') {
      body += `## ${section.title}\n\n`;
      for (const item of template.checklist) {
        body += `- [ ] ${item}\n`;
      }
      body += '\n';
    } else if (section.id === 'related') {
      const related = answers[section.id] || '';
      if (related) {
        body += `## ${section.title}\n\n${related}\n\n`;
      }
    } else {
      const content = answers[section.id] || '';
      if (content || section.required) {
        body += `## ${section.title}`;
        if (section.required) body += ' *';
        body += '\n\n';
        body += `${content || section.placeholder}\n\n`;
      }
    }
  }
  
  const title = answers.title || answers.summary || 'Update project';
  const labels = suggestLabels({ title, body, labels: template.labels, reviewers: [], assignees: [] });
  
  return {
    title,
    body,
    labels,
    reviewers: [],
    assignees: [],
  };
}

export type PRTemplateType = 'bug-fix' | 'feature' | 'refactor' | 'docs' | 'test' | 'chore';

export function getTemplateTypes(): PRTemplateType[] {
  return ['bug-fix', 'feature', 'refactor', 'docs', 'test', 'chore'];
}

export function getTemplateTypeLabel(type: PRTemplateType, locale: string = 'en'): string {
  const labels: Record<string, Record<PRTemplateType, string>> = {
    en: {
      'bug-fix': 'Bug Fix',
      'feature': 'Feature',
      'refactor': 'Refactor',
      'docs': 'Documentation',
      'test': 'Test',
      'chore': 'Chore',
    },
    zh: {
      'bug-fix': 'Bug 修复',
      'feature': '新功能',
      'refactor': '重构',
      'docs': '文档更新',
      'test': '测试',
      'chore': '杂项',
    },
  };
  return labels[locale]?.[type] || labels.en[type];
}
