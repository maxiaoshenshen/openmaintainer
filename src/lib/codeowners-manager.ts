import { GitHubClient } from './github-client';
import { FileContent } from './types';

/**
 * CODEOWNERS file manager
 * Manages CODEOWNERS patterns and ownership assignments
 */
export interface CodeOwner {
  pattern: string;
  owners: string[];
  description?: string;
}

export interface CodeOwnerValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface OwnershipCoverage {
  totalFiles: number;
  coveredFiles: number;
  uncoveredFiles: string[];
  coveragePercentage: number;
}

export class CodeownersManager {
  private github: GitHubClient;
  private cache: Map<string, CodeOwner[]>;

  constructor(github: GitHubClient) {
    this.github = github;
    this.cache = new Map();
  }

  /**
   * Parse CODEOWNERS file content into structured data
   */
  parseCodeowners(content: string): CodeOwner[] {
    const lines = content.split('\n');
    const owners: CodeOwner[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const pattern = parts[0];
        const ownerList = parts.slice(1).filter(o => !o.startsWith('#'));
        
        owners.push({
          pattern,
          owners: ownerList,
          description: this.extractComment(trimmed)
        });
      }
    }

    return owners;
  }

  private extractComment(line: string): string | undefined {
    const commentIndex = line.indexOf('#');
    if (commentIndex > 0) {
      return line.slice(commentIndex + 1).trim();
    }
    return undefined;
  }

  /**
   * Generate CODEOWNERS file from structured data
   */
  generateCodeowners(owners: CodeOwner[]): string {
    const header = `# CODEOWNERS - https://help.github.com/articles/about-codeowners/
# This file defines who owns what in this repository.

`;

    const sections = owners.map(owner => {
      const comment = owner.description ? ` # ${owner.description}` : '';
      return `${owner.pattern} ${owner.owners.join(' ')}${comment}`;
    });

    return header + sections.join('\n') + '\n';
  }

  /**
   * Add or update CODEOWNERS entry
   */
  async addOwner(pattern: string, owners: string[], description?: string): Promise<CodeOwner[]> {
    const ownersList = await this.getCodeowners();
    const existingIndex = ownersList.findIndex(o => o.pattern === pattern);
    
    if (existingIndex >= 0) {
      ownersList[existingIndex].owners = [...new Set([...ownersList[existingIndex].owners, ...owners])];
      ownersList[existingIndex].description = description || ownersList[existingIndex].description;
    } else {
      ownersList.push({ pattern, owners, description });
    }

    await this.saveCodeowners(ownersList);
    return ownersList;
  }

  /**
   * Remove owner from a pattern
   */
  async removeOwner(pattern: string, owner: string): Promise<CodeOwner[]> {
    const ownersList = await this.getCodeowners();
    const index = ownersList.findIndex(o => o.pattern === pattern);
    
    if (index >= 0) {
      ownersList[index].owners = ownersList[index].owners.filter(o => o !== owner);
      if (ownersList[index].owners.length === 0) {
        ownersList.splice(index, 1);
      }
    }

    await this.saveCodeowners(ownersList);
    return ownersList;
  }

  /**
   * Get current CODEOWNERS entries
   */
  async getCodeowners(): Promise<CodeOwner[]> {
    const cacheKey = 'codeowners';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const content = await this.github.getFile('CODEOWNERS');
      const owners = this.parseCodeowners(content);
      this.cache.set(cacheKey, owners);
      return owners;
    } catch {
      return [];
    }
  }

  /**
   * Save CODEOWNERS file
   */
  async saveCodeowners(owners: CodeOwner[]): Promise<void> {
    const content = this.generateCodeowners(owners);
    await this.github.createOrUpdateFile('CODEOWNERS', content, 'Update CODEOWNERS');
    this.cache.clear();
  }

  /**
   * Validate CODEOWNERS file
   */
  async validateCodeowners(): Promise<CodeOwnerValidation> {
    const owners = await this.getCodeowners();
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const patterns = owners.map(o => o.pattern);
    const duplicates = patterns.filter((p, i) => patterns.indexOf(p) !== i);
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate patterns found: ${duplicates.join(', ')}`);
    }

    for (let i = 0; i < owners.length; i++) {
      for (let j = i + 1; j < owners.length; j++) {
        if (this.patternsOverlap(owners[i].pattern, owners[j].pattern)) {
          warnings.push(`Pattern "${owners[i].pattern}" may be shadowed by "${owners[j].pattern}"`);
        }
      }
    }

    const emptyOwners = owners.filter(o => o.owners.length === 0);
    if (emptyOwners.length > 0) {
      errors.push(`${emptyOwners.length} patterns have no owners`);
    }

    const hasRootCoverage = owners.some(o => o.pattern === '*' || o.pattern === '/');
    if (!hasRootCoverage) {
      suggestions.push('Consider adding a root-level pattern like * or /');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private patternsOverlap(pattern1: string, pattern2: string): boolean {
    if (pattern1 === pattern2) return true;
    const moreSpecific = pattern1.length > pattern2.length ? pattern1 : pattern2;
    const lessSpecific = pattern1.length > pattern2.length ? pattern2 : pattern1;
    if (moreSpecific.startsWith(lessSpecific)) return true;
    return false;
  }

  /**
   * Calculate ownership coverage for files
   */
  async calculateCoverage(files: string[]): Promise<OwnershipCoverage> {
    const owners = await this.getCodeowners();
    const uncoveredFiles: string[] = [];

    for (const file of files) {
      const hasOwner = owners.some(owner => this.fileMatchesPattern(file, owner.pattern));
      if (!hasOwner) {
        uncoveredFiles.push(file);
      }
    }

    return {
      totalFiles: files.length,
      coveredFiles: files.length - uncoveredFiles.length,
      uncoveredFiles,
      coveragePercentage: ((files.length - uncoveredFiles.length) / files.length) * 100
    };
  }

  private fileMatchesPattern(file: string, pattern: string): boolean {
    const normalizedFile = file.startsWith('/') ? file.slice(1) : file;
    const normalizedPattern = pattern.startsWith('/') ? pattern.slice(1) : pattern;

    if (normalizedPattern.includes('*')) {
      const regex = this.globToRegex(normalizedPattern);
      return regex.test(normalizedFile);
    }

    return normalizedFile.startsWith(normalizedPattern);
  }

  private globToRegex(glob: string): RegExp {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${escaped}`);
  }

  /**
   * Suggest patterns for a new file
   */
  async suggestPatterns(file: string, teamMembers: string[]): Promise<CodeOwner[]> {
    const suggestions: CodeOwner[] = [];
    const pathParts = file.split('/');

    if (pathParts.length > 1) {
      suggestions.push({
        pattern: `/${pathParts.slice(0, 2).join('/')}/`,
        owners: teamMembers.slice(0, 2),
        description: `Auto-suggested for ${pathParts[1]} directory`
      });
    }

    const extension = file.split('.').pop();
    if (extension) {
      const extPatterns: Record<string, string> = {
        ts: '/src/**/*.ts', js: '/src/**/*.js', test: '/src/**/*.test.ts',
        md: '/*.md', yml: '/.github/**', json: '/*.json'
      };

      if (extPatterns[extension]) {
        suggestions.push({
          pattern: extPatterns[extension],
          owners: teamMembers.slice(0, 1),
          description: `Auto-suggested for .${extension} files`
        });
      }
    }

    return suggestions;
  }

  /**
   * Bulk update CODEOWNERS
   */
  async bulkUpdate(updates: Array<{ pattern: string; owners: string[] }>): Promise<CodeOwner[]> {
    const owners = await this.getCodeowners();
    
    for (const update of updates) {
      const existing = owners.find(o => o.pattern === update.pattern);
      if (existing) {
        existing.owners = update.owners;
      } else {
        owners.push({ pattern: update.pattern, owners: update.owners });
      }
    }

    await this.saveCodeowners(owners);
    return owners;
  }

  /**
   * Export CODEOWNERS as JSON
   */
  async exportAsJson(): Promise<string> {
    const owners = await this.getCodeowners();
    return JSON.stringify({ codeowners: owners }, null, 2);
  }

  /**
   * Import CODEOWNERS from JSON
   */
  async importFromJson(json: string): Promise<CodeOwner[]> {
    const data = JSON.parse(json);
    const owners: CodeOwner[] = data.codeowners || data;
    await this.saveCodeowners(owners);
    return owners;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
