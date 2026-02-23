# Codex 方案审查报告：OpenSpec 对齐安装更新方案

> **审查日期**: 2026-02-23 | **审查人**: Claude Code | **对照基线**: 当前代码实现 + Claude Code 方案（docs/安装与更新-方案.md）

## 审查结论

**总体评价**：方案方向正确，但存在 3 处事实偏差、2 处关键遗漏、2 处范围膨胀。建议采纳其中 3 个亮点，修正偏差后与 Claude Code 方案合并。

---

## 1. 事实偏差（与代码实现不符）

### 1.1 init 职责描述不准确 ❌

**Codex 方案第 4.1 节声称**：
> - 生成 `.spec-first/config.yaml`（若不存在）
> - 初始化 `.spec-first/layer2/` 默认平台模板（若不存在）

**实际代码**（`src/cli/commands/init.ts` + `src/core/process-engine/init.ts`）：
- `init` 不生成 `config.yaml`，项目中也不存在此文件
- `init` 不初始化 layer2 模板，而是**校验** `--platforms` 参数必须匹配已有的 `.spec-first/layer2/*.yaml`
- `init` 的实际职责：创建 Feature 目录 + 注册项目级 Skill 命令 + 安装 Git hooks

**影响**：如果按此方案实现，会给 init 增加不存在的功能，偏离当前设计。

### 1.2 update 中 "同步内置 layer2 模板" 无实现基础 ❌

**Codex 方案第 6.2 节**：
> `syncBuiltinLayer2Templates(...)`

**实际情况**：
- 当前代码中不存在"内置模板"与"用户模板"的区分机制
- `.spec-first/layer2/*.yaml` 全部由用户创建，无内置模板概念
- 实现此功能需要新增模板分类体系，属于新功能而非"对齐 OpenSpec"

### 1.3 update 中 "补齐 config 新增默认项" 无实现基础 ❌

**Codex 方案第 6.2 节**：
> `mergeConfigDefaults(...)`

**实际情况**：
- 项目不使用 `.spec-first/config.yaml`，配置通过 `src/shared/config-schema.ts` 硬编码
- 不存在 deep-merge 配置的需求和实现

---

## 2. 关键遗漏

### 2.1 缺少 npm 发布准备 ❌

Codex 方案假设 `npm install -g spec-first@latest` 可用，但完全未提及：
- `prepublishOnly` 脚本（发布前强制构建）
- `postinstall` 钩子（全局安装后自动注册）
- 全局安装检测逻辑（npm/pnpm/yarn 行为差异）
- `npm pack --dry-run` 验证发布内容

这是从"源码 link"到"registry 安装"的核心桥梁，不可省略。

### 2.2 缺少 MCP 配置补齐 ❌

Codex 方案 update 流程（第 6.2 节）只列了：
1. `ensureSkillCommands`
2. `installHooks`
3. `syncBuiltinLayer2Templates`（不存在）
4. `mergeConfigDefaults`（不存在）

**遗漏了 `ensureHostBootstrap()`**——当前 init/doctor 的核心预检，负责：
- Codex MCP config.toml 补齐（sequential-thinking、context7、serena、fetch、playwright-mcp）
- Claude Code mcp.json 补齐
- 第三方 Skill 安装（find-skills、skill-creator）
- MCP Binary 可用性检查

这是 update 最重要的职责之一，对标 OpenSpec `update` 刷新 AI 指令的核心能力。

---

## 3. 范围膨胀（过度设计）

### 3.1 备份与回滚机制（P1）⚠️

**Codex 方案第 6.3 节**：
> 可在 `.spec-first/runtime/backup/` 保存覆盖前快照

**问题**：
- update 覆盖的都是**托管资产**（Skill 命令文件、hooks），本身就是幂等生成的
- 这些文件随时可通过再次执行 update 重新生成，无需备份
- 引入备份目录增加了清理负担和用户困惑
- 真正需要保护的用户资产（specs/、业务代码）update 本就不碰

**建议**：砍掉。Git 本身就是版本管理工具。

### 3.2 托管文件头标识机制（P1）⚠️

**Codex 方案第 8.1 节**：
> 明确托管目录与文件头标识（例如 `managed-by: spec-first`）

**问题**：
- 当前 Skill 命令文件已通过**目录隔离**实现托管边界（`.claude/commands/spec-first/`）
- hooks 通过 `hook-installer.ts` 的签名注释标识
- 额外引入 YAML front-matter 标识增加解析复杂度，收益不大

**建议**：当前目录隔离 + 签名注释已够用，P0 不需要。

---

## 4. 值得采纳的亮点 ✅

### 4.1 `--dry-run` 参数

Codex 方案提出 `update --dry-run` 仅输出将发生的变更，不改文件。这是好设计：
- 降低用户执行 update 的心理门槛
- 便于 CI 中做变更检测
- 实现成本低（在各 ensure 函数前加 dry-run 分支即可）

**建议**：纳入 P0。

### 4.2 资产边界定义（第 5 节）

Codex 方案将资产分为"可覆盖 / 仅补齐 / 绝不覆盖"三级，虽然 config.yaml 和 layer2 模板部分不准确，但**分类思路**值得保留。修正后的边界：

| 级别 | 资产 | update 行为 |
|------|------|------------|
| 可覆盖 | `.claude/commands/spec-first/*.md`、`~/.claude/commands/spec-first/*.md`、`~/.codex/skills/spec-first/*`、`.git/hooks/*`（spec-first 托管） | 幂等覆盖 |
| 仅补齐 | MCP 配置（config.toml、mcp.json）、第三方 Skill（find-skills、skill-creator） | 缺失则补，已有不动 |
| 绝不覆盖 | `specs/**`、`.spec-first/layer2/*.yaml`、业务代码 | 不触碰 |

### 4.3 验收标准（第 9 节）

5 条验收标准清晰可测，可直接复用：
1. init 后可进入流程
2. update 刷新命令/hook
3. `--dry-run` 不改文件
4. 幂等性（连续两次无变更）
5. 全局安装与 npx 均可运行

---

## 5. 两方案对比

| 维度 | Codex 方案 | Claude Code 方案 | 评价 |
|------|-----------|-----------------|------|
| update 定位 | 项目级（需 cd 到项目） | 全局 + 项目级混合 | Claude Code 更准确：Skill/MCP 是全局的 |
| npm 发布准备 | ❌ 未提及 | ✅ postinstall + prepublishOnly | Codex 遗漏关键环节 |
| MCP 配置补齐 | ❌ 遗漏 | ✅ ensureHostBootstrap | Codex 遗漏核心能力 |
| layer2 模板同步 | ✅ 提出但无实现基础 | ❌ 未提及（正确，因为不存在） | Codex 虚构了不存在的功能 |
| config deep-merge | ✅ 提出但无实现基础 | ❌ 未提及（正确） | 同上 |
| --dry-run | ✅ 有 | ❌ 未提及 | Codex 亮点，应采纳 |
| 资产边界定义 | ✅ 详细（部分不准确） | ❌ 未单独定义 | Codex 亮点，修正后采纳 |
| 验收标准 | ✅ 5条可测 | ❌ 未定义 | Codex 亮点，直接复用 |
| 备份回滚 | ✅ 提出（过度设计） | ❌ 未提及 | 砍掉 |
| 托管文件标识 | ✅ 提出（过度设计） | ❌ 未提及 | P0 不需要 |
| setup 废弃策略 | 保留不强调 | deprecated + 转发 | Claude Code 更明确 |
| 实现拆解 | 粗粒度（P0/P1/P2） | 细粒度（A~G 任务） | Claude Code 更可执行 |

---

## 6. 合并建议

以 Claude Code 方案为主干，从 Codex 方案采纳 3 项补充：

### P0 最终 update 命令职责

```
spec-first update [--dry-run] [--skip-mcp] [--skip-hooks]
```

1. 输出当前版本号
2. `ensureSkillCommands(cwd, { global: true })` — Skill 命令注册
3. `ensureHostBootstrap()` — MCP 配置 + 第三方 Skill 补齐（可 `--skip-mcp` 跳过）
4. `installHooks(cwd)` — Git hooks 刷新（可 `--skip-hooks` 跳过，无 `.git` 自动跳过）
5. 输出变更摘要（updated / skipped / warn）
6. `--dry-run` 模式：仅输出将发生的变更，不写文件

### 从 Codex 方案采纳

| 项 | 来源 | 纳入阶段 |
|----|------|---------|
| `--dry-run` 参数 | Codex 4.2 节 | P0 |
| 资产边界定义（修正版） | Codex 第 5 节 | P0（写入文档） |
| 验收标准 5 条 | Codex 第 9 节 | P0（作为测试用例） |

### 从 Codex 方案砍掉

| 项 | 理由 |
|----|------|
| `syncBuiltinLayer2Templates` | 无实现基础，layer2 全为用户资产 |
| `mergeConfigDefaults` | 无 config.yaml，配置硬编码 |
| 备份回滚机制 | 托管资产可幂等重建，Git 已是版本管理 |
| 托管文件头标识 | 目录隔离 + 签名注释已够用 |

### 最终实现拆解（合并后）

| # | 任务 | 文件 |
|---|------|------|
| A | 新增 `update` 命令（含 `--dry-run`） | `src/cli/commands/update.ts`（新） |
| B | 注册 `update` 到路由 | `src/cli/index.ts` |
| C | 新增 `postinstall` 入口 | `src/postinstall.ts`（新） |
| D | package.json 补充脚本 | `package.json` |
| E | `setup` deprecated 转发 | `src/cli/commands/setup.ts` |
| F | 更新安装文档（含资产边界） | `docs/安装与更新.md` |
| G | CHANGELOG 记录 | `CHANGELOG.md` |
