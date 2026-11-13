# spec-compound-refresh 评审（R2）

## 逐项裁决表

本表仅裁决 `structure_contract` 静态层；基线为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`。以下 `references/`、`scripts/`、`evals/` 均相对于 `skills/spec-compound-refresh/`。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `references/classify.md:9`、`references/classify.md:129`、`references/publication.md:89` | 主要约束针对规范与实现混淆、误删及并发覆盖等具体失败，不是替模型预写语义结论。 |
| D02 | pass | `references/investigate.md:63`、`references/classify.md:116`、`references/publication.md:53` | 编码了知识重叠、引用承重及失效判断依据，并明确脚本不判断来源可信度与语义充分性。 |
| D03 | pass | `references/publication.md:26`、`references/publication.md:40`、`references/publication.md:79`、`references/publication.md:114` | 晋升、声明检查、语义批准及失败出口明确，且没有把文案约定冒充事务性硬 gate。 |
| D04 | pass | `references/per-action-flows.md:35`、`references/publication.md:72`、`references/report.md:26`；`tests/unit/compound-promotion-contracts.test.js:99` | 调查证据进入分类、候选、引用修复和逐文件报告，消费者也检查晋升验证与发布先后关系。 |
| D05 | pass | `skills/spec-compound-refresh/SKILL.md:113`、`skills/spec-compound-refresh/SKILL.md:145`；`tests/unit/spec-compound-refresh-reference-contracts.test.js:10` | 入口保留职责与关键边界，阶段细节有明确 owning reference；重复安全摘要未发现实质冲突。 |
| D06 | pass | `references/investigate.md:118`、`references/investigate.md:129`、`references/investigate.md:139`；`scripts/run-python.sh:7` | 不假定固定模型或宿主具备委派、隔离、模型覆盖能力；未知能力有继承、串行或 inline 降级。 |
| D07 | pass | `references/investigate.md:19`、`references/classify.md:13`、`references/schema.yaml:103` | 维护直接消费来源与失效条件，并区分“触发重审”和“足以移除”，符合知识可失效要求。 |
| D08 | pass | `references/scope.md:19`、`references/scope.md:53`、`references/investigate.md:17`、`references/vocabulary-refresh.md:10` | 先限定范围、再分群调查，词汇补全也限定在本轮已调查区域，不默认全仓扩张。 |
| B01 | pass | `skills/spec-compound-refresh/SKILL.md:3`、`skills/spec-compound-refresh/SKILL.md:153`；`references/modes.md:42` | 知识保鲜、新知识捕获、普通重构及独立词汇 bootstrap 的入口职责可区分；入口反例评测缺陷另列 F-01。 |
| B02 | pass | `skills/spec-compound-refresh/SKILL.md:15`；`references/publication.md:10`、`references/report.md:26`；`tests/unit/spec-compound-refresh-reference-contracts.test.js:78` | 输入、目标身份、候选与最终产物、逐文件结果及消费者约束一致；未将 core/08 的拟议主链路 YAML 强套到本 Skill。 |
| B03 | pass | `references/modes.md:14`、`references/modes.md:22`；`references/investigate.md:129`；`references/worth-audit.md:11`；`references/commit.md:15` | 本地维护、价值裁剪、委派、提交与 landing 分别定权，headless、权限可写或 workflow 调用不自动产生新增授权。 |
| B04 | pass | `references/discoverability.md:7`；`references/publication.md:32`；`scripts/evals/build-outcome-judges.cjs:241` | 生成 managed block 不作为直接编辑对象，执行脚本绑定实际读取的 Skill 目录，生成评测脚本也能追溯 owning builder/helper。 |
| B05 | pass | `references/investigate.md:3`；`references/publication.md:89`、`references/publication.md:102`；`references/commit.md:28` | 启动失败、目标漂移、部分发布、恢复副本与 dirty overlap 均有边界；不允许失败后盲删或覆盖并发修改。 |
| B06 | fail | `evals/cases/non-solutions-scope-gated.yaml:2`、`evals/fixtures/scripts/check-scope-gate.sh:9` | scope 负例判据接受“重构”等任一关键词，连明确承接范围外重构的回复也能通过，无法支撑其声明的边界检查。 |
| X01 | pass | `references/scope.md:45`；`references/investigate.md:143`；`references/per-action-flows.md:54`；`references/publication.md:19` | 广域知识维护按依赖和重叠分批，独立工作才并行，关联发布分组并保留部分成功恢复点。 |
| X02 | pass | `references/yaml-schema.md:12`、`references/yaml-schema.md:35`；`references/classify.md:9`；`references/publication.md:100` | 对本 Skill 相关的分类版本、旧文档兼容、指导替换及路径迁移已有合同；不越权实施产品 API 或架构迁移。 |
| X03 | pass | `references/classify.md:129`；`references/publication.md:79`、`references/publication.md:102`；`references/commit.md:34` | 将误删、错误知识晋升与对外落地作为主要风险，要求证据、引用及恢复条件；部署不属于其职责。 |
| X04 | pass | `skills/spec-compound-refresh/SKILL.md:41`；`references/investigate.md:19`、`references/investigate.md:160`；`references/report.md:35` | 知识来源、新鲜度、失效条件、worker 返回责任及自审/独立审查限制都有可定位承诺。 |

## Findings

### F-01 · P2：scope gate 评测会把范围外承接误判为通过

- **位置：** `skills/spec-compound-refresh/evals/fixtures/scripts/check-scope-gate.sh:9-10`。
- **关联声明：** `skills/spec-compound-refresh/evals/cases/non-solutions-scope-gated.yaml:2-5` 声明验证普通重构请求应被 scope gate 拦下。
- **静态证据：** 判据只要求最终文本包含列表中的任一词，其中包括 `重构`、`spec-`、`范围`。因此，回复“好的，我将开始整体重构。”也满足通过条件，尽管其行为方向与预期相反。此结论直接来自布尔表达式，不依赖未运行的模型表现。
- **后果：** 该 case 即使变绿，也无法区分拒绝越界、正确转交和直接承接范围外任务，可能漏掉入口职责回归；它不能作为 B01 行为正确的证明。
- **最小修复建议：** 将该 case 的 scope 裁决改为可核验的有限结构，明确区分“不承接／转交”和“直接执行”，并校准至少一组正确拒绝、错误承接反例。若还要证明“没有实施”，应检查 fixture 的实际文件变化，不能继续只看回复词语。
- **范围限制：** 本 finding 针对评测判据，不证明 Skill 当前实际发生了错误路由。`evals/README.md:3` 已披露该脚本不能证明安全删除等更强性质，但尚未消除它对自身 scope 判断的假阳性。

## 主责深挖面发现

### B01–B04：职责、产物和权威边界总体成立

1. **独立词汇 bootstrap 不夹带知识库维护。**  
   `references/modes.md:44-55` 明确跳过 learning discovery/classification，已有 `docs/solutions/` 也不扩大权限；`tests/unit/spec-compound-refresh-reference-contracts.test.js:124-130` 对此有直接合同断言。**保持现状成立。**

2. **不把实现现状自动提升为规范权威。**  
   `references/classify.md:9-24` 要求先核对仍有效的合同、owner 决策或其他独立证据；代码违反指导时，报告潜在实现回归，而不是直接改掉指导来迁就代码。**保持现状成立。**

3. **准确性维护与价值裁剪没有混权。**  
   `references/worth-audit.md:9-21` 将审计许可与裁剪许可分离；非交互模式下 worth-based 修改仍仅推荐，不可伪装成 accuracy-based Delete 绕过。**保持现状成立。**

4. **候选、最终目标和 generated surface 身份明确。**  
   `references/publication.md:10-22` 要求记录目标身份、快照与候选路径；`references/discoverability.md:7` 禁止直接修改 generated managed block。评测生成文件的 owning source 可回溯至 `scripts/evals/build-outcome-judges.cjs:241-249` 和 `scripts/evals/knowledge-publication-checks.cjs:4`。**保持现状成立；本轮未验证宿主 runtime 实际加载或漂移。**

### X01–X04：扩展场景没有变成越权编排

- **X01：依赖优先于并行。** `references/investigate.md:149-163` 将并行限制为真正独立对象，replacement 顺序执行；`references/publication.md:19-22` 将 successor、引用修复与删除作为关联组，避免局部成功关闭整体动作。
- **X02：迁移兼容有边界。** `references/yaml-schema.md:35` 保留 untouched legacy，只有新建或实质改写重新采用 v2；`references/per-action-flows.md:92-99` 分开处理同路径与异路径替换，避免删除仍被 successor 使用的路径。
- **X03：删除不靠标题相近或代码消失。** `references/classify.md:129-140` 要求问题域、实际内容覆盖与入站引用共同成立；`references/publication.md:104-112` 再核对恢复能力及部分失败，不声称跨文件事务。
- **X04：失效条件触发重审，不直接触发退役。** `references/investigate.md:21-23` 和 `references/classify.md:13` 区分 issue 关闭、修复发布、项目采用及安全移除；`references/report.md:35` 要求披露手工降级、自审与独立审查差异。**这些静态承诺均可保留。**

## 未读文件

- **被审必读材料：无遗漏。** 已完整读取入口、全部 references、三个执行脚本、模板、全部已登记 eval 配置／case／fixture／judge，以及消费者清单列出的十个测试文件；另读取了知识发布 judge 的 owning builder/helper。
- **`/Users/kuang/.codex/AGENTS.md`：** 读取请求未获权限，因此未读。后果是无法核对其中可能存在的额外全局约束；不影响上述已读取源码与静态反例的位置证据。
- **generated host runtime mirrors：** 未读取；本轮审查冻结 source，不评价 `.claude/`、`.codex/` 等镜像与真实宿主加载的一致性。

本轮未运行测试、模型 eval 或发布操作；未修改任何文件。Git 读取确认 HEAD 为冻结版本，工作区保持干净。表中 `pass` 仅表示静态承诺存在、可定位且内部一致，不表示行为质量、运行成本或收益已经验证。

## 结论一句话

静态审查已覆盖全部 18 项：17 项 pass、B06 因 scope 评测假阳性 fail；知识维护与授权发布的核心合同总体成立，但该 scope case 不能作为入口边界正确的验收证据。
