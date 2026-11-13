# spec-optimize 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-optimize/SKILL.md:11; skills/spec-optimize/scripts/experiment-worktree.sh:148-159; tests/unit/spec-optimize-contracts.test.js:53-56 | 抽样核对每条“补丁”均有真实失败或宿主约束来源（SKILL_DIR 因 Bash cwd、八进制索引因实测踩坑且有回归测试），未发现过时、矛盾或过度指导的约束 |
| D02 | pass | skills/spec-optimize/references/spec.md:21-41; references/optimize-spec-schema.yaml:226-229; references/measurement.md:7-12 | 编码了真实领域知识（hard vs judge 判定树、退化解 gate、noise_threshold 与 minimum_improvement 的语义区分），脚本/LLM 职责在多处显式划界 |
| D03 | pass | skills/spec-optimize/scripts/decide.cjs:344-412; scripts/measurement-admission.cjs:170-286; references/measurement.md:86 | 数值资格、admission、超时/censor 均为脚本强制且有单测锁定；prose gate 明确声明不冒充机械判定（"measure.sh remains a bounded executor and does not infer semantic authorization"） |
| D04 | pass | references/spec.md:16; references/loop.md:5-7; SKILL.md:47-49; tests/unit/spec-optimize-contracts.test.js:270-277 | 上游 spec 以 validation_rules 单一真相源校验；holdout 防泄漏边界贯穿 worker/judge/digest；下游消费者已裁剪到真实 artifact intake（测试锁定） |
| D05 | pass | references/experiment-log-schema.yaml:214-240,325-348; references/persistence.md:40-49 | outcome 状态机、checkpoint 表、状态转移图均可定位可审计；存在少量跨文件重复与一处注释口径重叠（见 Findings 1/2，非阻断） |
| D06 | pass | references/measurement.md:113; references/loop.md:185; SKILL.md:154; references/optimize-spec-schema.yaml:186-192 | 能力假设处所有诚实降级路径（无 Node→阻断而非猜测比较、judge 不可用→error 不内联评分、串行 fallback 不宣称并行覆盖）；judge 模型枚举偏窄见 Findings 4 |
| D07 | pass | tests/unit/spec-optimize-contracts.test.js:53-56,111-113; references/measurement-only-calibration.md:37-39; SKILL.md:168; references/wrap-up.md:63 | 失败→修订→回归测试链可追溯（八进制/空格路径 bug）；v1→v2 admission 迁移禁止重贴标签；知识有入（learnings-researcher）有出（spec-compound） |
| D08 | pass | references/loop.md:265-267; references/experiment-log-schema.yaml:20-23; SKILL.md:135; references/experiment-prompt-template.md:83,90-91 | 滚动窗口+strategy digest 替代全量 log、分阶段按需加载 reference、runtime mirror 默认排除、worker 只收 10 条压缩摘要，按需加载纪律完整 |
| B01 | pass | SKILL.md:3,25; references/spec.md:10; evals/cases/debug-request-routes-out.yaml; skills/using-spec-first/references/public-route-map.md:47 | 正向触发、负例（点名 spec-debug/spec-work 路由出）、eval 边界用例、路由图与 governance 入口（workflow_command/dual_host，skills-governance.json:329-341）齐备 |
| B02 | pass | SKILL.md:17-49; references/optimize-spec-schema.yaml:579-608; references/agents/learnings-researcher.md:168 | Workflow Contract Summary（inputs/outputs/artifacts/failure modes）与 references、schema 逐项对得上；failure modes 每条都有对应处置位置；推断显式标 inferred |
| B03 | pass | references/measurement.md:76-86; SKILL.md:143-156; references/loop.md:228; references/wrap-up.md:56; SKILL.md:125-130 | 测量执行 envelope、dispatch、commit/集成、报告落盘各自独立授权且“workflow invocation does not authorize dispatch”；measurement-only 显式无变更边界 |
| B04 | pass | SKILL.md:135; src/cli/contracts/dual-host-governance/skills-governance.json:329-341; tests/unit/opencode-adapter.test.js:240-266 | 真相源在 `skills/spec-optimize/`；generated mirror 列入默认上下文排除；八宿主投射由 governance 契约与 opencode 投射归一化测试覆盖 |
| B05 | pass | references/loop.md:292; references/persistence.md:64-73; references/loop.md:128,290; scripts/experiment-worktree.sh:426-434,459-488 | 124/125/censor 错误分类、result.yaml 崩溃恢复标记、容量反压、Codex 三连败熔断、幂等 create 与保所有权 cleanup 全部有定义且有测试 |
| B06 | pass | references/wrap-up.md:17,49-56; SKILL.md:13; references/persistence.md:36 | 最终改善须原始基线×最终集成源新配对确认、未确认如实标注、报告写后读回、授权出处与 caps 记录入 run evidence |
| X01 | pass | references/optimize-spec-schema.yaml:548-568; references/loop.md:76-85; SKILL.md:156 | 本 Skill 即长任务编排者：迭代/时长/plateau 预算、依赖预批、orchestrator 独占集成与 worktree 隔离齐备 |
| X02 | pass | SKILL.md:15; references/experiment-log-schema.yaml:28-31; references/measurement-only-calibration.md:37-39; references/measurement.md:197 | schema 为版本化接口：holdout 可选增量向后兼容、log schema additive 扩展、admission v1→v2 显式迁移规则、协议变更须另起 run 保留旧证据 |
| X03 | pass | references/loop.md:217; references/wrap-up.md:62; references/wrap-up.md:53,82 | 集成前语义反检（超上限收益须 countercheck）、mechanical-apply bar 含改后跑测试与测量失效重跑、分支保留+discard 需显式授权 |
| X04 | pass | references/persistence.md:66-73,30-36; references/measurement.md:14-16; references/wrap-up.md:63; references/experiment-log-schema.yaml:68-69 | 跨会话 resume 规则（只跳过已证工作、不伪造批准）、授权出处 provenance、知识消费（learnings）与沉淀（spec-compound）、limitations 字段齐备 |

## Findings

1. **[P3] `error` outcome 注释与独立 `timeout` outcome 口径重叠** — `references/experiment-log-schema.yaml:225`（`error # measurement command crashed, timed out, or produced malformed output`）与 `:227`（`timeout`）并存。后果：仅读 schema 的维护者可能把超时归入 `error`，破坏 outcome 统计口径（`loop.md:292` 已操作性地消歧：124=timeout、其余非零=error）。最小修复：从 `error` 描述中删去 "timed out"。静态合同内部一致性瑕疵，非阻断。
2. **[P3] 同域规则跨文件重复，存在漂移风险** — 首跑默认值在三处重复（`SKILL.md:80-87`、`SKILL.md:131`、`references/spec.md:97-98`，字段集略有出入：plateau 仅在 SKILL.md:131，judge 预算仅在 Quick Start）；judge 独立性规则在三处重复（`SKILL.md:168`、`references/measurement.md:143`、`references/loop.md:185-186`）。后果：当前数值一致，未来单点修改会引入矛盾且无测试锁定全部重复点。最小修复：以 `optimize-spec-schema.yaml` 默认值为唯一 canon，其余两处改为引用。
3. **[P3] `execution.backend: codex` 的 `yolo` 安全档位** — `references/optimize-spec-schema.yaml:486-492` 保留 `--dangerously-bypass-approvals-and-sandbox` 兼容值，`loop.md:160` 要求按用户选择（未设则每会话问一次）。后果：一个危险的宿主档位经由 spec 即可启用。**保持现状成立**：这是显式用户选举 + 文档披露的兼容值，宿主侧仍有自身权限边界；如要收紧，可要求该值必须写入已批准 spec 而不接受会话口头选择。
4. **[P3] judge 模型枚举偏窄** — `references/optimize-spec-schema.yaml:186-192` 仅允许 `haiku|sonnet`。后果：宿主模型族演进后需改 schema 才能用新模型当 judge。缓解已在位：`references/judge-prompt-template.md:12` 要求分别记录 requested/actual/serving identity，未知保持 unknown。最小修复：在描述中注明该枚举是宿主映射的逻辑名，或放宽枚举并保留默认 `haiku`。

## 主责深挖面发现

**D01（去补丁化）**：逐条审计了全部“疑似补丁”约束——SKILL_DIR 绝对路径规则（对应真实宿主行为：Bash cwd 是用户项目而非 skill 目录，SKILL.md:11 与 measurement.md:50 双处一致，且 opencode 投射测试消费该约定）；八进制索引归一化（experiment-worktree.sh:148-159，注释写明机理，tests/unit/spec-optimize-contracts.test.js:53-109 有正反例回归）；awk `$2` 截断修复（:54-63，同样有测试）；"validate against every rule, do not rely on a remembered subset"（SKILL.md:68，对应 LLM 遗忘条件规则的真实风险，且有测试断言）。未发现任何无法回溯到失败证据或物理约束的“防模型”补丁；write-then-verify 与“不信任内存”类规则针对长跑 agent 的上下文压缩这一真实失效模式（persistence.md:6-12 给出了理由）。无删除建议，故无需对照/回归方案。

**D02（领域知识）**：知识密度高且非口号——hard vs judge 的三分判定（spec.md:21-41 含“用户坚持 hard 时的警告”这一决策依据）；退化解 gate 先于 judge 花费的分层抽样设计；`noise_threshold`（run-to-run 抖动）与 `minimum_improvement`（样本组成方差）的显式区分（schema:226-229）；ladder/futility 的成本感知采样；holdout 防调参反流的完整纪律（loop.md:5-7“确认失败不能成为下一轮针对该集合调参的素材”）。职责分工被反复显式声明：decide.cjs 只做算术与计数（measurement.md:9-12、decide.cjs:2-5、schema 注释），LLM 拥有 3.4 的语义反检与授权判断。CE 来源与许可留痕完整（decide.cjs:2、usage-guide.md:142、ce-license.txt）。

**D03（验证门）**：盘点脚本强制 vs prose 约定的完整清单——脚本强制：decide.cjs（配置校验抛错→`decision: error` 且 CLI exit 1，1613 行测试覆盖含 holdout、ladder、futility、paired 边界）、measurement-admission.cjs（admit/allow-ab 的文件完整性+算术校验，含防复用 run_id/文件、防 caller 断言 noise floor）、measure.sh（124/125/censor 语义，测试锁定“命令自身 125 不算 censor”）、experiment-worktree.sh（所有权 manifest、pristine 检查、symlink/secret 拒绝）。prose 约定（approval gate、checkpoint、envelope 授权）均未伪装成机械判定，且关键处主动声明边界（`evidence_scope: file-integrity-and-arithmetic-only`，measurement-admission.cjs:283）。残留观察：CP-0~CP-5 无 runtime 强制器，但 persistence.md 把验证步骤写成 agent 自律程序而未声称已被强制，符合响亮约定标准。

**D04（阶段衔接）**：核对了五条边的生产者/消费者两侧——spec→loop（validation_rules 单一真相源，条件规则枚举在 SKILL.md:68 与 spec.md:16 双处一致）；learnings→假设（learnings-researcher.md:16 的 Invocation Contract 把知识转译为优化输入）；orchestrator→worker（模板变量表完整，含 holdout 泄漏即停条款，experiment-prompt-template.md:35）；orchestrator→judge（独立性三禁 + 身份分离记录，judge-prompt-template.md:12）；optimize→code-review/compound（wrap-up 选项 1/2）与人类审计者（comparisons 记录含 identity+limitations）。decide payload 契约明确“不要重构扁平 payload”（loop.md:195），防住了一类常见衔接歧义。伪边已清理（`spec-work` 不在 Downstream Consumers，两处测试锁定）。

**D05（紧凑性/可审计性）**：可定位性优良——outcome 枚举带 load-bearing 说明与完整状态转移图（experiment-log-schema.yaml:214-348），checkpoint 表、文件位置表、变量替换表齐备。cross-check 未发现语义矛盾：SKILL.md:13 的四条 decide 行为承诺逐条对上 decide.cjs 实现（required-objective win 可 keep＝`:497`；keep 前须确认+集成＝`:591` holdout 逻辑 + loop.md:207；target 全达标＝`:531-538`）；measure.sh 退出码与 loop.md:292 分类一一对应。问题集中在重复（Findings 2）与一处注释口径（Findings 1），均为 P3。

**D08（上下文效率）**：这是该 Skill 的强项——三层按需加载（SKILL.md 入口 → 分阶段 references → 按需 agents/scripts）；hypothesis 生成只读 digest+滚动 10 条而非全量 log（loop.md:265-267）；learnings-researcher 用 grep 预过滤避免读 200 文件的 frontmatter（agents/learnings-researcher.md:70-97）；repo-research-analyst 的 Phase 0 skip 规则显式裁剪无关扫描类别；judge 用批次+singleton 只给摘要不给全文；worker 模板明令“不读全量 log 与 digest”。未发现要求过度读取或摘要裁掉必要要求的指令。

## 未读文件

- `docs/plans/2026-11-03-skill-optimization-initiative/core/` 其余文档（00-07、09-12）——理由：任务指定以检查表 §4 与 core/08 为裁决基线，§4 已含各维必查问题；后果：若 core/05 对八维另有更细判据，本轮口径可能与其存在未察觉差异（不影响按 §4 的裁决有效性）。
- `tests/unit/dispatch-authorization-matrix-contracts.test.js` 全文（586 行）——仅读了 spec-optimize 相关段（30-70、240-270、425-460、530-586）并 grep 定位；后果：该文件对其他 skill 的断言未核，不影响 spec-optimize 相关行的核对。
- `tests/unit/opencode-adapter.test.js`、`tests/unit/ce-localization-round-1-remediation-contracts.test.js` 全文——分别仅读 spec-optimize 投射段（225-275）与 optimize 授权段（60-130）；后果：这两个文件中属于其他 skill 的断言未复核。
- `docs/contracts/context-governance.md`、`docs/contracts/workflows/scenario-capability-matrix.md` 仅读头部 50-60 行——SKILL.md 引用段已与开头条款比对一致；后果：两契约尾部若有 SKILL.md 摘要未涵盖的条款，本轮未逐行核（低风险：SKILL.md 以 "Follow" 指向契约本身为权威）。
- 消费者清单所列 11 个测试文件中，`spec-optimize-contracts/decide/loop-contracts/measurement-only-contracts` 四个已全文读完；`agent-persona-template-drift`、`python-runtime-resolution-contracts`、`remaining-script-defenses`、`skill-flow-p2-closure-contracts` 已全文或 spec-optimize 相关行读完。

## 结论一句话

spec-optimize 静态合同层 18 项全部 pass：脚本确定性地板（decide/admission/measure/worktree）与 LLM 语义判断的边界划分清晰、可定位、被 11 个消费者测试锁定，仅存在 4 条 P3 级非阻断瑕疵（注释口径重叠、规则重复、yolo 档位披露、judge 模型枚举偏窄），无需阻断性修改。
