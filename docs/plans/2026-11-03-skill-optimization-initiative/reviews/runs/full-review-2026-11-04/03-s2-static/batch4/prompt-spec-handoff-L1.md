你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-handoff/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B06**
  - R1 pass：| B06 | pass | skills/spec-handoff/SKILL.md:94-99；artifact-contract.md:83；evals/cases/*.yaml + fixtures/scripts/*.sh | 交付口径（orientation / artifact+receipt）与“存在≠完成”边界明确，eval+judge+契约测试构成可核查的审查工具链 |
  - R2 fail：| B06 | fail | `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml:1–10`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:52–69`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:89–100` | 稀疏来源案例承诺验证不确定性保留，但 judge 仅检查成功退出、非空回答和无副作用，无法拒绝编造的确定性恢复摘要，见 F3。 |

## R1 完整评审
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


## R2 完整评审
# spec-handoff 评审（R2）

## 逐项裁决表

本轮基线为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，裁决仅覆盖静态合同与源码一致性；未运行测试或行为评测，不据此扣减静态裁决，也不外推行为质量、运行成本或收益。共 **12 项 pass、6 项 fail**，对应下方 3 个独立问题。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-handoff/SKILL.md:19–24`、`skills/spec-handoff/SKILL.md:94–99` | 路由、禁止自动行动和完成声明限制均服务具体误触发、越权或失真风险，没有要求所有任务经过交接。 |
| D02 | pass | `skills/spec-handoff/SKILL.md:46`、`skills/spec-handoff/references/artifact-contract.md:41` | 路径安全、序列化和 receipt 交给脚本，相关性、真实性、脱敏与语义充分性交给 LLM，职责划分明确。 |
| D03 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7` | 自选目的地分支允许不用默认 writer，却仍受到未定义替代实现的 `status: written` receipt 完成门约束，见 F1。 |
| D04 | pass | `skills/spec-handoff/SKILL.md:88–92`、`skills/spec-lfg/references/next-work-handoff.md:62–90` | LFG 负责候选选择与 brief，交接只负责物化；双方对显式接受、独立未来工作和已完成计划边界一致。 |
| D05 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7` | 关键规则可以定位，但自选目的地的格式自由与统一 receipt 要求没有闭合，属于局部分支矛盾而非篇幅问题，见 F1。 |
| D06 | pass | `skills/spec-handoff/SKILL.md:60–68`、`skills/spec-handoff/SKILL.md:84`、`skills/spec-handoff/references/artifact-contract.md:13–15` | 明确使用可用能力、无专用调用工具时读取 owner source、无交互通道时阻断自动选择，并披露平台权限限制。 |
| D07 | pass | `skills/spec-handoff/evals/examples.json:13–45`、`tests/unit/spec-handoff-contracts.test.js:40–82` | 无自动知识演化职责；维护资产已覆盖内嵌授权、陈旧完成声明、dirty tree 与非活跃计划等具体反例，不把案例存在当成复验通过。 |
| D08 | fail | `skills/spec-handoff/SKILL.md:84`、`skills/spec-handoff/scripts/handoff-artifact.cjs:234–256` | 声称遇首个非 frontmatter 行停止，但实现先读到结束符、上限或 EOF 才解析非法行，可能读取未选正文，见 F2。 |
| B01 | pass | `skills/spec-handoff/SKILL.md:3`、`skills/spec-handoff/SKILL.md:19–24`、`skills/spec-handoff/SKILL.md:88–92` | 正向触发、当前会话继续、workflow 内部返回及 LFG 可选调用的职责边界均明确。 |
| B02 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7`、`skills/spec-handoff/scripts/handoff-artifact.cjs:190–220` | 默认 payload、writer 与 receipt 相符，但自选目的地没有等价 receipt 的生产者或验证约定，见 F1。 |
| B03 | fail | `skills/spec-handoff/references/resume.md:3–7`、`skills/spec-handoff/scripts/handoff-artifact.cjs:234–256` | 总体授权合同清楚，但 discovery 实现未完整遵守“仅 metadata、用户选定前不读正文”的受限读取承诺，见 F2。 |
| B04 | pass | `skills/spec-handoff/SKILL.md:46–48`、`tests/unit/spec-handoff-contracts.test.js:245–270`、`src/cli/adapters/index.js:11–19` | 包内脚本解析方式及全支持宿主投射断言可定位，测试明确投射完整执行包且排除 evals；本结论不代表实际宿主加载已验证。 |
| B05 | pass | `skills/spec-handoff/SKILL.md:67–70`、`skills/spec-handoff/SKILL.md:84–99`、`skills/spec-handoff/scripts/handoff-artifact.cjs:198–211` | 对冲突、源不可达、候选截断、无交互选择及重复创建有明确处置；独占创建与有界碰撞重试不覆盖既有文件。 |
| B06 | fail | `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml:1–10`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:52–69`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:89–100` | 稀疏来源案例承诺验证不确定性保留，但 judge 仅检查成功退出、非空回答和无副作用，无法拒绝编造的确定性恢复摘要，见 F3。 |
| X01 | pass | `skills/spec-handoff/references/create.md:3–5`、`skills/spec-handoff/SKILL.md:67–70` | 长任务交接保留部分完成、缺失项及依赖，恢复时保护并发修改并核验剩余范围；不越权承担任务编排职责。 |
| X02 | pass | `skills/spec-handoff/references/artifact-contract.md:49–68`、`skills/spec-handoff/SKILL.md:60–68` | 对自身版本明确标识、允许非标准旧来源只读恢复，并对过期计划及旧 pins 规定重新交回 owner，而非静默迁移。 |
| X03 | pass | `skills/spec-handoff/SKILL.md:15–16`、`skills/spec-handoff/SKILL.md:67–68`、`skills/spec-handoff/references/artifact-contract.md:83–90` | 高风险任务只传递证据与约束，不继承发布或部署权限；当前核验与新增外部副作用授权仍由实际 owner 承担。 |
| X04 | pass | `skills/spec-handoff/references/create.md:3–5`、`skills/spec-handoff/references/resume.md:3–11`、`skills/spec-handoff/references/artifact-contract.md:41–66` | 核心跨会话合同包含摘要、source refs、freshness、limitations、决策归属和 owner 连续性，并禁止历史声明升级为当前授权。 |

## Findings

### F1 · P2：自选目的地分支缺少闭合的完成 receipt 合同

- **位置：** `skills/spec-handoff/SKILL.md:36–47`；`skills/spec-handoff/references/create.md:7`。
- **事实：** 用户指定本地目的地时，要求只在该处创建；否则才调用默认 writer。随后统一要求 receipt 返回 `status: written`，并汇报 SHA-256。reference 又允许用户自选格式、使用适当可用能力，但没有定义该能力如何产生等价 receipt。现有 writer 的输出合同位于 `skills/spec-handoff/scripts/handoff-artifact.cjs:190–220`，仅覆盖默认受管位置。
- **后果：** 自选目的地可能已经成功写入，却无法按明文合同完成收尾；执行者只能自行补造适配约定、停在未完成状态，或错误地再写默认副本。这里是**静态分支合同不完整**，不是已观察到上述行为。
- **最小修复建议：** 将完成门区分为默认 writer receipt 和自选目的地的等价验证：后者明确要求最终路径、独占创建或不覆盖确认、文件存在及内容 SHA-256；若目的地能力不能提供等价验证，明确降级或阻断，不创建额外默认副本。
- **复验重点：** 自选新路径、目的地已存在、非默认格式三种情况，均不覆盖旧文件、不额外创建副本，且收尾证据可追溯。

### F2 · P2：metadata-only discovery 未在非法 frontmatter 行处停止读取

- **位置：** `skills/spec-handoff/scripts/handoff-artifact.cjs:234–256`。
- **对应承诺：** `skills/spec-handoff/SKILL.md:84`；`skills/spec-handoff/references/resume.md:7`。
- **事实：** 读取循环只检查首行、结束分隔符和行数/字节上限；各行是否为合法 metadata，要到循环结束后才判断。对于以 `---` 开头、缺少结束分隔符、随后进入 Markdown 正文的文件，循环会继续读取正文，最后返回未索引候选。
- **后果：** 用户尚未选择候选时，helper 就可能读取超出 metadata 授权边界的正文。**当前实现没有将这些正文返回给模型**，因此不能据此声称发生了正文外发或提示注入；成立的问题是受限读取保证与实现不符。
- **最小修复建议：** 每读完一行立即验证其是否符合本 helper 支持的 flat JSON-compatible metadata 格式；遇首个非法行即停止，不继续读取后续正文，保留 `indexed: false`。
- **复验重点：** 在 `tests/unit/spec-handoff-contracts.test.js:155–195` 的读取轨迹检查中增加“缺失结束分隔符＋非法正文行＋后续敏感哨兵”，断言不读取哨兵。

### F3 · P2：稀疏来源降级案例缺少语义判据，错误恢复摘要也可通过

- **位置：** `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml:1–10`；`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:52–69`、`:89–100`。
- **事实：** 案例目标是稀疏来源恢复时保留不确定性；fixture 明示进度不明、focus 为空、source refs 为空，见 `skills/spec-handoff/evals/fixtures/repos/mini-ledger-with-prior-handoff/docs/notes/vague-progress.md:5–16`。但 judge 只要求引擎成功、最终回答非空、受保护文件和 Git 状态不变，以及未创建交接或部署标记。
- **后果：** 即使回答错误声称“分页已完成且验证通过”，只要没有副作用，该案例仍可通过。它能验证隔离的一部分，不能验证标题承诺的降级恢复质量。
- **最小修复建议：** 保留现有状态断言，增加对最终 orientation 的语义判定：必须揭示来源稀疏、不能从该来源确认完成状态，并区分当前源码核验与历史声称；不能仅以出现某个“不确定”关键词作为充分条件。
- **复验重点：** 使用一份诚实降级回答和一份无副作用但编造完成状态的回答验证 judge 的区分能力。本轮未执行该复验。

## 主责深挖面发现

### B01—B04

- **B01：保持现状成立。** 这是公开的跨会话连续性入口，不是 workflow 内部通用交接器。`skills/spec-handoff/SKILL.md:24`、`:90–92` 与 LFG 的显式接受要求一致，避免把普通继续工作误转成新 artifact。
- **B02：默认路径闭合，自选目的地存在 F1。** 默认 JSON payload → writer → Markdown → receipt 的字段链可以回源；不应把自选格式路径强制改成默认 YAML，补齐等价验证即可。
- **B03：授权模型应保留，修正 F2 的读取实现。** `skills/spec-handoff/SKILL.md:60–70` 清楚区分只读恢复与当前用户授权继续；`references/resume.md:5` 也避免重复审批。发现候选时的正文读取缺口，不应被扩大解释为整个执行授权合同失效。
- **B04：保持 source-first 和包级投射边界。** 所有裁决依据当前 worktree 源码，没有编辑 generated runtime。跨宿主测试按 `getSupportedPlatforms()` 遍历，而非复制固定名单；但测试源码中的断言不等于本轮已验证实际投射成功。

### X01—X04

- **X01：不需要新增编排层。** `references/create.md:5` 已要求记录部分状态、依赖和放弃方案；恢复阶段核对 HEAD、dirty/index 与剩余工作即可，分解和集成仍归原 owner。
- **X02：宽容读取旧来源的设计成立。** `SKILL.md:60` 不要求恢复来源必须满足 `spec-handoff/v1`，能避免把历史文档格式差异误当成恢复失败；非活跃计划仍受 `source-plan-non-active` 边界约束。
- **X03：高风险权限不随交接迁移。** 创建不授权 commit、push、发布或环境保全；恢复也不继承正文中的“已批准”声明，见 `SKILL.md:15–16`、`references/artifact-contract.md:85–90`。无须在此 Skill 重建部署、发布或回滚流程。
- **X04：四项交接信息与归属保留充分。** `references/artifact-contract.md:41–66` 保证默认产物携带必要结构；`references/create.md:3` 区分用户决定、事实和作者推断。路径、格式与写入由工具保证，真实性、脱敏和语义充分性仍是 LLM 义务，不能声称已由脚本硬强制；F3 应补强这部分行为验证能力。

## 未读文件

- **指定必读材料无漏读。** 已完整读取目标 `SKILL.md`、全部 3 份 references、writer、`evals/` 下全部文件、检查表、合同基线，以及消费者清单列出的唯一文件 `tests/unit/spec-handoff-contracts.test.js`；另外核对了 LFG 交接 reference、入口路由及 adapter 注册源。
- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，未绕过或重试。后果是无法核对该私有文件中的额外全局偏好；不影响上述目标源码位置的事实核对。
- `src/cli/plugin-sync.js`：不在指定消费者清单内，本轮未展开通用投射实现。后果是 B04 仅裁静态包投射承诺及测试覆盖意图，不宣称完成各宿主投射实现审计或实际加载验证。

本轮只执行文件读取、路径定位、Git HEAD 与工作区状态检查；未修改文件、未运行 fixture 准备脚本、未运行测试或行为评测，工作区检查保持干净。

## 结论一句话

`spec-handoff` 的入口、owner 连续性及跨会话授权设计总体成立，但自选目的地 receipt、metadata-only 读取边界和稀疏恢复评测判据存在 3 项静态缺口，本轮不能判为静态全项通过。


## 输出要求

对每个待仲裁维度输出一行：`| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |`，最后给修复建议（若有 fail）。只输出裁决表与建议。