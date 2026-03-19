/**
 * 版本区间匹配
 * 解析和匹配语义化版本区间（基于 semver 包）
 */
import semver from 'semver';

// ─── 类型定义 ───────────────────────────────────────────

/**
 * 版本区间表达式类型
 */
export type VersionRangeExpression =
  | string // 精确版本号 "1.2.3"
  | { operator: ComparisonOperator; version: string } // 比较表达式
  | { from: string; to: string; fromInclusive?: boolean; toInclusive?: boolean }; // 区间

/** 比较操作符 */
export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '=' | '==' | '!=';

/** 版本区间（简化版） */
export interface SimpleVersionRange {
  from: string;
  to: string;
  fromInclusive?: boolean;
  toInclusive?: boolean;
}

// ─── 核心函数 ───────────────────────────────────────────

/**
 * 解析版本区间字符串
 * 支持格式：
 * - "1.2.3" - 精确版本
 * - ">=1.2.3" - 比较表达式
 * - "1.2.3..2.0.0" - 区间
 * @param rangeStr 区间字符串
 * @returns 解析后的版本区间
 */
export function parseRange(rangeStr: string): SimpleVersionRange {
  // 精确版本
  if (/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(rangeStr)) {
    return {
      from: rangeStr,
      to: rangeStr,
      fromInclusive: true,
      toInclusive: true,
    };
  }

  // 比较表达式
  const comparisonMatch = /^([><=!]=?|!=)\s*(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)$/.exec(rangeStr);
  if (comparisonMatch) {
    const operator = comparisonMatch[1] as ComparisonOperator;
    const version = comparisonMatch[2];

    switch (operator) {
      case '>':
        return {
          from: version,
          to: '999.999.999', // 实际上无上限
          fromInclusive: false,
          toInclusive: true,
        };
      case '>=':
        return {
          from: version,
          to: '999.999.999',
          fromInclusive: true,
          toInclusive: true,
        };
      case '<':
        return {
          from: '0.0.0',
          to: version,
          fromInclusive: true,
          toInclusive: false,
        };
      case '<=':
        return {
          from: '0.0.0',
          to: version,
          fromInclusive: true,
          toInclusive: true,
        };
      case '=':
      case '==':
        return {
          from: version,
          to: version,
          fromInclusive: true,
          toInclusive: true,
        };
      case '!=':
        // 暂不支持不等于
        throw new Error(`暂不支持 != 比较操作符`);
      default:
        throw new Error(`未知的比较操作符：${operator}`);
    }
  }

  // 区间表达式 "1.2.3..2.0.0" 或 "1.2.3-2.0.0"
  const rangeMatch =
    /^(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\s*(\.\.||-)\s*(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)$/.exec(
      rangeStr
    );
  if (rangeMatch) {
    return {
      from: rangeMatch[1],
      to: rangeMatch[3],
      fromInclusive: true,
      toInclusive: true,
    };
  }

  throw new Error(`无法解析版本区间：${rangeStr}`);
}

/**
 * 比较两个语义化版本
 * @returns -1 (v1 < v2), 0 (v1 = v2), 1 (v1 > v2)
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = semver.valid(semver.coerce(v1));
  const clean2 = semver.valid(semver.coerce(v2));
  if (!clean1 || !clean2) return 0;
  return semver.compare(clean1, clean2);
}

/**
 * 判断版本是否匹配区间
 * @param current 当前版本
 * @param range 版本区间
 * @returns 是否匹配
 */
export function matches(current: string, range: string | SimpleVersionRange): boolean {
  // 如果 range 是字符串，先解析
  const parsed = typeof range === 'string' ? parseRange(range) : range;

  if (parsed.from === '0.0.0' && parsed.to === '999.999.999') {
    return true; // 全区间
  }

  const cmpFrom = compareVersions(current, parsed.from);
  const cmpTo = compareVersions(current, parsed.to);

  const passesFrom = parsed.fromInclusive ? cmpFrom >= 0 : cmpFrom > 0;
  const passesTo = parsed.toInclusive ? cmpTo <= 0 : cmpTo < 0;

  return passesFrom && passesTo;
}

/**
 * 获取区间内所有可用的清单
 * @param currentVersion 当前版本
 * @param manifests 所有清单
 * @returns 匹配的清单列表
 */
export function filterManifestsByVersion<T extends { versionRange: { from: string; to: string } }>(
  currentVersion: string,
  manifests: T[]
): T[] {
  return manifests.filter((m) => matches(currentVersion, m.versionRange));
}

/**
 * 版本区间转字符串表示
 */
export function rangeToString(range: SimpleVersionRange): string {
  const fromOp = range.fromInclusive ? '[' : '(';
  const toOp = range.toInclusive ? ']' : ')';
  return `${fromOp}${range.from}, ${range.to}${toOp}`;
}
