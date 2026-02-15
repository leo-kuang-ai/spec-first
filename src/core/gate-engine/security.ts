/**
 * Security Severity Validation
 * S1-S4 安全扫描结果聚合与 Gate 判定
 */

export type Severity = 'S1' | 'S2' | 'S3' | 'S4';

export interface SecurityFinding {
  id: string;
  severity: Severity;
  title: string;
  waived?: boolean;
}

export interface SecurityResult {
  pass: boolean;
  /** "security no critical" = no S1 + no unwaived S2 */
  noCritical: boolean;
  findings: SecurityFinding[];
  summary: Record<Severity, number>;
  detail: string;
}

/** S1 强制 FAIL 不可豁免；S2 默认 FAIL 紧急可豁免；S3 可豁免；S4 不阻塞 */
export function validateSecurity(findings: SecurityFinding[]): SecurityResult {
  const summary: Record<Severity, number> = { S1: 0, S2: 0, S3: 0, S4: 0 };
  for (const f of findings) {
    summary[f.severity]++;
  }

  const s1Count = summary.S1;
  const unwaivedS2 = findings.filter(f => f.severity === 'S2' && !f.waived).length;
  const noCritical = s1Count === 0 && unwaivedS2 === 0;

  // S1 存在 → 强制 FAIL（不可豁免）
  // S2 未豁免 → FAIL
  const pass = noCritical;

  const parts: string[] = [];
  if (s1Count > 0) parts.push(`S1×${s1Count} (forced FAIL, no waiver)`);
  if (unwaivedS2 > 0) parts.push(`S2×${unwaivedS2} unwaived (FAIL)`);
  if (summary.S3 > 0) parts.push(`S3×${summary.S3}`);
  if (summary.S4 > 0) parts.push(`S4×${summary.S4}`);

  return {
    pass,
    noCritical,
    findings,
    summary,
    detail: parts.length > 0 ? parts.join('; ') : 'No security findings',
  };
}

/** 从安全扫描报告文件解析 findings（简化版：按行解析 Markdown 表格） */
export function parseSecurityReport(content: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.startsWith('|--') || trimmed.startsWith('| ID')) continue;

    const cells = trimmed.split('|').map(c => c.trim()).slice(1, -1);
    if (cells.length < 3) continue;

    const severity = cells[1] as Severity;
    if (!['S1', 'S2', 'S3', 'S4'].includes(severity)) continue;

    findings.push({
      id: cells[0],
      severity,
      title: cells[2],
      waived: cells[3]?.toLowerCase() === 'yes',
    });
  }
  return findings;
}
