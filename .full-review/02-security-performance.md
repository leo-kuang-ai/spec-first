# Phase 2: 安全与性能审查综合报告

## 执行概览

**审查日期**: 2026-03-15
**审查范围**: Spec-First 全项目（163 个 TypeScript 文件）
**并行 Agent**: 安全漏洞评估 + 性能与可扩展性分析
**Phase 1 上下文**: 34 个问题（5 Critical, 10 High）

---

## 一、关键发现汇总

### 安全发现（Phase 2A）

| 严重级别 | 数量 | 占比 |
|---------|------|------|
| Critical | 4 | 31% |
| High | 5 | 38% |
| Medium | 3 | 23% |
| Low | 1 | 8% |
| **总计** | **13** | **100%** |

**安全成熟度**: 2.5/5 (基础保护) → 目标 4.0/5 (生产就绪)

**主要安全风险**:
1. **命令注入** - Git 命令执行未验证输入
2. **路径遍历** - 文件操作缺少路径规范化
3. **信息泄露** - 空 catch 块隐藏错误
4. **拒绝服务** - 缺少资源限制

### 性能发现（Phase 2B）

| 严重级别 | 数量 | 占比 |
|---------|------|------|
| Critical | 1 | 20% |
| High | 2 | 40% |
| Medium | 2 | 40% |
| Low | 0 | 0% |
| **总计** | **5** | **100%** |

**主要性能瓶颈**:
1. **文件 I/O 过度** - 每次操作读取完整矩阵
2. **内存膨胀** - TraceContext 重复构建
3. **递归调用** - advance() 栈溢出风险
4. **串行执行** - Auto-loop 未真正并行

---

## 二、Critical 严重问题（P0 - 立即修复）

### 安全 P0

#### C1. Git 命令注入漏洞

**位置**: `src/core/skill-runtime/hard-gate.ts:18`
**严重性**: Critical (CVSS 9.8)
**影响**: 远程代码执行 (RCE)

**问题描述**:
Git 命令执行使用 `execSync()` 且未验证输入，攻击者可以通过构造恶意输入执行任意系统命令。

**攻击场景**:
```typescript
// 当前代码
const output = execSync(`git ${args}`, { timeout: 5000 });

// 攻击向量
args = "log --oneline; rm -rf /"
// 执行: git log --oneline; rm -rf /
```

**修复建议**:
```typescript
// ✅ 修复方案
const ALLOWED_GIT_COMMANDS = ['log', 'diff', 'show', 'rev-parse'] as const;

function executeGitCommand(command: string, args: string[]): string {
  // 1. 白名单验证
  if (!ALLOWED_GIT_COMMANDS.includes(command as any)) {
    throw new Error(`Git command not allowed: ${command}`);
  }

  // 2. 参数转义
  const escapedArgs = args.map(arg => {
    // 只允许字母、数字、连字符、下划线
    if (!/^[a-zA-Z0-9\-_./]+$/.test(arg)) {
      throw new Error(`Invalid git argument: ${arg}`);
    }
    return arg;
  });

  // 3. 使用数组形式避免 shell 解析
  const result = spawnSync('git', [command, ...escapedArgs], {
    timeout: 10000,
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 // 限制输出大小
  });

  if (result.error) {
    throw new Error(`Git command failed: ${result.error.message}`);
  }

  return result.stdout;
}
```

---

#### C2. 路径遍历漏洞

**位置**: `src/core/process-engine/init.ts`, `src/shared/fs-utils.ts`
**严重性**: Critical (CVSS 8.6)
**影响**: 任意文件读写/删除

**问题描述**:
文件操作使用用户输入构建路径，未进行规范化检查，攻击者可以访问预期目录外的文件。

**攻击场景**:
```typescript
// 当前代码
const featureDir = join(projectRoot, feat); // feat 来自用户输入

// 攻击向量
feat = "../../../etc/passwd"
// 结果: /etc/passwd
```

**修复建议**:
```typescript
// ✅ 修复方案
import { resolve, normalize, relative } from 'node:path';

function safePath(baseDir: string, userPath: string): string {
  // 1. 规范化路径
  const normalizedBase = resolve(baseDir);
  const normalizedPath = resolve(baseDir, userPath);

  // 2. 检查是否在基目录内
  const relativePath = relative(normalizedBase, normalizedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  // 3. 检查危险字符
  if (userPath.includes('\0')) {
    throw new Error('Null byte in path');
  }

  return normalizedPath;
}

// 使用
const featureDir = safePath(projectRoot, feat);
```

---

#### C3. 不安全的 JSON 解析

**位置**: 多处使用 `JSON.parse()` 的文件
**严重性**: Critical (CVSS 7.5)
**影响**: 类型混淆、原型污染

**问题描述**:
直接解析 JSON 而不验证结构，可能导致类型混淆攻击。

**修复建议**:
```typescript
// ✅ 修复方案
import { z } from 'zod';

// 定义 schema
const StageStateSchema = z.object({
  featureId: z.string().regex(/^FSREQ-\d{8}-[A-Z]+-\d{3}$/),
  currentStage: z.enum([
    '00_init', '01_specify', '02_design', '03_plan',
    '04_implement', '05_verify', '06_wrap_up', '07_release',
    '08_done', '09_cancelled'
  ]),
  // ... 其他字段
});

// 安全解析
function safeParseJson<T>(
  json: string,
  schema: z.Schema<T>
): T {
  try {
    const data = JSON.parse(json);
    return schema.parse(data); // 运行时类型验证
  } catch (error) {
    throw new Error(`Invalid JSON format: ${error}`);
  }
}

// 使用
const state = safeParseJson(content, StageStateSchema);
```

---

#### C4. 拒绝服务 (DoS) 风险

**位置**: 多处文件
**严重性**: Critical (CVSS 7.5)
**影响**: 服务不可用

**问题描述**:
- 缺少文件大小限制
- 缺少字符串长度限制
- 缺少超时配置

**修复建议**:
```typescript
// ✅ 修复方案
const SECURITY_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_STRING_LENGTH: 1024 * 1024,  // 1 MB
  MAX_JSON_DEPTH: 10,
  MAX_ARRAY_LENGTH: 10000,
  COMMAND_TIMEOUT: 10000, // 10 秒
} as const;

// 文件读取限制
function safeReadFile(path: string): string {
  const stats = statSync(path);

  if (stats.size > SECURITY_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`File too large: ${stats.size} bytes`);
  }

  return readFileSync(path, 'utf-8');
}

// JSON 解析限制
function safeJsonParse(json: string): unknown {
  if (json.length > SECURITY_LIMITS.MAX_STRING_LENGTH) {
    throw new Error('JSON string too long');
  }

  return JSON.parse(json, (key, value) => {
    // 限制数组长度
    if (Array.isArray(value) && value.length > SECURITY_LIMITS.MAX_ARRAY_LENGTH) {
      throw new Error('Array too long');
    }

    return value;
  });
}
```

---

### 性能 P0

#### C5. 文件 I/O 过度导致性能瓶颈

**位置**: `src/core/trace-engine/matrix-parser.ts`, `src/core/trace-engine/coverage.ts`
**严重性**: Critical
**影响**: 大规模矩阵性能下降 10x+

**问题描述**:
每次覆盖率计算都重新读取和解析完整的追踪矩阵，没有缓存机制。

**性能影响**:
- 100 行矩阵: ~50ms
- 1000 行矩阵: ~500ms
- 10000 行矩阵: ~5s ( unacceptable)

**修复建议**:
```typescript
// ✅ 修复方案：基于 mtime 的缓存
interface CacheEntry<T> {
  data: T;
  mtime: number;
  timestamp: number;
}

class FileCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttl: number;

  constructor(ttlMs: number = 60000) { // 默认 1 分钟
    this.ttl = ttlMs;
  }

  get<T>(filePath: string, parser: (content: string) => T): T {
    const stats = statSync(filePath);
    const mtime = stats.mtimeMs;
    const cached = this.cache.get(filePath);

    // 缓存命中且未过期
    if (cached && cached.mtime === mtime && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    // 读取并解析
    const content = readFileSync(filePath, 'utf-8');
    const data = parser(content);

    // 更新缓存
    this.cache.set(filePath, {
      data,
      mtime,
      timestamp: Date.now()
    });

    return data;
  }
}

// 使用
const cache = new FileCache(60000); // 1 分钟 TTL

function parseTraceMatrix(filePath: string): TraceMatrix {
  return cache.get(filePath, (content) => {
    // 解析逻辑
    return parseMarkdownTable(content);
  });
}
```

**预计收益**: 10-100x 性能提升（取决于矩阵大小）

---

## 三、High 高优先级问题（P1 - 本迭代修复）

### 安全 P1

#### H1. 错误信息泄露敏感路径

**位置**: `src/cli/commands/*.ts`, `src/core/**/*.ts`
**严重性**: High (CVSS 5.3)

**修复建议**:
```typescript
// ❌ 当前代码
catch (error) {
  console.error(`Failed to read ${filePath}: ${error}`);
}

// ✅ 修复方案
catch (error) {
  logger.error('File operation failed', {
    operation: 'read',
    error: error instanceof Error ? error.message : 'Unknown error'
    // 不记录完整路径
  });

  // 用户友好错误
  throw new Error('Unable to access file. Please check permissions.');
}
```

---

#### H2. 缺少输入长度验证

**位置**: `src/core/process-engine/init.ts`, `src/cli/commands/*.ts`
**严重性**: High (CVSS 6.5)

**修复建议**:
```typescript
// ✅ 修复方案
const INPUT_LIMITS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_PLATFORMS: 10,
  MAX_AUTHOR_LENGTH: 100,
} as const;

function validateInput(input: string, maxLength: number, fieldName: string): void {
  if (!input || input.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }

  // 检查危险字符
  if (/[<>\"'&]/.test(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
}
```

---

#### H3. 临时文件权限不当

**位置**: `src/shared/fs-utils.ts`, `src/core/process-engine/init.ts`
**严重性**: High (CVSS 5.5)

**修复建议**:
```typescript
// ❌ 当前代码
writeFileSync(`${path}.tmp`, content);

// ✅ 修复方案
import { openSync, writeSync, closeSync, renameSync, chmodSync } from 'node:fs';

function atomicWriteFile(path: string, content: string): void {
  const tempPath = `${path}.tmp.${process.pid}`;

  // 1. 创建文件并设置权限 (仅所有者可读写)
  const fd = openSync(tempPath, 'wx', 0o600);

  try {
    // 2. 写入内容
    writeSync(fd, content, 'utf-8');
    closeSync(fd);

    // 3. 原子性重命名
    renameSync(tempPath, path);
  } catch (error) {
    // 清理临时文件
    try {
      closeSync(fd);
      unlinkSync(tempPath);
    } catch {}
    throw error;
  }
}
```

---

#### H4. 缺少速率限制

**位置**: CLI 命令
**严重性**: High (CVSS 5.3)

**修复建议**:
```typescript
// ✅ 修复方案：简单的内存速率限制
class RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly limit: number;
  private readonly window: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.window = windowMs;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // 清理过期请求
    const validRequests = requests.filter(time => now - time < this.window);

    if (validRequests.length >= this.limit) {
      return false; // 限制触发
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
}

// 使用
const limiter = new RateLimiter(10, 60000); // 每分钟 10 次

if (!limimiter.check(userId)) {
  throw new Error('Rate limit exceeded. Please wait before retrying.');
}
```

---

#### H5. 环境变量注入风险

**位置**: `src/shared/config-schema.ts`
**严重性**: High (CVSS 5.3)

**修复建议**:
```typescript
// ✅ 修复方案
const ENV_SCHEMA = z.object({
  SPEC_FIRST_DEBUG: z.enum(['true', 'false']).optional(),
  SPEC_FIRST_CACHE_TTL: z.string().regex(/^\d+$/).optional(),
  SPEC_FIRST_MAX_RETRIES: z.string().regex(/^\d+$/).optional(),
});

function loadEnvConfig(): Partial<Config> {
  try {
    return ENV_SCHEMA.parse(process.env);
  } catch (error) {
    console.warn('Invalid environment variables, using defaults');
    return {};
  }
}
```

---

### 性能 P1

#### H6. TraceContext 重复构建

**位置**: `src/core/trace-engine/upstream-lineage.ts`
**严重性**: High
**影响**: 每次调用重新构建，内存浪费

**修复建议**:
```typescript
// ✅ 修复方案：请求级缓存
const requestCache = new WeakMap<TraceContext, UpstreamLineage>();

function getUpstreamLineage(context: TraceContext): UpstreamLineage {
  // 检查缓存
  if (requestCache.has(context)) {
    return requestCache.get(context)!;
  }

  // 构建并缓存
  const lineage = buildUpstreamLineage(context);
  requestCache.set(context, lineage);

  return lineage;
}
```

---

#### H7. Auto-loop 串行执行

**位置**: `src/core/ai-orchestrator/auto-loop.ts`
**严重性**: High
**影响**: 即使 `max_parallel > 1` 也串行执行

**修复建议**:
```typescript
// ❌ 当前代码
for (const task of tasks) {
  await executeTask(task);
}

// ✅ 修复方案：真正的并行执行
async function executeParallel(
  tasks: Task[],
  maxParallel: number
): Promise<Result[]> {
  const results: Result[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = executeTask(task).then(result => {
      results.push(result);
      // 从执行队列中移除
      const index = executing.indexOf(promise);
      if (index > -1) executing.splice(index, 1);
    });

    executing.push(promise);

    // 控制并发数
    if (executing.length >= maxParallel) {
      await Promise.race(executing);
    }
  }

  // 等待所有任务完成
  await Promise.all(executing);

  return results;
}
```

---

## 四、Medium 中等问题（P2 - 下个迭代修复）

### 性能 P2

#### M1. Config 缓存 TTL 过短

**位置**: `src/shared/config-schema.ts`
**建议**: 将 TTL 从 30s 增加到 300s (5 分钟)

---

#### M2. 文件锁争用

**位置**: `src/core/process-engine/init.ts`
**建议**: 使用更细粒度的锁策略

---

## 五、为 Phase 3 提供的关键上下文

### 需要测试覆盖的安全场景

1. **Git 命令注入测试**
   - 测试各种命令注入模式
   - 验证白名单机制

2. **路径遍历测试**
   - 测试 `../` 攻击
   - 测试符号链接攻击

3. **输入验证测试**
   - 测试长度限制
   - 测试字符过滤

### 需要测试覆盖的性能场景

1. **大规模矩阵性能**
   - 1000+ 行矩阵解析
   - 覆盖率计算性能

2. **并发性能**
   - 多 Feature 并发初始化
   - 文件锁争用

3. **内存使用**
   - TraceContext 内存占用
   - 缓存大小限制

---

## 六、统计数据

### 安全指标

- **总漏洞数**: 13 个
- **Critical**: 4 个（命令注入、路径遍历、不安全 JSON、DoS）
- **High**: 5 个（信息泄露、输入验证、权限、速率限制、环境变量）
- **安全成熟度**: 2.5/5 → 目标 4.0/5

### 性能指标

- **总问题数**: 5 个
- **Critical**: 1 个（文件 I/O 过度）
- **High**: 2 个（TraceContext 重复、串行执行）
- **预计性能提升**: 10-100x（文件 I/O 优化后）

---

## 七、下一步行动

### 立即修复（P0 - 本周内）

**安全修复**（预计 8 小时）:
1. 实现 Git 命令白名单和输入验证（2h）
2. 添加路径规范化检查（2h）
3. 实现 JSON schema 验证（2h）
4. 添加资源限制（2h）

**性能修复**（预计 4 小时）:
1. 实现基于 mtime 的文件缓存（3h）
2. 添加 TraceContext 请求级缓存（1h）

### 短期修复（P1 - 下周内）

**安全修复**（预计 6 小时）:
1. 实现错误信息脱敏（2h）
2. 添加输入长度验证（2h）
3. 设置临时文件权限（1h）
4. 实现速率限制（1h）

**性能修复**（预计 3 小时）:
1. 实现真正的并行执行（3h）

---

## 八、Check Point 1 - 用户确认

**Phases 1-2 已完成**: 代码质量、架构、安全、性能审查全部完成。

### 发现汇总

| 维度 | Critical | High | Medium | Low | 总计 |
|------|----------|------|--------|-----|------|
| 代码质量 | 2 | 5 | 4 | 2 | 13 |
| 架构 | 3 | 5 | 5 | 8 | 21 |
| 安全 | 4 | 5 | 3 | 1 | 13 |
| 性能 | 1 | 2 | 2 | 0 | 5 |
| **合计** | **10** | **17** | **14** | **11** | **52** |

### 生成的报告文件

- `.full-review/00-scope.md` - 审查范围
- `.full-review/phase1a-quality-findings.md` - 代码质量详细发现
- `.full-review/phase1b-architecture-findings.md` - 架构详细发现
- `.full-review/01-quality-architecture.md` - Phase 1 综合报告
- `.full-review/phase2a-security-findings.md` - 安全详细发现
- `.full-review/phase2b-performance-findings.md` - 性能详细发现
- `.full-review/02-security-performance.md` - Phase 2 综合报告

### 请审查并选择：

**选项 1**: 继续 Phase 3（测试与文档审查）
**选项 2**: 先修复 Critical 问题（10 个 P0 问题）
**选项 3**: 暂停并保存进度

由于使用了 `--strict-mode` 且发现了 10 个 Critical 问题，**强烈建议选项 2**。

**Phase 2 审查完成，等待您的确认以继续。**
