# SUP Phase 2 修复：SUP-24 / SUP-25 / SUP-30

**日期：** 2026-11-10  
**范围：** 配置核验、自动恢复能力门与 readiness 失败传播  
**证据来源：** `docs/validation/2026-11-09-harness-full-code-deep-review.md:223-249`

## SUP-24：Graphify 自动恢复只改 mode，未对应能力门

### 问题

**位置：** `skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs:113-122`（修复前）

首次 mutation 检测到 `graphify-scope-provenance-artifact-mismatch` 后，executor 构造 `refreshContext`，只把 `actionPlan.mode` 改成 `graphify-refresh`。随后 `applySelectedProviders` 按 mode 要求 `provider-refresh` 能力，而普通 `only` / `bare` 计划只有 `provider-mutation`，真实控制流执行 apply 1 次、refresh 0 次，抛出 `setup-capability-denied: provider-refresh`。

### 修复

**文件：** `skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs`

- 切换到 `graphify-refresh` mode 时同步构造 `refreshCapabilities`：
  - `install-tools`、`write-host-config`、`provider-refresh`、`write-setup-facts`
- 自动恢复路径与显式 `--only graphify --refresh` 计划的能力集合保持一致
- 不放宽 `requireCapability` 校验本身，只修正自动恢复分支的能力声明

### 回归测试

**文件：** `tests/unit/runtime-setup-graphify-auto-refresh.test.js`（新增，1/1 PASS）

- 以 `buildActionPlan({ argv: ['--only','graphify'] })` 构造真实 only 计划（确认不含 `provider-refresh`）
- mock provider registry 注入仅返回 mismatch 的 apply 与记录调用的 refresh
- 断言调用序列为 `['apply','refresh']`，且结果中不出现 `setup-capability-denied`

## SUP-25：系统级配置缺少 containment 声明

### 问题

**位置：** `skills/spec-runtime-setup/setup-registry.json` 的 Claude managed 与 Codex system 目标

目标使用绝对路径却没有 `containment_root`：

- `host-config.cjs` 正确拒绝这类路径（`host-config-path-escape`）
- 但上层在未选中且解析失败时静默跳过该目标
- 最终只检查用户级配置，报告 `configured=true / host-config-current`，丢失高优先级配置冲突

### 修复

**文件：** `skills/spec-runtime-setup/setup-registry.json`、`skills/spec-runtime-setup/setup-registry.schema.json`

- 为受支持的绝对路径目标声明窄 `containment_root`
- schema 允许按平台分组声明 `containment_root`（例如 macOS / linux 各自根目录）
- 不扩大到整个文件系统，保持路径校验语义

### 回归测试

**文件：** `tests/unit/spec-runtime-setup-containment-declaration.test.js`（3/3 PASS）

- 遍历 registry 全部 host defaults targets
- 任何使用绝对路径的 `config_path`（含按平台分组的对象形式）都必须有 `containment_root`
- 修正测试以兼容 `config_path` 由字符串扩展为平台对象后的结构

## SUP-30：目录读取失败未传播 incomplete

### 问题

**位置：** `skills/spec-write-skill/scripts/lib/package-inspection.cjs:135-149`

`inspectPackage` 捕获根目录 lstat/realpath 失败后只追加 `not_checked` finding，没有设置 `incomplete=true`，因此仍返回 `pass / ok=true`。下游 `inspect-context.cjs` 会把不存在的 payload 报告为 `target_readiness=ready`。

### 修复

**文件：** `skills/spec-write-skill/scripts/lib/package-inspection.cjs`

- 根目录 lstat / realpath 失败时设置 `incomplete = true`
- 返回 `result=incomplete`、`ok=false`，并在 findings 中给出 `skill_root_unreadable`
- 目录遍历阶段 `readdirSync` 失败已有 `directory_unreadable` + `incomplete`，保持不变

### 回归测试

**文件：** `tests/unit/spec-write-skill-read-failure.test.js`（3/3 PASS）

- 不存在的根目录：`incomplete`、`ok=false`、`skill_root_unreadable` finding、budget.exhausted
- 无读权限目录：`incomplete`、`ok=false`、`directory_unreadable`（或等价的根不可读 finding）
- 正常目录：`pass`、无 unreadable finding

## 验证边界

- SUP-24 使用 mock provider 验证 executor 的能力门控制流，不冒充真实 Graphify 构图
- SUP-25 只验证 registry 声明完整性，未读取或写入真实系统配置
- SUP-30 使用临时目录，未执行目标 package 代码
