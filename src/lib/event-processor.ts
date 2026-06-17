/**
 * Event Processor - Handles GitHub webhook events and external triggers
 */

import type { WebhookPayload } from "./webhook-handler";
import { NotificationManager } from "./notification-system";

export type EventType = 
  | "pr_opened" | "pr_merged" | "pr_closed" | "pr_review_requested"
  | "issue_opened" | "issue_closed" | "issue_labeled"
  | "release_published" | "dependency_update" | "security_alert"
  | "ci_failed" | "ci_passed" | "deployment_completed";

export interface ProcessedEvent {
  id: string;
  type: EventType;
  repository: string;
  actor: string;
  timestamp: number;
  severity: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  actionRequired: boolean;
  metadata?: Record<string, unknown>;
}

interface EventRule {
  eventTypes: EventType[];
  condition?: (event: ProcessedEvent) => boolean;
  action: "notify" | "auto_merge" | "label" | "assign" | "comment" | "close";
  channel?: "in_app" | "email" | "webhook" | "slack";
}

export class EventProcessor {
  private rules: EventRule[] = [];
  private notificationManager: NotificationManager;
  private eventHistory: ProcessedEvent[] = [];
  private listeners: Map<EventType, ((event: ProcessedEvent) => void)[]> = new Map();

  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Security alerts always notify
    this.addRule({
      eventTypes: ["security_alert"],
      action: "notify",
      channel: "email",
    });

    // CI failures notify
    this.addRule({
      eventTypes: ["ci_failed"],
      action: "notify",
      channel: "in_app",
    });

    // PR reviews requested
    this.addRule({
      eventTypes: ["pr_review_requested"],
      action: "notify",
      channel: "in_app",
    });

    // Issues labeled as bug get high priority
    this.addRule({
      eventTypes: ["issue_labeled"],
      condition: (e) => e.metadata?.label === "bug",
      action: "notify",
      channel: "in_app",
    });

    // Successful deployments are success notifications
    this.addRule({
      eventTypes: ["deployment_completed", "pr_merged", "release_published"],
      action: "notify",
      channel: "in_app",
    });
  }

  addRule(rule: EventRule): void {
    this.rules.push(rule);
  }

  removeRules(eventType: EventType): void {
    this.rules = this.rules.filter((r) => !r.eventTypes.includes(eventType));
  }

  on(eventType: EventType, callback: (event: ProcessedEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: EventType, callback: (event: ProcessedEvent) => void): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<ProcessedEvent[]> {
    const events: ProcessedEvent[] = [];

    if (payload.action === "opened" && payload.pull_request) {
      events.push(this.createPREvent("pr_opened", payload));
    }
    if (payload.action === "closed" && payload.pull_request?.merged) {
      events.push(this.createPREvent("pr_merged", payload));
    }
    if (payload.action === "closed" && payload.pull_request && !payload.pull_request.merged) {
      events.push(this.createPREvent("pr_closed", payload));
    }
    if (payload.action === "opened" && payload.issue) {
      events.push(this.createIssueEvent("issue_opened", payload));
    }
    if (payload.action === "closed" && payload.issue) {
      events.push(this.createIssueEvent("issue_closed", payload));
    }
    if (payload.action === "labeled" && payload.issue) {
      events.push(this.createIssueEvent("issue_labeled", payload));
    }
    if (payload.action === "published" && payload.release) {
      events.push(this.createReleaseEvent("release_published", payload));
    }

    for (const event of events) {
      await this.handleEvent(event);
    }

    return events;
  }

  private createPREvent(type: EventType, payload: WebhookPayload): ProcessedEvent {
    const pr = payload.pull_request!;
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      repository: payload.repository.full_name,
      actor: payload.sender.login,
      timestamp: Date.now(),
      severity: type === "pr_merged" ? "success" : "info",
      title: this.getEventTitle(type, payload),
      description: this.getEventDescription(type, payload),
      actionRequired: type === "pr_review_requested",
      metadata: {
        prNumber: pr.number,
        prTitle: pr.title,
        author: pr.user.login,
        labels: pr.labels?.map((l) => l.name) || [],
      },
    };
  }

  private createIssueEvent(type: EventType, payload: WebhookPayload): ProcessedEvent {
    const issue = payload.issue!;
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      repository: payload.repository.full_name,
      actor: payload.sender.login,
      timestamp: Date.now(),
      severity: type === "issue_closed" ? "success" : "info",
      title: this.getEventTitle(type, payload),
      description: this.getEventDescription(type, payload),
      actionRequired: type === "issue_opened",
      metadata: {
        issueNumber: issue.number,
        issueTitle: issue.title,
        author: issue.user.login,
        labels: issue.labels?.map((l) => l.name) || [],
      },
    };
  }

  private createReleaseEvent(type: EventType, payload: WebhookPayload): ProcessedEvent {
    const release = payload.release!;
    return {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      repository: payload.repository.full_name,
      actor: payload.sender.login,
      timestamp: Date.now(),
      severity: "success",
      title: `${release.tag_name} Released!`,
      description: release.name || release.tag_name,
      actionRequired: false,
      metadata: {
        tagName: release.tag_name,
        prerelease: release.prerelease,
        draft: release.draft,
      },
    };
  }

  private getEventTitle(type: EventType, payload: WebhookPayload): string {
    const titles: Record<EventType, string> = {
      pr_opened: `New PR #${payload.pull_request?.number}`,
      pr_merged: `PR #${payload.pull_request?.number} merged!`,
      pr_closed: `PR #${payload.pull_request?.number} closed`,
      pr_review_requested: `Review requested for PR #${payload.pull_request?.number}`,
      issue_opened: `New Issue #${payload.issue?.number}`,
      issue_closed: `Issue #${payload.issue?.number} closed`,
      issue_labeled: `Issue #${payload.issue?.number} labeled`,
      release_published: `Release ${payload.release?.tag_name}`,
      dependency_update: "Dependency update available",
      security_alert: "Security alert!",
      ci_failed: "CI build failed",
      ci_passed: "CI build passed",
      deployment_completed: "Deployment completed",
    };
    return titles[type] || type;
  }

  private getEventDescription(type: EventType, payload: WebhookPayload): string {
    if (payload.pull_request) {
      return payload.pull_request.title;
    }
    if (payload.issue) {
      return payload.issue.title;
    }
    if (payload.release) {
      return payload.release.body || "";
    }
    return "";
  }

  private async handleEvent(event: ProcessedEvent): Promise<void> {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > 500) {
      this.eventHistory = this.eventHistory.slice(0, 500);
    }

    // Find matching rules
    for (const rule of this.rules) {
      if (rule.eventTypes.includes(event.type)) {
        if (!rule.condition || rule.condition(event)) {
          await this.executeAction(event, rule);
        }
      }
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type);
    if (listeners) {
      listeners.forEach((cb) => cb(event));
    }
  }

  private async executeAction(event: ProcessedEvent, rule: EventRule): Promise<void> {
    if (rule.action === "notify") {
      const channel = rule.channel || "in_app";
      const severityMap: Record<string, "info" | "success" | "warning" | "error"> = {
        info: "info",
        success: "success",
        warning: "warning",
        error: "error",
      };
      this.notificationManager.notify(
        severityMap[event.severity] || "info",
        event.title,
        event.description,
        channel
      );
    }
  }

  getEventHistory(options?: {
    type?: EventType;
    repository?: string;
    limit?: number;
  }): ProcessedEvent[] {
    let result = [...this.eventHistory];

    if (options?.type) {
      result = result.filter((e) => e.type === options.type);
    }
    if (options?.repository) {
      result = result.filter((e) => e.repository === options.repository);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  getStats(): {
    total: number;
    byType: Record<EventType, number>;
    bySeverity: Record<string, number>;
    byRepository: Record<string, number>;
  } {
    const byType: Partial<Record<EventType, number>> = {};
    const bySeverity: Record<string, number> = {};
    const byRepository: Record<string, number> = {};

    for (const event of this.eventHistory) {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byRepository[event.repository] = (byRepository[event.repository] || 0) + 1;
    }

    return {
      total: this.eventHistory.length,
      byType: byType as Record<EventType, number>,
      bySeverity,
      byRepository,
    };
  }
}
