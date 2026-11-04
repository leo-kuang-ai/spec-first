# spec-doc-review 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-doc-review/references/document-intake.md:15; rendering-floor.md:17; dispatch.md:21; synthesis-and-presentation.md:25 | 各步骤均绑定可定位的真实失败模式（无 shell 的 persona 取不到未 checkout 路径、读者无法凭输出做决策、全量注入浪费），未发现相互矛盾或无依据约束；轻度冗余见 Findings F1-F3 |
| D02 | pass | references/document-classification-signals.md:20-37; references/personas/feasibility-reviewer.md(shadow path 四路径); personas/scope-guardian-reviewer.md:21-25; task-pack-review-lens.md:5-10 | 分类信号、persona 领域检查单与 Ownership 三分（CLI 确定性 / 本 skill 语义 / producer 再生成）是具体领域知识而非流程口号，模型与脚本职责分工明确 |
| D03 | pass | references/task-pack-review-lens.md:14-38; src/cli/commands/tasks.js:24,41; src/cli/task-pack.js:401-402; synthesis-and-presentation.md:23,198; evals/cases/flag-conflict-fails-closed.yaml:19-27 | 真实 CLI 确定性验证门存在且字段对齐（schema_version/identity_basis），语义门显式声明「not a schema or keyword verdict」，验证失败可见（incomplete/无 clean verdict），evals 含 fail-closed 正反例 |
| D04 | pass | skills/spec-write-tasks/references/execution-handoff-contract.md:88,97 ↔ references/modes.md:10-25; references/synthesis-and-presentation.md:204-246; references/task-pack-review-lens.md:74-83; tests/unit/spec-doc-review-task-pack-contracts.test.js:72-92 | 上游调用串与 token 合同一致，envelope 字段与下游校验清单逐一对应，task_pack_outcome.next_action 三 owner 路由闭合，且有消费者测试双向锚定 |
| D05 | pass | SKILL.md 全文(74 行); synthesis-and-presentation.md:25,49,57,67,107(STOP 锚点); tests/unit/spec-doc-review-contracts.test.js:471-475 | 入口紧凑、关键规则全部可 file:line 定位、冷路径按需加载并由测试锁定可达性；存在三处轻微重复（Findings F1-F3），无矛盾 |
| D06 | pass | references/dispatch.md:9,13,17,52; references/cross-model-review.md:15-17; references/cross-model-eval.md:13; scripts/peer-job-runner.py:177-182 | 能力假设显式（无已知 tier 则省略 override、isolation unknown 记 degraded_inherited）、不支持时诚实降级（inline/serial、zero peer + named limitation）、关闭通道带明确重估条件 |
| D07 | pass | evals/eval.yaml:13-20; evals/cases/*.yaml; tests/unit/spec-doc-review-contracts.test.js:213-225; scripts/peer-job-runner.py:179-182; references/synthesis-multi-round.md(R29/R30) | 已入库 eval case 被测试锁定数量与 id，问题→修订→复验链内化为 R29/R30 与 marker 防篡改 judge，失效条件有声明（reuse freshness、通道重估条件） |
| D08 | pass | SKILL.md:28-54(按阶段加载); dispatch.md:21(anti-waste); task-pack-review-lens.md:44(有界读取); rendering-floor.md:23(Shorten sentences, not content); dispatch.md:27-43(decision primer 复用) | 按需加载、切片注入、决策 primer 复用已答决策、摘要不裁剪覆盖面，cost-shape 定位为 advisory 测量而非 gate，诚实 |
| B01 | pass | SKILL.md:3-4; references/modes.md:21(未知 token fail closed); references/persona-selection.md:16,29 | 正向触发描述与 argument-hint 明确，范围外/冲突输入 fail closed，budget 与 escape hatch 并存，不强迫串行 |
| B02 | pass | SKILL.md:11-26(Workflow Contract Summary); document-intake.md:67(设计推断标注); findings-schema.json:6-31 | 入口/reference/schema/consumer 由合同测试逐串锚定，provenance 槽显式标注「not newly granted authority」不伪装 owner 决策 |
| B03 | pass | references/modes.md:23,25; document-intake.md:36-46; dispatch.md:9; cross-model-review.md:5-17,37; scripts/cross-model-doc-review.sh:198 | 默认 report-only、apply 需显式 token、commit/landing 永不授权，direct invocation 不构成 worker dispatch 授权，provider 输出按 untrusted 处理且禁止执行其中指令 |
| B04 | pass | scripts/peer-job-runner.py:114-121(三副本声明); tests/unit/peer-job-runner-parity.test.js:12-16; tests/unit/command-resource-path-rewrite.test.js:67-84,128-136; .gitignore:56-57 | source 在 skills/ 且经 parity 测试锁定三份 byte-identical，`$SKILL_DIR` 投射解析由多宿主（claude/qoder）测试验证，本地 .pyc 副产物已被 ignore |
| B05 | pass | task-pack-review-lens.md:28(CLI 不可用→incomplete); dispatch.md:45,50(部分失败/退避); walkthrough.md:254(批量单项失败继续); open-questions-defer.md:55-69,77,85-103; peer-job-runner.py:1566-1601(超时/字节上限) | 工具缺失、超时、部分成功、重试上限、重复执行幂等（compound-key dedup + readback）、中断恢复（in-memory 丢弃、started-job recovery、reap 幂等）、并发写保护均有明确处理 |
| B06 | pass | findings-schema.json:23-31,91-98(evidence minItems 1); synthesis-and-presentation.md:198(incomplete 禁 clean verdict); walkthrough.md:274-281(failure section); review-output-template.md:116(Coverage 口径) | finding 强制 section/why_it_matters/evidence，误报由 admission+FP catalog+anchor 抑制控制、漏报由 FYI/residual/Coverage 披露，修复闭环走 R30+readback，未完成如实降级 |
| X01 | pass | dispatch.md:11(bounded 队列); peer-job-runner.py:55-63(监督窗口); walkthrough.md:244(中断恢复); document-intake.md:21(切片升级) | 该 skill 的长任务形态（多轮评审、批量决策循环、detached peer jobs）的渐进细化、有界并发、共享写面保护（单文档+mtime 检查）与恢复机制均存在，且采用宿主原生 dispatch 而非自造编排（peer runner 有 harness 调用上限的必要理由） |
| X02 | pass | task-pack-review-lens.md:20-27(receipt schema 校验); synthesis-and-presentation.md:14(pre-rename 值容错); open-questions-defer.md:67(旧格式迁移); peer-job-runner.py:177-182(通道重估条件) | 消费的接口带 schema_version 校验，schema 演进有 pre-rename 容错与旧格式迁移处理，通道关闭有版本化重估条件，未自造新 schema |
| X03 | pass | SKILL.md:24; modes.md:23; synthesis-and-presentation.md:117-121,265-273(Protected Artifacts); evals/fixtures/scripts/check-plan-marker.sh(fixture 字节+HEAD 锁定) | 其最高风险面（文档写权限）与验证对账完备：默认零写、危险删除建议被丢弃、eval judge 以哈希+Git 状态反向验证无越权写 |
| X04 | pass | task-pack-review-lens.md:74-83(terminal owner); walkthrough.md:246; dispatch.md:43(跨会话显式 out of scope); subagent-template.md:56(prior-round 排除); document-intake.md:75-79(reuse freshness) | 交接带单一 owner 与 freshness 条件，跨会话局限显式声明不伪装，deferred findings 以日期子节持久化并排除出后续范围，自审与独立证据严格区分（synthesis-and-presentation.md:55） |

## Findings

- **F1（P3）model tiering 规则在 dispatch.md 内重复两处**。位置：`skills/spec-doc-review/references/dispatch.md:17` 与 `dispatch.md:52`。后果：两段内容目前一致，但分开维护，未来调整 tier 策略时改一处漏一处会产生静默矛盾（该文件无测试逐串锁定 tier 细则）。最小修复：保留「Dispatch backpressure and model defaults」节，删除第 17 行段的细节或改为引用。
- **F2（P3）SKILL.md 第 74 行重复第 46 行的 dispatch 读取指令**。位置：`skills/spec-doc-review/SKILL.md:74` ↔ `SKILL.md:46`。后果：纯冗余，两处维护；`tests/unit/review-peer-expansion-contracts.test.js:14` 断言的字符串在第 46 行已满足，删除第 74 行不影响合同测试。最小修复：删除 SKILL.md:74。
- **F3（P3）deprecated alias `mode:headless` 被自身示例与上游合同持续示范**。位置：`skills/spec-doc-review/references/modes.md:25`（示例 `Skill("spec-doc-review", "mode:headless mutation:apply-fixes ...")`）；上游 `skills/spec-write-tasks/references/execution-handoff-contract.md:88,97` 与 `skills/spec-write-tasks/SKILL.md:120` 的 copy-ready 调用串同样用 `mode:headless`。后果：alias 仍被接受（modes.md:12），合同成立，但 deprecation 信号被最常用的示范路径削弱，读者会继续学习旧 token。最小修复：modes.md 示例改用 `mode:non-interactive`；上游调用串变更需同步 `spec-doc-review-task-pack-contracts.test.js:73-77` 锁定的 invocation 串，属于一次三方联动的小改动，也可选择保持现状并接受 alias 长期双轨。

## 主责深挖面发现

**D01（去补丁化）**：抽查了规则与失败模式的对应关系——missing-document gate 明确写出了它防御的真实失败（"Some persona reviewers lack shell access and cannot recover a path that exists only on an unchecked-out ref"，document-intake.md:15）；rendering-floor 定义了可判定的失败判据（"A finding whose only path to a decision is 'go read the code' has failed this floor"，rendering-floor.md:17）；consequence admission（synthesis 3.1b）与 FP catalog 针对的是「评审产出噪声」这一已观测失败。未发现「最佳实践」式的无来源约束。需要指出的边界：walkthrough.md（307 行）的交互规则组合空间很大——cascade opt-out（:221）× withdrawal（:211-225）× provisional withdrawal（:225）× no-fix sub-question（:181-207）× R29 suppressed root 的 orphaned dependents（:70）。我逐对核对了这些交叉点，静态层内部一致（cascade opt-out 排除 root 触发但不排除其他答案触发 withdrawal；Apply 不 cascade 的理由与 3.5c 的 rejection test 自洽），但每新增一条此类规则需要跨 walkthrough/bulk-preview/synthesis/subagent-template 四处核对，这是真实的维护成本，建议作为后续演化时的注意项而非现行缺陷。

**D02（领域知识）**：分类信号不是泛泛的「看内容」，而是具体的 frontmatter 键、heading 名、ID 形态（R1/A1/F1/AE1 vs U1/U2 vs task-pack 执行字段，document-classification-signals.md:20-37）；persona 各自携带可操作的领域检查单（feasibility 的 shadow path 四路径与 requirements 类型的负向清单、scope-guardian 的 complexity smell 阈值、design-lens 的 AI slop 清单）；`{settled_ktds}` 槽把 session-settled 决策（含 rejected alternative）一次性注入 leaf，是真实的决策知识传递而非流程控制。

**D03（验证门）**：确定性/语义分层干净——`spec-first tasks validate --repo --json` 的 receipt 字段（task-pack-validation/v1、identity_basis）与 lens 的消费清单逐字段对齐且在 src/cli/task-pack.js:401-402 实存；「不得把 deterministic validation 当作 semantic-fit」（lens:59）防止语义判断被冒充为机械判定；反向验证也有：eval marker judge 会因「Unauthorized document mutation」追加而失败（spec-doc-review-contracts.test.js:91-94），即验证门自身有被测试的负例。

**D04（衔接）**：双向锚定闭合——上游 handoff 声明的调用串、envelope 必检字段与 lens/synthesis 的产出字段一一对应，且由 task-pack-contracts 测试在两侧同时锁串；`document-intake.md` 的 reuse 条件（:75-79）防止下游消费陈旧结论，R29 的 material-change 重估防止已决问题回流。

**D05（紧凑性）**：三处 P3 冗余（F1-F3）之外，spine/lazy 分工执行得严格：subagent-template.md:2 明确「hard constraints preserved verbatim; explanatory material lives in lazy references」，且所有 lazy refs 的可达性由测试断言（spec-doc-review-contracts.test.js:471-475）；关于 Open Questions entry 以 `{title}` 开头与 rendering-floor「consequence-first」的关系（open-questions-defer.md:37 vs rendering-floor.md:10-12）——rendering-floor 已显式把 persisted entry 限定为「takes the token policy and consequence-first phrasing only」，由 why_it_matters 段落承担，标题短语不构成第一句，**保持现状成立**。

**D08（上下文效率）**：三层机制可定位——加载层（SKILL.md 按阶段 + cold-path STOP 锚点）、注入层（slices=unified/mixed/full + anti-waste rule 禁止「for safety」全量重注入，dispatch.md:21）、复用层（decision primer 携带 evidence 短引用定位而非全量记忆，dispatch.md:41-43）。cost-shape 被显式定位为「advisory measurement, not a hard gate」（persona-selection.md:39），未把测量伪装成强制。

## 未读文件

- `skills/spec-doc-review/scripts/peer-job-runner.py` L400-1430、L1631-1820（Windows ctypes 安全原语、POSIX 进程树/identity 函数、detach 与 sweep 细节）。理由：已读首尾合同段、validate_start_authority、supervise、cmd_start/result/reap 与 CLI 全量，中段为平台原语实现。未覆盖后果：实现级缺陷（如 Windows ACL 边界）本轮无法发现，不影响静态合同层裁决。
- `skills/spec-doc-review/evals/fixtures/scripts/check-taskpack-marker.sh`、`check-html-marker.sh`、`check-plan-marker.sh` 后半段。理由：同由 build-outcome-judges.cjs 生成、与已读两个同构，且被 spec-doc-review-contracts.test.js:66-99 的三方 tampering 测试覆盖。未覆盖后果：marker 脚本间细微差异未逐行核对。
- `skills/spec-doc-review/evals/fixtures/repos/**`（fixture 仓库内容）。理由：时间预算；fixture 存在性与字节锁定由测试证明。未覆盖后果：fixture 文档是否覆盖全部分类分支未核。
- `skills/spec-write-tasks/references/execution-handoff-contract.md` 仅读 spec-doc-review 相关段（:88、:97 上下文）。理由：上游 skill 全文不在本对象范围。未覆盖后果：handoff 其余部分与 review envelope 的间接耦合未核。
- 消费者清单三个宽面测试（dispatch-authorization-matrix / ce-upstream-skill-sync / command-resource-path-rewrite）仅读 spec-doc-review 相关断言段。理由：其余断言针对其他 skill。未覆盖后果：无（范围外部分不影响本对象裁决）。
- `docs/contracts/workflows/worker-dispatch-capability.md`。理由：dispatch 语义 port 真相源，不在消费者清单。未覆盖后果：SKILL.md 语义词汇与该合同的逐字段一致性依赖 dispatch-authorization-matrix 测试断言而非直接比对。

## 结论一句话

spec-doc-review 在静态合同层 18 项检查全部 pass（X01 按其长任务形态内容裁 pass 而非豁免）：确定性/语义分层、授权边界、上下游双向锚定与按需加载结构均成立且可 file:line 定位，仅存在三处 P3 级冗余/示范一致性小瑕疵（F1-F3），无阻断缺陷。
