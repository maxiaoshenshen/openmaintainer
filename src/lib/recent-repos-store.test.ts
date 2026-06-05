import { describe, expect, it } from "vitest";
import {
  addRecentRepo,
  clearRecentRepos,
  readRecentRepos,
  removeRecentRepo,
} from "./recent-repos-store";

function mockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
}

describe("recent-repos-store", () => {
  it("starts with empty list", () => {
    const storage = mockStorage();
    expect(readRecentRepos(storage)).toEqual([]);
  });

  it("adds repository to recent list", () => {
    const storage = mockStorage();
    addRecentRepo(storage, "owner/repo");
    const recent = readRecentRepos(storage);
    expect(recent).toHaveLength(1);
    expect(recent[0].repository).toBe("owner/repo");
    expect(typeof recent[0].visitedAt).toBe("number");
  });

  it("moves recently visited repo to top", () => {
    const storage = mockStorage();
    addRecentRepo(storage, "owner/repo1");
    addRecentRepo(storage, "owner/repo2");
    addRecentRepo(storage, "owner/repo1");
    const recent = readRecentRepos(storage);
    expect(recent).toHaveLength(2);
    expect(recent[0].repository).toBe("owner/repo1");
    expect(recent[1].repository).toBe("owner/repo2");
  });

  it("removes repository from recent list", () => {
    const storage = mockStorage();
    addRecentRepo(storage, "owner/repo1");
    addRecentRepo(storage, "owner/repo2");
    removeRecentRepo(storage, "owner/repo1");
    const recent = readRecentRepos(storage);
    expect(recent).toHaveLength(1);
    expect(recent[0].repository).toBe("owner/repo2");
  });

  it("clears all recent repos", () => {
    const storage = mockStorage();
    addRecentRepo(storage, "owner/repo1");
    addRecentRepo(storage, "owner/repo2");
    clearRecentRepos(storage);
    expect(readRecentRepos(storage)).toEqual([]);
  });

  it("limits to 10 recent repos", () => {
    const storage = mockStorage();
    for (let i = 0; i < 15; i++) {
      addRecentRepo(storage, `owner/repo${i}`);
    }
    const recent = readRecentRepos(storage);
    expect(recent).toHaveLength(10);
    expect(recent[0].repository).toBe("owner/repo14");
  });

  it("is case-insensitive when deduplicating", () => {
    const storage = mockStorage();
    addRecentRepo(storage, "Owner/Repo");
    addRecentRepo(storage, "owner/repo");
    const recent = readRecentRepos(storage);
    expect(recent).toHaveLength(1);
  });
});
