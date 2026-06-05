/**
 * Maintenance Calendar - Track upcoming maintenance tasks and deadlines
 */

export interface MaintenanceEvent {
  id: string;
  title: string;
  titleZh: string;
  date: Date;
  type: "sla" | "release" | "review" | "meetup";
  priority: "high" | "medium" | "low";
  description: string;
  descriptionZh: string;
  repository?: string;
}

export interface CalendarMonth {
  year: number;
  month: number;
  events: MaintenanceEvent[];
}

/**
 * Generate maintenance events from response SLA queue
 */
export function generateMaintenanceEvents(
  responseSla: { items: Array<{ contributor: string; waitDays: number; targetDays: number; repository?: string; title?: string; url?: string }> },
  releaseGate: { items: Array<{ milestone: string; status: string; dueDate?: string }> }
): MaintenanceEvent[] {
  const events: MaintenanceEvent[] = [];
  const today = new Date();

  // Generate SLA warning events
  responseSla.items.forEach((item) => {
    if (item.waitDays >= item.targetDays * 0.8) {
      const priority = item.waitDays >= item.targetDays ? "high" : "medium";
      events.push({
        id: `sla-${item.contributor}-${item.waitDays}`,
        title: `Response SLA expiring: ${item.contributor}`,
        titleZh: `响应 SLA 即将过期: ${item.contributor}`,
        date: new Date(today.getTime() + (item.targetDays - item.waitDays) * 24 * 60 * 60 * 1000),
        type: "sla",
        priority,
        description: `${item.contributor} has been waiting ${item.waitDays} days`,
        descriptionZh: `${item.contributor} 已等待 ${item.waitDays} 天`,
        repository: item.repository || "unknown",
      });
    }
  });

  // Generate release milestone events
  releaseGate.items
    .filter((item) => item.status === "upcoming" && item.dueDate)
    .forEach((item) => {
      events.push({
        id: `release-${item.milestone}`,
        title: `Release milestone: ${item.milestone}`,
        titleZh: `发布里程碑: ${item.milestone}`,
        date: item.dueDate ? new Date(item.dueDate) : today,
        type: "release",
        priority: "high",
        description: `Milestone ${item.milestone} is due`,
        descriptionZh: `里程碑 ${item.milestone} 即将到期`,
      });
    });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Group events by month
 */
export function groupEventsByMonth(events: MaintenanceEvent[]): CalendarMonth[] {
  const months: Map<string, MaintenanceEvent[]> = new Map();

  events.forEach((event) => {
    const key = `${event.date.getFullYear()}-${event.date.getMonth()}`;
    if (!months.has(key)) {
      months.set(key, []);
    }
    months.get(key)!.push(event);
  });

  return Array.from(months.entries())
    .map(([key, monthEvents]) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, events: monthEvents };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
}

/**
 * Format month name
 */
export function formatMonthName(year: number, month: number, locale: "en" | "zh" = "en"): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: "long",
  });
}

/**
 * Format event date
 */
export function formatEventDate(date: Date, locale: "en" | "zh" = "en"): string {
  const today = new Date();
  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return locale === "en" ? "Today" : "今天";
  if (diffDays === 1) return locale === "en" ? "Tomorrow" : "明天";
  if (diffDays < 7 && diffDays > 0) {
    return locale === "en" ? `In ${diffDays} days` : `${diffDays} 天后`;
  }

  return date.toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: MaintenanceEvent["priority"]): string {
  switch (priority) {
    case "high":
      return "text-rose-700 bg-rose-100 border-rose-300";
    case "medium":
      return "text-amber-700 bg-amber-100 border-amber-300";
    case "low":
      return "text-stone-700 bg-stone-100 border-stone-300";
  }
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(type: MaintenanceEvent["type"]): string {
  switch (type) {
    case "sla":
      return "⏰";
    case "release":
      return "🚀";
    case "review":
      return "👀";
    case "meetup":
      return "📅";
  }
}
