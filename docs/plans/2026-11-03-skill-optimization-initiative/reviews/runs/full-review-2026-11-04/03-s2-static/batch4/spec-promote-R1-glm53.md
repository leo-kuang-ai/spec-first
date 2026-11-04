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
