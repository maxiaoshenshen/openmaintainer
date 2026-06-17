/**
 * Semantic Version Manager - Handle version parsing and comparison
 */

export interface Version {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string[];
  buildMetadata?: string;
}

export interface VersionRange {
  operator: 'caret' | 'tilde' | 'exact' | 'range' | 'greater' | 'greaterOrEqual' | 'less' | 'lessOrEqual';
  version: Version;
  endVersion?: Version;
}

export interface BumpType {
  type: 'major' | 'minor' | 'patch' | 'prerelease';
  prereleaseType?: 'alpha' | 'beta' | 'rc';
}

export class SemanticVersionManager {
  parseVersion(version: string): Version | null {
    const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    const match = version.match(regex);
    
    if (!match) return null;

    const prerelease = match[4] ? match[4].split('.').filter(Boolean) : undefined;
    
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease,
      buildMetadata: match[5]
    };
  }

  formatVersion(version: Version): string {
    let result = `${version.major}.${version.minor}.${version.patch}`;
    
    if (version.prerelease && version.prerelease.length > 0) {
      result += `-${version.prerelease.join('.')}`;
    }
    
    if (version.buildMetadata) {
      result += `+${version.buildMetadata}`;
    }
    
    return result;
  }

  compareVersions(v1: Version, v2: Version): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    if (v1.patch !== v2.patch) return v1.patch - v2.patch;

    if (!v1.prerelease && !v2.prerelease) return 0;
    if (!v1.prerelease) return 1;
    if (!v2.prerelease) return -1;

    return this.comparePrerelease(v1.prerelease, v2.prerelease);
  }

  private comparePrerelease(p1: string[], p2: string[]): number {
    const len = Math.min(p1.length, p2.length);
    
    for (let i = 0; i < len; i++) {
      const a = p1[i];
      const b = p2[i];
      const aNum = parseInt(a, 10);
      const bNum = parseInt(b, 10);

      if (aNum !== NaN && bNum !== NaN) {
        if (aNum !== bNum) return aNum - bNum;
      } else if (a !== b) {
        return a > b ? 1 : -1;
      }
    }

    return p1.length - p2.length;
  }

  bumpVersion(version: Version, bump: BumpType): Version {
    const newVersion = { ...version };
    delete newVersion.prerelease;
    delete newVersion.buildMetadata;

    switch (bump.type) {
      case 'major':
        newVersion.major++;
        newVersion.minor = 0;
        newVersion.patch = 0;
        break;
      case 'minor':
        newVersion.minor++;
        newVersion.patch = 0;
        break;
      case 'patch':
        newVersion.patch++;
        break;
      case 'prerelease':
        newVersion.prerelease = this.createPrerelease(bump.prereleaseType || 'alpha', version);
        break;
    }

    return newVersion;
  }

  private createPrerelease(type: 'alpha' | 'beta' | 'rc', base: Version): string[] {
    switch (type) {
      case 'alpha':
        return ['alpha', '0'];
      case 'beta':
        return ['beta', '0'];
      case 'rc':
        return ['rc', '0'];
    }
  }

  satisfies(version: Version, range: VersionRange): boolean {
    switch (range.operator) {
      case 'exact':
        return this.compareVersions(version, range.version) === 0;
      case 'greater':
        return this.compareVersions(version, range.version) > 0;
      case 'greaterOrEqual':
        return this.compareVersions(version, range.version) >= 0;
      case 'less':
        return this.compareVersions(version, range.version) < 0;
      case 'lessOrEqual':
        return this.compareVersions(version, range.version) <= 0;
      case 'caret':
        return this.satisfiesCaret(version, range.version);
      case 'tilde':
        return this.satisfiesTilde(version, range.version);
      case 'range':
        return this.compareVersions(version, range.version) >= 0 &&
               this.compareVersions(version, range.endVersion!) <= 0;
      default:
        return false;
    }
  }

  private satisfiesCaret(version: Version, base: Version): boolean {
    if (base.major === 0) {
      if (base.minor === 0) {
        return version.major === 0 && version.minor === 0 && version.patch === base.patch;
      }
      return version.major === 0 && version.minor === base.minor;
    }
    return version.major === base.major;
  }

  private satisfiesTilde(version: Version, base: Version): boolean {
    if (base.major === 0) {
      if (base.minor === 0) {
        return version.major === 0 && version.minor === 0 && version.patch === base.patch;
      }
      return version.major === 0 && version.minor === base.minor;
    }
    return version.major === base.major && version.minor === base.minor;
  }

  parseRange(range: string): VersionRange | null {
    if (range.startsWith('^')) {
      const version = this.parseVersion(range.slice(1));
      if (!version) return null;
      return { operator: 'caret', version };
    }
    if (range.startsWith('~')) {
      const version = this.parseVersion(range.slice(1));
      if (!version) return null;
      return { operator: 'tilde', version };
    }
    if (range.startsWith('>=')) {
      const version = this.parseVersion(range.slice(2));
      if (!version) return null;
      return { operator: 'greaterOrEqual', version };
    }
    if (range.startsWith('<=')) {
      const version = this.parseVersion(range.slice(2));
      if (!version) return null;
      return { operator: 'lessOrEqual', version };
    }
    if (range.startsWith('>')) {
      const version = this.parseVersion(range.slice(1));
      if (!version) return null;
      return { operator: 'greater', version };
    }
    if (range.startsWith('<')) {
      const version = this.parseVersion(range.slice(1));
      if (!version) return null;
      return { operator: 'less', version };
    }
    if (range.includes('-')) {
      const [start, end] = range.split('-').map(s => s.trim());
      const startVersion = this.parseVersion(start);
      const endVersion = this.parseVersion(end);
      if (!startVersion || !endVersion) return null;
      return { operator: 'range', version: startVersion, endVersion };
    }
    
    const version = this.parseVersion(range);
    if (!version) return null;
    return { operator: 'exact', version };
  }

  sortVersions(versions: Version[]): Version[] {
    return [...versions].sort((a, b) => this.compareVersions(a, b));
  }

  getLatest(versions: Version[]): Version | null {
    if (versions.length === 0) return null;
    return this.sortVersions(versions).pop()!;
  }

  getLatestCompatible(current: Version, versions: Version[]): Version | null {
    const compatible = versions.filter(v => this.satisfies(v, { operator: 'greater', version: current }));
    return this.getLatest(compatible);
  }

  diff(v1: Version, v2: Version): BumpType['type'] {
    if (v1.major !== v2.major) return 'major';
    if (v1.minor !== v2.minor) return 'minor';
    return 'patch';
  }
}

export const createSemanticVersionManager = () => new SemanticVersionManager();
