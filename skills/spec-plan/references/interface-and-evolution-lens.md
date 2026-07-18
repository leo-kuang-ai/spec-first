# Interface Design And Evolution Planning Lens

当请求、Product Contract 或当前 source 表明计划将新增、公开、替换或演进一个 durable interface 时，读取本 reference。这里的 interface 包括 public API、CLI contract、event/message schema、shared type、跨模块协议，以及被多个独立 consumer 依赖的持久输入/输出/error contract。

本 lens 负责 plan-time 的接口设计与演进决策。它不负责实现期 drift finding，不取代 `api-contract-reviewer`，也不把 REST、TypeScript 或某个 schema 工具提升为全局规范。

## Trigger And Negative Boundary

触发本 lens：

- 创建一个将被外部或跨模块 consumer 使用的新接口；
- 改变既有接口的字段、类型、error model、nullability、default、ordering、versioning 或 lifecycle；
- 替换、弃用或删除一个有 consumer 的接口；
- 新增或迁移 canonical contract artifact。

保持 lightweight，不触发本 lens：

- private helper、private method 或模块内部重排，且 observable contract 不变；
- 只改实现、不改变 plan-time interface 决策的 ordinary refactor；
- 由 code review 发现的实现与既有 canonical artifact 漂移；该 finding 仍由 `api-contract-reviewer` 持有，除非修复需要新的产品或架构决策。

是否触发、接口是否 durable、consumer 是否独立，均由 LLM 基于 source 与 Product Contract 判断；脚本只校验 path、schema、parser/test exit 或 artifact existence 等确定性事实。

## Shared Contract Core

Greenfield 与 evolution 都先明确同一组核心决策：

- interface 的用途、owner 与 named consumers；
- canonical artifact 的 repo-relative path、类型与 source owner；
- protocol 或调用边界，以及 request/input、response/output、error model；
- validation、authorization、privacy 或 data-classification boundary（适用时链接 high-risk 决策，不在此复制安全规则）；
- compatibility、versioning/deprecation posture 与 rollback path；
- 哪个 repo-native parser、contract test 或 executable check 在实施期验证 artifact 与实现。

只记录会改变实现、迁移、consumer 或验证的 contract 决策。命名风格、HTTP verb、pagination shape、PATCH 语义等可以作为当前 stack 的条件模式，但不是跨项目刚性模板。

## Greenfield Branch

当接口尚不存在：

- 先定义 consumer 需要观察的 contract，再选择 representation 或 framework shape；
- 在计划中记录目标 artifact path/type/owner，并绑定负责创建它的 U-ID；
- 定义 success/error/null/empty 边界和最小 compatibility posture；
- 把 consumer integration 与 contract verification 放入相关 implementation unit，不创建长期悬空的接口框架。

Greenfield 的 canonical artifact 可以尚未存在，但计划必须给出创建 owner 与 verification owner。缺少这两者时，保留 Open Question，不能把相关 unit 声称为 implementation-ready。

## Evolution Branch

当接口已存在：

- 直接读取当前 canonical artifact，并按 additive、compatible behavior change、deprecating 或 breaking 分类；
- additive optional change 默认优先，但仍检查 consumer 是否会误解新 sentinel/default/ordering；
- breaking 或 removal 采用 replacement-first：先定义 replacement 与 consumer migration，再定义 compatibility window、deprecation signal、rollback 和 removal condition；
- 删除前需要 zero-use evidence，来源可以是 current consumer search、telemetry/query 或 owner-confirmed inventory；只靠“看起来没人用”不充分；
- artifact 不可读、consumer 不可定位或 parser/test 不可用时，记录 limitation 与 unblock owner，不把未知升级为兼容结论。

## Planning Contract Landing

适用时，在 Planning Contract 中增加轻量 `### Interface Contracts` subsection。每个 load-bearing interface 记录：

| Field | Required content |
| --- | --- |
| Interface / mode | 名称，以及 `greenfield` 或 `evolution` |
| Consumers | 当前或目标 consumers；未知项显式标记 |
| Canonical artifact | repo-relative path、type、owner；greenfield 绑定 creation U-ID |
| Contract summary | protocol、input/output、error 与关键 boundary |
| Compatibility | additive/deprecating/breaking、window、replacement/rollback/removal posture |
| Verification | repo-native parser/test/check owner，或 `parser_unavailable` + reason/owner/unblock condition |

不要把完整 schema 正文复制进 plan。Plan 记录 owner、path、关键 contract decision 与验证方式；canonical artifact 持有机器可读或可执行的完整 contract。

## Review And Failure Boundary

- `spec-plan` 负责 WHAT/HOW 层的 interface design、evolution posture 与 canonical artifact landing。
- implementation unit 负责创建或修改 artifact、运行 repo-native parser/test，并记录真实结果。
- `api-contract-reviewer` 负责检查 diff 是否偏离当前 plan/artifact 和 consumer contract；它不反向成为接口设计 owner。
- 没有 repo-native parser/test 时记录 `parser_unavailable`，使用最窄替代证据并限制 claim；不要在本任务中发明跨格式 parser 基础设施。
- 需要新的 public API-design Skill、第二套 canonical contract、跨 repo mutation owner 或未获授权的 schema/runtime boundary 时，停止并返回 plan owner。
