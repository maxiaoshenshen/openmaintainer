/**
 * Issue Triage - Smart issue categorization and routing
 */

export interface Issue {
  id: string;
  title: string;
  body: string;
  labels: string[];
  author: string;
  createdAt: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  type?: 'bug' | 'feature' | 'question' | 'documentation' | 'maintenance';
  complexity?: 'simple' | 'moderate' | 'complex';
  estimatedTime?: string;
  skills?: string[];
  assignee?: string;
}

export interface TriageResult {
  issue: Issue;
  classification: {
    type: Issue['type'];
    priority: Issue['priority'];
    complexity: Issue['complexity'];
    confidence: number;
  };
  routing: {
    suggestedAssignee?: string;
    suggestedLabels: string[];
    suggestedMilestone?: string;
  };
  actionItems: string[];
}

export interface TeamMember {
  name: string;
  skills: string[];
  currentWorkload: number;
  expertise: Record<string, number>;
  availability: 'full' | 'partial' | 'unavailable';
}

const PATTERNS = {
  bug: /\b(fix|bug|error|crash|broken|not working|issue|problem)\b/i,
  feature: /\b(feature|enhancement|add|implement|support|would be nice)\b/i,
  question: /\b(how|what|why|can i|is it|question|help)\b/i,
  docs: /\b(docs?|documentation|readme|guide|example)\b/i,
};

const PRIORITY_PATTERNS = {
  critical: /\b(critical|urgent|security|vulnerability|blocked|lots of users)\b/i,
  high: /\b(important|soon|breaking|priority|asap)\b/i,
  medium: /\b(sometime|eventually|nice to have)\b/i,
  low: /\b(maybe|later|nice)\b/i,
};

export function classifyIssue(issue: Issue): TriageResult['classification'] {
  let type: Issue['type'] = 'maintenance';
  let typeConfidence = 0;
  let priority: Issue['priority'] = 'medium';
  let priorityConfidence = 0;
  let complexity: Issue['complexity'] = 'moderate';

  // Detect type from title and body
  const text = `${issue.title} ${issue.body}`;
  
  for (const [typeName, pattern] of Object.entries(PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      if (matches.length > typeConfidence) {
        type = typeName as Issue['type'];
        typeConfidence = matches.length;
      }
    }
  }

  // Detect priority
  for (const [priorityName, pattern] of Object.entries(PRIORITY_PATTERNS)) {
    if (pattern.test(text)) {
      priority = priorityName as Issue['priority'];
      priorityConfidence = 1;
      break;
    }
  }

  // Estimate complexity
  const wordCount = text.split(/\s+/).length;
  const hasCode = /```[\s\S]*?```/.test(text);
  const hasSteps = /\d+\.\s/.test(text);
  
  if (wordCount < 50 && !hasCode) complexity = 'simple';
  else if (wordCount > 200 || (hasCode && hasSteps)) complexity = 'complex';

  return {
    type: type!,
    priority: priority!,
    complexity: complexity!,
    confidence: Math.min(95, Math.max(50, typeConfidence * 30 + priorityConfidence * 20)),
  };
}

export function suggestAssignee(issue: Issue, team: TeamMember[]): string | undefined {
  const neededSkills = inferSkills(issue);
  if (neededSkills.length === 0) return undefined;

  const available = team.filter(m => m.availability !== 'unavailable');
  
  let bestMatch: TeamMember | null = null;
  let bestScore = -1;

  for (const member of available) {
    let score = 0;
    
    // Skill match
    for (const skill of neededSkills) {
      score += member.expertise[skill] || 0;
    }
    
    // Workload factor
    score -= member.currentWorkload * 0.5;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = member;
    }
  }

  return bestMatch?.name;
}

function inferSkills(issue: Issue): string[] {
  const skills: string[] = [];
  const text = `${issue.title} ${issue.body} ${issue.labels.join(' ')}`.toLowerCase();
  
  const skillMap: Record<string, string[]> = {
    javascript: ['javascript', 'js', 'node'],
    typescript: ['typescript', 'ts'],
    python: ['python', 'py'],
    rust: ['rust', 'rs'],
    go: ['golang', 'go'],
    frontend: ['react', 'vue', 'angular', 'css', 'html'],
    backend: ['api', 'server', 'database'],
    security: ['security', 'auth', 'vulnerability'],
    devops: ['docker', 'ci', 'deployment', 'kubernetes'],
  };

  for (const [skill, keywords] of Object.entries(skillMap)) {
    if (keywords.some(k => text.includes(k))) {
      skills.push(skill);
    }
  }

  return skills;
}

export function suggestLabels(issue: Issue, classification: TriageResult['classification']): string[] {
  const labels: string[] = [];

  // Add type label
  labels.push(`type: ${classification.type}`);
  
  // Add priority label
  labels.push(`priority: ${classification.priority}`);
  
  // Add complexity label
  labels.push(`complexity: ${classification.complexity}`);
  
  // Copy existing relevant labels
  const existingRelevant = issue.labels.filter(l => 
    l.startsWith('good first issue') || 
    l.startsWith('help wanted') ||
    l.startsWith('wontfix') ||
    l.startsWith('duplicate')
  );
  labels.push(...existingRelevant);

  return [...new Set(labels)];
}

export function triageIssue(issue: Issue, team: TeamMember[]): TriageResult {
  const classification = classifyIssue(issue);
  const suggestedAssignee = suggestAssignee(issue, team);
  const suggestedLabels = suggestLabels(issue, classification);

  const actionItems: string[] = [];
  
  if (classification.priority === 'critical') {
    actionItems.push('🔴 Immediate attention required');
  }
  if (classification.type === 'bug' && !issue.labels.some(l => l.includes('bug'))) {
    actionItems.push('Add bug label');
  }
  if (!suggestedAssignee) {
    actionItems.push('Post in community for volunteer');
  }

  return {
    issue,
    classification,
    routing: {
      suggestedAssignee,
      suggestedLabels,
    },
    actionItems,
  };
}

export function batchTriage(issues: Issue[], team: TeamMember[]): TriageResult[] {
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  
  return issues
    .map(issue => triageIssue(issue, team))
    .sort((a, b) => priorityOrder[a.classification.priority] - priorityOrder[b.classification.priority]);
}
