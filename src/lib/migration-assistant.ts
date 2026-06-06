/**
 * Migration Assistant
 * Guide users through version upgrades and migrations
 */
export interface MigrationStep {
  step: number;
  title: string;
  description: string;
  codeBefore?: string;
  codeAfter?: string;
  warnings?: string[];
  estimatedTime: string;
}

export interface MigrationPath {
  fromVersion: string;
  toVersion: string;
  breakingChanges: string[];
  steps: MigrationStep[];
  rollbackPlan?: string;
}

export function generateMigrationPath(
  fromVersion: string,
  toVersion: string
): MigrationPath {
  const breakingChanges = [
    "Config format changed from JSON to YAML",
    "Deprecated config keys removed",
    "Plugin API signature updated",
  ];

  const steps: MigrationStep[] = [
    {
      step: 1,
      title: "Backup configuration",
      description: "Create a backup of your current configuration file",
      estimatedTime: "5 minutes",
    },
    {
      step: 2,
      title: "Update config format",
      description: "Migrate from JSON to YAML format",
      codeBefore: `{ "port": 3000, "host": "localhost" }`,
      codeAfter: `port: 3000\nhost: localhost`,
      warnings: ["Ensure proper YAML indentation (2 spaces)"],
      estimatedTime: "15 minutes",
    },
    {
      step: 3,
      title: "Update deprecated keys",
      description: "Replace deprecated configuration keys with new ones",
      codeBefore: `"debug": true`,
      codeAfter: `"logLevel": "debug"`,
      warnings: ["The 'debug' key is no longer supported"],
      estimatedTime: "10 minutes",
    },
    {
      step: 4,
      title: "Test migration",
      description: "Verify that the application starts correctly",
      estimatedTime: "5 minutes",
    },
  ];

  const rollbackPlan = 
    "Rollback by restoring the backup and downgrading the package version";

  return {
    fromVersion,
    toVersion,
    breakingChanges,
    steps,
    rollbackPlan,
  };
}

export function generateUpgradeChecklist(targetVersion: string): string[] {
  return [
    `Backup your data and configuration`,
    `Check breaking changes for ${targetVersion}`,
    `Update dependencies to compatible versions`,
    `Run migration scripts if provided`,
    `Test in staging environment`,
    `Monitor logs after deployment`,
    `Update documentation if needed`,
  ];
}
