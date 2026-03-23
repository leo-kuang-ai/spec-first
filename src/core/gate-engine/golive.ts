/**
 * GoLive 检查
 */
import { join } from 'node:path';
import type { Stage, GateResult } from '../../shared/types.js';
import { exists } from '../../shared/fs-utils.js';
import { runSca } from './sca.js';
import { validateSecurity, parseSecurityReport } from './security.js';
import { readFileSync } from 'node:fs';
import { RELEASE_REQUIRED_ARTIFACTS } from '../rules/truth-source.js';
import { loadDocumentLinks, listMissingDocumentFiles } from '../document-links.js';

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
  confirmPolicy: 'strict' | 'assisted' | 'auto';
}

export function checkGoLive(featureId: string, projectRoot: string): GoLiveResult {
  const checks: GoLiveCheck[] = [];

  const lastGate = getLastGateResult(featureId, projectRoot);
  checks.push({
    id: 'GL-01',
    description: '最近一次 Gate 结果为 PASS 或 PASS_WITH_WAIVER',
    pass:
      lastGate !== null && (lastGate.status === 'PASS' || lastGate.status === 'PASS_WITH_WAIVER'),
    detail: lastGate ? formatGateDetail(lastGate) : '暂无 Gate 历史',
  });

  const sca = runSca(featureId, projectRoot, '05_verify' as Stage);
  checks.push({
    id: 'GL-02',
    description: '最终 SCA 通过',
    pass: sca.pass,
    detail: sca.pass ? 'SCA 已通过' : `${sca.checks.filter((check) => !check.pass).length} 项 SCA 失败`,
  });

  const secReport = join(projectRoot, 'specs', featureId, 'reports', 'security-scan.md');
  let secPass = false;
  let secDetail = 'missing: reports/security-scan.md';
  if (exists(secReport)) {
    const content = readFileSync(secReport, 'utf-8');
    const findings = parseSecurityReport(content);
    const result = validateSecurity(findings);
    secPass = result.noCritical;
    secDetail = result.detail;
  }
  checks.push({
    id: 'GL-03',
    description: '安全检查无严重项（无 S1，且无未豁免 S2）',
    pass: secPass,
    detail: secDetail,
  });

  let docLinksPass = false;
  let docLinksDetail: string;
  try {
    const links = loadDocumentLinks(featureId, projectRoot);
    const missing = listMissingDocumentFiles(links, featureId, projectRoot);
    docLinksPass = missing.length === 0;
    docLinksDetail = missing.length === 0 ? 'document links complete' : `missing: ${missing.join(', ')}`;
  } catch (error) {
    docLinksDetail = error instanceof Error ? error.message : String(error);
  }
  checks.push({
    id: 'GL-04',
    description: '文档关联声明的文档全部存在',
    pass: docLinksPass,
    detail: docLinksDetail,
  });

  const missingArtifacts = RELEASE_REQUIRED_ARTIFACTS.filter(
    (relativePath) => !exists(join(projectRoot, 'specs', featureId, relativePath))
  );
  checks.push({
    id: 'GL-05',
    description: 'Release 证据齐备（release-note + smoke-test-report）',
    pass: missingArtifacts.length === 0,
    detail:
      missingArtifacts.length === 0
        ? 'release evidence complete'
        : `missing: ${missingArtifacts.join(', ')}`,
  });

  const pass = checks.every((check) => check.pass);
  return {
    pass,
    degraded: !pass,
    confirmPolicy: pass ? 'auto' : 'strict',
    checks,
  };
}

function formatGateDetail(gateResult: GateResult): string {
  const warnings = gateResult.conditions.filter(
    (condition) => condition.status === 'FAIL' && condition.blocking === false
  );
  return warnings.length > 0
    ? `最近 Gate：${gateResult.status}（阶段 ${gateResult.stage}，${warnings.length} warnings）`
    : `最近 Gate：${gateResult.status}（阶段 ${gateResult.stage}）`;
}

function getLastGateResult(featureId: string, projectRoot: string): GateResult | null {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!exists(historyPath)) return null;

  const content = readFileSync(historyPath, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const entry = JSON.parse(lines[index]) as Record<string, unknown>;
      const isGateEval = entry.event === 'gate_eval';
      const isLegacy =
        typeof entry.status === 'string' &&
        typeof entry.stage === 'string' &&
        Array.isArray(entry.conditions);
      if (!isGateEval && !isLegacy) continue;
      return entry as unknown as GateResult;
    } catch {
      continue;
    }
  }
  return null;
}
