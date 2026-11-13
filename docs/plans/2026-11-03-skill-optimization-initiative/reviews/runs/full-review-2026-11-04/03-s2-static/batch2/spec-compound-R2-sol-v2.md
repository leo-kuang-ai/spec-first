# spec-compound 评审（R2）

## 逐项裁决表

以下裁决仅针对冻结提交 `5b59293bb1aecb40c4894549a89f8b045dfa40fe` 的静态合同，不代表行为评测、运行成本或现场收益通过。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-compound/SKILL.md:26`；`skills/spec-compound/references/modes.md:36` | 用反事实价值门槛约束无效沉淀，高风险不因上下文压力降级，规则服务知识污染风险而非代替模型推理。 |
| D02 | pass | `skills/spec-compound/references/schema.yaml:13`；`skills/spec-compound/references/yaml-schema.md:14`；`skills/spec-compound/references/promotion.md:7` | 编码知识分类、责任归属和晋升依据，脚本检查机械形态，编排者判断真实性与复用价值。 |
| D03 | pass | `skills/spec-compound/references/assembly.md:32`；`skills/spec-compound/references/assembly.md:43`；`skills/spec-compound/scripts/validate-frontmatter.py:270`；`docs/contracts/knowledge/knowledge-harness.md:68` | 明确机械校验、语义晋升与失败处理，并承认没有独立事务式 runtime gate；不把脚本通过冒充语义充分。 |
| D04 | pass | `skills/spec-compound/references/research.md:32`；`skills/spec-compound/references/assembly.md:13`；`skills/spec-compound/references/report.md:83` | 保留上游调查证据与失败尝试，区分缺失历史和已知事实，完成后归还 active caller 而不接管后续维护。 |
| D05 | pass | `skills/spec-compound/SKILL.md:49`；`skills/spec-compound/SKILL.md:51`；`skills/spec-compound/references/lightweight.md:3` | 入口集中表达职责和出口，研究、组装、发布与模式差异分层加载，关键规则可定位。 |
| D06 | pass | `skills/spec-compound/references/modes.md:16`；`skills/spec-compound/references/modes.md:27`；`skills/spec-compound/references/assembly.md:92` | 不依赖特定模型能力，按当前宿主事实判断隔离、模型覆盖与并行能力，缺能力时 inline/serial 并禁止冒称独立覆盖。 |
| D07 | pass | `skills/spec-compound/SKILL.md:28`；`skills/spec-compound/references/promotion.md:14`；`skills/spec-compound/evals/examples.json:13` | 已有学习优先更新，要求可观察的失效条件，并保留无关引用、假因果和失效条件空泛等反例。 |
| D08 | pass | `skills/spec-compound/references/research.md:116`；`skills/spec-compound/references/session-history.md:48`；`skills/spec-compound/references/session-history.md:52` | 相关文档先过滤再展开，会话历史限制窗口、候选数并设置升级条件；静态承诺不依赖未测成本。 |
| B01 | pass | `skills/spec-compound/SKILL.md:26`；`skills/spec-compound/SKILL.md:30`；`skills/spec-compound/SKILL.md:32`；`src/cli/contracts/dual-host-governance/skills-governance.json:159` | 单次沉淀一个已解决问题，无价值则不写；未解决问题和独立概念库建设有明确出口，入口身份与治理清单一致。 |
| B02 | pass | `skills/spec-compound/SKILL.md:18`；`skills/spec-compound/references/research.md:79`；`skills/spec-compound/references/schema.yaml:103`；`tests/unit/compound-promotion-contracts.test.js:85` | 输入、双轨分类、候选产物、晋升字段及消费者断言对应，区分机械形态与作者语义判断。 |
| B03 | fail | `skills/spec-compound/references/research.md:118`；`skills/spec-compound/references/research.md:132`；`skills/spec-compound/references/modes.md:27` | 委派、历史读取与指令文件修改有独立授权边界，但把内部问题关键词发送到 GitHub 搜索缺少相应外发授权条件，见 F1。 |
| B04 | pass | `skills/spec-compound/SKILL.md:42`；`skills/spec-compound/SKILL.md:45`；`templates/claude/commands/spec/compound.md:10`；`src/cli/contracts/dual-host-governance/skills-governance.json:164` | 当前源码为权威、禁止修改 generated runtime，命令模板说明 source 组合方式，治理清单列出八宿主投射。 |
| B05 | fail | `skills/spec-compound/scripts/run-python.sh:9`；`skills/spec-compound/scripts/validate-frontmatter.py:78`；`tests/unit/python-runtime-resolution-contracts.test.js:31` | Python readiness 只验证主版本为 3，却会选中无法加载当前类型注解的 Python 3.8，缺少最低能力匹配，见 F2。 |
| B06 | fail | `skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh:10`；`skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh:18`；`skills/spec-compound/evals/cases/positive-publish-produces-solution.yaml:15` | 正向发布判据声称保护源码，却仅检查一个字符串仍存在，且不检查候选要求的当前验证结果，存在可定位的误通过路径，见 F3。 |
| X01 | pass | `skills/spec-compound/SKILL.md:30`；`skills/spec-compound/references/research.md:53`；`skills/spec-compound/references/promotion.md:10` | 复杂问题仍按单条学习分次沉淀，研究者写面隔离，发布前检查目标漂移并如实处理部分成功，不另造编排系统。 |
| X02 | pass | `skills/spec-compound/references/yaml-schema.md:35`；`skills/spec-compound/references/promotion.md:14`；`skills/spec-compound/references/refresh-and-discoverability.md:13` | 分类合同保留 legacy 读取与路径兼容，外部版本变化进入失效条件，跨文档迁移影响交给有明确范围的 Refresh。 |
| X03 | pass | `skills/spec-compound/references/modes.md:36`；`skills/spec-compound/references/enhancement.md:7`；`skills/spec-compound/references/promotion.md:7` | 安全、数据完整性和迁移等高风险经验不得进入 Lightweight，支持发布前专项复核，且不授权执行部署、迁移或产品代码修改。 |
| X04 | pass | `skills/spec-compound/references/research.md:49`；`skills/spec-compound/references/agents/session-historian.md:57`；`skills/spec-compound/references/report.md:3`；`skills/spec-compound/references/report.md:83` | 保留来源、新鲜度、适用范围、失效条件与非独立限制，会话历史只作线索，临时产物不能冒充成功交付。 |

## Findings

### F1 · P2：相关 issue 搜索未区分本地检索与对外发送问题关键词

- **位置：** `skills/spec-compound/references/research.md:118`、`skills/spec-compound/references/research.md:132`。
- **事实：** 搜索策略从模块名、错误消息等问题上下文提取关键词，随后直接建议执行 `gh issue list --search "<keywords>"`；缺少 `gh` 时还可切换 GitHub MCP。这里的执行条件是工具可用性，没有要求核对搜索接收方与查询内容的外发授权。
- **触发与后果：** 用户只授权在本地沉淀内部故障经验时，执行者按该路径可能把内部模块名、错误消息或其他敏感线索发送给 GitHub。`references/modes.md:27` 的 worker dispatch 授权不等于这项数据外发授权；`references/assembly.md:83` 对 `git fetch` 的限制也没有覆盖这条研究路径。
- **合同依据：** `docs/methodology/结构化项目角色契约.md:50` 要求数据外发分别取得对应 scope 的授权。
- **最小修复建议：** 在相关 issue 搜索前增加一条共享边界：仅在当前授权覆盖接收方及查询内容时执行；否则跳过外部搜索、记录限制并继续本地沉淀。向相关研究角色传递该限制，不因工具可用或委派获批而扩大外发范围。

### F2 · P2：Python 解析器探测会接受无法运行当前校验脚本的解释器

- **位置：** `skills/spec-compound/scripts/run-python.sh:9-16`。
- **事实：** wrapper 只检查 `sys.version_info.major == 3`；但 `scripts/validate-frontmatter.py:78` 使用会在函数定义时求值的 `list[str]`、`tuple[bool, str]` 注解，未启用 postponed annotations；`scripts/validate-doc-claims.py:85` 同样使用内建泛型注解。
- **触发与后果：** 当 `python3` 指向 Python 3.8、`python` 指向可运行这些脚本的较新版本时，wrapper 先选中 3.8，校验器在加载阶段失败，不再尝试后续解释器。于是“已找到可运行 Python 3”并不代表校验能力就绪。
- **现有覆盖：** `tests/unit/python-runtime-resolution-contracts.test.js:39` 检查不可执行 stub 的回退，但没有覆盖“可执行、主版本正确、语言能力不足”的解释器。
- **最小修复建议：** 按脚本真实最低版本检查解释器能力，或将注解改为兼容已声明支持的版本；补充旧版可执行解释器优先出现、较新版候选随后可用的回归测试。不要将 readiness 简化为主版本判断。

### F3 · P2：正向发布 judge 无法支撑其源码保护与验证结果断言

- **位置：** `skills/spec-compound/evals/fixtures/scripts/check-solution-published.sh:10-19`。
- **事实：**
  - 字段检查只搜索全文中的 `field:`，没有确认其位于合法 frontmatter 或字段值有效。
  - “源文件不被改动”只通过 `grep -q 'Number.isFinite' src/server.js` 判断。
  - case 明确要求先运行当前测试再确认修复，见 `evals/cases/positive-publish-produces-solution.yaml:15-18`，judge 没有检查相应验证证据。
- **触发与后果：** 被测执行者可以保留 `Number.isFinite` 字样，同时修改守卫逻辑、其他源码或测试；也可以写出字段名齐全但字段值无效的文档。只要正文出现 `amount` 且报告含发布语义，脚本仍存在返回成功的路径，不能据此确认“未越权修改且经验证后发布”。
- **最小修复建议：** 复用现有假因果 fixture 的受保护文件基线检查思路，验证源码、测试及 Git 状态未发生范围外变化；对实际发布文件运行 promotion validator。测试运行证据若无法由 runner 可靠采集，应明确标为该 judge 不覆盖，而非由文件或报告关键词代证。
- **范围说明：** 这是静态可见的判据缺口，不是声称本轮已经观察到模型误通过。

## 主责深挖面发现

### B01—B04：职责与边界

- **入口收敛成立，保持现状。** `SKILL.md:26-32` 同时覆盖“没有值得保留的学习”“尚未解决或验证”“独立概念库 bootstrap”三类负例，不把显式调用当成必须写文件的理由。
- **写面 ownership 清晰，保持现状。** `SKILL.md:40-45` 与 `references/modes.md:27` 将 durable publication 留给编排者；研究角色只写私有 scratch，委派缺授权时可 inline 执行，不假装获得独立验证。
- **输入输出没有被历史拟议 YAML 绑死，保持现状。** `core/08-skill-contract-protocol.md:29-289` 定义的是其他主链路对象，没有单独规定 compound 的 YAML 输出；本对象应按当前 `schema.yaml`、候选发布合同及实际消费者核对，不能把未采用的计数门槛当成缺陷。
- **授权边界存在一处局部断口。** 私有历史读取、委派、指令文件编辑和 `git fetch` 均有明确约束，但相关 issue 搜索没有承接同等精度的外发限制，即 F1。
- **source/runtime 边界成立，保持现状。** 源模板明确由入口 source 渲染命令，治理清单列出宿主投射；本轮未检查生成镜像或真实加载，不把静态 source 一致性外推为 runtime 无漂移。

### X01—X04：扩展场景

- **X01：复杂经验不等于批量知识生产。** `SKILL.md:30` 要求不同学习分次、重新 grounding；`references/promotion.md:10` 已说明多目标不是事务，并要求精确报告部分发布。这是合理的最小机制，不需要新增任务编排器。
- **X02：版本变化与历史知识兼容有实质约束。** `references/yaml-schema.md:35` 保留旧文档路径和无关 metadata；`references/promotion.md:14` 区分远端 issue 关闭、版本发布与本项目采用，避免把失效检查写成自动升级授权。
- **X03：高风险知识的降级出口明确。** `references/modes.md:36` 禁止高风险经验因上下文紧张进入 Lightweight；`references/enhancement.md:12` 要求增强审查先作用于候选并重验，不允许事后直接改 durable target 后沿用原批准。
- **X04：知识消费与失效链路基本完整。** `references/research.md:49` 要求直接来源、新鲜度和失效条件，`references/report.md:83` 保留 caller ownership；会话历史被限制为 advisory 输入，不能凭过去的“已修复”声明完成晋升。

## 未读文件

- **被审 Skill 包内：无。** 已读取 `SKILL.md`、全部 references（含七份角色 prompt）、全部脚本、模板、eval 配置、案例、判据和 fixture 文件。
- **指定消费者清单：无遗漏。** 已读取清单所列全部 18 个测试文件，并补读 `tests/helpers/compound-contract.js`、知识 owning contract、相关治理记录和 Claude 命令源模板。
- **`/Users/kuang/.codex/AGENTS.md`：** 已尝试读取，但工具返回权限未获授予；未绕过限制。后果是无法确认该全局兼容文件是否另有附加要求，不影响上述已直接定位的源码事实。
- **范围外未展开：** 其他 Skill 的完整实现、其他宿主 generator/adapter 全量实现及 generated runtime 镜像。它们不属于指定消费者文件；因此本报告不宣称其他 workflow 端到端通过、八宿主投射行为通过或 runtime 无漂移。

本轮只做读取与静态分析，未执行会写入 fixture 或临时资产的测试、模型行为 eval、发布操作；结束时 `git status --short` 无输出。上述未执行项不作为静态裁决失败理由。

## 结论一句话

spec-compound 的知识晋升、职责和 source/runtime 静态主合同基本成立，但外部搜索授权、Python readiness 与正向发布判据存在三处可定位缺口，本轮静态对象结论为不通过，且不外推任何行为质量或收益结论。
