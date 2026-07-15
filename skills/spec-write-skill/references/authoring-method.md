# Authoring Method

本 reference 只承接 portable authoring 方法。宿主差异见 `target-profiles.md`，项目治理与 source/runtime 见 `project-profiles.md`，验证见 `delivery-gates.md`。

## Qualification And Intent Contract

只有满足至少一项才创建或扩展 Skill：

- recurring job 会重复发生；
- near-neighbor 容易误路由；
- deterministic script/reference 能减少重复错误；
- portability、治理或 source ownership 是承重边界。

默认不创建或修改 Skill：一次性回答、解释/总结/翻译、普通文档导出、只讨论未来大纲、普通 code review/debug/plan/work、第三方安装或导入。纯安装/导入请求直接路由 installer，不进入本 workflow，也不强制附加 readiness 检查。只有用户明确同时要求独立的 readiness、安全或结构检查时，才先以 `base_operation=revise`、`effect=validate-only` 完成 no-follow 检查并停止；复制、安装或导入仍交给独立入口重新授权。

Near-neighbor 或 should-not-trigger 请求只返回路由结论：`base_operation=null`、`effect=not-entered`、`modifier=none`。后续入口可以建议普通 code work、bounded source review、installer 或 runtime maintenance，但不得把那些入口的预期动作记成本 workflow 的 `apply`/`validate-only`，也不得继续执行本 workflow 的 inventory、validator 或 mutation步骤。

进入 authoring 前至少得到：

- one-sentence recurring job；
- real inputs 与 required outputs；
- should-trigger 和 should-not-trigger/near-neighbor 各一个真实示例；
- base operation：`create|revise`；
- effect：`apply|validate-only`；
- modifier：`migrate|audit-remediation|none`；
- target repo、Skill root、canonical source owner；
- mutation authorization：`ready|preview-only|blocked`；
- first verification target。

当 revision 仅是 typo、计数、metadata/术语修正、明确不可达内容删除或等价结构整理，且不改变 trigger、schema、contract、threshold、gate、roster 或 model routing，可按 `authoring-workbench.md` 的 Tier A short path 处理；它仍要 owner、授权、preview/write-set binding 与最窄结构验证。不要把承重行为变化伪装成 Tier A。

只询问答案会改变 package 设计、权限或不可逆结果的最少问题，并尽量合并为一轮。能从 source 发现或以低风险、可撤销假设推进时，记录假设并继续；不要用更多目录、profiles 或 fallback 掩盖真正未决的意图。

## Source And Effect Resolution

按以下顺序确认 target：

1. 用户明确给出的 Skill directory；
2. 当前 repo 中与名称匹配的 project-owned source；
3. 项目规则声明的 canonical Skill root；
4. 都无法确认时保持 `preview-only`。

用户已绑定单一 target repo、但未写出 Skill root 时，不要立即以 `blocked-source-owner` 结束：先检查项目规则与相邻 project-owned packages。若仍不能唯一确认，给出一个明确标注“candidate only”的 canonical path preview、完整 package outline、不会修改的 surfaces 和一个会改变路径的澄清问题；在用户确认前保持零 mutation。只有跨 repo、多候选 owner、repo-external 或 generated-only 等无法绑定单一 source owner 的情况才使用 `layer_result=blocked-source-owner`。

当用户明确要求 create/revise、但 target/source owner 不唯一、跨 repo 或 generated-only 时，保留该请求的 `base_operation=create|revise` 与 `effect=apply`，但以 `layer_result=blocked-source-owner` 报告，且 would-change paths/commands 必须为空、不得 mutation。`not-entered` 只用于根本不是 authoring/readiness 的 near-neighbor；不要把 source-resolution blocker 误路由成拒绝后的近邻。

`validate-only` 永远不升级为 apply。对已存在 package 的 readiness 检查使用 `base_operation=revise`；`revise` 在此只表示输入是现有 package，不代表允许修改。`audit-remediation` modifier 只处理已接受 finding。`migrate` modifier 只处理同 repo trusted source；第三方 package 和跨仓目标只允许 inventory/readiness。Modifier 不改变 base operation 或 effect，也不创建第三套执行主干。

对现有 package 先列 inventory，不把全部正文加载给 LLM：文件、目录、symlink、special file、frontmatter fields、Markdown references、scripts 和 secret-like paths。Bundled validator 会在本地预算内读取非 secret-like 文本字节，用于 UTF-8、敏感内容和引用检查，但不返回正文或敏感值；Inventory 仍是 advisory facts，是否采用内容由 LLM 判断。

## Portable Authoring Core

### Description As Trigger Contract

Frontmatter `description` 必须同时表达：

- Skill 拥有的 recurring job；
- 会触发的真实用户动作；
- 容易混淆的负向边界；
- 必要时声明只读或显式调用边界。

避免尖括号占位符、同义词堆叠和只在正文出现的触发规则。先用 positive、negative、near-neighbor 样例检查 route，再扩展 package。

### Branch-First Information Hierarchy

先列只有在输入、步骤、输出或验证不同才成立的 branch，再放置资源：

- `SKILL.md`：所有 branch 共用的执行骨架、边界、输出和安全默认值；
- `references/`：只有特定 branch 才需要的长规则、target/project profile、schema 或示例；
- `scripts/`：确定性、重复、容易手写错且可测试的逻辑；
- `assets/`：输出中复制或改造的静态素材；
- `evals/`：维护者 route/output regression，不是 runtime 必读内容。

Context pointer 必须说明“什么条件下读取”和“读完支持什么判断”。如果正常路径每次都读取全部 references，说明分支或 owner 切分失败，应合并承重规则或重新按条件拆分。

### Match Freedom To Failure Cost

按任务脆弱度分配约束强度：开放式语义判断使用原则与判据；有首选路径但允许变化时使用步骤骨架或参数化模板；容易造成数据损坏、越权或格式破坏的动作交给窄脚本和 hard gate。不要用长 prompt 模拟本可确定性验证的 schema/path/hash，也不要用脚本替代产品、架构或语义判断。

当 Skill 的主要机制是 prose、角色/persona、few-shot、输出格式或 agent loop 时，读取 `behavior-contract-design.md`。它只负责模型行为合同，不取代本文件的 package、source owner、resource placement 与 portability 规则。

### Completion Criteria And Pruning

写入、shell、runtime、network、delegate 和 handoff 步骤必须同时有：

- clarity：能判断 done/not done；
- demand：明确需要完成的调查、验证或交付物；
- failure behavior：条件不满足时停止、降级或交接什么。

逐句检查 prose 是否改变触发、读取、写入、判断、验证或 handoff；没有改变就删除。一个概念只保留一个 owner，不用重复解释制造多真相源。

## External Pattern And Migration Rules

借鉴顺序是 external benchmark → user source → local fit。只吸收可复用 pattern，不复制平台 invocation、绝对路径、权限假设或未经验证的 public claims。

Same-repo migration 对每个非 portable 文件给出 disposition：

- `preserve`：目标仍消费且内容不需改变；
- `translate`：有 confirmed target/project mapping；
- `drop-with-reason`：确认是生成物、maintainer-only 或目标不支持；
- `manual-decision`：owner、语义或消费者不明确。

未知 metadata、sidecar 和用户文件默认 `preserve` 或 `manual-decision`，不能为了“干净”删除。

## Anti-Pattern Families

- `one-off-vs-reusable`：把一次性请求包装成 Skill。
- `audit-not-authoring`：只审计却直接写 source。
- `external-import-mutation`：第三方 package 未经 trust/source-owner 确认就复制或执行。
- `runtime-mirror-patch`：把 generated runtime 当 canonical source。
- `project-profile-leak`：把单一项目治理写成 portable contract。
- `target-profile-leak`：把单一宿主 metadata 当通用标准。
- `weak-context-pointer`：条件 reference 没有读取条件。
- `vague-completion-criterion`：步骤只有动作名，没有 done signal。
- `fixture-as-behavior-proof`：结构样例通过却声称模型行为改善。
- `leading-word-no-op`：口号不改变实际动作。
- `adjective-persona`：用形容词堆人设，却没有可观察行为倾向。
- `flat-must-wall`：把 hard gate、偏好和启发式都写成同强度命令。
- `example-without-boundary`：只有理想正例，没有 near-neighbor/bad/why 校准。
- `self-check-as-evidence`：把模型自检或“已遵守”当成 semantic/field proof。
- `fixed-tool-quota`：用固定调用次数或“工具免费”假设替代成本、依赖与风险判断。

## Skill Creator Compatibility

- `name` 使用 kebab-case，并与目录及目标项目治理记录一致。
- Portable baseline 只要求 `name` 和 `description`；目标扩展字段由 target profile 判断并保留未知字段。
- Description 不使用 `<placeholder>`；需要占位时用自然语言或 `{placeholder}`。
- 新增脚本必须有实际运行和零意外写入证据。
- Forward testing 只传 raw artifact 和真实用户请求，不泄漏预期答案或 intended fix。
