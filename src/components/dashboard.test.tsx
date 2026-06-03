import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dashboard } from "./dashboard";
import { buildContributorImpactQueue } from "@/lib/contributor-impact";
import { buildContributorReplyOutbox } from "@/lib/contributor-reply-outbox";
import { buildContributorStarterKit } from "@/lib/contributor-starter-kit";
import { buildContributorStatusBrief } from "@/lib/contributor-status-brief";
import { buildMaintainerCommandQueue } from "@/lib/maintainer-command-queue";
import { buildMaintainerDecisionLog } from "@/lib/maintainer-decision-log";
import { buildMaintainerFocusPlan } from "@/lib/maintainer-focus-plan";
import { buildMaintainerInbox } from "@/lib/maintainer-inbox";
import { buildMaintainerOwnershipRouting } from "@/lib/maintainer-ownership-routing";
import { buildOssEvidencePack } from "@/lib/oss-evidence";
import { buildPullRequestReviewHandoffKit } from "@/lib/pr-review-handoff";
import { buildReleaseReadinessGate } from "@/lib/release-readiness-gate";
import { buildReproductionRequestKit } from "@/lib/repro-kit";
import { buildResponseSlaQueue } from "@/lib/response-sla";
import { buildContributorUnblockKit } from "@/lib/unblock-kit";
import {
  demoPortfolioRepositories,
  demoPreviousSnapshot,
  demoRepository,
} from "@/lib/demo-data";
import { analyzeRepository } from "@/lib/maintainer-analysis";

function renderDashboard() {
  const observedAt = new Date("2026-06-03T00:00:00Z");
  const analysis = analyzeRepository(
    demoRepository,
    new Date("2026-06-01T00:00:00Z"),
    demoPreviousSnapshot,
  );
  const contributorImpact = buildContributorImpactQueue(demoRepository, analysis, observedAt);
  const commandQueue = buildMaintainerCommandQueue(analysis.actions);
  const responseSla = buildResponseSlaQueue(contributorImpact, analysis.settings);
  const reproKit = buildReproductionRequestKit(demoRepository, analysis);
  const reviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, analysis);
  const starterKit = buildContributorStarterKit(demoRepository, analysis);
  const releaseGate = buildReleaseReadinessGate(demoRepository, analysis);
  const decisionLog = buildMaintainerDecisionLog({
    repository: demoRepository,
    analysis,
    commandQueue,
    releaseGate,
  });
  const ownershipRouting = buildMaintainerOwnershipRouting({
    repository: demoRepository,
    responseSla,
    reviewHandoff,
    releaseGate,
    decisionLog,
  });
  const focusPlan = buildMaintainerFocusPlan({
    repository: demoRepository,
    releaseGate,
    responseSla,
    commandQueue,
    reviewHandoff,
  });
  const statusBrief = buildContributorStatusBrief({
    repository: demoRepository,
    releaseGate,
    responseSla,
    starterKit,
    focusPlan,
  });
  const replyOutbox = buildContributorReplyOutbox({
    reproKit,
    reviewHandoff,
    starterKit,
  });
  const inbox = buildMaintainerInbox(
    demoPortfolioRepositories.map((repository) => ({
      repository,
      analysis: analyzeRepository(repository, observedAt),
    })),
    observedAt,
  );

  return renderToStaticMarkup(
    <Dashboard
      initialRepository={demoRepository}
      initialAnalysis={analysis}
      initialContributorImpact={contributorImpact}
      initialUnblockKit={buildContributorUnblockKit(contributorImpact, analysis.actions)}
      initialCommandQueue={commandQueue}
      initialResponseSla={responseSla}
      initialReproKit={reproKit}
      initialReviewHandoff={reviewHandoff}
      initialStarterKit={starterKit}
      initialReleaseGate={releaseGate}
      initialDecisionLog={decisionLog}
      initialOwnershipRouting={ownershipRouting}
      initialFocusPlan={focusPlan}
      initialStatusBrief={statusBrief}
      initialReplyOutbox={replyOutbox}
      initialEvidencePack={buildOssEvidencePack(demoRepository, analysis, contributorImpact)}
      initialInbox={inbox}
      initialSource="demo"
    />,
  );
}

describe("Dashboard", () => {
  it("renders the contributor reply outbox with copyable GitHub handoff commands", () => {
    const markup = renderDashboard();

    expect(markup).toContain("Reply outbox");
    expect(markup).toContain("5 contributor replies are ready to send");
    expect(markup).toContain("Copy outbox");
    expect(markup).toContain("Issue #284: Windows install fails when pnpm is not already available");
    expect(markup).toContain("first-time-contributor");
    expect(markup).toContain("gh issue comment 284");
    expect(markup).toContain("gh pr comment 92");
  });

  it("renders the maintainer decision log with review gates", () => {
    const markup = renderDashboard();

    expect(markup).toContain("Decision log");
    expect(markup).toContain("7 maintainer decisions logged");
    expect(markup).toContain("Copy decisions");
    expect(markup).toContain("Human review required before close or release command");
    expect(markup).toContain("Release gate is blocked; do not run release command yet");
  });

  it("renders maintainer ownership routing with role handoffs", () => {
    const markup = renderDashboard();

    expect(markup).toContain("Ownership routing");
    expect(markup).toContain("7 ownership routes assigned across 4 maintainer roles");
    expect(markup).toContain("Copy routing");
    expect(markup).toContain("Release captain");
    expect(markup).toContain("Triage maintainer");
    expect(markup).toContain("Review maintainer");
    expect(markup).toContain("Safety reviewer");
    expect(markup).toContain("Review risky PR #92");
  });
});
