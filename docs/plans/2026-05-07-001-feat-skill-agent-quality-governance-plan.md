---
title: "feat: 建立高风险执行边界与高杠杆 Workflow Examples Baseline"
type: feat
status: completed
date: 2026-05-07
revision: 7
last_updated: 2026-05-14T00:45+08:00
target_repo: spec-first
spec_id: 2026-05-07-001-skill-agent-quality-governance
scope: Phase A closure + minimal Phase B
origin: docs/项目审查/2026-05-07-skill-agent-prompt-expert-review.md
referenced_reviews:
  - path: docs/项目审查/2026-05-07-skill-agent-prompt-expert-review.md
    role: origin
    scope: in
  - path: docs/项目审查/2026-05-07-source-code-comprehensive-review.md
    role: cross-reference
    scope: deferred
    deferred_findings: ["P1-1", "P1-2", "P1-4", "P1-5", "P1-6"]
    followup_plan: docs/plans/2026-05-08-001-source-code-deferred-tracker.md
---

# feat: 建立高风险执行边界与高杠杆 Workflow Examples Baseline

## 1. 背景

spec-first 的核心定位不是单点 prompt 集合，而是一套面向 AI 辅助研发的 workflow harness。

项目主链路是：

```text
Codebase -> Graph -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

当前项目已经具备较完整的 skill / agent / workflow 基础，但随着能力增多，出现了三类需要治理的问题：

1. **高风险执行边界不够清晰**
   worktree、delegation、git staging、secrets、外部服务调用等路径会真实影响用户工作区和提交内容。如果缺少明确边界，AI 执行路径可能把无关文件、敏感文件或 runtime mirror 一起带入修改。

2. **长 prompt 缺少高质量 examples 支撑**
   skill prompt 越来越长，但缺少少量稳定、真实、可复用的 trigger / boundary / failure / expected posture 样例，导致后续修改难以判断是否破坏入口选择、执行姿态或边界。

3. **agent 输出和研究证据缺少统一语言**
   reviewer、researcher、writer/strategist 不应强行使用同一 JSON schema，但需要有最小输出契约，方便 workflow synthesis 区分事实、判断、假设、建议、社交信号与风险。

本方案不把 spec-first 改造成重状态机、中心化 gate 系统或复杂规则平台，而是坚持：

```text
Light contract
Explicit boundaries
Scripts prepare, LLM decides
```

---

## 2. 核心结论

本方案**值得做，但必须克制做**。

当前交付范围只包含：

```text
Phase A：关闭真实安全风险与 deterministic drift
Phase B：建立最小薄契约 + 三个高杠杆 workflow examples baseline
```

当前不做：

```text
不做完整治理平台
不做 eval platform
不做 LLM-as-judge
不做 canonical eval schema
不做 prompt-source lint
不新增 competitive intelligence researcher
不迁移所有 researcher agent
不要求所有 agent 输出同一 JSON schema
不要求 8 个 workflow ready
```

最终交付目标是：

```text
真实执行风险被关掉
关键 workflow 有 examples-as-context
skill/agent 有统一的最小边界语言
后续扩展仍保持轻契约，不膨胀成治理平台
```

---

## 3. 目标

### 3.1 业务目标

1. 提升 spec-first 在真实用户仓库中的执行安全性。
2. 降低 AI 修改过程中误提交、误 stage、误传播 secrets 的风险。
3. 降低长 prompt 漂移带来的 workflow 行为退化。
4. 让核心 workflow 的入口选择、执行边界、失败降级更稳定。
5. 为后续 skill / agent 演化提供统一但轻量的契约语言。

### 3.2 工程目标

1. `git-worktree` / `spec-optimize` 默认不复制 `.env*`。
2. `spec-work-beta` delegation 成功路径不再无界 stage 文件。
3. `expected_side_effects` 成为 task-pack 的显式副作用白名单。
4. secret deny pattern 具备集中 source 和 contract tests。
5. 新增一个 human-readable thin contract 文档。
6. 为 `using-spec-first`、`spec-work`、`spec-doc-review` 增加 examples baseline。
7. 所有 source-mod 必须有 focused tests 和 CHANGELOG 记录。

---

## 4. 非目标

本方案明确不做以下内容：

| 非目标                                     | 原因                             |
| --------------------------------------- | ------------------------------ |
| 不把 spec-first 改成状态机                     | 违背 Light contract 与 LLM 语义判断定位 |
| 不建立中心化治理平台                              | 当前问题是边界与 examples，不是平台缺失       |
| 不做 LLM-as-judge                         | 当前 examples 是上下文，不是自动语义验收      |
| 不做全量 eval platform                      | 成本高，收益未验证                      |
| 不要求 8 个 workflow ready                  | 容易制造 readiness 误报              |
| 不一次性重写所有 skill / agent                  | 风险大，收益分散                       |
| 不改 generated runtime mirror             | 坚持 source-first                |
| 不创建 competitive intelligence researcher | 当前没有明确 consumer                |
| 不做 prompt-source lint                   | 当前还没稳定到需要 lint 平台              |
| 不迁移 researcher authority                | 等有明确下游 consumer 再做             |

---

## 5. 总体设计

### 5.1 当前交付闭环

```text
Phase A
  -> U1 Worktree env handling closure
  -> U2 Delegation staging boundary closure
  -> U3 Deterministic prompt/script drift quick wins

Phase B
  -> U4 Skill/Agent quality thin contract
  -> U5 Minimal prompt examples baseline
```

### 5.2 后续延后能力

```text
Deferred
  -> U6 spec-work / spec-work-beta parity
  -> U7 researcher / agent output migration
  -> U8 prompt-source drift lint
```

### 5.3 设计原则

1. **先修执行风险，再补治理契约**
   会真实影响用户 workspace、secrets、commit 的问题优先级最高。

2. **先 source contract，再 runtime mirror**
   所有修改发生在 `skills/`、`agents/`、`src/cli/`、`tests/` 等 source 层，不手改 `.claude/`、`.codex/`、`.agents/skills/` runtime mirror。

3. **examples 是上下文，不是验收平台**
   examples 用于帮助 LLM 和 reviewer 判断边界，不代表 semantic pass。

4. **脚本只校验确定性事实**
   JSON shape、字段非空、危险 pattern、path safety 可以由脚本校验；语义质量仍由 LLM / reviewer 判断。

5. **薄契约优先，机器 schema 延后**
   除非 downstream consumer 真正需要机器可读字段，否则不拆多套 schema。

---

## 5.4 执行状态校准

本计划是活文档，后续执行必须以当前 source 事实为准，不能把 plan-prose 当成已执行证据，也不能重复实现已落地的 source-mod。

### 5.4.1 执行前源码事实（历史快照）

以下是本轮 `$spec-work` 进入 Phase A closure 前的校准快照，用于解释为什么 U1/U2 以 regression review 和 focused tests 为主，而不是从零重做：

```text
U1 已有 source-mod：git-worktree / spec-optimize env copy 已改为 --copy-env opt-in。
U2 已有 source-mod：spec-work-beta staging 已改为 batch-owned files ∪ expected_side_effects，task-pack validator 与 secret deny pattern source 已存在。
U3 尚未按本计划关闭。
U4 尚未落地。
U5 尚未落地。
```

当时的执行重点是：

```text
1. 对 U1/U2 做 regression review 与 focused tests，确认现有 source 仍满足本计划边界。
2. 补完 U3 deterministic drift quick wins。
3. 交付 U4 thin contract。
4. 交付 U5 prompt examples baseline。
```

Phase A closure 不是从零重做 U1/U2；它要求保留现有 source-mod、补齐剩余 U3，并用回归测试证明 U1/U2 没有漂移。

### 5.4.2 完成态校准

截至本计划标记为 `completed`：

```text
U1 已落地并经 review 补强：git-worktree 与 spec-optimize env copy 默认关闭，opt-in 路径写入不含内容的审计记录；spec-optimize shared_file 复制新增 repo-relative、realpath containment 与 secret-deny 边界。
U2 已落地并经 review 补强：secret deny allowlist 精确路径规则进入 deterministic schema validation，并保留 batch-owned files ∪ expected_side_effects staging 边界。
U3 已落地：agent-native-audit option drift 与 Shared Workspace typo 修正，gemini-imagegen 默认模型和文件格式文档收敛。
U4 已落地：docs/contracts/workflows/skill-agent-quality-governance.md 成为薄契约边界文档，并进入 docs index 与 contract tests。
U5 已落地：using-spec-first / spec-work / spec-doc-review prompt examples baseline 存在，并由对应 SKILL.md 以 examples-as-context 方式引用；它们不是 readiness gate 或 eval platform。
```

---

# 6. Phase A：关闭高风险执行边界与确定性漂移

---

## 6.1 U1：Worktree Env Handling Closure

### 目标

worktree 创建默认不复制 secrets，并且 Phase A 不遗漏同类 `.env*` 默认复制路径。

### 涉及范围

```text
skills/git-worktree/SKILL.md
skills/git-worktree/scripts/worktree-manager.sh
skills/spec-optimize/scripts/experiment-worktree.sh
tests/unit/git-worktree-contracts.test.js
tests/unit/high-risk-execution-contracts.test.js
CHANGELOG.md
```

### 设计要求

#### 6.1.1 默认不复制 `.env*`

默认 create 路径必须满足：

```text
不复制 .env*
不读取 .env* 内容
只提示 env files were not copied
提示用户如确需复制，显式使用 --copy-env
```

#### 6.1.2 显式 opt-in

复制 env 必须显式：

```bash
create --copy-env <branch-name> [from-branch]
```

`--copy-env` 路径要求：

```text
复制 .env*，但跳过 .env.example / .env.template / .env.sample
复制前输出待复制文件名清单
不得输出文件内容
已有目标 env 文件时只在 opt-in 路径做备份
```

#### 6.1.3 `.env-copy.log` 审计

`--copy-env` 必须写入 worktree-local 审计记录：

```text
.worktrees/<name>/.env-copy.log
```

字段：

```text
timestamp
source_path
destination_path
size_bytes
sha256_8
```

禁止：

```text
禁止记录文件内容
禁止记录完整 secret
禁止覆盖历史记录
禁止进入 git commit
```

`.env-copy.log` 必须通过以下任一方式排除：

```text
worktree-local git exclude
worktree .gitignore
全局 .gitignore
```

#### 6.1.4 U1 ↔ U2 安全互锁

即使用户显式 `--copy-env`，后续 staging 仍默认拒绝 env 文件。

只有同时满足以下条件才允许让步：

```text
expected_side_effects 精确声明具体 env 文件路径
IU 明确说明本次意图就是修改 env
secret deny allowlist 精确匹配该路径
```

禁止通过 glob 放行：

```text
.env*
**/.env*
**/*secret*
**/*credentials*
```

### 测试要求

`tests/unit/git-worktree-contracts.test.js` 必须覆盖：

1. 默认 create 不复制 env。
2. `--copy-env` 才复制 env。
3. `.env.example` 被跳过。
4. `.env-copy.log` 存在且不含内容。
5. `.env-copy.log` append-only。
6. `.env-copy.log` 不进入 commit。
7. 目标 env 备份只发生在 opt-in 路径。
8. SKILL.md 不再把复制 env 描述成默认行为。

`tests/unit/high-risk-execution-contracts.test.js` 必须覆盖：

1. 扫描 `skills/*/scripts/*`。
2. 扫描高风险 skill prose。
3. 发现默认 `.env*` / credential propagation 时失败。
4. 允许显式 opt-in。
5. 允许登记过的 deferred risk，但必须有 owner / reason / blocking condition。

### 验收命令

```bash
bash -n skills/git-worktree/scripts/worktree-manager.sh
bash -n skills/spec-optimize/scripts/experiment-worktree.sh

npx jest \
  tests/unit/git-worktree-contracts.test.js \
  tests/unit/high-risk-execution-contracts.test.js \
  --runInBand
```

### 退出条件

```text
默认路径无 env copy
--copy-env 是唯一 opt-in 路径
.env-copy.log 不含内容且不进入 commit
spec-optimize 不存在默认 env copy
contract test 可阻止新增默认 secret propagation
CHANGELOG 已记录
```

---

## 6.2 U2：Bound Delegation Staging Closure

### 目标

`spec-work-beta` delegation 成功路径不能 stage unrelated modified/untracked files。

### 涉及范围

```text
skills/spec-work-beta/references/codex-delegation-workflow.md
skills/spec-write-tasks/references/task-pack-schema.md
src/cli/task-pack.js
src/cli/contracts/security/secret-deny-patterns.json
src/cli/contracts/security/secret-deny-patterns.schema.json
tests/unit/spec-work-beta-contracts.test.js
tests/unit/secret-deny-patterns-contracts.test.js
tests/unit/task-pack-command.test.js
tests/unit/spec-write-tasks-contracts.test.js
CHANGELOG.md
```

### 设计要求

#### 6.2.1 移除无界 staging

禁止成功路径使用：

```bash
git add $(git diff --name-only HEAD; git ls-files --others --exclude-standard)
```

必须改为：

```text
actual_diff ⊆ batch_owned_files ∪ expected_side_effects
```

### 6.2.2 batch-owned set 定义

batch-owned set 来自：

```text
plan / tasks 中分配给当前 batch 的 Files 列表
result JSON 中 files_modified 且属于上述 Files 列表的路径
expected_side_effects 显式声明的合法副作用路径
```

### 6.2.3 out-of-batch diff 处理

如果实际 diff 中出现 batch 外文件：

```text
立即停止 commit
不得 silent auto-stage
surface 给 orchestrator 决策
```

orchestrator 只能三选一：

```text
extend-batch：扩展当前 batch 范围，并补充理由
drop-stray：丢弃 stray diff
abort：停止当前 batch
```

### 6.2.4 expected_side_effects 规则

`expected_side_effects` 是 task-pack 的显式字段：

```json
{
  "expected_side_effects": [
    "package-lock.json",
    "tests/fixtures/generated-output.json"
  ]
}
```

允许：

```text
repo-relative exact path
bounded glob
```

禁止：

```text
**
/absolute/path
../escape
~
空字符串
```

### 6.2.5 secret deny pattern

新增集中 source：

```text
src/cli/contracts/security/secret-deny-patterns.json
```

必须覆盖：

```text
.env
.env.*
*.pem
*.key
id_rsa*
id_ed25519*
*.p12
*.pfx
*.keystore
.npmrc
.pypirc
.netrc
.git-credentials
.aws/credentials
.aws/config
google-services.json
GoogleService-Info.plist
*serviceAccount*.json
firebase-adminsdk-*.json
**/*token*
**/*secret*
**/*credentials*
**/*password*
**/*apikey*
**/*api_key*
*.mobileprovision
*.cer
```

例外：

```text
.env.example
.env.template
.env.sample
```

必须支持：

```text
allowlist: 精确路径白名单
exclusions: 模式级排除
```

但安全默认是：

```text
命中 deny pattern 一律拒绝 staging
allowlist 只能用于明确 IU 意图内的精确路径
```

### 测试要求

`tests/unit/spec-work-beta-contracts.test.js` 覆盖：

1. 不存在无界 `git add $(...)`。
2. reference 要求 batch file-set comparison。
3. out-of-batch diff 必须 stop commit。
4. orchestrator 三选一存在。
5. rollback scope 也限制在 batch file list。

`tests/unit/secret-deny-patterns-contracts.test.js` 覆盖：

1. schema 校验。
2. env 命中。
3. private key 命中。
4. token / secret 命中。
5. cloud credential 命中。
6. mobile signing file 命中。
7. `.env.example` 不命中。
8. allowlist 必须精确路径。

`tests/unit/task-pack-command.test.js` 覆盖：

1. `expected_side_effects` 可被 validator 接受。
2. `**` 被拒绝。
3. absolute path 被拒绝。
4. parent escape 被拒绝。
5. bounded glob 被接受。

`tests/unit/spec-write-tasks-contracts.test.js` 覆盖：

1. task-pack schema 包含 `expected_side_effects`。
2. examples / docs 中描述与 validator 一致。

### 验收命令

```bash
npx jest \
  tests/unit/spec-work-beta-contracts.test.js \
  tests/unit/secret-deny-patterns-contracts.test.js \
  tests/unit/task-pack-command.test.js \
  tests/unit/spec-write-tasks-contracts.test.js \
  --runInBand
```

### 退出条件

```text
spec-work-beta 无无界 staging
batch-owned ∪ expected_side_effects 成为唯一 staging 范围
out-of-batch diff 必须 surface
secret deny pattern 有集中 source 和 schema
expected_side_effects 在 docs / schema / validator / tests 中一致
CHANGELOG 已记录
```

---

## 6.3 U3：Deterministic Prompt/Script Drift Quick Wins

### 目标

修复明确、可证明的 prompt/script drift，不扩展成 prompt lint 平台。

### 涉及范围

```text
skills/agent-native-audit/SKILL.md
skills/gemini-imagegen/SKILL.md
skills/gemini-imagegen/scripts/generate_image.py
skills/gemini-imagegen/scripts/edit_image.py
skills/gemini-imagegen/scripts/multi_turn_chat.py
tests/unit/agent-native-architecture-contracts.test.js
tests/unit/skill-shell-safety.test.js
CHANGELOG.md
```

### 修复点

#### 6.3.1 agent-native-audit

修复：

```text
option 编号错误
SHARED WORKSPASpec-First typo
```

#### 6.3.2 gemini-imagegen

修复：

```text
SKILL.md 默认模型与 scripts 默认模型不一致
SKILL.md 输出扩展名与 scripts 输出扩展名不一致
```

如果当前 API 模型可用性不确定：

```text
不得静默更换默认模型
必须写清楚 fallback
或者标注为 user-provided default
```

#### 6.3.3 当前日期表达

触及文件中如存在硬编码当前年份，替换为：

```text
use the host/session current date provided in startup reminders
```

禁止新增：

```text
{{year}}
{{current_date}}
2026 as current year
```

### 验收命令

```bash
npx jest \
  tests/unit/agent-native-architecture-contracts.test.js \
  tests/unit/skill-shell-safety.test.js \
  --runInBand

python3 -m py_compile skills/gemini-imagegen/scripts/*.py
```

### 退出条件

```text
agent-native-audit option/typo 修复
gemini-imagegen prose/scripts 一致
Python scripts compile
focused tests pass
CHANGELOG 已记录
```

---

## 6.4 Phase A 总退出条件

Phase A 不允许只靠 plan-prose 关闭。必须满足：

由于 U1/U2 已有 source-mod，Phase A closure 的执行含义是：复核 U1/U2 当前源码与测试仍符合本计划契约，并完成 U3；不是删除或重写已落地的安全边界。

```bash
git diff --check

bash -n skills/git-worktree/scripts/worktree-manager.sh
bash -n skills/spec-optimize/scripts/experiment-worktree.sh

python3 -m py_compile skills/gemini-imagegen/scripts/*.py

npx jest \
  tests/unit/git-worktree-contracts.test.js \
  tests/unit/high-risk-execution-contracts.test.js \
  tests/unit/spec-work-beta-contracts.test.js \
  tests/unit/secret-deny-patterns-contracts.test.js \
  tests/unit/task-pack-command.test.js \
  tests/unit/spec-write-tasks-contracts.test.js \
  tests/unit/agent-native-architecture-contracts.test.js \
  tests/unit/skill-shell-safety.test.js \
  --runInBand

npm run typecheck
```

同时满足：

```text
U1 / U2 / U3 均有 CHANGELOG
fresh_source_eval 记录 ran 或 not_run + reason
没有把 Phase A 表述为仅 plan-prose 完成
```

---

# 7. Phase B：最小薄契约与 Prompt Examples Baseline

---

## 7.1 U4：Skill/Agent Quality Thin Contract

### 目标

新增一个短的 human-readable contract 文档，统一边界语言，但不创建治理平台。

### 文件

```text
docs/contracts/workflows/skill-agent-quality-governance.md
tests/unit/skill-agent-quality-governance-contracts.test.js
docs/README.md
CHANGELOG.md
```

`docs/README.md` 仅在文档索引需要时修改。

### 文档结构

```md
# Skill/Agent Quality Governance Thin Contract

## 0. Non-goals

- Not a state machine
- Not a hard gate platform
- Not a universal JSON schema
- Not a runtime mirror source
- Not an eval platform

## 1. Skill Minimum Contract v1

| Field | Meaning | Required for |
|---|---|---|
| trigger | 什么时候应该使用该 skill | public workflow |
| non-trigger | 什么时候不应该使用该 skill | public workflow |
| inputs | 需要哪些上下文 / artifacts | public workflow |
| outputs | 产出什么 | public workflow |
| workflow skeleton | 最小执行骨架 | public workflow |
| failure mode | 失败如何降级 | high-risk workflow |
| done signal | 什么算完成 | all |

## 2. High-risk Execution Safety Contract v1

| Risk surface | Required boundary | Example |
|---|---|---|
| writes | 明确写入范围 | spec-work |
| shell/network | 明确何时执行 | mcp-setup |
| secrets | 默认不传播 | git-worktree |
| git staging | batch-owned only | spec-work-beta |
| external service | source freshness | researcher |
| rollback/stop | stop condition | delegation |

## 3. Agent Output Contract Registry v1

| Agent family | Output posture | Notes |
|---|---|---|
| reviewer | findings / severity / evidence / confidence | doc-review template 可注入 |
| researcher | claims / sources / freshness / limitations | 不等于最终结论 |
| writer/strategist | artifact / assumptions / checks / open risks | 服务 synthesis |

## 4. Research Evidence Contract v1

| Claim type | Authority order | Freshness rule |
|---|---|---|
| project convention | repo source > local docs > prior notes | repo-local |
| external API/SDK/model | official docs > release notes > source/issues | must check current |
| social signal | social discourse only | never as fact alone |
| recommendation | cite assumptions | separate fact/judgment |

## 5. Existing Exceptions

- spec-doc-review personas receive output schema from `skills/spec-doc-review/references/subagent-template.md`
- optional/internal skills do not need examples until high-risk, high-traffic, or downstream-consumed
- generated runtime mirrors are not source of truth
```

### 测试要求

`tests/unit/skill-agent-quality-governance-contracts.test.js` 只校验机械事实：

1. 文档存在。
2. 包含四类 contract 名称：

   * `Skill Minimum Contract v1`
   * `High-risk Execution Safety Contract v1`
   * `Agent Output Contract Registry v1`
   * `Research Evidence Contract v1`
3. 包含 Non-goals。
4. 明确禁止 runtime mirror 作为 source truth。
5. 明确 doc-review schema 由 orchestrator/template 注入。
6. 明确 optional/internal skills 延后策略。

不得让测试判断语义质量。

### 验收命令

```bash
npx jest tests/unit/skill-agent-quality-governance-contracts.test.js --runInBand
```

### 退出条件

```text
thin contract 文档存在
四类契约齐全
non-goals 清晰
doc-review exception 清晰
runtime mirror source boundary 清晰
contract test pass
CHANGELOG 已记录
```

---

## 7.2 U5：Minimal Prompt Examples Baseline

### 目标

给最高杠杆 workflow 增加少量真实 examples-as-context，降低长 prompt 漂移的人工判断成本。

### 文件

```text
skills/using-spec-first/evals/examples.json
skills/spec-work/evals/examples.json
skills/spec-doc-review/evals/examples.json
tests/unit/prompt-examples-contracts.test.js
CHANGELOG.md
```

### JSON Shape

```json
{
  "schema_version": "prompt-examples/v1",
  "skill": "spec-work",
  "examples": [
    {
      "name": "execute existing task pack without expanding scope",
      "user_intent": "用户要求按已有 task-pack 执行开发",
      "expected_posture": "先读取 task-pack 与关联 plan，只执行当前批次文件范围，不主动扩展重构",
      "boundary_note": "不得把 unrelated cleanup 纳入当前 batch",
      "negative_signal": "未声明 expected_side_effects 却修改大量邻近文件",
      "context_snippets": [
        "已有 task-pack",
        "当前 IU Files 列表"
      ],
      "source_note": "derived from recurring spec-work execution boundary"
    }
  ]
}
```

### 设计原则

examples 不是：

```text
不是聊天记录
不是完整测试平台
不是 semantic readiness
不是 LLM-as-judge
不是 CI gate
```

examples 是：

```text
决策样例
边界样例
失败姿态样例
review seed
LLM 上下文锚点
```

每条 example 必须能追溯到一个真实依据，而不是为了满足 shape 的 invented case。`source_note` 是必填字段，用于说明该样例来自哪类来源：

```text
existing prompt clause
source review finding
observed workflow boundary
known failure mode
current source/runtime governance rule
```

---

## 7.2.1 using-spec-first examples

建议覆盖 4-6 条：

| 场景                         | expected_posture                 | negative_signal      |
| -------------------------- | -------------------------------- | -------------------- |
| 用户要求直接开发，但缺少 plan/tasks    | 推荐进入 plan/write-tasks/work 链路    | 直接改代码                |
| 用户要求审文档                    | 路由到 spec-doc-review              | 当成 spec-work 执行      |
| 父目录包含多个 git repo           | 要求 target scope 或明确选择 repo       | 在父目录写 `.spec-first`  |
| 用户要求 report-only/no-agents | 降级为报告模式                          | 仍然尝试 dispatch agents |
| 用户只是问解释                    | 只解释，不触发 mutating workflow        | 生成计划或修改文件            |
| 高风险写入不明确                   | 先明确 source/runtime/repo boundary | 默认执行                 |

---

## 7.2.2 spec-work examples

建议覆盖 4-6 条：

| 场景                      | expected_posture                  | negative_signal            |
| ----------------------- | --------------------------------- | -------------------------- |
| 已有 task-pack            | 只执行当前 batch                       | 扩大重构范围                     |
| target repo 不明确         | 不写入，先收敛 scope                     | 修改父目录或多个 repo              |
| 涉及 runtime mirror       | source-first，不手改 generated mirror | 直接改 `.claude/` / `.codex/` |
| 发现 unrelated complexity | 记录 follow-up                      | 顺手重构                       |
| 涉及 secrets/staging      | 使用 high-risk boundary             | stage env / token          |
| 前端/Figma 资料缺失           | 明确降级说明                            | 编造设计事实                     |

---

## 7.2.3 spec-doc-review examples

建议覆盖 4-6 条：

| 场景                      | expected_posture                | negative_signal     |
| ----------------------- | ------------------------------- | ------------------- |
| 默认文档审查                  | 多 persona dispatch              | 单视角草率审查             |
| helper dispatch 不可用     | report-only fallback            | 声称 agent 已跑         |
| findings 输出             | severity/evidence/confidence 齐全 | 无证据结论               |
| 只审文档                    | 不自动实施                           | 顺手改代码               |
| source/runtime 混淆       | 标为高风险                           | 认可手改 runtime mirror |
| optional/internal skill | 不强制补 examples                   | 机械要求全量 eval         |

---

## 7.2.4 LLM-owned examples quality checklist

U5 不能只靠 JSON shape test 通过。实现者和 reviewer 必须对每条 example 做语义审查，并记录在 PR 描述或 review notes 中：

```text
1. 该 example 是否对应真实 prompt 条款、source review finding、已观察 workflow 边界或已知 failure mode？
2. `user_intent` 是否像真实用户请求，而不是抽象标签？
3. `expected_posture` 是否描述 LLM 应采取的执行姿态，而不是复述字段名？
4. `boundary_note` 是否指出明确的不得越界行为？
5. `negative_signal` 是否帮助 reviewer 识别错误姿态？
6. 该 example 是否会帮助未来修改者判断 prompt 是否漂移？
```

脚本不判断这些语义问题；它们是 LLM / reviewer-owned judgment。

---

## 7.2.5 prompt-examples contract test

`tests/unit/prompt-examples-contracts.test.js` 校验：

1. 三个 examples 文件存在。
2. JSON 可解析。
3. `schema_version = "prompt-examples/v1"`。
4. `skill` 与目录名匹配。
5. 每个文件 4-6 条 examples。
6. 每条 example 必须有：

   * `name`
   * `user_intent`
   * `expected_posture`
   * `boundary_note`
   * `source_note`
7. 可选字段若存在必须非空：

   * `negative_signal`
   * `context_snippets`
8. 禁止 placeholder：

   * `TODO`
   * `TBD`
   * `example 1`
   * `foo`
   * `bar`
9. 不校验 semantic pass。
10. 不要求 `write-audit-artifacts.js` 标记 ready。

### 验收命令

```bash
npx jest tests/unit/prompt-examples-contracts.test.js --runInBand
```

### 退出条件

```text
三个 examples.json 存在
每个 4-6 条真实 examples
shape test pass
无 placeholder
每条 example 有 source_note，且通过 LLM-owned quality checklist
不触发 readiness 误报
CHANGELOG 已记录
```

---

## 7.3 Phase B 总退出条件

```bash
npx jest \
  tests/unit/skill-agent-quality-governance-contracts.test.js \
  tests/unit/prompt-examples-contracts.test.js \
  --runInBand
```

同时满足：

```text
U4 contract doc 存在
U5 examples baseline 存在
U5 examples 已通过 LLM-owned quality checklist，且每条 source_note 可追溯
Phase A contract tests 已对照 U4 模式 review
没有把 examples presence 说成 semantic readiness
没有要求 8 个 workflow ready
CHANGELOG 已记录
```

---

# 8. Deferred Follow-up

---

## 8.1 U6：spec-work / spec-work-beta parity

### 当前状态

不做。

### 触发条件

```text
stable spec-work 与 spec-work-beta 再次出现可证明 parity drift
或出现新的 UI/Figma workflow bug
```

### 未来执行原则

1. 小型 parity plan。
2. 不引入 beta-only delegation 到 stable。
3. 通过 markdown heading 顺序做 contract test。
4. 不锚定行号。

---

## 8.2 U7：Agent Output And Research Evidence Contracts

### 当前状态

不做。

### 触发条件

```text
某个 public workflow 明确声明 researcher output consumer
或 synthesis 已经依赖 researcher structured output
```

### 未来执行原则

1. 先做 consumer audit。
2. 再决定是否迁移 researcher output。
3. 不把所有 agent 改成同一 JSON schema。
4. `spec-competitive-intelligence-researcher` 只有出现明确 consumer 时才创建。
5. Twitter/X 只作为 market/social signal，不作为 confirmed fact。

---

## 8.3 U8：Prompt Source Drift Lint

### 当前状态

不做。

### 触发条件

```text
Phase B examples 已稳定
至少两类 deterministic prompt drift 重复出现
```

### 未来允许 lint 的内容

```text
hardcoded current year
stale entrypoint
default model drift
option numbering mismatch
runtime mirror as source truth
```

### 未来禁止 lint 的内容

```text
架构好坏
产品优先级
是否应该新增 skill
语义质量
prompt 是否“足够好”
```

---

# 9. 总体验收

完成 Phase A + Phase B 后，执行：

```bash
git diff --check

npm run lint:skill-entrypoints

npx jest \
  tests/unit/git-worktree-contracts.test.js \
  tests/unit/high-risk-execution-contracts.test.js \
  tests/unit/spec-work-beta-contracts.test.js \
  tests/unit/secret-deny-patterns-contracts.test.js \
  tests/unit/task-pack-command.test.js \
  tests/unit/spec-write-tasks-contracts.test.js \
  tests/unit/agent-native-architecture-contracts.test.js \
  tests/unit/skill-shell-safety.test.js \
  tests/unit/skill-agent-quality-governance-contracts.test.js \
  tests/unit/prompt-examples-contracts.test.js \
  --runInBand

npm run typecheck

bash -n skills/git-worktree/scripts/worktree-manager.sh
bash -n skills/spec-optimize/scripts/experiment-worktree.sh

python3 -m py_compile skills/gemini-imagegen/scripts/*.py
```

不运行：

```bash
node skills/retired-skill-review/scripts/write-audit-artifacts.js --repo .
```

除非本轮明确修改了 `write-audit-artifacts.js` 或 eval readiness 生成逻辑。

---

# 10. CHANGELOG 要求

每个 IU 至少一条 CHANGELOG。

建议格式：

```md
- v1.8.2 2026-05-13 23:45:55 leokuang: U1 harden worktree env handling; worktree 默认不再复制 .env*，新增 --copy-env opt-in 与 contract tests (user-visible)
- v1.8.2 2026-05-13 23:45:55 leokuang: U2 bound spec-work-beta delegation staging; 新增 expected_side_effects 与 secret deny pattern contract (user-visible)
- v1.8.2 2026-05-13 23:45:55 leokuang: U3 fix deterministic prompt/script drift in agent-native-audit and gemini-imagegen
- v1.8.2 2026-05-13 23:45:55 leokuang: U4 add skill/agent quality thin contract
- v1.8.2 2026-05-13 23:45:55 leokuang: U5 add minimal prompt examples baseline for using-spec-first/spec-work/spec-doc-review
```

如果影响用户可见行为，追加：

```text
(user-visible)
```

---

# 11. PR 描述模板

````md
## Summary

This PR closes the current scope of `2026-05-07-001-skill-agent-quality-governance`.

It intentionally keeps the scope thin:

- Phase A: close high-risk execution boundaries and deterministic drift
- Phase B: add one thin governance contract and minimal prompt examples baseline

It does not introduce an eval platform, LLM-as-judge, prompt-source lint, competitive intelligence researcher, or universal agent JSON schema.

## Scope

### Included

- U1 Worktree env handling closure
- U2 Delegation staging boundary closure
- U3 Deterministic prompt/script drift quick wins
- U4 Skill/Agent quality thin contract
- U5 Minimal prompt examples baseline

### Excluded

- U6 spec-work / spec-work-beta parity
- U7 researcher / agent output migration
- U8 prompt-source drift lint

## Verification

```bash
git diff --check
npm run lint:skill-entrypoints
npm run typecheck
bash -n skills/git-worktree/scripts/worktree-manager.sh
bash -n skills/spec-optimize/scripts/experiment-worktree.sh
python3 -m py_compile skills/gemini-imagegen/scripts/*.py
npx jest ... --runInBand
```

## Fresh-source eval

* U1: ran / not_run, reason:
* U2: ran / not_run, reason:
* U3: ran / not_run, reason:
* U4: ran / not_run, reason:
* U5: ran / not_run, reason:

## Risk Notes

* examples are context, not semantic readiness
* staging boundary is a strong execution contract, not a full runtime sandbox
* secret deny pattern may false-positive; exact allowlist is the intended mitigation

````

---

# 12. 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| Phase B 膨胀成治理平台 | 违背 Light contract | U4 只写短 contract index |
| examples 变形式主义 | 制造 false confidence | 每个 skill 4-6 条真实决策样例，禁止 placeholder |
| examples 被误当 readiness | 误导 reviewer | 明确 examples-as-context，不接 readiness gate |
| secret deny pattern 误伤 | 阻塞合法 fixture / docs | exact allowlist，不放宽全局规则 |
| staging contract 被误解成 runtime sandbox | 过度承诺 | 明确是 strong execution contract |
| U7/U8 过早进入 | 上下文膨胀、治理过度 | 仅在触发条件满足后独立 plan |
| doc-review personas 重复 schema | prompt 冗余与 drift | 保持 template 注入 |
| optional/internal skills 被强制补 examples | 浪费成本 | 仅 high-risk / high-traffic / downstream-consumed 后补 |
| runtime mirror 被误改 | source/runtime drift | contract 明确 source-first |

---

# 13. 最终裁决

本方案最终形态不是：

```text
skill/agent 治理平台
```

而是：

```text
高风险执行安全护栏
+
高杠杆 workflow examples-as-context
+
最小契约语言
```

一句话总结：

```text
先把真实执行风险关掉，再给最高杠杆 workflow 补少量高质量 examples，最后用一个薄契约文档统一边界语言；除此之外全部延后。
```

推荐落地顺序：

```text
P0：Phase A source reality check
P1：U1/U2 closure review
P1：U3 deterministic drift quick wins
P1：U4 thin contract
P1：U5 examples baseline
P2：focused code review
P3：按触发条件再评估 U6/U7/U8
```

最终判断：

```text
值得做。
必须做薄。
不要做成治理平台。
```
