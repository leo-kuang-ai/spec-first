# spec-compound-refresh 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-compound-refresh/scripts/validate-frontmatter.py:29-32; references/report.md:5,41; references/classify.md:173,102 | 关键补丁式指令均有真实失败来源（PR #695 注释截断、2026-04-16 计划文档 `: ` 事故、headless 懒惰摘要、越界修代码），未发现无依据的过度指导 |
| D02 | pass | references/classify.md:7-19; references/investigate.md:19-23,96-105; references/concepts-vocabulary.md:37-45 | 编码了大量领域判断规则（描述性漂移≠实现冲突、unverifiable≠false、三条件删除门、检索价值测试），脚本/LLM 职责在 validator docstring:21-24 与各处显式分界 |
| D03 | pass | references/publication.md:31-34,59-70,79-86,114-116; tests/unit/compound-promotion-contracts.test.js:217-294 | 必需验证由两个确定性脚本承担（exit 0/1/2 语义明确），语义审批显式归 LLM，且 :114-116 诚实声明无事务式 runtime gate；正反例测试齐备 |
| D04 | pass | diff 实测 5 个共享文件字节一致； tests/unit/compound-promotion-contracts.test.js:99-126,212-215; docs/contracts/knowledge/knowledge-harness.md:58,62,68 | 与上游 spec-compound 消费同一 schema/promotion 合同（测试强制字节一致+同验证模式），下游 knowledge-harness 合同逐条与 publication.md 实际规则对得上；08 主链路 I/O schema 对本知识型 Skill 不适用，其知识链路衔接成立 |
| D05 | pass | SKILL.md:48,52,115,119,123,151,164（每条规则的 "It owns…" 归属声明） | 关键规则全部可定位到 owning reference；存在少量受控重复（见 Findings 3/4），无实质矛盾 |
| D06 | pass | SKILL.md:60; references/classify.md:177; scripts/run-python.sh:9-19; references/investigate.md:129-141; SKILL.md:33 | 提问工具按能力匹配并降级为编号选项；Python 解析跨平台降级有测试；worker 能力未知→串行、结果标 provider_untrusted，降级诚实 |
| D07 | pass | references/investigate.md:19-23; references/classify.md:13; git log 0d471286/e30070fc; tests/unit/knowledge-publication-judges.test.js:52-81 | 问题→修订→复验链有 git 历史与校准测试佐证；知识带 invalidation_condition 失效边界；真实消费者为 10 个测试文件与 knowledge-harness 合同 |
| D08 | pass | SKILL.md:46-48,52,119,123,127,139,143,147; references/publication.md:3-4 | 按阶段条件加载（worth-audit 仅显式请求时读、词汇规则推迟到 4.5、publication 双时点重读），摘要不裁剪要求、逐条指向 owning reference |
| B01 | pass | SKILL.md:3（正负触发都在 description）; references/scope.md:26,28-33; evals/cases/non-solutions-scope-gated.yaml + fixtures/scripts/check-scope-gate.sh | 正向触发、相似入口负例（avoid general refactor/debugging/code review）、scope 未命中与空库行为均有定义且有负例 eval |
| B02 | fail | templates/claude/commands/spec/compound-refresh.md:3 vs SKILL.md:4 + references/modes.md:5; skills/spec-code-review/references/modes-and-output.md:105 | Claude 命令模板 argument-hint 宣传本 Skill 不识别的 `mode:autofix`（全仓已弃用），与 SKILL.md 的 `[mode:non-interactive]` 不一致——入口/模板合同静态不一致（见 Findings 1） |
| B03 | pass | references/modes.md:22; references/commit.md:17-36; references/worth-audit.md:19-21; references/discoverability.md:45; references/investigate.md:129-135 | mutation/commit/landing 三权分离、worth 删除独立授权、dispatch 需显式授权，均由 mutation-authority-contracts.test.js:79-93 与 dispatch-authorization-matrix-contracts.test.js:541-560 钉住 |
| B04 | pass | templates/claude/commands/spec/compound-refresh.md:10; src/cli/contracts/dual-host-governance/skills-governance.json:176-178; diff 实测共享镜像字节一致 | source（skills/+templates/）与生成路径可追溯、双宿主入口已登记、共享镜像由 sync-shared-references.js 与测试双向防漂移；模板内容缺陷记在 B02，身份与溯源本身清晰 |
| B05 | pass | references/publication.md:89-119（SHA-256 复查、部分发布、恢复材料）; references/modes.md:34-36; references/investigate.md:3; references/commit.md:13-14,28 | 漂移阻断、失败前置阻塞依赖删除、launch 失败有界重试+inline 替代披露、dirty 重叠不猜所有权、非 Git 原件不假定可恢复 |
| B06 | pass | references/report.md:5,35,57-63; references/publication.md:117-119; evals/README.md:9 | Applied=已验证发布而非候选、成功后仍列 recommend-only 项、scratch 不得冒充交付；evals/README 诚实披露“真实模型验收仍未完成” |
| X01 | pass | references/scope.md:51-58; references/investigate.md:145-150; references/publication.md:96-99; references/per-action-flows.md:54-55 | 9+ 文档有 triage/聚类/分批，依赖组与成对合并控制共享写面；采用宿主 subagent 能力而非自造编排 |
| X02 | pass | references/schema.yaml:224-232; references/yaml-schema.md:35; docs/contracts/knowledge/knowledge-harness.md:58 | 适用面为 frontmatter schema 版本演进：legacy 兼容、禁止机械迁移、新旧文档分治规则齐备（不要求本 Skill 新增 schema） |
| X03 | pass | references/classify.md:129-141; references/publication.md:103-106,89-92 | 高风险动作是删除/后继发布：三条件门+发布前复查+恢复性证据对账齐备；产品部署/回滚不在本 Skill 范围（不适用部分如实排除） |
| X04 | pass | references/yaml-schema.md:54-61; references/classify.md:80-83; references/report.md:26-37 | 知识交接四要素齐备：source_refs 回源、invalidation_condition 失效边界、stale 注记保留决策状态、报告带证据与验证缺口 |

## Findings

1. **[P2] Claude 命令模板宣传已死的 `mode:autofix` 标志（B02 fail 根因）**
   - 位置：`templates/claude/commands/spec/compound-refresh.md:3`（`argument-hint: "[scope hint or mode:autofix]"`）vs `skills/spec-compound-refresh/SKILL.md:4`、`references/modes.md:5`
   - 后果：`spec-first init` 渲染出的 Claude runtime 命令按此提示引导用户传 `mode:autofix`。该 token 本 Skill 不识别（modes.md 只剥离 `mode:non-interactive`/`mode:headless`），会按"保留其余 token 作 scope hint"落入作用域匹配；匹配为空时 headless 按 `scope.md:26` 直接报 miss 退出——用户以为开了自动修复，实际得到零处理。且 `mode:autofix` 在全仓已弃用（`skills/spec-code-review/references/modes-and-output.md:105`，spec-work/spec-lfg 均明令不传）。
   - 最小修复：将模板 argument-hint 改为与 SKILL.md 对齐（如 `"[optional: scope hint] [mode:non-interactive]"`），随后 `spec-first init` 重生成 runtime。

2. **[P3] 模板 description 漏掉词汇维护职责**
   - 位置：`templates/claude/commands/spec/compound-refresh.md:2`（"Refresh stale Spec-First solution docs"）vs `SKILL.md:3`
   - 后果：SKILL.md description 还覆盖 CONCEPTS.md bootstrap/维护（本 Skill 约一半的 reference 面），Claude 命令面按 description 路由时词汇类请求可能不进本入口。
   - 最小修复：与 Finding 1 同文件一并同步 description；或保持现状但接受 Claude 面词汇请求依赖 skill 面（governance json 中多数宿主走 skill 直投）而非 command 面。

3. **[P3] worker capability YAML 块在两处重复维护**
   - 位置：`SKILL.md:23-31` 与 `references/investigate.md:120-127`
   - 后果：六个 capability 字段清单逐字重复，当前一致（已逐行比对），但单边修订会产生入口与执行层漂移。
   - 最小修复：保持现状可成立（SKILL.md 定位是 contract summary），建议补一条钉住字段清单的 contract test，或让 SKILL.md 只保留字段名列表。

4. **[P3] SKILL.md 阶段编号跳过 Phase 3（及 1.5/1.75）**
   - 位置：`SKILL.md:121-125`（Phase 2 → Phase 4）；Phase 3 在 `references/classify.md:152`，Phase 1.5/1.75 在 `references/investigate.md:49,57`
   - 后果：只读入口的读者会找缺失的 Phase 3；读齐 references 后内部自洽（每个子阶段有明确归属）。
   - 最小修复：在 Phase 4 标题下加一句"Phase 3 决策与 1.5/1.75 子阶段见对应 reference"，或维持现状接受委托式编号。

5. **[P3] `_archived/` 表述张力**
   - 位置：`SKILL.md:111`（"There is no `_archived/` directory"）vs `references/scope.md:10-12`、`references/report.md:65-67`（处理 legacy `_archived/` 存在的场景）
   - 后果：可读作政策声明（本工作流不使用归档目录）与遗留处理并存，严格字面读有轻微矛盾；实际规则可调和。
   - 最小修复：改为"This workflow never creates an `_archived/` directory (legacy copies may exist — see references/scope.md)"，或保持现状成立。

6. **[P3] 中英混排段落**
   - 位置：`SKILL.md:139`（Phase 4.5 标题与正文为中文，全文其余为英文）；`references/investigate.md:19-23`、`references/classify.md:13`
   - 后果：非合同缺陷，宿主消费不受影响；仅风格一致性。
   - 建议：保持现状成立（新增段落按仓库语言策略用中文是可辩护选择）。

## 主责深挖面发现

**D01（去补丁化）**：逐条追溯补丁式指令的失败来源均成立——validator 的两条 default 检查对应在源注释中写明的真实事故（validate-frontmatter.py:29-32，PR #695 与 2026-04-16 计划文档）；report.md:5/:41 的"必须全文打印"针对 headless 懒惰摘要的真实失败模式且只在报告参考内重复一次；classify.md:173 "不问代码改动是否有意"防止维护流越界改产品代码。未发现已过时或互相矛盾的硬约束；最接近过度指导的是"print full report"出现两次，但 headless 场景下重复有据。无建议删除项。

**D02（领域知识）**：本 Skill 的核心价值恰是知识策展领域规则而非流程控制：描述性漂移 vs 实现冲突（classify.md:7-11，含"implementation regression 只报告不裁决"）、unverifiable-is-not-false（classify.md:15-19）、删除三条件门含"从未引用仓内实现的文档不满足 implementation-gone 条件"（classify.md:137-138）、失效条件外部核查语义写得非常精确（investigate.md:21-23："issue closed 不等于修复已发布，已发布不等于当前项目已采用"）、目录行唯一性规则（per-action-flows.md:44-47）。脚本/LLM 分界在 validator docstring、publication.md:53-55（"script checks shapes, not credibility"）与 knowledge-harness.md:62 三处一致。

**D03（验证门）**：确定性地板=validate-frontmatter.py（exit 1 阻断、exit 2 是 usage 失败不当 clean）+ validate-doc-claims.py（FLAG 是裁决输入非硬失败，docstring:31-34）+ SHA-256 前后复查；Validate→Publish 顺序由测试断言（spec-compound-refresh-reference-contracts.test.js:87）；validator 不可用时有披露式 manual checklist 且"must not be reported as a script pass"（publication.md:53-55）。静态合同层无冒充机械判定的语义决策。行为层（模型是否真跑脚本）属 S3，本轮不裁。

**D04（衔接）**：上游消费实测成立——5 个共享文件（schema.yaml/yaml-schema.md/resolution-template.md/两个 .py）diff 字节一致，且由 compound-promotion-contracts.test.js:212-215 与 remaining-script-defenses.test.js:28-32 双向强制；refresh 的 publication/per-action-flows 与 spec-compound 调用同一 `--promotion` 验证模式（同测试 :99-126 断言）。下游 knowledge-harness.md:68 的描述与 publication.md 实际规则逐条核对一致（同路径 Replace 不 unlink、异路径删除等后继验证、不把 hash 复查说成并发锁、worth audit 引证要求）。唯一衔接缺陷在 Claude 入口面（Finding 1，记 B02）。

**D05（紧凑性与可审计性）**：入口 164 行，全部 references 约 1.5k 行，每条关键规则有唯一 owning reference 且入口用"It owns…"声明归属（SKILL.md:48,52,115,119,123,151,164）——定位性好。矛盾清扫覆盖 mode token、scope 未命中、授权三元组、删除门、词汇作用域纪律，跨文件一致。重复实例仅 Finding 3（worker YAML）与摘要级复述，受控。删减任何单条 owning 规则（如 worth-audit 或 discoverability）会损失对应能力面，未见可无损删除的段落。

**D08（上下文效率）**：加载面严格按阶段条件展开：mode/authority 先读（modes.md 在任何模式/授权判断前，SKILL.md:48）、investigate/classify 各在取证前后（:119,:123）、per-action-flows+publication 只在准备变更前（:127）、worth-audit 仅显式请求（:52）、词汇规则推迟到 4.5（:139）、commit 仅在有已验证变更后（:151）。publication.md:3-4 要求"准备变更前与发布出口各读一次"而非全程驻留。未发现强迫加载与所选路径无关材料的指令。

## 未读文件

- `evals/fixtures/repos/mini-ledger/README.md`、`package.json`、`src/server.js` — 理由：scope-gate 负例的 fixture 仓库内容；judge（check-scope-gate.sh）只检查输出措辞，case 接线已在 case yaml 中核实。未覆盖后果：无，不影响 18 项裁决。
- `evals/fixtures/scripts/check-publication-preserve.sh`、`check-publication-partial.sh` 的 130-160 行尾部 — 理由：三个 judge 为同一生成器产物，已读 recover.sh 全文及两者与 recover 相同的共享脚手架与 mode 分支（85-130 行）。未覆盖后果：极低；如尾部存在 mode 特有差异未被观察，但生成源相同（scripts/evals/build-outcome-judges.cjs）且有 knowledge-publication-judges.test.js 正反例校准。

## 结论一句话

spec-compound-refresh 静态合同整体扎实（17/18 pass）：职责边界、验证门、授权分离与失败恢复可定位且内部一致，唯一确认缺陷是 Claude 命令模板入口面残留已弃用的 `mode:autofix` 提示并与 SKILL.md 参数合同脱节（B02 fail，P2，一行模板修复即可关闭），其余为可保持现状的 P3 观察。
