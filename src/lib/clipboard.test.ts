import { describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./clipboard";

describe("copyTextToClipboard", () => {
  it("uses the browser Clipboard API when it is available", async () => {
    const writeText = vi.fn(async () => undefined);

    const copied = await copyTextToClipboard("hello", {
      clipboard: { writeText },
    });

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("uses textarea fallback before Clipboard API when both are available", async () => {
    const writeText = vi.fn(async () => undefined);
    const textarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      select: vi.fn(),
    };
    const document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => true),
    };

    const copied = await copyTextToClipboard("quiet copy", {
      clipboard: { writeText },
      document,
    });

    expect(copied).toBe(true);
    expect(writeText).not.toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("falls back to a textarea copy when Clipboard API is unavailable", async () => {
    const textarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      select: vi.fn(),
    };
    const document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => true),
    };

    const copied = await copyTextToClipboard("fallback text", { document });

    expect(copied).toBe(true);
    expect(textarea.value).toBe("fallback text");
    expect(textarea.select).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(document.body.appendChild).toHaveBeenCalledWith(textarea);
    expect(document.body.removeChild).toHaveBeenCalledWith(textarea);
  });

  it("falls back when Clipboard API rejects", async () => {
    const textarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: vi.fn(),
      select: vi.fn(),
    };
    const document = {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => true),
    };

    const copied = await copyTextToClipboard("retry text", {
      clipboard: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) },
      document,
    });

    expect(copied).toBe(true);
    expect(textarea.value).toBe("retry text");
  });
});
