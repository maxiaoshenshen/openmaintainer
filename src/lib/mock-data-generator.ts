/**
 * Mock Data Generator - Generate realistic test data for development
 */

export interface MockOptions {
  locale?: string;
  seed?: number;
  count?: number;
}

export class MockDataGenerator {
  private seed: number;
  private count: number;

  constructor(options: MockOptions = {}) {
    this.seed = options.seed ?? Date.now();
    this.count = options.count ?? 1;
  }

  private random(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  private randInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  // Generate realistic names
  firstName(): string {
    return this.pick(['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William', 'Mia', 'James', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander']);
  }

  lastName(): string {
    return this.pick(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']);
  }

  fullName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  }

  email(name?: string): string {
    const n = name || this.fullName().toLowerCase().replace(' ', '.');
    return this.pick([`${n}@gmail.com`, `${n}@outlook.com`, `${n}@github.com`, `${n}@example.com`]);
  }

  username(): string {
    return this.pick([`${this.firstName().toLowerCase()}${this.randInt(1, 99)}`, `${this.lastName().toLowerCase()}_dev`, `user_${this.randInt(1000, 9999)}`]);
  }

  // GitHub-related data
  repoName(): string {
    const prefixes = ['awesome', 'cli', 'sdk', 'api', 'ui', 'lib', 'utils', 'core', 'app', 'tool'];
    const suffixes = ['module', 'package', 'service', 'client', 'handler', 'generator', 'builder', 'manager', 'helper', 'wrapper'];
    return `${this.pick(prefixes)}-${this.pick(suffixes)}`;
  }

  repoDescription(): string {
    return this.pick([
      'A modern, lightweight library for building applications',
      'The fastest way to get started with your project',
      'Production-ready solution for common use cases',
      'Minimal and efficient implementation',
      'Comprehensive toolkit for developers',
      'Type-safe and extensible framework',
      'Battle-tested in production environments',
      'Simple yet powerful abstractions'
    ]);
  }

  issueTitle(): string {
    const types = ['Bug', 'Feature', 'Enhancement', 'Question', 'Documentation'];
    const topics = ['performance', 'memory', 'API', 'authentication', 'caching', 'validation', 'error handling', 'testing', 'documentation', 'configuration'];
    return `${this.pick(types)}: ${this.pick(['improve', 'fix', 'add', 'update', 'implement'])} ${this.pick(topics)}`;
  }

  commitMessage(): string {
    const verbs = ['Add', 'Fix', 'Update', 'Refactor', 'Remove', 'Improve', 'Implement', 'Optimize'];
    const nouns = ['feature', 'test', 'documentation', 'error handling', 'performance', 'caching', 'API', 'validation'];
    return `${this.pick(verbs)} ${this.pick(nouns)}`;
  }

  // Generic data
  uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = this.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  boolean(): boolean {
    return this.random() > 0.5;
  }

  number(min = 0, max = 100): number {
    return this.randInt(min, max);
  }

  float(min = 0, max = 100, decimals = 2): number {
    return parseFloat(this.number(min, max * Math.pow(10, decimals)).toString()) / Math.pow(10, decimals);
  }

  date(options?: { start?: Date; end?: Date }): Date {
    const start = options?.start ? options.start.getTime() : Date.now() - 365 * 24 * 60 * 60 * 1000;
    const end = options?.end ? options.end.getTime() : Date.now();
    return new Date(start + this.random() * (end - start));
  }

  url(): string {
    const domains = ['example.com', 'api.github.com', 'localhost', 'staging.app.io', 'cdn.example.org'];
    return `https://${this.pick(domains)}/${this.repoName()}`;
  }

  ip(): string {
    return `${this.randInt(1, 255)}.${this.randInt(0, 255)}.${this.randInt(0, 255)}.${this.randInt(1, 255)}`;
  }

  avatar(): string {
    const id = this.randInt(1, 1000);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`;
  }

  // Generate array of items
  generate<T>(factory: () => T, count?: number): T[] {
    const n = count ?? this.count;
    return Array.from({ length: n }, factory);
  }

  generateUsers(count?: number) {
    return this.generate(() => ({
      id: this.uuid(),
      name: this.fullName(),
      email: this.email(),
      username: this.username(),
      avatar: this.avatar(),
      createdAt: this.date(),
      isActive: this.boolean()
    }), count);
  }

  generateRepos(count?: number) {
    return this.generate(() => ({
      id: this.uuid(),
      name: this.repoName(),
      fullName: `${this.username()}/${this.repoName()}`,
      description: this.repoDescription(),
      url: this.url(),
      stars: this.number(0, 10000),
      forks: this.number(0, 1000),
      openIssues: this.number(0, 100),
      language: this.pick(['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C++', null]),
      license: this.pick(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', null]),
      createdAt: this.date(),
      updatedAt: this.date({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
    }), count);
  }

  generateCommits(count?: number) {
    return this.generate(() => ({
      sha: this.uuid().substring(0, 8),
      message: this.commitMessage(),
      author: this.fullName(),
      email: this.email(),
      date: this.date(),
      additions: this.number(1, 500),
      deletions: this.number(1, 200)
    }), count);
  }
}

export const mock = new MockDataGenerator();
