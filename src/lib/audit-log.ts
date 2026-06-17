/**
 * Audit Log System - Track all maintainer activities and changes
 */

export type AuditEventType = 
  | "issue.created" | "issue.updated" | "issue.closed" | "issue.deleted"
  | "pr.opened" | "pr.merged" | "pr.closed" | "pr.reviewed"
  | "comment.created" | "comment.updated" | "comment.deleted"
  | "release.published" | "release.updated"
  | "member.added" | "member.removed" | "member.role_changed"
  | "settings.changed" | "webhook.configured" | "token.rotated"
  | "branch.protected" | "branch.unprotected";

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    username: string;
    type: "user" | "bot" | "system";
  };
  action: AuditEventType;
  resource: {
    type: "issue" | "pr" | "release" | "member" | "settings" | "webhook" | "branch";
    id: string;
    name?: string;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQuery {
  startDate?: string;
  endDate?: string;
  actor?: string;
  action?: AuditEventType | AuditEventType[];
  resourceType?: string;
  resourceId?: string;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByActor: Record<string, number>;
  eventsByDay: Record<string, number>;
}

/**
 * Generate unique audit event ID
 */
export function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create audit event
 */
export function createAuditEvent(
  actor: AuditEvent["actor"],
  action: AuditEventType,
  resource: AuditEvent["resource"],
  options?: {
    changes?: AuditEvent["changes"];
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
): AuditEvent {
  return {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    actor,
    action,
    resource,
    changes: options?.changes,
    metadata: options?.metadata,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };
}

/**
 * Filter audit events by query
 */
export function filterAuditEvents(
  events: AuditEvent[],
  query: AuditQuery
): AuditEvent[] {
  return events.filter(event => {
    if (query.startDate && event.timestamp < query.startDate) return false;
    if (query.endDate && event.timestamp > query.endDate) return false;
    if (query.actor && event.actor.username !== query.actor) return false;
    if (query.action) {
      const actions = Array.isArray(query.action) ? query.action : [query.action];
      if (!actions.includes(event.action)) return false;
    }
    if (query.resourceType && event.resource.type !== query.resourceType) return false;
    if (query.resourceId && event.resource.id !== query.resourceId) return false;
    return true;
  });
}

/**
 * Generate audit summary statistics
 */
export function generateAuditSummary(events: AuditEvent[]): AuditSummary {
  const eventsByType: Record<string, number> = {};
  const eventsByActor: Record<string, number> = {};
  const eventsByDay: Record<string, number> = {};

  for (const event of events) {
    eventsByType[event.action] = (eventsByType[event.action] || 0) + 1;
    eventsByActor[event.actor.username] = (eventsByActor[event.actor.username] || 0) + 1;
    
    const day = event.timestamp.split("T")[0];
    eventsByDay[day] = (eventsByDay[day] || 0) + 1;
  }

  return {
    totalEvents: events.length,
    eventsByType,
    eventsByActor,
    eventsByDay,
  };
}

/**
 * Export audit log to JSON
 */
export function exportAuditLog(
  events: AuditEvent[],
  format: "json" | "csv" = "json"
): string {
  if (format === "json") {
    return JSON.stringify(events, null, 2);
  }

  const headers = ["ID", "Timestamp", "Actor", "Action", "Resource Type", "Resource ID"];
  const rows = events.map(e => [
    e.id,
    e.timestamp,
    e.actor.username,
    e.action,
    e.resource.type,
    e.resource.id,
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}
