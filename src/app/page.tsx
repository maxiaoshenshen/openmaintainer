import { Dashboard } from "@/components/dashboard";
import { demoRepository } from "@/lib/demo-data";
import { analyzeRepository } from "@/lib/maintainer-analysis";

export default function Home() {
  return (
    <Dashboard
      initialRepository={demoRepository}
      initialAnalysis={analyzeRepository(demoRepository)}
      initialSource="demo"
    />
  );
}
