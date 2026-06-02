import { Dashboard } from "@/components/dashboard";
import { demoPortfolioRepositories, demoPreviousSnapshot, demoRepository } from "@/lib/demo-data";
import { buildContributorImpactQueue } from "@/lib/contributor-impact";
import { buildMaintainerInbox } from "@/lib/maintainer-inbox";
import { analyzeRepository } from "@/lib/maintainer-analysis";
import { buildOssEvidencePack } from "@/lib/oss-evidence";
import { buildContributorUnblockKit } from "@/lib/unblock-kit";
import { buildMaintainerCommandQueue } from "@/lib/maintainer-command-queue";
import { buildResponseSlaQueue } from "@/lib/response-sla";
import { buildReproductionRequestKit } from "@/lib/repro-kit";
import { buildPullRequestReviewHandoffKit } from "@/lib/pr-review-handoff";
import { buildContributorStarterKit } from "@/lib/contributor-starter-kit";
import { buildReleaseReadinessGate } from "@/lib/release-readiness-gate";

export default function Home() {
  const observedAt = new Date("2026-06-03T00:00:00Z");
  const initialAnalysis = analyzeRepository(
    demoRepository,
    new Date("2026-06-01T00:00:00Z"),
    demoPreviousSnapshot,
  );
  const initialContributorImpact = buildContributorImpactQueue(demoRepository, initialAnalysis, observedAt);
  const initialUnblockKit = buildContributorUnblockKit(initialContributorImpact, initialAnalysis.actions);
  const initialCommandQueue = buildMaintainerCommandQueue(initialAnalysis.actions);
  const initialResponseSla = buildResponseSlaQueue(initialContributorImpact, initialAnalysis.settings);
  const initialReproKit = buildReproductionRequestKit(demoRepository, initialAnalysis);
  const initialReviewHandoff = buildPullRequestReviewHandoffKit(demoRepository, initialAnalysis);
  const initialStarterKit = buildContributorStarterKit(demoRepository, initialAnalysis);
  const initialReleaseGate = buildReleaseReadinessGate(demoRepository, initialAnalysis);
  const initialInbox = buildMaintainerInbox(
    demoPortfolioRepositories.map((repository) => ({
      repository,
      analysis: analyzeRepository(repository, observedAt),
    })),
    observedAt,
  );

  return (
    <Dashboard
      initialRepository={demoRepository}
      initialAnalysis={initialAnalysis}
      initialContributorImpact={initialContributorImpact}
      initialUnblockKit={initialUnblockKit}
      initialCommandQueue={initialCommandQueue}
      initialResponseSla={initialResponseSla}
      initialReproKit={initialReproKit}
      initialReviewHandoff={initialReviewHandoff}
      initialStarterKit={initialStarterKit}
      initialReleaseGate={initialReleaseGate}
      initialEvidencePack={buildOssEvidencePack(demoRepository, initialAnalysis, initialContributorImpact)}
      initialInbox={initialInbox}
      initialSource="demo"
    />
  );
}
