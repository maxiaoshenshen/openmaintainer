import { demoPortfolioRepositories } from "@/lib/demo-data";
import { getRepositoryOrDemo } from "@/lib/github";
import { parseInboxRepositoryInputs } from "@/lib/inbox-input";
import { analyzeRepository } from "@/lib/maintainer-analysis";
import { buildMaintainerInbox } from "@/lib/maintainer-inbox";
import type { MaintainerSettings } from "@/lib/types";

type InboxRequestBody = {
  repos?: string[] | string;
  settings?: Partial<MaintainerSettings>;
};

function defaultPortfolio() {
  return demoPortfolioRepositories.map((repository) => ({
    repository,
    analysis: analyzeRepository(repository),
    source: "demo" as const,
  }));
}

export async function POST(request: Request) {
  let body: InboxRequestBody = {};

  try {
    body = (await request.json()) as InboxRequestBody;
  } catch {
    body = {};
  }

  const input =
    typeof body.repos === "string" ? body.repos : Array.isArray(body.repos) ? body.repos.join("\n") : "";
  const repoInputs = parseInboxRepositoryInputs(input);
  const sources =
    repoInputs.length === 0
      ? defaultPortfolio()
      : await Promise.all(
          repoInputs.map(async (repoInput) => {
            const result = await getRepositoryOrDemo(repoInput);
            return {
              repository: result.repository,
              analysis: analyzeRepository(result.repository, new Date(), undefined, body.settings),
              source: result.source,
              warning: result.warning,
              requestedRepository: repoInput,
            };
          }),
        );

  return Response.json({
    inbox: buildMaintainerInbox(sources),
    repositories: sources.map((source) => ({
      requestedRepository: "requestedRepository" in source ? source.requestedRepository : source.repository.identity.fullName,
      repository: source.repository.identity.fullName,
      source: source.source,
      warning: "warning" in source ? source.warning : undefined,
    })),
  });
}
