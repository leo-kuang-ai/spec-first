# spec-product-pulse 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-product-pulse/references/interview.md:183、skills/spec-product-pulse/SKILL.md:43,92 | 固定 top5/p99 不做配置的理由明确（report 无法可靠消费）、15m buffer 有 ingestion-lag 依据、Learn More 段解释设计意图；未发现过时或相互矛盾约束 |
| D02 | pass | references/interview.md:13-20,43,160-164,152 | SMART bar、engagement/value 判别测试、反模式话术、source-count 按比例判断、DB read-write 拒绝话术均为领域决策依据而非流程空转 |
| D03 | pass | references/run.md:14-24、references/report-template.md:70-80、evals/fixtures/scripts/check-source-outcomes.sh:207-215、tests/unit/spec-product-pulse-contracts.test.js:35-54 | 七态 receipt 合同 + post-write checklist + eval script judge 机械验证（failed≠zero、artifact 落盘、无远端写）+ 防虚假配置回归的合同测试 |
| D04 | pass | references/run.md:6、references/strategy-source.md:3、references/report-template.md:12、references/interview.md:125 vs 252 | Phase 1 编辑后强制重读 config、strategy 规则双端同源、metric 清单动态重读与 metric→source 映射持久化分离，无信息丢失/重复 |
| D05 | pass | SKILL.md:71、references/run.md:16,24、references/report-template.md:16,59,66,78、tests/unit/ce-localization-round-1-remediation-contracts.test.js:105-108 | 七态词表 5 处重复均由合同测试显式强制；PII/top5 等规则在各执行点可定位；未发现矛盾表述 |
| D06 | pass | SKILL.md:27、references/interview.md:140-142,212 | blocking question tool 条件式匹配+编号选项兜底、MCP 能力条件化+manual 降级、调度 primitive 缺失时给平台原生替代，降级路径完整 |
| D07 | pass | CHANGELOG.md:1898(v1.13.2 收敛虚假配置+防回归测试)、CHANGELOG.md:756(v1.15.3 拆 references+receipt 语义)、CHANGELOG.md:924(行为测评 91.0 零缺陷) | 失败→修订→防回归链完整可追溯（git log 7 次迭代），eval 资产可复用 |
| D08 | pass | SKILL.md:57、references/interview.md:3、references/strategy-source.md:3 | phase 级按需加载（258 行 interview 仅首跑载入）；strategy-source 禁缓存有新鲜度理由；config.md 37 行仅 Phase 0 载入 |
| B01 | pass | src/cli/contracts/dual-host-governance/skills-governance.json:414-428、SKILL.md:82-88、CHANGELOG.md:922 | standalone_skill 双宿主八平台投射；`disable-model-invocation: true` 显式入口、不承担自然路由（有 CHANGELOG 记录其设计意图）；负边界五条明确 |
| B02 | pass | tests/unit/spec-product-pulse-contracts.test.js:23-66 等五文件断言逐条核对 | SKILL/references/模板全部引用文件存在且消费者测试断言与当前源码逐条命中；设计意图（Learn More）与执行规则分离清晰 |
| B03 | pass | SKILL.md:21,87、references/interview.md:152、references/setup.md:29、references/strategy-source.md:7 | 只读边界、DB read-write 硬拒、.gitignore 修改先提议、策略文档内嵌内容仅作候选不当作用户确认 |
| B04 | pass | skills/spec-product-pulse/（source）、skills-governance.json:414-428、tests/unit/specialized-skill-calibration-contracts.test.js:71-79 | 真相源在 `skills/`，投射条目可定位，host-neutral 与 `docs_root` 负例由测试锁定 |
| B05 | pass | references/run.md:10,24,34、references/strategy-source.md:5、evals/fixtures/repos/u28-outcomes/exports/analytics.json:1 | 失败七态分类、部分成功继续独立指标、DB gate 未开时发 not-configured 而非探测、unreadable≠absent；fixture 状态语义与合同一致 |
| B06 | pass | SKILL.md:19、references/report-template.md:70-88、check-source-outcomes.sh:118-129 | Done 定义诚实（“report completion is not proof that every source was available”）、checklist 可执行、eval judge 验证无远端写入 |
| X01 | not-applicable | SKILL.md:55-81 | 适用性理由：单时间窗报告生成流程（route→interview→query→report），无多模块分解、共享写面或长任务依赖编排需求 |
| X02 | pass | references/config.md:26、references/run.md:10、references/report-template.md:15 | config schema 演化（v1.13.2→v1.15.3）后的 legacy 兼容路径三处一致：不猜测映射、not-run+reason_code、不静默路由到 analytics |
| X03 | pass | SKILL.md:23、references/run.md:40-46、references/interview.md:152、references/report-template.md:10,75 | 接触 PII 与生产 DB 两个真实风险面均有控制：provider-side projection 三层防线+拒绝本地脱敏+DB 硬拒，风险与控制对账成立 |
| X04 | pass | references/report-template.md:59、SKILL.md:51,80、references/config.md:29 | 报告 footer 带 source refs/freshness/limitations、saved reports 构成跨会话时间线、schedule 跨会话状态有 config 持久化与显式确认门 |

## Findings

1. **[P3] interview.md:140 引用无来源的具体工具名 `search_mcp_registry` / `suggest_connectors`。** 本仓库 `src/cli/` 无同名实现，仅历史 validation 文档提及。后果：在无此工具的宿主上模型可能尝试按名调用不存在的工具（L140 的能力条件句与 L141 的兜底句已缓解，属低风险）。最小修复：改为能力描述（“宿主的 MCP 注册表查询能力（如有）”），或标注工具名来源。
2. **[P3] SKILL.md:78 “第三次及以后的 pulse run” 无判定机制。** `pulse_schedule: ask-again-after-3-runs`（config.md:29）的计数依据未落地——config 无 run counter，也未指明按 `docs/pulse-reports/` 文件数判定。后果：模型需自行推断触发时机，行为可能不一致。最小修复：一句话指明判定依据（如按 reports 目录既有报告数）。
3. **[P3] run.md:61 文件名分钟粒度，同分钟重跑静默覆盖前一份报告。** 与 “saved-reports folder 是团队工作记忆”（SKILL.md:92）的语义有轻微张力。最小修复：在 2.4 注明覆盖行为或加秒级后缀；或保持现状并接受（重跑修正场景下覆盖可接受，属可辩护的设计选择）。
4. **[P3·观察] evals 判定词表与 skill 合同词表不同构。** check-source-outcomes.sh:208-209 期望 `state: 'ok'/'failed'`，而 skill 的七态词表无此二值。该 envelope 由 eval prompt 自行规定（check-source-outcomes.yaml:6），不构成 skill 缺陷；但它意味着此 eval 验证的是 failed≠zero 语义等价物而非七态词表行为本身，按 D03 引用时应如实标注这一差距。

## 主责深挖面发现

- **D01（去补丁化）**：本 skill 是“约束不补丁化”的正面样本——固定 top5/p99 的不可配置决策附带了消费侧理由（interview.md:183 “adding such an option here would create a value the report cannot reliably consume on later runs”），且 contracts test:46-53 用负断言（`not.toContain('pulse_error_count')`）锁死回归；CHANGELOG:1898 记录这次收敛源于真实失败（配置了 report 无法消费的值）。无建议删除的约束。
- **D02（领域知识）**：interview.md 的知识密度高且非口号——engagement vs value 判别给了三类真实滑倒示例（L43），source-count check 按比例而非绝对数判断（L160-164）明确拒绝了机械阈值，DB 拒绝给了可执行替代路径而非只说“不行”（L152）。
- **D03（验证门）**：机械/语义分层干净——script judge 只验确定性事实（数值、路径前缀、无远端写），headlines 与 followup 的可行动性留给 LLM 判断，符合项目角色契约的 floor/judgment 分工。post-write checklist 是 prose 约定（无 runtime 强制），但关键不变量有 eval judge 与合同测试双层覆盖，静态层承诺可定位且内部一致。
- **D04（衔接）**：发现一处初看矛盾、细查成立的设计——interview.md:125 要求“每个 active strategy metric 记录 source 映射”而 L252 说“strategy metrics 不存 config、每次重读”。两者对象不同（映射持久化 vs 清单动态），config.md:26 的“Persist the resolved source identifier rather than relying on inferred metric classes across runs”补齐了理由，无实际断裂。
- **D05（紧凑性）**：三类重复（七态×5 处、PII×4 处、top5/percentile×4 处）分别对应不同执行点（询问期、汇总期、写前检查）或被合同测试强制，变更成本已被测试显式化（改词表必改 ce-localization 测试）；未发现“删除无损失”的冗余段落。体量 ~590 行对一个含完整首跑访谈的 skill 属合理。
- **D08（上下文效率）**：非首跑路径的加载链为 SKILL(93)→config(37)→run(66)→strategy-source(11)→template(91)≈298 行，258 行的 interview 只在 setup 载入；strategy-source 每次运行重读文件（禁缓存）是新鲜度对效率的显式取舍且有理由声明（L3）。

## 未读文件

- `evals/fixtures/repos/mini-ledger/`（README.md、package.json、src/server.js）：unconfigured-guides-setup 案例的仓库 fixture，judge 只验证提问行为，fixture 内容不影响静态合同裁决；未覆盖后果：无法核对该 fixture 是否还原了真实的“无 config”初始态（eval.yaml 已声明 `repo_fixture` 路径，风险极低）。
- `evals/fixtures/repos/u28-outcomes/`（README.md、exports/payments.json、prepare-eval.cjs）：fixture 机械部分，内容已被 check-source-outcomes.sh:199-203 的 SHA-256 固定；未覆盖后果：无法独立复核 hash 与文件实际字节的对应，不影响 skill 源码裁决。
- `scripts/evals/ce-u28-outcomes.cjs`：judge 生成器上游脚本，judge 头部已声明生成关系；未覆盖后果：无法核对生成器与 bundled judge 的一致性（属 eval 基建而非被审对象）。
- 三个 ce-* 消费者测试文件的非 pulse 测试段：断言对象为其他 skill，与本案无关。
- `docs/validation/ce-skill-audit-2026-10-28/skills/spec-product-pulse.md`：历史审查文档，按检查表纪律仅作线索不作证据，故意未读以免锚定。

## 结论一句话

spec-product-pulse 静态合同层整体健康：18 项中 16 项 pass、X01 不适用、0 fail，仅有 4 条 P3 观察（无来源的工具名、第三次运行的判定机制、同分钟覆盖、eval 词表差距），保持现状基本成立，前两条值得在下次触碰该 skill 时顺手修正。
