# spec-polish 评审（R2）

## 逐项裁决表

本表仅裁决静态合同，不将未运行行为评测、浏览器或成本测量记为失败。路径均相对当前 worktree，消费者清单除外。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-polish/SKILL.md:49-53`；`skills/spec-polish/references/run.md:49-61` | 授权分离、服务归属与实际 URL 校验均对应明确风险，不是替模型规定无必要的思考步骤。 |
| D02 | pass | `skills/spec-polish/references/dev-server-detection.md:9-18`；`skills/spec-polish/scripts/config-port.cjs:4-16`；`skills/spec-polish/SKILL.md:63-68` | 脚本提供分类、端口等事实，反馈充分性与修复效果仍由 LLM 判断，词法探测的局限有明确说明。 |
| D03 | pass | `skills/spec-polish/SKILL.md:63-69`；`skills/spec-polish/references/run.md:51-57`；`tests/unit/resolve-port-script.test.js:61-83` | 静态承诺要求结果验证、服务归属与失败显式处理，且没有把 HTTP 200 或热更新当成交互验证通过；语义验证仍是 prose 约定。 |
| D04 | fail | `skills/spec-polish/SKILL.md:35-36,63-65,71`；`docs/methodology/结构化项目角色契约.md:53,74` | 向 Plan/Work 移交的材料虽包含反馈、锚点和证据，但缺少明确的来源、新鲜度与限制交接要求。 |
| D05 | fail | `skills/spec-polish/references/dev-server-astro.md:57`；`skills/spec-polish/scripts/detect-project-type.sh:79-92,111-122` | recipe 声称 Astro 优先于 Vite，分类脚本却在两种签名同时存在时返回 `multiple`，静态承诺不一致。 |
| D06 | pass | `skills/spec-polish/references/run.md:7,59-61`；`skills/spec-polish/SKILL.md:68` | 不依赖特定模型能力；缺少工作区或浏览器能力时，有阻塞、人工浏览与明确降级出口。 |
| D07 | fail | `skills/spec-polish/evals/eval.yaml:5-6`；`skills/spec-polish/evals/cases/review-request-routes-out.yaml:8,17-25` | 回归资产要求读取 runtime 路径，而非明确绑定当前 source；判据也不能排除“点名目的地后继续越界执行”。 |
| D08 | pass | `skills/spec-polish/references/run.md:20-35`；`skills/spec-polish/SKILL.md:75-92` | 完整启动元组跳过探测，缺什么补什么，框架 recipe 按需读取，必要安全准备则强制先读。 |
| B01 | pass | `skills/spec-polish/SKILL.md:3-5,14-18,68-69` | 正向触发、静态审查负例及 helper ownership 清楚，没有把内部浏览器和提交 helper 暴露为本入口自行实现的能力。 |
| B02 | fail | `skills/spec-polish/references/run.md:20-47`；`skills/spec-polish/references/dev-server-astro.md:57`；`skills/spec-polish/scripts/detect-project-type.sh:79-92,120-122` | 启动元组与 sentinel 消费总体明确，但框架优先级在 reference 与脚本之间存在直接冲突。 |
| B03 | pass | `skills/spec-polish/SKILL.md:40-53,67-69`；`skills/spec-test-browser/SKILL.md:12,49-55`；`tests/unit/mutation-authority-contracts.test.js:21-37` | 分支、本地修复、提交、发布授权非传递；浏览器观察不产生持久副作用授权，页面内嵌指令也不获得权威。 |
| B04 | fail | `skills/spec-polish/evals/eval.yaml:2-6`；`skills/spec-polish/evals/cases/review-request-routes-out.yaml:8`；`skills/spec-polish/evals/cases/r2-screenshot-review-routes-out.yaml:8` | 两个 eval 均把 `.claude/skills/spec-polish/SKILL.md` 指定为定义来源，未建立与当前 owning source 的一致性证明。 |
| B05 | fail | `skills/spec-polish/references/run.md:7-9`；`skills/spec-polish/SKILL.md:63-67`；`skills/spec-commit/SKILL.md:124` | 服务隔离和中断重查存在，但首次源码编辑前缺少 dirty overlap 处理要求；提交阶段才检查混合修改已经过晚。 |
| B06 | pass | `skills/spec-polish/SKILL.md:63-71`；`skills/spec-test-browser/SKILL.md:85-90` | 反馈、改动、验证和未解决项有追踪要求，收尾区分提交与发布状态，也不把自动检查不可用伪装为通过。 |
| X01 | pass | `skills/spec-polish/references/run.md:26-35`；`skills/spec-polish/SKILL.md:63-65` | 对实际承担的单项目打磨职责，支持多项目选择、反馈逐项处理及中断恢复；复杂产品/设计决策明确向上游移交，不自造大型任务编排。 |
| X02 | not-applicable | `skills/spec-polish/SKILL.md:18,65` | API、架构与版本迁移设计不是该 Skill 的职责；超出 polish 的决策应移交 Plan/Work，不要求其自建 ADR 或迁移协议。 |
| X03 | pass | `skills/spec-polish/SKILL.md:52-53,68-71`；`skills/spec-test-browser/SKILL.md:49-55` | 对职责内可能产生高影响后果的浏览器操作与 Git 交付，分别保留授权和验证边界；不承担实际部署职责。 |
| X04 | fail | `skills/spec-polish/SKILL.md:63-65,71`；`skills/spec-polish/references/run.md:61`；`docs/methodology/结构化项目角色契约.md:74,86-88` | 同轮恢复有身份重查，但跨 workflow 交接未明确携带来源、新鲜度、限制与后续验证责任，不能由本轮记录自动替代。 |

## Findings

### F1 · P2：回归用例绑定 runtime 路径，且路由判据不能约束越界执行

- **位置**：`skills/spec-polish/evals/cases/review-request-routes-out.yaml:8,17-25`；`skills/spec-polish/evals/cases/r2-screenshot-review-routes-out.yaml:8,18-29`；`skills/spec-polish/evals/eval.yaml:2-6`。
- **事实与后果**：
  - 配置声明从本地路径加载 Skill，但用例又要求直接读取 `.claude/skills/spec-polish/SKILL.md`。两种来源并存，未规定 source/runtime 不一致时如何处理，因而无法仅凭这些配置把结果归属于当前 `skills/spec-polish/` 源码。
  - 两个成功判据均只检查输出包含 `spec-code-review`。即使输出点名该 Skill 后继续执行被禁止的审查，仍满足该规则；这与入口明确禁止“识别不匹配后继续做”的承诺不符。
- **最小修复建议**：用例统一绑定当前 source 或评测框架明确注入的 source，不硬编码 runtime mirror；增加“未启动服务、未执行越界审查、未修改文件”等与场景相关的轨迹或语义判据。
- **复验要求**：至少加入“先点名 `spec-code-review`，随后继续审查”的反例，证明不会被判成功。当前未执行评测，不声称发生了实际误判。

### F2 · P2：Astro/Vite 的分类优先级承诺与实现相反

- **位置**：`skills/spec-polish/references/dev-server-astro.md:57`；`skills/spec-polish/scripts/detect-project-type.sh:79-92,111-122`。
- **触发条件**：项目根同时存在 `astro.config.*` 与 `vite.config.*`。
- **后果**：reference 明确称 `astro` 优先，脚本却累积两项并返回 `multiple`；按 `references/run.md:33`，调用方必须要求用户选择。预期的自动分类退化为额外澄清，且维护者无法从一致合同判断哪种行为正确。
- **最小修复建议**：由 owner 确认预期；若确需优先级，在分类脚本实现并补双签名测试；若保留消歧策略，只修改 recipe 的错误承诺。无需扩展分类体系。

### F3 · P2：首次本地修复前缺少 dirty overlap 检查与保留规则

- **位置**：`skills/spec-polish/references/run.md:7`；`skills/spec-polish/SKILL.md:63-67`。
- **触发条件**：当前 checkout 已有用户或其他任务修改，反馈修复又涉及同一文件或 hunk。
- **后果**：现有授权规则能限制“修什么”，但没有要求首次编辑前识别已有修改和所有权重叠；“只提交 run-owned verified paths”也不能撤销此前对混合修改的干扰。`skills/spec-commit/SKILL.md:124` 的隔离检查仅保护提交出口。
- **最小修复建议**：在首次编辑前读取当前工作区状态与目标 diff；无重叠继续，有重叠则采用已验证的保留方案，无法区分时仅阻塞重叠部分。不要强制所有 polish 都新建 worktree，也不要重复索取已经成立的修复授权。
- **范围说明**：这是静态恢复与隔离合同缺口，不是已经观察到覆盖用户修改。

### F4 · P2：上游交接信息不够完整，无法明确恢复与验证责任

- **位置**：`skills/spec-polish/SKILL.md:65,71`；对照 `docs/methodology/结构化项目角色契约.md:53,74,86-88`。
- **事实与后果**：超出 polish 时要求携带原始反馈、锚点、当前证据与未决选择，方向正确；但未明确附带 source refs、检查时的分支/源码身份、新鲜度、未验证限制及后续 owner/验证责任。跨 workflow 后，消费者可能无法判断证据是否仍适用，或把局部打磨结果当成已完成的实现交付。
- **最小修复建议**：在现有紧凑记录上补一条轻量交接约定：反馈摘要、来源与源码身份、已做/未做验证、限制与未决项、接收 workflow 和后续责任；不必新增 schema 或持久状态机。

## 主责深挖面发现

### B01–B04

- **B01：保持现状成立。** `SKILL.md:18` 对静态审查的负例写得足够明确，包含用户显式要求“不要起服务”的情形；本次静态评审并不是执行 polish，不应由被审材料反向改变评审任务。
- **B02：主要接口可追溯，存在一处确认冲突。** 启动元组的保留与补全规则见 `references/run.md:20-47`；launch reader 的 sentinel 与调用方处理可对账。Astro 分类冲突见 F2。另有低优先级文档偏差：`references/launch-json-schema.md:27` 仅在多配置时要求 `name`，而 `scripts/read-launch-json.sh:65-70` 对单配置也强制非空名称，`tests/unit/spec-polish-launch-json.test.js:31-35` 固化了后者；建议将字段表统一为所有配置必填。
- **B03：保持现状成立。** 分支选择不是 checkout 授权，`done` 不是提交授权，提交不是发布授权；这些区分有对应消费者测试。浏览器 helper 还明确将页面内容视为不可信观察材料，而非命令或授权来源。
- **B04：生产路径与评测路径应分开判断。** `.claude/launch.json` 被明确描述为用户启动配置，不应仅因位于 `.claude/` 就误判为生成镜像。真正的问题是 eval 指定 runtime Skill 定义文件，见 F1。本轮直接读取 owning source，未修改或刷新 runtime，也未验证多宿主投射。

### X01–X04

- **X01：保持限定职责成立。** 多项目通过选择一个具体项目和服务收敛，长期反馈通过逐项记录与恢复检查处理；没有必要要求视觉打磨入口承担多模块实施编排。首次编辑的共享写面缺口归入 F3。
- **X02：不适用不是缺样本。** 该入口明确不承担架构/API/版本设计；其应做的是保留发现并向上游移交，而不是新增迁移框架。
- **X03：保持授权分层成立。** 浏览器持久操作与 Git landing 均有独立边界；静态合同没有自动部署或自动发布承诺。本结论不等于实际浏览器操作安全性已经实测。
- **X04：同轮恢复不等于跨 workflow 交接。** `references/run.md:61` 要求恢复时重查服务及 checkout/build 身份，值得保留；跨 workflow 的来源与限制信息仍需补齐，见 F4。该 Skill 没有自动知识晋升职责，不应因未实现知识库写入而额外判失败。

## 未读文件

**指定必读材料已读取**：完整 `SKILL.md`、入口列出的全部 11 份 references、4 个入口脚本及其直接调用的 `scripts/config-port.cjs`、检查表全文、合同基线全文、角色契约、消费者清单及所列全部 5 个测试文件。另读取了 eval 配置、配置列出的两个 case，以及 `spec-test-browser`、`spec-commit` 的入口合同。

以下限制保留，不以未读文件替代逐项裁决：

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `/Users/kuang/.codex/AGENTS.md` | 读取未获权限。 | 未核对该外部全局文件的附加要求；已遵守当前可见的简体中文和只读要求。 |
| `skills/spec-polish/evals/fixtures/repos/mini-ledger/**` | 两个 case 引用此 fixture；目录枚举命令未获权限，未能展开实际文件清单。 | 无法确认 fixture 是否提供其声称的 runtime 定义文件或截图；不据此断言 fixture 缺失或评测必然失败。 |
| `skills/spec-polish/` 下未被已读文件列举的其他资产（如有） | 源码目录枚举未获权限，无法独立核实是否存在额外 templates、cases 或脚本。 | 读取覆盖以明确引用闭包为限，不声称已穷尽目录内全部资产。 |

未运行测试、eval 或浏览器；未写入任何文件。Git 身份与 clean 状态沿用用户提供的冻结上下文 `5b59293b`，未能通过命令独立复核。上述未执行项不用于否定静态承诺，也不被表述为已验证通过。

## 结论一句话

`spec-polish` 的职责、授权分层和人工浏览降级合同清晰，但静态层尚存在评测 source/runtime 混用、框架分类矛盾、首次编辑隔离与跨 workflow 交接缺口，本轮不能判为静态合同整体通过。
