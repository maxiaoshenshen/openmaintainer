/**
 * Project Roadmap Generator
 * Create structured roadmaps from issues and milestones
 */

import type { Issue, PullRequest } from './types';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type MilestoneStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  type: 'feature' | 'bugfix' | 'improvement' | 'research' | 'documentation';
  estimatedEffort: number;
  labels: string[];
  linkedIssues: number[];
  status: MilestoneStatus;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  targetDate: Date;
  items: RoadmapItem[];
  progress: number;
  status: MilestoneStatus;
}

export interface Roadmap {
  version: string;
  title: string;
  description: string;
  milestones: Milestone[];
  totalItems: number;
  completedItems: number;
  estimatedCompletion: Date;
}

export function extractPriority(labels: string[]): Priority {
  if (labels.some(l => l.toLowerCase().includes('priority:critical') || l.toLowerCase().includes('p0'))) return 'critical';
  if (labels.some(l => l.toLowerCase().includes('priority:high') || l.toLowerCase().includes('p1'))) return 'high';
  if (labels.some(l => l.toLowerCase().includes('priority:medium') || l.toLowerCase().includes('p2'))) return 'medium';
  return 'low';
}

export function extractType(labels: string[]): RoadmapItem['type'] {
  if (labels.some(l => l.toLowerCase().includes('feature') || l.toLowerCase().includes('enhancement'))) return 'feature';
  if (labels.some(l => l.toLowerCase().includes('bug') || l.toLowerCase().includes('fix'))) return 'bugfix';
  if (labels.some(l => l.toLowerCase().includes('improvement'))) return 'improvement';
  if (labels.some(l => l.toLowerCase().includes('research') || l.toLowerCase().includes('investigation'))) return 'research';
  if (labels.some(l => l.toLowerCase().includes('docs') || l.toLowerCase().includes('documentation'))) return 'documentation';
  return 'feature';
}

export function estimateEffort(issue: Issue): number {
  let effort = 1;
  
  const labels = issue.labels || [];
  if (labels.some(l => l.includes('effort:large') || l.includes('large'))) effort = 5;
  else if (labels.some(l => l.includes('effort:medium') || l.includes('medium'))) effort = 3;
  else if (labels.some(l => l.includes('effort:small') || l.includes('small'))) effort = 1;
  
  const title = issue.title.toLowerCase();
  if (title.includes('architecture') || title.includes('refactor')) effort += 2;
  if (title.includes('api') || title.includes('integration')) effort += 1;
  
  return Math.min(10, effort);
}

export function convertIssueToRoadmapItem(issue: Issue): RoadmapItem {
  return {
    id: `issue-${issue.number}`,
    title: issue.title,
    description: issue.body || '',
    priority: extractPriority(issue.labels || []),
    type: extractType(issue.labels || []),
    estimatedEffort: estimateEffort(issue),
    labels: issue.labels || [],
    linkedIssues: [],
    status: issue.state === 'closed' ? 'completed' : 'planned',
  };
}

export function groupByMilestone(issues: Issue[]): Map<string, Issue[]> {
  const groups = new Map<string, Issue[]>();
  
  for (const issue of issues) {
    const milestone = issue.milestone || 'Backlog';
    const existing = groups.get(milestone) || [];
    existing.push(issue);
    groups.set(milestone, existing);
  }
  
  return groups;
}

export function sortByPriority(items: RoadmapItem[]): RoadmapItem[] {
  const priorityOrder: Record<Priority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  
  return [...items].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.estimatedEffort - a.estimatedEffort;
  });
}

export function calculateMilestoneProgress(milestone: Milestone): number {
  if (milestone.items.length === 0) return 0;
  const completed = milestone.items.filter(i => i.status === 'completed').length;
  return Math.round((completed / milestone.items.length) * 100);
}

export function estimateCompletion(items: RoadmapItem[], velocity: number = 2): Date {
  const remaining = items.filter(i => i.status !== 'completed');
  const totalEffort = remaining.reduce((sum, i) => sum + i.estimatedEffort, 0);
  const weeksNeeded = Math.ceil(totalEffort / velocity);
  const completion = new Date();
  completion.setDate(completion.getDate() + weeksNeeded * 7);
  return completion;
}

export function generateRoadmap(
  issues: Issue[],
  title: string,
  version: string,
  options?: {
    startDate?: Date;
    milestones?: string[];
    velocity?: number;
  }
): Roadmap {
  const { startDate = new Date(), velocity = 2 } = options || {};
  
  const allItems = issues.map(convertIssueToRoadmapItem);
  const grouped = groupByMilestone(issues);
  
  const milestones: Milestone[] = [];
  
  grouped.forEach((milestoneIssues, milestoneTitle) => {
    const items = milestoneIssues.map(convertIssueToRoadmapItem);
    const sortedItems = sortByPriority(items);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + sortedItems.length * 3);
    
    const completedCount = sortedItems.filter(i => i.status === 'completed').length;
    let status: MilestoneStatus = 'planned';
    if (completedCount === sortedItems.length) status = 'completed';
    else if (completedCount > 0) status = 'in-progress';
    
    milestones.push({
      id: `milestone-${milestones.length + 1}`,
      title: milestoneTitle,
      description: `Milestone for ${milestoneTitle}`,
      startDate,
      targetDate: endDate,
      items: sortedItems,
      progress: Math.round((completedCount / sortedItems.length) * 100),
      status,
    });
  });
  
  const totalItems = allItems.length;
  const completedItems = allItems.filter(i => i.status === 'completed').length;
  
  return {
    version,
    title,
    description: `Roadmap for ${title} v${version}`,
    milestones,
    totalItems,
    completedItems,
    estimatedCompletion: estimateCompletion(allItems, velocity),
  };
}

export function exportRoadmapMarkdown(roadmap: Roadmap): string {
  let md = `# ${roadmap.title}\n\n`;
  md += `${roadmap.description}\n\n`;
  md += `**Overall Progress**: ${roadmap.completedItems}/${roadmap.totalItems} items completed\n\n`;
  md += `---\n\n`;
  
  for (const milestone of roadmap.milestones) {
    md += `## ${milestone.title}\n\n`;
    md += `**Progress**: ${milestone.progress}% | **Status**: ${milestone.status}\n\n`;
    md += `**Target**: ${milestone.targetDate.toISOString().split('T')[0]}\n\n`;
    
    const priorityGroups = new Map<Priority, RoadmapItem[]>();
    for (const item of milestone.items) {
      const existing = priorityGroups.get(item.priority) || [];
      existing.push(item);
      priorityGroups.set(item.priority, existing);
    }
    
    for (const [priority, items] of priorityGroups) {
      md += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
      for (const item of items) {
        const statusIcon = item.status === 'completed' ? '✅' : '⬜';
        md += `${statusIcon} [${item.title}](#${item.id}) - ${item.type}\n`;
      }
      md += '\n';
    }
  }
  
  return md;
}

export function generateGanttData(roadmap: Roadmap): {
  milestones: { name: string; start: Date; end: Date; progress: number }[];
  items: { name: string; start: Date; end: Date; milestone: string; status: string }[];
} {
  const milestones = roadmap.milestones.map(m => ({
    name: m.title,
    start: m.startDate,
    end: m.targetDate,
    progress: m.progress,
  }));
  
  const items: { name: string; start: Date; end: Date; milestone: string; status: string }[] = [];
  
  for (const milestone of roadmap.milestones) {
    let currentDate = milestone.startDate;
    for (const item of milestone.items) {
      const duration = item.estimatedEffort * 2;
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + duration);
      items.push({
        name: item.title,
        start: currentDate,
        end: endDate,
        milestone: milestone.title,
        status: item.status,
      });
      currentDate = endDate;
    }
  }
  
  return { milestones, items };
}
