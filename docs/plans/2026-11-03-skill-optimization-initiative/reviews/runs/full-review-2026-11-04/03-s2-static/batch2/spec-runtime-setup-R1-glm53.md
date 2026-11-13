# spec-runtime-setup 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-runtime-setup/SKILL.md:141-145; scripts/lib/host-authority.cjs:41-117; setup-registry.json:1658 | 约束均可回溯到真实失败类别（错误宿主写入、双 artifact root、hook 逃逸），且与脚本强制门对应，未发现过时或互相矛盾的补丁 |
| D02 | pass | setup-registry.json:27-61; SKILL.md:23,40; SKILL.md:236; references/supported-mcp-tools.md:57-124 | 沉淀了具体领域知识（版本 pin+integrity、各宿主 config 目标、CodeGraph 1.6.0 watcher 限制、Graphify 0.9.x hook 限制），脚本/LLM 职责分工显式 |
| D03 | pass | scripts/lib/registry.cjs:157-164; scripts/lib/host-authority.cjs:108-117; scripts/lib/mode-policy.cjs:9-11; evals/README.md:8-13 | 必需验证明确且可执行（schema 校验、fail-closed、--check 只读 action 表、script-judge eval），并诚实区分工具强制与 prose 约定 |
| D04 | pass | SKILL.md:21,300-304; setup-registry.json:2111-2243; src/cli/helpers/setup-facts.js:5-7; src/cli/commands/doctor.js:833,1007; skills/using-spec-first/SKILL.md:34 | 输出契约经 artifact_contracts 结构化声明，实际消费者（CLI doctor/setup-facts、using-spec-first）源码可见，readiness handoff 有就绪门 |
| D05 | pass | SKILL.md:187-199,252-268（可定位矩阵与表）；SKILL.md:9 vs 141、116/120/153/189/277（复述，见 Findings F1/F2/F6） | 关键规则可经模式矩阵/flag 表/机器合同表定位，内部一致（mode-policy.cjs 与 prose 对账吻合），但存在成段复述与超长段落，审计成本偏高（非合同破裂） |
| D06 | pass | SKILL.md:110-116（请求分类）; host-authority.cjs:108-117（不依赖模型自觉）; evals/cases/bare-invocation-fail-closed-on-unverified-surface.yaml:8-10 | 能力假设（模型能分类请求姿态、按 mode 纪律执行）有显式降级路径：安全门由脚本 fail-closed 承担，eval 对沙箱不可测范围诚实披露 |
| D07 | pass | setup-registry.json:1658（DR-002 pin 重估条件）; scripts/setup.cjs:721-723（DR-015 单一实现抽取）; evals/cases/*（由失败沉淀） | 有问题→修订→复验链与失效/重估条件的实例（lane finding 编号入册），知识带 invalidation condition |
| D08 | pass | SKILL.md:65（按需加载 project-config.md）; scripts/setup.cjs:563（模板由脚本消费）; references/supported-mcp-tools.md 全文 | 入口只载 SKILL.md，细节 reference 按需加载、模板脚本自有，分层合理；但 supported-mcp-tools.md 未挂接入口读路径（F3，独有规则均脚本强制，影响有限） |
| B01 | pass | SKILL.md:3,15-16,110-116; evals/cases/semantic-question-not-setup.yaml | 正向触发面、相似入口负例（语义问题返航）、范围外请求处置齐备；check-health 仅作 shim 不另设用户入口（SKILL.md:52） |
| B02 | pass | SKILL.md:11-23 vs setup-registry.json:2111-2243 vs scripts/setup.cjs | 入口/registry/artifact/consumer 四面一致，advisory vs confirmed 反复区分；codegraph 双表面登记的口径问题记 P3（F4） |
| B03 | pass | SKILL.md:114,120-122,209; mode-policy.cjs:99-101; host-authority.cjs:41-50,108-117 | 授权纪律显式且脚本化：mutation 必须显式 host pin、repair 必须显式 flag、裸调用不自动追加、flag 自身不产生授权 |
| B04 | pass | SKILL.md:30-34; setup-registry.json:2; setup-registry.schema.json:3,22; host-authority.cjs:13-27（drift-guard 注释）; templates/claude/commands/spec/runtime-setup.md:10-12 | source（registry+schema v11）与 generated 投射边界清晰，loaded-root 绑定与宿主表面清单由测试强制，8 宿主枚举与 getSupportedPlatforms 口径吻合 |
| B05 | pass | SKILL.md:20,262-268; host-config.cjs:1284,1334,1389（backup/回滚）; workspace-graph-executor.cjs:56-57; consumers 清单:20（sigint 集成测试） | 失败模式、exit code 语义、预算/取消、lease/busy/quarantine、事务回滚与 post-write verify 均有落点 |
| B06 | pass | SKILL.md:285-304（分组输出+partial 可见）; references/supported-mcp-tools.md:117（「不能声明这一边界已完成」）; SKILL.md:375-386（最窄验证） | 交付报告结构强制区分 skipped/degraded/action-required，证据边界与未完成项如实披露，验证按最窄原则 |
| X01 | pass | SKILL.md:213-272; workspace-graph-executor.cjs:56-57,118-122 | 多仓场景渐进确认（diagnostic→pending_confirm→显式 build）、32 仓/15 分钟预算脚本强制、per-需求隔离与恢复路径明确 |
| X02 | pass | setup-registry.json:2; SKILL.md:203（v10 迁移提示）; SKILL.md:234（state v1/v2 不自动迁移） | schema 版本化+旧版不静默迁移+依赖 pin 带 integrity，版本影响与迁移有显式处置 |
| X03 | pass | setup-registry.json:954-965,2035-2053（risk_flags/review_required）; SKILL.md:155（高优先级冲突不可绕过）; host-config.cjs:1284-1449 | 高风险面（全局 npm 安装、host config 写入、hook 写入）有风险标注、审查闸、事务回滚与 fail-closed 清单 |
| X04 | pass | setup-registry.json:2143-2165（facts 消费者）; SKILL.md:54,282（freshness/unknown 语义）; host-authority.cjs:193（receipt freshness_expires_at） | 跨会话交接以带 TTL 的 facts/receipt 承载，freshness 与 limitation 字段化，doctor 消费链可溯源 |

## Findings

**F1（P2·D05）入口命名句近逐字重复**。`skills/spec-runtime-setup/SKILL.md:9` 与 `SKILL.md:141` 两处几乎相同地陈述「Claude/Qoder/OpenCode 的 command 名为 `runtime-setup`，投射为 `spec-runtime-setup.md`，公开调用为 `/spec-runtime-setup`」。后果：命令面变更时需双处同步，漏改一处即 prose 内部自相矛盾（当前一致）。最小修复：第 9 行删除复述、指向「Host Authority」节作为唯一定义；鉴于 templates 与测试已钉住事实，保持现状亦成立。

**F2（P2·D05）bare 调用语义 ≥5 处复述**。SKILL.md:116、120、153、177-178、189-190、277 反复陈述「单项目 bare=基线收敛、多仓父目录 bare 只读诊断」；「不得声称完整 setup ready / partial scope」在 106、153、154、197、199、211、282 共 7 处出现。后果：安全关键边界刻意冗余可接受，但各处措辞差异（「单项目裸调用」/「bare invocation」/「bare baseline」）抬高审计与翻译成本；本轮逐处对账未见矛盾。最小修复：以 187-199 模式矩阵为唯一定义，其余位置收敛为一句+锚点引用；或显式声明该冗余为防漂移设计并保持现状。

**F3（P2·D08）`references/supported-mcp-tools.md` 未挂接入口读路径**。SKILL.md 全文仅引用 `references/project-config.md`（SKILL.md:65），从未提及 supported-mcp-tools.md。该文件含独有操作性内容：npm warmup 完整性链（第 20-22 行）、workspace 32 仓/15 分钟预算（第 108 行）、doctor 证据边界（第 57-124 行）。后果有限：上述规则均由脚本强制（npm-warmup.cjs、workspace-graph-executor.cjs:56-57）且被 tests/unit/mcp-setup-contracts.test.js、active-consumers.json 钉住，模型运行时不必读它；但其「Runtime 入口」「Setup Rules」小节与 SKILL.md 大段重复，构成一个不受入口治理的双处漂移面。最小修复：在 SKILL.md 的 Required Harness Runtime 或 Verification 节显式挂接该 reference，或裁剪其中与 SKILL.md 重复的小节只留脚本事实文档。

**F4（P3·B02）codegraph 在 registry 双表面登记、口径未在 prose 解释**。tools[] 中 codegraph 为 `required:false` + `readiness_policy:"advisory"`（setup-registry.json:897,1139），providers[] 中为 `setup_required:true`（setup-registry.json:1764）；SKILL.md:32 的「完整 Runtime Setup 必备项包括……CodeGraph 与 Graphify」以 providers 口径成立。只查 tools[] 的读者会得出相反结论。最小修复：在「按需阻断」或「Source Of Truth」节补一句 tool/provider 两个表面的 required 语义差异。

**F5（P3·D01）operating prose 内嵌历史日期**。SKILL.md:153「2026-09-13 起单项目替代旧的只读诊断」属 changelog 信息，混入现行合同叙述。后果极低。最小修复：移至 CHANGELOG，正文只保留现行语义；保持现状成立。

**F6（P3·D05）超长混合语言单段**。SKILL.md:54（约 500 词单段，含多条 fail-closed 条件）、159、165-173、236（约 700 词）为密集中英混排段落，关键规则（如 receipt 绑定、JSONC precedence、hook blocked 语义）埋于段中，file:line 级定位与引用成本高。最小修复：拆为带小标题的条目列表或表格；不拆则建议至少对 236（workspace 异步刷新合同）加锚点。不构成合同失败。

## 主责深挖面发现

- **D01-D02（去补丁化/领域知识）**：约束与知识的「来源感」强——几乎每条硬规则都能在脚本里找到对应强制点（host-authority.cjs:41-117 ↔ SKILL.md:141；mode-policy.cjs:124-133 ↔ SKILL.md:156,199；workspace-graph-executor.cjs:56 ↔ supported-mcp-tools.md:108；graphify.cjs:150 ↔ SKILL.md:199 的 `graphify-refresh-artifact-missing`）。反向核对未发现「prose 承诺但脚本无落点」的空规则，也未发现脚本行为与 prose 相反之处（以抽查模块为准，见未读文件）。这是该 Skill 最强的一面。
- **D03（验证门）**：明确区分了脚本强制（schema 校验、fail-closed、--check action 表、eval script-judge）与 prose 约定（授权判断、flag 不产生授权），eval README（evals/README.md:8-13）对 script-judge 只覆盖机械边界的声明是全仓库少见的诚实样本。
- **D04（衔接）**：artifact_contracts（setup-registry.json:2111-2243）把 producer/consumer 写进 machine source of truth，CLI 侧 setup-facts.js/doctor.js 直接 require skill 脚本模块（src/cli/helpers/setup-facts.js:5-7），链路不是文案对文案。
- **D05+D08（紧凑性/上下文效率）**：主要成本在 F1/F2/F6 的冗余与密度，以及 F3 的 reference 挂接缺失；均属维护与审计成本，不是行为缺陷。若做收敛，优先级 F1（最易改）> F3 > F2 > F6。
- **失败核验（主责面内做过的负向对账）**：`--refresh` 无 `--only graphify` → blocked（mode-policy.cjs:124-133）；mutation 无 host pin → blocked（host-authority.cjs:108-117）；workspace-graph 与 --all-repos/--repo/--folder 组合 → blocked（mode-policy.cjs:76-81）；`--check` action 全只读（mode-policy.cjs:9-11）+ eval case 固定夹具字节校验。均与 SKILL.md 声明一致。

## 未读文件

- `scripts/lib/` 与 `scripts/providers/` 大部分模块逐行内容（graphify.cjs 2763 行、host-config.cjs 1486 行、workspace-async-refresh.cjs 1099 行、runtime-executor.cjs 967 行等，约 1.9 万行）：理由——本轮静态合同审查以 SKILL.md/registry/入口/mode/host-authority 为对账面，脚本内部实现由 47 个消费者测试钉住（存在性已核，抽样 grep 验证关键 reason_code/回滚/预算落点）；未覆盖后果——实现级缺陷（写入时序、边界 bug）不在本轮证据内。
- `evals/fixtures/scripts/*.sh`、`evals/examples.json`、fixtures/repos 细节：只读 README 与 case YAML；未覆盖后果——judge 脚本自身判定漏洞未验。
- 消费者清单中 47 个 tests/* 的用例体、`src/cli/adapters/{codex,cursor,kiro,opencode,qoder}.js`、`commands/clean.js`、`repair-worktree.js`、`tests/fixtures/mcp-setup/*`：理由——本轮以合同对账为主，仅核对 CLI 侧关键消费者（setup-facts.js、doctor.js）与投射模板；未覆盖后果——个别宿主 adapter 投射细节漂移不在本轮证据内。
- `setup-registry.schema.json` 正文（仅核 version 常量）、`docs/contracts/workflows/scenario-capability-matrix.md`（仅核存在）：未覆盖后果——schema 字段级约束完备性未逐条验。

## 结论一句话

spec-runtime-setup 静态合同层整体成立（18/18 pass）：约束可回源、脚本/prose 职责边界清晰、衔接与授权门有真实落点；遗留问题全部为 P2/P3 的冗余与文档挂接类收敛项（F1-F6），无阻断缺陷。
