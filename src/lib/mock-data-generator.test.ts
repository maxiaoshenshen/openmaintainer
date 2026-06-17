import { describe, it, expect } from 'vitest';
import { MockDataGenerator, mock } from './mock-data-generator';

describe('MockDataGenerator', () => {
  it('should generate deterministic data with seed', () => {
    const gen1 = new MockDataGenerator({ seed: 12345 });
    const gen2 = new MockDataGenerator({ seed: 12345 });
    expect(gen1.fullName()).toBe(gen2.fullName());
    expect(gen1.email()).toBe(gen2.email());
  });

  it('should generate names', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    expect(gen.firstName()).toBeTruthy();
    expect(gen.lastName()).toBeTruthy();
    expect(gen.fullName()).toContain(' ');
  });

  it('should generate email', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const email = gen.email();
    expect(email).toContain('@');
    expect(email).toMatch(/\.(com|org|io)$/);
  });

  it('should generate repo data', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const repo = gen.generateRepos(1)[0];
    expect(repo.name).toBeTruthy();
    expect(repo.fullName).toContain('/');
    expect(repo.url).toMatch(/^https?:\/\//);
  });

  it('should generate UUID', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const uuid = gen.uuid();
    expect(uuid).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('should generate numbers in range', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const num = gen.number(10, 20);
    expect(num).toBeGreaterThanOrEqual(10);
    expect(num).toBeLessThanOrEqual(20);
  });

  it('should generate arrays', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const items = gen.generate(() => gen.fullName(), 5);
    expect(items).toHaveLength(5);
    items.forEach(name => expect(name).toContain(' '));
  });

  it('should generate users', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const users = gen.generateUsers(3);
    expect(users).toHaveLength(3);
    users.forEach(user => {
      expect(user.id).toBeTruthy();
      expect(user.email).toContain('@');
      expect(user.avatar).toMatch(/^https?:\/\//);
    });
  });

  it('should generate commits', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const commits = gen.generateCommits(2);
    expect(commits).toHaveLength(2);
    commits.forEach(commit => {
      expect(commit.sha).toHaveLength(8);
      expect(commit.message).toBeTruthy();
    });
  });

  it('should generate URLs', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const url = gen.url();
    expect(url).toMatch(/^https?:\/\//);
  });

  it('should generate dates', () => {
    const gen = new MockDataGenerator({ seed: 42 });
    const date = gen.date();
    expect(date).toBeInstanceOf(Date);
  });
});
