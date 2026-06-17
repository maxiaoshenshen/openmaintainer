import { describe, it, expect, beforeEach } from "vitest";
import { EventBus } from "./event-bus";

describe("Event Bus", () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe("on and emit", () => {
    it("should register handler and receive events", async () => {
      const received: any[] = [];
      bus.on("test", (data) => received.push(data));
      await bus.emit("test", "hello");
      expect(received).toEqual(["hello"]);
    });

    it("should support multiple handlers", async () => {
      const results: string[] = [];
      bus.on("test", () => results.push("handler1"));
      bus.on("test", () => results.push("handler2"));
      await bus.emit("test");
      expect(results).toEqual(["handler1", "handler2"]);
    });

    it("should pass data to handlers", async () => {
      let data: any;
      bus.on("data", (d) => { data = d; });
      await bus.emit("data", { id: 1, name: "test" });
      expect(data).toEqual({ id: 1, name: "test" });
    });
  });

  describe("once", () => {
    it("should only fire once", async () => {
      const count = { value: 0 };
      bus.once("once", () => count.value++);
      await bus.emit("once");
      await bus.emit("once");
      expect(count.value).toBe(1);
    });
  });

  describe("off", () => {
    it("should unsubscribe handler", async () => {
      const received: any[] = [];
      const unsubscribe = bus.on("test", (d) => received.push(d));
      await bus.emit("test", 1);
      unsubscribe();
      await bus.emit("test", 2);
      expect(received).toEqual([1]);
    });
  });

  describe("wildcard matching", () => {
    it("should match namespace wildcards", async () => {
      const received: string[] = [];
      bus.on("user.*", (name: string) => received.push(name));
      await bus.emit("user.created", "alice");
      await bus.emit("user.updated", "bob");
      expect(received).toEqual(["alice", "bob"]);
    });

    it("should match root wildcard", async () => {
      const received: string[] = [];
      bus.on("**", (data: string) => received.push(data));
      await bus.emit("any.event", "test");
      expect(received).toEqual(["test"]);
    });
  });

  describe("removeAllListeners", () => {
    it("should remove all handlers", async () => {
      const received: any[] = [];
      bus.on("event1", () => received.push(1));
      bus.on("event2", () => received.push(2));
      bus.removeAllListeners();
      await bus.emit("event1");
      await bus.emit("event2");
      expect(received).toEqual([]);
    });
  });

  describe("listenerCount", () => {
    it("should count listeners", () => {
      bus.on("test", () => {});
      bus.on("test", () => {});
      expect(bus.listenerCountForEvent("test")).toBe(2);
    });

    it("should return 0 for unknown event", () => {
      expect(bus.listenerCountForEvent("unknown")).toBe(0);
    });
  });

  describe("eventNames", () => {
    it("should list all event names", () => {
      bus.on("event1", () => {});
      bus.on("event2", () => {});
      const names = bus.eventNames();
      expect(names).toContain("event1");
      expect(names).toContain("event2");
    });
  });

  describe("priority", () => {
    it("should execute higher priority first", async () => {
      const order: number[] = [];
      bus.on("test", () => order.push(2), false, 2);
      bus.on("test", () => order.push(1), false, 1);
      bus.on("test", () => order.push(3), false, 3);
      await bus.emit("test");
      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe("async handlers", () => {
    it("should handle async handlers", async () => {
      const results: string[] = [];
      bus.on("async", async () => {
        await new Promise(r => setTimeout(r, 10));
        results.push("done");
      });
      await bus.emit("async");
      expect(results).toEqual(["done"]);
    });
  });
});
