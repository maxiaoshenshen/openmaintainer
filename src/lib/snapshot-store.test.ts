import { describe, expect, it } from "vitest";
import { analyzeRepository } from "./maintainer-analysis";
import { demoRepository } from "./demo-data";
import {
  createSnapshotFromAnalysis,
  readSnapshot,
  repositorySnapshotKey,
  writeSnapshot,
} from "./snapshot-store";

describe("snapshot-store", () => {
  it("creates a compact repository snapshot from analysis", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z"));
    const snapshot = createSnapshotFromAnalysis(demoRepository, analysis, "2026-06-01T00:00:00Z");

    expect(snapshot).toMatchObject({
      capturedAt: "2026-06-01T00:00:00Z",
      healthScore: analysis.health.score,
      readinessScore: analysis.readiness.score,
      openIssues: demoRepository.openIssues,
      openPullRequests: demoRepository.pullRequests.length,
    });
    expect(snapshot.qualitySignals).toContainEqual({
      id: "label-coverage",
      score: 50,
    });
  });

  it("stores and reads snapshots by repository full name", () => {
    const storage = new Map<string, string>();
    const snapshot = createSnapshotFromAnalysis(
      demoRepository,
      analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z")),
      "2026-06-01T00:00:00Z",
    );

    writeSnapshot(storage, demoRepository.identity.fullName, snapshot);

    expect(storage.has(repositorySnapshotKey("openmaintainer/demo-repo"))).toBe(true);
    expect(readSnapshot(storage, "openmaintainer/demo-repo")).toEqual(snapshot);
  });

  it("ignores invalid stored snapshot data", () => {
    const storage = new Map<string, string>([
      [repositorySnapshotKey("openmaintainer/demo-repo"), "{bad json"],
    ]);

    expect(readSnapshot(storage, "openmaintainer/demo-repo")).toBeNull();
  });
});
