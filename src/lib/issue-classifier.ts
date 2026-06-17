/**
 * Issue Auto-Classifier
 * Automatically categorizes and prioritizes GitHub issues
 */

export type IssueCategory = 
  | 'bug'
  | 'enhancement'
  | 'question'
  | 'documentation'
  | 'help-wanted'
  | 'security'
  | 'performance'
  | 'ux'
  | 'accessibility'
  | 'duplicate'
  | 'wontfix'
  | 'good-first-issue';

export type IssuePriority = 'critical' | 'high' | 'medium' | 'low';
export type Complexity = 'simple' | 'moderate' | 'complex';

export interface IssueClassification {
  category: IssueCategory;
  priority: IssuePriority;
  complexity: Complexity;
  confidence: number; // 0-1
  reasoning: string;
  suggestedLabels: string[];
  estimatedEffort?: string;
  relatedIssues?: number[];
}

export interface CategoryRules {
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

const CATEGORY_RULES: Record<IssueCategory, CategoryRules> = {
  bug: {
    patterns: [
      /\b(bug|broken|error|fail|issue|problem)\b/i,
      /\b(not working|doesn't work|doesn't|won't)\b/i,
      /\b(crash|crashed|crashes)\b/i,
      /\b(incorrect|wrong)\b result/i,
    ],
    keywords: ['bug', 'fix', 'broken', 'crash', 'error', 'fix'],
    weight: 1,
  },
  enhancement: {
    patterns: [
      /\b(feat|feature|add|improvement|improve)\b/i,
      /\b(would be nice|nice to have|could add)\b/i,
      /\b(extending|extend|enhance)\b/i,
    ],
    keywords: ['feature', 'enhancement', 'improve', 'add', 'optimize'],
    weight: 1,
  },
  question: {
    patterns: [
      /\b(how do|how can|what is|what are|why does|when)\b/i,
      /\?(?!\s*\w)/,
      /\b(could you|can you|would you)\b/i,
      /\b(understand|clarify|explain)\b/i,
    ],
    keywords: ['question', 'how', 'what', 'why', '?', 'help'],
    weight: 1,
  },
  documentation: {
    patterns: [
      /\b(doc|docs|documentation|readme|guide)\b/i,
      /\b(update.*doc|add.*doc|missing.*doc)\b/i,
      /\b(comment|example)\b/i,
    ],
    keywords: ['docs', 'documentation', 'readme', 'guide', 'example'],
    weight: 1,
  },
  'help-wanted': {
    patterns: [
      /\b(help wanted|need help|looking for|anyone)\b/i,
      /\b(first time|beginner|newcomer)\b/i,
      /\b(contributor|contributing)\b/i,
    ],
    keywords: ['help', 'wanted', 'first time', 'beginner'],
    weight: 1,
  },
  security: {
    patterns: [
      /\b(security|vulnerability|cve|exploit|xss|sql.?inject|csrf)\b/i,
      /\b(permission|access control|auth)\b/i,
      /\b(sensitive|data leak|exposure)\b/i,
    ],
    keywords: ['security', 'vulnerability', 'cve', 'hack', 'injection'],
    weight: 1.5,
  },
  performance: {
    patterns: [
      /\b(performance|slow|speed|optimize|fast|bottleneck)\b/i,
      /\b(memory|leak|heap|cpu|loading time)\b/i,
      /\b(scalab|efficiency|latency)\b/i,
    ],
    keywords: ['performance', 'speed', 'optimize', 'slow', 'memory'],
    weight: 1,
  },
  ux: {
    patterns: [
      /\b(ux|ui|user.?experience|design|interface|layout)\b/i,
      /\b(button|link|menu|navigation|modal)\b/i,
      /\b(click|hover|responsive|mobile)\b/i,
    ],
    keywords: ['ui', 'ux', 'design', 'interface', 'visual'],
    weight: 1,
  },
  accessibility: {
    patterns: [
      /\b(accessibility|a11y|screen.?reader|aria|keyboard)\b/i,
      /\b(blind|visual.?impair|color.?blind|contrast)\b/i,
      /\b(focus|navigate|alt.?text|semantics)\b/i,
    ],
    keywords: ['accessibility', 'a11y', 'wcag', 'screen reader', 'alt'],
    weight: 1,
  },
  duplicate: {
    patterns: [
      /\b(duplicate|same|already|previously)\b/i,
      /#\d{3,}/,
    ],
    keywords: ['duplicate', 'already exists', 'same issue'],
    weight: 0.8,
  },
  wontfix: {
    patterns: [
      /\b(won't fix|wontfix|out of scope|not a bug)\b/i,
      /\b(deprecated|obsolete|end.?of.?life)\b/i,
    ],
    keywords: ['wontfix', 'won\'t fix', 'out of scope'],
    weight: 0.8,
  },
  'good-first-issue': {
    patterns: [
      /\b(good first issue|easy|starter|beginner.?friendly)\b/i,
      /\b(quick|small|simple|trivial)\b/i,
      /\b(introductory|new.?contributor)\b/i,
    ],
    keywords: ['good first issue', 'easy', 'starter', 'beginner'],
    weight: 1,
  },
};

const PRIORITY_INDICATORS: Record<IssuePriority, { patterns: RegExp[]; score: number }> = {
  critical: {
    patterns: [
      /\b(critical|urgent|emergency|p0|crash|production)\b/i,
      /\b(data loss|security|down)\b/i,
      /\b(blocking|blocks)\b/i,
    ],
    score: 100,
  },
  high: {
    patterns: [
      /\b(high|important|priority|breaking)\b/i,
      /\b(major|significant|affects many)\b/i,
      /\b(p1|p2)\b/i,
    ],
    score: 70,
  },
  medium: {
    patterns: [
      /\b(medium|normal|standard)\b/i,
      /\b(p3)\b/i,
    ],
    score: 40,
  },
  low: {
    patterns: [
      /\b(low|nice.?to.?have|minor|trivial)\b/i,
      /\b(p4|p5)\b/i,
      /\b(enhancement)\b/i,
    ],
    score: 10,
  },
};

/**
 * Classify an issue based on its title and body
 */
export function classifyIssue(params: {
  title: string;
  body?: string;
  labels?: string[];
  existingLabels?: string[];
}): IssueClassification {
  const { title, body, labels = [], existingLabels = [] } = params;
  const text = `${title} ${body || ''}`.toLowerCase();
  
  // Calculate category scores
  const categoryScores: Record<IssueCategory, number> = {} as any;
  
  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    let score = 0;
    
    // Check patterns
    for (const pattern of rules.patterns) {
      if (pattern.test(text)) {
        score += 10 * rules.weight;
      }
    }
    
    // Check keywords
    for (const keyword of rules.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 5 * rules.weight;
      }
    }
    
    // Check existing labels
    const labelMatch = existingLabels.some(l => 
      l.toLowerCase().includes(category.replace('-', ' ')) ||
      l.toLowerCase().includes(category.replace('-', ''))
    );
    if (labelMatch) {
      score += 15;
    }
    
    categoryScores[category as IssueCategory] = score;
  }
  
  // Find best category
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a) as [IssueCategory, number][];
  
  const [topCategory, topScore] = sortedCategories[0];
  const confidence = Math.min(1, topScore / 50);
  
  // Calculate priority
  const priority = calculatePriority(text, labels);
  
  // Calculate complexity
  const complexity = calculateComplexity(text);
  
  // Generate suggestions
  const suggestedLabels = generateLabelSuggestions(topCategory, priority);
  
  return {
    category: topCategory,
    priority,
    complexity,
    confidence,
    reasoning: generateReasoning(topCategory, topScore, sortedCategories),
    suggestedLabels,
    estimatedEffort: estimateEffort(complexity, categoryScores.bug > 30),
  };
}

function calculatePriority(text: string, labels: string[]): IssuePriority {
  let score = 50; // Base score
  
  for (const [priority, indicators] of Object.entries(PRIORITY_INDICATORS)) {
    for (const pattern of indicators.patterns) {
      if (pattern.test(text)) {
        const diff = Math.abs(indicators.score - 50);
        score = diff > Math.abs(score - 50) ? indicators.score : score;
      }
    }
    
    // Check labels
    for (const label of labels) {
      if (label.toLowerCase().includes(priority)) {
        score = Math.max(score, indicators.score);
      }
    }
  }
  
  if (score >= 85) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function calculateComplexity(text: string): Complexity {
  const wordCount = text.split(/\s+/).length;
  const hasCodeBlocks = /```/.test(text);
  const hasMultipleFiles = /\.\w+\(.*\.\w+\)/.test(text) || /\w+\.\w+.*,\s*.*\w+\.\w+/.test(text);
  const hasComplexWords = wordCount > 200;
  
  if (wordCount > 200 || hasCodeBlocks || (hasMultipleFiles && wordCount > 50)) {
    return 'complex';
  }
  if (wordCount > 80 || hasCodeBlocks) {
    return 'moderate';
  }
  return 'simple';
}

function generateLabelSuggestions(category: IssueCategory, priority: IssuePriority): string[] {
  const labels: string[] = [category];
  
  if (priority === 'critical') labels.push('critical');
  else if (priority === 'high') labels.push('priority');
  
  // Category-specific labels
  const categoryLabels: Record<IssueCategory, string[]> = {
    bug: ['bug'],
    enhancement: ['enhancement'],
    question: ['question'],
    documentation: ['documentation'],
    'help-wanted': ['help wanted'],
    security: ['security'],
    performance: ['performance'],
    ux: ['ux'],
    accessibility: ['accessibility'],
    duplicate: ['duplicate'],
    wontfix: ['wontfix'],
    'good-first-issue': ['good first issue'],
  };
  
  return [...new Set([...labels, ...(categoryLabels[category] || [])])];
}

function generateReasoning(category: IssueCategory, score: number, sorted: [IssueCategory, number][]): string {
  const reasons: string[] = [];
  
  if (score > 40) {
    reasons.push(`Strong indicators for "${category}"`);
  } else if (score > 20) {
    reasons.push(`Moderate indicators for "${category}"`);
  } else {
    reasons.push(`Some indicators for "${category}"`);
  }
  
  if (sorted[1]) {
    const second = sorted[1];
    const ratio = score / Math.max(1, second[1]);
    if (ratio < 1.5) {
      reasons.push(`Could also be "${second[0]}"`);
    }
  }
  
  return reasons.join('. ');
}

function estimateEffort(complexity: Complexity, isBug: boolean): string {
  if (complexity === 'complex') return isBug ? '2-4 hours' : '4-8 hours';
  if (complexity === 'moderate') return isBug ? '30-60 min' : '1-2 hours';
  return isBug ? '15-30 min' : '30-60 min';
}

/**
 * Batch classify multiple issues
 */
export function batchClassifyIssues(issues: Array<{
  title: string;
  body?: string;
  labels?: string[];
}>): IssueClassification[] {
  return issues.map(issue => classifyIssue(issue));
}
