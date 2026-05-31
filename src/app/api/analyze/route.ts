import { demoRepository } from "@/lib/demo-data";
import { analyzeWithOpenAI } from "@/lib/openai-analyzer";
import type { MaintainerRepository } from "@/lib/types";

export async function POST(request: Request) {
  let repository: MaintainerRepository = demoRepository;

  try {
    const body = (await request.json()) as { repository?: MaintainerRepository };
    if (body.repository?.identity?.fullName) repository = body.repository;
  } catch {
    repository = demoRepository;
  }

  const result = await analyzeWithOpenAI(repository);
  return Response.json(result);
}
