import { Dashboard } from "@/components/dashboard";
import { demoPortfolioRepositories, demoPreviousSnapshot, demoRepository } from "@/lib/demo-data";
import { buildMaintainerInbox } from "@/lib/maintainer-inbox";
import { analyzeRepository } from "@/lib/maintainer-analysis";

export default function Home() {
  const observedAt = new Date("2026-06-03T00:00:00Z");
  const initialAnalysis = analyzeRepository(
    demoRepository,
    new Date("2026-06-01T00:00:00Z"),
    demoPreviousSnapshot,
  );
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
      initialInbox={initialInbox}
      initialSource="demo"
    />
  );
}
