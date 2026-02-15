/**
 * GoLive 检查 + 降级策略
 * GL-01~GL-04 上线前检查，失败时降级 confirm_policy 为 strict
 */
import { join } from 'node:path';
import type { Stage, GateResult } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { runSca } from './sca.js';
import { validateSecurity, parseSecurityReport } from './security.js';
import { parseMatrix } from '../trace-engine/matrix.js';
import { readFileSync } from 'node:fs';

export interface GoLiveCheck {
  id: string;
  description: string;
  pass: boolean;
  detail?: string;
}

export interface GoLiveResult {
  pass: boolean;
  checks: GoLiveCheck[];
  degraded: boolean;
  /** 降级后的 confirm_policy */
  confirmPolicy: 'strict' | 'assisted' | 'auto';
}

/**
 * 执行 GL-01~GL-04 上线前检查
 * GL-01: 所有阶段 Gate 已通过
 * GL-02: 最终 SCA 通过
 * GL-03: 安全扫描无 critical
 * GL-04: 追踪矩阵全部终态
 */
export function checkGoLive(featureId: string, projectRoot: string): GoLiveResult {
  const checks: GoLiveCheck[] = [];

  // GL-01: 最近一次 Gate 结果为 PASS 或 PASS_WITH_WAIVER
  const lastGate = getLastGateResult(featureId, projectRoot);
  checks.push({
    id: 'GL-01',
    description: 'Latest Gate result is PASS or PASS_WITH_WAIVER',
    pass: lastGate !== null && (lastGate.status === 'PASS' || lastGate.status === 'PASS_WITH_WAIVER'),
    detail: lastGate ? `Last gate: ${lastGate.status} at ${lastGate.stage}` : 'No gate history',
  });

  // GL-02: 最终 SCA 通过
  const sca = runSca(featureId, projectRoot, '05_verify' as Stage);
  checks.push({
    id: 'GL-02',
    description: 'Final SCA pass',
    pass: sca.pass,
    detail: sca.pass ? 'SCA passed' : `${sca.checks.filter(c => !c.pass).length} SCA failures`,
  });

  // GL-03: 安全扫描无 critical
  const secReport = join(projectRoot, 'specs', featureId, 'reports', 'security-scan.md');
  let secPass = true;
  let secDetail = 'No security report found (assumed pass)';
  if (exists(secReport)) {
    const content = readFileSync(secReport, 'utf-8');
    const findings = parseSecurityReport(content);
    const result = validateSecurity(findings);
    secPass = result.noCritical;
    secDetail = result.detail;
  }
  checks.push({
    id: 'GL-03',
    description: 'Security no critical (no S1, no unwaived S2)',
    pass: secPass,
    detail: secDetail,
  });

  // GL-04: 追踪矩阵全部终态
  const rows = parseMatrix(featureId, projectRoot);
  const terminal = new Set(['Accepted', 'Cancelled', 'Exception']);
  const nonTerminal = rows.filter(r => !terminal.has(r.status));
  checks.push({
    id: 'GL-04',
    description: 'All matrix entries in terminal status',
    pass: nonTerminal.length === 0,
    detail: nonTerminal.length > 0
      ? `${nonTerminal.length} non-terminal entries`
      : 'All entries terminal',
  });

  const pass = checks.every(c => c.pass);

  // 降级策略：任一 GL 失败 → confirm_policy 降级为 strict
  return {
    pass,
    checks,
    degraded: !pass,
    confirmPolicy: pass ? 'auto' : 'strict',
  };
}

function getLastGateResult(featureId: string, projectRoot: string): GateResult | null {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!exists(historyPath)) return null;

  const content = readFileSync(historyPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  if (lines.length === 0) return null;

  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const entry = JSON.parse(lines[i]) as Record<string, unknown>;
      const isGateEval = entry.event === 'gate_eval';
      const isLegacy = typeof entry.status === 'string'
        && typeof entry.stage === 'string'
        && Array.isArray(entry.conditions);
      if (!isGateEval && !isLegacy) continue;
      return entry as unknown as GateResult;
    } catch {
      // 跳过损坏行
    }
  }
  return null;
}
