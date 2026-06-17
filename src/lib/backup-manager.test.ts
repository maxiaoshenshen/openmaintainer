import { describe, it, expect } from "vitest";
import { BackupManager } from "./backup-manager";
import type { MaintainerRepository } from "./types";

describe("BackupManager", () => {
  it("creates a backup with minimal config", async () => {
    const manager = new BackupManager({ storagePath: "/tmp/backups" });
    const mockRepo: MaintainerRepository = {
      identity: {
        owner: "test",
        name: "repo",
        fullName: "test/repo",
        url: "https://github.com/test/repo",
      },
      description: "Test repo",
      stars: 100,
      forks: 20,
      openIssues: 10,
      openPRs: 5,
      language: "TypeScript",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCommitDate: new Date().toISOString(),
      contributors: [
        { identity: { owner: "test", name: "repo", fullName: "test/repo", url: "" }, username: "dev1", contributions: 50 },
      ],
      health: { score: 80, issues: [] },
      readiness: { score: 75, gaps: [] },
      qualitySignals: [],
      trend: { direction: "stable", changes: [], qualitySignalChanges: [] },
    };
    
    const backup = await manager.createBackup({ repository: mockRepo, includeConfig: true });
    expect(backup.repository).toBe("test/repo");
    expect(backup.status).toBeDefined();
  });

  it("calculates total size", async () => {
    const manager = new BackupManager({ storagePath: "/tmp/backups" });
    const mockRepo: MaintainerRepository = {
      identity: {
        owner: "test",
        name: "repo",
        fullName: "test/repo",
        url: "https://github.com/test/repo",
      },
      description: "Test repo",
      stars: 100,
      forks: 20,
      openIssues: 10,
      openPRs: 5,
      language: "TypeScript",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastCommitDate: new Date().toISOString(),
      contributors: [],
      health: { score: 80, issues: [] },
      readiness: { score: 75, gaps: [] },
      qualitySignals: [],
      trend: { direction: "stable", changes: [], qualitySignalChanges: [] },
    };
    
    await manager.createBackup({ repository: mockRepo, includeConfig: true });
    const totalSize = manager.getTotalSize();
    expect(totalSize).toBeGreaterThanOrEqual(0);
  });
});
