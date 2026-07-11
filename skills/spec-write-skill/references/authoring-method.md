# Authoring Method

本 reference 只承接 portable authoring 方法。宿主差异见 `target-profiles.md`，项目治理与 source/runtime 见 `project-profiles.md`，验证见 `delivery-gates.md`。

## Qualification And Intent Contract

只有满足至少一项才创建或扩展 Skill：

- recurring job 会重复发生；
- near-neighbor 容易误路由；
- deterministic script/reference 能减少重复错误；
- portability、治理或 source ownership 是承重边界。

默认不创建或修改 Skill：一次性回答、解释/总结/翻译、普通文档导出、只讨论未来大纲、普通 code review/debug/plan/work、第三方安装或导入。

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

缺少会改变 package 设计的信息时只问 2-3 个问题。不要用更多目录、profiles 或 fallback 掩盖未决意图。

## Source And Effect Resolution

按以下顺序确认 target：

1. 用户明确给出的 Skill directory；
2. 当前 repo 中与名称匹配的 project-owned source；
3. 项目规则声明的 canonical Skill root；
4. 都无法确认时保持 `preview-only`。

`validate-only` 永远不升级为 apply。`audit-remediation` modifier 只处理已接受 finding。`migrate` modifier 只处理同 repo trusted source；第三方 package 和跨仓目标只允许 inventory/readiness。Modifier 不改变 base operation 或 effect，也不创建第三套执行主干。

对现有 package 先列 inventory，不先读完所有正文：文件、目录、symlink、special file、frontmatter fields、Markdown references、scripts 和 secret-like paths。Inventory 是 advisory facts；是否采用内容仍由 LLM 判断。

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

## Skill Creator Compatibility

- `name` 使用 kebab-case，并与目录及目标项目治理记录一致。
- Portable baseline 只要求 `name` 和 `description`；目标扩展字段由 target profile 判断并保留未知字段。
- Description 不使用 `<placeholder>`；需要占位时用自然语言或 `{placeholder}`。
- 新增脚本必须有实际运行和零意外写入证据。
- Forward testing 只传 raw artifact 和真实用户请求，不泄漏预期答案或 intended fix。
