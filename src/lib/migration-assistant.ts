/**
 * Migration Assistant - Help maintainers plan and execute project migrations
 */

export interface MigrationPlan {
  id: string;
  name: string;
  fromVersion: string;
  toVersion: string;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  phases: MigrationPhase[];
  risks: Risk[];
  timeline: Timeline;
  rollback?: RollbackPlan;
}

export interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  tasks: MigrationTask[];
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  estimatedDuration: string;
}

export interface MigrationTask {
  id: string;
  title: string;
  description: string;
  type: 'code-change' | 'config-update' | 'dependency-update' | 'data-migration' | 'testing' | 'documentation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  affectedFiles?: string[];
  breakingChanges?: string[];
  automated?: boolean;
  rollbackTask?: string;
}

export interface Risk {
  id: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: 'likely' | 'possible' | 'unlikely';
  impact: string;
  mitigation: string;
}

export interface Timeline {
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  date: string;
  name: string;
  completed: boolean;
  deliverable?: string;
}

export interface RollbackPlan {
  steps: string[];
  estimatedTime: string;
  verificationChecks: string[];
}

/**
 * Detect breaking changes between versions
 */
export function detectBreakingChanges(
  currentDeps: Record<string, string>,
  targetDeps: Record<string, string>
): {
  breaking: { name: string; current: string; target: string; reason: string }[];
  warnings: { name: string; message: string }[];
  safe: string[];
} {
  const breaking: { name: string; current: string; target: string; reason: string }[] = [];
  const warnings: { name: string; message: string }[] = [];
  const safe: string[] = [];
  
  const allDeps = new Set([...Object.keys(currentDeps), ...Object.keys(targetDeps)]);
  
  for (const dep of allDeps) {
    const current = currentDeps[dep];
    const target = targetDeps[dep];
    
    if (!current) {
      safe.push(`${dep}: new dependency`);
      continue;
    }
    if (!target) {
      warnings.push({ name: dep, message: 'Dependency will be removed' });
      continue;
    }
    
    // Major version bump is breaking
    const currentMajor = parseVersion(current).major;
    const targetMajor = parseVersion(target).major;
    
    if (targetMajor > currentMajor) {
      breaking.push({
        name: dep,
        current,
        target,
        reason: `Major version bump: ${currentMajor} -> ${targetMajor}`,
      });
    } else if (parseVersion(target).minor > parseVersion(current).minor) {
      warnings.push({
        name: dep,
        message: `Minor version bump: ${current} -> ${target}`,
      });
    } else {
      safe.push(`${dep}: ${current} -> ${target}`);
    }
  }
  
  return { breaking, warnings, safe };
}

function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const cleaned = version.replace(/^[\^~>=<]/, '').split('-')[0].split('+')[0];
  const parts = cleaned.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

/**
 * Generate migration plan
 */
export function generateMigrationPlan(config: {
  name: string;
  fromVersion: string;
  toVersion: string;
  migrationType: 'dependency' | 'framework' | 'api' | 'platform';
}): MigrationPlan {
  const phases: MigrationPhase[] = [];
  
  if (config.migrationType === 'dependency') {
    phases.push({
      id: 'analysis',
      name: 'Analysis Phase',
      description: 'Analyze current state and dependencies',
      tasks: [
        {
          id: 'audit-deps',
          title: 'Audit current dependencies',
          description: 'Run npm audit and analyze package.json',
          type: 'dependency-update',
          priority: 'high',
          status: 'pending',
          automated: true,
        },
        {
          id: 'check-changelogs',
          title: 'Review changelogs',
          description: 'Check breaking changes in dependency changelogs',
          type: 'documentation',
          priority: 'high',
          status: 'pending',
        },
      ],
      status: 'pending',
      estimatedDuration: '1-2 days',
    });
    
    phases.push({
      id: 'preparation',
      name: 'Preparation Phase',
      description: 'Prepare migration environment and tests',
      tasks: [
        {
          id: 'backup',
          title: 'Create backup branch',
          description: 'Branch from main for safe migration',
          type: 'code-change',
          priority: 'critical',
          status: 'pending',
          automated: true,
        },
        {
          id: 'update-tests',
          title: 'Update test suite',
          description: 'Ensure tests cover migration-affected areas',
          type: 'testing',
          priority: 'high',
          status: 'pending',
        },
      ],
      status: 'pending',
      estimatedDuration: '2-3 days',
    });
    
    phases.push({
      id: 'execution',
      name: 'Execution Phase',
      description: 'Execute the actual migration',
      tasks: [
        {
          id: 'update-deps',
          title: 'Update dependencies',
          description: `Update package.json from ${config.fromVersion} to ${config.toVersion}`,
          type: 'dependency-update',
          priority: 'critical',
          status: 'pending',
          automated: true,
          rollbackTask: 'revert-deps',
        },
        {
          id: 'fix-breaking',
          title: 'Fix breaking changes',
          description: 'Address any breaking changes from dependencies',
          type: 'code-change',
          priority: 'critical',
          status: 'pending',
        },
      ],
      status: 'pending',
      estimatedDuration: '3-5 days',
    });
    
    phases.push({
      id: 'verification',
      name: 'Verification Phase',
      description: 'Verify migration success',
      tasks: [
        {
          id: 'run-tests',
          title: 'Run full test suite',
          description: 'Execute all tests to verify compatibility',
          type: 'testing',
          priority: 'critical',
          status: 'pending',
          automated: true,
        },
        {
          id: 'manual-testing',
          title: 'Perform manual testing',
          description: 'Test critical user flows manually',
          type: 'testing',
          priority: 'high',
          status: 'pending',
        },
      ],
      status: 'pending',
      estimatedDuration: '1-2 days',
    });
  }
  
  return {
    id: `migration-${Date.now()}`,
    name: config.name,
    fromVersion: config.fromVersion,
    toVersion: config.toVersion,
    status: 'planned',
    phases,
    risks: [
      {
        id: 'breaking-api',
        description: 'Breaking API changes in dependencies',
        severity: 'high',
        probability: 'likely',
        impact: 'Code refactoring required',
        mitigation: 'Review changelogs early and plan refactoring',
      },
    ],
    timeline: {
      startDate: new Date().toISOString().split('T')[0],
      estimatedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      milestones: [
        { date: new Date().toISOString().split('T')[0], name: 'Planning Complete', completed: false },
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'Migration Complete', completed: false },
        { date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], name: 'Production Release', completed: false },
      ],
    },
    rollback: {
      steps: ['Revert to backup branch', 'Reinstall old dependencies', 'Verify tests pass'],
      estimatedTime: '15 minutes',
      verificationChecks: ['All tests pass', 'Critical features work'],
    },
  };
}

/**
 * Update task status in migration plan
 */
export function updateTaskStatus(
  plan: MigrationPlan,
  phaseId: string,
  taskId: string,
  status: MigrationTask['status']
): MigrationPlan {
  const updatedPlan = { ...plan };
  updatedPlan.phases = plan.phases.map(phase => {
    if (phase.id === phaseId) {
      return {
        ...phase,
        tasks: phase.tasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        ),
      };
    }
    return phase;
  });
  
  // Update phase status
  updatedPlan.phases = updatedPlan.phases.map(phase => {
    const allCompleted = phase.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
    const anyInProgress = phase.tasks.some(t => t.status === 'in-progress');
    
    return {
      ...phase,
      status: allCompleted ? 'completed' : anyInProgress ? 'in-progress' : phase.status,
    };
  });
  
  // Update overall status
  const allPhasesComplete = updatedPlan.phases.every(p => p.status === 'completed');
  const anyInProgress = updatedPlan.phases.some(p => p.status === 'in-progress');
  
  if (allPhasesComplete) {
    updatedPlan.status = 'completed';
    updatedPlan.timeline.actualEndDate = new Date().toISOString().split('T')[0];
  } else if (anyInProgress) {
    updatedPlan.status = 'in-progress';
  }
  
  return updatedPlan;
}

/**
 * Generate migration report
 */
export function generateMigrationReport(plan: MigrationPlan): {
  summary: string;
  progress: { completed: number; total: number; percentage: number };
  blockers: MigrationTask[];
  nextSteps: MigrationTask[];
  completedPhases: string[];
} {
  const allTasks = plan.phases.flatMap(p => p.tasks);
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const blockedTasks = allTasks.filter(t => t.status === 'blocked');
  
  const nextTasks = plan.phases
    .filter(p => p.status !== 'completed')
    .flatMap(p => p.tasks)
    .filter(t => t.status === 'pending')
    .slice(0, 3);
  
  const summary = `Migration ${plan.name}: ${plan.fromVersion} → ${plan.toVersion}`;
  
  return {
    summary,
    progress: {
      completed: completedTasks.length,
      total: allTasks.length,
      percentage: Math.round((completedTasks.length / allTasks.length) * 100),
    },
    blockers: blockedTasks,
    nextSteps: nextTasks,
    completedPhases: plan.phases.filter(p => p.status === 'completed').map(p => p.name),
  };
}
