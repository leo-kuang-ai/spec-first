# High 级问题详述（17 项）

> 必须修复 — 涉及安全漏洞、逻辑 Bug、数据丢失风险

---

## 一、安全类（3 项）

### H1 — 命令注入：rollback.ts

- **文件**: `src/core/gate-engine/rollback.ts:45`
- **问题**: `commitSha` 直接拼入 shell 命令字符串，无任何校验或转义
- **风险**: 若 `commitSha` 含 shell 元字符（如 `; rm -rf /` 或 `$(cmd)`），通过 `exec` 执行时构成命令注入

```typescript
// 当前代码
command: commitSha ? `git revert ${commitSha}` : 'git revert HEAD',

// 修复方案
if (commitSha && !/^[0-9a-f]{7,40}$/.test(commitSha)) {
  throw new Error(`Invalid commit SHA: ${commitSha}`);
}
```

### H2 — YAML 反序列化不安全：layer-merger.ts

- **文件**: `src/core/process-engine/layer-merger.ts:7,157`
- **问题**:
  1. `yaml.load()` 未指定 `schema`，默认 schema 可实例化 JS 类型，存在代码执行风险
  2. 返回值直接 `as PlatformYaml` 无运行时校验，畸形 YAML 静默产生 undefined 属性

```typescript
// 当前代码
return yaml.load(raw) as PlatformYaml;

// 修复方案
const parsed = yaml.load(raw, { schema: yaml.JSON_SCHEMA });
if (!parsed || typeof parsed !== 'object' || !('platform' in parsed)) {
  throw new Error(`Invalid platform YAML: missing required fields`);
}
return parsed as PlatformYaml;
```

### H3 — Git Hook 覆写：hook-installer.ts

- **文件**: `src/core/tool-integration/hook-installer.ts:31-37`
- **问题**: `installHooks` 直接 `writeFileSync` 覆写已有 hook 文件，不检查是否属于 husky/lint-staged 等工具
- **风险**: 用户已有的 git hook 被静默销毁，无法恢复

```typescript
// 修复方案：安装前检查并备份
for (const name of HOOK_NAMES) {
  const hookPath = join(hooksDir, name);
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (!existing.includes(MARKER)) {
      const backupPath = hookPath + '.backup';
      writeFileSync(backupPath, existing, 'utf-8');
      // 追加而非覆写
    }
  }
  // ...
}
```

---

## 二、逻辑 Bug（8 项）

### H4 — Exception 过滤 ID 类型不匹配：coverage.ts

- **文件**: `src/core/trace-engine/coverage.ts:25`
- **问题**: `validExceptionFrIds` 存储的是 `frId`（FR 类型 ID），但 `r.id` 可能是 DS/TASK/TC 类型 ID，两者永远不会匹配
- **影响**: 已批准的 Exception 几乎永远不会被过滤，覆盖率计算偏低

```typescript
// 当前代码
return !validExceptionFrIds.has(r.id);

// 修复方案：匹配行的上游 FR 引用，或改为存储 exception 行自身 ID
```

### H5 — Truthiness 检查阻止字段清空：matrix.ts

- **文件**: `src/core/trace-engine/matrix.ts:87-90`
- **问题**: `if (updates.status)` 用 truthiness 判断，无法将 `title` 设为 `""`、`upstream` 设为 `[]`

```typescript
// 当前代码
if (updates.status) rows[idx].status = updates.status;
if (updates.title) rows[idx].title = updates.title;

// 修复方案
if (updates.status !== undefined) rows[idx].status = updates.status;
if (updates.title !== undefined) rows[idx].title = updates.title;
if (updates.upstream !== undefined) rows[idx].upstream = updates.upstream;
if (updates.downstream !== undefined) rows[idx].downstream = updates.downstream;
```

### H6 — Waiver 语义匹配缺失：gate-evaluator.ts

- **文件**: `src/core/gate-engine/gate-evaluator.ts:264`
- **问题**: Exception 的 `frId` 与 Gate 条件之间无 scope 关联，仅按顺序匹配第一个 FAIL 条件
- **影响**: FR-001 的豁免可能错误地豁免了与 FR-002 相关的 Gate 条件

```typescript
// 当前代码
const matchIdx = conditions.findIndex(c => c.status === 'FAIL');

// 修复方案：Gate 条件应携带关联的 frId/scope，匹配时按 scope 对齐
```

### H7 — 幂等检查返回不一致状态：init.ts

- **文件**: `src/core/process-engine/init.ts:189-192`
- **问题**: 目录已存在时，返回基于新参数计算的 `mergedRules`，但磁盘上 `stage-state.json` 仍存储旧参数
- **影响**: 调用方拿到的规则与实际持久化状态不一致

```typescript
// 修复方案：读取已有 stage-state.json 的参数来计算 mergedRules
if (exists(featureDir)) {
  const existing = readJson<StageState>(join(featureDir, 'stage-state.json'));
  const mergedRules = mergeLayerRules(existing.mode, existing.size, existing.platforms, opts.projectRoot);
  return { featureId, featureDir, mergedRules };
}
```

### H8 — Level 2 降级分支不可达：context-slicing.ts

- **文件**: `src/core/ai-orchestrator/context-slicing.ts:52-61`
- **问题**: `maxRefs = floor(budgetTokens / 200)`，`trimmed = refs.slice(0, maxRefs)`，则 `trimmed.length * 200 <= budgetTokens` 恒为 true
- **影响**: Level 2 降级逻辑永远不会触发，是死代码

```typescript
// 修复方案：重新设计降级阈值，或基于实际 token 估算而非固定 200
```

### H9 — 空参数静默传递：dispatcher.ts

- **文件**: `src/core/skill-runtime/dispatcher.ts:65`
- **问题**: `rest[1] ?? ''` 将缺失的必需参数替换为空字符串，静默传递到下游

```typescript
// 当前代码
const mappedArgs = mapping.argTemplate
  .replace('{0}', rest[1] ?? '')
  .split(/\s+/);

// 修复方案：校验必需参数
if (mapping.argTemplate.includes('{0}') && !rest[1]) {
  return { code: ExitCode.VALIDATION_ERROR, message: `Missing required argument for "${input}"` };
}
```

### H10 — Timestamp 可被覆盖：logger.ts

- **文件**: `src/shared/logger.ts:12`
- **问题**: `{ timestamp: new Date().toISOString(), ...entry }` 中 spread 在后，调用方传入 `timestamp` 字段会覆盖自动注入值

```typescript
// 修复方案：调换顺序
const record = { ...entry, timestamp: new Date().toISOString() };
```

### H11 — 日志归档同月覆盖：logger.ts

- **文件**: `src/shared/logger.ts:40`
- **问题**: 归档后缀仅到 `YYYY-MM`，同月第二次 `rotateLog` 会 `renameSync` 覆盖前一次归档
- **影响**: 历史日志数据丢失

```typescript
// 修复方案：后缀加日期+序号
const suffix = `${now.getFullYear()}-${month}-${day}-${Date.now()}`;
```

---

## 三、数据完整性（4 项）

### H12 — JSONL 单行损坏导致全量不可用：logger.ts

- **文件**: `src/shared/logger.ts:28`
- **问题**: `readLog` 对所有行执行 `JSON.parse`，任一行损坏（如进程崩溃导致的半写）则整个函数抛异常
- **影响**: 日志文件中一行损坏 = 全部历史日志不可读

```typescript
// 修复方案：逐行容错
return raw.split('\n').filter(Boolean).reduce<Record<string, unknown>[]>((acc, line) => {
  try { acc.push(JSON.parse(line)); } catch { /* skip corrupted line */ }
  return acc;
}, []);
```

### H13 — AI 统计同样的 JSONL 脆弱性：ai-stats.ts

- **文件**: `src/core/ai-orchestrator/ai-stats.ts:38`
- **问题**: 与 H12 相同模式，`readStats` 单行 JSON 解析失败导致全部统计数据不可用
- **修复**: 同 H12 方案

### H14 — catchupLocks 内存泄漏：catchup.ts

- **文件**: `src/core/ai-orchestrator/catchup.ts:23`
- **问题**: 模块级 `Map<string, number>` 只增不删，每个 featureId 调用 `catchup()` 都会新增条目
- **影响**: 长期运行进程中内存持续增长

```typescript
// 修复方案：添加 TTL 清理
function cleanExpiredLocks(): void {
  const now = Date.now();
  for (const [key, ts] of catchupLocks) {
    if (now - ts > COOLDOWN_MS * 10) catchupLocks.delete(key);
  }
}
```

### H15 — 归档写入非原子：phase-machine.ts

- **文件**: `src/core/skill-runtime/phase-machine.ts:107-116`
- **问题**: `renameSync(原文件, 归档)` 后 `writeFileSync(原文件, 截断内容)` 前若崩溃，原文件丢失且新文件未创建
- **影响**: JSONL 日志文件不可恢复丢失

```typescript
// 修复方案：先写临时文件，再原子替换
const tmpPath = filePath + '.tmp';
writeFileSync(tmpPath, kept);
renameSync(filePath, archivePath);
renameSync(tmpPath, filePath);
```

---

## 四、架构/类型（2 项）

### H16 — 配置缓存不区分 projectRoot：config-schema.ts

- **文件**: `src/shared/config-schema.ts:36`
- **问题**: 模块级 `cachedConfig` 单例缓存，首次 `loadConfig(rootA)` 后，`loadConfig(rootB)` 返回 rootA 的配置
- **影响**: 多项目场景下返回错误配置

```typescript
// 修复方案：以 projectRoot 为 key 的 Map 缓存
const configCache = new Map<string, SpecFirstConfig>();
```

### H17 — CLI 无全局错误边界：index.ts

- **文件**: `src/cli/index.ts:35-36`
- **问题**: `dispatch` 若因模块加载失败或未预期异常抛出，进程以 unhandled rejection 崩溃，无退出码

```typescript
// 修复方案
try {
  const code = await dispatch(process.argv.slice(2));
  process.exit(code);
} catch (err) {
  console.error(`Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(ExitCode.UNKNOWN_ERROR);
}
```
