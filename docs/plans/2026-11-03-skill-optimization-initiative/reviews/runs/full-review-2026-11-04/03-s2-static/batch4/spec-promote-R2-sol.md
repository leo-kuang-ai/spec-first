# spec-promote 评审（R1）

## 逐项裁决表

本轮仅裁决当前 worktree 源码的静态合同，不将静态通过外推为行为质量、运行成本或真实发布效果通过。脚本提供确定性 readiness facts；交付状态解释、文案质量与授权判断仍由 LLM 承担。下表中的 prose 约束不代表宿主已硬强制。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-promote/SKILL.md:29`；`skills/spec-promote/references/spiral-cli.md:108-135` | 交付状态限制与渠道 cue-word 示例均对应具体风险，未见需要按“模型已会”删除的无依据约束。 |
| D02 | pass | `skills/spec-promote/SKILL.md:89-110`；`skills/spec-promote/scripts/check-spiral-auth.cjs:9-59` | 提供渠道形态、CTA、文风反模式和 provider 特有知识；脚本不代替文案语义判断。 |
| D03 | fail | `skills/spec-promote/scripts/check-spiral-auth.cjs:50-58` | readiness 判定存在冲突字段放行路径，显式 `authenticated: false` 仍可能被归类为 ready，见 F1。 |
| D04 | pass | `skills/spec-promote/SKILL.md:29-42,78,114-124`；`tests/unit/ce-localization-round-1-remediation-contracts.test.js:122-135` | 明确继承 caller 的交付状态、区分合并与部署，并定义草稿、provider receipt 与人类发布边界。 |
| D05 | pass | `skills/spec-promote/SKILL.md:55-83`；`skills/spec-promote/references/spiral-cli.md:69-144` | 主入口保留关键边界，provider 细节集中在 reference；重复主要用于授权和安全边界的局部可见性。 |
| D06 | pass | `skills/spec-promote/SKILL.md:64-68,85-110`；`skills/spec-promote/references/spiral-cli.md:30` | 不依赖特定模型或专有提问工具，provider 不可用时本地起草，提问工具缺失时使用聊天等待。 |
| D07 | pass | `skills/spec-promote/references/spiral-cli.md:26,108-135`；`tests/unit/spec-promote-auth-probe.test.js:37-78` | 有具体维护依据和保密负例测试；该入口不承担自动学习或 durable knowledge promotion 职责。 |
| D08 | pass | `skills/spec-promote/SKILL.md:29-42,55,72,76` | 优先复用用户及 caller 信息，本地模式跳过 provider 探测，setup 与生成细节按条件加载。 |
| B01 | pass | `skills/spec-promote/SKILL.md:2-5,10-16,123` | 手动独立入口定位明确，职责为发布文案草稿，不扩张为发布、提交或 PR 操作。 |
| B02 | fail | `skills/spec-promote/references/spiral-cli.md:13-16`；`skills/spec-promote/scripts/check-spiral-auth.cjs:50-58` | reference 承诺按认证合同提供 readiness，但脚本对相互矛盾的认证字段采用成功优先，见 F1。 |
| B03 | fail | `skills/spec-promote/SKILL.md:78-83`；`skills/spec-promote/references/spiral-cli.md:73-75,144` | 外发授权与持久化披露明确，但生成命令没有像认证探针一样在工具输出进入可见轨迹前完成原始输出隔离，见 F2。 |
| B04 | pass | `skills/spec-promote/SKILL.md:55-59`；`tests/unit/spec-promote-auth-probe.test.js:8-11` | helper 从实际加载的 `SKILL_DIR` 解析，测试引用 source 路径，未要求修改 generated runtime；不据此声明宿主投射已验证。 |
| B05 | fail | `skills/spec-promote/SKILL.md:68,83`；`skills/spec-promote/references/spiral-cli.md:73-75,139-144` | 认证探针有时间边界，但 `spiral write` 对 hangs 只有 fallback 意图，没有有限等待和终止要求，见 F3。 |
| B06 | pass | `skills/spec-promote/SKILL.md:29,81-83,114-124` | 静态合同要求交付全部返回草稿、披露失败外发尝试并禁止冒充已发布；不强套代码实施与代码审查职责。 |
| X01 | not-applicable | `skills/spec-promote/SKILL.md:44-51,110` | 该入口交付小规模渠道文案，不拥有多模块实施、共享写面集成或长任务编排。 |
| X02 | not-applicable | `skills/spec-promote/SKILL.md:10-16`；`skills/spec-promote/references/spiral-cli.md:49` | 不负责 API 或架构变更、迁移与回退；旧 CLI 的兼容降级属于其依赖处理，已单独说明。 |
| X03 | not-applicable | `skills/spec-promote/SKILL.md:16,123` | 不执行高风险实现、生产发布或回滚；外发与本地偏好写入风险已在 B03/B05 核查。 |
| X04 | not-applicable | `skills/spec-promote/SKILL.md:114-124` | 输出直接交给当前用户，不承担跨会话恢复、协作 owner 转移或知识晋升；继承 caller 证据已在 D04 核查。 |

## Findings

### F1 · P2：冲突认证字段可被提升为 ready

- **位置：** `skills/spec-promote/scripts/check-spiral-auth.cjs:50-54`
- **事实：** 成功分支使用 `payload.authenticated === true || payload.status === 'authenticated'`，并先于显式未认证分支执行。
- **触发与后果：** 对 `{"authenticated":false,"status":"authenticated"}`，脚本会输出 `status: ready`、`authenticated: true`，把存在冲突的 provider 输出提升为确定认证事实。这不会自行绕过独立外发授权，但可能错误选择 Path A，产生本可避免的调用和失败。
- **最小修复建议：** 明确认证字段的组合规则；相互矛盾的字段返回 `unverified`，不要采用任一成功字段优先。
- **复验建议：** 在 `tests/unit/spec-promote-auth-probe.test.js:37-78` 所在测试组补充冲突字段的双向负例，保留现有脱敏断言。

### F2 · P2：生成路径缺少原始输出隔离机制，无法兑现自身保密承诺

- **位置：** `skills/spec-promote/references/spiral-cli.md:73-75,95-106,144`；对照 `skills/spec-promote/scripts/check-spiral-auth.cjs:22-47`
- **事实：** 认证路径通过 helper 捕获、丢弃 provider 原始 stdout/stderr，只输出白名单字段；生成路径则直接展示 `spiral write ... --json` 命令，同时要求原始错误、stdout/stderr 和内部 commentary 不进入聊天、日志或持久化产物。
- **触发与后果：** provider 生成失败并在 stderr 输出敏感字段，或成功 JSON 带有内部 `text` 时，普通命令执行工具可能先将这些原始字节纳入工具输出或会话轨迹；LLM 之后不复述，不能撤销此前的暴露。
- **最小修复建议：** 为生成调用复用认证探针的隔离模式：捕获原始输出，校验并仅输出允许展示的草稿字段、会话引用和安全 receipt；异常路径只输出固定 reason code，不输出原始异常文本。
- **边界：** 这是静态合同与执行路径不匹配，不是声称本轮已经观察到真实秘密泄漏。若依赖宿主提供输出隔离，需明确能力前提；缺少该能力时使用 Path B。

### F3 · P2：生成调用的 hangs 恢复没有有限执行边界

- **位置：** `skills/spec-promote/references/spiral-cli.md:73-75,139-144`；`skills/spec-promote/SKILL.md:68`
- **事实：** reference 将 hangs 列为 fallback 条件，却没有为 `spiral write` 指定最大等待时间、超时终止或取消方式。认证 helper 则明确使用 `TIMEOUT_MS = 3000`（`skills/spec-promote/scripts/check-spiral-auth.cjs:7,26`）。
- **触发与后果：** provider 长期无返回时，何时判定 hangs、何时交付本地文案取决于宿主默认行为，不能稳定兑现“provider 失败不阻塞交付”的静态承诺。
- **最小修复建议：** 为生成调用要求有限 timeout，超时终止后返回现有安全 receipt，再完成受影响渠道的本地草稿；保持 `delivery_status: unknown`，不自动重试可能已持久化的生成请求。
- **复验建议：** 使用不退出的假 provider 检查超时、终止、脱敏 receipt 与 fallback；不需真实外发。

## 主责深挖面发现

- **D01——保持现状成立。** `references/spiral-cli.md:108-135` 的 cue-word 说明是 provider 接口陷阱，不是泛化的模型能力补丁；`SKILL.md:29` 的交付状态规则防止把 PR/commit 证据升级为上线宣称，也不应为缩短篇幅删除。
- **D02——保持现状成立。** `SKILL.md:89-110` 将渠道知识留给 LLM，认证脚本只生成 readiness facts，职责划分合理。无需为该入口引入文案评分器、刚性模板或完整营销编排。
- **D03——应修确定性事实边界，而非加长自检清单。** F1 的根因在脚本认证分类；增加“确认已登录”之类 prose 不能修复冲突字段放行。F2 同样应落在输出隔离边界，不能靠要求 LLM 更谨慎替代。
- **D04——保持轻量交接。** `SKILL.md:29-42` 已消费上游交付状态及来源，不要求重新跑研发链路。`core/08-skill-contract-protocol.md:27-289` 的五个主链路合同不包含 `spec-promote`，不应据其拟议 YAML 或计数门槛要求该入口新增产物。
- **D05——不建议先做大规模压缩。** 主入口和 reference 对外发授权、fallback 的重复具有局部可见性价值。优先修复 F1–F3，避免用篇幅缩短掩盖真实的安全与恢复缺口。
- **D08——按需读取设计成立。** 本地请求跳过探测，repository context 不足才补读，provider 细节在对应分支加载。这里的 pass 只表示静态加载策略清楚，不表示 token 或耗时收益已经实测。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取工具返回尚未获准访问；未重试绕过。其可能包含的附加全局要求未能核对。
- `skills/spec-promote/` 中可能存在的其他 references、scripts、templates、evals：目录枚举命令未获准执行，无法确认是否存在额外资产，因而不能宣称已穷尽全部相关文件。这是读取完整性限制，不据此把已可文本判断的维度改记为 `not-verified`。

已完整读取入口、`references/spiral-cli.md`、`scripts/check-spiral-auth.cjs`、检查表全文、合同基线全文、角色契约，以及消费者清单所列的两个测试文件。未运行测试、provider 或行为评测；没有修改文件。

## 结论一句话

已读范围内，`spec-promote` 的领域知识、交付状态继承和按需上下文设计成立，但认证冲突判定、生成输出隔离及超时恢复存在三个静态缺口；本轮完成了全部 18 项裁决，受目录枚举权限限制，不能声明必读资产已穷尽。
