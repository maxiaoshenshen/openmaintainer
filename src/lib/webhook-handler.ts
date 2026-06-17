import type { Issue, PullRequest, Contributor } from "./types";

export interface WebhookEvent {
  action: string;
  repository: {
    owner: string;
    name: string;
    fullName: string;
  };
  sender: {
    login: string;
    type: string;
  };
  issue?: {
    number: number;
    title: string;
    body?: string;
    state: string;
    labels: string[];
    assignees: string[];
  };
  pull_request?: {
    number: number;
    title: string;
    body?: string;
    state: string;
    merged: boolean;
    labels: string[];
  };
}

export interface WebhookHandler {
  handleIssueOpened(issue: Issue): Promise<void>;
  handleIssueClosed(issue: Issue): Promise<void>;
  handlePROpened(pr: PullRequest): Promise<void>;
  handlePRMerged(pr: PullRequest): Promise<void>;
  handleContributorJoined(contributor: Contributor): Promise<void>;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: "issue.opened" | "issue.closed" | "pr.opened" | "pr.merged" | "contributor.joined";
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationCondition {
  type: "label" | "author" | "title" | "body" | "size";
  operator: "contains" | "equals" | "starts_with" | "regex";
  value: string;
}

export interface AutomationAction {
  type: "add_label" | "remove_label" | "assign" | "comment" | "notify" | "close";
  value: string;
}

class WebhookAutomationEngine {
  private rules: AutomationRule[] = [];

  addRule(rule: AutomationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  getRules(): AutomationRule[] {
    return [...this.rules];
  }

  private evaluateCondition(condition: AutomationCondition, event: WebhookEvent): boolean {
    const data = this.getEventData(event);
    
    switch (condition.type) {
      case "label":
        return this.checkStringArray(data.labels, condition);
      case "author":
        return this.checkString(data.author, condition);
      case "title":
        return this.checkString(data.title, condition);
      case "body":
        return this.checkString(data.body || "", condition);
      default:
        return false;
    }
  }

  private checkString(value: string, condition: AutomationCondition): boolean {
    const normalizedValue = value.toLowerCase();
    const normalizedTarget = condition.value.toLowerCase();

    switch (condition.operator) {
      case "contains":
        return normalizedValue.includes(normalizedTarget);
      case "equals":
        return normalizedValue === normalizedTarget;
      case "starts_with":
        return normalizedValue.startsWith(normalizedTarget);
      case "regex":
        return new RegExp(condition.value, "i").test(value);
      default:
        return false;
    }
  }

  private checkStringArray(values: string[], condition: AutomationCondition): boolean {
    return values.some((v) => this.checkString(v, condition));
  }

  private getEventData(event: WebhookEvent): { 
    title: string; 
    body: string; 
    author: string; 
    labels: string[];
  } {
    if (event.issue) {
      return {
        title: event.issue.title,
        body: event.issue.body || "",
        author: event.sender.login,
        labels: event.issue.labels.map((l) => (typeof l === "string" ? l : l.name)),
      };
    }
    if (event.pull_request) {
      return {
        title: event.pull_request.title,
        body: event.pull_request.body || "",
        author: event.sender.login,
        labels: event.pull_request.labels.map((l) => (typeof l === "string" ? l : l.name)),
      };
    }
    return { title: "", body: "", author: event.sender.login, labels: [] };
  }

  evaluateRules(event: WebhookEvent): AutomationAction[][] {
    const triggerMap: Record<string, string> = {
      "issue.opened": "opened",
      "issue.closed": "closed",
      "pr.opened": "opened",
      "pr.merged": "merged",
    };

    const applicableRules = this.rules.filter((rule) => {
      const [entity, action] = rule.trigger.split(".");
      const expectedAction = triggerMap[rule.trigger];
      
      if (entity === "issue" && event.issue) {
        return event.action === expectedAction;
      }
      if (entity === "pr" && event.pull_request) {
        return event.action === expectedAction;
      }
      if (rule.trigger === "contributor.joined") {
        return event.action === "joined";
      }
      return false;
    });

    return applicableRules
      .filter((rule) => rule.enabled && rule.conditions.every((c) => this.evaluateCondition(c, event)))
      .map((rule) => rule.actions);
  }
}

export const webhookEngine = new WebhookAutomationEngine();

// Default automation rules
webhookEngine.addRule({
  id: "auto-label-bug",
  name: "Auto-label bug reports",
  trigger: "issue.opened",
  conditions: [
    { type: "title", operator: "contains", value: "bug" },
  ],
  actions: [{ type: "add_label", value: "bug" }],
  enabled: true,
});

webhookEngine.addRule({
  id: "auto-label-feature",
  name: "Auto-label feature requests",
  trigger: "issue.opened",
  conditions: [
    { type: "title", operator: "contains", value: "feature" },
  ],
  actions: [{ type: "add_label", value: "enhancement" }],
  enabled: true,
});

webhookEngine.addRule({
  id: "auto-thank-contributor",
  name: "Thank first-time contributors",
  trigger: "pr.opened",
  conditions: [
    { type: "author", operator: "regex", value: "^[a-zA-Z0-9]{1,10}$" }, // New accounts
  ],
  actions: [{ type: "comment", value: "Thank you for your contribution! 🎉" }],
  enabled: true,
});

export { WebhookAutomationEngine };
