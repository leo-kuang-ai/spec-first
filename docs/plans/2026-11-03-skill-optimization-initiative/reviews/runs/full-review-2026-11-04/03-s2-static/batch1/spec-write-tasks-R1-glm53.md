# spec-write-tasks 评审（R1）

评审基线：worktree `5b59293b`，只读静态审查（fresh-source）。已通读 `SKILL.md`（142 行）、三个 references 全文（handoff 143 行 / schema 353 行 / quality guide 327 行）、确定性验证器 `src/cli/task-pack.js` 全文、7 个消费者测试中与 write-tasks 相关的全部断言、evals 目录结构与抽样、CHANGELOG 演化链。未执行任何测试命令（沙箱审批受限，运行层证据记 not-run，不影响静态裁决）。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:113-118；task-pack-command.test.js:316；CHANGELOG.md:1454、1546 | 每条硬规则都可回溯真实失败类（SF-04 自由文本 Review complete、cwd 相对 operand、spec_id 过度拒绝），未发现无依据的过时约束或相互矛盾 |
| D02 | pass | task-quality-guide.md:109-122、184-195、252-267；task-pack.js:26-60；analyze-task-pack-quality.js:224-225 | 编码了大量项目领域知识（fan-out、垂直切片、assurance trace、bad smells 表）；脚本/LLM 职责在 validator、analyzer（`advisory_only: true`）、SKILL.md:64 三处一致分界 |
| D03 | pass | SKILL.md:113-115；src/cli/commands/tasks.js:20-24；task-pack.js:602；spec-work/references/work-intake-and-task-pack.md:44 | 验证门有真实 owning CLI（`tasks validate/hash --repo`）与正反例测试；`deterministic_handoff` 仅由 CLI 结果推导；关键出口（执行）由下游 spec-work 独立重验，gate-the-exits 成立 |
| D04 | pass | spec-plan/SKILL.md:31；spec-work-intake-contracts.test.js:31；spec-doc-review-task-pack-contracts.test.js:72-92；handoff:76-82 | 上下游三边（plan→tasks→work/doc-review）的字段交接被消费者测试双向锁定；发现 1 条 P3 legacy 词汇问题（见 Findings #2） |
| D05 | pass | SKILL.md:137-141；spec-write-tasks-contracts.test.js:30-59 | 入口 142 行 + 按分支加载的 references，summary/detail 重复由测试锁定；存在 3 处轻微不一致（Findings #3/#4/#5，均 P3） |
| D06 | pass | handoff:57、76；task-quality-guide.md:45、56-68；evals/eval.yaml:10-12 | 能力假设有界且降级诚实：CLI 不可见→`unverifiable_hash`→draft-only；LSP 可选；degraded 信号明确不参与决策、不作 gate |
| D07 | pass | CHANGELOG.md:990、1454、1764；docs/validation/spec-write-tasks/（scorecard + downstream_consumer_outcome） | 问题→修订→复验链完整（SF-04 关闭、U1/U3 落地、优化提案按证据关闭并留 ~20 样本重开条件），知识带失效条件 |
| D08 | pass | SKILL.md:73、77、87、91；task-quality-guide.md:51-53、152-165 | 读取范围按 plan 聚焦章节 + 分支按需加载 reference + context_refs 压缩规则 + “复用已加载宿主指令”，上下文经济性有显式设计 |
| B01 | pass | SKILL.md:3（正负触发词）；using-spec-first/references/public-route-map.md:12；agents/openai.yaml:11 | 正向/负向/相似入口负例齐备；`allow_implicit_invocation: false`；不强迫串行经过（spec-work 明确 never auto-compile） |
| B02 | pass | 7 个消费者测试（consumers.txt 全部）；evals/README.md:9-24 | 入口/reference/script/consumer 一致性由合同测试锁定；eval README 明确区分确定性断言与模型评测，不互相冒充 |
| B03 | pass | SKILL.md:66、118；handoff:82、90-99 | 只编译不执行；写入仅限 `docs/tasks/` 派生产物；`--repo` 明确非 mutation 授权；dispatch 授权条件严格且 fail-closed |
| B04 | pass | SKILL.md:65、126；task-pack.js:247-252、825-831；plugin-sync.js:500-504；templates/claude/commands/spec/write-tasks.md | source/runtime 边界三层落实：Core Rule 8、validator 拒绝 runtime mirror 文件所有权、打包器排除 `evals/`；命令模板存在 |
| B05 | pass | SKILL.md:40；handoff:57、76；task-pack.js:127-164；task-pack-schema.md:339-353 | 失败码枚举齐全；未执行验证/工具缺失/未知子命令各有明确降级路径；non-active 计划 fail-closed；重复执行由 Regeneration Rules 约束 |
| B06 | pass | handoff:10-38、55-59；evals/README.md:19；SKILL.md:106-118 | 交付以 envelope 收口（validation posture + limitations）；unperformed-validation 规则禁止伪造；eval 资产显式标注 `missing evidence` 不冒充已证 |
| X01 | pass | task-pack.js:956-981；task-pack-schema.md:130-137；task-quality-guide.md:109-122 | 本 Skill 核心职责即长任务分解：waves/依赖/fan-out/按解析仓库判定同波重叠，全部有确定性防护 |
| X02 | fail | task-pack-schema.md:174；git: e9fe0769 删除、e9fe0769~1:tests/unit/spec-write-tasks-contracts.test.js:173 原存在；`git grep ALLOWED_TASK_FIELDS HEAD -- tests/` 为空 | schema 维护契约声称“parity test 强制双向同步、任一侧删字段即红”，该测试已在 2026-08-04 合并 e9fe0769 中被删除且未迁移，承诺与仓库现状不一致（P2，Findings #1） |
| X03 | pass | handoff:84-99（97 行 fail-closed 字段清单）；task-quality-guide.md:184-195 | 高风险 pack 强制走 `review-task-pack`，续接前逐字段校验完整 JSON envelope；required proof intent 无损投射且 unbound 必须留 limitation |
| X04 | pass | handoff:12-38、99；task-pack-schema.md:329-353 | 跨消费者交接产物携带 source refs、freshness（body-hash）、limitations、regeneration 规则；自动续接被限定为单边（write-tasks→doc-review）不成为编排器 |

## Findings

1. **[P2][X02/D03] schema 声称的 field parity 测试不存在（承诺的变更防护落空）**
   - 位置：`skills/spec-write-tasks/references/task-pack-schema.md:174`
   - 事实：该行声称 “a parity test enforces bidirectional sync… so dropping a field on either side fails the test”。该测试由 a98b9b89（2026-06-13）加入 `tests/unit/spec-write-tasks-contracts.test.js`（旧 513 行版本第 173 行起），在 2026-08-04 合并 e9fe0769 重写该测试文件（513→64 行）时被删除，未迁移到任何其他文件；当前 `tests/` 中无任何文件引用 `REQUIRED_TASK_FIELDS`/`ALLOWED_TASK_FIELDS`。
   - 后果：schema 字段表与 `src/cli/task-pack.js:26-60` 字段集之间的“同改”纪律目前零机械防护——任一侧增删字段（如 `handoff_owner`、`semantic_posture_evidence`）不会红灯；维护者按文档相信有防护而被误导。当前两侧恰好人肉同步（我逐字段核对无实际漂移），但护栏承诺是假的。
   - 最小修复：从 `git show e9fe0769~1:tests/unit/spec-write-tasks-contracts.test.js` 复活该 scoped parity 测试（含 schema markdown 字段表解析），或将 schema:174 改写为“必须同改；当前无测试强制，靠 review 把关”。前者优先，成本一个测试。

2. **[P3][D04] Input Paths 章节名清单偏 legacy 词汇，与当前 unified plan 契约不完全对齐**
   - 位置：`SKILL.md:73`
   - 事实：清单为 “Requirements, Scope Boundaries, Technical Approach, Implementation Units, Files, Test Scenarios, Verification, and Deferred to Implementation”。当前权威契约 `skills/spec-plan/references/plan-sections.md:70-88` 的 unified 注册表使用 Planning Contract（取代 Technical Approach 定位）、Verification Contract、Definition of Done、Goal Capsule；“Deferred to Implementation” 在 unified 契约中是开放问题分类而非章节。
   - 后果：对 unified plan 编译时，executor 可能去找不存在的 “Technical Approach” 标题、漏读 Definition of Done / Goal Capsule（后者含 stop conditions，直接影响 `stop_if` 质量）。语义影响有限（task-ready 判据是形状而非标题），但清单是硬指引。
   - 最小修复：清单改为双词汇标注（unified 名称 + legacy 别名），并补 Definition of Done / Goal Capsule。

3. **[P3][D05] SKILL.md envelope 必填字段清单与 handoff 契约漂移**
   - 位置：`SKILL.md:112` vs `references/execution-handoff-contract.md:17、24`
   - 事实：handoff envelope 含 `repo_root`（同值兼容别名）与 `reason`（一句话解释）；SKILL.md:112 的 required 清单未列这两项。
   - 后果：只按 SKILL.md 清单产出的 envelope 缺 `repo_root`/`reason`，与 handoff 契约不一致；下游若按别名消费会缺字段。
   - 最小修复：SKILL.md:112 清单补两字段，或注明“完整字段集以 handoff 契约为准”。

4. **[P3][D05] lifecycle-unmanaged 限制码三个变体并存**
   - 位置：`SKILL.md:67`（`source-plan-lifecycle-unmanaged`）vs `src/cli/task-pack.js:530`（实际输出 limitation code `task-pack-source-plan-lifecycle-unmanaged`）vs `task-pack.js:143`（内部 reason_code `source-plan-lifecycle-unmanaged`）
   - 后果：消费者按 SKILL.md 写的 code 匹配 CLI 输出会匹配不上。
   - 最小修复：SKILL.md:67 统一为 validator 实际输出的 `task-pack-source-plan-lifecycle-unmanaged`。

5. **[P3][D03] handoff 先展示无 `--repo` 的裸命令，弱化显式 artifact-root 纪律**
   - 位置：`references/execution-handoff-contract.md:63-65`（裸形式）先于 68-72 行（`--repo` 规范形式）
   - 事实：cwd 相对解析是已证实失败模式（`tests/unit/task-pack-command.test.js:316` "resolves task-pack operands from --repo instead of the caller cwd"）；SKILL.md:113 与 quality guide 均只给 `--repo` 形式。
   - 后果：快速读者可能复制第一个代码块，得到 cwd 相关的解析结果。
   - 最小修复：删除裸形式代码块，或标注其仅为子命令形状示例、规范调用必须带 `--repo`。

6. **[P3][D05·观察] 中英混排段落与英文规则重复陈述**
   - 位置：`SKILL.md:71、120`；`execution-handoff-contract.md:88、97`
   - 事实：中文插入段（非活跃计划交接、高风险 review 消费规则）在英文正文已有对应规则的文件里二次陈述同一契约；关键句有测试锁定（spec-doc-review-task-pack-contracts.test.js:72-92），漂移风险受控。
   - 后果：轻微扫描与翻译漂移成本。保持现状成立（测试已锁关键句）；若收口建议统一语言并把差异规则合并进单一小节。

## 主责深挖面发现（D01-D05 + D08）

- **D01（去补丁化）**：未发现“为补模型能力而堆砌”的规则。抽查验证了三条高风险规则的失效来源：①handoff:97 的逐字段 fail-closed 清单源自 SF-04「只消费自由文本 Review complete」真实事故（CHANGELOG.md:1454），且该清单与 spec-doc-review 输出契约由测试互锁，不是孤立补丁；②`--repo` 纪律源自 cwd 解析事故；③spec_id 降级为 optional trace 源自过度拒绝的历史修复（CHANGELOG.md:1546）。a98b9b89 对「never silently dispatch」的反转是显式用户决策且条件收窄为单边续接，去补丁化判断成立。唯一近似补丁味道的是 handoff:97 清单长度（硬编码 7 个 JSON 字段），但它有测试锁定且有真实失效背景，判为合理防御。
- **D02（领域知识）**：quality guide 的 Large Implementation Unit Fan-Out（109-122）、Horizontal slicing smell（252-267 行表格）、Assurance Trace Preservation（184-195，含“不得用 synthetic check 伪装”）是超出通用最佳实践的项目级知识；`task-governance-signals.v1` 的 degraded 处理规则（45 行）编码了具体工具的已知缺陷行为。脚本侧 analyzer 明确 `advisory_only: true` / `score_is_signal_not_gate: true`，与 SKILL.md:134 的 Do Not 条款互证，职责分界干净。
- **D03（验证门）**：静态层可确认的链条完整：SKILL.md 🔴 GATE → `tasks validate/hash` CLI（src/cli/commands/tasks.js:20-24，index.js:71 分发）→ `validateTaskPack`（task-pack.js:383-604，`deterministic_handoff` 仅在 validity=valid 时为 true，602 行）→ 下游 spec-work intake 再次独立运行同一 CLI 并 pin receipt（work-intake-and-task-pack.md:8、44）。GATE 标记本身是响亮约定而非 runtime 强制，但决定性出口（执行）由下游确定性重验兜底，符合项目 gate 姿势。运行层（模型是否真跑 CLI）本轮未测，属 run 阶段。
- **D04（衔接）**：三边交接（plan→tasks、tasks→work、tasks→doc-review）均有“生产者输出 + 消费者使用 + 测试锁定”三件套；唯一缺口是 Finding #2 的 legacy 章节词汇。`spec_id` 兼容迹的处理（双侧存在才校验、缺失留 limitation 不阻断）在生产者/消费者/schema 三处口径一致。
- **D05（紧凑性）**：总量约 965 行（入口 142 + references 823），按分支加载结构合理；重复均为 summary/detail 模式且有合同测试钉住。除 Findings #3/#4/#5 外无矛盾；删减任何一节都会损失可定位的规则或消费者锁定句，不建议瘦身。
- **D08（上下文效率）**：三级节约设计明确——入口只留契约摘要与分支路由（SKILL.md:77、87、91 按 need 才读 reference）；orientation 有明确 intake order（quality guide:51：先元数据/确定性事实，再 focused 章节，最后深引用）；“复用已加载宿主/项目指令”避免重读 AGENTS/CLAUME（53 行）；`context_refs` 有反模式清单（152-165 行）防止指针膨胀。未发现强制全量读取的路径。

## 未读文件

- `skills/spec-write-tasks/evals/{boundary-cases,expected-behavior-cases,failure-cases,output-quality-cases,yao-trigger-cases,semantic_config}.json`、`evals/output/cases.jsonl`、`evals/cases/` 其余 3 个 yaml —— 仅做枚举统计与抽样精读（enum 覆盖 5 decision/8 failure 全齐，source_refs 存在性由 eval-fixture-contracts.test.js:377-389 锁定）。后果：个别 case 的 prompt 措辞质量未逐条评估。
- `scripts/spec-write-tasks/run-output-evals.js` 全文（346+ 行）—— 只读用法与头部。后果：runner 内部判定逻辑未审；其输出契约由测试锁定，风险低。
- `tests/unit/dispatch-authorization-matrix-contracts.test.js` —— 只精读涉及 write-tasks 的 380-460 行。后果：dispatch 语义全集未逐条核；write-tasks 无 worker primitive 泄漏这一结论已由该段确认。
- `skills/spec-doc-review/references/task-pack-review-lens.md` —— 未直接读，仅经消费它的测试断言确认关键句存在。后果：lens 自身完整性属 spec-doc-review 评审范围。
- `src/cli/commands/tasks.js` 全文 —— 只核对子命令与 `--repo` 存在性。后果：CLI JSON 输出字段逐行对账未做（由 task-pack-command.test.js 覆盖）。
- 各宿主 runtime mirror（`.claude/` 等）—— 本 worktree 未生成，未做投射 drift 取证。后果：B04 结论限于 source + packager + validator 层，runtime 投射一致性未验证。

## 结论一句话

spec-write-tasks 是主链路中工程化程度最高的 Skill 之一：确定性地板真实、三边消费者交接被测试互锁、失败与降级路径诚实——唯一成立的实质缺陷是 X02 的 P2（schema 承诺的 field parity 测试已在 e9fe0769 合并中被删而文档未更新，字段集变更防护目前为零），连同 4 条 P3 文档漂移建议最小修复，不需要架构性改动。
