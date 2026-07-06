---
title: 将 spec-setup 全量合入 spec-mcp-setup 并删除旧 setup 入口
date: 2026-04-28
status: completed
type: plan
spec_id: 2026-04-28-001-merge-spec-setup-into-spec-mcp-setup
supersedes:
  - docs/plans/2026-04-23-001-refactor-hard-cut-merge-setup-into-spec-mcp-setup-plan.md
---

# 将 spec-setup 全量合入 spec-mcp-setup 并删除旧 setup 入口

## 方案审查结论

当前方案方向正确：应把 `spec-setup` 剩余职责合入 `spec-mcp-setup`，并 hard-cut 删除 `spec-setup` / `spec-setup`。继续保留两个 setup 入口会制造用户入口分裂、治理真相源分裂和运行时资产维护成本。

但合并必须坚持分层 contract，不能把 project-local setup 与 required harness runtime 混成一个 readiness 语义：

```text
spec-mcp-setup
├─ Project Preflight / Local Setup
│  ├─ recommended helper tools
│  ├─ recommended global skills
│  ├─ .spec-first/config.local.yaml bootstrap
│  └─ legacy Compound Engineering residue cleanup guidance
└─ Required Harness Runtime
   ├─ required MCP servers
   ├─ required graph-provider MCP servers
   ├─ required helper agent-browser
   ├─ readiness ledger v2
   └─ graph provider projection
```

审查后需要收紧的点：

- `agent-browser` 已经是 required helper，不应再按 CE `ce-setup` 的 recommended tool 方式重复合入。
- `gh`、`vhs`、`silicon`、`ffmpeg`、`ast-grep` 是 recommended developer helpers，不得进入 `mcp-tools.json`，也不得影响 `baseline_ready`。
- `jq` 是 required script dependency，继续由 `check-deps.*` 管理；`check-health` 可以展示它，但不能成为 required dependency 的第二真相源。
- `.spec-first/config.local.yaml` 是 project-local preference，不是 MCP readiness 条件。
- `.compound-engineering/config.local.yaml` 是 legacy residue，只做迁移/清理提示，不读取为当前 spec-first 配置。
- 删除旧入口必须同步 manifest、governance、routing、README、smoke tests 和 changelog，不能只删 `skills/spec-setup/`。

本计划遵循 `docs/10-prompt/项目角色.md`：脚本负责确定性检查和文件操作，LLM 负责语义判断、用户确认和边界裁决。

## 背景

当前仓库已有 `docs/plans/2026-04-23-001-refactor-hard-cut-merge-setup-into-spec-mcp-setup-plan.md`，目标是一次性将 setup surface 合并到 `spec-mcp-setup`。之后 `spec-mcp-setup` 已演进为 Required Harness Runtime Setup，并接管 MCP/graph-provider/`agent-browser` readiness。

但当前 source 仍保留独立 `spec-setup`：

- `skills/spec-setup/SKILL.md`
- `skills/spec-setup/scripts/check-health`
- `skills/spec-setup/references/config-template.yaml`
- `templates/claude/commands/spec/setup.md`
- `.claude-plugin/plugin.json` 中的 `setup` command 和 `spec-setup` skill
- `src/cli/contracts/dual-host-governance/skills-governance.json` 中的 `spec-setup`
- `skills/using-spec-first/SKILL.md` 中的 `spec-setup` / `spec-setup` 路由

CE 源头 `ce-setup` 只有三个资产：`SKILL.md`、`scripts/check-health`、`references/config-template.yaml`。当前 `spec-setup` 基本是 CE setup 改名后剥离 `agent-browser` 的结果；剩余价值集中在 project-local bootstrap、recommended tools/skills 和 legacy cleanup。

## 目标

1. `spec-mcp-setup` 成为唯一 setup 入口。
2. 删除独立 `spec-setup` skill、Claude command template、manifest entry 和 governance entry。
3. 将 `spec-setup` 剩余能力合入 `spec-mcp-setup` 的 Project Preflight 层。
4. 保持 Required Harness Runtime 层的 `baseline_ready` 语义不被污染。
5. 所有活跃用户文档和 runtime-facing 文本不再暴露 `spec-setup` / `spec-setup`。
6. tests 覆盖推荐工具、project config bootstrap、旧入口删除和 readiness 边界。

## 非目标

- 不保留 `spec-setup` / `spec-setup` 兼容壳。
- 不把 recommended tools 放进 `skills/spec-mcp-setup/mcp-tools.json`。
- 不让 recommended tools、recommended skills 或 local config 缺失影响 `baseline_ready`。
- 不自动读取 `.compound-engineering/config.local.yaml` 作为 spec-first 配置。
- 不恢复 Gemini/Pi blocking question 支持；当前 host contract 只覆盖 Claude Code 和 Codex。
- 不从 `spec-mcp-setup` 运行 graph build；仍由 `spec-graph-bootstrap` 负责。

## 需求追踪

| ID | 需求 | 来源 |
|---|---|---|
| R1 | 单一 setup 入口为 `spec-mcp-setup` / `spec-mcp-setup` | 用户要求和既有 hard-cut plan |
| R2 | CE setup 的 project config bootstrap 不丢失 | CE `ce-setup` 与当前 `spec-setup` |
| R3 | legacy CE residue 有迁移/清理提示 | CE `ce-setup` 与当前 `check-health` |
| R4 | recommended developer tools 保留检测与安装建议 | CE `ce-setup` / `spec-setup` |
| R5 | `ast-grep` CLI 和 global skill 作为 recommended 项合入 | 当前 `spec-setup` 独占能力 |
| R6 | `agent-browser` 保持 required helper | 当前 `spec-mcp-setup` readiness contract |
| R7 | `baseline_ready` 只代表 required harness runtime | 当前 `spec-mcp-setup` ledger v2 contract |
| R8 | 删除旧入口时同步 runtime governance 和 tests | AGENTS.md runtime asset 治理 |

## 当前事实

### 已在 spec-mcp-setup 中覆盖

- `agent-browser` required helper：`skills/spec-mcp-setup/SKILL.md`、`scripts/install-helpers.*`、`scripts/verify-tools.*`
- required MCP registry：`skills/spec-mcp-setup/mcp-tools.json`
- required dependencies：`skills/spec-mcp-setup/scripts/check-deps.*`
- readiness ledger v2：`skills/spec-mcp-setup/scripts/verify-tools.*`
- graph provider projection：`skills/spec-mcp-setup/scripts/write-provider-config.*`
- project health report 的一部分：`skills/spec-mcp-setup/scripts/check-health`

### 仍由 spec-setup 独占或主导

- `ast-grep` CLI recommended install command
- `ast-grep` global skill recommended install command
- 交互式 recommended tools/skills 安装 UX
- `.spec-first/config.local.example.yaml` refresh 说明
- `.spec-first/config.local.yaml` create-once 说明
- `.spec-first/*.local.yaml` `.gitignore` 说明
- `spec-setup` / `spec-setup` runtime surface

### 当前 spec-mcp-setup 已检测但缺少完整执行闭环

- `.spec-first/config.local.yaml` 是否存在
- `.spec-first/config.local.example.yaml` 是否缺失/过期
- `.spec-first/config.local.yaml` 是否被 `.gitignore` 覆盖
- `compound-engineering.local.md`
- `.compound-engineering/config.local.yaml`

## 设计

### 1. Project Preflight 层

新增或正式化 `spec-mcp-setup` 的 Phase 0：

```text
Phase 0: Project Preflight
1. Run check-health.
2. Show required/recommended/helper/project/legacy facts.
3. Ask user before changing local project files.
4. Run deterministic project bootstrap script with explicit flags.
5. Continue to Required Harness Runtime setup.
```

Phase 0 只提供决策输入和可选修复：

- recommended tool 缺失不阻断 MCP setup
- local config 缺失不阻断 MCP setup
- legacy CE residue 不阻断 MCP setup
- Phase 0 输出不得写入 readiness ledger

### 2. Required Harness Runtime 层

保持现有 required chain：

```text
check-deps.*
install-helpers.*
install-mcp.*
verify-tools.*
write-provider-config.*
```

`baseline_ready` 继续只由以下项决定：

- required dependencies 能让 required scripts 运行
- required MCP tools 配置和可检测
- required graph-provider MCP tools 配置和可检测
- required helper `agent-browser` ready

### 3. Preflight JSON contract

将 `skills/spec-mcp-setup/scripts/check-health --json` 升级为可测试 contract。建议 shape：

```json
{
  "schema_version": "spec-mcp-setup-preflight.v2",
  "tools": [],
  "skills": [],
  "project": {},
  "legacy": {}
}
```

兼容要求：

- `tools[]` 继续包含 `agent-browser`，并标记 `required: true`。
- `tools[]` 包含 `gh`、`jq`、`vhs`、`silicon`、`ffmpeg`、`ast-grep`。
- `skills[]` 包含 `ast-grep`，并标记 `required: false`。
- `project` 包含 config example/local/gitignore 状态。
- `legacy` 包含 CE markdown/config residue 状态。

### 4. Project bootstrap script contract

新增确定性脚本：

- `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`

建议参数：

```text
--refresh-example
--create-local
--ensure-gitignore
--delete-legacy-markdown
--json
```

脚本只执行明确动作，不做语义判断。workflow prose 根据 `check-health` 输出和用户确认决定传哪些 flags。

脚本行为：

- 仅在 git repo 内写 project-local config；非 git repo 输出 action-required 或 not-applicable。
- `config.local.example.yaml` 每次 `--refresh-example` 都从 `references/config-template.yaml` 覆盖。
- `config.local.yaml` 只 create-once，不覆盖用户现有本地配置。
- `.gitignore` 只追加 `.spec-first/*.local.yaml`，重复运行不重复写。
- `compound-engineering.local.md` 只有在用户确认后通过 `--delete-legacy-markdown` 删除。
- `.compound-engineering/config.local.yaml` 不自动删除，只报告 legacy residue。

## 实施单元

### U1. 扩展 spec-mcp-setup prose

修改：

- `skills/spec-mcp-setup/SKILL.md`

内容：

- 增加 Project Preflight / Local Setup section。
- 明确 `check-health` 是 Phase 0 fact source。
- 明确 recommended helpers 不影响 `baseline_ready`。
- 明确 local config bootstrap 由用户确认后执行。
- 明确 legacy CE config 只做迁移/清理提示。
- 保持 graph build 禁令。

测试：

- `tests/unit/mcp-setup.sh` 或新增 JS contract 断言 prose 包含 Project Preflight、recommended helpers、`baseline_ready` 边界。

### U2. 扩展 check-health

修改：

- `skills/spec-mcp-setup/scripts/check-health`

内容：

- 添加 `ast-grep` CLI recommended tool。
- 添加 `ast-grep` global skill recommended check。
- `--json` 输出 tools、skills、project、legacy。
- 保持 `agent-browser` required。
- 保持 `gh/vhs/silicon/ffmpeg/ast-grep` recommended。
- 避免 recommended 缺失导致脚本非零退出。

测试：

- `tests/unit/browser-helper-tool-contracts.test.js`
- `tests/unit/mcp-setup.sh`

场景：

- `check-health --json` 可解析。
- `agent-browser.required === true`。
- `ast-grep` CLI 出现在 `tools` 且 `required === false`。
- `ast-grep` skill 出现在 `skills` 且 `required === false`。
- `ast-grep` 不在 `mcp-tools.json`。

### U3. 新增 project config bootstrap scripts

新增：

- `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`

测试：

- 新增 `tests/unit/project-config-bootstrap.test.js`，或扩展 `tests/unit/mcp-setup.sh`。

场景：

- example 缺失时创建。
- example 过期时刷新。
- local config 缺失时 create-once。
- local config 已存在时不覆盖。
- `.gitignore` 缺失时追加 `.spec-first/*.local.yaml`。
- `.gitignore` 已有规则时不重复追加。
- legacy markdown 只有显式 flag 才删除。
- `.compound-engineering/config.local.yaml` 不自动删除。
- 非 git repo 不乱写当前目录。

### U4. 收口 config template

保留并确认：

- `skills/spec-mcp-setup/references/config-template.yaml`

删除后不再保留：

- `skills/spec-setup/references/config-template.yaml`

要求：

- template 文案使用 `.spec-first/config.local.yaml`。
- 配置项与当前 `spec-work-beta` delegation 语义一致。
- 不同步 CE 的 `.compound-engineering` 路径。

### U5. 删除 spec-setup source 和 runtime surface

删除：

- `skills/spec-setup/`
- `templates/claude/commands/spec/setup.md`

修改：

- `.claude-plugin/plugin.json`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `skills/using-spec-first/SKILL.md`
- `src/cli/instruction-bootstrap.js`
- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `README.zh-CN.md`
- `install-local.sh`，如仍暴露旧 setup 入口

要求：

- `setup` command 从 manifest 删除。
- `spec-setup` skill 从 bundled skill list 删除。
- governance 不再声明 `spec-setup`。
- routing 中“installed spec-first environment diagnosis” 改指向 `mcp-setup`。
- active docs 不再推荐 `spec-setup` / `spec-setup`。

测试：

- `tests/unit/dual-host-governance-contracts.test.js`
- `tests/unit/using-spec-first-contracts.test.js`
- `tests/smoke/cli.sh`
- `tests/smoke/install-tarball.sh`

### U6. 更新 browser/helper contracts

修改：

- `tests/unit/browser-helper-tool-contracts.test.js`

内容：

- 删除对 `skills/spec-setup/*` 的读取。
- 断言 `skills/spec-setup` 不存在。
- 断言 `spec-mcp-setup` 是唯一 `agent-browser` owner。
- 断言 `agent-browser` 不在 `mcp-tools.json`。
- 断言 `ast-grep` 不在 `mcp-tools.json`。
- 断言 recommended helpers 不进入 readiness ledger required baseline。

### U7. 更新 package/build/runtime counts

涉及：

- `.claude-plugin/plugin.json`
- `src/cli/plugin.js`
- `tests/smoke/cli.sh`
- `tests/smoke/install-tarball.sh`
- README capability counts

删除 `spec-setup` 后命令数、workflow skill 数、bundled skill 数会变化。测试中通过 `buildFilteredAssetSet` 派生的计数应自然更新；硬编码 command file list 必须删除 `setup.md`。

### U8. 更新 changelog

修改：

- `CHANGELOG.md`

记录 user-visible breaking change：

- `spec-setup` / `spec-setup` 已移除。
- setup 能力合并到 `spec-mcp-setup` / `spec-mcp-setup`。
- project-local config bootstrap、legacy cleanup 和 recommended helper 检查由 `spec-mcp-setup` 承接。

## 文件清单

### Add

- `skills/spec-mcp-setup/scripts/bootstrap-project-config.sh`
- `skills/spec-mcp-setup/scripts/bootstrap-project-config.ps1`
- `tests/unit/project-config-bootstrap.test.js`，若不扩展 shell test

### Modify

- `CHANGELOG.md`
- `.claude-plugin/plugin.json`
- `README.md`
- `README.zh-CN.md`
- `AGENTS.md`
- `CLAUDE.md`
- `skills/spec-mcp-setup/SKILL.md`
- `skills/spec-mcp-setup/scripts/check-health`
- `skills/spec-mcp-setup/references/config-template.yaml`
- `skills/using-spec-first/SKILL.md`
- `src/cli/contracts/dual-host-governance/skills-governance.json`
- `src/cli/instruction-bootstrap.js`
- `tests/unit/browser-helper-tool-contracts.test.js`
- `tests/unit/dual-host-governance-contracts.test.js`
- `tests/unit/using-spec-first-contracts.test.js`
- `tests/unit/mcp-setup.sh`
- `tests/smoke/cli.sh`
- `tests/smoke/install-tarball.sh`

### Delete

- `skills/spec-setup/SKILL.md`
- `skills/spec-setup/scripts/check-health`
- `skills/spec-setup/references/config-template.yaml`
- `templates/claude/commands/spec/setup.md`

## 测试矩阵

### Unit / Contract

```bash
node --test tests/unit/browser-helper-tool-contracts.test.js
node --test tests/unit/using-spec-first-contracts.test.js
node --test tests/unit/dual-host-governance-contracts.test.js
bash tests/unit/mcp-setup.sh
```

如新增 project bootstrap JS test：

```bash
node --test tests/unit/project-config-bootstrap.test.js
```

### Smoke

```bash
npm run test:smoke
```

重点检查：

- Claude runtime 不生成 `.claude/commands/spec/setup.md`。
- Codex runtime 不安装 `.agents/skills/spec-setup`。
- `doctor` 不报告缺失 `spec-setup`。

### Build / Package

```bash
npm run build
```

重点检查 tarball 不包含：

- `package/skills/spec-setup/`
- `package/templates/claude/commands/spec/setup.md`

### Full

影响 runtime governance 时建议最终运行：

```bash
npm test
```

## 负向扫描

实施完成后运行：

```bash
rg -n "spec-setup|\\spec-setup|skills/spec-setup|templates/claude/commands/spec/setup|spec-setup" \
  README.md README.zh-CN.md AGENTS.md CLAUDE.md skills src templates tests .claude-plugin
```

允许保留的语境：

- `CHANGELOG.md` 中的已移除说明。
- 历史计划或历史审查文档。
- 本计划文档本身。

不允许保留的语境：

- active runtime routing。
- active README / user manual。
- manifest / governance machine truth。
- smoke test expected runtime assets。

## 风险与控制

| 风险 | 控制 |
|---|---|
| recommended tools 污染 `baseline_ready` | 测试断言 `mcp-tools.json` 不含 `ast-grep`/`gh`/`vhs`/`silicon`/`ffmpeg`，ledger baseline 只看 required runtime |
| project config bootstrap 覆盖用户本地配置 | bootstrap script 对 `config.local.yaml` 只 create-once |
| `.gitignore` 重复追加 | bootstrap script 幂等测试 |
| legacy CE config 被误当当前配置 | prose 和 test 明确 `.compound-engineering/config.local.yaml` 只做 legacy warning |
| 删除 setup 后 runtime count 漂移 | smoke 和 governance contract 使用当前 source 派生计数，并删除硬编码 `setup.md` |
| 当前 dirty worktree 被覆盖 | 实施前逐文件读当前内容，所有修改用局部 patch，不重置用户改动 |
| PowerShell parity 缺失 | `bootstrap-project-config.ps1` 与 `.sh` 同步测试或 contract 检查 |

## 执行顺序

1. 先补 `spec-mcp-setup` prose 的边界说明和 `check-health` contract。
2. 再新增 project bootstrap scripts 和 tests。
3. 然后迁移 tests 中对 `spec-setup` 的正向依赖。
4. 删除 `spec-setup` source/template。
5. 更新 manifest、governance、routing、README、smoke。
6. 运行 unit/smoke/build 验证。
7. 更新 `CHANGELOG.md` 并做负向扫描。

不要先删除目录再补引用，否则会造成半迁移状态和大量无意义测试失败。

## 完成信号

- `skills/spec-setup/` 不存在。
- `templates/claude/commands/spec/setup.md` 不存在。
- `.claude-plugin/plugin.json` 不含 `setup` command 或 `spec-setup` skill。
- `skills-governance.json` 不含 `spec-setup`。
- `using-spec-first` 不再路由到 `spec-setup` / `spec-setup`。
- `spec-mcp-setup` 明确拥有 project preflight，但 `baseline_ready` 仍只代表 required harness runtime。
- `ast-grep` 只作为 recommended helper/skill 出现在 preflight，不进入 MCP registry。
- `mcp-tools.json` 只包含 MCP servers 和 graph-provider MCP servers。
- README 和 smoke tests 只暴露 `mcp-setup` setup 入口。
- `CHANGELOG.md` 有 user-visible 记录。
