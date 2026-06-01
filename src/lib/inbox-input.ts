import { parseRepositoryInput } from "./github";

const MAX_INBOX_REPOSITORIES = 6;

export function parseInboxRepositoryInputs(value: string, maxCount = MAX_INBOX_REPOSITORIES) {
  const repositories = value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      try {
        return [parseRepositoryInput(item).fullName];
      } catch {
        return [];
      }
    });

  return Array.from(new Set(repositories)).slice(0, maxCount);
}
