/**
 * 三级回滚策略
 * L1 配置回滚 / L2 版本回滚 / L3 数据回滚
 */

export type RollbackLevel = 'L1' | 'L2' | 'L3';

export interface RollbackAction {
  level: RollbackLevel;
  description: string;
  command?: string;
  manual?: boolean;
}

export interface RollbackPlan {
  featureId: string;
  actions: RollbackAction[];
  requiresManual: boolean;
}

/**
 * 生成回滚计划
 * L1: 配置回滚（feature flag / config 还原）
 * L2: 版本回滚（git revert / 版本回退）
 * L3: 数据回滚（数据库迁移回退，需人工确认）
 */
export function buildRollbackPlan(
  featureId: string,
  level: RollbackLevel,
  commitSha?: string,
): RollbackPlan {
  if (commitSha !== undefined && !/^[0-9a-f]{7,40}$/i.test(commitSha)) {
    throw new Error(`Invalid commit SHA: ${commitSha}`);
  }

  const actions: RollbackAction[] = [];

  // L1 始终包含
  actions.push({
    level: 'L1',
    description: 'Disable feature flag / revert config',
    command: `spec-first config set ${featureId} --enabled=false`,
  });

  if (level === 'L2' || level === 'L3') {
    actions.push({
      level: 'L2',
      description: 'Revert to previous version',
      command: commitSha ? `git revert ${commitSha}` : 'git revert HEAD',
    });
  }

  if (level === 'L3') {
    actions.push({
      level: 'L3',
      description: 'Database migration rollback (requires manual confirmation)',
      manual: true,
    });
  }

  return {
    featureId,
    actions,
    requiresManual: actions.some(a => a.manual === true),
  };
}

/** 根据故障严重程度推荐回滚级别 */
export function recommendLevel(errorRate: number, hasDataChange: boolean): RollbackLevel {
  if (hasDataChange) return 'L3';
  if (errorRate > 0.5) return 'L2';
  return 'L1';
}
