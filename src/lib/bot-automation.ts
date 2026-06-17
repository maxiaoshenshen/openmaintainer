/**
 * Bot Automation - GitHub bot management and automation
 */

export interface BotConfig {
  name: string;
  enabled: boolean;
  triggerOn?: ('pull_request' | 'issues' | 'push' | 'release' | 'comment')[];
  actions?: BotAction[];
}

export interface BotAction {
  name: string;
  when: string;  // Expression or condition
  then: ActionStep[];
}

export interface ActionStep {
  type: 'comment' | 'label' | 'assign' | 'close' | 'notify' | 'webhook';
  config: Record<string, string>;
}

export interface PRContext {
  number: number;
  title: string;
  author: string;
  files: string[];
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  draft: boolean;
  baseBranch: string;
  headBranch: string;
}

export interface IssueContext {
  number: number;
  title: string;
  author: string;
  body: string;
  labels: string[];
  assignees: string[];
  state: 'open' | 'closed';
}

export interface AutomationResult {
  triggered: boolean;
  actionTaken?: string;
  message?: string;
}

export function shouldTriggerBot(config: BotConfig, event: string, context: PRContext | IssueContext): boolean {
  if (!config.enabled) return false;
  if (!config.triggerOn?.includes(event as any)) return false;
  return true;
}

export function evaluateCondition(condition: string, context: PRContext | IssueContext): boolean {
  const ctx = context as any;
  
  // Handle simple property checks
  const checks: Record<string, () => boolean> = {
    'draft': () => ctx.draft === true,
    'not draft': () => ctx.draft !== true,
    'small pr': () => ctx.changedFiles <= 10,
    'large pr': () => ctx.changedFiles > 50,
    'security related': () => ctx.labels?.some((l: string) => l.toLowerCase().includes('security')),
    'breaking change': () => ctx.labels?.some((l: string) => l.toLowerCase().includes('breaking')) || 
                          ctx.title?.toLowerCase().includes('breaking'),
  };

  return checks[condition]?.() || false;
}

export function executeAction(step: ActionStep, context: PRContext | IssueContext): AutomationResult {
  switch (step.type) {
    case 'comment':
      return {
        triggered: true,
        actionTaken: 'comment',
        message: `Bot would comment: "${step.config.message}"`,
      };

    case 'label':
      return {
        triggered: true,
        actionTaken: 'add_label',
        message: `Would add label: ${step.config.name}`,
      };

    case 'assign':
      return {
        triggered: true,
        actionTaken: 'assign',
        message: `Would assign to: ${step.config.users}`,
      };

    case 'close':
      return {
        triggered: true,
        actionTaken: 'close',
        message: 'Would close the ' + ('files' in context ? 'PR' : 'issue'),
      };

    case 'notify':
      return {
        triggered: true,
        actionTaken: 'notify',
        message: `Would notify: ${step.config.channel} with message: ${step.config.message}`,
      };

    default:
      return { triggered: false };
  }
}

export function runBot(config: BotConfig, event: string, context: PRContext | IssueContext): AutomationResult[] {
  if (!shouldTriggerBot(config, event, context)) {
    return [{ triggered: false }];
  }

  const results: AutomationResult[] = [];

  config.actions?.forEach(action => {
    if (evaluateCondition(action.when, context)) {
      action.then.forEach(step => {
        results.push(executeAction(step, context));
      });
    }
  });

  return results;
}

// Predefined bot templates
export const GREETING_BOT: BotConfig = {
  name: 'Greeting Bot',
  enabled: true,
  triggerOn: ['pull_request', 'issues'],
  actions: [
    {
      name: 'welcome_new_contributors',
      when: 'not draft',
      then: [
        {
          type: 'comment',
          config: { message: 'Thank you for your contribution! 🎉' },
        },
      ],
    },
  ],
};

export const SECURITY_BOT: BotConfig = {
  name: 'Security Bot',
  enabled: true,
  triggerOn: ['pull_request'],
  actions: [
    {
      name: 'check_security',
      when: 'security related',
      then: [
        {
          type: 'label',
          config: { name: 'security-review' },
        },
        {
          type: 'assign',
          config: { users: '@security-team' },
        },
      ],
    },
  ],
};

export const SIZE_LABELING_BOT: BotConfig = {
  name: 'Size Labeling Bot',
  enabled: true,
  triggerOn: ['pull_request'],
  actions: [
    {
      name: 'label_by_size',
      when: 'small pr',
      then: [{ type: 'label', config: { name: 'size/small' } }],
    },
    {
      name: 'label_by_size',
      when: 'large pr',
      then: [{ type: 'label', config: { name: 'size/large' } }],
    },
  ],
};
