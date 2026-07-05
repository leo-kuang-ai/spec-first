---
title: "Spec-First Skills 系统全量审查报告"
type: archive
status: superseded
created: 2026-04-23
archived_at: 2026-06-14
archive_reason: "legacy plan-status backfill; retained as historical evidence only, not an active implementation plan"
---
# Spec-First Skills 系统全量审查报告

> Lifecycle: historical plan archive. This document is retained as historical evidence only and is not an active implementation plan.

**审查时间**：2026-04-23  
**审查范围**：`skills/` 全量 + 直接相关代码、测试、runtime 治理  
**事实基准**：代码 > 文档；以 `docs/10-prompt/项目角色.md` 为系统判断基线

---

## 全局结论

spec-first 的整体架构是清晰的、符合项目哲学的。治理结构（`plugin.json` + `skills-governance.json`）完整且有测试覆盖，脚本/LLM 职责边界基本得到尊重。但系统正在积累几类可预见的演化病症：**源层污染**、**并行版本 drift 无毕业机制**、**stale docs 镜像残留**、**Stage-0 preload 块体膨胀**、**外部生态引用残留**。这些不是设计方向问题，是演化过程中的卫生问题，需要及时清理。

---

## 明确问题列表

### P0：污染与腐蚀类（立即修复）

| # | 问题 | 证据文件 | 类型 |
|---|------|----------|------|
| P0-1 | `__pycache__/*.pyc` 被 git 追踪（6 个二进制文件） | `skills/feature-video/scripts/__pycache__/capture-demo.cpython-311.pyc`；`skills/gemini-imagegen/scripts/__pycache__/*.pyc` × 5 | 源层污染 |
| P0-2 | `.gitignore` 无 `__pycache__/` 或 `*.pyc` 规则 | `.gitignore` 全文无 Python 相关忽略规则 | 卫生缺陷 |
| P0-3 | `docs/10-prompt/skills/setup/` 是已退休 skill 的死镜像 | `skills/setup/SKILL.md` 已在 git 中标记为 `D`（已删除）；但 `docs/10-prompt/skills/setup/` 仍存在（含 `SKILL.md`、`references/`、`config-template.yaml`） | stale 镜像残留 |
| P0-4 | `deploy-docs/SKILL.md` 引用不存在的文件 | 第 21 行：`cat .claude-plugin/marketplace.json`；`.claude-plugin/` 中只有 `plugin.json`，无 `marketplace.json` | 死引用 |

### P1：行为 Drift 类（高优先级）

| # | 问题 | 证据文件 | 类型 |
|---|------|----------|------|
| P1-1 | `spec-work` 稳定版缺失 `Frontend Design Guidance` 步骤 | `spec-work-beta/SKILL.md:403-411` 有"Frontend Design Guidance"步骤（step 7）；`spec-work/SKILL.md` 全文无此步骤 | 功能 drift |
| P1-2 | `spec-work-contracts.test.js` 不测试 frontend-design 引用 | 合约测试未覆盖该步骤，drift 无法被自动检测 | 测试覆盖缺口 |
| P1-3 | `lfg/SKILL.md` 含外部生态 `ralph-loop` 悬挂引用 | `lfg/SKILL.md:10`：`/ralph-loop:ralph-loop`；此 skill 不存在于本 repo | 外部残留 |

### P2：治理与可维护性类（中优先级）

| # | 问题 | 证据文件 | 类型 |
|---|------|----------|------|
| P2-1 | `spec-work-beta` 无毕业标准，长期处于 beta 漂移状态 | `spec-work-beta/SKILL.md` 无毕业条件定义；features 堆积在 beta 而不回传 stable | 演化缺乏闭环 |
| P2-2 | Stage-0 preload 块在多个 workflow 中完全复制 | `spec-work`、`spec-work-beta`、`spec-code-review` 均有 ~60–80 行几乎一致的 Stage-0 预载块 | 多真相源风险 |
| P2-3 | `using-spec-first` 路由表未收录 `spec-compound-refresh` | `using-spec-first/SKILL.md` 路由树第 6 条只提 `compound`，不提 `compound-refresh`；用户只能从 `compound` Phase 2.5 发现它 | 可发现性缺陷 |
| P2-4 | `deploy-docs-contracts.test.js` 不测试 marketplace.json 引用有效性 | 测试文件未覆盖 Step 1 脚本内容 | 测试覆盖缺口 |
| P2-5 | `lfg-contracts.test.js` 不测试 ralph-loop 引用不存在 | 测试未对外部 skill 引用做存在性守护 | 测试覆盖缺口 |

### P3：信息质量类（低优先级，可排期）

| # | 问题 | 证据文件 | 备注 |
|---|------|----------|------|
| P3-1 | `spec-compound` vs `spec-compound-refresh` 命名语义不够直观 | 两 SKILL.md 边界明确但名称对外易混淆 | 可接受，改名成本高 |
| P3-2 | `spec-brainstorm/SKILL.md` 中有 hardcoded 年份（`2026`） | `spec-brainstorm/SKILL.md:9`：`The current year is 2026.` | 需按年更新，或改为动态注入 |
| P3-3 | `spec-optimize/README.md` 是 skill 内部唯一的额外 README，无标准化对应 | `spec-optimize/` 有 `README.md` + `SKILL.md`，其他 skills 无此双文件模式 | 不严重，但偏离规范 |

---

## 点线面分析

### 点（单节点深审）

#### `skills/feature-video/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 内容完整，两路径（Native Video / Tiered）边界清晰 | 无 |
| `references/tier-browser-reel.md` | ✅ 已对齐 `spec-mcp-setup` 入口 | 无 |
| `references/tier-static-screenshots.md` | ✅ | 无 |
| `scripts/capture-demo.py` | ✅ 内容正确 | 无 |
| `scripts/__pycache__/` | ❌ **`.pyc` 文件被 git 追踪** | P0-1 |

#### `skills/gemini-imagegen/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ | 无 |
| `scripts/*.py` × 5 | ✅ | 无 |
| `scripts/__pycache__/` × 5 | ❌ **5 个 `.pyc` 文件被 git 追踪** | P0-1 |
| `requirements.txt` | ✅ | 无 |

#### `skills/spec-work/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md`（475 行） | ⚠️ 缺失 Frontend Design Guidance 步骤 | P1-1 |
| `references/shipping-workflow.md` | ✅ spec-code-review 引用、badge 对齐、无 ce-demo-reel | 无 |

#### `skills/spec-work-beta/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md`（509 行） | ✅ 有 Frontend Design Guidance、delegation 逻辑 | 无功能问题，但无毕业标准 |
| `references/shipping-workflow.md` | ✅ | 无 |
| `references/codex-delegation-workflow.md` | ✅ | 无 |
| 无 `Run Artifact Contract` 专属测试 | ⚠️ | 未在 beta contracts 中单独测试该 section |

#### `skills/spec-compound/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 完整，dual-view 文档哲学清晰，subagent 职责边界正确 | 无 |
| `references/schema.yaml` | ✅ | 无 |
| `references/yaml-schema.md` | ✅ | 无 |
| `assets/resolution-template.md` | ✅ | 无 |

#### `skills/spec-compound-refresh/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 清晰区分 Keep/Update/Consolidate/Replace/Delete 五动作，autofix 模式合理 | 无 |
| `references/schema.yaml` | ✅ | 无 |
| `references/yaml-schema.md` | ✅ | 无 |
| `assets/resolution-template.md` | ✅ | 无 |

#### `skills/spec-mcp-setup/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ mcp-tools.json 作为单一机器真源，清晰 | 无 |
| `mcp-tools.json` | ✅ | 无 |
| `references/supported-mcp-tools.md` | ✅ | 无 |
| `scripts/` × 22 | ✅ 脚本面正确承担确定性工作 | 无 |

#### `skills/spec-graph-bootstrap/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ Surface Map 边界清晰，machine-first contract 引用正确 | 无 |
| `references/artifact-schemas.md` | ✅ | 无 |
| `references/database-worker.md` | ✅ | 无 |
| `references/phase1-crg-extraction.md` | ✅ | 无 |
| `references/phase1-degraded-extraction.md` | ✅ | 无 |
| `references/confidence-rules.md` | ✅ | 无 |

#### `skills/using-spec-first/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 路由树清晰、Hard Rules 完整、宿主入口符合规范 | 缺 `spec-compound-refresh` 路由 |

#### `skills/lfg/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ⚠️ 流程清晰，但含 `ralph-loop` 外部悬挂引用 | P1-3 |

#### `skills/deploy-docs/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ❌ `marketplace.json` 引用不存在 | P0-4 |

#### `skills/agent-native-audit/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 8 原则并行 subagent 结构清晰 | 无 script 面（完全 LLM 执行），合理 |

#### `skills/spec-debug/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 因果链调查模型清晰，阶段划分合理 | 无 |
| `references/anti-patterns.md` | ✅ | 无 |
| `references/investigation-techniques.md` | ✅ | 无 |

#### `skills/spec-optimize/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 优化规范完整，parallel experiment 结构合理 | 无 |
| `references/*.yaml` × 3 | ✅ | 无 |
| `scripts/` × 3 | ✅ 脚本正确承担确定性工作 | 无 |
| `README.md` | 无对应规范，其他 skills 无此文件 | P3-3 |

#### `skills/spec-sessions/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 简洁，session-historian dispatch 清晰 | 无 |

#### `skills/spec-update/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ pre-resolved context 模式正确，确定性信息由脚本提供 | 无 |

#### `skills/spec-code-review/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ Stage-0 preload 与 spec-work 模式一致 | Stage-0 块复制问题（P2-2） |
| `references/` × 6 | ✅ | 无 |

#### `skills/spec-brainstorm/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ⚠️ 第 9 行 hardcoded `2026` 年份 | P3-2 |
| `references/` × 5 | ✅ | 无 |

#### `skills/orchestrating-swarms/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ Claude Code 宿主专属，边界明确（host_exclusive），引导回 spec-work 的条件清晰 | 无 |

#### `skills/changelog/`

| 资产 | 状态 | 问题 |
|------|------|------|
| `SKILL.md` | ✅ 简洁，生成 changelog 的职责边界清晰 | 无 |

#### 其余 standalone utility skills

`agent-browser`、`andrew-kane-gem-writer`、`claude-permissions-optimizer`、`spec-doc-review`、`dspy-ruby`、`every-style-editor`、`frontend-design`、`git-*` × 4、`onboarding`、`proof`、`rclone`、`report-bug`、`reproduce-bug`、`resolve-pr-feedback`、`test-browser`、`test-xcode`、`todo-create/resolve/triage` 均：
- `SKILL.md` 完整
- `references/` 资产（如有）内容对齐
- `scripts/` 承担确定性工作
- 对应 contract test 存在
- 无明显 drift 或矛盾

---

### 线（跨 skill 流程推演）

#### 流程：`lfg` → `spec-plan` → `spec-work` → `spec-code-review`

- `lfg` 第 2 步：`spec-plan $ARGUMENTS` — 正确
- `lfg` 第 3 步：`spec-work <plan-path>` — **问题**：`spec-work` 稳定版无 frontend-design 引导，但 `lfg` 链路指向 `spec-work` 而非 `spec-work-beta`；如果用户做 UI 任务走 lfg 链路，将不会获得 frontend-design 提示
- `lfg` 第 4 步：`spec-code-review mode:autofix plan:<path>` — 正确
- `lfg` 第 1 步：ralph-loop 悬挂引用，不存在本 repo，静默降级

#### 流程：`spec-compound` → `spec-compound-refresh`

- `spec-compound` Phase 2.5 有明确的条件性调用 `spec-compound-refresh`（有范围限制）— 正确
- 两者边界清晰：compound=创建，refresh=维护
- `using-spec-first` 路由树只有 compound 的路由（第 6 条），compound-refresh 不可通过 router 直接路由
- **结论**：这是一个可接受的次级入口模式，但如果用户想直接执行 refresh，需要知道 compound-refresh 的存在

#### 流程：Stage-0 预载 → workflow 执行

- `spec-work`、`spec-work-beta`、`spec-code-review` 的 Stage-0 preload 块结构相同，内容几乎逐字相同
- 每块约 60-80 行，包含复杂的 `verification_summary` 字段解释
- 当 Stage-0 contract 变更时，必须同步修改 3+ 个文件的相同段落
- **演化风险**：已经出现一次 spec-work-beta 的 `# Run Artifact Contract` 没有被 spec-work-beta contracts 单独测试的情况

---

### 面（全局系统健康）

#### 哲学对齐度

| 原则 | 执行情况 |
|------|---------|
| 脚本执行确定性流程 | ✅ `spec-mcp-setup/scripts/` 做检测/安装/验证；`spec-update` 做版本检查；`spec-compound` subagents 不写文件只返回数据 |
| LLM 执行语义决策 | ✅ 路由、文档分类、调查推理全部由 LLM 完成 |
| 反对状态机/强编排 | ✅ verification gate、Stage-0 preload 明确标记为"输入"而非"编排指令" |
| 单一真相源 | ⚠️ Stage-0 preload 块多次复制是潜在双真相源风险 |
| 轻 contract | ✅ YAML schema、JSON contract 文件结构轻量 |
| 可维护优先 | ⚠️ spec-work-beta 无毕业机制导致并行维护负担 |

#### 治理体系健康度

| 维度 | 评分 | 说明 |
|------|------|------|
| plugin.json 与 skills-governance.json 一致性 | ✅ 完全对齐 | 所有 skill 在两个文件中均有对应条目 |
| 宿主入口规范 | ✅ Claude `spec-*`，Codex `spec-*`，standalone skill 均正确 | dual-host-governance-contracts 测试覆盖 |
| contract test 覆盖率 | ⚠️ 每个 skill 都有专属 test，但个别 test 对具体内容覆盖不足 | P1-2、P2-4、P2-5 |
| 源码 vs 生成产物边界 | ✅ skills/ 是真源，`.claude/` 等是生成产物 | 指南明确 |
| docs 镜像同步 | ❌ `docs/10-prompt/skills/setup/` 是已退休 skill 的死镜像 | P0-3 |

---

## 演化优先级建议

### 立即清理（本 PR 或下一次提交）

1. **删除 `__pycache__` tracked files 并加 `.gitignore` 规则**
   ```
   # .gitignore 新增
   __pycache__/
   *.pyc
   *.pyo
   ```
   然后：`git rm -r --cached skills/feature-video/scripts/__pycache__/ skills/gemini-imagegen/scripts/__pycache__/`

2. **删除 `docs/10-prompt/skills/setup/` 整个目录**（已退休 skill 的 stale 镜像）

3. **修复 `deploy-docs/SKILL.md` 的 `marketplace.json` 引用**：改为 `plugin.json`

### 短期（本迭代周期内）

4. **将 `spec-work-beta` 的 Frontend Design Guidance 步骤回传到 `spec-work`**，并在 `spec-work-contracts.test.js` 加对应 assertion

5. **清理 `lfg/SKILL.md` 中的 `ralph-loop` 外部引用**：该行应直接删除，而非保留条件降级

6. **在 `using-spec-first/SKILL.md` 第 6 条路由中补充 `spec-compound-refresh` 作为直接入口**

7. **明确 `spec-work-beta` 的毕业标准**：在 SKILL.md 或治理文档中写明"何时将 beta 功能回传 stable、何时废弃 beta"

### 中期（有意识规划）

8. **Stage-0 preload 块去重机制**：考虑在 `spec-first init` 阶段注入 Stage-0 preload 块，而不是让每个 SKILL.md 自带复制版本；或至少建立一个 canonical preload template 供所有 workflow 引用而非复制

9. **`spec-brainstorm` 年份动态化**：`2026` hardcoded 需要每年手动更新，考虑改为 `!date +%Y` 动态注入

10. **`spec-work-beta` contracts 补 `Run Artifact Contract` assertion**

---

## 整改路线图

```
优先级 P0（本周）
├─ 清理 __pycache__ tracked files
├─ 加 .gitignore Python 规则
├─ 删除 docs/10-prompt/skills/setup/ 死镜像
└─ 修复 deploy-docs marketplace.json 死引用

优先级 P1（本迭代）
├─ spec-work 补 Frontend Design Guidance 步骤
├─ spec-work-contracts.test.js 补对应 assertion
├─ lfg 删除 ralph-loop 外部引用
├─ lfg-contracts.test.js 加 not.toContain('ralph-loop') assertion
└─ using-spec-first 路由表补 compound-refresh

优先级 P2（下次迭代）
├─ spec-work-beta 毕业标准文档化
├─ deploy-docs-contracts.test.js 覆盖 step 1 脚本内容
└─ spec-work-beta contracts 补 Run Artifact Contract

规划中（有 ROI 再做）
├─ Stage-0 preload 块去重
└─ spec-brainstorm 年份动态化
```

---

## 逐 skill 内部资产覆盖结果

| Skill | SKILL.md | references/ | assets/ | scripts/ | Contract test | 状态 |
|-------|----------|------------|---------|----------|---------------|------|
| agent-browser | ✅ | ✅ × 7 | - | ✅ × 3 | ✅ | 正常 |
| agent-native-architecture | ✅ | ✅ × 13 | - | - | ✅ | 正常 |
| agent-native-audit | ✅ `disable-model-invocation` | - | - | - | ✅ | 正常 |
| andrew-kane-gem-writer | ✅ | ✅ × 5 | - | - | ✅ | 正常 |
| changelog | ✅ `disable-model-invocation` | - | - | - | ✅ | 正常 |
| claude-permissions-optimizer | ✅ | - | - | ✅ × 2 | ✅ | 正常 |
| deploy-docs | ✅ `disable-model-invocation` | - | - | - | ✅ | **P0-4: marketplace.json 死引用** |
| spec-doc-review | ✅ | ✅ × 4 | - | - | ✅ | 正常 |
| dspy-ruby | ✅ | ✅ × 5 | ✅ × 3 | - | ✅ | 正常 |
| every-style-editor | ✅ | ✅ × 1 | - | - | ✅ | 正常 |
| feature-video | ✅ | ✅ × 5 | - | ✅ + ❌__pycache__ | ✅ | **P0-1: .pyc 追踪** |
| frontend-design | ✅ | - | - | - | ✅ | 正常 |
| gemini-imagegen | ✅ | - | - | ✅ + ❌__pycache__×5 | ✅ | **P0-1: .pyc 追踪** |
| git-clean-gone-branches | ✅ | - | - | ✅ | ✅ | 正常 |
| git-commit | ✅ | - | - | - | ✅ | 正常 |
| git-commit-push-pr | ✅ | - | - | - | ✅ | 正常 |
| git-worktree | ✅ | - | - | ✅ | ✅ | 正常 |
| lfg | ✅ `disable-model-invocation` | - | - | - | ✅（不覆盖 ralph-loop） | **P1-3: ralph-loop 外部引用** |
| onboarding | ✅ | - | - | ✅ | ✅ | 正常 |
| orchestrating-swarms | ✅ `disable-model-invocation`，host_exclusive | - | - | - | ✅ | 正常 |
| proof | ✅ | - | - | - | 无专属 test | 可接受（standalone utility） |
| rclone | ✅ | - | - | ✅ | ✅ | 正常 |
| report-bug | ✅ | - | - | - | ✅ | 正常 |
| reproduce-bug | ✅ | - | - | - | ✅ | 正常 |
| resolve-pr-feedback | ✅ | - | - | ✅ × 4 | ✅ | 正常 |
| spec-brainstorm | ✅（hardcoded 年份） | ✅ × 5 | - | - | ✅ | **P3-2: 年份 hardcoded** |
| spec-compound | ✅ | ✅ × 2 | ✅ × 1 | - | ✅ | 正常 |
| spec-compound-refresh | ✅ | ✅ × 2 | ✅ × 1 | - | ✅（包含在 compound contracts） | 正常 |
| spec-debug | ✅ | ✅ × 2 | - | - | ✅ | 正常 |
| spec-graph-bootstrap | ✅ | ✅ × 5 | - | - | ✅ | 正常 |
| spec-ideate | ✅ | ✅ × 1 | - | - | ✅ | 正常 |
| spec-mcp-setup | ✅ | ✅ × 2 | - | ✅ × 22 | ✅ | 正常 |
| spec-optimize | ✅ | ✅ × 6 | - | ✅ × 3 | ✅ | **P3-3: 额外 README.md 不规范** |
| spec-plan | ✅ | ✅ × 4 | - | - | ✅ | 正常 |
| spec-code-review | ✅ | ✅ × 6 | - | - | ✅ | Stage-0 复制（P2-2） |
| spec-sessions | ✅ | - | - | - | ✅ | 正常 |
| spec-slack-research | ✅ | - | - | - | ✅ | 正常 |
| spec-update | ✅ `disable-model-invocation` | - | - | - | ✅ | 正常 |
| spec-work | ✅（缺 frontend-design） | ✅ × 1 | - | - | ✅（不覆盖 frontend-design） | **P1-1: drift** |
| spec-work-beta | ✅ | ✅ × 2 | - | - | ✅ | 无毕业标准（P2-1） |
| test-browser | ✅ | - | - | - | ✅ | 正常 |
| test-xcode | ✅ | - | - | - | ✅ | 正常 |
| todo-create | ✅ | - | ✅ × 1 | - | ✅ | 正常 |
| todo-resolve | ✅ | - | - | - | ✅ | 正常 |
| todo-triage | ✅ | - | - | - | ✅ | 正常 |
| using-spec-first | ✅ | - | - | - | ✅ | 缺 compound-refresh 路由（P2-3） |

---

## 附：证据链索引

| 问题 | 代码位置 |
|------|---------|
| P0-1 `__pycache__` tracked | `git ls-files skills/*/scripts/__pycache__/` → 6 条输出 |
| P0-2 `.gitignore` 缺 Python 规则 | `.gitignore` 全文搜索无 `__pycache__`、`*.pyc` |
| P0-3 setup 死镜像 | `git status` 显示 `D skills/setup/SKILL.md`；`ls docs/10-prompt/skills/setup/` → `SKILL.md references config-template.yaml` |
| P0-4 marketplace.json 死引用 | `deploy-docs/SKILL.md:21`；`ls .claude-plugin/` → 只有 `plugin.json` |
| P1-1 spec-work 缺 frontend-design | `grep frontend-design skills/spec-work/SKILL.md` → 无输出；`grep frontend-design skills/spec-work-beta/SKILL.md:403` → 有 |
| P1-2 contracts 未覆盖 | `spec-work-contracts.test.js` 全文无 `frontend-design` 或 `frontend_design` |
| P1-3 ralph-loop | `lfg/SKILL.md:10,32` |
| P2-1 无毕业标准 | `spec-work-beta/SKILL.md` 全文无毕业条件 |
| P2-2 Stage-0 复制 | `spec-work/SKILL.md:26-62`、`spec-work-beta/SKILL.md:26-66`、`spec-code-review/SKILL.md:48` |
| P2-3 compound-refresh 不可路由 | `using-spec-first/SKILL.md` 第 6 条路由只有 `compound`，无 `compound-refresh` |
| P3-2 年份 hardcoded | `spec-brainstorm/SKILL.md:9` |
