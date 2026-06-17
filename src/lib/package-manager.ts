export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';

export interface Dependency {
  name: string;
  version: string;
  type: 'prod' | 'dev' | 'peer' | 'optional';
  resolved?: string;
  integrity?: string;
  dev?: boolean;
}

export interface PackageUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'major' | 'minor' | 'patch' | 'prerelease';
  changelog?: string;
  breaking?: boolean;
  security?: boolean;
}

export interface Lockfile {
  version: string;
  packages: Record<string, { version: string; resolved?: string }>;
  lastUpdated: Date;
}

export class PackageManagerHelper {
  private dependencies: Map<string, Dependency> = new Map();
  private lockfiles: Map<string, Lockfile> = new Map();

  async addDependency(
    name: string,
    version: string,
    type: Dependency['type'] = 'prod'
  ): Promise<Dependency> {
    const dep: Dependency = {
      name,
      version,
      type,
      dev: type === 'dev',
    };

    this.dependencies.set(name, dep);
    return dep;
  }

  async removeDependency(name: string): Promise<boolean> {
    return this.dependencies.delete(name);
  }

  async getDependency(name: string): Promise<Dependency | null> {
    return this.dependencies.get(name) || null;
  }

  async getAllDependencies(): Promise<Dependency[]> {
    return Array.from(this.dependencies.values());
  }

  async getDependenciesByType(type: Dependency['type']): Promise<Dependency[]> {
    return Array.from(this.dependencies.values()).filter(d => d.type === type);
  }

  async checkForUpdates(): Promise<PackageUpdate[]> {
    const updates: PackageUpdate[] = [];

    for (const [name, dep] of this.dependencies) {
      // Simulate version check
      const latestMajor = parseInt(dep.version.split('.')[0]) + 1;
      const latestMinor = parseInt(dep.version.split('.')[1]) + 1;
      const latestPatch = parseInt(dep.version.split('.')[2] || '0') + 1;

      // Randomly decide if there's an update
      const hasUpdate = Math.random() > 0.7;

      if (hasUpdate) {
        const updateType = ['major', 'minor', 'patch'][Math.floor(Math.random() * 3)] as PackageUpdate['type'];
        let latestVersion = dep.version;

        if (updateType === 'major') {
          latestVersion = `${latestMajor}.0.0`;
        } else if (updateType === 'minor') {
          latestVersion = `${dep.version.split('.')[0]}.${latestMinor}.0`;
        } else {
          latestVersion = dep.version.split('.').slice(0, 2).join('.') + `.${latestPatch}`;
        }

        updates.push({
          name,
          currentVersion: dep.version,
          latestVersion,
          type: updateType,
          breaking: updateType === 'major',
          security: Math.random() > 0.8,
        });
      }
    }

    return updates;
  }

  async generateLockfile(manager: PackageManager): Promise<Lockfile> {
    const lockfile: Lockfile = {
      version: '3',
      packages: {},
      lastUpdated: new Date(),
    };

    for (const [name, dep] of this.dependencies) {
      lockfile.packages[`node_modules/${name}`] = {
        version: dep.version,
        resolved: `https://registry.npmjs.org/${name}/-/${name}-${dep.version}.tgz`,
      };
    }

    this.lockfiles.set(manager, lockfile);
    return lockfile;
  }

  async getLockfile(manager: PackageManager): Promise<Lockfile | null> {
    return this.lockfiles.get(manager) || null;
  }

  async findOutdated(): Promise<PackageUpdate[]> {
    return this.checkForUpdates();
  }

  async findIncompatible(): Promise<Array<{ name: string; reason: string }>> {
    const issues: Array<{ name: string; reason: string }> = [];

    // Simulate finding some incompatible packages
    for (const [name, dep] of this.dependencies) {
      if (name.includes('incompatible')) {
        issues.push({ name, reason: 'Package is incompatible with current environment' });
      }
    }

    return issues;
  }

  async getDependencyTree(root?: string): Promise<Record<string, string[]>> {
    const tree: Record<string, string[]> = {};

    for (const [name] of this.dependencies) {
      // Simulate some dependencies having children
      const children = Math.random() > 0.5
        ? [`${name}-dep-1`, `${name}-dep-2`]
        : [];
      tree[name] = children;
    }

    return tree;
  }

  async getCircularDependencies(): Promise<string[][]> {
    // Simulate checking for circular dependencies
    const hasCircle = Math.random() > 0.8;
    return hasCircle
      ? [['package-a', 'package-b', 'package-c', 'package-a']]
      : [];
  }

  async auditSecurity(): Promise<Array<{
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    fixAvailable: boolean;
  }>> {
    const vulnerabilities: Array<{
      name: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      fixAvailable: boolean;
    }> = [];

    // Simulate finding vulnerabilities
    for (const [name, dep] of this.dependencies) {
      if (Math.random() > 0.9) {
        const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
        vulnerabilities.push({
          name,
          severity: severities[Math.floor(Math.random() * 4)],
          description: `Vulnerability in ${name}@${dep.version}`,
          fixAvailable: Math.random() > 0.3,
        });
      }
    }

    return vulnerabilities;
  }

  async getUnusedDependencies(): Promise<string[]> {
    // Simulate finding unused dependencies
    const unused: string[] = [];
    for (const [name] of this.dependencies) {
      if (Math.random() > 0.85) {
        unused.push(name);
      }
    }
    return unused;
  }

  async generatePackageCommand(action: 'install' | 'update' | 'remove', packages?: string[]): Promise<string> {
    const commands: Record<string, string> = {
      npm: packages
        ? `npm ${action} ${packages.join(' ')}`
        : `npm ${action}`,
      yarn: packages
        ? `yarn ${action === 'install' ? 'add' : action} ${packages?.map(p => `${p}@latest`).join(' ') || ''}`
        : `yarn ${action === 'install' ? 'add' : action}`,
      pnpm: packages
        ? `pnpm ${action} ${packages.join(' ')}`
        : `pnpm ${action}`,
      bun: packages
        ? `bun ${action} ${packages.join(' ')}`
        : `bun ${action}`,
    };

    return commands.npm; // Default to npm
  }
}
