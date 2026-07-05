# Agent Model 分档审计 (2026-05-27)

本文档对 `agents/*.agent.md` 中所有 51 个 agent 的 `model` 字段做一次系统盘点，按"任务性质 + 触发频率 + 模型能力依赖"分档，给出降档建议，作为后续批量调整 reviewer/agent 性能档位的事实依据。

> 本文档不直接修改 agent 源；改动需走单独 PR，并在 CHANGELOG 中记录 (user-visible)。

## ⚠️ 宿主适用性边界（关键前提）

**本文档的分档建议仅作用于 Claude Code，对 Codex 当前 runtime 完全不生效。** 这是一个容易踩坑的边界，先讲清楚再看分档表。

### 证据

- `src/cli/adapters/codex.js` 的 `transformAgentContent` 只做**路径改写**与 `Task spec-foo(...)` 文本替换，**完全不读取 agent frontmatter，更不消费 `model:` 字段**。
- `.codex/agents/*.agent.md` 是从 `agents/` 直接复制的镜像，保留了 `model: inherit|sonnet|haiku` 字段，但 Codex 端没有任何代码消费它。
- 用户级 Codex 配置 `~/.codex/config.toml` 只有**全局单一**的 `model = "..."` 与 `model_reasoning_effort = "..."` 入口，没有 per-agent / per-profile 的 model 覆盖机制。
- `spawn_agent` 派发出去的子 agent 沿用同一个全局 model 与 reasoning effort，不读 agent profile 的 `model:` 字段。

### 含义

- "把 `spec-feasibility-reviewer` 改 `sonnet`"这类改动**只在 Claude Code 主机里命中**；同一份 agent 在 Codex 主机下跑的仍是 `~/.codex/config.toml` 里配置的全局模型（当前是 `gpt-5.5 + xhigh reasoning`）。
- 修改 `agents/*.agent.md` 的 `model:` 字段对 Codex 端**既不降档也不升档**，不要误以为是双宿主一致的性能控制旋钮。
- 反过来，Codex 端要"降档省时间"必须改宿主级 config，不是 source 改动；属于用户/团队层面的 host-level config 决策，不进 spec-first 的 source-of-truth。

### Codex 端等价加速建议（host-level，不进本仓 source）

按"风险/代价 由低到高"排：

| 选项 | 操作位置 | 评估 |
|---|---|---|
| 降 `model_reasoning_effort` 从 `xhigh` 到 `high` 或 `medium` | `~/.codex/config.toml` 全局 | **最有效杠杆**——xhigh 是 Codex 单步慢的主因；降到 high 单步快很多，judgment 深度损失轻。建议优先尝试 |
| 换 `model = "gpt-5"`（非 5.5） | `~/.codex/config.toml` 全局 | 全局生效；GPT-5 系列有 mini/nano 完整三档（`gpt-5` / `gpt-5-mini` / `gpt-5-nano`），跨代降档省 token 与时间，但判断深度差异需测试 |
| 用 Codex `--profile` 在不同会话切不同 model | Codex 启动参数 | 仍是会话级，无法 per-agent 切换 |
| 等 Codex 后续支持 per-agent model | 外部依赖 | 当前 (2026-05-27) 不支持 |

> 注：OpenAI GPT-5.5 线**只有顶档**（`gpt-5.5`），没有官方的 `gpt-5.5-mini` / `gpt-5.5-nano` 变种。同代降档不存在；要降只能跨代到 GPT-5 系列。

### 双宿主对齐说明

| 维度 | Claude Code | Codex |
|---|---|---|
| `model:` 字段被消费 | ✅ 由 Claude runtime 读取并据此选择模型 | ❌ 不读取，仅作为 metadata 复制存在 |
| 降档机制 | per-agent，本文档建议生效 | 仅全局 (`config.toml`)，per-agent 不支持 |
| 调整方式 | 修改 `agents/*.agent.md` 的 `model:`（spec-first source 改动） | 修改 `~/.codex/config.toml`（host-level 个人配置） |
| 改动归属 | 进 spec-first 源、走 CHANGELOG (user-visible) | 不进 spec-first 源，不入 CHANGELOG |
| 双宿主对齐策略 | 按本文档分档 | 只能整体调档；个人按需调 reasoning effort 或换 model |

后续若 Codex runtime 引入 per-agent model 字段（例如 `agent_model:` 之类），本文档需要重新评估是否抽出一个 Codex-aware 的统一字段映射。当前不预先抽象，避免过度设计。

## 现状分布

| Model | 数量 | 备注 |
|---|---|---|
| `haiku` | 1 | 仅 `spec-coherence-reviewer` |
| `sonnet` | 7 | 已分档：`feasibility`、`maintainability`、`design-lens`、`security-lens`、`scope-guardian`、`web-researcher`、`slack-researcher` |
| `inherit` | 43 | 默认跟随主线，Opus 4.7 时全部升档，是 doc-review/code-review 体感慢的核心来源 |

## 分档原则

- **任务性质**：模式比对 / 事实抽取 / 规则审计 → Sonnet 够用；premise 质疑 / 反事实构造 / 跨域综合判断 → 吃 Opus 深度。
- **触发频率**：每次 review 都跑的高频 reviewer 优先降档，收益最大；低频专家保留 inherit 影响很小。
- **能力损失可接受度**：Sonnet 4.6 在结构化输出、规则比对、读多写少的研究类任务上几乎无损；只在长链反事实推理和战略判断上拉开差距。

---

## 档位 A — 建议降到 `sonnet`（共 29 个）

### A1 · code-review always-on（高频痛点，建议优先降）

每次 `spec-code-review` 都会触发，是降档收益最大的部分。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-correctness-reviewer` | inherit | sonnet | 心智执行式逻辑/行为正确性审查。追踪输入流经分支、跟踪跨调用状态。猎杀：off-by-one 与边界错（loop bounds、slice、pagination 末页）、null/undefined 传播（未守卫的可选字段、`NaN` 算术）、竞态与顺序假设（共享状态、async 完成顺序、TOCTOU）、状态机非法跃迁（成功路径设置但错误路径未清的 flag、半更新）、错误传播失败（catch 后吞掉/丢上下文/用空数组掩盖查询失败） |
| `spec-testing-reviewer` | inherit | sonnet | 评估"测试是否证明代码正确"而非"测试存在"。猎杀：diff 新增 `if/else/switch/try/catch` 分支无对应测试、断言断在实现细节而非行为、mock 过度耦合实现、变更后断言强度变弱、缺失负向用例与边界 |
| `spec-project-standards-reviewer` | inherit | sonnet | 对照本仓 CLAUDE.md / AGENTS.md / 目录级 standards 文件做审计。Orchestrator 传入 `<standards-paths>` 块；不发明新规则，只引用具体规则。覆盖 frontmatter 规则、reference 收录、命名约定、跨平台可移植性、工具选型政策 |

### A2 · code-review conditional（按 diff 域触发）

按 diff 域命中规则启用。Sonnet 做模式比对完全够用，且这些 reviewer 输出结构化 finding，对模型深度需求中等。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-security-reviewer` | inherit | sonnet | 攻击者视角找"唯一可利用路径"。猎杀：注入向量（未参数化 SQL / 未转义 HTML / 未消毒 shell / 模板原始 eval）、auth/authz 绕过（新端点缺鉴权、ownership 检查破损、特权升级、状态变更未防 CSRF）、代码或日志中的 secret、不安全反序列化（pickle / Marshal / unserialize / JSON eval）、SSRF 与路径穿越（未 allowlist 的 server-side URL、未 canonicalize 的用户控制路径） |
| `spec-performance-reviewer` | inherit | sonnet | "跑 10000 次"或"百万行表"视角看可量化、生产可观测的性能问题。猎杀：N+1（循环内 DB query，结合循环规模判定真假）、无界内存增长（全表加载、无淘汰的 cache、循环内字符串拼接）、缺分页（无 limit/cursor/streaming 的全量返回）、热路径分配（循环或每请求路径中可提升/记忆化的对象/正则/计算）、async 上下文内的阻塞 I/O |
| `spec-reliability-reviewer` | inherit | sonnet | "当依赖宕机时会怎样"。猎杀：I/O 边界缺错误处理、无 backoff/上限的重试导致 retry storm、外部调用缺 timeout（HTTP/DB/RPC）、错误吞掉（`catch(e){}`、`.catch(()=>{})`、log 但不传播、返回误导默认值）、级联失败路径（A 慢→B 重试→C 过载→队列堆积→健康检查失败→重启风暴） |
| `spec-api-contract-reviewer` | inherit | sonnet | 从"昨天的客户端打今天的服务器"视角评估变更。猎杀：public 接口的破坏性变更（重命名字段、删端点、改响应形状、收窄入参、改状态码）、缺版本化的 breaking change、跨端点不一致的错误形状（`{error:string}` 与 `{errors:[]}` 混用）、未声明的行为变化（`count` 语义、默认值、排序）、向后不兼容的类型变化 |
| `spec-data-migrations-reviewer` | inherit | sonnet | 部署窗口期视角：老代码跑新 schema、新代码跑老数据、部分失败。猎杀：ID/enum 映射颠倒（最危险的迁移 bug，逐条核对而非整体看）、不可逆迁移无 rollback、新非空列缺 backfill、部署窗口期破坏运行代码的 schema 变更、删除列/表后遗留的孤立引用（serializer / API / job / admin / eager load） |
| `spec-cli-readiness-reviewer` | inherit | sonnet | 自主 agent 调用 CLI 视角：何处 agent 会浪费 token、重试或人工介入。从 diff 检测 CLI 框架（Click / argparse / Cobra / clap / Commander / yargs / oclif / Thor），用框架习惯写 `suggested_fix`。严重度不达 P0；autofix 全为 `manual` 或 `advisory`/`owner:human` |
| `spec-previous-comments-reviewer` | inherit | sonnet | 评审周期的"机构记忆"。只在 PR 评审时生效（`<pr-context>` 块为空即返回空 findings）。抓取 PR 所有 review comments 与 threads，验证当前 diff 是否处理了上一轮 reviewer 提出的问题，防止 dropped thread |

### A3 · 语言专精 reviewer（语言/框架 diff 触发）

只在对应语言/框架 diff 命中时启用，频率不高。Sonnet 在语言级最佳实践与代码风格判断上完全足够。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-kieran-typescript-reviewer` | inherit | sonnet | Kieran 视角看 TypeScript：类型安全、可读性、可维护性。对既有模块"变难读"严格；对孤立新代码"显式且可测"宽松。关注 `any`/类型断言/过度泛型/类型与运行时一致性 |
| `spec-kieran-python-reviewer` | inherit | sonnet | Kieran 视角看 Python：显式优于隐式、可读性、现代 type hints。新模块要简洁可测，既有模块的复杂化谨慎 |
| `spec-kieran-rails-reviewer` | inherit | sonnet | Kieran 视角看 Rails：clarity、conventions、六个月后接手者视角。Concerns、service object、abstraction 引入需要 payoff |
| `spec-dhh-rails-reviewer` | inherit | sonnet | DHH 视角看 Rails：零容忍架构宇航。捕捉把 Rails app 拉离 omakase 路径但无具体收益的 diff（不必要 service object、premature 抽象、反框架的前端模式） |
| `spec-swift-ios-reviewer` | inherit | sonnet | SwiftUI/UIKit 高标准 review：状态管理、内存所有权、Swift concurrency（actor / Sendable）、Core Data 线程、隐私清单、SPM/storyboard/XIB、`.pbxproj` 语义级 build setting 变更、可访问性 |
| `spec-julik-frontend-races-reviewer` | inherit | sonnet | Julik 视角看前端时序、清理、UI 手感：陈旧 timer、重复 async、handler 在死 node 触发、Stimulus/Turbo 生命周期、靠想象拼凑的状态机 |

### A4 · 研究 / 分析（读多写少，事实抽取为主）

主要做检索、综合、报告输出，不做架构决策。Sonnet 在长文档抽取与跨源综合上无明显劣势。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-best-practices-researcher` | inherit | sonnet | 权威源寻找、分析、综合行业最佳实践，输出可执行 guidance。需要使用 2026 年时间窗 |
| `spec-framework-docs-researcher` | inherit | sonnet | 框架/库技术文档收集，多源汇总。版本特定约束、官方 API 实例、迁移路径 |
| `spec-learnings-researcher` | inherit | sonnet | `docs/solutions/` 学习库检索：bug 复盘、架构模式、设计模式、tooling 决策、约定、workflow 发现；只产 advisory 摘要，不替代当前源核对 |
| `spec-repo-research-analyst` | inherit | sonnet | 系统性研究仓库结构、文档、约定、实现模式。Onboarding 或理解项目惯例时用 |
| `spec-git-history-analyzer` | inherit | sonnet | git 历史考古：追溯代码演化、找贡献者、理解代码模式为何存在。非 git 探索用 Read/Grep/Glob，git 命令逐条 shell |
| `spec-issue-intelligence-analyst` | inherit | sonnet | GitHub issue 主题级情报：从噪声 issue tracker 抽出系统性弱点信号。输出 themes 而非 tickets（25 个同因 bug 是 1 个系统信号） |
| `spec-session-historian` | inherit | sonnet | 历史 Claude / Codex coding session 综合：接收 orchestrator 预抽取的骨架与错误文件，针对特定问题/主题做"已学/已试/已决"综合 |
| `spec-pattern-recognition-specialist` | inherit | sonnet | 跨语言识别设计模式（Factory / Singleton / Observer / Strategy 等）、反模式、重复代码、命名约定。判断实现是否符合最佳实践 |
| `spec-schema-drift-detector` | inherit | sonnet | 防止 PR 误带其他分支的 `schema.rb` 改动。对照 PR 包含的 migration 交叉验证 schema diff 是否相关 |

### A5 · 审计 / 合规（规则比对为主）

输入是源码或文档，输出是规则比对结果。模型复杂度不高。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-agent-native-reviewer` | inherit | sonnet | 确保 agent 与 user 拥有同等能力——任何 user 能做的事 agent 也能做。找出 user 可做而 agent 不可做的 gap，或 agent 缺上下文无法行动的地方。新 UI 功能、agent tool、system prompt 后用 |
| `spec-cli-agent-readiness-reviewer` | inherit | sonnet | 用 severity 评分（Blocker / Friction / Optimization）审 CLI **源码、计划或规范**，关注 CLI 是仅"可被 agent 使用"还是"真为 agent 优化" |
| `spec-code-simplicity-reviewer` | inherit | sonnet | YAGNI 与极简主义视角，实现完成后做最后一遍 review，识别简化机会。逐行质疑必要性，不直接服务当前需求即标记可删 |
| `spec-spec-flow-analyzer` | inherit | sonnet | 从端用户视角看 spec、plan、feature 描述：流程是否完整、需求是否模糊、边界用例是否缺失。Phase 1 强制先在 codebase 中扎根，避免给出泛泛反馈 |

### A6 · 设计 / 写作（合并入 A 档）

UI 视觉对比与文档写作。模型深度需求低，但跑得密集（design-iterator 多轮迭代），降到 sonnet 单次成本下降更明显。

| Agent | 当前 | 建议 | 详细职责 |
|---|---|---|---|
| `spec-design-iterator` | inherit | sonnet | 系统化、渐进式 UI 组件 refinement。一个 cycle = 视觉分析 + 竞品研究 + 增量改进；适合"改了 1-2 次没到位"或用户要求迭代 refine 时主动使用 |
| `spec-figma-design-sync` | inherit | sonnet | 通过 Figma MCP 取设计规格（颜色 / 字体 / 间距 / layout / shadow / border）与截图，系统化比对实现并精确调整代码以达到像素级对齐 |
| `spec-design-implementation-reviewer` | inherit | sonnet | 视觉级 review：实现 UI 对 Figma 设计的像素级保真度，跨浏览器兼容性。组件写完或改完后用 |
| `spec-ankane-readme-writer` | inherit | sonnet | Ankane 风格 Ruby gem README 写作。命令式语态（"Add" 而非 "Adds"）、标准 section 顺序、简洁 prose |

---

## 档位 B — 保留 `inherit`（共 9 个，吃判断深度）

这些 agent 的核心价值是长链反事实推理、跨域综合判断、或构造性反向论证——正是 Opus 相对 Sonnet 拉开差距的能力维度。降档会肉眼可见地降低 finding 质量。

| Agent | 当前 | 决策 | 详细职责与保留理由 |
|---|---|---|---|
| `spec-adversarial-reviewer` | inherit | **保留** | 混沌工程师视角，"读代码不是评估而是攻击"。构造具体场景让代码失败，思考"如果 X 发生，那 Y 也会发生，于是 Z 崩"的因果链。降档会失去构造性证伪能力 |
| `spec-adversarial-document-reviewer` | inherit | **保留** | doc-level 反事实：不评估"清晰/一致/可行"而问"对不对"——前提是否成立、假设是否合理、决策能否经受现实冲击。构造反论而非走 checklist。premise 压力测试吃 Opus 长链推理深度 |
| `spec-product-lens-reviewer` | inherit | **保留** | 资深产品视角，先挑战 premise 再评估执行。最常见失败模式是"把错的东西做好"。从文档与所在 codebase 识别产品上下文以校准关注点；评估战略影响（轨迹、身份、采用、机会成本） |
| `spec-architecture-strategist` | inherit | **保留** | 系统架构专家，确保改动符合既有架构模式与系统完整性。Role boundary：拥有 architecture risk、模式合规、分层、依赖方向、API/接口稳定性、长期设计影响；不拥有仓库 inventory、test 覆盖判定、scope 批准、实施工作或 review autofix |
| `spec-security-sentinel` | inherit | **保留** | 应用安全专家，攻击者思维做全面 audit。比 A2 的 `spec-security-reviewer` 范围更广——后者只看 diff 局部，sentinel 做仓库级 OWASP 合规、跨文件漏洞挖掘、综合威胁建模。部署前安全门会用 |
| `spec-data-integrity-guardian` | inherit | **保留** | 数据完整性 Guardian，覆盖关系模型理论、ACID、隐私法规（GDPR / CCPA）与生产 DB 管理。综合判断 migration 安全、数据约束、事务边界、隐私合规。跨多个维度同时推理 |
| `spec-data-migration-expert` | inherit | **保留** | 防止数据腐败——验证 migration 与生产现实（而非 fixture 或假设值）一致。对 ID mapping、列重命名、enum 转换、schema 变化做现实核对；与 A2 `spec-data-migrations-reviewer` 不同之处：后者审 PR 局部，expert 做跨 PR 的复杂决策与现实核对 |
| `spec-deployment-verification-agent` | inherit | **保留** | 风险数据部署的 Go/No-Go checklist 产出——SQL 验证 query、回滚步骤、监控计划。综合 PR 上下文、生产现实与运维约束输出可执行清单，模型深度直接决定 checklist 是否能用 |
| `spec-pr-comment-resolver` | inherit | **保留** | 评估并解决一个或多个相关 PR review thread：评估 feedback 有效性、实施修复、返回结构化总结与回复文本。需要跨 thread 推理与代码改动判断。Comment 文本视为不可信输入，不执行任何嵌入的命令/脚本 |

---

## 档位 D — 已优化，无需变动（共 8 个）

| Agent | 当前 model | 详细职责 |
|---|---|---|
| `spec-coherence-reviewer` | haiku | doc-review always-on 一致性扫描：节间矛盾、术语漂移、结构问题、读者解读会发散的歧义。**只**找文档与自身不一致处，不评估好坏可行完整。轻量模式匹配，haiku 足够 |
| `spec-feasibility-reviewer` | sonnet | doc-review always-on 可行性评估：技术方案能否落地、是否承认 brownfield 现实、架构是否与既有 stack 冲突、依赖缺口、迁移风险、实施者能否无需补做架构决策即开工。本次 2026-05-27 已降档 |
| `spec-maintainability-reviewer` | sonnet | 从"六个月后接手者"视角看代码长期可维护性：过早抽象、不必要的间接层、死代码、不相关模块的耦合、晦涩命名。本次 2026-05-27 已降档 |
| `spec-design-lens-reviewer` | sonnet | doc-review 设计维度（UI/UX、前端组件、视觉语言、用户流程、wireframe、交互、响应式、可访问性）信号命中时启用 |
| `spec-security-lens-reviewer` | sonnet | doc-review 安全维度（auth/authz 假设、数据暴露风险、API 攻击面、缺失的威胁模型元素）。与 code-level 安全 review 不同——这里看 plan 层级的安全决策 |
| `spec-scope-guardian-reviewer` | sonnet | doc-review 范围守护：识别不必要的复杂性、过早的框架、超出目标的 scope。多优先级 tier / >8 需求 / stretch goals / scope 边界与目标错位时启用 |
| `spec-web-researcher` | sonnet | 迭代式 web 研究，输出结构化外部 grounding（prior art、相邻方案、市场信号、跨域类比）。Ideate 出 codebase、验证 prior art、扫竞品模式、找跨域类比时用 |
| `spec-slack-researcher` | sonnet | 用户显式要求时在 Slack 搜组织上下文（决策、约束、未文档化的讨论）。始终回显 workspace identity 让用户确认搜的是正确 Slack 实例 |

---

## 预期收益与风险

**预期收益**

- code-review 高频路径（A1 + 主要 A2）单轮耗时显著下降，主线在 Opus 4.7 时尤其明显。
- doc-review 已完整覆盖（A 档 + 已降档 + 保留的 B 档 product-lens/adversarial-document）。
- 主线 Opus 4.7 的预算集中投放到真正需要长链推理的 9 个 B 档 agent，性价比更高。

**潜在风险**

- A 档若 Sonnet 在某些复杂 reviewer 上漏掉 P0/P1，需要个别回调到 inherit；不影响其他 agent。
- 模型升级（如 Sonnet 4.x → 5.x）后这份分档需要重新评估，建议每个大版本审一次。
- 当前会话内已缓存的 agent 仍可能用旧 model；改动后建议新开 session 验证。
- **本分档对 Codex 端不生效**（详见开头"宿主适用性边界"）。Claude 端降档后若团队同时使用 Codex 跑同样工作流，Codex 端仍跑全局 `gpt-5.5 + xhigh`，体感未变；需要单独通过 `~/.codex/config.toml` 调整 host-level 配置。不要因为 Codex 没变快就误以为本分档无效。

## 落地顺序建议

1. **第一步（小范围验证）**：先改 A1 + A2 共 10 个 code-review 高频 reviewer，跑一次 `spec-code-review` 验证体感与命中率。
2. **第二步（语言专精）**：A3 共 6 个。这些只在对应语言 diff 时触发，验证窗口窄但风险低。
3. **第三步（研究/审计/设计）**：A4 + A5 + A6 共 13 个，统一收尾。
4. **每步在 `CHANGELOG.md` 加 `perf(agents)` 条目（user-visible）**，列出本次降档的 agent 名单，便于回滚定位。

## 验证方式

- 改动后用 `git diff agents/` 检查只有 `model:` 字段变化。
- 必要时跑 `npm run test:unit`：本次改动仅 frontmatter 单字段，应该不影响测试。
- 真正的回归在跑实际 `spec-code-review` 和 `spec-doc-review` 时观察 reviewer 是否仍能捕获已知 finding —— 不要把"测试通过"等同于"reviewer 质量不降"。
