const RECENT_REPOS_KEY = "openmaintainer:recent-repos";
const MAX_RECENT_REPOS = 10;

export type RecentRepo = {
  repository: string;
  visitedAt: number;
};

export function readRecentRepos(storage: Storage): RecentRepo[] {
  try {
    const raw = storage.getItem(RECENT_REPOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentRepo =>
        typeof item === "object" &&
        typeof item.repository === "string" &&
        typeof item.visitedAt === "number",
    );
  } catch {
    return [];
  }
}

export function addRecentRepo(storage: Storage, repository: string) {
  const recent = readRecentRepos(storage).filter(
    (item) => item.repository.toLowerCase() !== repository.toLowerCase(),
  );
  recent.unshift({ repository, visitedAt: Date.now() });
  const trimmed = recent.slice(0, MAX_RECENT_REPOS);
  storage.setItem(RECENT_REPOS_KEY, JSON.stringify(trimmed));
}

export function removeRecentRepo(storage: Storage, repository: string) {
  const recent = readRecentRepos(storage).filter(
    (item) => item.repository.toLowerCase() !== repository.toLowerCase(),
  );
  storage.setItem(RECENT_REPOS_KEY, JSON.stringify(recent));
}

export function clearRecentRepos(storage: Storage) {
  storage.removeItem(RECENT_REPOS_KEY);
}
