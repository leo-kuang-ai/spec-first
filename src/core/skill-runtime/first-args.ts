/**
 * First Skill 参数协议与校验
 * 统一 /spec-first:first 参数入口
 *
 * 模式选择:
 * --auto: 跳过交互，使用智能推荐模式
 * --quick: 跳过交互，强制使用 quick 模式
 * --deep: 跳过交互，强制使用 deep 模式
 *
 * 端类型指定:
 * --type=<value>: 手动指定端类型 (backend/frontend/mobile/cross-platform/desktop/monorepo)
 *
 * 行为控制:
 * --force: 跳过二次确认，强制全量更新
 *
 * 增量更新 (Phase 3):
 * --update=<products>: 仅更新指定产物，逗号分隔 (如: --update=api-docs,architecture)
 * --since=<commit|version>: 更新指定版本/commit 后的变更
 * --check-health: 仅检查产物健康度，不生成
 */

export type FirstMode = 'quick' | 'deep';
export type PlatformType =
  | 'backend'
  | 'frontend'
  | 'mobile'
  | 'cross-platform'
  | 'desktop'
  | 'monorepo'
  | 'mixed';

/** 所有可能的产物名称 */
export const PRODUCT_NAMES = [
  'tech-stack',
  'codebase-overview',
  'domain-model',
  'api-docs',
  'database-er',
  'call-graph',
  'architecture',
  'external-deps',
  'local-setup',
  'development-guidelines',
  'README',
] as const;
export type ProductName = (typeof PRODUCT_NAMES)[number];

export interface FirstArgs {
  mode: FirstMode;
  modeExplicit: boolean; // 用户是否显式传入了 --quick 或 --deep
  type?: PlatformType;
  auto: boolean; // --auto 标志：使用智能推荐
  force: boolean; // --force 标志：跳过二次确认
  skip: boolean; // --skip 标志：跳过生成，使用现有产物

  // Phase 3: 增量更新参数
  update?: ProductName[]; // --update 指定要更新的产物
  since?: string; // --since 指定起始版本/commit
  checkHealth?: boolean; // --check-health 仅检查健康度
}

export const E_FIRST_ARGS_UNKNOWN = 'E_FIRST_ARGS_UNKNOWN';
export const E_FIRST_ARGS_INVALID_TYPE = 'E_FIRST_ARGS_INVALID_TYPE';

export class FirstArgsError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'FirstArgsError';
  }
}

const ALLOWED_FLAGS = new Set([
  '--auto',
  '--quick',
  '--deep',
  '--force',
  '--skip',
  '--check-health',
]);
const TYPE_PREFIX = '--type=';
const UPDATE_PREFIX = '--update=';
const SINCE_PREFIX = '--since=';

const VALID_TYPES = new Set<PlatformType>([
  'backend',
  'frontend',
  'mobile',
  'cross-platform',
  'desktop',
  'monorepo',
  'mixed',
]);

/**
 * 校验 first skill 参数
 * @param args 命令行参数数组（已去除命令名）
 * @param onWarn 可选警告回调
 * @returns 校验后的参数对象
 * @throws FirstArgsError 参数错误时抛出
 */
export function validateFirstArgs(args: string[], onWarn?: (msg: string) => void): FirstArgs {
  const result: FirstArgs = {
    mode: 'quick', // 默认 quick 模式
    modeExplicit: false,
    auto: false,
    force: false,
    skip: false,
  };

  const seen = new Set<string>();

  for (const arg of args) {
    // 处理 --update=<products> 格式
    if (arg.startsWith(UPDATE_PREFIX)) {
      if (seen.has(UPDATE_PREFIX)) {
        onWarn?.(`重复的参数: ${arg}`);
      }
      seen.add(UPDATE_PREFIX);

      const productsStr = arg.slice(UPDATE_PREFIX.length);
      const products = productsStr
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);
      const validProducts: ProductName[] = [];

      for (const product of products) {
        const productName = product.endsWith('.md')
          ? (product.slice(0, -3) as ProductName)
          : (product as ProductName);
        if (PRODUCT_NAMES.includes(productName)) {
          validProducts.push(productName);
        } else {
          throw new FirstArgsError(
            E_FIRST_ARGS_UNKNOWN,
            `无效的产物名称: ${product}。有效值: ${PRODUCT_NAMES.join(', ')}`
          );
        }
      }

      result.update = validProducts;
      continue;
    }

    // 处理 --since=<commit|version> 格式
    if (arg.startsWith(SINCE_PREFIX)) {
      if (seen.has(SINCE_PREFIX)) {
        onWarn?.(`重复的参数: ${arg}`);
      }
      seen.add(SINCE_PREFIX);

      result.since = arg.slice(SINCE_PREFIX.length);
      continue;
    }

    // 处理 --type=value 格式
    if (arg.startsWith(TYPE_PREFIX)) {
      if (seen.has(TYPE_PREFIX)) {
        onWarn?.(`重复的参数: ${arg}`);
      }
      seen.add(TYPE_PREFIX);

      const typeValue = arg.slice(TYPE_PREFIX.length);
      if (!VALID_TYPES.has(typeValue as PlatformType)) {
        throw new FirstArgsError(
          E_FIRST_ARGS_INVALID_TYPE,
          `无效的 --type 值: ${typeValue}。有效值: ${Array.from(VALID_TYPES).join(', ')}`
        );
      }
      result.type = typeValue as PlatformType;
      continue;
    }

    // 处理标志参数
    if (ALLOWED_FLAGS.has(arg)) {
      if (seen.has(arg)) {
        onWarn?.(`重复的参数: ${arg}`);
      }
      seen.add(arg);

      switch (arg) {
        case '--auto':
          result.auto = true;
          // mode 由智能推荐决定，保持默认 quick
          break;
        case '--quick':
          result.mode = 'quick';
          result.modeExplicit = true;
          break;
        case '--deep':
          result.mode = 'deep';
          result.modeExplicit = true;
          break;
        case '--force':
          result.force = true;
          break;
        case '--skip':
          result.skip = true;
          break;
        case '--check-health':
          result.checkHealth = true;
          break;
      }
      continue;
    }

    // 未知参数
    throw new FirstArgsError(
      E_FIRST_ARGS_UNKNOWN,
      `未知参数: ${arg}。有效参数: --auto, --quick, --deep, --type=<value>, --force, --skip, --update=<products>, --since=<commit|version>, --check-health`
    );
  }

  return result;
}

/**
 * 解析 first skill 确认策略
 * 基于 --auto/--quick/--deep 标志决定是否跳过交互
 * @returns 'skip' - 跳过交互直接执行 | 'require' - 需要交互式确认
 */
export function resolveFirstConfirmPolicy(args: FirstArgs): 'skip' | 'require' {
  // --auto, --force, --skip, 显式 --quick/--deep 都跳过交互
  return args.auto || args.force || args.skip || args.modeExplicit ? 'skip' : 'require';
}

/**
 * 解析是否使用智能推荐模式
 * @returns 'auto' - 智能推荐 | 'manual' - 用户手动指定模式
 */
export function resolveFirstModePolicy(args: FirstArgs): 'auto' | 'manual' {
  return args.auto ? 'auto' : 'manual';
}

/**
 * 判断 first 命令是否需要确认（供 CLI 路由层使用）
 */
export function shouldConfirmFirst(args: string[]): boolean {
  try {
    return resolveFirstConfirmPolicy(validateFirstArgs(args)) === 'require';
  } catch {
    return false;
  }
}
