import { describe, expect, it } from "vitest";
import { readSettings, writeSettings } from "./settings-store";
import type { MaintainerSettings } from "./types";

function memoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(values.keys())[index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

const settings: MaintainerSettings = {
  targetLabelCoverage: 80,
  maxIssueResponseDays: 1,
  maxPullRequestAgeDays: 2,
  maxOpenPullRequests: 4,
  releaseCadenceDays: 14,
  preferredLabels: ["bug", "documentation"],
};

describe("settings-store", () => {
  it("stores maintainer settings per repository", () => {
    const storage = memoryStorage();

    writeSettings(storage, "OpenMaintainer/Demo-Repo", settings);

    expect(readSettings(storage, "openmaintainer/demo-repo")).toEqual(settings);
  });

  it("ignores malformed stored settings", () => {
    const storage = memoryStorage();
    storage.setItem(
      "openmaintainer:settings:openmaintainer/demo-repo",
      JSON.stringify({ version: 1, settings: { targetLabelCoverage: "80" } }),
    );

    expect(readSettings(storage, "openmaintainer/demo-repo")).toBeNull();
  });
});
