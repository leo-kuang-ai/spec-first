# spec-handoff 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-handoff/SKILL.md:23,70,84,98 ↔ evals/examples.json:20-38,74-99 | 每条约束都能映射到 eval 编码的真实失败模式（不可达源转搜索、auto-select、注入指令、伪造完成声明），无过时或互相矛盾约束 |
| D02 | pass | skills/spec-handoff/SKILL.md:46,62；references/artifact-contract.md:15,41；references/create.md:5 | 领域知识具体（machine-local vs durable、pointer-first+行定位、废弃路径保留、跨机限制），脚本管形状/LLM 管语义的分工两处显式 |
| D03 | pass | skills/spec-handoff/SKILL.md:47,99；scripts/handoff-artifact.cjs:96-106,190-211；evals/fixtures/scripts/check-create-artifact.sh:47-54 | 写侧不变量脚本强制（symlink/containment/wx 独占），create 完成门绑定 receipt 且 judge 强制汇报真实 SHA-256 与精确 resume 调用；claim 边界明确不冒充机械判定 |
| D04 | pass | skills/using-spec-first/references/public-route-map.md:54；src/cli/lang-policy.js:123；skills/spec-lfg/SKILL.md:81；skills/spec-lfg/references/next-work-handoff.md:64-67；skills/spec-work/references/input-triage.md:36-38 | 与入口路由、spec-lfg（候选归属、显式接受后才调用）、spec-work（`source-plan-non-active` 语义含不篡改旧 pins）双向核对全部一致 |
| D05 | pass | skills/spec-handoff/SKILL.md（99 行）；references/create.md（8 行）；references/resume.md（12 行） | 入口与 references 紧凑、关键规则可定位（"stop without acting" :66、"never auto-select" :84）；入口/参考间少量重复但语义一致 |
| D06 | pass | skills/spec-handoff/SKILL.md:60,84,98；references/resume.md:9 | 能力假设显式（node helper、available capability），降级路径诚实（headless 返回 blocked+shortlist、稀疏源降级 orientation 只报不造） |
| D07 | pass | scripts/handoff-artifact.cjs:266-268；tests/unit/spec-handoff-contracts.test.js:219；evals/eval.yaml:9-16 | 存在失败→修订→复验链证据（ENOENT 被兜底掩盖的既有修复注释与回归测试），eval 集、契约测试与真实消费者（spec-lfg、route-map、lang-policy）在位 |
| D08 | pass | references/artifact-contract.md:3；scripts/handoff-artifact.cjs:223-259；tests/unit/spec-handoff-contracts.test.js:187 | 按需加载（contract 仅 create 加载、create/resume 各读一个 reference），discovery 只读 metadata prefix 且测试证明不越界读 body，artifact 本体 pointer-first |
| B01 | pass | skills/spec-handoff/SKILL.md:3,24,92；public-route-map.md:54 | description 正负触发词完备（普通续作/摘要/workflow 内部返回不触发），route-map 负例一致，纯 opt-in 不强制任务串行经过 |
| B02 | pass | scripts/handoff-artifact.cjs:115-144,150-167 ↔ artifact-contract.md:21-41,47-68 ↔ SKILL.md:40-47,77-84 | 必填字段、frontmatter 顺序、discovery 字段（indexed/mtime_ms/score/searched_root/scanned_entries/scan_truncated）与 reason code 在入口/合同/脚本/测试四层对账一致 |
| B03 | pass | skills/spec-handoff/SKILL.md:15,60,67；references/resume.md:5；artifact-contract.md:85-90；handoff-artifact.cjs:96-106 | resume 只授权读选定源、内嵌指令/链接不产生授权、不重复索取既有授权均有明文，脚本侧 containment 独立强制 |
| B04 | pass | tests/unit/spec-handoff-contracts.test.js:245-275；src/cli/contracts/dual-host-governance/skills-governance.json:261-273；src/cli/gitignore-policy.js:24 | 真相源在 skills/，全受支持宿主投射完整五文件且 evals 不投射由测试固定；`.spec-first/workflows/` 由 init 的 gitignore managed block 覆盖，支撑 "normally ignored" 声明 |
| B05 | pass | skills/spec-handoff/SKILL.md:96-98 ↔ handoff-artifact.cjs:51-55,170-184,211,276,280 | 失败清单与 reason code 一一对应，never-overwrite 使重复执行安全，不可达源/稀疏源/headless 各有明确处置 |
| B06 | pass | skills/spec-handoff/SKILL.md:94-99；artifact-contract.md:83；evals/cases/*.yaml + fixtures/scripts/*.sh | 交付口径（orientation / artifact+receipt）与“存在≠完成”边界明确，eval+judge+契约测试构成可核查的审查工具链 |
| X01 | not-applicable | skills/spec-handoff/SKILL.md:19-24 | 单一 create/resume 双模式独立 skill，无多模块分解、复杂依赖或长任务编排面；其衔接路由职责已由 D04 裁决 |
| X02 | pass | references/artifact-contract.md:47-68 | artifact 合同版本化（spec-handoff/v1）、additive discovery 字段策略与畸形 frontmatter 容错（不拒绝为 continuity source）显式，消费端与 schema 演化解耦 |
| X03 | not-applicable | skills/spec-handoff/SKILL.md:15,36 | 无发布/部署/回滚面（hard exits 明确禁止 commit/push/publication）；其真实风险面（注入、隐私、redaction）已由 B03/B05 裁决覆盖 |
| X04 | pass | artifact-contract.md:21-41,83；create.md:3-5；SKILL.md:16,70；examples.json:27-38,74-86 | 交接 gate 四字段必填、决策/用户归因/废弃路径保留、freshness+limitations 即失效条件、消费者清单明确，并有跨会话对抗性 eval |

## Findings

1. **[P3] 用户选定 destination 分支缺等价完成校验**。位置：`skills/spec-handoff/SKILL.md:36`（step 5）对照 `SKILL.md:47`（step 7 的完成门仅定义 writer receipt 路径）与 `references/create.md:7`。后果：该分支无“重读产物并计算/报告 SHA-256”的等价要求，LLM 可能以 transcript 声明关闭创建，违背该 skill 自己的 "Transcript statements are not outcome evidence"（artifact-contract.md:83）。最小修复：在 step 5 或 create.md 补一句“完成后重读产物、报告路径与 SHA-256，作为等价 receipt”。
2. **[P3] 非原子写入可残留 partial artifact**。位置：`scripts/handoff-artifact.cjs:203`（writeFileSync 直写）。后果：写入中途崩溃/中断会留下半个文件；never-overwrite 语义下重试会新建文件而非修复，残片以 `indexed:false` 或畸形 metadata 进入 discovery，可能误导候选选择。最小修复：同目录临时名写入后原子 rename（保留 wx 占位语义），或在 Failure 边界文档标注残片处置。
3. **[P3] 中间目录权限未显式收紧**。位置：`scripts/handoff-artifact.cjs:177-183`（仅对 leaf 目录 chmod 0700）对照 `SKILL.md:46` 的 "private directories" 声称；tests/unit/spec-handoff-contracts.test.js:104-105 也只断言 leaf。后果：多用户主机上 `.spec-first`/`workflows`/`spec-handoff` 中间层可能按 umask 默认权限存在、可被列举目录名（内容仍由 0600 文件 + 0700 leaf 保护，不暴露正文）。最小修复：managedRoot 逐级 mkdir+chmod，或将 SKILL.md:46 文案收窄为 "private workspace directory"。（权限实测命令在沙箱需审批未运行，按源码可读事实登记。）
4. **[P3] 三个 eval case 的 description 为与语义不符的模板句**。位置：`evals/cases/ordinary-continuation-not-triggered.yaml:4-6`、`resume-explicit-source-stops-without-acting.yaml:3-5`、`resume-sparse-source-degraded-orientation.yaml:3-5`，均为 "Behavioral repair cases exercise the actual HTTP outcome."。后果：这三个 case 断言的是无副作用/降级定向，与 "HTTP outcome" 无关，误导维护者与后续 S3 轮次选样；不影响 judge 判分（hash 断言）。最小修复：按各 case 实际断言改写 description。
5. **[P3] discovery 逐字节读的运行成本观察（S3 层登记）**。位置：`scripts/handoff-artifact.cjs:234-235`（1 字节/次 readSync，最坏 16 KiB × 200 文件 ≈ 3.2M 次系统调用）。上界有静态保证（MAX_FRONTMATTER_BYTES/LINES/ENTRIES），不构成本轮 fail；最小修复：单次读入 16 KiB 后按行解析，停止语义不变。
6. **[P3] 缺失 target root 退化为通用 reason code**。位置：`scripts/handoff-artifact.cjs:170-171`（realpathSync 直接抛 ENOENT）经 `:352-362` 兜底为通用 `handoff-artifact-error`。后果：SKILL.md:96 承诺对 "Missing target root" 报告 helper reason code，但消费者难以程序化区分“路径拼错”与其他错误。最小修复：resolveTargetRoot 捕获 ENOENT 记专用 code（如 `target-root-missing`）。

## 主责深挖面发现

- **D01（去补丁化）**：抽样映射全部成立——SKILL.md:23“不可达显式源不得转关键词搜索” ← examples.json:20-24（continue-unreachable-source 的 must_not）；SKILL.md:84“Stop and ask / never auto-select”+ headless blocked ← examples.json:88-99；SKILL.md:70“不标记 consumed、不继承历史完成声明” ← examples.json:27-38,74-86。未发现仅因旧模型能力缺陷遗留的补丁性约束；交互分支与 headless 分支不互相矛盾。保持现状成立。
- **D02（领域知识）**：知识密度高且非流程空转——machine-local 与 durable project state 的区分（SKILL.md:62）、managed root 不放 OS 临时目录的选址理由（artifact-contract.md:15）、pointer-first + 行定位与“保留废弃方案防 fresh agent 重试”（create.md:5）。脚本/LLM 职责分工在 SKILL.md:46 与 artifact-contract.md:41 两处一致声明。无“最佳实践口号”替代来源的情况。
- **D03（验证门）**：三层门清晰且诚实——写侧确定性不变量（containment/symlink/wx 独占，script:34-49,190-211）；create 完成门绑定 receipt（SKILL.md:47）并由 judge 用真实 SHA-256 与精确 resume 调用强制（check-create-artifact.sh:47-54）；claim 边界（SKILL.md:99“artifact 存在只证明上下文被记录”）。resume 续作核验清单（SKILL.md:67）是 prose 约定，未被冒充为机械判定。唯一缺口即 Findings#1（user-destination 分支无等价完成门）。
- **D04（衔接）**：四条边双向核对一致——入口（public-route-map.md:54、lang-policy.js:123-134 把跨会话交接列为硬入口）；spec-lfg 边界（spec-lfg SKILL.md:81“terminal state + 显式接受前不调用” ↔ 本 skill SKILL.md:90；next-work-handoff.md:64-67 "LFG owns the recommendation" ↔ SKILL.md:91 "must not rediscover or reprioritize"）；`source-plan-non-active` 移交语义与 spec-work/references/input-triage.md:36-38 吻合（两侧都要求保留旧 plan 与旧 task-pack pins）。契约测试两侧（spec-lfg-contracts.test.js:247-262 与 spec-handoff-contracts.test.js:59-83）互相钉住同一措辞，防止单侧漂移。未发现衔接断裂证据。
- **D05（紧凑性/可审计性）**：入口 99 行 + 两个极短 reference，体量在同仓 skill 中偏小。一处可审计性成本：SKILL.md:67-68 两个超长 bullet 各打包 5+ 条规则（核验清单、并发保护、embedded-link 无授权、owner 续作、不重复索取、非 active 计划处置、只读分支只报告），定位可行但逐条核对费力；建议拆为子 bullet（纯排版，无语义变化）。P3 级改善，不阻断。
- **D08（上下文效率）**：按需加载设计好——artifact-contract.md:3 显式声明仅 create 加载；create/resume 各自只追加一个 reference；discovery 只读 metadata prefix 且有测试证明不越界读 body（spec-handoff-contracts.test.js:187 的 PRIVATE_BODY_SENTINEL 断言）；artifact 本体 pointer-first 直接降低 fresh-session 的上下文负载。唯一观察是 Findings#5 的逐字节读成本，属 S3 行为层。

## 未读文件

- `evals/fixtures/repos/{mini-ledger,mini-ledger-with-prior-handoff,u28-outcomes}/{README.md,package.json,src/*}` 及各 `prepare-eval.cjs`（仅读 mini-ledger 版头部）：纯 eval 数据面，判分由 judge 内嵌 SHA-256 manifest 锚定；未覆盖后果：无法独立复算 fixture 字节与 manifest 一致性（低风险，测试套件已锚定同一批 hash）。
- `evals/fixtures/scripts/check-degraded-orientation.sh`、`check-continues-inline.sh`、`check-review-continuation.sh`、`check-research-continuation.sh` 的中段：与已整读的 check-resume-no-side-effects.sh 共享同一 generated harness（文件头声明同源生成器），manifest 与尾部断言均已读；后果：极低。
- `scripts/evals/build-outcome-judges.cjs`（judge 生成器）：产出物已直接读；后果：无法核对生成器与产物的同步性（低）。
- tests/unit 其余引用文件（plugin-modules、project-graph-consumption-contracts、ce-* 系列）：仅 grep 抽样断言方向，未整读；后果：低，抽样断言均与本案边界方向一致。

## 结论一句话

spec-handoff 静态合同层 18 项裁决无 fail（16 pass + 2 项有理由 not-applicable）：入口、references、脚本、artifact 合同、契约测试与 spec-lfg / using-spec-first 双向边界内部一致，仅余 6 条 P3 级局部观察（以 Findings#1 的 user-destination 完成门缺口最值得修），无阻断项。
