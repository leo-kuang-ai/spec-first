---
date: 2026-03-30
topic: code-audit-report
---

# Spec-First 代码审计报告

**版本**: 1.3.15 | **代码量**: ~2000 行 (15 源文件) | **日期**: 2026-03-30

---

## 总体评价

项目架构设计合理，适配器模式分离了平台差异，状态管理支持幂等的 init/clean 操作。代码整体可读性好，函数职责清晰。但存在 **5 处死代码**（3 个未使用模块 + 1 个未使用模块含副作用 + 1 个未使用函数）、**1 个文档错误**，以及若干代码质量和架构债务需要关注。

**风险等级分布**: 🔴 Critical ×1 | 🟠 High ×2 | 🟡 Medium ×5 | 🔵 Low ×5

---

## 🔴 Critical

### C1. `agents.js`、`skills.js` 缺少 adapter 参数；`templates.js` 是未使用的薄包装

**文件**: `src/cli/agents.js`, `src/cli/skills.js`, `src/cli/templates.js`

`agents.js:syncAgents(projectRoot)` 调用 `plugin.js:syncAgents(projectRoot, adapter)`，缺少 `adapter` 参数。`skills.js:syncSkills(projectRoot)` 同样缺少 `adapter` 参数，且 `checkInstalledSkills(projectRoot)` 调用 `inspectInstalledAssets(projectRoot)` 也缺少 `adapter`。`templates.js` 同样是未使用的薄包装模块。

```js
// agents.js:11 - 只传了 projectRoot，plugin.js:syncAgents 还需要 adapter
function syncAgents(projectRoot) {
  return syncBundledAgents(projectRoot); // 缺少 adapter 参数
}
```

**影响**: 如果有代码路径直接调用这些包装函数，会抛出 TypeError（`Cannot read properties of undefined`）。
**缓解**: 当前主流程 (`init.js`) 直接调用 `plugin.js` 函数并传入 adapter，所以主流程不受影响。但这些模块是**死代码陷阱**——如果未来有人引用它们会直接崩溃。
**建议**: 修复签名或删除这些未使用的包装模块。

---

## 🟠 High

### H1. `spec-commands.js` 模块级副作用

**文件**: `src/cli/spec-commands.js:3`

```js
const COMMANDS = listBundledCommands(); // 模块加载时立即读取并解析 manifest
```

任何 `require('./spec-commands')` 都会在 import 时触发 `loadPluginManifest()`，读取文件系统。如果 manifest 不存在（比如开发环境中误操作），require 会立即抛出异常。虽然调用者可以用 `try { require(...) } catch(e) {}` 包裹，但大多数代码不会预料到 import 会有副作用，因此这个异常通常不会被处理。

**建议**: 延迟加载，或改为函数调用。

### H2. `postinstall.js` 文档错误

**文件**: `bin/postinstall.js:18`

```
$ spec-first init
```

但 `init` 命令必须指定 `--claude` 或 `--codex`，不带参数会返回错误。这会在 npm install 后误导用户。

**建议**: 改为 `spec-first init --claude` 或 `spec-first init --codex`。

---

## 🟡 Medium

### M1. `init.js` 解析了 `--force` 但未使用

**文件**: `src/cli/commands/init.js:159`

`parseInitArgs` 接受 `--force` 标志并设置 `parsed.force = true`，但 `runInit` 从未读取这个值。用户传入 `--force` 无任何效果。

### M2. `plugin.js:adaptClaudeRuntimeContent()` 是死代码

**文件**: `src/cli/plugin.js:280-282`

定义了函数但未导出、未调用。

### M3. `plugin.js:syncCommands` 调用 `transformSkillContent` 处理命令文件

**文件**: `src/cli/plugin.js:142`

```js
const transformed = adapter.transformSkillContent(content);
```

对 command 文件调用了 `transformSkillContent` 而非专用的命令转换方法。虽然在当前实现中转换逻辑相同，但命名暗示这是给 skill 用的，语义不清晰。

### M4. `doctor.js` 的 `splice` 索引计算脆弱

**文件**: `src/cli/commands/doctor.js:72`

```js
platformChecks.splice(3 + runtimeChecks.length, 0, checkGeneratedCommands(...));
```

索引 `3 + runtimeChecks.length` 依赖前面检查项的精确数量。如果有人增减检查项，command 检查会被插入到错误位置。

### M5. `claude.js` 在方法内部 `require` 模块

**文件**: `src/cli/adapters/claude.js:50-51`

`inspect()` 方法内部 `require('node:fs')` 和 `require('node:path')`，其他所有文件都在顶部导入。风格不一致。

---

## 🔵 Low

### L1. `printVersion()` ASCII 框宽度硬编码

**文件**: `src/cli/index.js:64-72`

版本号变长时（如 `1.3.15-beta.1`），框对齐会被破坏。

### L2. CLI 输出使用 Emoji

**文件**: `src/cli/index.js`, `src/cli/commands/init.js`

在某些终端环境下 Emoji 可能显示为方块。对 CLI 工具而言，这是可接受的风格选择，但值得注意。

### L3. 无日志/调试模式

所有输出通过 `console.log` / `console.error`，没有 `--verbose` 或 `--debug` 选项。排查问题时需要读源码。

### L4. 无单元测试

存在冒烟测试 (`tests/smoke/cli.sh`) 和集成测试目录 (`tests/integration/`)，但没有针对单个模块的单元测试。重构时风险较高。

### L5. `state.json` 无 Schema 校验

状态文件的字段通过 `normalizeState()` 做基本类型检查，但没有 JSON Schema 验证。如果状态文件被手动编辑损坏，错误信息不够友好。

---

## 架构评价

### 优点

| 方面 | 评价 |
|------|------|
| **适配器模式** | 干净地分离了 Claude/Codex 平台差异，扩展新平台只需新增 adapter |
| **状态管理** | state.json 追踪受管资产，支持幂等 init 和干净 clean |
| **资产生命周期** | init/clean/doctor 三命令覆盖安装、卸载、诊断的完整生命周期 |
| **防破坏设计** | clean 操作只移除 state.json 记录的受管资产，保留用户自定义文件 |
| **幂等性** | 重复运行 init 会正确覆盖和清理过时资产 |

### 债务

| 债务 | 影响 |
|------|------|
| `hasCommands` 条件逻辑散布各处 | 违反开闭原则，每新增平台类型需改动 init/doctor/clean/plugin |
| 死代码模块 (`agents.js`, `skills.js`, `templates.js`, `spec-commands.js`) | 增加认知负担，混淆维护者 (见 C1, H1) |
| 无类型系统 (纯 CommonJS) | 参数签名错误（如 C1）只能在运行时发现 |

---

## 建议优先级

| 优先级 | 项目 | 工作量 |
|--------|------|--------|
| P0 | C1: 删除或修复 `agents.js` / `skills.js` / `templates.js` 死代码 | 小 |
| P1 | H1: 修复 `spec-commands.js` 模块级副作用 | 小 |
| P1 | H2: 修复 `postinstall.js` 文档 | 小 |
| P2 | M1: 删除未使用的 `--force` 解析 | 小 |
| P2 | M2: 删除 `adaptClaudeRuntimeContent` 死代码 | 小 |
| P3 | M4: 重构 doctor 检查列表的构建方式 | 中 |
| P3 | L4: 为核心模块添加单元测试 | 中 |

---

## Next Steps

→ `spec-plan` 将审计发现转化为具体的修复计划
