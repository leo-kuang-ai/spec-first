# Spec-First v0.5.45 全项目代码审查报告

> **审查日期**: 2026-02-28
> **审查范围**: 全量代码（src/core, src/cli, src/shared, scripts, hooks, tests, config）
> **审查方式**: 3 个并行 Code Reviewer Agent（核心引擎 / 脚本测试配置 / CLI与共享模块）
> **代码版本**: `0e973fe` (HEAD on master)

---

## 概览

| 指标 | 数值 |
|------|------|
| 测试用例 | 637 全部通过 |
| 行覆盖率 | 85.53% |
| 分支覆盖率 | 78.25% |
| 函数覆盖率 | 92.74% |
| TypeScript 编译 | 零错误 |
| src/core 代码量 | ~9,200 行 |
| 源文件数 | 70+ (.ts) + 5 (.sh) + 3 (.js) |

---

## 做得好的地方

1. **状态机模式统一** — `rfc-machine.ts`、`defect-machine.ts`、`stage-machine.ts`、`phase-machine.ts` 均采用 `ReadonlyMap` 转换表 + 终态集合 + 专用错误类 + `assert*` 守卫函数，一致性强、易扩展
2. **`command-gate.ts` 安全实践** — 可执行文件白名单 + shell 元字符阻断（`|`、`;`、反引号、`||`）+ `execFileSync`（非 `exec`），正确防御命令注入
3. **`init.ts` 并发处理** — 原子 rename + 文件锁 + 过期锁回收 + 幂等重入，CLI 工具中的生产级实现
4. **`fs-utils.ts` 路径遍历防护** — `assertSafePath` 统一应用于 I/O 操作
5. **Stage Viewer 安全绑定** — 默认绑定 `127.0.0.1` 而非 `0.0.0.0`
6. **`escapeHtml()` 覆盖完整** — `&`、`<`、`>`、`"`、`'` 五个关键字符全部处理
7. **`publish.sh` 预检完善** — clean git state → branch check → typecheck → test → build → artifact verify → dry-run
8. **类型系统完备** — `types.ts` 中 union types、enums、interfaces 消除了隐式字符串协议
9. **模块依赖图清晰无环** — 跨模块引用方向正确，CLI 层保持薄壳不泄漏业务逻辑

---

## CRITICAL（必须修复）— 6 项

### C1. Stage Viewer 命令注入漏洞

- **文件**: `scripts/stage-viewer/server.js:146`
- **问题**: `featureId` 直接拼接到 `execSync` 的 shell 命令字符串中，构造的 featureId（如 `; rm -rf /`）可执行任意命令
- **影响**: 即使只绑定 localhost，本地恶意请求仍可利用
- **修复建议**: 改用 `execFileSync` + 参数数组

```javascript
// Before (危险)
const output = execSync(
  `npx spec-first metrics coverage ${featureId} --json 2>/dev/null || echo '{}'`,
  { cwd: projectRoot, encoding: 'utf-8', timeout: 10000 }
);

// After (安全)
import { execFileSync } from 'node:child_process';
const output = execFileSync('npx', ['spec-first', 'metrics', 'coverage', featureId, '--json'], {
  cwd: projectRoot, encoding: 'utf-8', timeout: 10000
});
```

### C2. Stage Viewer 路径遍历漏洞

- **文件**: `scripts/stage-viewer/server.js:687`
- **问题**: `decodeURIComponent(url.pathname)` 后的 featureId 未校验，`/api/feature/../../etc/passwd` 可读取 specs 目录外的文件。metrics、timeline、defects、tasks、gate-status 路由均存在同样问题
- **修复建议**: 加白名单正则校验

```javascript
function sanitizeFeatureId(raw) {
  const id = decodeURIComponent(raw);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return null;
  return id;
}
```

### C3. Hook 脚本包含死代码

- **文件**: `.spec-first/hooks/commit-msg.sh`、`.spec-first/hooks/pre-push.sh`
- **问题**: 两个文件各包含两段完整脚本拼接。第一段以 `exit 0` 结束，第二段永远不会执行。`pre-push.sh` 的死代码段有更严格的阻断逻辑（`exit 1`），维护者可能误以为它在生效
- **修复建议**: 删除 `exit 0` 之后的死代码段。若为计划中的未来行为，移至单独文件并标注为 draft

### C4. 模块级 config 缓存未按 projectRoot 区分

- **文件**: `src/shared/config-schema.ts:38`
- **问题**: `cachedConfig` 全局单例，忽略 `projectRoot` 参数。首次加载后所有后续调用返回同一份配置。`doctor.ts` 已通过手动调用 `resetConfigCache()` 绕过此问题
- **修复建议**: 按 `projectRoot` 键缓存

```typescript
const configCache = new Map<string, SpecFirstConfig>();

export function loadConfig(projectRoot: string): SpecFirstConfig {
  const cached = configCache.get(projectRoot);
  if (cached) return cached;
  // ... load and validate ...
  configCache.set(projectRoot, result);
  return result;
}
```

### C5. `parseMatrixIds` 在 3 个文件中重复且行为不一致

- **文件**: `src/core/trace-engine/id-generator.ts:109-127`、`id-search.ts:71-87`、`matrix.ts:121-151`
- **问题**: `id-generator.ts` 和 `id-search.ts` 用 `filter(Boolean)`，`matrix.ts` 用 `slice(1, -1)`，边界情况（如空尾部单元格）结果不同
- **修复建议**: 统一提取到 `matrix.ts` 导出，其他模块 import

### C6. `loadRfcStatuses` 在 2 个文件中完全重复

- **文件**: `src/core/trace-engine/coverage.ts:143-156`、`src/core/gate-engine/gate-evaluator.ts:422-435`
- **问题**: 两处各自扫描 `rfc/` 目录、解析 `.rfc.json`、构建 `Map<string, string>`，逻辑完全相同
- **修复建议**: 提取到 `change-mgr` 模块共享导出

---

## IMPORTANT（应当修复）— 13 项

### I1. `parseFlag` 在 6 个 CLI 命令文件中完全重复

- **文件**: `id.ts:116`、`stage.ts:101`、`rfc.ts:155`、`defect.ts:176`、`commit.ts:14`、`analyze.ts:42`
- **问题**: 6 份相同实现，`ai.ts:119` 还有一个缺少边界检查的变体 `readOptionValue`。若解析逻辑需变更（如支持 `--flag=value`），必须同步修改 7 个文件
- **修复建议**: 提取到 `src/cli/parse-utils.ts` 统一导出

### I2. `assertSafePath` 过度拒绝含 `..` 的合法绝对路径

- **文件**: `src/shared/fs-utils.ts:16-18`
- **问题**: 拒绝所有含 `..` 的路径，包括合法的 `/Users/kuang/../other/file.json`。且 `host-bootstrap.ts` 和 `skill-commands.ts` 完全绕过 `fs-utils.ts` 直接使用 `node:fs`，安全层应用不一致
- **修复建议**: 先 `path.resolve()` 再验证是否在预期根目录内；统一所有模块通过 `fs-utils.ts` 进行 I/O

### I3. `readJson<T>` 无运行时校验

- **文件**: `src/shared/fs-utils.ts:24`
- **问题**: `as T` 仅编译期断言，手动编辑或损坏的 JSON 文件导致运行时类型不匹配。在安全敏感路径（gate evaluation、hook installation）尤其危险
- **修复建议**: 关键类型（如 `StageState`）加轻量级 shape check，或使用 zod 等校验库

### I4. `updateMatrixRow` 用 truthiness 检查导致无法设置空值

- **文件**: `src/core/trace-engine/matrix.ts:106-109`
- **问题**: `if (updates.status)` 无法将字段设为空字符串或空数组，混淆了"未提供"与"设为 falsy 值"
- **修复建议**: 改为 `!== undefined` 检查

```typescript
if (updates.status !== undefined) rows[idx].status = updates.status;
if (updates.title !== undefined) rows[idx].title = updates.title;
```

### I5. `catchup` 模块级 lock map 无清理机制

- **文件**: `src/core/ai-orchestrator/catchup.ts:39-40`
- **问题**: `catchupLocks` Map 无界增长，且节流时返回伪造 `fiveQuestions` 数据，调用方无法区分真实结果与节流跳过
- **修复建议**: 加 `skipped: boolean` 字段到 `CatchupResult`；限制 map 大小或在 TTL 过期后 `Map.delete`

### I6. `assessHighRiskChanges` 使用 `HEAD~5` 在浅克隆/新仓库会失败

- **文件**: `src/core/skill-runtime/hard-gate.ts:148`
- **问题**: catch 块静默吞掉错误，高风险评估退化为"无风险检测到"——与安全默认值相反
- **修复建议**: 加回退逻辑（如 `git rev-list --max-parents=0 HEAD`），或至少输出警告日志

### I7. 多处 catch 块丢弃错误详情

- **文件**: `src/cli/commands/gate.ts:61-64`、`src/cli/commands/ai.ts:61-63, 78-80`
- **问题**: 原始错误信息被完全丢弃，用户无法获得诊断信息
- **修复建议**: 至少输出 `(e as Error).message`

```typescript
// Before
} catch {
  console.error(`Gate 评估失败：${featureId}`);
}

// After
} catch (e) {
  console.error(`Gate 评估失败：${featureId} — ${(e as Error).message}`);
}
```

### I8. `id.ts` 未校验 `type` 参数是否为合法的 `NextIdType`

- **文件**: `src/cli/commands/id.ts:28`
- **问题**: `args[0] as NextIdType` 直接强转用户输入，无效类型传播到 `nextId()` 中。`rfc.ts` 和 `defect.ts` 已正确使用 `ReadonlySet` 校验
- **修复建议**: 参照 `rfc.ts` 模式，加 `VALID_TYPES` 集合校验

### I9. `commit.ts` `isValidTaskId` 正则过于宽松

- **文件**: `src/cli/commands/commit.ts:82`
- **问题**: `/^TASK-[\w-]+$/` 接受 `TASK-____---` 等无效格式
- **修复建议**: 收紧为 `/^TASK-[A-Z][A-Z0-9]{0,15}-\d{3,}$/`

### I10. `host-bootstrap.ts` 写用户配置文件未使用原子写入

- **文件**: `src/shared/host-bootstrap.ts:265`
- **问题**: `writeFileSync` 中途崩溃（或 Ctrl+C）会损坏 `~/.claude/settings.json` 或 `~/.codex/config.toml`。`backupInvalidJson` 函数说明已意识到损坏风险，但修复应是预防性的
- **修复建议**: 使用 write-to-temp-then-rename（原子写入）模式

### I11. `feature.ts` `handleSwitch` 未验证目标 feature 是否存在

- **文件**: `src/cli/commands/feature.ts:89-110`
- **问题**: 写入 `.spec-first/current` 前未检查 feature 目录是否完整（如缺少 `stage-state.json`），可切换到部分初始化或已删除的 feature
- **修复建议**: 切换前验证目标 feature 目录存在且包含 `stage-state.json`

### I12. `commit-msg.sh` 在 `set -u` 下 `$1` 未做空值保护

- **文件**: `.spec-first/hooks/commit-msg.sh:4`
- **问题**: `COMMIT_MSG_FILE="$1"` 在无参数调用时因 `set -u` 报错。第 5 行的 `--version` 检查已用 `${1:-}`（安全），但第 4 行未做保护
- **修复建议**: 改为 `COMMIT_MSG_FILE="${1:-}"`，或将 `--version` 检查移到赋值之前

### I13. `install-codex-autostart.sh` 硬编码 `.zshrc` 未检测实际 shell

- **文件**: `scripts/codex/install-codex-autostart.sh:5`
- **问题**: 默认写入 `$HOME/.zshrc`，在 bash/fish 等其他 shell 环境下写入错误文件
- **修复建议**: 根据 `$SHELL` 环境变量选择正确的 rc 文件

```bash
case "$SHELL" in
  */zsh)  TARGET_PROFILE="${1:-$HOME/.zshrc}" ;;
  */bash) TARGET_PROFILE="${1:-$HOME/.bashrc}" ;;
  *)      echo "Unsupported shell: $SHELL"; exit 1 ;;
esac
```

---

## SUGGESTION（建议改进）— 8 项

### S1. Markdown 表格解析应提取为共享工具函数

- **涉及文件**: `matrix.ts`、`id-generator.ts`、`id-search.ts`、`exception-validator.ts`、`init.ts`、`hard-gate.ts`、`rfc.ts`（7+ 处）
- **问题**: "split by `|` → trim cells → skip header/separator" 模式在各文件中各自实现，边界处理不一致
- **建议**: 提取 `parseMarkdownTable(content: string): string[][]` 到 shared 模块

### S2. `estimateTokens` 对中文内容严重低估

- **文件**: `src/core/ai-orchestrator/context-pack.ts:197-199`
- **问题**: 固定 4 bytes/token 比率适用于英文，但中文字符通常 3 字节 UTF-8 / 1-2 token，实际比率约 2-3 bytes/token
- **建议**: 考虑项目的中文导向，调整为 2.5-3 bytes/token 的混合比率

### S3. `pct()` 分母为 0 时返回 100% 可能掩盖问题

- **文件**: `src/core/trace-engine/coverage.ts:127-130`
- **问题**: "无 FR 存在"报告为"100% 覆盖率"，可能掩盖规范工作未开始的事实
- **建议**: 返回 `NaN` 或哨兵值，在展示层单独处理

### S4. 覆盖率阈值远低于实际水平

- **文件**: `vitest.config.ts`
- **问题**: 阈值设为 60% 行 / 50% 分支，实际为 85% / 78%，无法捕获显著的覆盖率下降
- **建议**: 提升至 75% 行 / 65% 分支

### S5. `server.js` 与 `task-parser.ts` 之间逻辑重复

- **文件**: `scripts/stage-viewer/server.js:117-206`、`scripts/stage-viewer/task-parser.ts:191-194`
- **问题**: `METRIC_DEFS`、`WEIGHTS`、`getGrade`、`getDefaultMetrics`、`calcHealthScore` 在两个文件中各维护一份，更新一处遗漏另一处会导致健康分数计算不一致
- **建议**: `server.js` 应从编译后的 `task-parser` 模块 import，而非维护副本

### S6. ESLint 忽略 `scripts/**` 导致有逻辑的文件未被 lint

- **文件**: `eslint.config.js`
- **问题**: `task-parser.ts`、`build-skills.ts` 等包含业务逻辑且有单元测试的文件被排除在 lint 之外
- **建议**: 将 `scripts/` 中的 `.ts` 文件纳入 lint 范围

### S7. `doctor.ts` 360+ 行混合检查逻辑与输出格式化

- **文件**: `src/cli/commands/doctor.ts`
- **问题**: 检查定义、检查执行、bootstrap 结果映射、报告渲染全在一个文件中，不利于单元测试
- **建议**: 拆分为 `doctor-checks.ts`（纯检查函数返回 `CheckResult[]`）+ `doctor.ts`（薄 CLI 处理层）

### S8. 无任何命令支持 `--json` 输出模式

- **问题**: `gate check`、`metrics coverage`、`matrix check` 等命令仅产生人类可读文本，不利于 CI/CD 集成和程序化消费
- **建议**: 为关键命令添加 `--json` flag

---

## 架构评估

### 模块依赖图

```
shared/ (types, fs-utils, config, logger)
  ← process-engine/ (init, stage-machine, advance, feature, layer-merger, extensions)
  ← gate-engine/ (gate-evaluator, security, sca, rollback, command-gate, golive)
  ← trace-engine/ (matrix, coverage, id-generator, id-validator, id-search, exception-validator)
  ← change-mgr/ (rfc, defect, impact, sync, rfc-machine, defect-machine)
  ← ai-orchestrator/ (context-pack, catchup, todo-runner, context-slicing, ai-stats)
  ← skill-runtime/ (dispatcher, prompt-assembler, phase-machine, confirm-policy, hard-gate)
  ← template/ (renderer, artifact-checker)
  ← tool-integration/ (hook-installer, session-hook, ai-runtime-hook)
```

- 跨模块引用最小化，流向正确（如 `gate-evaluator` → `trace-engine` 获取覆盖率数据）
- 无循环依赖
- CLI 层保持薄壳，不泄漏业务逻辑到命令处理中

### 安全评估

| 领域 | 评价 | 说明 |
|------|------|------|
| 命令执行 | ✅ 良好 | `command-gate.ts` 白名单 + 元字符阻断 + `execFileSync` |
| 路径安全 | ⚠️ 部分 | `fs-utils.ts` 有防护，但 `host-bootstrap.ts`/`skill-commands.ts` 绕过 |
| Stage Viewer | ❌ 需修复 | 命令注入 (C1) + 路径遍历 (C2) |
| Hook 安装 | ✅ 良好 | `hook-installer.ts` 使用 `execFileSync`，`session-hook.ts` 使用 `shellQuote` |
| 用户配置写入 | ⚠️ 需改进 | 非原子写入，崩溃可损坏配置文件 (I10) |
| 输入校验 | ⚠️ 部分 | 部分命令缺少枚举校验 (I8)，正则过宽 (I9) |

**信任边界提醒**: `registerSessionHooks` 和 `registerAIHooks` 写入 `~/.claude/settings.json`。若攻击者可控制项目根路径，可能注入 hook 命令。当前通过要求用户显式运行 `spec-first init`/`update` 缓解。

### 构建配置评估

| 配置文件 | 评价 |
|----------|------|
| `tsconfig.json` | ✅ strict 模式、`verbatimModuleSyntax`、`isolatedModules`，无问题 |
| `tsup.config.ts` | ✅ ESM-only、ES2022 target、sourcemaps + declarations |
| `vitest.config.ts` | ✅ 正确排除 `src/cli/index.ts`（有副作用的入口），阈值已执行 |
| `eslint.config.js` | ⚠️ `no-explicit-any: warn` 合理，但 `scripts/**` 被忽略 (S6) |
| `package.json` | ⚠️ `exports` 和 `engines` 正确；`files` 可能缺少 `.spec-first/hooks/` (见下) |

**注意**: `package.json` 的 `files` 字段包含 `scripts/stage-viewer` 和 `scripts/codex`，但未包含 `.spec-first/hooks/`。若 hook 脚本通过 npm 包分发，需补充。

---

## 技术债务总结

### 重复代码热点

| 重复项 | 出现次数 | 严重级别 |
|--------|----------|----------|
| `parseFlag` / `readOptionValue` | 7 处 | I1 |
| Markdown 表格解析 | 7+ 处 | S1 |
| `parseMatrixIds` | 3 处（行为不一致） | C5 |
| `loadRfcStatuses` | 2 处 | C6 |
| `isGlobalInstall` | 2 处 | 低 |
| `WEIGHTS` / `calcHealthScore` | 2 处 | S5 |

### 安全层一致性缺口

| 模块 | 是否通过 `fs-utils.ts` | 风险 |
|------|------------------------|------|
| `src/core/*` | ✅ 是 | — |
| `src/cli/commands/*` | ✅ 是 | — |
| `src/shared/host-bootstrap.ts` | ❌ 否（直接 `node:fs`） | 写入用户级配置文件 |
| `src/shared/skill-commands.ts` | ❌ 否（直接 `node:fs`） | 读写 skill 注册信息 |
| `scripts/stage-viewer/server.js` | ❌ 否 | 命令注入 + 路径遍历 |

---

## 修复优先级建议

### 第一优先级：安全漏洞（立即修复）

| 编号 | 问题 | 预估工作量 |
|------|------|-----------|
| C1 | Stage Viewer 命令注入 | 0.5h |
| C2 | Stage Viewer 路径遍历 | 0.5h |

### 第二优先级：正确性风险（下个版本前修复）

| 编号 | 问题 | 预估工作量 |
|------|------|-----------|
| C3 | Hook 脚本死代码清理 | 0.5h |
| C4 | Config 缓存按 projectRoot 区分 | 1h |
| C5 | `parseMatrixIds` 统一提取 | 1h |
| C6 | `loadRfcStatuses` 统一提取 | 0.5h |
| I1 | `parseFlag` 提取到共享模块 | 1h |
| I4 | `updateMatrixRow` truthiness 修复 | 0.5h |

### 第三优先级：质量改进（按需修复）

| 编号 | 问题 | 预估工作量 |
|------|------|-----------|
| I2 | `assertSafePath` 改进 + 统一应用 | 2h |
| I3 | `readJson<T>` 加运行时校验 | 2h |
| I5 | `catchup` lock map 清理 + skipped 字段 | 1h |
| I6 | `HEAD~5` 回退逻辑 | 0.5h |
| I7 | catch 块保留错误详情 | 0.5h |
| I8 | `id.ts` type 参数校验 | 0.5h |
| I9 | `isValidTaskId` 正则收紧 | 0.5h |
| I10 | `host-bootstrap.ts` 原子写入 | 1h |
| I11 | `handleSwitch` feature 存在性校验 | 0.5h |
| I12 | `commit-msg.sh` 空值保护 | 0.5h |
| I13 | `install-codex-autostart.sh` shell 检测 | 0.5h |

### 第四优先级：建议改进（长期规划）

| 编号 | 问题 | 预估工作量 |
|------|------|-----------|
| S1 | Markdown 表格解析提取为共享函数 | 2h |
| S2 | `estimateTokens` 中文比率调整 | 0.5h |
| S3 | `pct()` 零分母处理 | 0.5h |
| S4 | 覆盖率阈值提升 | 0.5h |
| S5 | `server.js` / `task-parser.ts` 去重 | 1h |
| S6 | ESLint 纳入 `scripts/*.ts` | 0.5h |
| S7 | `doctor.ts` 拆分 | 2h |
| S8 | 关键命令添加 `--json` 输出 | 4h |

---

## 结论

Spec-First v0.5.45 整体代码质量良好，架构清晰，测试覆盖充分。主要风险集中在两个方面：

1. **Stage Viewer 安全漏洞**（C1/C2）— 命令注入和路径遍历，虽然攻击面限于 localhost，但应立即修复
2. **重复代码积累**（C5/C6/I1/S1/S5）— 跨模块的重复实现是当前最大的技术债务，随项目增长会加速恶化

建议在下一个版本发布前完成第一、第二优先级的修复（预估总工作量约 5.5h），第三优先级可分批纳入后续迭代。

