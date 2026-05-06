# ECC 打包后功能验证指南

本文用于验证 `spec-first` 打包安装后，ECC 治理后的专家能力包是否在当前阶段按预期生效。

当前阶段的目标不是把 ECC 原始 agents / skills / commands 自动安装进运行时，而是验证：

```text
ECC 治理后的专家能力包
  -> 以只读 advisory facts 接入 spec-first workflow source
  -> 不替代 Skill 的专家选择、合成和最终裁判
  -> 不新增 /ecc:* 或 $ecc-* 命令
  -> 不复制 ECC 原始 runtime agent
  -> 不手写 .claude / .codex / .agents/skills generated runtime
```

## 1. 验证口径

### 1.1 当前应当通过的能力

打包后应验证这些能力：

```text
package 包含 ECC pilot scripts
spec-first init 能投递带 ECC pilot 指引的 workflow SKILL.md
spec-code-review / spec-plan / spec-doc-review / spec-skill-audit 能看到 ECC pilot 入口
pilot script 输出 decision_boundary
pilot script 明确 requires_skill_decision
pilot script 不输出 selected_agents
pilot script 不输出 final_verdict
pilot script 不允许 connector query
pilot script 不做 runtime delivery
```

### 1.2 当前不应当出现的能力

当前阶段不应出现：

```text
/ecc:* slash command
$ecc-* Codex skill command
ecc-* / ce-* runtime agent 文件
ECC 原始 agents 全量复制到 agents/
ECC 原始 skills 全量复制到 skills/
打包安装后自动执行 ECC agent
打包安装后自动写 repo-profile / confirmed standards
打包安装后自动写 .claude / .codex / .agents/skills 之外的 ECC runtime pack state
```

### 1.3 当前已知边界

截至 V9B，`scripts/prepare-ecc-code-review-pilot-brief.js` 和 `scripts/prepare-ecc-workflow-pilot-brief.js` 已进入 npm package files。

但普通 tarball 安装后的完整 candidate facts 还依赖这些 generated governance artifacts：

```text
docs/02-架构设计/ECC集成/generated/agent-registry.json
docs/02-架构设计/ECC集成/generated/agent-packs.json
docs/02-架构设计/ECC集成/generated/router-candidate-policy.json
```

如果这些 generated artifacts 未进入发布包，pilot script 应当 graceful degraded：

```text
router_candidate_facts = null
component_status.router_candidates.available = false
degraded_mode.enabled = true
```

这说明 runtime 指引和脚本已生效，但 package 内 candidate facts 尚未完整可用。后续如要让打包安装后的普通项目也直接生成 `candidate_agents`，需要把治理后的 machine-readable artifacts 纳入可发布 source，或迁移到 `src/cli/contracts/agent-registry/` 等 package source 路径。

## 2. 准备 tarball 安装环境

在 `spec-first` 仓库根目录执行：

```bash
cd /Users/kuang/xiaobu/spec-first

TMP_DIR=$(mktemp -d)
TARBALL=$(npm pack --pack-destination "$TMP_DIR" --silent)

mkdir -p "$TMP_DIR/project"
cd "$TMP_DIR/project"

npm init -y >/dev/null
npm install "$TMP_DIR/$TARBALL"
```

记录安装后的 package root：

```bash
PKG_ROOT=$(node -p "const path=require('path'); path.dirname(require.resolve('spec-first/package.json'))")
echo "$PKG_ROOT"
```

## 3. 验证 package 内容

### 3.1 验证 pilot scripts 已打包

```bash
test -f "$PKG_ROOT/scripts/prepare-ecc-code-review-pilot-brief.js" \
  && echo "code-review pilot script OK"

test -f "$PKG_ROOT/scripts/prepare-ecc-workflow-pilot-brief.js" \
  && echo "workflow pilot script OK"
```

预期：

```text
code-review pilot script OK
workflow pilot script OK
```

### 3.2 验证 machine-readable governance artifacts 是否已打包

```bash
for file in \
  "docs/02-架构设计/ECC集成/generated/agent-registry.json" \
  "docs/02-架构设计/ECC集成/generated/agent-packs.json" \
  "docs/02-架构设计/ECC集成/generated/router-candidate-policy.json"
do
  if test -f "$PKG_ROOT/$file"; then
    echo "present: $file"
  else
    echo "missing: $file"
  fi
done
```

如果输出 `missing`，当前 package 只能验证 workflow 指引和 graceful degraded，不能验证完整 `candidate_agents`。

## 4. 验证 Codex runtime 投递

初始化 Codex runtime：

```bash
npx spec-first init --codex -u verify --lang zh
npx spec-first doctor --codex
```

验证 workflow source 已投递到 `.agents/skills/`：

```bash
rg -n "ECC Governance Pilot Facts|ECC governance pilot facts|prepare-ecc-code-review-pilot-brief|prepare-ecc-workflow-pilot-brief" \
  .agents/skills/spec-code-review/SKILL.md \
  .agents/skills/spec-plan/SKILL.md \
  .agents/skills/spec-doc-review/SKILL.md \
  .agents/skills/spec-skill-audit/SKILL.md
```

预期至少看到：

```text
.agents/skills/spec-code-review/SKILL.md: prepare-ecc-code-review-pilot-brief
.agents/skills/spec-plan/SKILL.md: prepare-ecc-workflow-pilot-brief
.agents/skills/spec-doc-review/SKILL.md: prepare-ecc-workflow-pilot-brief
.agents/skills/spec-skill-audit/SKILL.md: prepare-ecc-workflow-pilot-brief
```

## 5. 验证 Claude runtime 投递

如需验证 Claude Code runtime：

```bash
mkdir -p "$TMP_DIR/claude-project"
cd "$TMP_DIR/claude-project"

npm init -y >/dev/null
npm install "$TMP_DIR/$TARBALL"

npx spec-first init --claude -u verify --lang zh
npx spec-first doctor --claude
```

验证 workflow source 已投递到 `.claude/skills/`：

```bash
rg -n "ECC Governance Pilot Facts|ECC governance pilot facts|prepare-ecc-code-review-pilot-brief|prepare-ecc-workflow-pilot-brief" \
  .claude/skills/spec-code-review/SKILL.md \
  .claude/skills/spec-plan/SKILL.md \
  .claude/skills/spec-doc-review/SKILL.md \
  .claude/skills/spec-skill-audit/SKILL.md
```

## 6. 验证 code-review pilot 输出

```bash
node "$PKG_ROOT/scripts/prepare-ecc-code-review-pilot-brief.js" \
  --changed-file src/auth/session.ts \
  --risk-signal auth \
  > /tmp/ecc-code-review.json

jq '{
  schema_version,
  workflow,
  runtime_delivery: .decision_boundary.runtime_delivery,
  requires_skill_decision: .decision_boundary.requires_skill_decision,
  router_candidate_is_not_selection: .decision_boundary.router_candidate_is_not_selection,
  optional_candidate_is_not_activation: .decision_boundary.optional_candidate_is_not_activation,
  connector_queries_allowed: .decision_boundary.connector_queries_allowed,
  has_selected_agents: has("selected_agents"),
  has_final_verdict: has("final_verdict"),
  router_available: .component_status.router_candidates.available,
  candidate_count: (.router_candidate_facts.candidate_agents // [] | length),
  degraded_mode
}' /tmp/ecc-code-review.json
```

最低可接受预期：

```json
{
  "schema_version": "spec-first.code-review-pilot-brief.v1",
  "workflow": "spec-code-review",
  "runtime_delivery": "none_in_v9a",
  "requires_skill_decision": true,
  "router_candidate_is_not_selection": true,
  "optional_candidate_is_not_activation": true,
  "connector_queries_allowed": false,
  "has_selected_agents": false,
  "has_final_verdict": false
}
```

完整 candidate facts 生效时，还应看到：

```json
{
  "router_available": true,
  "candidate_count": 1
}
```

如果 generated governance artifacts 未打包，可能看到：

```json
{
  "router_available": false,
  "candidate_count": 0,
  "degraded_mode": {
    "enabled": true
  }
}
```

这种结果表示脚本和边界生效，但 candidate facts 未完整生效。

## 7. 验证 plan / doc-review / skill-audit pilot 输出

### 7.1 spec-plan

```bash
node "$PKG_ROOT/scripts/prepare-ecc-workflow-pilot-brief.js" \
  --workflow spec-plan \
  --target-path README.md \
  --risk-signal architecture \
  > /tmp/ecc-plan.json

jq '{
  schema_version,
  workflow,
  runtime_delivery: .decision_boundary.runtime_delivery,
  requires_skill_decision: .decision_boundary.requires_skill_decision,
  router_candidate_is_not_selection: .decision_boundary.router_candidate_is_not_selection,
  has_selected_agents: has("selected_agents"),
  has_final_verdict: has("final_verdict"),
  router_available: .component_status.router_candidates.available,
  candidate_count: (.router_candidate_facts.candidate_agents // [] | length),
  degraded_mode
}' /tmp/ecc-plan.json
```

最低可接受预期：

```json
{
  "schema_version": "spec-first.workflow-pilot-brief.v1",
  "workflow": "spec-plan",
  "runtime_delivery": "none_in_v9b",
  "requires_skill_decision": true,
  "router_candidate_is_not_selection": true,
  "has_selected_agents": false,
  "has_final_verdict": false
}
```

### 7.2 spec-doc-review

```bash
node "$PKG_ROOT/scripts/prepare-ecc-workflow-pilot-brief.js" \
  --workflow spec-doc-review \
  --target-path README.md \
  --risk-signal architecture \
  > /tmp/ecc-doc-review.json

jq '{
  schema_version,
  workflow,
  runtime_delivery: .decision_boundary.runtime_delivery,
  router_available: .component_status.router_candidates.available,
  candidate_count: (.router_candidate_facts.candidate_agents // [] | length),
  degraded_mode
}' /tmp/ecc-doc-review.json
```

### 7.3 spec-skill-audit

```bash
node "$PKG_ROOT/scripts/prepare-ecc-workflow-pilot-brief.js" \
  --workflow spec-skill-audit \
  --context-path skills/ \
  --risk-signal harness_governance \
  > /tmp/ecc-skill-audit.json

jq '{
  workflow,
  runtime_delivery: .decision_boundary.runtime_delivery,
  graph: .component_status.graph_expert_brief,
  optional: .component_status.optional_pack_brief,
  degraded_mode
}' /tmp/ecc-skill-audit.json
```

`spec-skill-audit` 的预期行为：

```text
graph.skipped = true
graph.reason_code = unsupported_for_workflow
optional.skipped = true
optional.reason_code = unsupported_for_workflow
```

这说明 `spec-skill-audit` 当前只消费 router + standards facts，graph / optional pack 被明确跳过，不算失败。

## 8. 验证没有 ECC runtime 污染

### 8.1 没有新增 ECC 命令

在已初始化的项目中执行：

```bash
rg -n '(/ecc:|\$ecc-)' .agents .codex .claude AGENTS.md CLAUDE.md 2>/dev/null || true
```

预期无命中。

### 8.2 没有复制 ECC 原始 agent

Codex：

```bash
find .codex/agents -maxdepth 1 -type f \( -name 'ecc-*' -o -name 'ce-*' \) 2>/dev/null
```

Claude：

```bash
find .claude/agents -maxdepth 1 -type f \( -name 'ecc-*' -o -name 'ce-*' \) 2>/dev/null
```

预期无输出。

### 8.3 没有手写 generated runtime 源修复

在 `spec-first` 源码仓库中执行：

```bash
git status --short .claude .codex .agents/skills .spec-first
```

预期无输出。

## 9. 判定表

| 验证项 | 通过标准 | 当前阶段含义 |
| --- | --- | --- |
| package scripts | `prepare-ecc-code-review-pilot-brief.js` 和 `prepare-ecc-workflow-pilot-brief.js` 存在 | package 已携带 pilot 执行器 |
| workflow runtime 指引 | `.agents/skills` 或 `.claude/skills` 中能搜到 ECC pilot 章节 | `init` 后 workflow 能看到 ECC advisory facts 入口 |
| decision boundary | 输出 `requires_skill_decision=true`、`runtime_delivery=none_in_v9a/v9b` | 脚本没有替代 Skill 裁判 |
| forbidden fields | 顶层无 `selected_agents` / `final_verdict` | 没有让脚本做最终语义选择 |
| no ECC commands | 无 `/ecc:*` / `$ecc-*` | 没有创建第二套 ECC command 面 |
| no raw ECC agents | 无 `ecc-*` / `ce-*` runtime agent | 没有复制 ECC 原始 agent |
| candidate facts | `router_available=true` 且 `candidate_count>0` | 完整候选事实可用 |
| graceful degraded | `router_available=false` 且 `degraded_mode.enabled=true` | 脚本可运行，但 package 缺 generated facts 或证据降级 |

## 10. 当前验收结论模板

如果只验证当前 V9B 最小目标，可以使用：

```text
通过：打包后 init 可投递 ECC pilot workflow 指引；pilot scripts 可运行并输出 decision_boundary；没有 selected_agents/final_verdict；没有 /ecc:* 或 $ecc-*；没有复制 ECC 原始 runtime agents。
限制：candidate facts 是否完整可用取决于 generated governance artifacts 是否进入 package。若缺失，当前表现为 graceful degraded，后续需要 packaging/source path 修复。
```

如果要求打包安装后普通项目也能直接生成候选专家，则必须满足：

```text
agent-registry.json present
agent-packs.json present
router-candidate-policy.json present
router_available = true
candidate_count > 0
degraded_mode 不包含 router_candidate_unavailable
```
