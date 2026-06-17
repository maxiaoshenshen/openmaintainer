/**
 * Event Bus - Decoupled event-driven architecture
 */

export type EventHandler<T = any> = (event: T) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  once?: boolean;
  priority?: number;
}

export interface EventBusOptions {
  wildcard?: boolean;
  delimiter?: string;
  newListener?: boolean;
  maxListeners?: number;
}

/**
 * Event Bus for pub/sub pattern
 */
export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private options: EventBusOptions;
  private listenerCount = new Map<string, number>();

  constructor(options: EventBusOptions = {}) {
    this.options = {
      wildcard: true,
      delimiter: ".",
      newListener: false,
      maxListeners: 100,
      ...options,
    };
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler, once = false, priority = 0): () => void {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const subscription: EventSubscription = { id, event, handler, once, priority };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }

    const subs = this.subscriptions.get(event)!;
    subs.push(subscription);
    subs.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    this.listenerCount.set(event, this.listenerCount.get(event)! + 1 || 1);
    return () => this.off(event, id);
  }

  /**
   * Subscribe once
   */
  once(event: string, handler: EventHandler): () => void {
    return this.on(event, handler, true);
  }

  /**
   * Unsubscribe
   */
  off(event: string, subscriptionId?: string): void {
    if (!subscriptionId) {
      this.subscriptions.delete(event);
      this.listenerCount.delete(event);
      return;
    }

    const subs = this.subscriptions.get(event);
    if (subs) {
      const idx = subs.findIndex(s => s.id === subscriptionId);
      if (idx >= 0) {
        subs.splice(idx, 1);
        this.listenerCount.set(event, Math.max(0, (this.listenerCount.get(event) || 1) - 1));
      }
    }
  }

  /**
   * Emit event
   */
  async emit(event: string, data?: any): Promise<void> {
    const events = this.getMatchingEvents(event);
    const promises: Promise<void>[] = [];

    for (const evt of events) {
      const subs = this.subscriptions.get(evt);
      if (!subs) continue;

      for (const sub of [...subs]) {
        try {
          await sub.handler(data);
          if (sub.once) {
            this.off(evt, sub.id);
          }
        } catch (error) {
          console.error(`Error in event handler for ${evt}:`, error);
        }
      }
    }
  }

  /**
   * Get events matching pattern
   */
  private getMatchingEvents(event: string): string[] {
    if (!this.options.wildcard) {
      return this.subscriptions.has(event) ? [event] : [];
    }

    const events: string[] = [];
    const delimiter = this.options.delimiter || ".";

    for (const evt of this.subscriptions.keys()) {
      if (this.matchesPattern(event, evt, delimiter)) {
        events.push(evt);
      }
    }

    return events;
  }

  private matchesPattern(event: string, pattern: string, delimiter: string): boolean {
    if (pattern === "*") return true;
    if (event === pattern) return true;

    const eventParts = event.split(delimiter);
    const patternParts = pattern.split(delimiter);

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === "*") continue;
      if (patternParts[i] === "**") return true;
      if (patternParts[i] !== eventParts[i]) return false;
    }

    return patternParts.length === eventParts.length;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.subscriptions.clear();
    this.listenerCount.clear();
  }

  /**
   * Get listener count
   */
  listenerCountForEvent(event: string): number {
    return this.listenerCount.get(event) || 0;
  }

  /**
   * Get all events
   */
  eventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

/**
 * Global event bus instance
 */
export const globalEventBus = new EventBus();
