import { describe, it, expect } from "vitest";
import {
  analyzePRTimeline,
  analyzeAllPRTimelines,
  formatDurationHours,
  getBottleneckSuggestion,
} from "./pr-timeline";
import { demoRepository } from "./demo-data";

describe("PR Timeline", () => {
  it("analyzes single PR timeline", () => {
    const pr = demoRepository.pullRequests[0];
    const timeline = analyzePRTimeline(pr);
    
    expect(timeline.prNumber).toBeDefined();
    expect(timeline.prTitle).toBeDefined();
    expect(timeline.events).toBeInstanceOf(Array);
    expect(timeline.totalDuration).toBeGreaterThanOrEqual(0);
    expect(timeline.reviewRounds).toBeGreaterThan(0);
  });

  it("analyzes all PR timelines", () => {
    const stats = analyzeAllPRTimelines(demoRepository.pullRequests);
    
    expect(stats.avgTimeToFirstReview).toBeGreaterThanOrEqual(0);
    expect(stats.avgTimeToMerge).toBeGreaterThanOrEqual(0);
    expect(stats.avgReviewRounds).toBeGreaterThanOrEqual(0);
    expect(stats.bottleneckPhases).toBeDefined();
  });

  it("formats duration correctly", () => {
    expect(formatDurationHours(0.5)).toBe("30m");
    expect(formatDurationHours(2)).toBe("2h");
    expect(formatDurationHours(25)).toBe("1d 1h");
    expect(formatDurationHours(48)).toBe("2d");
    expect(formatDurationHours(72)).toBe("3d");
  });

  it("provides bottleneck suggestions", () => {
    expect(getBottleneckSuggestion("waiting_for_review")).toContain("reviewer");
    expect(getBottleneckSuggestion("review_changes")).toContain("PR");
    expect(getBottleneckSuggestion("final_review")).toContain("reviewer");
    expect(getBottleneckSuggestion("unknown")).toContain("No specific");
  });

  it("handles empty PR list", () => {
    const stats = analyzeAllPRTimelines([]);
    expect(stats.avgTimeToFirstReview).toBe(0);
    expect(stats.avgTimeToMerge).toBe(0);
    expect(stats.fastestMerge).toBeNull();
    expect(stats.slowestMerge).toBeNull();
  });

  it("detects bottleneck phases", () => {
    const pr = demoRepository.pullRequests[0];
    const timeline = analyzePRTimeline(pr);
    
    if (timeline.bottleneckPhase) {
      expect(typeof timeline.bottleneckPhase).toBe("string");
    }
  });
});
