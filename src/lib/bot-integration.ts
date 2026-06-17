import { Repository } from './types';

export interface BotConfig {
  name: string;
  enabled: boolean;
  schedule?: string;
  filters?: {
    labels?: string[];
    authors?: string[];
    states?: string[];
  };
}

export interface BotTask {
  id: string;
  botName: string;
  action: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: 'issue_created' | 'pr_opened' | 'pr_merged' | 'label_added' | 'comment_added' | 'schedule';
  conditions: {
    labels?: string[];
    authors?: string[];
    titleContains?: string[];
    bodyContains?: string[];
  };
  actions: {
    type: 'add_label' | 'add_comment' | 'close' | 'assign' | 'notify' | 'lock';
    params: Record<string, string>;
  }[];
  enabled: boolean;
}

export interface BotStats {
  botName: string;
  tasksProcessed: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun: Date;
}

export function createBotConfig(
  name: string,
  enabled: boolean = true,
  schedule?: string
): BotConfig {
  return { name, enabled, schedule };
}

export function createBotTask(
  botName: string,
  action: string,
  target: string
): BotTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    botName,
    action,
    target,
    status: 'pending',
    createdAt: new Date()
  };
}

export function executeTask(task: BotTask): BotTask {
  return {
    ...task,
    status: 'running',
  };
}

export function completeTask(task: BotTask, result: string): BotTask {
  return {
    ...task,
    status: 'completed',
    completedAt: new Date(),
    result
  };
}

export function failTask(task: BotTask, error: string): BotTask {
  return {
    ...task,
    status: 'failed',
    completedAt: new Date(),
    result: error
  };
}

export function createAutomationRule(
  name: string,
  trigger: AutomationRule['trigger'],
  conditions: AutomationRule['conditions'],
  actions: AutomationRule['actions']
): AutomationRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    trigger,
    conditions,
    actions,
    enabled: true
  };
}

export function shouldTriggerRule(
  rule: AutomationRule,
  event: { type: string; labels?: string[]; author?: string; title?: string; body?: string }
): boolean {
  if (rule.trigger !== event.type) return false;
  
  const { labels, authors, titleContains, bodyContains } = rule.conditions;
  
  if (labels && labels.length > 0 && !labels.some(l => event.labels?.includes(l))) {
    return false;
  }
  
  if (authors && authors.length > 0 && !authors.includes(event.author || '')) {
    return false;
  }
  
  if (titleContains && titleContains.length > 0 && 
      !titleContains.some(t => event.title?.toLowerCase().includes(t.toLowerCase()))) {
    return false;
  }
  
  if (bodyContains && bodyContains.length > 0 && 
      !bodyContains.some(t => event.body?.toLowerCase().includes(t.toLowerCase()))) {
    return false;
  }
  
  return true;
}

export function calculateBotStats(tasks: BotTask[]): BotStats[] {
  const byBot = new Map<string, BotTask[]>();
  tasks.forEach(t => {
    if (!byBot.has(t.botName)) byBot.set(t.botName, []);
    byBot.get(t.botName)!.push(t);
  });

  const stats: BotStats[] = [];
  byBot.forEach((botTasks, botName) => {
    const completed = botTasks.filter(t => t.status === 'completed');
    const successRate = botTasks.length > 0 ? (completed.length / botTasks.length) * 100 : 0;
    const totalTime = botTasks
      .filter(t => t.completedAt)
      .reduce((sum, t) => sum + (t.completedAt!.getTime() - t.createdAt.getTime()), 0);
    const avgTime = completed.length > 0 ? totalTime / completed.length : 0;
    const lastRun = botTasks.reduce((latest, t) => 
      t.completedAt && (!latest || t.completedAt > latest) ? t.completedAt : latest, 
      undefined as Date | undefined
    );

    stats.push({
      botName,
      tasksProcessed: botTasks.length,
      successRate: Math.round(successRate * 100) / 100,
      avgExecutionTime: Math.round(avgTime / 1000),
      lastRun: lastRun || new Date()
    });
  });

  return stats;
}
