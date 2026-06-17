export type BotAction = 
  | 'welcome_contributor'
  | 'thank_contributor'
  | 'request_review'
  | 'assign_maintainer'
  | 'add_labels'
  | 'close_inactive'
  | 'reply_template'
  | 'auto_merge'
  | 'check_ci';

export type TriggerType = 'event' | 'schedule' | 'manual';

export type EventTrigger = 'pr_opened' | 'pr_merged' | 'pr_closed' | 'issue_opened' | 'issue_closed' | 'comment_added' | 'fork' | 'star' | 'release';

export interface BotRule {
  id: string;
  name: string;
  description: string;
  action: BotAction;
  trigger: {
    type: TriggerType;
    event?: EventTrigger;
    schedule?: string; // cron expression
  };
  conditions?: Record<string, unknown>;
  enabled: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
  triggerCount: number;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  triggeredBy: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  success: boolean;
  error?: string;
  executedAt: Date;
}

export interface AutomationMetrics {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  executionRate: number;
}

export class BotAutomationManager {
  private rules: Map<string, BotRule> = new Map();
  private logs: AutomationLog[] = [];
  private readonly maxLogs = 1000;

  async createRule(data: {
    name: string;
    description: string;
    action: BotAction;
    trigger: {
      type: TriggerType;
      event?: EventTrigger;
      schedule?: string;
    };
    conditions?: Record<string, unknown>;
  }): Promise<BotRule> {
    const rule: BotRule = {
      id: `BOT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ...data,
      enabled: true,
      createdAt: new Date(),
      triggerCount: 0,
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  async updateRule(id: string, updates: Partial<BotRule>): Promise<BotRule | null> {
    const rule = this.rules.get(id);
    if (!rule) return null;

    Object.assign(rule, updates);
    return rule;
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.rules.delete(id);
  }

  async getRule(id: string): Promise<BotRule | null> {
    return this.rules.get(id) || null;
  }

  async getAllRules(): Promise<BotRule[]> {
    return Array.from(this.rules.values());
  }

  async getActiveRules(): Promise<BotRule[]> {
    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  async triggerEvent(event: EventTrigger, payload: Record<string, unknown>): Promise<AutomationLog[]> {
    const matchingRules = Array.from(this.rules.values()).filter(
      r => r.enabled && r.trigger.type === 'event' && r.trigger.event === event
    );

    const logs: AutomationLog[] = [];

    for (const rule of matchingRules) {
      const log = await this.executeRule(rule, event, payload);
      logs.push(log);
      
      rule.lastTriggeredAt = new Date();
      rule.triggerCount += 1;
    }

    return logs;
  }

  async executeScheduledRules(): Promise<AutomationLog[]> {
    const scheduledRules = Array.from(this.rules.values()).filter(
      r => r.enabled && r.trigger.type === 'schedule'
    );

    const logs: AutomationLog[] = [];

    for (const rule of scheduledRules) {
      const log = await this.executeRule(rule, 'schedule', {});
      logs.push(log);
      
      rule.lastTriggeredAt = new Date();
      rule.triggerCount += 1;
    }

    return logs;
  }

  async executeRuleManually(ruleId: string, payload: Record<string, unknown>): Promise<AutomationLog | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const log = await this.executeRule(rule, 'manual', payload);
    rule.lastTriggeredAt = new Date();
    rule.triggerCount += 1;

    return log;
  }

  private async executeRule(
    rule: BotRule,
    triggerType: string,
    input: Record<string, unknown>
  ): Promise<AutomationLog> {
    const log: AutomationLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      ruleId: rule.id,
      triggeredBy: triggerType,
      input,
      success: false,
      executedAt: new Date(),
    };

    try {
      const output = await this.performAction(rule.action, input, rule.conditions);
      log.output = output;
      log.success = true;
    } catch (error) {
      log.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.addLog(log);
    return log;
  }

  private async performAction(
    action: BotAction,
    input: Record<string, unknown>,
    conditions?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Simulate action execution
    const actionResults: Record<BotAction, Record<string, unknown>> = {
      welcome_contributor: {
        message: `Welcome to the project! 🎉`,
        action: 'comment',
        template: 'welcome',
      },
      thank_contributor: {
        message: `Thank you for your contribution! 🙏`,
        action: 'comment',
        template: 'thanks',
      },
      request_review: {
        message: `Would you mind reviewing this PR?`,
        action: 'request_reviewers',
        reviewers: conditions?.reviewers || ['maintainer'],
      },
      assign_maintainer: {
        action: 'assign',
        assignee: conditions?.maintainer || 'maintainer',
      },
      add_labels: {
        action: 'add_labels',
        labels: (conditions?.labels as string[]) || ['needs-review'],
      },
      close_inactive: {
        action: 'close',
        reason: 'not_planned',
        message: 'This issue has been inactive for a while. Closing for now.',
      },
      reply_template: {
        action: 'comment',
        template: conditions?.template || 'default',
        message: this.getTemplateMessage(conditions?.template as string),
      },
      auto_merge: {
        action: 'merge',
        method: 'squash',
        delete_branch: true,
      },
      check_ci: {
        action: 'check_status',
        checks: ['ci', 'lint', 'test'],
        status: 'pending',
      },
    };

    return actionResults[action];
  }

  private getTemplateMessage(template?: string): string {
    const templates: Record<string, string> = {
      welcome: 'Welcome to our project! Feel free to ask questions.',
      thanks: 'Thank you for your contribution! We appreciate your help.',
      help: 'Thanks for reaching out! Here\'s how you can get help...',
      duplicate: 'Thanks for reporting! This appears to be a duplicate of another issue.',
      default: 'Thank you for your input. We will review and respond shortly.',
    };
    return templates[template || 'default'] || templates.default;
  }

  private addLog(log: AutomationLog): void {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  async getLogs(ruleId?: string, limit = 100): Promise<AutomationLog[]> {
    let logs = this.logs;
    if (ruleId) {
      logs = logs.filter(l => l.ruleId === ruleId);
    }
    return logs.slice(0, limit);
  }

  async clearLogs(ruleId?: string): Promise<void> {
    if (ruleId) {
      this.logs = this.logs.filter(l => l.ruleId !== ruleId);
    } else {
      this.logs = [];
    }
  }

  async getMetrics(): Promise<AutomationMetrics> {
    const rules = Array.from(this.rules.values());
    const activeRules = rules.filter(r => r.enabled);
    const totalExecutions = rules.reduce((sum, r) => sum + r.triggerCount, 0);
    const successfulLogs = this.logs.filter(l => l.success).length;
    const failedLogs = this.logs.filter(l => !l.success).length;

    return {
      totalRules: rules.length,
      activeRules: activeRules.length,
      totalExecutions,
      successfulExecutions: successfulLogs,
      failedExecutions: failedLogs,
      executionRate: totalExecutions > 0 ? successfulLogs / totalExecutions : 0,
    };
  }

  async enableRule(id: string): Promise<BotRule | null> {
    return this.updateRule(id, { enabled: true });
  }

  async disableRule(id: string): Promise<BotRule | null> {
    return this.updateRule(id, { enabled: false });
  }
}
