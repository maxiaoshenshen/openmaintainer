/**
 * Code Review Templates
 * Pre-built templates for effective code reviews
 */

export interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  categories: ReviewCategory[];
  defaultItems: ReviewItem[];
}

export interface ReviewCategory {
  id: string;
  name: string;
  icon: string;
  weight: number;
}

export interface ReviewItem {
  id: string;
  category: string;
  question: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  required: boolean;
}

export const DEFAULT_TEMPLATES: ReviewTemplate[] = [
  {
    id: 'security-first',
    name: 'Security First',
    description: 'Focused review for security-sensitive changes',
    categories: [
      { id: 'auth', name: 'Authentication & Authorization', icon: '🔐', weight: 3 },
      { id: 'input', name: 'Input Validation', icon: '🛡️', weight: 3 },
      { id: 'data', name: 'Data Handling', icon: '📊', weight: 2 },
      { id: 'crypto', name: 'Cryptography', icon: '🔒', weight: 3 },
    ],
    defaultItems: [
      { id: 'sec-1', category: 'auth', question: 'Is authentication properly validated?', severity: 'critical', required: true },
      { id: 'sec-2', category: 'auth', question: 'Are authorization checks in place?', severity: 'critical', required: true },
      { id: 'sec-3', category: 'input', question: 'Is user input sanitized?', severity: 'critical', required: true },
      { id: 'sec-4', category: 'data', question: 'Are sensitive data handled securely?', severity: 'high', required: true },
    ],
  },
  {
    id: 'performance-focused',
    name: 'Performance Focused',
    description: 'Review for performance optimization',
    categories: [
      { id: 'perf', name: 'Performance', icon: '⚡', weight: 3 },
      { id: 'mem', name: 'Memory', icon: '💾', weight: 2 },
      { id: 'db', name: 'Database', icon: '🗄️', weight: 2 },
    ],
    defaultItems: [
      { id: 'perf-1', category: 'perf', question: 'Are there any N+1 query issues?', severity: 'high', required: true },
      { id: 'perf-2', category: 'mem', question: 'Are there memory leaks?', severity: 'high', required: true },
      { id: 'perf-3', category: 'db', question: 'Are indexes properly used?', severity: 'medium', required: false },
    ],
  },
  {
    id: 'maintainability',
    name: 'Maintainability',
    description: 'Ensure code is maintainable and readable',
    categories: [
      { id: 'style', name: 'Code Style', icon: '✨', weight: 2 },
      { id: 'docs', name: 'Documentation', icon: '📝', weight: 2 },
      { id: 'test', name: 'Test Coverage', icon: '🧪', weight: 3 },
    ],
    defaultItems: [
      { id: 'maint-1', category: 'style', question: 'Is code style consistent?', severity: 'medium', required: false },
      { id: 'maint-2', category: 'docs', question: 'Are public APIs documented?', severity: 'medium', required: true },
      { id: 'maint-3', category: 'test', question: 'Are edge cases tested?', severity: 'high', required: true },
    ],
  },
];

/**
 * Generate review checklist from template
 */
export function generateReviewChecklist(
  template: ReviewTemplate,
  fileCount: number,
  changeSize: 'small' | 'medium' | 'large'
): string {
  const timeEstimate = calculateReviewTime(template, fileCount, changeSize);
  
  let checklist = `# Code Review: ${template.name}\n\n`;
  checklist += `**Est. Time:** ${timeEstimate} minutes\n`;
  checklist += `**Files:** ${fileCount}\n`;
  checklist += `**Size:** ${changeSize}\n\n`;
  
  checklist += '## Checklist\n\n';
  
  for (const category of template.categories) {
    checklist += `### ${category.icon} ${category.name}\n\n`;
    const items = template.defaultItems.filter(i => i.category === category.id);
    for (const item of items) {
      const check = item.required ? '[ ]' : '[ ]';
      checklist += `${check} ${item.question} `;
      checklist += `(${item.severity})\n`;
    }
    checklist += '\n';
  }
  
  return checklist;
}

/**
 * Calculate estimated review time
 */
export function calculateReviewTime(
  template: ReviewTemplate,
  fileCount: number,
  changeSize: 'small' | 'medium' | 'large'
): number {
  const baseTime = 5; // minutes
  const perFile = { small: 2, medium: 5, large: 10 }[changeSize];
  const weightFactor = template.categories.reduce((sum, c) => sum + c.weight, 0) / 10;
  
  return Math.round((baseTime + fileCount * perFile) * weightFactor);
}

/**
 * Get template by ID
 */
export function getTemplate(id: string): ReviewTemplate | undefined {
  return DEFAULT_TEMPLATES.find(t => t.id === id);
}

/**
 * Merge custom items into template
 */
export function customizeTemplate(
  template: ReviewTemplate,
  customItems: ReviewItem[]
): ReviewTemplate {
  return {
    ...template,
    defaultItems: [...template.defaultItems, ...customItems],
  };
}
