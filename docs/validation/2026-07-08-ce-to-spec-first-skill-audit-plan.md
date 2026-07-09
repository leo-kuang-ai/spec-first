# CE 到 Spec-First Skill 迁移审查方案

## 结论

本审查将逐个检查 `/Users/kuang/xiaobu/compound-engineering-plugin/docs/skills/ce-to-spec-first-skill-map.md` 中列出的 CE skill，并与当前 spec-first source skill 目标对照。

CE 是迁移能力的语义基准：

- CE source：`/Users/kuang/xiaobu/compound-engineering-plugin/skills`
- spec-first target source：`/Users/kuang/xiaobu/spec-first/skills`

审查不要求逐字一致。判断标准是：每个 CE 能力是否在 spec-first 中被保留、被有意识地 spec-first 化改造，或被意外丢失。

## 目标

- 审查 29 个 CE source skill 及其 spec-first 映射目标。
- 识别迁移行为中缺失、漂移，或仍以过时 CE/plugin contract 表达的部分。
- 区分意外漂移与有意识的 spec-first divergence。
- 产出按优先级排序的 source skill 优化 backlog。
- 维护 source/runtime 边界：source 变更属于 `skills/`、`templates/`、`src/cli/`、`docs/`、tests 和相关 source contracts；generated runtime mirrors 不手工编辑。

## 非目标

- 不把 `.agents/skills/`、`.claude/`、`.codex/`、`.cursor/`、`.kiro/` 或 `.qoder/` 当作 source truth。
- CE 能力、阶段、产物和 helper 语义作为迁移基准；但不机械恢复 `ce-*`、`.compound-engineering` 或 `ce-unified-plan/v1` 等 CE 命名和路径。
- 不把 `spec-prd`、`spec-write-tasks`、`using-spec-first` 等 spec-first-only workflow 拆分折回 CE 时代行为。
- 审查报告阶段不做大范围 runtime regeneration。source 修复后如需 runtime refresh，应作为单独显式步骤处理。

## Skill 映射

以当前迁移映射作为工作清单：

| CE skill | spec-first target | skill 功能说明 | 审查类型 | 处理状态 | 是否完成审查 |
|---|---|---|---|---|---|
| `ce-commit` | `spec-commit` | 生成并执行受控提交，维护 commit message 与验证摘要 | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-commit-push-pr` | `spec-commit-push-pr` | 提交、推送并创建或更新 PR 的交付 helper | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-compound` | `spec-compound` | 将已验证的问题解决经验沉淀为可复用知识 | 直接映射，knowledge/source evidence 关键 | 已完成 | 已审查 |
| `ce-compound-refresh` | `spec-compound-refresh` | 刷新、合并或淘汰过期的 durable knowledge | 直接映射，learning lifecycle 关键 | 已完成 | 已审查 |
| `ce-dogfood` | `spec-dogfood` | 对当前分支执行 hands-off 浏览器用户流 QA | 直接映射，browser QA artifact contract 关键 | 已完成 | 已审查 |
| `ce-explain` | `spec-explain` | 将概念、diff 或近期工作整理成面向用户的解释材料 | 直接映射，低/中复杂度 | 已完成 | 已审查 |
| `ce-optimize` | `spec-optimize` | 围绕可测指标运行迭代优化循环 | 直接映射，metric/eval loop 关键 | 已完成 | 已审查 |
| `ce-polish` | `spec-polish` | 启动应用、浏览器检查并迭代 UI / UX polish | 直接映射，browser/dev-server 行为关键 | 已完成 | 已审查 |
| `ce-pov` | `spec-pov` | 基于项目上下文对外部输入给出明确 verdict | 直接映射，verdict routing 关键 | 已完成 | 已审查 |
| `ce-product-pulse` | `spec-product-pulse` | 从配置的信号源生成产品脉搏报告 | 直接映射，signal/config 行为关键 | 已完成 | 已审查 |
| `ce-promote` | `spec-promote` | 为已交付功能起草发布或推广文案 | 直接映射，低复杂度 | 已完成 | 已审查 |
| `ce-proof` | `spec-proof` | 人工证明 / HITL 证据收集与验证辅助 | 直接映射，host-provided/HITL surface 关键 | 已完成 | 已审查 |
| `ce-resolve-pr-feedback` | `spec-resolve-pr-feedback` | 处理 PR review feedback 并维护变更边界 | 直接映射，PR feedback mutation 边界关键 | 已完成 | 已审查 |
| `ce-riffrec-feedback-analysis` | `spec-riffrec-feedback-analysis` | 分析 Riffrec 反馈录制包、会话和事件 | 直接映射，media bundle 处理关键 | 已完成 | 已审查 |
| `ce-setup` | `spec-mcp-setup` | 诊断并修复 spec-first 运行时、MCP 与 helper readiness | 近似映射，必须记录 divergence | 已完成 | 已审查 |
| `ce-simplify-code` | `spec-simplify-code` | 在保持行为不变的前提下简化近期改动代码 | 直接映射，behavior-preserving 边界关键 | 已完成 | 已审查 |
| `ce-strategy` | `spec-strategy` | 创建或更新项目战略文档与方向判断 | 直接映射，product grounding 关键 | 已完成 | 已审查 |
| `ce-sweep` | `spec-sweep` | 扫描反馈源并生成 acknowledge / analysis / recommendation | 直接映射，feedback-source workflow 关键 | 已完成 | 已审查 |
| `ce-test-browser` | `spec-test-browser` | 浏览器测试 helper，辅助页面交互验证 | 直接映射，browser helper 边界关键 | 已完成 | 已审查 |
| `ce-test-xcode` | `spec-test-xcode` | XcodeBuildMCP 预检与 iOS / Xcode 验证辅助 | 直接映射，XcodeBuildMCP dependency 关键 | 已完成 | 已审查 |
| `ce-worktree` | `spec-worktree` | 内部 worktree helper，支持隔离并行工程任务 | 直接映射，internal-helper 暴露边界关键 | 已完成 | 已审查 |
| `lfg` | `spec-lfg` | 从计划到绿色 PR 的完整 hands-off 工程流水线 | 直接映射，full pipeline 关键 | 已完成 | 已审查 |
| `ce-brainstorm` | `spec-brainstorm` | 需求发现与 WHAT 澄清，产出可交给 PRD/plan 的需求材料 | 直接映射，unified-plan artifact contract 关键 | 已完成 | 已审查 |
| `ce-code-review` | `spec-code-review` | 审查代码 diff / PR，识别缺陷、风险、回归和测试缺口 | 直接映射，persona/local asset 迁移关键 | 已完成 | 已审查 |
| `ce-debug` | `spec-debug` | 系统化复现、定位根因并修复 bug | 直接映射，root-cause/evidence flow 关键 |  |  |
| `ce-doc-review` | `spec-doc-review` | 审查需求、计划、任务包或 Markdown planning artifact | 直接映射，过时 contract 风险最高 |  |  |
| `ce-ideate` | `spec-ideate` | 生成并评估项目上下文内的改进想法 | 直接映射，与 brainstorm 的边界关键 | 已完成 | 已审查 |
| `ce-plan` | `spec-plan` | 将明确目标或 PRD 转成可执行工程计划 | 直接映射，下游 contract 关键 |  |  |
| `ce-work` | `spec-work` | 执行既定 plan / task pack / concrete implementation request | 直接映射，execution gate 关键 |  |  |

spec-first-only skills 不做 CE 直接等价审查，但可用于解释合理 divergence：

- `spec-app-consistency-audit`
- `spec-prd`
- `spec-rule-miner`
- `spec-skill-audit`
- `spec-write-skill`
- `spec-write-tasks`
- `using-spec-first`

## 审查维度

每个映射 skill 按以下维度检查。

| 维度 | 问题 |
|---|---|
| 入口语义 | `description`、argument hint、公开 trigger 是否在 `spec-*` 改名后保留 CE use case？ |
| 路由边界 | near-neighbor exclusions、wrong-entry handling、route-out guidance 是否保留或被有意识收紧？ |
| 执行流程 | phases、handoff rules、fallback modes、one-question discipline、dispatch/degraded behavior 是否保留？ |
| Artifact contract | paths、metadata、schemas、source references、downstream consumers 是否正确转换为 spec-first？ |
| References and scripts | CE `references/`、`references/agents/`、`references/personas/`、`scripts/` 是迁移、替换、合并，还是有意识删除？ |
| 旧 CE 残留 | `ce-*`、`/ce-*`、`.compound-engineering`、`/tmp/compound-engineering`、`ce-unified-plan/v1` 是否仍存在？它们是有效兼容说明还是过时 contract？ |
| spec-first divergence | 目标 skill 是否体现 source/runtime 边界、dual-host governance、advisory provider evidence，以及 deterministic facts 之上的 LLM semantic judgment？ |
| 下游消费者 | 该 skill 是否仍能喂给预期下游 workflow：`spec-plan`、`spec-work`、`spec-doc-review`、`spec-code-review`、`spec-lfg` 或 `docs/solutions/`？ |
| 验证面 | 是否需要新增或更新 focused tests、eval fixtures、source contract checks 或 fresh-source eval 路径？ |

## 确定性事实采集

每个 pair 先采集确定性事实。这些命令只产 evidence，不裁决语义充分性。

```bash
CE_ROOT=/Users/kuang/xiaobu/compound-engineering-plugin/skills
SPEC_ROOT=/Users/kuang/xiaobu/spec-first/skills

find "$CE_ROOT/<ce-skill>" -type f | sort
find "$SPEC_ROOT/<spec-skill>" -type f | sort
diff -qr "$CE_ROOT/<ce-skill>" "$SPEC_ROOT/<spec-skill>"
rg -n "ce-|/ce-|compound-engineering|\\.compound-engineering|ce-unified-plan|/tmp/compound-engineering" "$SPEC_ROOT/<spec-skill>"
```

全量 inventory 可用以下扫描来排序审查优先级：

```bash
for ce in /Users/kuang/xiaobu/compound-engineering-plugin/skills/*; do
  name=$(basename "$ce")
  if [ "$name" = "lfg" ]; then
    spec="spec-lfg"
  elif [ "$name" = "ce-setup" ]; then
    spec="spec-mcp-setup"
  else
    spec="spec-${name#ce-}"
  fi

  specdir="skills/$spec"
  cefiles=$(find "$ce" -type f | wc -l | tr -d ' ')
  if [ -d "$specdir" ]; then
    specfiles=$(find "$specdir" -type f | wc -l | tr -d ' ')
    hits=$(find "$specdir" -type f \( -name '*.md' -o -name '*.js' -o -name '*.py' \) -print0 |
      xargs -0 rg -n "ce-|/ce-|compound-engineering|\\.compound-engineering|ce-unified-plan|/tmp/compound-engineering" 2>/dev/null |
      wc -l | tr -d ' ')
  else
    specfiles="missing"
    hits="missing"
  fi

  printf '%-28s -> %-28s CE:%-3s SPEC:%-3s legacy_hits:%s\n' "$name" "$spec" "$cefiles" "$specfiles" "$hits"
done
```

## 审查输出模板

每个 skill review 使用以下结构：

```markdown
## ce-brainstorm -> spec-brainstorm

### Verdict

- status: aligned | partial | drifted | intentional_divergence
- risk: high | medium | low

### Source Files Read

- CE: ...
- spec-first: ...

### Preserved Capabilities

- ...

### Missing Or Drifted Capabilities

- ...

### Intentional Spec-First Divergences

- ...

### Legacy CE Residuals

- ...

### Recommended Changes

- [fix] ...
- [restore] ...
- [rewrite] ...
- [document_divergence] ...
- [no_action] ...

### Downstream Consumers

- `spec-plan`: ...
- `spec-work`: ...
- `spec-doc-review`: ...

### Verification Needed

- ...
```

## 优先执行顺序

按批次推进：先处理内容差异小、旧 CE 残留少的 skill，快速建立审查样例并收敛低风险 backlog；第二批处理其余 helper 与尾项；第三批处理支撑链路与高残留项；第四批回到核心链路深审。

### Batch 1：低差异快审

这些 skill 在初始 deterministic scan 中表现为文件数接近、归一化文本差异较低或范围小、旧 CE 残留少，适合作为 warm-up 与模板校准：

1. `ce-test-xcode` -> `spec-test-xcode`
2. `ce-polish` -> `spec-polish`
3. `ce-explain` -> `spec-explain`
4. `ce-pov` -> `spec-pov`
5. `ce-dogfood` -> `spec-dogfood`
6. `ce-strategy` -> `spec-strategy`
7. `ce-simplify-code` -> `spec-simplify-code`
8. `ce-commit` -> `spec-commit`

### Batch 2：其余 helper 与尾项

这些 skill 先按轻量矩阵确认，若 deterministic scan 或 source read 发现 active contract 漂移，再提升为单独深审：

1. `ce-commit-push-pr` -> `spec-commit-push-pr`
2. `ce-optimize` -> `spec-optimize`
3. `ce-promote` -> `spec-promote`
4. `ce-proof` -> `spec-proof`
5. `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback`
6. `ce-test-browser` -> `spec-test-browser`
7. `ce-worktree` -> `spec-worktree`

### Batch 3：支撑链路与高残留项

这些 skill 支撑 debug、knowledge、feedback、setup 或有较多 legacy residual，需要集中确认 divergence 与消费者：

1. `ce-debug` -> `spec-debug`
2. `ce-compound` -> `spec-compound`
3. `ce-compound-refresh` -> `spec-compound-refresh`
4. `ce-sweep` -> `spec-sweep`
5. `ce-setup` -> `spec-mcp-setup`
6. `ce-riffrec-feedback-analysis` -> `spec-riffrec-feedback-analysis`
7. `ce-product-pulse` -> `spec-product-pulse`

### Batch 4：核心链路深审

这些 skill 位于 `Spec -> Plan -> Code -> Review` 主链路，artifact contract 或 handoff 漂移会放大到下游：

1. `ce-brainstorm` -> `spec-brainstorm`
2. `ce-plan` -> `spec-plan`
3. `ce-doc-review` -> `spec-doc-review`
4. `ce-code-review` -> `spec-code-review`（已完成）
5. `ce-work` -> `spec-work`
6. `ce-ideate` -> `spec-ideate`（已完成）
7. `lfg` -> `spec-lfg`

## Batch 1 快审记录

### `ce-test-xcode` -> `spec-test-xcode`

#### Verdict

- status: aligned
- risk: low
- decision: 按 CE 原逻辑处理 `XcodeBuildMCP`，不把它升级为 `spec-mcp-setup` 默认或 optional setup 集成项。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-test-xcode/SKILL.md`
- CE docs: `/Users/kuang/xiaobu/compound-engineering-plugin/docs/skills/ce-test-xcode.md`
- spec-first: `skills/spec-test-xcode/SKILL.md`

#### Preserved Capabilities

- 保留 XcodeBuildMCP 作为唯一执行 substrate：先调用 `list_simulators` 确认 MCP 已连接，再执行 project/scheme discovery、simulator boot、build、install、launch、log capture、screenshot、human verification、failure handling 和 cleanup。
- 保留缺失 XcodeBuildMCP 时 fail closed 的行为：不继续 build/test，不回退到裸 `xcodebuild` wrapper。
- 保留 CE 的手工安装提示：Homebrew 路径 `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp`，以及 npx 路径 `npx -y xcodebuildmcp@latest mcp`，随后由用户把 `XcodeBuildMCP` 加入 agent MCP 配置并重启 agent。
- 保留 SwiftUI `Text` inline link 自动点击限制说明和需要人工验证的 flows。

#### Intentional Spec-First Divergences

- skill 名称、示例命令和集成说明已从 `ce-test-xcode` / `ce-code-review` 改为 `spec-test-xcode` / `spec-code-review`。
- blocking question tool 说明收敛到当前 spec-first 公开支持的 Claude/Codex surface；不恢复 CE 中 Antigravity / Pi 的旧平台说明。

#### No Setup Integration Decision

- CE 中 `ce-setup` 不检查或安装 XcodeBuildMCP；XcodeBuildMCP readiness 只由 `ce-test-xcode` 在运行时用 `list_simulators` preflight 判断。
- spec-first 按 CE parity 保持同样边界：`spec-mcp-setup` 不新增 XcodeBuildMCP 默认检查、自动安装、host config 写入或 setup facts。
- 这是有意识的低差异迁移裁决，不是遗漏。Xcode simulator testing 是显式 invoked helper skill；缺 dependency 时由该 skill 自己停止并给手工安装指令。

#### Recommended Changes

- [no_action] `skills/spec-test-xcode/SKILL.md` 当前保留了 CE 的核心行为和安装提示，无需修改。
- [document_divergence] 本快审记录作为后续 Batch 1 的样例：低差异 skill 优先确认 CE 行为是否被保留，再决定是否需要 spec-first 化扩展；不要为了“更完整 setup”而扩大 scope。

#### Downstream Consumers

- `spec-code-review`: 可在 iOS 代码变更场景中建议或委托 `spec-test-xcode`；但是否可运行由 `spec-test-xcode` 的 XcodeBuildMCP preflight 确认。
- `spec-work`: 完成 iOS 相关实现后可把 `spec-test-xcode` 作为人工/工具辅助验证路径；缺 MCP 时记录 not-run reason，而不是声明 simulator 验证已完成。

#### Verification Needed

- docs-only 裁决记录只需要 `git diff --check` 与 changelog 格式检查。
- 若未来修改 `skills/spec-test-xcode/SKILL.md` 或让 `spec-code-review` 自动委托它，再补 focused contract tests；本轮不触发。

### Batch 1 其余低差异快审

以下 pair 按同一原则处理：先确认 CE 行为是否保留，再检查 context / artifact 产物路径是否已迁到 spec-first 命名或被有意识保留。本轮按 CE setup 处理方式同步删除 browser helper env repair gate，相关 browser workflow 文案已改为 `spec-mcp-setup` 诊断输出安装命令、用户手动安装。

| Pair | Verdict | Context / artifact mapping | CE residual decision | Recommended changes |
|---|---|---|---|---|
| `ce-polish` -> `spec-polish` | aligned，risk: low | 无 durable report 产物；source edits、dev-server log、browser notes 仍是 transient / project-local。CE 缺 `agent-browser` 时泛称跑 setup；spec-first 映射为 `spec-mcp-setup` 诊断输出当前平台安装命令，用户手动安装后继续 human browser loop。 | `ce-polish` 名称、skill-dir placeholder 已改为 `spec-polish`；未发现 active CE artifact path 残留；已删除旧 env repair gate 文案。 | [updated] `spec-polish` 缺 browser helper 提示改为运行 `spec-mcp-setup` 查看安装命令，不再要求设置 env。 |
| `ce-explain` -> `spec-explain` | aligned，risk: low | Scratch/run dir 从 `/tmp/compound-engineering/ce-explain/...` 映射到 `/tmp/spec-first/spec-explain/...`；repo-profile cache 从 `/tmp/compound-engineering/repo-profile/...` 映射到 `/tmp/spec-first/repo-profile/...`；Proof identity 从 `ai:compound-engineering` / `Compound Engineering` 映射为 `ai:spec-first` / `Spec-First`；`docs/plans/`、`docs/brainstorms/`、`docs/solutions/` 作为 project docs 输入保留。 | CE downstream routes 已改为 `spec-ideate`、`spec-simplify-code`、`spec-polish`、`spec-pov`、`spec-compound`；本地 `__pycache__` 属 ignored non-source noise，不作为迁移差异。 | [no_action] 当前产物路径已完成 spec-first 化；后续只在修改 explain output contract 时补 focused tests。 |
| `ce-pov` -> `spec-pov` | aligned，risk: low | Scratch dir 从 `/tmp/compound-engineering/ce-pov/...` 映射到 `/tmp/spec-first/spec-pov/...`；repo-profile cache 同步迁到 `/tmp/spec-first/repo-profile/...`；默认 chat verdict 保留，不新增强制 `docs/` 存储；optional full write-up 仍写 temp 或用户指定 `docs/` 路径；durable capture 路由从 `ce-compound` 映射到 `spec-compound`。 | CE route names 已改为 `spec-ideate`、`spec-brainstorm`、`spec-plan`、`spec-work`、`spec-proof`、`spec-compound`；`docs/solutions/`、ADR、design docs 作为 prior decision sources 保留。 | [no_action] 当前上下游路由和 scratch/cache 产物路径已正确映射。 |
| `ce-dogfood` -> `spec-dogfood` | aligned，risk: medium | Durable report 路径保持 `docs/dogfood-reports/<YYYY-MM-DD>-<branch-slug>-dogfood.md`，因为这是 workflow artifact 语义路径而非 CE 命名；template generator 标识从 `/ce-dogfood` 改为 `spec-dogfood`；learnable output 路由从 `ce-compound` 改为 `spec-compound`；agent-browser readiness 映射到 `spec-mcp-setup` 诊断输出安装命令。 | CE helper routes 已改为 `spec-worktree`、`spec-debug`、`spec-commit`、`spec-compound`；缺 `agent-browser` 时不再说跑 `/ce-setup`，也不要求设置 env，而是提示运行 `spec-mcp-setup` 查看安装命令后手动安装。 | [updated] 保留 `docs/dogfood-reports/` 作为 durable QA artifact；同步 `spec-dogfood` 缺 helper 文案与 focused contract test。 |
| `ce-strategy` -> `spec-strategy` | aligned，risk: low | Durable strategy artifact 保持 repo-root `STRATEGY.md`，这是 product grounding source，不是 CE-specific 路径；downstream grounding consumers 从 `ce-ideate`、`ce-brainstorm`、`ce-plan` 映射为 `spec-ideate`、`spec-brainstorm`、`spec-plan`。 | CE skill names 已改为 spec-first；未发现 CE artifact path 残留。 | [no_action] `STRATEGY.md` 作为 canonical product grounding artifact 保留。 |
| `ce-simplify-code` -> `spec-simplify-code` | aligned，risk: low | 无 durable artifact contract；产物是 behavior-preserving source diff 与验证结果。Bug route 从 `ce-debug` 映射为 `spec-debug`。 | CE 名称已改为 spec-first；personas 保留为 skill-local references。 | [no_action] 当前迁移足够；后续若引入 report artifact，再定义 spec-first path。 |
| `ce-commit` -> `spec-commit` | aligned，risk: low | 产物是 git commit，不引入 CE-specific artifact path；temp commit message 从 inline heredoc 改为 `${TMPDIR:-/tmp}/spec-commit-message.*`，符合 spec-first 命名。 | CE 名称已改为 `spec-commit`；旧多平台 question tool 说明收敛为 Claude/Codex；默认分支保护和 temp message file 是 spec-first 安全增强。 | [no_action] 当前 commit artifact contract 与 spec-first source/runtime 边界一致。 |

#### Batch 1 多 agent 裁决

- 本 batch 不默认开启多 agent。理由：这些 pair 是低差异快审，文件数少、artifact/path 映射可由确定性 diff 与 bounded source reads 直接确认；多 agent 会增加调度成本和 synthesis 噪音。
- 提升条件：若某个 pair 出现高风险 artifact contract 漂移、下游 consumer 不明确、或需要语义评审多个可行迁移策略，再临时升级为 `spec-doc-review` / `spec-skill-audit` 的多人审查。

## Batch 2 helper 与尾项快审记录

本 batch 以 CE source 为真相源逐项确认承重逻辑是否保留，并只修复 active contract 漂移；不机械恢复 CE 命名、旧宿主说明或 `.compound-engineering` 路径。结论：5 项为合理 spec-first 化或增强，无需 source 修改；2 项存在 CE 承重逻辑遗漏，已补齐并加 contract tests。

| Pair | Verdict | Context / artifact mapping | CE residual decision | Recommended changes |
|---|---|---|---|---|
| `ce-commit-push-pr` -> `spec-commit-push-pr` | aligned，risk: low | 产物仍是 git commit、push 和 PR；PR body temp file 从 `${TMPDIR:-/tmp}/ce-pr-body.*` 映射为 `${TMPDIR:-/tmp}/spec-pr-body.*`；PR writing badge 从 Compound Engineering badge 映射为 Spec-First badge；PR description-only/update/full 三模式保留。 | 旧 `.compound-engineering` teaching config 与 `/ce-explain` trailer 已不再作为 active contract；当前 reference 没有 CE badge、`ce-pr-body` 或 standalone `ce-pr-description` 残留。 | [no_action] 当前 PR description、body-file 安全、fresh-base branch flow 与 spec-first source/runtime 边界一致。 |
| `ce-optimize` -> `spec-optimize` | aligned，risk: medium | Run state 从 `.context/compound-engineering/ce-optimize/<spec-name>/` 映射到 `.spec-first/workflows/spec-optimize/<spec-name>/`；experiment log、strategy digest、per-worktree result marker、measurement scripts 保留；新增 README/evals、dispatch/backend/security 边界是 spec-first 增强。 | CE repo-profile cache 映射到 `/tmp/spec-first/repo-profile/...`；local prompt assets 保留在 skill-local references；不恢复 CE 命令拼写或 `.context/compound-engineering` scratch。 | [no_action] 当前 metric/eval loop 产物路径与 crash-safety write-verify discipline 已完成 spec-first 化。 |
| `ce-promote` -> `spec-promote` | aligned，risk: low | 产物仍是 promotion drafts，不发布、不提交、不开 PR；Spiral optional enhancement 保留；opt-out 从 `.compound-engineering/config.local.yaml` + `ce_promote_spiral_optout` 映射为 `.spec-first/config.local.yaml` + `spec_promote_spiral_optout`。 | CE 示例命令与 Spiral reference 已改为 `spec-promote`；local config ignore 说明改为 `.spec-first/*.local.yaml`，并保留“decline records opt-out”的 CE 防 nag 逻辑。 | [no_action] 当前 local config key 已被 `spec-mcp-setup` config template 承接。 |
| `ce-proof` -> `spec-proof` | aligned，risk: medium | Proof doc URL、share token、ops/edit API、presence identity、comment/suggestion/rewrite mutations保留；identity 从 `ai:compound-engineering` / `Compound Engineering` 映射为 `ai:spec-first` / `Spec-First`；新增 `references/hitl-review.md` 把 publish/share surface 扩展为 HITL review loop。 | CE upstream routes 已改为 `spec-brainstorm`、`spec-ideate`、`spec-plan`；不恢复 unified plan 术语；Proof API endpoint 与 mutation format 是 provider contract，保留。 | [no_action] 当前 Proof identity、HITL ingest/sync、narrow-edit strategy 是合理 spec-first 增强。 |
| `ce-resolve-pr-feedback` -> `spec-resolve-pr-feedback` | repaired，risk: medium | 产物仍是 PR review feedback fixes、reply/resolve GraphQL mutations、combined validation、commit/push；script paths 从 bare `scripts/*` 映射到 transformable `skills/spec-resolve-pr-feedback/scripts/*`；spec-first 增加 mutating resolver dispatch boundary。 | 初始 spec-first 删除了 CE 的 `evaluation-rubric.md`，导致“orchestrator 先集中裁决，再只派发 approved fixes”的承重逻辑弱化；已恢复为 `references/evaluation-rubric.md` 并让 Full/Targeted mode 在 dispatch 前读取。 | [updated] 补 `evaluation-rubric.md`、Full/Targeted mode legitimacy gate 与 focused contract test。 |
| `ce-test-browser` -> `spec-test-browser` | repaired，risk: medium | 产物是 browser test observations、screenshots、failure repro steps；`agent-browser` 缺失时从 CE 的 setup 提示映射为 `spec-mcp-setup` 输出安装命令、用户手动安装；不再使用 env repair gate。 | 初始 spec-first 保留了 pipeline 行为但缺 CE 的 `pipeline-orchestration.md` reference，容易丢失 unattended run 的 free-port + server-start 单命令约束；已恢复 spec-first 命名 reference，并把 dev-server log 映射到 `/tmp/spec-test-browser-dev-server-<port>.log`。 | [updated] 补 pipeline orchestration reference、SKILL pointer 与 browser-helper contract test。 |
| `ce-worktree` -> `spec-worktree` | aligned，risk: medium | 产物从手写 `git worktree add` 指南增强为 `scripts/worktree-manager.sh` 的 deterministic facts：`spec-worktree-detect.v1`、`state`、`reason_code`、`worktree_root`、`main_worktree_root`、`branch`；`.worktrees/` gitignore、nested worktree refusal、submodule handling 保留并扩展。 | CE internal helper 暴露边界已收紧为 `user-invocable: false`，只能由 `spec-work`、`spec-code-review` 等公开 workflow 委托；旧 Antigravity/Pi question tool 说明移除；新增 `--copy-env` opt-in 和 dev tool trust safety 是 spec-first 增强。 | [no_action] 当前 source/runtime path wrapper、allowed-tools narrow pattern 与 env-copy audit 更符合 spec-first deterministic floor。 |

#### Batch 2 多 agent 裁决

- 本 batch 未开启多 agent。理由：7 个 pair 都是 bounded source diff + artifact/path mapping，可由当前 orchestrator 直接确认；唯一中风险修复点已经有 focused contract tests 锁住。
- 提升条件：后续若把 `spec-resolve-pr-feedback` resolver dispatch 改成真实多 agent并发 mutation，或让 `spec-test-browser` pipeline 被 `spec-lfg` 自动调用，需要补 fresh-source eval 或端到端 smoke。

## Batch 3 支撑链路快审记录

### `ce-compound` -> `spec-compound`

#### Verdict

- status: replaced
- risk: high
- decision: 按用户最新裁决，`spec-compound` 先以 CE `ce-compound` source 文件为真相源完成完整文件替换，再做 spec-first 必需归一化：入口名、下游 workflow 名、scratch/cache 路径、loaded skill directory anchor 和 frontmatter contract。CE 的 subagent scratch artifact、`CONCEPTS.md` create/seed、session-history、headless automation、grounding validation 与本地 prompt/script 产物均恢复；不保留上一轮“update-only CONCEPTS.md / 不恢复 scratch artifact”的 divergence 裁决。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/assets/resolution-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/schema.yaml`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/yaml-schema.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/concepts-vocabulary.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/repo-profile-cache.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/grounding-validation.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/references/agents/*.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/scripts/repo-profile-cache.py`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/scripts/validate-frontmatter.py`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/scripts/validate-doc-claims.py`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound/scripts/session-history/*`
- spec-first: `skills/spec-compound/SKILL.md`
- spec-first: `skills/spec-compound/assets/resolution-template.md`
- spec-first: `skills/spec-compound/references/schema.yaml`
- spec-first: `skills/spec-compound/references/yaml-schema.md`
- spec-first: `skills/spec-compound/references/concepts-vocabulary.md`
- spec-first: `skills/spec-compound/references/repo-profile-cache.md`
- spec-first: `skills/spec-compound/references/grounding-validation.md`
- spec-first: `skills/spec-compound/references/agents/*.md`
- spec-first: `skills/spec-compound/scripts/repo-profile-cache.py`
- spec-first: `skills/spec-compound/scripts/validate-frontmatter.py`
- spec-first: `skills/spec-compound/scripts/validate-doc-claims.py`
- spec-first: `skills/spec-compound/scripts/session-history/*`

#### Preserved Capabilities

- 保留 `docs/solutions/<category>/<filename>.md` 作为 durable learning 主产物，并保留 YAML frontmatter、bug/knowledge track、category mapping、duplicate/overlap 检查、related docs search、GitHub issue optional search、session-history enrichment、discoverability check 和 specialized doc enhancement prompt assets。
- 保留 CE 的“一个 run 只沉淀一个 learning”约束，避免多个 learning 在同一草稿中交叉引用后把 `Learning 3` 等 drafting scaffold 写入 durable docs。
- 保留 headless automation 模式：`mode:headless` 不问阻塞问题，按 Full mode 无 session history 执行，跳过 optional Phase 3 reviewer，并输出结构化 terminal report。
- 保留 CE 的 grounding validation 思路：写入后先跑机械 claims validator，再在 Full/headless 中用 read-only semantic validator 校验 code-behavior、merge-state 和 countable completeness claims；lightweight 至少跑机械 claims check。
- 保留 session-history 脚本对 Claude Code、Codex、Cursor、Pi 的支持；spec-first 版本继续通过 `SKILL_DIR` anchor 调用 bundled scripts，不依赖公共 sessions workflow。
- 恢复 CE 的 Phase 1 scratch artifact 模式：Context Analyzer、Solution Extractor、Related Docs Finder 与可选 Session History 写入 `/tmp/spec-first/spec-compound/<run-id>/context.json|solution.md|related.json|session-history.md`，orchestrator 在 Phase 2 读取 artifact，inline return 只作写入失败 fallback。
- 恢复 CE 的 `CONCEPTS.md` create/seed 行为：Full/headless 在 Phase 2.4 可按 learning area 创建并 seed glossary；Lightweight 仍只做 existing `CONCEPTS.md` update-only。

#### Intentional Spec-First Divergences

- CE 的 `/ce-compound`、`/ce-compound-refresh`、`/research`、`/ce-plan` 等用户入口映射为当前 `spec-*` 或 generic current-host entrypoint 表达。
- CE scratch/cache 路径从 `/tmp/compound-engineering/ce-compound/...`、`/tmp/compound-engineering/repo-profile/...` 映射为 `/tmp/spec-first/spec-compound/...`、`/tmp/spec-first/repo-profile/...`。
- `CLAUDE_SKILL_DIR` 归一为 runtime loaded skill directory anchor `SKILL_DIR`，shell guard 使用 `${SKILL_DIR:-}` 适配 `set -u`。
- CE frontmatter 中的 `argument-hint` 是用户入口参数提示，不是 legacy-only 字段；spec-first runtime 和 entrypoint lint 已支持该字段。已完成审查的 skill 中，CE 有 `argument-hint` 的按 CE 真相源保留并做必要 spec-first 化，CE 没有的则不新增。

#### Legacy CE Residuals

- 拷贝后已扫描 `skills/spec-compound`，未发现 active `/ce-*`、`ce-*` workflow route、`compound-engineering`、`.compound-engineering`、`/tmp/compound-engineering` 或 `CLAUDE_SKILL_DIR` 残留。
- CE 中没有的 spec-only `evals/examples.json` 与 `references/domain-model-capture.md` 已删除，避免形成第二套 `spec-compound` 行为真相源。
- `skills/spec-compound/scripts/__pycache__/` 与 `scripts/session-history/__pycache__/` 属编译产物，已清理，不作为 source 迁移面处理。

#### Recommended Changes

- [done] 用 CE `ce-compound` source 文件替换 `skills/spec-compound` 对应文件，并删除 CE 中不存在的 spec-only 文件。
- [done] 将 CE 命名、路径和下游入口归一为 spec-first：`spec-compound`、`spec-compound-refresh`、`spec-plan`、`spec-code-review`、`spec-simplify-code`、`/tmp/spec-first/spec-compound`、`/tmp/spec-first/repo-profile`。
- [done] 保留 CE Phase 2.45 `references/grounding-validation.md` 与 `scripts/validate-doc-claims.py`，输出 flags 供 LLM adjudication，不让脚本裁决语义充分性。
- [done] 修正 `$SKILL_DIR` shell 示例为 `${SKILL_DIR:-}` guard，避免 strict shell 环境下未设置变量直接失败。

#### Downstream Consumers

- `spec-plan` / `spec-work`: 消费 `docs/solutions/` learning 时可依赖已运行的 grounding validation 结果，并按 source refs / 当前源码回源确认关键事实。
- `spec-code-review`: 可把 durable learning 当 advisory recall，并通过 cited paths、PR/link 与当前源码回源确认。
- `spec-compound-refresh`: 后续刷新时区分 `legacy_unstructured_advisory` 与 structured promoted docs，并可用 `validate-doc-claims.py` 类机械 check 识别 path/link/scaffold 漂移。
- `using-spec-first` / host instruction files: discoverability check 仍只在明确 gap 时做小编辑或提示，不让 `docs/solutions/` 搜索变成强制 completion gate。

#### Verification Needed

- 本轮改动触及 skill prose、reference、Python validator、validation docs 和 changelog；执行 Python 语法检查、validator smoke、focused CE residual scan、`git diff --check`、`npm run lint:skill-entrypoints` 和 changelog 格式测试。
- 未执行 fresh-source eval：本轮为 source-level migration repair，且 Codex 当前请求未显式授权 subagent/persona dispatch；语义充分性来自逐文件 source read、CE 对照和 focused deterministic checks。

### `ce-compound-refresh` -> `spec-compound-refresh`

#### Verdict

- status: repaired
- risk: high
- decision: 按用户最新裁决，`spec-compound-refresh` 先以 CE `ce-compound-refresh` source 文件为真相源完整覆盖，再做最小 spec-first 必需归一化：入口名、下游 workflow 名、保留 CE `mode:headless` 命名、loaded skill directory validator anchor。CE 的 docs/solutions refresh lifecycle、CONCEPTS bootstrap / accretion / seeding、replace/delete 安全门、frontmatter validator 与 mechanical claims validator 均恢复；不保留 CE 中不存在的 spec-only eval fixture、structured recall 字段或 advisory/context/ADR report-only 增强。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/assets/resolution-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/references/concepts-vocabulary.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/references/per-action-flows.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/references/schema.yaml`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/references/yaml-schema.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/scripts/validate-frontmatter.py`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-compound-refresh/scripts/validate-doc-claims.py`
- spec-first: `skills/spec-compound-refresh/SKILL.md`
- spec-first: `skills/spec-compound-refresh/assets/resolution-template.md`
- spec-first: `skills/spec-compound-refresh/references/concepts-vocabulary.md`
- spec-first: `skills/spec-compound-refresh/references/per-action-flows.md`
- spec-first: `skills/spec-compound-refresh/references/schema.yaml`
- spec-first: `skills/spec-compound-refresh/references/yaml-schema.md`
- spec-first: `skills/spec-compound-refresh/scripts/validate-frontmatter.py`
- spec-first: `skills/spec-compound-refresh/scripts/validate-doc-claims.py`

#### Preserved Capabilities

- 保留 `docs/solutions/` maintenance model：Keep、Update、Consolidate、Replace、Delete 五类 outcome，且 evidence 是判断输入而不是机械打分。
- 保留 refresh order：先审 learning docs，再审依赖它们的 pattern docs；pattern stale 判断必须回到底层 learning evidence。
- 保留 broad/focused/batch scope 处理：宽范围先 triage / cluster / spot-check，不把用户一开始就推入全量维护队列。
- 保留 Update vs Replace 边界：路径、模块名、链接等 cosmetic drift 可原地更新；解决方案本身变化、旧 guidance 误导或架构变更时必须 Replace，不在原文里重写 solution。
- 保留 Consolidate 逻辑：确认 canonical doc、提取 unique content、更新 cross-references、删除 subsumed doc，不创建 `_archived/`；合并后对 canonical doc 运行 mechanical claims check，避免 merged citations 或 cross-references 悬空。
- 保留 Delete 安全门：实现或问题域消失时删除，但删除前必须做 inbound-link check；late-discovered substantive citation 会触发 reclassify。
- 保留 replacement validator：`validate-frontmatter.py` 负责 parser-safety，`validate-doc-claims.py` 负责 cited paths、commit SHAs、relative links 和 dangling drafting scaffold。
- 保留 headless conservative behavior：不问问题，安全动作可写入，歧义 Replace/Delete stale-mark，写失败进入 Recommended report。

#### Intentional Spec-First Divergences

- `mode:headless` 按 CE 原命名保留；行为保留 CE 的无交互安全动作和 stale-mark 策略。
- `ce-compound` handoff 投影为 `spec-compound`；缺候选 docs 时提示运行 `spec-compound`。
- CE 的 `${CLAUDE_SKILL_DIR}` validator guard 投影为“已读取的 `spec-compound-refresh` skill directory”上的 `SKILL_DIR` 调用，避免安装到用户目录或非 Claude host 后误依赖项目根 `skills/` 路径。
- 删除 CE 中不存在的 spec-only `Workflow Contract Summary`，避免形成额外包装层；保留 CE 主流程、阶段和产物语义。
- 删除 CE 中不存在的 spec-only `evals/examples.json`，避免形成额外维护面；同步删除旧 structured recall / advisory vocabulary / context-ADR report-only 测试口径。

#### Legacy CE Residuals

- 修复前 `spec-compound-refresh` 缺 CE 的 `scripts/validate-doc-claims.py`，且 Replace flow 只跑 parser-safety validator，丢失 cited path / SHA / relative-link / scaffold grounding check；已补回。
- 修复前 `per-action-flows.md` 示例仍以 `python3 scripts/validate-frontmatter.py` project-relative 形式表达；已改为通过 loaded `SKILL_DIR` 调 bundled scripts，避免安装到用户目录后误依赖项目根 `skills/`。
- `skills/spec-compound-refresh/scripts/__pycache__/validate-frontmatter.cpython-312.pyc` 曾作为本地编译产物出现；当前未被 git 跟踪，已从工作树移除，不作为 source 迁移面。

#### Recommended Changes

- [done] 用 CE `ce-compound-refresh` source 文件覆盖 `skills/spec-compound-refresh` 对应文件，再做最小 spec-first 投影。
- [done] 新增 `skills/spec-compound-refresh/scripts/validate-doc-claims.py`，与 CE validator 对齐。
- [done] Replace flow 在 frontmatter parser-safety 后运行 mechanical claims check，flags 作为 LLM adjudication input，不把脚本变成语义裁决者。
- [done] Consolidate flow 严格保留 CE 的 post-merge mechanical claims check on canonical doc。
- [done] 删除 CE 中不存在的 `evals/examples.json`、structured recall 字段和相关 contract tests；`spec-compound` 仍单独保留自身 structured promotion schema。
- [done] 更新 migrated script contract，锁定脚本存在和无 CE namespace 残留；Replace flow 调用锚点由本节逐文件审查与 focused source checks 覆盖。

#### Downstream Consumers

- `spec-compound`: 新 learning 写入后可推荐 narrow `spec-compound-refresh` scope，refresh 现在能用同类 mechanical claims validator 维护 successor docs。
- `spec-plan` / `spec-work` / `spec-code-review`: 消费 `docs/solutions/` recall 时仍把它当 advisory，并按当前 source/test/log/docs 回源确认；`spec-compound-refresh` 不再额外要求 CE 未定义的 `source_refs` / `invalidation_condition` 字段。
- `docs/solutions/`: replacement / consolidation 后的 durable knowledge 有 parser-safety 与 mechanical citation check，减少 stale path、dangling link 和 draft scaffold 污染。

#### Verification Needed

- 本轮改动触及 skill prose、reference、Python validator、tests、validation docs 和 changelog；执行 Python 语法检查、validator smoke、focused migrated-skill/changelog Jest、entrypoint lint、focused CE residual scan 和 `git diff --check`。
- 注意：旧 `tests/unit/spec-compound-contracts.test.js` 与 `tests/unit/knowledge-harness-contracts.test.js` 中将 `spec-compound-refresh` 绑定到 structured recall / advisory vocabulary 增强的断言已改为 CE-first parity 口径；`spec-compound` 自身的 structured promotion contract 仍由独立断言覆盖。
- 未执行 fresh-source eval：本轮为 CE 对照 source repair；语义充分性来自逐文件打开 CE/spec source、contract tests 和 deterministic validator smoke。

### `ce-riffrec-feedback-analysis` -> `spec-riffrec-feedback-analysis`

#### Verdict

- status: repaired
- risk: medium
- decision: 保留 CE 的 Riffrec 消费能力和 analyzer 产物集，但把下游 handoff、requirements kickoff 和用户可见入口完全收敛到 spec-first 当前 `spec-*` 口径。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/references/compound-engineering-feedback-format.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/references/install-riffrec.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/references/quick-bug-report.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/references/extensive-analysis.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`
- spec-first: `skills/spec-riffrec-feedback-analysis/SKILL.md`
- spec-first: `skills/spec-riffrec-feedback-analysis/references/spec-first-feedback-format.md`
- spec-first: `skills/spec-riffrec-feedback-analysis/references/install-riffrec.md`
- spec-first: `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md`
- spec-first: `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md`
- spec-first: `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`

#### Preserved Capabilities

- 保留 Riffrec zip、standalone video/audio、meeting notes 输入；继续支持 `analysis.md`、`problem-analysis.md`、`review-prompt.md`、`source-materials.md`、`requirements-kickoff.md`、`analysis.json`、`frames/` 和 `raw/` 产物。
- 保留三路径分流：setup 只指导安装/录制；quick bug report 写入 temp 输出且默认只回 inline bug report；extensive analysis 生成完整 evidence/kickoff artifact 并继续进入 brainstorm。
- 保留 raw media、frames、audio chunks、zip contents local-only 默认策略；Markdown/JSON/manifest 在无敏感数据且需要 traceability 时可提交。
- 保留 source mapping 作为 suspected implementation surfaces，而不是 root cause 证明；要求区分 observed facts、inferences 和 requirements。

#### Intentional Spec-First Divergences

- CE 的 `compound-engineering-feedback-format.md` 映射为 `spec-first-feedback-format.md`，Next Steps 从 `/ce-brainstorm` 改为 `spec-brainstorm`。
- Extensive handoff 从 `ce-brainstorm` 改为 `spec-brainstorm`；`docs/brainstorms/riffrec-feedback/` 只作为 analyzer evidence/kickoff artifact exception，不等同于本轮 CE-first 恢复后的 durable brainstorm output。当前 `spec-brainstorm` durable requirements-only unified plan 输出为 `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>`。
- Analyzer help、generated requirements kickoff 和 human review checklist 已使用 spec-first 命名与 `spec-brainstorm` 消费者。

#### Legacy CE Residuals

- 逐文件审查发现 active spec-first source 中没有 `.compound-engineering`、`/tmp/compound-engineering`、`ce-brainstorm`、`ce-debug` 或 CE feedback format 文件名残留。
- 修复前脚本命令行输出仍显示 `$spec-first:spec-brainstorm`，属于旧 host-specific / plugin-style 入口残留，已改为当前统一入口 `spec-brainstorm`。
- `__pycache__/` 编译产物未被 git 跟踪，并被 `.gitignore` 覆盖；不作为 source 迁移差异处理。

#### Recommended Changes

- [fix] 将 analyzer 结尾 `Brainstorm handoff` 输出从 `$spec-first:spec-brainstorm <requirements-kickoff>` 改为 `spec-brainstorm <requirements-kickoff>`。
- [document_divergence] 在本审查表记录 Riffrec analyzer artifact 到 `spec-brainstorm` 的产物映射和 `docs/brainstorms/riffrec-feedback/` 的 evidence/kickoff exception 语义；durable brainstorm output 以 `docs/plans/` unified plan 为准。

#### Downstream Consumers

- `spec-brainstorm`: 消费 `requirements-kickoff.md`、`source-materials.md`、`analysis.md` 和截图引用，先确认、纠正、重组需求，再产出 `docs/plans/` 下的 requirements-only unified plan。
- `spec-plan` / `spec-work`: 只消费 brainstorm 确认后的 requirements artifact；Riffrec analyzer 产物是 evidence/kickoff 输入，不应跳过 brainstorm 确认直接进入实现。
- `spec-debug`: quick path 可建议打开 `spec-debug`，但 quick bug report 本身不自动 handoff。

#### Verification Needed

- 本轮改动触及 Python script 输出文案和 docs validation，执行 Python 语法检查、`git diff --check` 与 changelog 格式检查。
- 未运行 Riffrec analyzer 端到端样例，因为本轮没有本地录制 fixture；语义验证来自逐文件 source read 与 focused residual scan。

### `ce-sweep` -> `spec-sweep`

#### Verdict

- status: repaired
- risk: high
- decision: 保留 CE 的 feedback sweep 能力链路，并将 local config、调度 handoff、media analyzer、brainstorm/lfg 下游入口和 scratch/state 路径做必要的 spec-first 名称与路径投影。`docs/plans/feedback-sweep-plan.md` 是 CE 原有 rolling `/lfg`-ready plan 产物在 spec-first 中的等价投影；analyzer 到 brainstorm 的提示也保留 CE 的 `docs/plans/` unified-plan 口径，只把 `ce-brainstorm` 改为 `spec-brainstorm`。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/interview.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/plan-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/state-schema.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/model-tiers.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/sources/slack.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/sources/github-issues.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/sources/email.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/subagent-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/references/agents/media-analyzer.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/scripts/analyze_riffrec_zip.py`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-sweep/scripts/sweep-state.py`
- spec-first: `skills/spec-sweep/SKILL.md`
- spec-first: `skills/spec-sweep/references/interview.md`
- spec-first: `skills/spec-sweep/references/plan-template.md`
- spec-first: `skills/spec-sweep/references/state-schema.md`
- spec-first: `skills/spec-sweep/references/model-tiers.md`
- spec-first: `skills/spec-sweep/references/sources/slack.md`
- spec-first: `skills/spec-sweep/references/sources/github-issues.md`
- spec-first: `skills/spec-sweep/references/sources/email.md`
- spec-first: `skills/spec-sweep/references/subagent-template.md`
- spec-first: `skills/spec-sweep/references/agents/media-analyzer.md`
- spec-first: `skills/spec-sweep/scripts/analyze_riffrec_zip.py`
- spec-first: `skills/spec-sweep/scripts/sweep-state.py`
- supporting source: `tests/unit/spec-sweep-lfg-migration-contracts.test.js`

#### Preserved Capabilities

- 保留 first-run interview：逐源采集 `feedback_sources`、ack/close-out action、standing approval、sensitive flag、state path、ack cap、shared branch、legacy import 和 schedule handoff。
- 保留 headless mode：无 blocking question tool 或传入 `mode:headless` 时不提示，first-run setup fail closed，决策和 circuit breaker 写入 Outstanding Questions / `ack_deferred`。
- 保留 deterministic state engine 唯一写 state 的纪律：lease acquire/release、validate、cursor-get/advance、upsert、legacy import、run-record 均通过 bundled `scripts/sweep-state.py`。
- 保留 source personas：Slack、GitHub Issues、email experimental 都以 read/degrade/write-degrade 的事实返回，不让 persona 推进 cursor 或改 state。
- 保留 ack/read-back/cursor invariant：按 cursor 顺序逐项 ack，确认来源可见后 upsert，再 advance cursor；失败则 `ack_deferred` 且不推进。
- 保留 media analysis：下载到 `/tmp/spec-first/spec-sweep/<run-id>/`，用 media analyzer subagent 调 bundled `analyze_riffrec_zip.py`，失败计数后进入 `manual_stuck`。
- 保留 fix verification：仅接受 PR number 或 commit SHA 形态，验证 merge 后才执行 close-out action 并写 closed evidence fields。
- 保留 rolling plan reconciliation：目标 `docs/plans/feedback-sweep-plan.md`，只写 machine-owned region，保留 human notes，最终 handoff 为 `spec-lfg docs/plans/feedback-sweep-plan.md`。

#### Intentional Spec-First Divergences

- CE local config 从 `.compound-engineering/config.local.yaml` 映射为 `.spec-first/config.local.yaml`；machine-local state 从 `/tmp/compound-engineering/...` 映射为 `/tmp/spec-first/spec-sweep/<repo-slug>/state.yml` 或 run scratch `/tmp/spec-first/spec-sweep/<run-id>/`。
- CE `/ce-sweep` 与 `/lfg` handoff 映射为当前统一 `spec-sweep` / `spec-lfg` 入口；旧 slash/plugin style 不作为 active invocation。
- CE 插件内 `schedule` skill 口径映射为 installed `schedule` helper；缺该 helper 时仍按 CE 原逻辑退回 platform-native mechanism。skill 本身不 inline 创建 schedule。
- Analyzer 中 `ce-brainstorm` 映射为 `spec-brainstorm`，但保留 CE 的 `docs/plans/` durable unified-plan 输出口径；不在 `spec-sweep` 迁移中重写为 `docs/brainstorms/`。

#### Legacy CE Residuals

- `references/interview.md` 保留 CE 的 unrelated key preservation 示例，包括 `work_delegate_*`；这里表达的是“写 sweep keys 时不能破坏其他 local config”，不是声明 `work_delegate_*` 是 active sweep config。
- CE 插件内 `schedule` skill 不是 spec-first 命名；已投影为 installed `schedule` helper，同时保留 CE 的 fallback 到 cron、GitHub Actions 或 host automation。
- 修复前 `scripts/analyze_riffrec_zip.py` 仍有 `CE-friendly markdown artifacts`、`CE requirements document` 和 `ce-brainstorm` 入口残留；已改为 spec-first 命名，但保留 CE 的 `docs/plans/` durable unified-plan 输出链路。
- `references/plan-template.md` 的 `artifact_contract: spec-unified-plan/v1` 目前作为 `spec-sweep` rolling plan contract 保留；现有 contract test 只禁止 `ce-unified-plan/v1`，未发现下游要求改名。

#### Recommended Changes

- [done] 保留 CE 的 unrelated key preservation 示例，包括 `work_delegate_*`；该示例不作为 active sweep config。
- [done] 将 CE plugin schedule 假设投影为 installed `schedule` helper，保留 recurring schedule handoff 与 platform fallback。
- [done] 修正 analyzer 输出和 help 文案中的 CE 名称残留，同时保留 CE 的 `docs/plans/` unified-plan 输出口径。
- [done] 用 focused migration contract test 锁住 `.spec-first/config.local.yaml`、installed `schedule` helper handoff、`docs/plans/` durable unified-plan 口径，以及 `docs/plans/feedback-sweep-plan.md` 到 `spec-lfg` 的保留 handoff。

#### Downstream Consumers

- `spec-lfg`: 消费 `docs/plans/feedback-sweep-plan.md` 执行 open feedback items；该 plan 是 `spec-sweep` 的 rolling requirements-only plan artifact。
- `spec-brainstorm`: 消费 analyzer 生成的 `requirements-kickoff.md` / evidence bundle 来确认、纠正和重组产品需求；本迁移按 CE 原逻辑保留 durable unified plan under `docs/plans/` 的 handoff 口径。
- `spec-mcp-setup`: 提供 `.spec-first/config.local.example.yaml` 和 helper/provider readiness facts；`spec-sweep` 运行时读取 `.spec-first/config.local.yaml` 中的 `feedback_sources` 与 `sweep_*` keys。
- `spec-product-pulse` / `spec-promote`: 可共享 `feedback_sources` 这种 generic local config source list，但不得依赖 retired `work_delegate_*`。

#### Verification Needed

- 本轮改动触及 skill reference、Python analyzer、migration contract test、validation docs 和 changelog；执行 Python 语法检查、focused Jest、entrypoint lint 和 `git diff --check`。
- 未执行 fresh-source eval：本轮为 CE 对照 source repair，且用户要求逐文件打开审查；语义充分性来自 CE/spec 逐文件 source read 与 deterministic focused checks。

### `ce-product-pulse` -> `spec-product-pulse`

#### Verdict

- status: repaired
- risk: medium
- decision: 保留 CE 的 product pulse 信号采集、first-run interview、read-only query discipline 和单页报告产物；把 machine-local config、strategy seed、调度提示和本地配置示例收敛到 spec-first source/runtime 边界。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/references/interview.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-product-pulse/references/report-template.md`
- spec-first: `skills/spec-product-pulse/SKILL.md`
- spec-first: `skills/spec-product-pulse/references/interview.md`
- spec-first: `skills/spec-product-pulse/references/report-template.md`
- supporting source: `skills/spec-mcp-setup/references/config-template.yaml`

#### Preserved Capabilities

- 保留 time-windowed pulse report：usage、performance、errors、followups 四类信号，默认 `24h`，支持 `1h`、`7d`、`30d` 等 lookback，并保留 15 分钟 trailing ingestion buffer。
- 保留 first-run interview：从 `STRATEGY.md` seed product name 和 key metrics，按 SMART bar 对 engagement、value realization、completion/conversion、quality scoring、data sources、system performance、default lookback 做一次性配置。
- 保留 data-source safety：analytics/tracing/payments 可并行读取，database 只允许 read-only 且串行查询；不收集 credentials，不写外部系统，不把 PII 写入 report。
- 保留 durable report artifact：`docs/pulse-reports/YYYY-MM-DD_HH-MM.md` 是团队工作记忆；chat 只回 Headlines、top followup 和文件路径，不贴完整报告。
- 保留 `pulse_metric_sources`、`pulse_pending_metrics`、`pulse_excluded_metrics` 语义，避免 strategy metrics 在多源或未 instrumentation 场景中静默丢失。

#### Intentional Spec-First Divergences

- CE local config 从 `.compound-engineering/config.local.yaml` 映射为 `.spec-first/config.local.yaml`，并由 `spec-mcp-setup` 的 config template 承接 `pulse_*` commented example keys。
- `ce-strategy` seed route 映射为 `spec-strategy`；`STRATEGY.md` 作为 product grounding source 保留。
- Scheduling 不再假设 CE plugin 内 `schedule` skill 是 single source of truth；spec-first 只 handoff 到当前 host 可用的 scheduling primitive，缺 primitive 时说明 cron、GitHub Actions 或 host automation 等平台方案。

#### Legacy CE Residuals

- 修复前 active spec-first source 已无 `.compound-engineering`、`ce-strategy` 或 CE local config 文案残留。
- 修复前仍用 `work_delegate_*` 作为 non-pulse key 示例和 flat-key precedent。由于该类 key 已被 setup 审查裁决为下游 consumer-gated / setup inert，不应在 product pulse 中继续作为 active local config 示例；已改为 generic non-pulse keys 和 flat top-level spec-first local config wording。
- `report-template.md` 与 CE 能力一致，无 CE-specific path 或 invocation residual。

#### Recommended Changes

- [fix] 去掉 `work_delegate_*` 示例，避免 product pulse 文档把已裁决 inert 的 execution delegation config 暗示为 active local config precedent。
- [fix] 去掉 CE plugin `schedule` skill 假设，改为 host/platform scheduling primitive handoff，不自动安排 recurring job。
- [document_divergence] 在本审查表记录 `.spec-first/config.local.yaml`、`docs/pulse-reports/` 和 scheduling handoff 的 spec-first 映射。

#### Downstream Consumers

- `spec-mcp-setup`: 提供 `.spec-first/config.local.example.yaml` 中的 `pulse_*` commented keys，保护 local config 不入库。
- `spec-strategy`: 可提前生成或维护 `STRATEGY.md`，供 pulse interview seed product name 和 key metrics。
- `spec-product-pulse`: 运行时消费 `.spec-first/config.local.yaml` 的 `pulse_*` keys，并写入 `docs/pulse-reports/`。

#### Verification Needed

- 本轮改动为 skill prose/reference/docs validation，执行 focused CE residual scan、`git diff --check`、`npx jest tests/unit/changelog-format.test.js --runInBand`。
- 若未来把 `pulse_*` config 解析写成 deterministic script，补 config parser / template contract tests；本轮未新增脚本。

### `lfg` -> `spec-lfg`

#### Verdict

- status: repaired
- risk: high
- decision: 保留 CE 的 full hands-off engineering pipeline 顺序、gate、review residual durable sink、browser test、commit/PR、CI watch/autofix 和 concept trailer 交接；只把 CE skill 名称、artifact contract、scratch 路径和 explain handoff 做 spec-first 必要投影。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/review-followup.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/lfg/references/tracker-defer.md`
- spec-first: `skills/spec-lfg/SKILL.md`
- spec-first: `skills/spec-lfg/references/review-followup.md`
- spec-first: `skills/spec-lfg/references/tracker-defer.md`
- supporting source: `tests/unit/spec-sweep-lfg-migration-contracts.test.js`

#### Preserved Capabilities

- 保留严格顺序：`spec-plan` -> `spec-work` -> `spec-simplify-code` -> `spec-code-review` -> review fix -> residual handoff -> `spec-test-browser` -> `spec-commit-push-pr` -> CI watch -> DONE。
- 保留 plan metadata gate：`artifact_contract: spec-unified-plan/v1` 时只接受 `artifact_readiness: implementation-ready` 与 `execution: code`；requirements-only、knowledge-work、approach-plan、answer-seeking 或 invalid progress-like readiness 都停止 pipeline。
- 保留 `mode:return-to-caller` 和 `standalone_shipping_skipped: true` 合同，确保 `spec-work` 完成实现但不独自 shipping，并把控制权交回 LFG。
- 保留 `behavior_change: true` 的 `verification_evidence` gate 与一次 idempotent retry；第二次仍缺证据时停止并报告缺失字段。
- 保留 docs-only / trivial 变更跳过 simplify，非跳过时让 `spec-simplify-code` 在 review 前处理 branch diff。
- 保留 `spec-code-review mode:agent plan:<plan-path>` report-only 合同，由 LFG 在 step 5 读取 `review-followup.md` 后应用合格机械修复并 commit/push。
- 保留 shipping precondition：无 remote 时进入 local-only，跳过 push、PR create/edit、CI watch；有 remote 时按上游或可写 remote 推送。
- 保留 residual review findings 的 durable sink：优先更新当前 PR body，否则写 `docs/residual-review-findings/<branch-or-head-sha>.md` 并提交；tracker filing 失败不阻塞 DONE，前提是 residual 已持久化。
- 保留 `spec-test-browser mode:pipeline` 和 `spec-commit-push-pr mode:pipeline`，commit/PR helper 必须按 pipeline token 非交互执行。
- 保留 CI watch/autofix 最多 3 次循环，失败后把 `## CI Failures Unresolved` 写入 PR body，不继续无限循环。
- 保留 CE 的 `New concepts:` trailer 交接：step 8 若记录新概念，step 10 在 DONE 前输出 `New concept introduced: <name> — run spec-explain <name> to go deeper.`。

#### Intentional Spec-First Divergences

- CE skill handoff 投影为当前 `spec-*`：`ce-plan`、`ce-work`、`ce-simplify-code`、`ce-code-review`、`ce-test-browser`、`ce-commit-push-pr`、`/ce-explain` 分别映射为 `spec-plan`、`spec-work`、`spec-simplify-code`、`spec-code-review`、`spec-test-browser`、`spec-commit-push-pr`、`spec-explain`。
- CE namespace 示例 `compound-engineering:ce-plan` 映射为 `spec-first:spec-plan`，只作为“按 host available-skills list 精确匹配”的示例，不是固定 invocation。
- Plan contract 从 `ce-unified-plan/v1` 映射为 `spec-unified-plan/v1`。
- Review artifact path 从 `/tmp/compound-engineering/ce-code-review/<run-id>/...` 映射为 `/tmp/spec-first/spec-code-review/<run-id>/...`。

#### Legacy CE Residuals

- 修复前 `skills/spec-lfg/SKILL.md` step 8 丢失 CE 的 `mode:pipeline`、`non-interactively, per the mode token` 和 `New concepts:` trailer 记录，导致 commit/PR helper 的 pipeline 合同和 concept follow-up 交接弱化；已补回。
- 修复前 step 10 丢失 CE 的 new concept follow-up 输出；已补回并把 `/ce-explain` 投影为当前 `spec-explain`。
- 修复前 `references/tracker-defer.md` 仍写 autonomous caller 示例 `lfg`；已投影为 `spec-lfg`。
- `review-followup.md` 与 CE 等价，只做 `ce-code-review` -> `spec-code-review` 必要名称投影，未发现额外能力缺失。

#### Recommended Changes

- [done] 恢复 `spec-commit-push-pr mode:pipeline` invocation 和非交互 mode token 说明。
- [done] 恢复 `New concepts:` trailer 捕获与 DONE 前 `spec-explain` follow-up 输出。
- [done] 将 tracker-defer autonomous caller 示例从 `lfg` 投影为 `spec-lfg`。
- [done] 增加 focused migration contract test，锁住 pipeline handoff、concept trailer 和 tracker-defer 调用方名称。

#### Downstream Consumers

- `spec-plan`: 产出 LFG 可执行的 `docs/plans/` plan，并通过 `spec-unified-plan/v1` metadata gate 约束是否进入实现。
- `spec-work`: 执行 plan 并返回 structured return；LFG 依赖其 changed files、verification results、behavior-change signal 与 verification evidence。
- `spec-code-review`: report-only 审查并输出 Actionable Findings；LFG 负责合格机械修复和 residual durable sink。
- `spec-test-browser`: 以 `mode:pipeline` 在 shipping 前执行 browser validation。
- `spec-commit-push-pr`: 以 `mode:pipeline` 非交互完成 commit/push/PR，并通过 `New concepts:` trailer 把可沉淀概念交给 `spec-explain`。

#### Verification Needed

- 本轮改动触及 `spec-lfg` prose、tracker-defer reference、migration contract test、validation docs 和 changelog；执行 focused Jest、entrypoint lint、CE residual scan 和 `git diff --check`。
- 未执行 fresh-source eval：本轮为 CE 对照 source repair，且用户要求逐文件打开审查；语义充分性来自 CE/spec 逐文件 source read 与 deterministic focused checks。

## 待确认的首轮发现

以下是初始 orientation pass 得到的 advisory findings，必须在完整逐 skill review 中重新确认。

### `spec-brainstorm`

- 已按用户裁决推翻早期 “短 spine + `docs/brainstorms/*-requirements.md` canonical contract” 判断。
- 当前处理方式是清空 `skills/spec-brainstorm` 后完整拷贝 CE `ce-brainstorm` source 文件，再做最小 spec-first 投影。
- Durable brainstorm output 恢复为 `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>` requirements-only unified plan，metadata 使用 `artifact_contract: spec-unified-plan/v1`、`artifact_readiness: requirements-only`、`product_contract_source: spec-brainstorm`。
- `docs/brainstorms/*-requirements.*` 仅作为 legacy input 保留，不再作为新 `spec-brainstorm` active output contract。

### `spec-plan`

- 它是 brainstorm artifact 的最高优先级下游 consumer。
- 需要确认 plan intake 能识别 spec-first requirements docs、PRD handoff artifacts，并且 legacy CE unified plans 只在有意兼容处作为输入。
- 需要确认旧 CE artifact 术语不会泄漏进当前 plan output contracts。

### `spec-doc-review`

- 初始 inventory 中 stale-contract scan count 最高。
- 需要确认 markdown mutation rules、persona dispatch、finding confidence 和 review report paths 都是 spec-first source contracts。
- 任何剩余 `ce-doc-review` 引用都应只是兼容说明，而不是 active invocation guidance。

### `spec-work` 与 `spec-lfg`

- 需要确认 execution 和 full-pipeline handoffs 不再假设 CE plan artifact paths 或 `ce-plan` invocation strings。
- 需要确认 task-pack、source-plan、verification、review、commit、PR、CI handoffs 都使用当前 spec-first entrypoints。

### `spec-mcp-setup`

- 这是从 `ce-setup` 到 `spec-mcp-setup` 的近似映射，不是直接 parity target。
- 审查应记录哪些 CE setup 职责被有意识排除，因为 spec-first setup 聚焦 multi-host runtime readiness。

#### `ce-setup` 产物到 `spec-mcp-setup` 产物映射

下表把 CE setup 已有产物逐项映射到 spec-first 原生 setup 产物。迁移判断以 spec-first 的 source/runtime 边界为准：本地项目配置、host MCP 配置、provider readiness、helper tool readiness 和 generated runtime freshness 都应成为 setup 可输出、可复查、可被后续 skill 消费的事实；但不保留 `.compound-engineering` 命名，也不把 legacy config 当作 active local config。

| CE 产物 / 行为 | CE source | spec-first 对应产物 / 行为 | 覆盖状态 | spec-first 迁移说明 / 注意事项 | 下游消费者 / 验证面 |
|---|---|---|---|---|---|
| 三阶段 setup：诊断、修复 repo-local 问题、汇总 | `ce-setup/SKILL.md`、`scripts/check-health` | `spec-mcp-setup` 默认三阶段：Stage 1 轻量诊断、Stage 2 授权修复、Stage 3 汇总 next actions | 已覆盖并扩展 | 默认路径应保持轻量诊断；涉及 host 写入、project-local config 创建、provider 初始化时必须显式授权或显式参数触发 | `skills/spec-mcp-setup/SKILL.md`、`check-health` / `.ps1` human 输出、setup plan / focused tests |
| Optional capability diagnostic 表 | `scripts/check-health` | `helper_tools` / `items[]` 诊断，human/JSON 输出 helper readiness | 已覆盖并扩展 | CE 只做工具存在性提示；spec-first 还需要输出 `status`、`result`、`next_action` 和 degraded reason，供后续 workflow 判断是否可用；helper readiness 主要落在 `tool-facts.json`，`runtime-capabilities.json` 只承载 direct evidence posture / setup summary 相关事实 | `tool-facts.json`、`browser-helper-tool-contracts.test.js` |
| `agent-browser` optional check | `scripts/check-health` | browser helper readiness：检测 CLI、runtime marker、global skill / host 可用性，缺失时给安装命令 | 已覆盖 | 不应自动安装；仅 CLI 存在但 runtime marker / skill 不完整时不能标为 ready。默认 setup 和 helper install 路径都只给 next action，不再通过 env gate 触发自动安装 | `spec-dogfood`、`spec-polish`、`spec-test-browser`、`spec-code-review` 浏览器证据路径 |
| `gh`、`jq`、`ast-grep`、`ffmpeg` optional checks | `scripts/check-health` | helper registry 与 baseline readiness 分层；`ast-grep`、`ffmpeg` 等作为 helper/provider capability facts 输出 | 已覆盖并扩展 | 保留 CE 的“诊断而非批量安装”姿态；同时区分 required baseline、optional helper、provider-specific dependency，避免所有缺失都变阻断 | `spec-sweep`、`spec-riffrec-feedback-analysis`、`spec-rule-miner`、review/debug workflows |
| `.compound-engineering/config.local.example.yaml` | `references/config-template.yaml` | `.spec-first/config.local.example.yaml` | 已覆盖 | 只迁移语义能力，不迁移文件名；example 是 project-local bootstrap 产物，可由 setup 刷新 | `verify-tools.*` project-local config status、config template contract tests |
| 可选 `.compound-engineering/config.local.yaml` | `ce-setup/SKILL.md` | 可选 `.spec-first/config.local.yaml` | 已覆盖 | active local config 只认 `.spec-first/config.local.yaml`；旧路径已 retired，不作为 setup 检查对象或 persisted preference | `spec-sweep`、`spec-product-pulse`、`spec-promote` 等读取 local config 的 workflow |
| `.compound-engineering/*.local.yaml` gitignore 规则 | `scripts/check-health` | `.spec-first/*.local.yaml` gitignore 规则 | 已覆盖 | 保留“local config 不入库”的确定性保护；只写 spec-first namespace，不再检查旧 namespace ignore 状态 | gitignore policy / project-local config tests |
| `compound-engineering.local.md` legacy cleanup | `scripts/check-health` | legacy markdown signal / manual cleanup next action | 部分覆盖，按 spec-first 降级 | 不作为 active setup 产物；只作为历史残留信号提示人工确认，避免 setup 自动删除用户文档 | `check-health` legacy signal、文档审查记录 |
| `.compound-engineering/config.local.yaml` 未被 gitignore 的风险提示 | `scripts/check-health` | retired；active 保护转为 `.spec-first/*.local.yaml` | 已退役 | 旧路径不迁移、不检查、不作为 setup 事实；active 防泄漏只针对 `.spec-first/config.local.yaml` 与 `.spec-first/*.local.yaml` | gitignore policy / project-local config tests |
| CE config template keys | `references/config-template.yaml` | `skills/spec-mcp-setup/references/config-template.yaml` active local config keys | 已覆盖并重映射 | 迁移为 spec-first 当前消费者需要的 key；已裁决 retired 的 key 不作为 persisted setup preference，但后续 skill 仍使用的能力必须在 spec-first config 中有对应表达 | config template contract tests、后续 workflow local config reads |
| work delegation keys | `references/config-template.yaml` | spec-first 下游 execution workflow consumer-gated delegation config surface | 已覆盖 | 不是全局 active setup 偏好；setup 只暴露和保护 key，不因 key 存在自动委托或改变 host runtime。只有 downstream execution workflow 明确实现 consumer 与测试后才读取 | `spec-work` / execution workflows 的 consumer-side gate |
| plan skip scoping confirm | `references/config-template.yaml` | spec-first 下游 planning workflow consumer-gated scoping-confirmation config surface | 已覆盖，但 setup 阶段 inert | 不是 setup 自身的 persisted behavior；setup 只暴露和保护 key，不因 key 存在自动跳过确认。是否读取、何时跳过必须由具体 planning workflow 在当次上下文中裁决 | `spec-plan` 入口语义、scoping confirmation 行为与 consumer-side tests |
| setup summary | `scripts/check-health` | grouped status block：baseline、helpers、project-local config、provider readiness、generated runtime、next actions | 已覆盖并扩展 | 汇总必须清楚区分 blocking、degraded、optional、advisory；不能用 “All clear” 掩盖 optional degraded | `check-health` / `.ps1` human 输出 contract |
| 不批量安装 optional tools，只输出 install command / URL | `ce-setup/SKILL.md`、`scripts/check-health` | 默认 setup 不自动安装 optional helper；`agent-browser` 只诊断并输出安装命令，provider setup 和 refresh 需要显式 opt-in | 已覆盖 | 保留 CE 的授权边界；spec-first 额外禁止裸 setup 触发 CodeGraph / Graphify first-generation；`agent-browser` 不再保留 env repair gate | `install-helpers.*`、`setup-plan-renderer.cjs`、provider next action tests |
| 无 MCP/runtime facts 文件 | 无 | `.spec-first/config/tool-facts.json`、`.spec-first/config/runtime-capabilities.json` | spec-first 新增 | 这是 spec-first 相比 CE 的核心新增产物：把诊断结果落成 machine-readable facts，供后续 workflow 读取，而不是依赖本轮口头判断 | `write-setup-facts` / `check-health --json`、runtime capability contract tests |
| 无 generated runtime freshness 检查 | 无 | `generated_runtime_manifest.status` | spec-first 新增 | 用于确认 `.claude/`、`.codex/`、`.agents/skills/` 等 generated runtime 是否 stale / missing；发现漂移时提示 `spec-first init`，不手改 mirror | `spec-first doctor`、`verify-tools.*`、runtime manifest tests |
| 无 provider readiness 事实 | 无 | `provider_readiness[]`，含 CodeGraph / Graphify 等 provider 的 status、artifact、refresh next action | spec-first 新增 | Provider 输出是 advisory navigation evidence；setup 只产 readiness facts，重要结论仍需 source/test/log 确认 | `spec-plan`、`spec-work`、`spec-code-review`、Graphify / CodeGraph consumption docs |
| 无 host configured dependency scan | 无 | `configured_dependencies[]` | spec-first 新增 | 检查 host MCP / runtime 配置中声明的依赖是否存在、是否可执行、是否需要 repair，供 multi-host setup 汇总 | Claude、Codex、Kiro、Qoder、Cursor host setup / repair scripts |
| 无 scenario fingerprint | 无 | `.spec-first/workspace/scenario-fingerprint-setup.json`（适用时） | spec-first 新增 | 用于 workspace / scenario 级 setup 事实复用；不替代具体 host/runtime/provider readiness | workspace setup summary、后续 setup drift 判断 |
| 单 Bash health check | `scripts/check-health` | Bash + PowerShell parity scripts：`check-health`、`check-health.ps1`、`verify-tools.sh`、`verify-tools.ps1`、`install-mcp.*` | 已覆盖并扩展 | 需要维持 macOS/Linux/Windows 行为等价；外部命令执行、超时、路径 quoting、JSON/human 输出都应有跨平台测试 | `mcp-setup-powershell-contracts.test.js`、shell syntax check、PowerShell parse check |
| plugin version display | `scripts/check-health` | spec-first version / runtime facts 可选展示，不作为核心产物 | 部分覆盖 | 版本可辅助诊断，但 setup 的可靠产物应是 readiness facts 与 next actions；不要把版本展示当作安装成功证据 | `spec-first --version`、`tool-facts.json` advisory facts |

## Batch 4 核心链路深审记录

### `ce-code-review` -> `spec-code-review`

#### Verdict

- status: replaced
- risk: high
- decision: 按用户裁决，`spec-code-review` 以 CE `ce-code-review` source 为真相源重建，再做最小 spec-first 投影。保留 CE 的 `mode:agent` JSON 合同、interactive safe apply/commit、small-diff lite gate、multi-persona fanout、cross-model adversarial pass、repo-profile cache、plan completeness check、Stage 5 merge/dedup/validation/apply/synthesis 和 Actionable Findings summary。不保留上一版 spec-first 的 `Workflow Contract Summary`、graph-assisted review contract、`mode:autofix` / `mode:report-only` / `mode:headless` 主模式、bulk preview / tracker-defer / walkthrough references 与 `resolve-base.sh` 作为 active contract。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/action-class-rubric.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/agents/repo-profiler.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/cross-model-review.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/diff-scope.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/findings-schema.json`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/persona-catalog.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/personas/*.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/repo-profile-cache.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/review-output-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/subagent-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/references/validator-template.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/scripts/cross-model-adversarial-review.sh`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-code-review/scripts/repo-profile-cache.py`
- spec-first: `skills/spec-code-review/SKILL.md`
- spec-first: `skills/spec-code-review/references/action-class-rubric.md`
- spec-first: `skills/spec-code-review/references/agents/repo-profiler.md`
- spec-first: `skills/spec-code-review/references/*.md`
- spec-first: `skills/spec-code-review/references/personas/*.md`
- spec-first: `skills/spec-code-review/scripts/cross-model-adversarial-review.sh`
- spec-first: `skills/spec-code-review/scripts/repo-profile-cache.py`

#### Preserved Capabilities

- 保留 CE 的入口参数：`mode:agent` 为 pipeline/report-only JSON，`mode:headless` 仅作为 deprecated alias；默认模式仍可应用 safe verified fixes，并在 clean pre-review tree 时 commit。
- 保留 CE 的 scope 解析：PR/branch/base/current checkout、untracked exclusion、remote PR/branch read-only inspection、`plan:<path>` readiness 与 implementation-unit completeness。
- 保留 CE 的 reviewer 结构：4 个 structured always-on persona、2 个 always-on local prompt assets、cross-cutting / stack-specific conditional persona、migration-specific `deployment-verification-agent`。
- 保留 CE 的 Stage 3c small-diff lite gate：低风险小 diff 可收缩 roster，`depth:full` 可强制 full roster。
- 保留 CE 的跨模型 adversarial pass：通过 `scripts/cross-model-adversarial-review.sh` 调用 peer Codex/Claude，非阻塞写入 `adversarial-<peer>.json`。
- 保留 CE 的 repo-profile cache：`repo-profiler` 只产 question-agnostic profile，`repo-profile-cache.py` 只做 deterministic get/put，不把语义判断放进脚本。
- 保留 CE 的 Stage 5 synthesis：schema normalization、dedup、confidence/action-class routing、independent validator、safe apply、Coverage 与 JSON/Markdown 双输出。

#### Intentional Spec-First Divergences

- `ce-code-review`、`ce-work`、`ce-brainstorm`、`ce-plan`、`ce-doc-review`、`ce-simplify-code`、`ce-compound`、`ce-commit` 等入口和消费者投影为 `spec-*`。
- `/tmp/compound-engineering/ce-code-review` 投影为 `/tmp/spec-first/spec-code-review`。
- `/tmp/compound-engineering/repo-profile` 投影为 `/tmp/spec-first/repo-profile`。
- `.compound-engineering` 投影为 `.spec-first`。
- `artifact_contract: ce-unified-plan/v1` 投影为 `artifact_contract: spec-unified-plan/v1`。
- `CE local prompt assets` / `CE conditional local prompt assets` 等术语投影为 `spec-first local prompt assets`。
- `learnings-researcher.md` 的 module search 从 `compound-engineering|skill-design` 投影为 `spec-first|skill-design`。

#### Test Contract Cleanup

- 删除 `skills/spec-code-review/evals/examples.json`：CE `ce-code-review` 中不存在该 eval，不能用上一版 spec-first-only examples-as-context 限制 CE-first 主流程。
- 删除 `references/bulk-preview.md`、`references/tracker-defer.md`、`references/walkthrough.md`、`scripts/resolve-base.sh`：这些是旧 spec-first contract 的运行时依赖，CE 真相源未定义；迁移后不作为 active local asset。
- 若后续 focused test 因上述旧文件或旧模式失败，应按用户裁决删除或收窄测试，不反向恢复 CE 中不存在的行为。

#### Verification Status

- 已逐个打开 `skills/spec-code-review` 下 29 个 source 文件审查：`SKILL.md`、9 个顶层 `references/*.md` / schema / template 文件、16 个 `references/personas/*.md`、`references/agents/repo-profiler.md` 和 2 个 scripts。
- 已运行 CE/spec 目录 diff，确认差异集中在 `ce-*` -> `spec-*`、`.compound-engineering` -> `.spec-first`、`/tmp/compound-engineering/...` -> `/tmp/spec-first/...`、artifact contract 和 local prompt asset 术语的必要投影。
- 已运行 focused residual scan，确认 `skills/spec-code-review` 没有 active CE 命名、`.compound-engineering` 或 `/tmp/compound-engineering` 残留。
- 已核对 CE/spec 文件数量与文件名集合：两侧均为 29 个文件，集合一致。
- 已运行 `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile skills/spec-code-review/scripts/repo-profile-cache.py`。
- 已运行 `bash -n skills/spec-code-review/scripts/cross-model-adversarial-review.sh`。
- 已运行 `npm run lint:skill-entrypoints`。
- 已运行 `npx jest tests/unit/repo-profile-cache-parity.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/changelog-format.test.js --runInBand`。
- 已运行 `git diff --check -- CHANGELOG.md docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md skills/spec-code-review`。

### `ce-ideate` -> `spec-ideate`

#### Verdict

- status: replaced
- risk: high
- decision: 按用户裁决，`spec-ideate` 清空后完整拷贝 CE `ce-ideate` source 文件，再做最小 spec-first 投影。保留 CE 的 `output:md` / HTML 默认输出、自动写 ideation artifact、`references/divergent-ideation.md`、`references/ideation-sections.md`、`references/html-rendering.md`、`references/markdown-rendering.md`、fresh-context basis verifier、axis decomposition / recovery、auto-write 后再菜单化 handoff 的主流程。不保留上一版 spec-first 的 opt-in persistence、Proof HITL sync-back、project-graph consumer boundary 和 Workflow Contract Summary 作为 `spec-ideate` active contract。

#### Source Files Read

- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/SKILL.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/agents/*.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/divergent-ideation.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/html-rendering.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/ideation-sections.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/markdown-rendering.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/post-ideation-workflow.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/repo-profile-cache.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/universal-ideation.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/references/web-research-cache.md`
- CE: `/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-ideate/scripts/repo-profile-cache.py`
- spec-first: `skills/spec-ideate/SKILL.md`
- spec-first: `skills/spec-ideate/references/agents/*.md`
- spec-first: `skills/spec-ideate/references/*.md`
- spec-first: `skills/spec-ideate/scripts/repo-profile-cache.py`

#### Preserved Capabilities

- 保留 CE 的输出模式解析：`output:md`、plain-language markdown/HTML request、用户偏好、`.spec-first/config.local.yaml` 中 `ideate_output`、默认 HTML、pipeline 强制 markdown。
- 保留 CE 的自动持久化：Phase 4 自动写 ideation artifact，repo / existing `docs/ideation/` 写入项目文档，否则写入 `/tmp/spec-first/spec-ideate/<run-id>/`。
- 保留 CE 的 artifact section contract：metadata、Grounding Context、Topic Axes、Ranked Ideas、Rejection Summary，以及 markdown / HTML exclusive rendering references。
- 保留 CE 的发散生成拆分：Phase 2 必读 `references/divergent-ideation.md`，其中包含 fleet tiering、dispatch payload、ambition charter、six frames、basis contract、axis recovery 和 raw-candidates checkpoint。
- 保留 CE 的 adversarial filtering：fresh-context basis verifier 先审，orchestrator 再裁决；`go deep` 可加第二 critic。
- 保留 CE 的 universal ideation：非软件 elsewhere topics 使用 domain-native facilitation，同时保留 axis decomposition、basis verifier 和自动写 artifact 的 wrap-up。
- 保留 CE 的 next-step menu：Open / Publish to Proof、Brainstorm one idea、Discuss/refine、Done；brainstorm handoff 使用 focused seed，不传整份文件。

#### Intentional Spec-First Divergences

- `ce-ideate` / `ce-brainstorm` / `ce-plan` / `ce-work` / `ce-doc-review` / `ce-proof` 等入口和消费者投影为 `spec-*`。
- `.compound-engineering/config.local.yaml` 投影为 `.spec-first/config.local.yaml`。
- `/tmp/compound-engineering/ce-ideate` 和 `/tmp/compound-engineering/repo-profile` 投影为 `/tmp/spec-first/spec-ideate` 和 `/tmp/spec-first/repo-profile`。
- Proof identity 投影为 `ai:spec-first` / `Spec-First`。
- `learnings-researcher.md` 的 module search 从 `compound-engineering|skill-design` 投影为 `spec-first|skill-design`。

#### Test Contract Cleanup

- 删除 `tests/unit/spec-ideate-contracts.test.js`：该测试锁定上一版 spec-first-only opt-in persistence、Proof HITL sync-back、OS temp root、Dispatch Boundary、project-graph boundary 等行为，已与 CE-first 裁决冲突。
- 删除 `tests/unit/public-workflow-contract-summary.test.js`：该测试要求所有 public workflow 都有 `Workflow Contract Summary`，但当前 CE-first 迁移明确不为 `spec-ideate` 及若干 CE-derived skill 强加 CE 中不存在的 summary 包装。
- 收窄 `tests/unit/project-graph-consumption-contracts.test.js`：移除 `spec-ideate` 作为 project-graph consumer 的断言，避免把 spec-first-only provider boundary 恢复进 CE-first `spec-ideate`。

#### Verification Status

- 已逐个打开 `skills/spec-ideate` 下 15 个 source 文件审查：`SKILL.md`、9 个 `references/*.md`、5 个 `references/agents/*.md` 和 `scripts/repo-profile-cache.py`。
- 已运行 CE/spec 目录 diff，确认差异集中在 `ce-*` -> `spec-*`、`.compound-engineering` -> `.spec-first`、`/tmp/compound-engineering/...` -> `/tmp/spec-first/...`、Proof identity 和 learnings module search 的必要投影。
- 已运行 focused residual scan，确认 `skills/spec-ideate` 没有 active CE 命名、`.compound-engineering` 或 `/tmp/compound-engineering` 残留。
- 已运行 `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile skills/spec-ideate/scripts/repo-profile-cache.py`。
- 已运行 `npm run lint:skill-entrypoints`。
- 已运行 `npx jest tests/unit/project-graph-consumption-contracts.test.js tests/unit/migrated-skill-scripts-contracts.test.js tests/unit/repo-profile-cache-parity.test.js tests/unit/changelog-format.test.js --runInBand`。
- 已运行 `git diff --check -- CHANGELOG.md docs/validation/2026-07-08-ce-to-spec-first-skill-audit-plan.md skills/spec-ideate tests/unit/project-graph-consumption-contracts.test.js tests/unit/spec-ideate-contracts.test.js tests/unit/public-workflow-contract-summary.test.js`。

## 推荐报告产物

逐 skill review 完成后产出一份合并审查报告：

```text
docs/validation/YYYY-MM-DD-ce-to-spec-first-skill-audit-report.md
```

如果后续修复较大，按 workflow cluster 拆成聚焦 source changes：

- requirements/planning chain：`spec-brainstorm`、`spec-plan`、`spec-doc-review`
- review/execution chain：`spec-code-review`、`spec-work`、`spec-lfg`
- knowledge/debug chain：`spec-debug`、`spec-compound`、`spec-compound-refresh`
- feedback/setup/support chain：`spec-sweep`、`spec-mcp-setup`、browser/Xcode/proof/commit helpers

## 验证计划

对审查报告：

- 对 report 和 changelog 运行 `git diff --check`。
- 运行 `npx jest tests/unit/changelog-format.test.js --runInBand`。

对后续 source fixes：

- 始终更新 `CHANGELOG.md`。
- 运行 `npm run lint:skill-entrypoints`。
- 若存在 touched skill 的 focused contract tests，则运行它们。
- 如果 runtime capability catalog 输入变化，运行 `npm run docs:runtime-catalog`。
- 只有在 source fixes 后确实需要刷新 runtime mirrors 时才运行 `spec-first init`；不要手改 runtime mirrors。
- 对高影响 skill prose changes，如果语义行为重要且 host dispatch 可用，使用 fresh-source eval 或 independent review。若不可用，记录 degraded reason，不声称通过。

## 风险与反模式

- **False parity：** 把文件或名称匹配当作语义等价。
- **False drift：** 把 `spec-prd` 或 `spec-write-tasks` 等有意识的 spec-first 拆分误判为 CE 行为缺失。
- **Stale compatibility as contract：** 留下用户可能照着执行的 `ce-*` 示例。
- **Runtime mirror patching：** 通过编辑 generated mirrors 修复 skill 行为。
- **Over-scripted semantics：** 用 deterministic scans 裁决语义充分性，而不是把它们作为 LLM 判断的事实输入。
- **Downstream breakage：** 在未确认 `spec-plan`、`spec-doc-review`、`spec-work`、`spec-lfg` consumers 的情况下修改 brainstorm 或 plan artifact contracts。

## 完成标准

当每个映射 CE skill 都具备以下内容时，本审查完成：

- CE 与 spec-first 两侧 source files 均已读取。
- 有带 risk level 的 verdict。
- 明确保留、漂移和有意识 divergence 的 capability notes。
- 旧 CE residuals 已分类。
- Recommended changes 已归类为 `fix`、`restore`、`rewrite`、`document_divergence` 或 `no_action`。
- 记录 focused verification recommendations。
- 记录 downstream consumer impact。
