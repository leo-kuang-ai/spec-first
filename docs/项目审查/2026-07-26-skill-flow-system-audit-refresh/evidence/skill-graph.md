---
title: Skill Graph 增量校准（节点盘点与 declared edge delta）
doc_role: audit-evidence
review_date: 2026-07-26
status: review-evidence-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/README.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# Skill Graph 增量校准

本批次是对 2026-07-18 刷新批次的增量审查。覆盖分母在 Pass 1 开始时冻结为：

1. **节点分母**：current governed roster 35/35（全量复核）。
2. **Edge 增量分母**：`27baf79f..d939ee3c` delta 中全部 source 文件（30 个 skills/contracts/CLI 文件 + 3 个新 CI workflow + 5 个删除的 runtime mirror）里能定位到 source ref 的 declared route/handoff/consumer/authority 声明。
3. **非 delta 的 165 条冻结 canonical pair 沿用 07-18 账本，不重扫**；这是本轮的 coverage limitation，见 `validation.md`。

## 节点盘点（100% roster）

从 `src/cli/contracts/dual-host-governance/skills-governance.json` 机器读取（本 delta 对 `src/cli/contracts/` 零改动）：

| 类别 | 数量 | 与 07-18 对比 |
| --- | --- | --- |
| workflow_command | 17 | 不变 |
| standalone_skill | 13 | 不变 |
| internal_only | 5（spec-commit、spec-commit-push-pr、spec-proof、spec-test-browser、spec-worktree） | 不变 |
| **合计** | **35** | **无节点增删** |

`skills-governance.json` 仍是 internal delivery 的唯一真源：delta 反而删除了 `src/cli/plugin-governance.js` 中的 `DELIVERED_INTERNAL_SKILLS` 硬编码常量（第二事实源），internal delivery 现仅从 governance JSON 派生，`tests/unit/plugin-modules.test.js` 逐平台断言等价性并断言源码不再含该常量。新增 `tests/unit/skill-flow-audit-provenance-contracts.test.js` 把「唯一真源」口径锚进上一批审查证据文档（仅锁 07-18 目录，不约束本批次）。

**节点暴露面变化（非节点增删）：**

- **source-command 退役**：删除 5 个 `.agents/skills/source-command-spec-*/SKILL.md` legacy runtime mirror（宿主侧 command→skill 迁移产物，非 spec-first generator 输出）。全仓 grep 确认 `skills/`、`templates/`、`AGENTS.md`、`CLAUDE.md` 零残留调用/路由引用，无孤儿 edge；残留命中均为 gitignore/untrack 防护性覆盖（`src/cli/gitignore-policy.js:34`、对应测试与 boundary doc 清单）。
- **Cursor internal 投射收紧**：`src/cli/adapters/cursor.js:300` 使 5 个 internal skill 在 `.cursor/skills/*/SKILL.md` 投射均带 `disable-model-invocation: true`，internal helper 从 Cursor 描述匹配自动触发面移除；caller edge 不受影响（cursor rewriteSharedPaths 将跨宿主 skill 引用改写为文件路径读取消费）。
- **Workflow Contract Summary 标准化**：`using-spec-first`、`spec-brainstorm`、`spec-ideate`、`spec-plan`、`spec-doc-review`、`spec-code-review`、`spec-debug`、`spec-compound`、`spec-compound-refresh` 补齐统一的「输入/输出/硬出口/权威/消费者」头部块（`spec-write-skill` 仅标题改名）。该批块闭合了 release-governance 此前报告的 10 个 public workflow contract summary 缺口，把此前 inferred 级的 consumer 关系升级为 declared。

## Declared edge / pair delta（27baf79f → d939ee3c）

### 新增 declared edge（material）

| edge | 类型 | source refs | 说明 |
| --- | --- | --- | --- |
| `spec-work → spec-lfg`：`verified_worktree_fingerprint` 返回字段 | handoff | skills/spec-work/SKILL.md:258,270-272 | Return-to-Caller 合同新增完整 `spec-work-working-tree-fingerprint/v1` 对象；behavior-bearing `status: complete` 硬性要求；幂等重入从 should 收紧为 must |
| `spec-lfg → spec-work`：step 6.5 幂等 final-verification 二次调用 | handoff + failure | skills/spec-lfg/SKILL.md:112-145 | 新 gate：pre-capture 指纹、同 plan 重入、新 run summary ref、指纹三方相等；任何 mismatch/helper failure = `final-verification-stale` 硬停 |
| `spec-lfg → working-tree-fingerprint.cjs` helper | consumer | skills/spec-lfg/SKILL.md:116,138 | LFG 自跑 helper 两次；引用形态为 source-checkout 路径（见 SF-28） |
| `spec-plan → spec-doc-review`：`mutation:apply-fixes` 显式授权 token | authority | skills/spec-plan/SKILL.md:22,811,823,839,843；references/plan-handoff.md:7-10,31,85,98 | producer 显式供给 mutation authority，替代 reviewer 按格式自决 |
| Contract Summary 消费者声明（如 `spec-compound → spec-plan/spec-work/spec-debug/spec-code-review`、`spec-debug → spec-work/spec-code-review`、`spec-doc-review → spec-brainstorm/spec-plan/spec-write-tasks/spec-work`） | consumer | 各 SKILL.md 头部块 | 既有关系的 declared 化（provenance 升级），非新关系 |

### 删除 / 收窄的 declared 语义

| 变化 | 类型 | source refs | 说明 |
| --- | --- | --- | --- |
| `spec-doc-review` 普通可写 Markdown 默认 `markdown-write` → `default-review-report-only` | authority 收窄 | skills/spec-doc-review/SKILL.md:36-42,63-72 | 普通 review 不再从文件格式/可写性获得写权；只有显式 `mutation:apply-fixes` 才解析 `markdown-write`（`caller-requested-apply-fixes`）；task-pack/HTML/write-unavailable/format-conflict 的 mandatory report-only 优先级保持 |
| `spec-brainstorm` handoff 选项 3（Pressure-test）Markdown 可自动 apply → 两种格式均 report-only | authority 收窄 | skills/spec-brainstorm/references/handoff.md:58,85-91 | requirements 编辑权归 `spec-brainstorm` 或后续显式 `mutation:apply-fixes` 请求 |
| `DELIVERED_INTERNAL_SKILLS` 硬编码删除 | 第二事实源删除 | src/cli/plugin-governance.js（-9） | internal delivery 单一 owner 收口 |
| `spec-code-review` deployment-verification 激活双 gate 收紧 | authority 收窄 | skills/spec-code-review/SKILL.md:537,698 | Stage 3 需 migration-artifact 与 risky-change 双通过且 reason 点名 artifact+risky operation；Stage 4 只消费 Stage 3 选择；safe additive migration 不授权派发；新增 activation eval + 契约测试 |
| `spec-compound-refresh` headless 自动 branch/commit/PR → 三元 authority facts + `commit_authorization_missing` 默认路径 | authority 收窄 | skills/spec-compound-refresh/SKILL.md:28-39,605-645 | knowledge maintenance 回路对齐全局 mutation/commit/landing 分离授权模型 |

### 非 edge 变化（mechanical / readiness）

- 3 个新 CI workflow 把既有确定性校验升级为 PR 强制 gate：`skill-entrypoint-gate`（lint:skill-entrypoints + eval-fixtures + release governance）、`ai-dev-quality-gate`、`npm-install-matrix`（新增安装可用性 verification producer，3 OS × Node 20/22/24）。producer 侧稳定性由 `tests/unit/ci-required-producers.test.js` 锁定。不改变任何 skill 间 route/handoff/authority。
- `scripts/run-test-suite.cjs` 集成测试从硬编码 7 文件改为动态发现，修补 4 个此前从不被 `npm test` 执行的 integration 测试的静默覆盖缺口。
- `spec-runtime-setup` workspace-async-refresh lock v1→v2 租约协议（failure-path 加固，12 个单测覆盖）、child-hook shell quoting 修复、git-path canonicalization symlink 加固。服务 runtime-setup → downstream readiness edge 的失败路径，不改变 edge 语义。
- riffrec/sweep 分析器同步演进后仍 byte-identical（本轮 `diff -q` 复核，SF-22 parity 保持）。

## 与 07-18 冻结账本的关系

07-18 批次的 165 条 canonical pair 冻结 manifest 与逐行 provenance 不在本轮重算；本轮只登记上述 delta 声明。未落在 delta 中的关系沿用 07-18 裁决，其 provenance 状态不因本轮改变。
