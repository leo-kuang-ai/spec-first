# spec-compound 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-compound/references/modes.md:33-38；scripts/validate-frontmatter.py:29-32；references/assembly.md:60 | 关键约束均带设计依据（mode 自选的纠正成本论证、PR #695/plan doc 事件、artifact 写回模式的可靠性定位），约束间无矛盾、无过时引用 |
| D02 | pass | references/schema.yaml:12-112；references/yaml-schema.md:16-33；references/promotion.md:14；scripts/validate-frontmatter.py:21-24 | Classification Contract v2 责任型闭集、component→职责映射表、外部依赖失效规则是真实领域知识；脚本/LLM 分工边界在脚本 docstring 与 references 双向声明 |
| D03 | pass | references/assembly.md:33-51, 83-93；references/promotion.md:5-12；tests/unit/compound-promotion-contracts.test.js:217-294 | 三层验证门（frontmatter --promotion 机械、claims 机械+裁决、语义 promotion）可定位、失败可见（exit 1 命名字段）、22 组负例回归，且诚实区分机械形态与语义判断 |
| D04 | pass | SKILL.md:30-32；references/assembly.md:9；references/session-history.md:30；skills/spec-plan/references/agents/learnings-researcher.md:20-26 | 上游输入 WAIT 汇聚、unsolved→spec-debug/spec-work 与 bootstrap→refresh 两条 handoff 显式；plan/code-review/debug 有静态消费路径（spec-work 缺口单列为 finding） |
| D05 | pass | SKILL.md（62 行入口）；references/lightweight.md:28；SKILL.md:36 vs references/modes.md:10 | 入口紧凑、关键规则各有唯一 owner 文件、lightweight 引用而非复制 checklist；重复仅限入口摘要与权威文件的一致表述 |
| D06 | pass | references/modes.md:16-27, 31；references/assembly.md:36-41；scripts/run-python.sh:7-25 | dispatch 六字段授权记录 + "invocation does not authorize dispatch"；SKILL_DIR guard + manual checklist + 输出声明；Python 三级解析与 UTF-8 reconfigure 覆盖宿主差异 |
| D07 | pass | references/refresh-and-discoverability.md:9-23；references/schema.yaml:103-112；evals/README.md:7 | 失效条件强制 + refresh 判据（六正四负）+ last_updated；知识有真实消费者；evals 诚实标注「模型行为未运行」的边界 |
| D08 | pass | SKILL.md:49；references/session-history.md:52；references/research.md:118-127；references/assembly.md:13 | 按步加载、session-history 两段式 escalation gate、grep-first 只读 frontmatter 30 行、不完整搜索限制必须保留 |
| B01 | pass | SKILL.md:3, 32；references/modes.md:41 | description 含正向触发与相似入口负例；CONCEPTS bootstrap 转交 refresh；session-history 明确无独立 product surface，agents/ 为 prompt 资产非入口 |
| B02 | pass | tests/unit/spec-compound-reference-contracts.test.js:18-34；tests/unit/compound-promotion-contracts.test.js:85-97 | 入口-reference-script-template-consumer 一致性由合同测试静态锁定；两个声明一致性缺口（spec-work 消费者、schema 未列 category/title）单列为 P3 finding |
| B03 | pass | SKILL.md:40-45；references/modes.md:27, 31；references/refresh-and-discoverability.md:83 | 全部写入面（docs/solutions、CONCEPTS.md、instruction files、session-history 读、dispatch）各有独立授权条件；无 commit/push/runtime 授权声明 |
| B04 | pass | references/assembly.md:33；references/session-history.md:32；tests/unit/compound-promotion-contracts.test.js:212-215 | skills/spec-compound/** 为 source；脚本经 $SKILL_DIR 从 skill 目录解析；测试直接读 source；与 refresh 的共享文件 byte-identical 断言锁定镜像关系 |
| B05 | pass | references/research.md:3；references/promotion.md:9-10；references/session-history.md:32, 44；references/grounding-validation.md:20 | 脚本缺失 guard+manual、partial publication 精确报告、重试上限（pre-launch 拒绝只纠正一次）、target drift 停止重建、无 Git 降级路径齐备 |
| B06 | pass | references/report.md:3-15, 21, 38-47；references/grounding-validation.md:81-87 | 完成信号语义严格、只报观察结果、Common Mistakes 表、validator verdict 分类处理表、inline 标注 non-independent |
| X01 | pass | SKILL.md:30；references/promotion.md:10 | 单 learning per run 的分解规则、Phase 顺序依赖、共享写面仅 orchestrator + per-target atomic + 发布顺序（CONCEPTS 先、learning 后）、partial 恢复报告 |
| X02 | pass | references/schema.yaml:224-232；references/yaml-schema.md:35；evals/eval.yaml:1 | frontmatter schema（对外接口）有 v2/legacy 双轨兼容、不强制批量迁移、evals 带 schema_version |
| X03 | pass | SKILL.md:26；references/modes.md:36；evals/cases/false-causal-claim.yaml；references/promotion.md:14 | 知识污染风险有 counterfactual 门槛、high-risk 永不降级 Lightweight、假因果 eval 判据校准、失效条件+refresh 构成回退等价物 |
| X04 | pass | SKILL.md:21；references/promotion.md:7；references/report.md:3；references/concepts-vocabulary.md:65-67 | owner 明确（orchestrator 拥有发布）、artifact 带 provenance/freshness/limitations/失效条件、Flagged ambiguities 审计轨迹、独立 vs inline 分别记录 |

## Findings

1. **[P3，B02/D04] 声明的消费者 `spec-work` 无静态消费路径。**
   - 位置：`skills/spec-compound/SKILL.md:22`（"Consumers: `spec-plan`, `spec-work`, `spec-debug`, `spec-code-review`, and project maintainers"）
   - 事实：`grep -rn "docs/solutions" skills/spec-work/` 零命中；对照 spec-plan（7 个文件含 learnings-researcher 专用 prompt）、spec-code-review（6+ 文件含 personas/learnings-researcher.md）、spec-debug（SKILL.md:362）均有可定位消费面。
   - 后果：Workflow Contract Summary 高估了执行阶段的静态消费面——spec-work 侧 agent 只能靠 CLAUDE.md 的项目级提示间接得知知识库，契约声明与实际机制脱节，维护者可能误判 learnings 在 work 阶段被系统性检索。
   - 最小修复：或在 spec-work 增加受控的 learnings 检索步骤，或把 Consumers 行改为与当前静态消费面一致的清单（plan/debug/code-review + maintainers）。

2. **[P3，B02/D05] canonical schema 未覆盖模板强制的 frontmatter 字段。**
   - 位置：`skills/spec-compound/assets/resolution-template.md:17,69`（`category:`）与 `:16,66`（`title:`）；`skills/spec-compound/references/research.md:79`（"must include `category:`"）；缺口方：`skills/spec-compound/references/schema.yaml:39-232`（required/optional fields 均无 `category`/`title`）
   - 事实：schema.yaml:3 自称 "canonical frontmatter contract"，validation_rules 亦未提及这两个字段；机械验证器只查 parser-safety 与 promotion 两字段。
   - 后果：模板与研究步骤强制写入的字段落在 canonical contract 与机械校验覆盖之外。方向不矛盾（schema 未禁止额外字段，category 可由 problem_type 经 Category Mapping 推导），不会产生错误数据，但字段权威归属悬空。
   - 最小修复：在 schema.yaml `optional_fields` 补列 `category`/`title`，或在模板处注明二者是文档约定而非 schema 字段。

3. **[保持现状成立] headless 行为在 SKILL.md:36 与 modes.md:10,39 双处描述。** 内容一致（无 session history、无 blocking questions、跳过 Phase 2.46、完成信号约束），属入口摘要 + 权威文件的合理分层，非冗余漂移。

## 主责深挖面发现

- **D01**：逐条核对了约束的依据链。`references/research.md:9-28`（Phase 0.5 auto memory scan）是唯一的宿主特有补丁（Claude Code only），但其降级路径显式（"If the block is absent…skip this step"）且来源标注 `"(auto memory [claude])"`——这是对能力分布的诚实处理而非过度指导。`references/enhancement.md:33` 的 "surviving skills" 措辞残留历史裁撤语境，对无上下文读者略隐晦，但引用的 `spec-simplify-code` 存在且边界正确（mutation 留给该 skill），无行动必要。
- **D02**：领域知识密度高且可回源——`yaml-schema.md:33` 的反例指引（"a projection copying obsolete assets is runtime/source_runtime_drift"）、`promotion.md:14` 的外部失效依赖规则（"单独关闭 issue 不自动证明修复已发布或本项目已采用"）、`validate-doc-claims.py` 的 adjudication 表（grounding-validation.md:26-36）均非通用流程口号。未发现"最佳实践"替代项目约束的段落。
- **D03**：验证门为响亮约定而非宿主硬强制——机械门的执行依赖执行者遵照 prose 运行脚本；skill 通过存在 guard、manual checklist、完成信号语义（"Do not declare success while validation fails"）和 partial publication 禁令把出口尽可能外显，这与仓库 gate 哲学一致，静态层不构成 fail。已知边界：SKILL.md 未显式标注"此门未硬强制"，与 CLAUDE.md「缺强制能力时显式声明」的要求之间只有隐式符合。
- **D04**：两条 handoff（unsolved→spec-debug/spec-work、bootstrap→refresh）均带返回条件；refresh 建议强制最窄 scope 参数（`references/refresh-and-discoverability.md:31-47`），避免 capture 越权扩面。唯一缺口即 finding 1。
- **D05**：长度分布合理（SKILL.md 62 行，references 43-163 行/文件）；规则冲突扫描未命中（lightweight 的 discoverability 用"上下文中已有 instructions"评估、Full 版重读文件，二者按模式分化且有 `not applicable - no active project instructions` 出口对齐）。字段面缺口即 finding 2。
- **D08**：静态承诺层面无摘要裁剪风险——`assembly.md:13` 要求保留不完整搜索限制、`session-history.md:52` escalation gate 把昂贵提取限制在 relevance 命中后、`research.md:118-127` 的 grep-first + frontmatter-30-行读取上限，是同类 skill 中少见的显式读取预算设计。

## 未读文件

1. `skills/spec-compound/scripts/session-history/extract-metadata.py`（469 行）、`extract-skeleton.py`（597 行）、`extract-errors.py`（296 行）的完整实现——只读了调用契约（session-history.md）与行为断言（tests/unit/session-history-scripts.test.js）。后果：实现内部未被测试覆盖的解析分支缺陷不可见。
2. `skills/spec-compound/evals/fixtures/repos/**`（causal-auth/mini-ledger/solved-ledger/trivial-fix 的源文件）——未逐个读取；causal-auth 的 prepare/verify 已由 tests/unit/knowledge-causality-judge.test.js 执行校验。后果：fixture 与 case 声明间的细节漂移（若有）不会在本轮发现。
3. `skills/spec-compound/references/agents/` 中 `data-integrity-guardian.md`、`framework-docs-researcher.md`、`pattern-recognition-specialist.md` 未逐字读——骨架/冻结 hash 一致性由 tests/unit/agent-persona-template-drift.test.js 锁定，且均属可选增强（Phase 2.46 仅交互 Full）。后果：这三个 prompt 内部的指导质量不可见。
4. `skills/spec-compound/evals/examples.json` 只读前 60 行——9 个案例的集合与关键断言已由 tests/unit/compound-promotion-contracts.test.js:188-210 校验。后果：个别案例的 forbidden 列表细节未逐条核对。

## 结论一句话

spec-compound 的静态合同层健康：18 项检查全部 pass，验证门、授权边界与失败恢复的承诺存在、内部一致且可定位，仅有 2 个 P3 级声明一致性缺口（spec-work 消费者声明无静态消费路径、canonical schema 未覆盖模板强制的 category/title 字段），无阻断缺陷。
