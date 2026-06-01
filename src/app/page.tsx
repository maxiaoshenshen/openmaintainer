import { Dashboard } from "@/components/dashboard";
import { demoPreviousSnapshot, demoRepository } from "@/lib/demo-data";
import { analyzeRepository } from "@/lib/maintainer-analysis";

export default function Home() {
  return (
    <Dashboard
      initialRepository={demoRepository}
      initialAnalysis={analyzeRepository(demoRepository, new Date("2026-06-01T00:00:00Z"), demoPreviousSnapshot)}
      initialSource="demo"
    />
  );
}
