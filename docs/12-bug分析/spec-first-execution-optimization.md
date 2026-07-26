# spec-first 执行过程问题复盘与可执行优化清单

## 0. 文档目标

本文档复盘本轮从 `spec-mcp-setup` 到 `spec-graph-bootstrap` 再到 `spec-standards` 的完整执行过程，识别过程中暴露的系统性问题，并转化为可直接落地的优化项。

目标不是追责单个错误，而是把反复出现的执行风险固化成：

- workflow gate
- 脚本契约
- artifact validator
- 模板约束
- agent 执行规范
- 诊断治理策略

## 1. 总体结论

本轮执行最终完成了目标，但过程中暴露出一个核心模式：多个步骤的“实际状态”与“下游可消费状态”没有被强制对齐。

具体表现包括：

- Serena 实际修复后，setup readiness 投影仍是旧状态
- standards artifact 写出后，contract validation 才发现结构不合规
- markdown/cSpell 诊断出现后，缺少统一规则区分“应修复问题”和“真实标识符噪音”
- task 状态没有随着真实完成点及时关闭
- 一些关键契约依赖人工记忆，而不是脚本、模板或 validator 强制执行

优化重点应该从“让 agent 更小心”转向：把关键约束前置成脚本检查、模板生成和 validator gate。

## 2. P0 优先级：必须优先修复的问题

### P0-1：workflow 切换前缺少 canonical artifact 新鲜度 gate

#### 问题

`spec-mcp-setup` 修复 Serena 后，`spec-graph-bootstrap` 仍然读取到旧的 `.spec-first/config/runtime-capabilities.json` 和 host readiness ledger，导致 graph bootstrap 首次失败。

典型失败状态：

- `workflow_mode=setup-not-ready`
- `reason_code=baseline_not_ready`

#### 根因

setup 的实际修复状态和 setup-owned projection artifact 没有绑定成一个强制收尾步骤。

当前流程里存在三个状态层：

1. 实际工具状态：Serena 是否真的 ready
2. host ledger 状态：`host-setup.json`
3. repo projection 状态：`runtime-capabilities.json`

但下游 workflow 依赖第 2/3 层，不依赖 agent 的口头判断。

#### 优化动作

在 `spec-mcp-setup` 的最终阶段强制执行：

```bash
bash .claude/spec-first/workflows/spec-mcp-setup/scripts/verify-tools.sh
```

并检查：

```json
{
  "baseline_ready": true,
  "host_runtime_ready": true,
  "serena": {
    "project_status": "ready"
  }
}
```

#### 建议实现

新增 setup 收尾 gate：

```bash
bash .claude/spec-first/workflows/spec-mcp-setup/scripts/assert-baseline-ready.sh
```

职责：

- 读取 `.spec-first/config/runtime-capabilities.json`
- 读取其指向的 host ledger
- 校验两者一致
- 校验 `baseline_ready=true`
- 校验 Serena ready marker 存在
- 输出机器可读 JSON

建议输出：

```json
{
  "status": "pass",
  "baseline_ready": true,
  "runtime_capabilities_fresh": true,
  "host_ledger_consistent": true,
  "next_workflow_allowed": [
    "spec:graph-bootstrap",
    "spec:standards"
  ]
}
```

#### 验收标准

- setup 成功后，不允许没有刷新 `runtime-capabilities.json` 就进入 graph bootstrap
- graph bootstrap 如果失败，错误信息必须明确指出：
  - 当前读取的是哪个 artifact
  - artifact 的 `generated_at`
  - 需要执行哪个修复命令

### P0-2：Serena refresh 语义没有强制覆盖旧语言配置

#### 问题

执行以下命令时，旧 `.serena/project.yml` 没有被正确覆盖，导致仍然沿用旧 Kotlin 语言配置：

```bash
activate-serena.sh --refresh --language java
```

#### 根因

脚本没有严格建模这些状态：

- existing project
- refresh existing project
- refresh with explicit language override
- first-time bootstrap
- index existing project

`--refresh --language <language>` 的语义应该是：明确要求以给定 language set 重建 Serena project config，而不是复用旧 `project.yml`。

#### 优化动作

把 Serena activation 状态机显式化。

建议定义状态：

```text
mode=create-new
mode=index-existing
mode=refresh-reuse-existing-language
mode=refresh-explicit-language-override
```

其中 `refresh-explicit-language-override` 必须执行：

- 删除旧 `.serena/project.yml`
- 删除旧 `.serena/index-ready.json`
- 使用显式 language 重新 create/index
- 成功后写 ready marker
- 失败时恢复备份

#### 建议测试用例

```text
case: refresh with explicit language replaces old project language
given:
  .serena/project.yml contains languages: [kotlin]
when:
  activate-serena.sh --refresh --language java
then:
  .serena/project.yml contains only java
  .serena/index-ready.json exists
```

#### 验收标准

- `--refresh --language java` 后，`.serena/project.yml` 不再保留 Kotlin
- refresh 失败时旧 Serena 配置可恢复
- 不允许 silent fallback 到旧 language set

### P0-3：Serena command rewrite 破坏 registry prefix

#### 问题

曾出现错误命令：

```bash
uvx project index --language kotlin
```

以及：

```bash
serena project index --index --language kotlin
```

说明命令重写过程中误删了原始 prefix，且没有清理不适用于目标子命令的参数。

#### 根因

脚本把 registry command array 当成普通字符串或列表直接改写，没有明确划分：

- executable prefix
- package/source args
- CLI binary
- subcommand
- subcommand options

#### 优化动作

引入 command contract builder，不允许自由拼接。

建议把 Serena command 拆成：

```json
{
  "prefix": ["uvx", "--upgrade", "--from", "git+https://github.com/oraios/serena", "serena"],
  "create_project": ["project", "create", ".", "--index"],
  "index_project": ["project", "index"]
}
```

脚本只允许选择 mode：

```bash
build_serena_command create_project --language java
build_serena_command index_project --language java
```

#### 验收标准

- 不允许生成没有 `uvx --upgrade --from ... serena` prefix 的命令
- `project index` 不允许携带 `--index`
- command log 中必须记录最终 argv
- shellcheck 或单测覆盖 create/index 两种路径

## 3. P1 优先级：应尽快优化的问题

### P1-1：standards candidate 状态语义没有被生成前校验

#### 问题

最初把部分 doc-observed 规则错误标成了 `confirmed`，例如：

- GitNexus impact analysis 前置规则
- detect_changes before commit
- preview-first no writeback

这些确实是仓库文档中观察到的规则，但在 standards contract 里，`confirmed` 只能来自 user explicit confirmation 或 repo profile confirmed evidence。

#### 根因

状态语义依赖 agent 理解，没有前置 validator 或 generator rule 限制。

#### 优化动作

在 `standards-candidates.json` 生成前引入状态来源矩阵。

| source_type | 可用 status |
| --- | --- |
| `user_input` | `confirmed`, `unknown` |
| `repo_profile_confirmed` | `confirmed` |
| `shared_standard_imported` | `imported`, `conflict` |
| `graph_observed` | `observed`, `unknown`, `conflict` |
| `code_observed` | `observed`, `unknown`, `conflict` |
| `config_observed` | `observed`, `unknown`, `conflict` |
| `docs_observed` | `observed`, `unknown`, `conflict` |
| `llm_suggested` | `suggested`, `unknown` |

#### 验收标准

- `confirmed` 只允许来自 `user_input` 或 `repo_profile_confirmed`
- validator 对非法组合 fail
- preview 明确说明 observed 只是 advisory context

### P1-2：unknown candidate 字段没有模板化

#### 问题

`unknown` candidate 初版缺少：

- `question`
- `reason`
- `missing_evidence`

#### 根因

unknown 的 required shape 没有在生成模板里强制出现。

#### 优化动作

为不同 status 定义最小字段模板。`unknown` candidate 必须包含：

```json
{
  "id": "...",
  "domain": "...",
  "type": "...",
  "status": "unknown",
  "confidence": "low",
  "rule_candidate": "...",
  "source_type": "llm_suggested",
  "evidence": [],
  "question": "...",
  "reason": "...",
  "missing_evidence": [],
  "suggested_action": "...",
  "downstream_usage": []
}
```

#### 验收标准

- 所有 unknown 都有 `question`
- 所有 unknown 都有 `reason`
- 所有 unknown 都有非空 `missing_evidence`
- preview 中必须显式列出 unknown，不能只藏在 JSON

### P1-3：standards preview 是手拼结构，导致 section 缺失

#### 问题

初版 preview 缺少：

- `Candidates By Status`
- `Writeback Status`
- 显式 unknown 展示

#### 根因

preview 没有基于固定模板渲染，而是人工组织内容。

#### 优化动作

把 `.spec-first/standards/standards-preview.md` 改为模板渲染，固定包含以下 section：

```md
# 项目标准预览

## Summary

## Detected project mode

## Detected project shape

## Imported shared standards

## Artifact plan

## Graph-backed or degraded evidence summary

## Glue capability map summary

## Observed conventions by enabled domain

## Candidates By Status

## Conflicts

## Unknowns / requires user decision

## Suggested actions

## Downstream consumption summary

## 写回状态

## Repo profile 状态
```

#### 验收标准

- preview section 顺序稳定
- validator 不再因为 section 缺失失败
- markdownlint 默认通过
- 写回状态必须显式写明：
  - `repo-profile.yaml`: not modified
  - `repo-profile.patch.yaml`: not generated 或路径
  - preview-only 状态

### P1-4：validator 应该前移为生成闭环，而不是事后补救

#### 问题

standards artifacts 写完后，直到 validator 报错才修结构。

#### 根因

workflow 中虽然定义了 validation phase，但执行节奏上没有把它当成“生成完成的组成部分”。

#### 优化动作

把 standards 生成定义为三段式 atomic pipeline：

```text
1. prepare deterministic facts
2. synthesize candidates + preview
3. validate artifacts
```

第 3 步失败时，workflow 状态必须是：

```text
generated-but-untrusted
```

而不是 completed。

#### 验收标准

最终报告必须包含：

```text
Validation:
- command:
- exit_code:
- status:
- trust_level:
```

没有 validator pass，不允许说 standards baseline 已完成，只能说 artifacts generated, validation pending/failed。

## 4. P1：诊断治理优化

### P1-5：cSpell 缺少专有词策略

#### 问题

诊断中出现：

- `gitnexus`
- `examplecorp`
- `writeback`
- `leokuang`

其中一些是工具名、包路径、作者名或合法术语，不应该通过改真实内容来消除。

#### 根因

项目没有明确的 spell-check allowlist 或 generated artifact ignore 策略。

#### 优化动作

建立 `.cspell.json` 或项目等价配置。

建议加入：

```json
{
  "words": [
    "gitnexus",
    "GitNexus",
    "examplecorp",
    "leokuang",
    "writeback",
    "codebase",
    "repo",
    "runtime",
    "bootstrap",
    "queryable"
  ],
  "ignorePaths": [
    ".spec-first/providers/**/raw/**",
    ".spec-first/**/raw/**"
  ]
}
```

如果不想污染全局词典，可建立 spec-first 局部词典：

```text
.spec-first/config/cspell-words.txt
```

#### 验收标准

- 真实工具名不再触发拼写告警
- 作者名不再触发拼写告警
- 路径里的组织/包名不再触发拼写告警
- 不允许为了 spell check 修改 evidence path、函数名、命令名

### P1-6：markdownlint 应在文档生成时自动满足

#### 问题

preview 生成后出现大量 MD022 和 MD032。

#### 根因

markdown 输出模板没有强制 heading/list 空行。

#### 优化动作

建立 markdown 渲染规则：

```text
- heading 前后必须有空行
- list 前后必须有空行
- section 之间必须有一个空行
- 不允许 heading 后紧跟 list
```

#### 验收标准

- 新生成 standards-preview.md 不再触发 MD022 / MD032
- 不需要后续手动补空行

## 5. P1：CHANGELOG 治理优化

### P1-7：CHANGELOG 时间戳不应手写

#### 问题

有 changelog 记录是手动填入固定时间，例如：

```text
2026-05-05 17:40:00
```

这虽然格式正确，但不如系统时间可信。

#### 根因

CHANGELOG 规则要求精确时间，但没有提供统一生成命令。

#### 优化动作

新增 changelog helper：

```bash
bash .claude/spec-first/scripts/add-changelog-entry.sh \
  --version v1.6.3 \
  --author-from .claude/spec-first/.developer \
  --summary "修正 standards 预览文档格式与本地化标题"
```

脚本职责：

- 自动读取 `.claude/spec-first/.developer`
- 自动读取 version
- 自动取当前时间
- 自动校验格式
- 插入到 `CHANGELOG.md`

#### 验收标准

- agent 不再手写 changelog 时间
- author 必须来自 `.claude/spec-first/.developer`
- 缺少 developer profile 时 fail closed
- changelog 格式错误时 fail

## 6. P2 优先级：执行质量优化

### P2-1：task 状态更新滞后

#### 问题

`spec:standards baseline` 实际主要工作已完成，但 task 直到用户要求“完成全部 task”才关闭。

#### 根因

task close 没有绑定到验收点。

#### 优化动作

每个 task 创建时必须定义 completion criteria。

示例：

```text
Task: 执行 spec:standards baseline

完成条件：
- deterministic artifacts generated
- candidates generated
- preview generated
- validator pass 或明确记录 validation pending/failed
- changelog updated
- final response delivered
```

#### 验收标准

- 每个 task 有清晰完成条件
- 完成条件满足后立即 `completed`
- 未验证不得关闭
- 被用户打断时，剩余 blocker 必须只保留一个明确 next action

### P2-2：重复 Read / wasted call

#### 问题

有一次读取已知未变化文件时出现 wasted call。

#### 根因

收口阶段没有充分利用当前上下文里的文件状态。

#### 优化动作

agent 规则：如果文件在当前上下文中已读且未被修改，不重复 Read；如果 Edit/Write 成功，不为了验证结果重新 Read。

#### 验收标准

- 同一文件无变化时不重复读取
- 需要重新读取时必须有明确原因：
  - 外部命令可能修改
  - validator 修改
  - 用户手动修改
  - context 丢失

### P2-3：汇报中“已修改”和“已验证”边界不够硬

#### 问题

过程中多次出现“已修复”“已落地”“已完成”，但某些阶段其实只是“文件已修改”，还没有 validator pass。

#### 根因

语言层没有强制区分状态。

#### 优化动作

统一使用四级状态词：

```text
已生成：文件已写出，但未验证
已修正：问题已按判断修改，但未验证
已验证：validator/test/check 已通过
已闭环：已验证 + changelog + task close + final report
```

#### 验收标准

- 没有 validator/test，不说“已完成”
- workflow 最终报告必须明确 generated、validated、closed

## 7. 建议新增的自动化检查

### 7.1 setup readiness assert

建议命令：

```bash
bash .claude/spec-first/workflows/spec-mcp-setup/scripts/assert-baseline-ready.sh --json
```

检查项：

- host ledger exists
- runtime capabilities exists
- ledger pointer valid
- `baseline_ready=true`
- `serena.project_status=ready`
- `.serena/index-ready.json` exists
- `generated_at` 不早于最近一次 setup 修复动作

### 7.2 Serena command contract tests

| case | 输入 | 期望 |
| --- | --- | --- |
| create new | no project.yml | `serena project create . --index` |
| index existing | project.yml exists | `serena project index` |
| refresh reuse language | refresh, no explicit language | reuse old languages |
| refresh override language | refresh + java | recreate project.yml with java |
| index command args | existing project | no `--index` |
| command prefix | all modes | keep `uvx --upgrade --from ... serena` |

### 7.3 standards artifact contract tests

建议命令：

```bash
node .claude/spec-first/workflows/spec-standards/scripts/validate-artifacts.js \
  --standards-dir .spec-first/standards \
  --json
```

新增或强化检查：

- `confirmed` source type whitelist
- `unknown` required fields
- preview required sections
- preview unknown visibility
- writeback status required
- markdownlint basic checks
- no repo-profile writeback unless explicit confirmation

### 7.4 generated docs lint

建议命令：

```bash
markdownlint .spec-first/standards/standards-preview.md
cspell .spec-first/standards/standards-preview.md .spec-first/standards/standards-candidates.json
```

cSpell 应配 allowlist，否则会把真实标识符当作噪音。

## 8. 可执行优化任务清单

### TASK-001：增加 setup baseline ready assert

- 优先级：P0
- 修改区域：`.claude/spec-first/workflows/spec-mcp-setup/scripts/`
- 产物：`assert-baseline-ready.sh`，可选 PowerShell parity
- 验收：setup 后 assert pass；graph bootstrap 前可调用 assert；baseline stale 时输出明确 `next_action`

### TASK-002：setup 完成后强制刷新 projection

- 优先级：P0
- 修改区域：`spec-mcp-setup` workflow 文档、setup orchestrator / script
- 动作：Serena 修复成功后必须 rerun `verify-tools.sh`，verify 成功后再允许报告 setup complete
- 验收：`runtime-capabilities.json` 与 host ledger 一致，`baseline_ready=true`

### TASK-003：重构 Serena activation mode 判定

- 优先级：P0
- 修改区域：`.claude/spec-first/workflows/spec-mcp-setup/scripts/activate-serena.sh`
- 动作：显式建模 create/index/refresh modes；refresh explicit language override 删除旧 `project.yml`
- 验收：`--refresh --language java` 可覆盖旧 Kotlin；失败时恢复备份

### TASK-004：增加 Serena command builder

- 优先级：P0
- 修改区域：`activate-serena.sh`
- 动作：保留 registry prefix；子命令参数由 mode 决定；`project index` 不携带 `--index`
- 验收：command log 正确；单测覆盖 create/index

### TASK-005：standards candidate status-source 矩阵校验

- 优先级：P1
- 修改区域：`validate-artifacts.js`、standards workflow prompt/template
- 动作：禁止 observed evidence 自动 confirmed
- 验收：docs/code/graph/config observed + confirmed 必 fail

### TASK-006：unknown candidate 模板化

- 优先级：P1
- 修改区域：standards candidate generation template、validator
- 动作：unknown 必填 `question`、`reason`、`missing_evidence`
- 验收：缺任何字段 fail

### TASK-007：standards-preview 固定模板

- 优先级：P1
- 修改区域：standards preview generator/template
- 动作：固定 section 顺序、写回状态、candidates count 和 unknowns 展示
- 验收：validator 不再报 section 缺失，markdownlint 通过

### TASK-008：添加 cSpell 专有词配置

- 优先级：P1
- 修改区域：`.cspell.json` 或 spec-first 局部词典
- 建议词：`gitnexus`、`GitNexus`、`examplecorp`、`leokuang`、`writeback`
- 验收：不再对真实标识符报错，evidence path 不被修改

### TASK-009：generated markdown lint 集成

- 优先级：P1
- 修改区域：standards validator 或 CI check
- 动作：检查 MD022 / MD032
- 验收：新生成 preview 默认无 markdownlint 空行问题

### TASK-010：新增 changelog helper

- 优先级：P1
- 修改区域：`.claude/spec-first/scripts/`
- 动作：自动读取 developer profile，自动生成当前时间，自动校验格式
- 验收：agent 不再手写 changelog 时间，缺 author fail closed

### TASK-011：任务完成标准模板化

- 优先级：P2
- 修改区域：workflow agent instructions
- 动作：每个 task 创建时附 completion criteria，validator/test 通过后立即 close
- 验收：用户不需要额外说“完成全部 task”，final response 不出现 task 状态遗漏

## 9. 推荐落地顺序

建议按下面顺序做，不要并行铺太大：

```text
1. TASK-001 assert-baseline-ready
2. TASK-002 setup final projection refresh
3. TASK-003 Serena refresh mode 状态机
4. TASK-004 Serena command builder
5. TASK-005 standards status-source matrix
6. TASK-006 unknown candidate template
7. TASK-007 standards-preview template
8. TASK-008 cSpell 专有词配置
9. TASK-010 changelog helper
10. TASK-011 task completion criteria
```

最小闭环版本可以只做前 7 个。

## 10. 最小可交付版本定义

### MVP 范围

- setup 修复后一定能刷新 readiness projection
- graph bootstrap 不再因为 stale setup artifact 首次失败
- Serena refresh language override 有测试保护
- standards preview/candidates 一次生成即 validator pass
- markdownlint 基本格式不再返工
- confirmed/observed/unknown 状态不会误用

### MVP 验收命令

```bash
bash .claude/spec-first/workflows/spec-mcp-setup/scripts/verify-tools.sh

bash .claude/spec-first/workflows/spec-mcp-setup/scripts/assert-baseline-ready.sh --json

bash .claude/spec-first/workflows/spec-graph-bootstrap/scripts/bootstrap-providers.sh

node .claude/spec-first/workflows/spec-standards/scripts/prepare-baseline.js --mode baseline

node .claude/spec-first/workflows/spec-standards/scripts/validate-artifacts.js \
  --standards-dir .spec-first/standards \
  --json
```

### MVP 成功标准

```text
setup baseline_ready=true
graph providers query_ready=true
standards validator status=pass
standards trust_level=trusted
repo-profile.yaml not modified
markdownlint no MD022/MD032
no false-positive cSpell for project-owned terms
```

## 11. 最终建议

这轮最大的问题不是某个单点 bug，而是 workflow 的关键状态依赖 agent 人工判断，而不是 artifact gate 和 validator contract。

因此优化方向应该是：

1. 状态用 artifact 说话
2. 切换 workflow 前必须 assert
3. 生成类产物必须模板化
4. validator 失败就不能称为完成
5. 真实标识符诊断用词典治理，不篡改证据
6. changelog、task close 等治理动作工具化

先完成 P0 和 P1 的前 7 项，后续同类 workflow 执行会稳定很多。
