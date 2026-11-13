# 全量 Skill 单次审查执行方案

版本：v1.0 · 日期：2026-11-04 · 规则来源：[Skill 审查 Workflow](REVIEW-EXECUTION-WORKFLOW.md)

本文把 workflow 的规则落成一次可连续跑完的执行计划：启动时一次性登记授权与预算，中途不等待人工，跑完后输出覆盖全部 Skill 的报告。判定规则以 workflow 为准；本文只规定顺序、分工、命令、产物与出口检查。本文本身不是审查结果。

## 0. 单次运行能完成什么

| 证据层 | 单次运行能否完成 | 说明 |
|---|---|---|
| `structure_contract` | 能 | 源码身份、合同测试、入口 lint、eval 配置校验 |
| `behavior_quality` | 能 | 现有 157 个 eval case 加补充场景，fresh-source 运行 |
| `runtime_cost` | 能 | 每个 case 的耗时、调用、重试记录 |
| `field_outcome` | **不能** | 需要真实需求在观察期内的交付结果，单次运行无法产生 |

因此本方案的审查类型是「**全量单次审查**」（workflow 第 3 节）：对全部对象承诺前三层，`field_outcome` 在启动时登记为本轮不承诺。按此范围，审查执行可以 `complete`；被审对象可得到通过 / 有条件通过 / 不通过 / 证据不足；收益结论固定为「未验证」，Layer 3 端到端指标记 `not-run`。报告标题不得写成「完整审查通过」。

## 1. 已核实的起点事实

以下由命令在 2026-11-04 读取，启动时必须重新执行 S0 刷新，不能沿用。

- 对象：`src/cli/contracts/dual-host-governance/skills-governance.json` 登记 38 个 Skill，`skills/` 下 38 个 Skill 目录，另有 `skills/_shared`（共享引用，不是入口）。
  - `workflow_command` 17：spec-app-consistency-audit、spec-brainstorm、spec-code-review、spec-compound、spec-compound-refresh、spec-debug、spec-dogfood、spec-doc-review、spec-ideate、spec-runtime-setup、spec-optimize、spec-plan、spec-polish、spec-prd、spec-work、spec-write-skill、spec-write-tasks
  - `standalone_skill` 17：autoresearch、spec-prototype、spec-resolve-pr-feedback、spec-explain、spec-handoff、spec-lfg、spec-pov、spec-product-pulse、spec-promote、spec-project-rules、spec-riffrec-feedback-analysis、spec-rule-miner、spec-simplify-code、spec-sweep、spec-strategy、spec-test-xcode、using-spec-first
  - `internal_only` 4：spec-commit、spec-commit-push-pr、spec-worktree、spec-test-browser
- 行为资产：38 个 Skill 都有 `evals/eval.yaml`，`skill-up validate` 全部通过；共 157 个 case。Judge 中 109 个为 script、40 个为 rule_based。
- 运行配置：38 个 suite 的 engine 都是 `claude_code`，`environment.type` 都是 `none`，model 未固定；skill 来源是 `local_path: .`，即运行时读取磁盘 source。
- 工具：`skill-up` 0.12.0、`claude`、`codex` CLI 均在 PATH 中。`skill-up run` 支持 `--dry-run`、`--model`、`--parallelism`、`--iteration`、`--event-log`、`--output-dir`、`--format json/junit`。
- 时长上界：157 个 case 中多数默认超时 900 秒。全部串行、每个都跑满超时，约 39 小时；并发 4 约 10 小时。这是上界，实际值由 S1 试点校准。

## 2. 启动前一次性登记（运行中不再询问）

在 `reviews/runs/<YYYY-MM-DD>-full-one-pass/report.md` 第 1 节写入下列决定，作为本轮唯一授权来源。缺一项不启动。

| 决定 | 需要填写 | 建议默认 |
|---|---|---|
| 范围 | 全部 38 个 Skill + `_shared` 消费面 | 全部 |
| 本地写入 | 只写本轮 run 目录与隔离 worktree | 是 |
| Skill / runtime / 提交 | 修改被审 Skill、刷新 runtime、提交、推送 | 全部禁止；审查只报告 |
| 模型调用 | engine、固定 model ID、并发上限、费用或时长上限 | `claude_code`、写明具体 model、并发 4 |
| 第二引擎 | 是否允许 `codex` 作为独立复核者（会把源码与日志发给另一服务） | 由 owner 决定；不允许则复核记为同模型新上下文 |
| 超预算策略 | S1 外推超预算时自动采用的收缩方案 | 「重型与主链路跑全部 case，其余只跑结构层，未跑部分记 `not-run`」 |
| 失败重跑 | case 失败后是否做稳定性采样 | 只对失败 case 追加 `--iteration 3`，单独报告，不覆盖首轮结果 |
| 停止条件 | 出现越权写入、破坏工作区、凭据泄露时立即停止 | 是 |

登记后，「超预算策略」已经替代 workflow 第 3 节中的 owner 确认；运行中只有命中停止条件才中断。

## 3. 角色与独立性

| 角色 | 由谁执行 | 能看到什么 | 不能看到什么 |
|---|---|---|---|
| Orchestrator | 主会话 | 全部 | — |
| Reviewer（每个包一个） | 新上下文 agent | 本包 Skill 源码清单、消费者、检查表 | 其他包的结论 |
| Executor | `skill-up run`（claude_code） | 被测 Skill source 与 case 输入 | judge 脚本、预期答案 |
| Judge | case 自带的 script / rule_based judge | 产物与判据 | — |
| Verifier | 另一个新上下文 agent；允许时用 codex | 单条 finding 及其源码、日志 | 原 reviewer 的推理过程 |

选择效应的控制：

1. **主行为集是现有 157 个 case**。它们在本轮开始前已提交，任务和判据先于本轮固定。报告中引用每个 case 文件的最后提交 SHA。
2. **补充场景**由 reviewer 设计，只用于补现有 case 未覆盖的检查项（尤其是 B03 授权负例和 B05 失败恢复）。全部补充场景在 S3 冻结后才执行，与主集分开统计。
3. Reviewer 不执行自己设计的场景，也不判定结果。

## 4. 分包

按 S0 实测规模分包，不按 Skill 个数平均。下表是 2026-11-04 的规模（`SKILL.md` 行数 / 全部文本行数），S0 重新计算后可调整。

| 层级 | Skill（全部文本行数） | 分包方式 |
|---|---|---|
| 重型 >5k | spec-prd 13055、spec-app-consistency-audit 10549、spec-plan 7882、spec-code-review 7659、spec-doc-review 5755 | 每个 Skill 一包；超过单个上下文时按 Phase/references 拆成子包，由同一包汇总 |
| 中型 1.4k–5k | spec-compound、spec-runtime-setup、spec-optimize、spec-sweep、spec-work、spec-compound-refresh、spec-pov、spec-ideate、spec-brainstorm、autoresearch、spec-riffrec-feedback-analysis、spec-polish、spec-write-tasks、spec-debug、spec-handoff、spec-commit-push-pr | 每个 Skill 一包 |
| 轻型 <1.4k | 其余 17 个 | 按关系 2–3 个一包，见下 |

轻型分组（相关 Skill 放一起，便于发现职责重叠）：

- spec-commit + spec-worktree
- spec-test-browser + spec-dogfood + spec-test-xcode
- spec-resolve-pr-feedback + spec-lfg
- spec-project-rules + spec-rule-miner
- spec-write-skill + using-spec-first
- spec-simplify-code + spec-prototype + spec-explain
- spec-product-pulse + spec-promote + spec-strategy

共 5 + 16 + 7 = 28 个 reviewer 包。

## 5. 阶段

每个阶段的出口条件都是「对应产物存在且自洽」，由 Orchestrator 用列出的命令核对。命令以仓库根为工作目录；`$RUN` 指本轮 run 目录，`$WT` 指隔离 worktree。

### S0 冻结与确定性底线（无模型调用）

1. 记录 `git rev-parse HEAD` 与 `git status --porcelain`。在冻结 SHA 上创建隔离 worktree：`git worktree add $WT <frozen-sha>`。后续所有 eval 都在 `$WT` 中运行，避免主工作区 dirty 文件混入 fresh-source。
2. 清点对象：governance 登记数、`skills/` 目录数（不含 `_shared`）、`evals/eval.yaml` 数三者一致，不一致就停止并报告。
3. 对每个 Skill 生成文件清单与 SHA-256，写入 `$RUN/evidence/manifest/<skill>.sha256`。
4. 运行确定性检查，原始输出存到 `$RUN/evidence/floor/`：`npm run typecheck`、`npm run lint:skill-entrypoints`、`npm run test:unit`、`npm run test:smoke`、对 38 个 suite 运行 `skill-up validate`、`skill-up list-cases`、`spec-first doctor --claude --json`（检查 runtime drift；engine 是 claude_code，所以至少查 Claude 宿主）。
5. **宿主加载隔离检查**：`environment: none` 表示 case 直接在本机运行，claude_code 可能同时加载用户级或项目级已安装的 runtime mirror（如 `~/.claude/skills`、`$WT/.claude/`）。确认被测 Skill 只来自 `local_path` source。确认不了时，在每个 behavior 结果上标注「可能混入 runtime 副本」，这一条不能省略。
6. 固定 model：所有 `skill-up run` 都带 `--model <登记的 ID>`。

出口：manifest 有 38 份；floor 日志齐全并记录退出码；隔离检查结论已写入报告。floor 失败不阻断后续，但相关检查项按失败计入。

### S1 试点与规模外推

1. 用 spec-plan（重型、主链路、9 个 case）走完 S2–S4 的全部动作。
2. 记录单位成本：读取文件数、检查项数、每个 case 的实际耗时与调用次数。
3. 按第 4 节层级外推总耗时与总费用，列出假设，与登记预算比较。
4. 超预算时直接执行登记的收缩策略，并把报告类型改为「全量单次审查（收缩）」，列出未承诺的对象与证据层。

出口：报告中有规模估算一节，并写明是否收缩、依据哪条登记。

### S2 逐 Skill 静态审查（并行，只读）

每个 reviewer 包的输入：本包 Skill 的 manifest、`skills-governance.json` 中的入口类型、`rg -l "skills/<skill>/" tests src` 得到的消费者与合同测试、workflow 第 4 节检查表。

每个 reviewer 必须：

- 完整读取 manifest 中的 `SKILL.md`、必读 references、scripts、templates；未读文件列出路径与理由。
- 逐行填写 D01–D08、B01–B06 和适用的 X01–X04：适用性、源码位置（文件:行）、确定性证据、行为证据位置（留给 S4 回填）、结果。
- 写出 finding：触发条件、源码位置、后果、严重度 P0–P3、置信度。
- 对现有 case 没有覆盖的检查项，最多设计 3 个补充场景，写成 skill-up `case.yaml` 草稿，judge 优先用 script 或 rule_based。

产物：`$RUN/skills/<skill>.md`（模板第 4 节格式）、`$RUN/scenarios/<skill>/*.yaml`。并发上限按登记执行。

出口：38 份 `skills/<skill>.md` 全部存在，每份都有 D/B 全部行。用 `rg -c '^\| [DBX]0' $RUN/skills/*.md` 核对行数。

### S3 冻结补充场景

1. Orchestrator 校验补充场景（`skill-up validate`），无效的退回 reviewer 修一次，仍无效就记为 `not-run`。
2. 为全部场景计算 SHA-256，写入 `$RUN/evidence/scenario-freeze.sha256`，并记录冻结时间。冻结之后不再增删；确需改动时写明理由，旧版本保留。
3. 补充场景放在 run 目录中，不写入 `skills/`，因为本轮不修改被审 Skill。

出口：冻结清单存在，且早于任何补充场景的执行记录。

### S4 行为执行

对每个 Skill，在 `$WT` 中运行：

```bash
skill-up run skills/<skill>/evals/eval.yaml \
  --model <登记的 ID> --parallelism <登记值> \
  --format json --format junit \
  --event-log $RUN/evidence/behavior/<skill>/events.jsonl \
  --output-dir $RUN/evidence/behavior/<skill>/main
```

补充场景另跑一次，输出到 `.../<skill>/supplementary`。按登记策略，只对首轮失败的 case 追加 `--iteration 3` 稳定性采样，结果另存，不改写首轮。

每个 case 记录：首轮结果、最终结果、耗时、调用次数、失败原因摘要、原始产物路径。超时、引擎错误、fixture 准备失败记为 `inconclusive`，不记为 Skill 失败。

出口：结果表中的 case 数等于 S0 `list-cases` 的总数加上冻结的补充场景数；缺一个就逐条说明。

### S5 跨 Skill 检查

1. **入口路由（B01）**：用不点名 Skill 的请求，测试相似入口之间的分流。至少覆盖以下相邻对：spec-debug / spec-work、spec-brainstorm / spec-ideate、spec-prd / spec-brainstorm、spec-plan / spec-write-tasks、spec-code-review / spec-resolve-pr-feedback、spec-commit / spec-commit-push-pr、spec-test-browser / spec-dogfood / spec-polish、spec-compound / spec-compound-refresh、spec-project-rules / spec-rule-miner、spec-pov / spec-doc-review。优先复用 using-spec-first 的现有 case；不足部分作为补充场景，在 S3 一并冻结。
2. **主链路交接 H01–H05、ML-01–ML-07**：先映射到现有 case（如 spec-plan 的 `consumer-replay-cases.json`、spec-work 与 spec-code-review 的 case），映射不到的才作为补充场景。逐项写明由哪个 case 覆盖。
3. **共享引用**：`skills/_shared` 的每个消费者是否与源一致，用现有 `shared-skills-consumer-protection` 与 `skill-script-mirror-parity` 测试结果作证据。
4. **职责重叠**：比较轻型分组和相邻对的 S2 结论，记录重叠或空档。

出口：相邻对、H、ML 每一项都有 case ID 或 `not-run` 理由。

### S6 发现复核

需要复核的对象：全部 P0/P1 finding，以及 S4 中全部首轮失败的 case。

Verifier 对每一条独立给出：`confirmed` / `false-positive` / `inconclusive`，以及归因（Skill / 模型 / 工具或 fixture / 环境 / 未知）。只有 `confirmed` 且归因为 Skill 的条目，才能作为对象「不通过」的依据。Eval 失败本身不等于 Skill 缺陷，fixture 过期、环境差异、引擎错误都要区分。

去重：同一根因、同一修正位置的 finding 合并，保留全部受影响对象。

出口：每条待复核项都有结论；`confirmed` 的数量与 finding 清单一致。

### S7 汇总

产出 `$RUN/report.md`（按模板）、`$RUN/ledger.md`（38 行对象台账）、`$RUN/findings.md`。

确定性核对（结果写进报告）：

- `ls $RUN/skills/*.md | wc -l` 等于 38。
- 台账行数等于 38，且每个对象的结论只取四个允许值之一。
- 行为结果表中的 case 总数，等于 S4 出口记录的总数。
- 报告中的每个通过率都写出分子和分母；按 Skill 分别给出，不合成一个总体百分比。

三个状态按 workflow 第 9 节判定：审查执行、被审对象（逐个对象）、收益（固定为「未验证」）。

### S8 收尾

1. 不修复任何 finding，只给出最小修复位置、复验方式和 owner。
2. 写出失效条件：冻结 SHA 之后任何 `skills/`、`src/cli/`、eval case、model 或 engine 版本变化，都会使相关结论失效。
3. 删除隔离 worktree：`git worktree remove $WT`。run 目录保留。

## 6. 产物目录

```text
reviews/runs/<YYYY-MM-DD>-full-one-pass/
├── report.md                 # 按模板；三个状态、规模估算、限制
├── ledger.md                 # 38 个对象的台账
├── findings.md               # 去重后的 finding 与复核结论
├── skills/<skill>.md         # 38 份逐 Skill 记录
├── scenarios/<skill>/*.yaml  # 补充场景（冻结后不改）
└── evidence/
    ├── floor/                # S0 确定性检查原始日志
    ├── manifest/             # 每个 Skill 的文件 SHA-256
    ├── scenario-freeze.sha256
    ├── behavior/<skill>/{main,supplementary}/
    └── verify/               # S6 复核记录
```

## 7. 已知风险

| 风险 | 影响 | 处理 |
|---|---|---|
| `environment: none` 时 claude_code 加载本机已安装的 runtime 副本 | behavior 结果可能测的是 mirror，不是 source | S0 第 5 步检查；确认不了就逐条标注 |
| model 未在 eval.yaml 固定 | 结果不可复现 | 每次运行都带 `--model` |
| Executor、Verifier 与 Judge 来自同一模型族 | 独立性有限 | 如实记录；允许时用 codex 复核 |
| 现有 case 由 Skill 作者编写 | 可能与 Skill 盲区一致 | 用补充场景补检查项缺口，两组分开统计 |
| 157 个 case 的覆盖不均（spec-explain、spec-sweep、spec-write-skill、spec-test-xcode 各只有 1 个） | 这些对象的 behavior 证据薄 | 补充场景优先补这些对象；仍不足时对象结论记「证据不足」 |
| eval 运行可能在本机写文件 | 污染工作区 | 只在 `$WT` 中运行；S8 前核对主工作区 `git status` 未变 |

## 8. 在 Kiro 中启动

确认第 2 节登记内容后，可以用 Kiro 的 `run_workflow`（`workflowPrompt` 形式）启动。下面这段可以直接作为 brief，替换尖括号中的登记值：

```text
任务：按 docs/plans/2026-11-03-skill-optimization-initiative/process/FULL-REVIEW-ONE-PASS.md
执行一次「全量单次审查」，规则以同目录 REVIEW-EXECUTION-WORKFLOW.md 为准。
仓库：/Users/kuang/xiaobu/spec-first，冻结基线为当前 HEAD <sha>。
需要隔离 worktree：在冻结 SHA 上创建，所有 eval 只在 worktree 中运行，结束后删除。
范围：skills-governance.json 登记的全部 Skill 与 skills/_shared 消费面。
已登记授权：只写 run 目录与 worktree；禁止修改 skills/、刷新 runtime、提交、推送。
模型：claude_code，model <ID>，并发 <N>，上限 <时长/费用>；第二引擎复核 <允许/不允许>。
超预算策略：<登记内容>。失败 case 追加 --iteration 3，单独报告。
步骤：按方案 S0–S8 顺序执行；S2 按第 4 节 28 个包并行；S6 复核与 S2 由不同 agent 完成。
完成判据：方案第 5 节各阶段出口全部满足，S7 的确定性核对全部写入 report.md；
field_outcome 与收益结论不在本轮承诺范围内。
任务规模：重型，跨 38 个 Skill、多个阶段、长时间运行。
```

也可以不用 Kiro workflow，由一个会话按 S0–S8 手工推进；规则和出口条件相同。
