/**
 * Slop Checker 独立实现与双层规则加载
 * @see TASK-ORCH-020 与 SCA 解耦，支持全局+项目双层规则
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

// ─── 类型定义 ───────────────────────────────────────────

/** 单条 slop 规则 */
export interface SlopRule {
  /** 规则 ID */
  id: string;
  /** 匹配模式（正则字符串） */
  pattern: string;
  /** 严重级别 */
  severity: 'error' | 'warning' | 'info';
  /** 规则描述 */
  message: string;
}

/** 单个 slop 检测命中 */
export interface SlopHit {
  ruleId: string;
  severity: SlopRule['severity'];
  message: string;
  line: number;
  match: string;
}

/** 检测报告 */
export interface SlopReport {
  passed: boolean;
  hits: SlopHit[];
  errorCount: number;
  warningCount: number;
}

// ─── 全局默认规则 ────────────────────────────────────────

const DEFAULT_SLOP_RULES: SlopRule[] = [
  {
    id: 'slop-todo',
    pattern: '\\bTODO\\b',
    severity: 'warning',
    message: '未完成的 TODO 标记',
  },
  {
    id: 'slop-fixme',
    pattern: '\\bFIXME\\b',
    severity: 'error',
    message: '需要修复的 FIXME 标记',
  },
  {
    id: 'slop-hack',
    pattern: '\\bHACK\\b',
    severity: 'warning',
    message: '临时 HACK 标记',
  },
];

// ─── 双层规则加载 ────────────────────────────────────────

/** 从 YAML 文件加载规则 */
function loadRulesFromYaml(filePath: string): SlopRule[] {
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
    if (!Array.isArray(parsed)) return [];
    return parsed as SlopRule[];
  } catch {
    return [];
  }
}

/**
 * 双层规则加载：项目级覆盖全局默认
 * 1. 项目级：.spec-first/slop-rules.yaml
 * 2. 全局默认：内置 DEFAULT_SLOP_RULES
 */
export function loadSlopRules(projectRoot?: string): SlopRule[] {
  if (projectRoot) {
    const projectRulesPath = join(projectRoot, '.spec-first', 'slop-rules.yaml');
    const projectRules = loadRulesFromYaml(projectRulesPath);
    if (projectRules.length > 0) return projectRules;
  }
  return DEFAULT_SLOP_RULES;
}

// ─── 检测引擎 ───────────────────────────────────────────

/**
 * 对内容逐行运行 slop 规则检测
 * passed = 无 error 级命中（warning/info 不阻断）
 */
export function runSlopCheck(content: string, rules: SlopRule[]): SlopReport {
  const lines = content.split('\n');
  const hits: SlopHit[] = [];

  for (let i = 0; i < lines.length; i++) {
    for (const rule of rules) {
      try {
        const re = new RegExp(rule.pattern, 'g');
        let m: RegExpExecArray | null;
        while ((m = re.exec(lines[i])) !== null) {
          hits.push({
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.message,
            line: i + 1,
            match: m[0],
          });
        }
      } catch {
        // 无效正则跳过
      }
    }
  }

  const errorCount = hits.filter(h => h.severity === 'error').length;
  const warningCount = hits.filter(h => h.severity === 'warning').length;

  return {
    passed: errorCount === 0,
    hits,
    errorCount,
    warningCount,
  };
}

/** 格式化 slop 检测报告 */
export function formatSlopReport(report: SlopReport): string {
  if (report.hits.length === 0) {
    return 'Slop 检查通过：无命中';
  }
  const lines = [
    `Slop 检查${report.passed ? '通过' : '失败'}：${report.errorCount} error, ${report.warningCount} warning`,
  ];
  for (const h of report.hits) {
    lines.push(`  [${h.severity}] L${h.line}: ${h.message} (${h.match})`);
  }
  return lines.join('\n');
}
