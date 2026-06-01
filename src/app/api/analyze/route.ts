import { demoRepository } from "@/lib/demo-data";
import { analyzeWithOpenAI } from "@/lib/openai-analyzer";
import type { MaintainerRepository, MaintainerSettings } from "@/lib/types";

export async function POST(request: Request) {
  let repository: MaintainerRepository = demoRepository;
  let settings: Partial<MaintainerSettings> | undefined;

  try {
    const body = (await request.json()) as {
      repository?: MaintainerRepository;
      settings?: Partial<MaintainerSettings>;
    };
    if (body.repository?.identity?.fullName) repository = body.repository;
    settings = body.settings;
  } catch {
    repository = demoRepository;
  }

  const result = await analyzeWithOpenAI(repository, settings);
  return Response.json(result);
}
