你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-promote/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **D03**（R2 fail）： `skills/spec-promote/scripts/check-spiral-auth.cjs:50-58` | readiness 判定存在冲突字段放行路径，显式 `authenticated: false` 仍可能被归类为 ready，见 F1。 |
- **B02**（R2 fail）： `skills/spec-promote/references/spiral-cli.md:13-16`；`skills/spec-promote/scripts/check-spiral-auth.cjs:50-58` | reference 承诺按认证合同提供 readiness，但脚本对相互矛盾的认证字段采用成功优先，见 F1。 |
- **B03**（R2 fail）： `skills/spec-promote/SKILL.md:78-83`；`skills/spec-promote/references/spiral-cli.md:73-75,144` | 外发授权与持久化披露明确，但生成命令没有像认证探针一样在工具输出进入可见轨迹前完成原始输出隔离，见 F2。 |
- **B05**（R2 fail）： `skills/spec-promote/SKILL.md:68,83`；`skills/spec-promote/references/spiral-cli.md:73-75,139-144` | 认证探针有时间边界，但 `spiral write` 对 hangs 只有 fallback 意图，没有有限等待和终止要求，见 F3。 |

## R1 完整评审
# spec-promote 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-promote/SKILL.md:55-59, 29, 66；references/spiral-cli.md:26, 135；skills/spec-runtime-setup/references/config-template.yaml:59-62 | 各补丁均可回溯真实失败依据：有界探针防 secret 泄漏、delivery 阶梯防假"live now"、注释行规则防模板误判 opt-out、cue-word 陷阱经实测标注（"verified live"），未见过时或互相矛盾约束 |
| D02 | pass | SKILL.md:89-108；spiral-cli.md:101-135 | 编码了真实编辑/社媒领域知识（AI tells 清单、逐渠道形态、逐字数的 X/LinkedIn/email 模板）与 provider 领域知识（channel 枚举、`text` 字段风险、措辞驱动模式）；脚本管确定性 readiness fact、LLM 管文案，职责分界恰当 |
| D03 | pass | SKILL.md:78, 83；spiral-cli.md:67；scripts/check-spiral-auth.cjs:43-59；tests/unit/spec-promote-auth-probe.test.js:38-78；tests/unit/ce-localization-round-1-remediation-contracts.test.js:122-136；evals/cases/check-unreleased-local-drafts.yaml:4 | 验证门明确且分层诚实：探针脚本输出 allowlist 字段并有 sentinel 正反测试、合同测试钉住 gate 措辞、opt-out 写入要求 readback 验证后才可声称成功、judge 自述“脚本通过不证明措辞真实”，未把语义判断冒充机械判定 |
| D04 | pass | SKILL.md:29-42；skills/using-spec-first/references/public-route-map.md:62；README.md:137 / README.zh-CN.md:137 / README.en.md:137；docs/user-guide/24-公开入口与Skill目录.md:85 | 消费上游交付证据（PR/diff/changelog/commits 有界读取 + 调用方 delivery state）而不重复访谈，仅在无从判断时问一个短问题；入口路由、三语 README、用户手册对职责与“不自动获发布权限”的表述一致 |
| D05 | pass | SKILL.md:76（"don't restate them from memory"）, 128-134；spiral-cli.md:5-16 | 135+145 行紧凑可定位；入口文件刻意不复述措辞规则而是指向 reference，双文件三态表重复但内容一致，示例命令与 reference 逐字吻合；唯一漂移是失效命名（见 F1） |
| D06 | pass | SKILL.md:14, 62-68；spiral-cli.md:139-144 | spiral-agnostic by default，provider 缺失/失败/超时一律诚实降级 Path B 且"never blocks the skill"；Windows 探针误报为独立缺陷另行入册（F2），不推翻降级承诺本身 |
| D07 | pass | git 049e5274（2026-11-01：Path 0 改为交付后可选、root 解析加固、delivery 阶梯、readback 验证 + 同 commit 新增 eval case）；tests/unit/ce-u28-outcome-calibration.test.js:15-73 | 可见“失败→修订→复验”链：问题驱动的行为收紧配有同批新增 eval 与带正反对照的 judge 校准测试，演化有证据支撑 |
| D08 | pass | SKILL.md:35-38（有界读取）, 55-60（探针替代裸读 provider 输出）, 76（防摘要截断）；spiral-cli.md 仅 Path 0/A 需加载 | reference 按需加载、Phase 1 只读必要原文（指定 json 字段、diff --stat、changelog 顶部、log -15）、显式警告不得凭记忆复述规则，摘要遗漏风险有针对性防护 |
| B01 | pass | SKILL.md:2-5（disable-model-invocation + argument-hint）；src/cli/contracts/dual-host-governance/skills-governance.json:431-437；public-route-map.md:62；docs/catalog/runtime-capabilities.md:98 | 用户显式入口（模型不可自调），governance 登记 standalone_skill/dual-host，路由图有正向条目且与 spec-explain/spec-strategy 等相邻入口无职责重叠 |
| B02 | pass | SKILL.md:27-42（输入）, 112-124（输出）；spiral-cli.md:85-99（输出 schema 标注"fields verified"）；ce-localization-round-1-remediation-contracts.test.js:126-135 | 入口/reference/script/consumer 四面一致：合同测试钉住的关键短语逐条在源码定位，输出契约含 reason_code 与 receipt 形态；`spec-first setup` 失效命名作 F1 另计 |
| B03 | pass | SKILL.md:16, 78, 123；spiral-cli.md:45-48（密钥不经 agent）, 59-63（写前 precondition）, 71（egress 授权） | draft-only + 零发布副作用；egress 传输需独立显式授权并带 missing 状态码；唯一持久写（opt-out）要求显式选择、untracked/symlink 检查、readback 确认与一行披露；授权负例有 eval（no-publish-side-effects） |
| B04 | pass | 源码 skills/spec-promote/**（全目录已读）；skills-governance.json:431-441；runtime-capabilities.md:98（8 宿主投射）；SKILL.md:55-60（SKILL_DIR 从已加载文件解析，不假设镜像路径） | 真相源清楚，宿主投射由 governance/目录登记可追溯，无任何手改镜像指令；worktree 为干净冻结快照，无 drift 可查属预期 |
| B05 | pass | check-spiral-auth.cjs:7, 26（3s 超时）；SKILL.md:83（逐渠道回退 + unknown 回执）；spiral-cli.md:47（pending/过期处理、禁 busy-loop）, 55（登录失败不记 opt-out、留一次干净复询）, 61（幂等追加）, 65（root 解析失败仍走 Path B） | 超时、部分成功、重试上限、重复执行、未知副作用各有明确处置且全部以“不阻塞交付”为底线；Windows 误分类见 F2 |
| B06 | pass | SKILL.md 四 Phase 完整含失败路径；ce-u28-outcome-calibration.test.js:57-63（改 released 必须被拒）, 66-68（trace 出现 spiral write 必须被拒）；scripts/evals/ce-u28-outcomes.cjs:27-40 与生成 judge check-unreleased-local-drafts.sh:204-217 断言一致 | 交付面完整，审查资产有正反对照校准，生成物与 builder 源同步；未虚报覆盖（case description 明示脚本判定的边界） |
| X01 | not-applicable | SKILL.md:8-16（单次草稿会话职责） | 适用性理由：单会话文案任务，无多模块分解、共享写面或长任务恢复面，渐进细化/依赖排序检查不适用 |
| X02 | pass | spiral-cli.md:45-49（CLI ≥1.8.0 与 legacy 分支、升级建议）, 85（输出字段标注经实测核实）, 139-144（输出漂移→unverified+回退） | 对外部 provider 的版本差异、接口漂移、迁移与回退路径有显式处理 |
| X03 | not-applicable | SKILL.md:16（"It never posts, publishes, commits, or opens PRs. Posting is a human action."）, 123 | 适用性理由：无高风险实现或部署面，发布动作被合同显式排除且由人类执行，风险/回滚检查无从挂载 |
| X04 | pass | spiral-cli.md:59-67（披露式持久偏好：precondition、readback、撤销指引）；SKILL.md:16, 124（单独披露、与草稿产出声明分离） | 其唯一跨会话状态（opt-out）满足披露、本地限定、可验证、可撤销要求；无 owner 交接义务面 |

## Findings

**F1（P3，D05/B02 命名漂移）** `skills/spec-promote/references/spiral-cli.md:26`、`:61`、`:63` 三处引用「`spec-first setup`」作为 config 模板与共享 `.gitignore` 条目的 canonical 属主，但仓库不存在 `spec-first setup` CLI 命令或入口；实际属主是 `spec-runtime-setup`（模板见 skills/spec-runtime-setup/references/config-template.yaml:59-62，gitignore 职责见其 SKILL.md:63）。后果：读者按名索骥找不到规则属主，跨文档维护时该保护规则的所有权会继续漂移。实质断言（模板带注释示例、canonical 属主会加共享 ignore）经核实均成立，仅名称失效。最小修复：三处「`spec-first setup`」改为「`spec-runtime-setup`（Runtime Setup）」。

**F2（P2，D06/B05 Windows 探针误报）** `skills/spec-promote/scripts/check-spiral-auth.cjs:22-28` 以 `spawnSync('spiral', …)` 且 `shell` 缺省调用；Windows 上 npm 全局安装产物为 `spiral.cmd`/`spiral.ps1`，Node 无 shell 的 spawn 不解析 PATHEXT，必然 ENOENT → 误报 `status: unavailable`（`spiral-cli-unavailable`）。后果：Windows 宿主上已安装且已认证的 Spiral 永远进不了 Path A（降级安全、草稿照常产出，但 "voice-matched" 增强静默失效），且 Path 0 会以「Install Spiral」话术向已安装用户推销安装——readiness fact 错误违背其自身“检测状态”的承诺。本项目 CLI 与同级 skill 脚本均有 win32 显式处理先例（src/cli/atomic-write.js 等、skills/spec-test-browser/scripts/agent-browser-run-context.cjs:126,245），本脚本是漏网处。最小修复：win32 下解析 PATHEXT 候选（或受控 `shell: true`），或在脚本与文档显式声明探针仅 POSIX、Windows 一律按 unavailable 处理。置信度：静态推理成立（Node/uv spawn 语义），未在 Windows 实测。

**F3（P3，测试覆盖缺口）** `skills/spec-promote/evals/eval.yaml:9-13` 的三个 case 覆盖 no-publish 授权负例、无从判断时提问、本地起草 + 未发布措辞，但 Path A 的 egress 授权负例（`status: ready` 且用户未授权 → 零 `spiral write` 调用 + `provider_egress_authorization_missing` 回执 + Path B）无任何 case。静态合同本身完整（SKILL.md:78、spiral-cli.md:71），缺口纯在行为资产。后果：该授权门只有 prose 约定 + 合同测试钉字面，无行为层判据。最小修复：S3 补充一个 script-judge 场景（断言 transcript 零 `spiral write` 且最终输出含 missing 回执语义）。

## 主责深挖面发现

- **D01**：全部补丁可回溯依据，无“模型已会还硬教”的过度指导。一处措辞张力保持现状成立：SKILL.md:16 称 opt-out 写入是“唯一持久本地偏好例外”，而 spiral-cli.md:63 的 `info/exclude` 追加严格说也是一次持久 git 状态写——它被包在同一 Path 0 披露信封内（一行确认也含 "kept out of git"），可辩护；残余仅是用户日后移除偏好时 exclude 规则无清理路径，残留规则无害且本就是 spec-runtime-setup 会补的机器本地保护，不建议改动。
- **D02**：Path B 的“lite 层”是真实领域知识而非流程口号，逐渠道模板具体到行数与语气；与 Spiral 路径的能力差有明确分工陈述（SKILL.md:87）。
- **D03**：机械/语义边界诚实——judge 自述局限、opt-out 写入声明 best-effort 且要求 readback；唯一注意点是 egress 门与 no-post 门均为 prose 约定（无 runtime 强制器），但 skill 未声称已硬强制，符合降级声明纪律。
- **D04**：与 using-spec-first（public-route-map.md:62）、三语 README（:137 均含“不自动获得外发或发布权限”）、user-guide（:85）四方一致，无衔接断裂迹象。
- **D05**：三态表在 SKILL.md 与 reference 各出现一次属刻意冗余（入口需独立路由能力），两处内容逐条比对一致；删除任一处都有明确损失（入口自包含 / 细节集中）。
- **D08**：按需加载结构清晰（spiral-cli.md 仅 Path 0/A 需要）；Phase 1 的四类证据读取均给出精确命令与字段清单，是“读必要原文”的正面样本。
- **跨维度观察**：最近一轮修订（049e5274）把“先交付草稿、后可选 setup、无回应不算选择”写死，配合 F3 指出的缺口看，剩余风险集中在 Path A 行为面而非静态合同面。

## 未读文件

- `docs/plans/2026-11-03-skill-optimization-initiative/core/` 其余原文（00-07、12 等）：检查表 §4 已是它们进入本轮的落点，必查问题已内嵌；未读后果：八维的行业趋势语境未核对，不影响静态合同裁决。
- `docs/validation/` 下十余份历史引用（如 ce-localization/baseline/spec-promote.json、各 parity 审计）：历史 advisory 记录；未读后果：历史归因未复核，本轮结论全部基于当前源码直接取证。
- `scripts/evals/build-outcome-judges.cjs` 生成器主体：已读其数据源 ce-u28-outcomes.cjs 的 spec-promote 段并逐行比对生成物一致；未读后果：公共生成逻辑（hash 计算细节）未走读，fixture 新鲜度由 ce-u28-outcome-calibration.test.js 运行时覆盖。
- `tests/unit/ce-localization-review-contracts.test.js`、`tests/unit/project-graph-consumption-contracts.test.js` 全文：仅读 spec-promote 相关断言段（清单外消费者）；未读后果：这两份测试对其余 skill 的断言未核对，不影响本对象。
- `.zread/wiki/`、`graphify-out/`、历史 plans 全文：生成/历史资产，与本对象静态合同无裁决关系。

## 结论一句话

spec-promote 静态合同层整体成立（18 项：16 pass、2 not-applicable），无阻断缺陷；两条入册问题（F2 Windows 探针误报 unavailable 为 P2，F1 `spec-first setup` 失效命名为 P3）与一个 Path A egress 负例的 eval 覆盖缺口（F3）建议交由后续批次以最小修复与补充场景处理。


## R2 完整评审
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


## 输出格式

每个维度一行：| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |。裁决词汇只用 pass / fail / not-applicable。最后一段「修复建议」：fail 成立的给最小可维护修复。语言：中文。先读源码再下结论。
