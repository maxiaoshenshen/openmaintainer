import { describe, expect, it } from "vitest";
import { buildContributorImpactQueue } from "./contributor-impact";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildResponseSlaQueue } from "./response-sla";

describe("buildResponseSlaQueue", () => {
  it("prioritizes contributor threads by maintainer response SLA breach", () => {
    const observedAt = new Date("2026-06-03T00:00:00Z");
    const analysis = analyzeRepository(demoRepository, observedAt, undefined, {
      maxIssueResponseDays: 2,
      maxPullRequestAgeDays: 4,
    });
    const impact = buildContributorImpactQueue(demoRepository, analysis, observedAt);

    const queue = buildResponseSlaQueue(impact, analysis.settings);

    expect(queue.summary).toBe("6 contributor threads need attention: 5 overdue, 1 at risk");
    expect(queue.totals).toEqual({
      overdue: 5,
      atRisk: 1,
      onTrack: 0,
    });
    expect(queue.items[0]).toMatchObject({
      contributor: "cn-maintainer",
      title: "Issue #285: Add Chinese README quickstart",
      waitDays: 4,
      targetDays: 2,
      daysOverTarget: 2,
      status: "overdue",
    });
    expect(queue.items.find((item) => item.contributor === "adapter-owner")).toMatchObject({
      daysOverTarget: 1,
      status: "overdue",
    });
    expect(queue.items.find((item) => item.contributor === "release-captain")).toMatchObject({
      status: "at-risk",
      daysUntilTarget: 0,
    });
    expect(queue.markdown).toContain("## Response SLA queue");
    expect(queue.markdown).toContain("adapter-owner");
    expect(queue.markdown).toContain("2d overdue");
  });
});
