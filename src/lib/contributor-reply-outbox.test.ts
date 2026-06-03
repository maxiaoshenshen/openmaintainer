import { describe, expect, it } from "vitest";
import { buildContributorReplyOutbox } from "./contributor-reply-outbox";
import { buildContributorStarterKit } from "./contributor-starter-kit";
import { demoRepository } from "./demo-data";
import { analyzeRepository } from "./maintainer-analysis";
import { buildPullRequestReviewHandoffKit } from "./pr-review-handoff";
import { buildReproductionRequestKit } from "./repro-kit";

describe("buildContributorReplyOutbox", () => {
  it("collects the next copyable contributor replies across bugs, reviews, and starter tasks", () => {
    const analysis = analyzeRepository(demoRepository, new Date("2026-06-03T00:00:00Z"));
    const reproKit = buildReproductionRequestKit(demoRepository, analysis);
    const reviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, analysis);
    const starterKit = buildContributorStarterKit(demoRepository, analysis);

    const outbox = buildContributorReplyOutbox({
      reproKit,
      reviewHandoff,
      starterKit,
    });

    expect(outbox.summary).toBe("5 contributor replies are ready to send");
    expect(outbox.items).toHaveLength(5);
    expect(outbox.items[0]).toMatchObject({
      id: "reply-repro-issue-284",
      priority: "urgent",
      source: "repro",
      target: "issue",
      targetNumber: 284,
      contributor: "first-time-contributor",
      title: "Issue #284: Windows install fails when pnpm is not already available",
    });
    expect(outbox.items[0].body).toContain("To help us reproduce it quickly");
    expect(outbox.items[0].githubCommand).toContain("gh issue comment 284");
    expect(outbox.items.find((item) => item.id === "reply-review-handoff-pr-92")).toMatchObject({
      source: "review",
      target: "pull-request",
      targetNumber: 92,
      priority: "high",
    });
    expect(outbox.items.find((item) => item.id === "reply-starter-issue-285")).toMatchObject({
      source: "starter",
      priority: "normal",
      targetNumber: 285,
    });
    expect(outbox.markdown).toContain("## Contributor reply outbox");
    expect(outbox.markdown).toContain("gh pr comment 92");
    expect(outbox.markdown).toContain("starter/issue-285-chinese-readme-quickstart");
  });
});
