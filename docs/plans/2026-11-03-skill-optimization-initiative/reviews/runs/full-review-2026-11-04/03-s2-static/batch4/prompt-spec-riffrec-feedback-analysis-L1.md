你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-riffrec-feedback-analysis/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B05**
  - R1 pass：| B05 | pass | analyze_riffrec_zip.py:193-208（promote 恢复）、545-673（chunk partial+intervals）、591（拒绝无时长分块）；snapshots.test.js:48-80；safety.test.js:31-68 | 工具缺失、超时、部分成功、重试上限（仅一次 chunk fallback）、重复执行（快照整体替换）、失败恢复（restore+staging 清理）均有代码与测试 |
  - R2 fail：| B05 | fail | `skills/spec-riffrec-feedback-analysis/references/analyzer.md:25`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:193`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1406` | `raw/`、`frames/` 有暂存和恢复，但最终报告缺少同等写入隔离；Python readiness 也可能错误放行，见 F1、F5。 |
- **X02**
  - R1 pass：| X02 | pass | analyze_riffrec_zip.py:80-83（model 可经 env 配置）；install-riffrec.md:9（riffrec README 为真相源）；三处 byte-parity 测试锁定跨包接口 | 对外 API/格式消费有配置点与真相源声明，跨 skill 接口（投影）由合同测试钉住 |
  - R2 fail：| X02 | fail | `skills/spec-riffrec-feedback-analysis/scripts/run-python.sh:10`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1343`；`tests/unit/python-runtime-resolution-contracts.test.js:31` | 涉及解释器接口兼容时，仅核对 Python 3 和候选顺序，没有声明或检查实际最低版本，见 F5。 |
- **X04**
  - R1 pass：| X04 | pass | extensive-analysis.md:34-46（ready handoff：summary+manifest+授权边界）；source-materials 生成 analyze_riffrec_zip.py:1121-1203；analyzer.md:25（快照替换防 stale）；requirements-kickoff 含 Questions/Limitations（analyze_riffrec_zip.py:1099-1115） | 跨 workflow 交接四要素（摘要、source refs、freshness、limitations）齐备，决策保留归 callee（brainstorm owns confirmation） |
  - R2 fail：| X04 | fail | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:229`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1121` | 跨 workflow 交接具备路径、候选状态和限制，但缺少分析批次身份及新鲜度核对规则，同路径重跑后旧引用无法区分，见 F4。 |

## R1 完整评审
# spec-riffrec-feedback-analysis 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | SKILL.md:15-18,45；analyzer.md:5,21；quick-bug-report.md:38-40；CHANGELOG.md:1900（handoff 路径漂移修复） | 每条约束对应可指认的真实失败（丢 events 同步、路径重建、扩权 rerun、PATH stub 假阳性），旧入口漂移已有修复复验链，未见过时或互斥约束 |
| D02 | pass | extensive-analysis.md:64-80,99-108；analyze_riffrec_zip.py:31-53（COMPLAINT_CUES/NOISY_NETWORK_PATTERNS）；analyzer.md:33 | 反馈分析领域知识成体系（review heuristics、source-mapping 四分类、开发噪音模式、over-capture 与 capture/prioritization 分离），且明确“自动线索不判定产品影响”划清脚本/LLM 职责 |
| D03 | pass | analyze_riffrec_zip.py:119-208（预算+原子快照）、1349-1351（exit 2）；spec-riffrec-snapshots.test.js:57-80；spec-riffrec-analyzer-safety.test.js:230-316 | 确定性不变量（zip 预算、symlink 拒绝、快照替换、egress receipt）由脚本强制并有正反例测试；prose 约定（dispatch/授权）未被伪装成机械判定 |
| D04 | pass | extensive-analysis.md:34,38-46；analyze_riffrec_zip.py:1450-1451；spec-brainstorm/SKILL.md（requirements-only unified plan under docs/plans/）；contracts.test.js:21-50 | 交接合同与 brainstorm 现行输出合同（`docs/plans/` requirements-only）语义一致且有测试锁定；残留缺口见 Finding 1（P3） |
| D05 | pass | SKILL.md 全文 48 行；quick-bug-report.md:9；analyzer.md:21 | 入口 48 行完成路由+共性规则，无重复大段；quick/extensive 升级规则在入口与 reference 两处表述一致不矛盾；关键规则均可 file:line 定位 |
| D06 | pass | run-python.sh:7-25；analyze_riffrec_zip.py:261-305（ffprobe 缺失降级）、492-493（curl 缺失）；python-runtime-resolution-contracts.test.js:39-73；evals/eval.yaml:8 | 宿主要求仅 bash+Python 3，解释器探测按执行验证；ffmpeg/curl/ffprobe 每项缺失均有诚实降级 reason，探测顺序有正反例测试 |
| D07 | pass | git log 7690cbba、595d404f（CE 15ab6f76 修订）；CHANGELOG.md:1900、358；install-riffrec.md:9 | 有真实“失败→修订→复验”链（handoff 路径漂移、brainstorm 证据清单传递、SF-22 投影锁定），外部真相源（riffrec README）显式标注可变 |
| D08 | pass | SKILL.md:12（只读所选 mode reference）；quick-bug-report.md:9（只读 analysis.md）；analyzer.md:29-33（coverage/limitations 必须保留）；analyze_riffrec_zip.py:1198-1201（raw 清单截断 50） | 三处按需加载、有界 moments（默认 12）+ 超 budget 事件保留在 analysis.md、摘要不得裁剪 coverage/limitations |
| B01 | pass | SKILL.md:3（正例+负例 description）、14-18（三路径+歧义问询）；public-route-map.md:59；evals/cases/generic-audio-not-triggered.yaml | 正向触发、相似入口负例（generic 转写不触发且有 eval case 锁定）、setup 不跑 analyzer，路由图登记齐全 |
| B02 | pass | SKILL.md:14-16,45,47 引用的 5 个 references 全部存在；analyzer.md:25-37 与 analyze_riffrec_zip.py 输出一致；extensive-analysis.md:30-32（推断标 suspected） | 入口-reference-script-输出三方一致，设计推断（conservative findings、suspected surfaces）均标为推断 |
| B03 | pass | SKILL.md:22-26（egress 授权）、28-41（dispatch 授权）；quick-bug-report.md:13（默认 inline 不写盘）；extensive-analysis.md:46（不越权写 docs/plans/）；analyzer.md:35（录制内容视为 untrusted）；analyze_riffrec_zip.py:477-481（无授权零外呼，safety.test.js:191-228 验证） | 外发、派发、写盘、commit 四类授权边界完整，材料内嵌指令不扩权，ambient 凭证不构成同意 |
| B04 | pass | analyze_riffrec_zip.py:9-11（canonical owner 声明）；contracts.test.js:10-19、skill-flow-p2-closure:96-105、specialized-skill-calibration:99-103 三处锁定 byte-identical；.gitignore:56-57；git ls-files 确认 `__pycache__` 未跟踪 | 真相源与 spec-sweep 投影边界有测试硬锁，本地产物未混入 source，无手改镜像迹象 |
| B05 | pass | analyze_riffrec_zip.py:193-208（promote 恢复）、545-673（chunk partial+intervals）、591（拒绝无时长分块）；snapshots.test.js:48-80；safety.test.js:31-68 | 工具缺失、超时、部分成功、重试上限（仅一次 chunk fallback）、重复执行（快照整体替换）、失败恢复（restore+staging 清理）均有代码与测试 |
| B06 | pass | analyzer.md:37（只列实际生成的 artifacts+coverage+limitations+downstream owner）、33（kickoff 无 confirmed requirement）、31（exit 0 不等于完整转写） | 诚实收尾清单齐备，“成功 exit/填充 scaffold 不证明已确认需求”防止声明超出证据 |
| X01 | pass | extensive-analysis.md:30（大 session 按 area 分解、授权内才并行）；analyze_riffrec_zip.py:552-673（420s chunk + covered/missing intervals） | 长任务有渐进分解与恢复语义，并行受 dispatch 授权约束，无另造编排 |
| X02 | pass | analyze_riffrec_zip.py:80-83（model 可经 env 配置）；install-riffrec.md:9（riffrec README 为真相源）；三处 byte-parity 测试锁定跨包接口 | 对外 API/格式消费有配置点与真相源声明，跨 skill 接口（投影）由合同测试钉住 |
| X03 | not-applicable | SKILL.md:8（分析型定位）；README.md:137（“不自动获得外发或发布权限”） | 无部署、发布、生产回滚面；隐私外发风险已由 B03 授权面管辖并通过，无剩余高风险交付检查可查 |
| X04 | pass | extensive-analysis.md:34-46（ready handoff：summary+manifest+授权边界）；source-materials 生成 analyze_riffrec_zip.py:1121-1203；analyzer.md:25（快照替换防 stale）；requirements-kickoff 含 Questions/Limitations（analyze_riffrec_zip.py:1099-1115） | 跨 workflow 交接四要素（摘要、source refs、freshness、limitations）齐备，决策保留归 callee（brainstorm owns confirmation） |

## Findings

1. **[P3] brainstorm 侧无 intake 合同对应 riffrec handoff 格式**（D04）
   - 位置：`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34,43` 声明 “load the `spec-brainstorm` skill with `requirements-kickoff.md` and `source-materials.md` as the evidence manifest”；`skills/spec-brainstorm/`（SKILL.md + 全部 references）grep `riffrec|requirements-kickoff|source-materials|kickoff` 为 0 匹配。
   - 后果：handoff 格式是生产者单方约定；brainstorm 演化时无对账面会静默漂移（现由 riffrec 侧 contracts.test.js:36-50 单侧锁定）。功能上 brainstorm 通用输入（“traceable repository or external evidence”）能接住，风险低。
   - 最小修复：在 brainstorm 侧 references 增加外部 kickoff intake 一句，或在 contracts test 中加 brainstorm 侧对账断言；保持现状也成立（语义合同 `docs/plans/` requirements-only 已双侧一致）。

2. **[P3] 非零退出码 prose 只覆盖 exit 2，缺 exit 1 语义**（D03/B05）
   - 位置：`analyze_riffrec_zip.py:1336-1337`（source 不存在返回 1）；`references/analyzer.md:25` 只写 “Invalid input returns exit 2; stop dependent analysis”。
   - 后果：执行模型见到 exit 1 时无文档锚点，可能当作可重试错误而非终止信号。
   - 最小修复：analyzer.md:25 补一句“任何非零退出均停止依赖分析”（exit 1=source 缺失，exit 2=无效输入，127=无 Python）。

3. **[P3·观察] quick 模式脚本仍生成 extensive 全套 artifacts**（D05/D08）
   - 位置：`analyze_riffrec_zip.py:1401-1410`（无 mode 参数，总是写 5 个 md + analysis.json）；`quick-bug-report.md:9,33` 以“只读 analysis.md + temp dir 由 OS 丢弃”消化。
   - 后果：轻微冗余写入，但均在临时目录且被声明为 ephemeral。
   - 保持现状成立：脚本单入口无分支是可维护性取舍，文档与行为无矛盾。

## 主责深挖面发现

- **D01/D02**：约束与知识的“真实失败”来源可追溯——`--no-transcribe` 默认与 “ambient OPENAI_API_KEY 不构成同意”（SKILL.md:26 ↔ analyze_riffrec_zip.py:477-481 ↔ safety.test.js:116-145 三层对齐）是隐私失败的正例；“Pass the directory rather than one media member”（analyzer.md:23）解决 events 同步丢失。未发现任何仅为约束而约束的补丁段；`$spec-first:spec-brainstorm` 旧入口残留已清（CHANGELOG.md:1900）。
- **D03**：验证门分层干净——机械判定归脚本（exit 2、预算、原子快照、receipt），语义判定归 LLM 且 prose 明示不得冒充（analyzer.md:33 “automated cues and event presence do not determine product impact”）。dispatch 边界是 prose 约定，但属全仓 18 包统一模式（dispatch-authorization-matrix-contracts.test.js:67-73 将本 skill 纳入矩阵），非本 skill 特有缺口。
- **D04**：交接输出与消费者实际合同核验一致——extensive 声明的 callee 职责（requirements-only unified plan under `docs/plans/`）与 spec-brainstorm/SKILL.md 现行合同逐字对上；残留缺口为 Finding 1 的单侧约定。
- **D05**：无删减即失义的冗余段；唯一双写是 egress 规则（SKILL.md:26 概要 ↔ analyzer.md:27-29 执行细节），粒度不同、内容一致。install-riffrec.md:14 “pick automatically” 与 SKILL.md:18 歧义问询 fallback 兼容（自动选择以明确信号为前提），不构成矛盾。
- **D08**：上下文经济设计成串——“Read only the selected mode reference”→quick 只读 1 个产物→moments 截 12→raw 清单截 50→超 budget 事件降级为 analysis.md 事实列表（analyze_riffrec_zip.py:952-959），读取面与产出面同步收窄，且 coverage/limitations 被强制保留防止“少读即丢要求”。

## 未读文件

- `skills/spec-riffrec-feedback-analysis/scripts/__pycache__/analyze_riffrec_zip.cpython-312.pyc` — 字节码缓存，git 未跟踪且被 `.gitignore:56-57` 覆盖，无审查价值；未覆盖后果：无。
- `skills/spec-sweep/scripts/analyze-sweep-media.py` 全文（仅核 line 15/75 的加载与传参方式）— 该文件属 spec-sweep 的审查范围；已确认其以 `Path(__file__).with_name` 加载 byte-identical 投影并自行决定 `--transcribe`，未覆盖后果：sweep 侧授权判断细节未核（属另一对象）。
- `skills/spec-brainstorm/references/` 各 phase 文件全文 — 已做全目录关键词核验（0 匹配）+ SKILL.md 全读；未覆盖后果：Finding 1 的“入口层无 intake 合同”判断不受影响（入口才是合同层，phase 层不承载对外 handoff 格式）。

## 结论一句话

18 项中 17 pass、1 not-applicable（X03 无高风险交付面）、0 fail：该 Skill 的授权/外发/派发边界三层对齐（prose↔脚本↔测试），衔接与演化链有真实修复复验记录，仅存 3 条 P3 级观察（brainstorm 侧单边 intake、exit 1 语义未文档化、quick 冗余产物），均不阻断、可保持现状或一句话修复。


## R2 完整评审
# spec-riffrec-feedback-analysis 评审（R2）

## 逐项裁决表

本轮限定为 `structure_contract` 静态审查，源码基线为 `5b59293b`。已完整读取入口、全部 5 份 references、两个源码脚本、全部文本 eval 资产，以及消费者清单列出的 8 个测试文件；另补读证据覆盖测试和下游 brainstorm 入口、交接合同。未运行分析器、测试或行为评测；以下 `pass` 不代表运行效果或成本已验证。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:12`；`skills/spec-riffrec-feedback-analysis/references/analyzer.md:29` | 分模式、授权、覆盖率和候选降权规则均对应明确风险，没有以固定状态图替代分析判断。 |
| D02 | pass | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:24`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:64`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1052` | 提供事实、推断、需求和源码映射的领域分类，脚本仅准备候选，产品含义和需求确认留给 reviewer/owner。 |
| D03 | fail | `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1347`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1406`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1438` | 确定性输出检查仅覆盖 `raw/`、`frames/`，没有阻断最终报告文件符号链接引发的越界覆盖，见 F1。 |
| D04 | fail | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:11`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1153`；`skills/spec-riffrec-feedback-analysis/SKILL.md:23` | 必须交给下游读取的 manifest 携带与入口隐私合同相反的提交指令，交接没有保真，见 F2。 |
| D05 | fail | `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:9`；`skills/spec-riffrec-feedback-analysis/references/analyzer.md:29` | quick 路径要求只读 `analysis.md`，共享合同却要求读取 `analysis.json` 和外发回执，存在直接冲突，见 F3。 |
| D06 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:30`；`skills/spec-riffrec-feedback-analysis/SKILL.md:41` | 不硬编码分析 worker 模型；隔离、模型覆盖及并发均依赖 live facts，未知时继承、串行或 inline，并禁止冒充独立覆盖。 |
| D07 | pass | `tests/unit/spec-riffrec-analyzer-safety.test.js:31`；`tests/unit/spec-riffrec-snapshots.test.js:48`；`tests/unit/spec-riffrec-feedback-analysis-contracts.test.js:65` | 静态维护依据包含快照恢复、陈旧证据清理、触发负例和授权边界回归；该 Skill 不承担自动知识晋升职责。 |
| D08 | fail | `skills/spec-riffrec-feedback-analysis/SKILL.md:12`；`skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:9`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:929` | 按需加载设计合理，但 quick 的减读范围排除了共享合同必需、且 Markdown 未完整承载的外发回执，见 F3。 |
| B01 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:3`；`skills/spec-riffrec-feedback-analysis/SKILL.md:14`；`skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:36` | Riffrec 正例、通用音视频负例、setup/quick/extensive 职责及用户拥有的升级边界均明确。 |
| B02 | fail | `skills/spec-riffrec-feedback-analysis/scripts/run-python.sh:10`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1343`；`skills/spec-riffrec-feedback-analysis/references/analyzer.md:5` | readiness 承诺仅检查 Python 主版本为 3，实际使用 Python 3.9 才有的路径 API，前置条件与实现不一致，见 F5。 |
| B03 | fail | `skills/spec-riffrec-feedback-analysis/SKILL.md:23`；`skills/spec-riffrec-feedback-analysis/SKILL.md:26`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1153`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1347` | 外发和委派授权正文较完整，但生成 manifest 放宽提交边界，最终报告写入也缺少链接隔离，见 F1、F2。 |
| B04 | pass | `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:9`；`tests/unit/skill-flow-p2-closure-contracts.test.js:96`；`src/cli/contracts/dual-host-governance/skills-governance.json:465` | canonical owner、Sweep 包内投射和八宿主 skill 投递声明可追溯；本轮字节比对确认两份 analyzer 一致，未修改 runtime 镜像。 |
| B05 | fail | `skills/spec-riffrec-feedback-analysis/references/analyzer.md:25`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:193`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1406` | `raw/`、`frames/` 有暂存和恢复，但最终报告缺少同等写入隔离；Python readiness 也可能错误放行，见 F1、F5。 |
| B06 | pass | `skills/spec-riffrec-feedback-analysis/references/analyzer.md:31`；`skills/spec-riffrec-feedback-analysis/references/analyzer.md:37`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34` | 明确区分产物生成、转写完整、视觉审查和需求确认，要求披露覆盖、限制与下游 owner，不把 scaffold 当成完成需求。 |
| X01 | pass | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:30`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:54`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:61` | 对长会话按产品区域拆映射、保留全部独立信号，并将后续计划拆分交给下游；本 Skill 不承担实现依赖编排。 |
| X02 | fail | `skills/spec-riffrec-feedback-analysis/scripts/run-python.sh:10`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1343`；`tests/unit/python-runtime-resolution-contracts.test.js:31` | 涉及解释器接口兼容时，仅核对 Python 3 和候选顺序，没有声明或检查实际最低版本，见 F5。 |
| X03 | not-applicable | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:46` | 本 Skill 只产出反馈证据及需求候选，不拥有高风险实现、部署、发布或回滚；数据外发和本地覆盖风险已在 B03/B05 审查。 |
| X04 | fail | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:229`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1121` | 跨 workflow 交接具备路径、候选状态和限制，但缺少分析批次身份及新鲜度核对规则，同路径重跑后旧引用无法区分，见 F4。 |

## Findings

### F1｜P1：最终报告写入未检查符号链接，可越过授权输出目录覆盖其他文件

- **位置：** `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1347`、`:1406`、`:1438`；具体写入点例如 `:980`。
- **静态事实：** 启动时只校验 `output_dir/raw` 和 `output_dir/frames`。之后对 `analysis.md` 等 5 个 Markdown 文件及 `analysis.json` 直接调用 `write_text()`，未检查这些目标是否为符号链接。
- **触发与后果：** 用户选择的既有输出目录内，若 `analysis.md` 是指向目录外文件的符号链接，分析器会跟随链接覆盖该文件；授权写入分析目录不等于授权覆盖链接指向的其他 surface。
- **最小修复建议：** 在任何输出变更前，预检全部固定报告目标，拒绝符号链接和非普通文件；最终写入使用暂存普通文件再替换目录项，避免跟随既有链接。该确定性检查应由脚本负责。
- **复验建议：** 为全部固定报告目标加入链接负例，确认返回明确错误且链接目标字节不变。现有 `tests/unit/spec-riffrec-snapshots.test.js:74` 只覆盖 `raw/`、`frames/` 内的链接，未覆盖该路径。

### F2｜P1：生成的 source manifest 重新放宽了隐私与提交边界

- **位置：** `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1153`。
- **静态事实：** manifest 生成以下指令：
  > `commit generated Markdown/JSON/manifests when useful for brainstorm/planning traceability.`
  
  但 `skills/spec-riffrec-feedback-analysis/SKILL.md:23` 明确要求所有 analyzer 输出默认仅为本地证据，只有单独审查、脱敏并获得明确目的地/提交授权的文本子集才可共享或提交。
- **触发与后果：** extensive 路径强制下游读取该 manifest（`references/extensive-analysis.md:11`）。其中同时包含原始绝对路径、会话 URL 和转写引用；“有助追溯即可提交”的指令可能诱导下游把未经脱敏的材料视为可提交内容。
- **最小修复建议：** 将生成文案统一为入口合同：Markdown、JSON、manifest 同样默认 local-only；提交仅限经过单独隐私审查的脱敏文本子集，并要求明确提交授权。同步维护 canonical analyzer 与 Sweep 投射。
- **复验建议：** 合同测试应检查生成 manifest 的实际文案，而不只检查入口存在隐私关键词。

### F3｜P2：quick 的读取指令排除了必需的外发回执

- **位置：** `skills/spec-riffrec-feedback-analysis/references/quick-bug-report.md:9`；`skills/spec-riffrec-feedback-analysis/references/analyzer.md:29`。
- **静态事实：** quick 明确要求只读 `analysis.md`；共享 analyzer 合同要求读 `analysis.json`，并保留 `transcript.attempts`、provider 身份和是否发起请求的回执。`analysis.md` 的转写部分仅输出状态、缺失区间和文本（`scripts/analyze_riffrec_zip.py:929`），没有完整回执。
- **触发与后果：** 尤其在授权转写后触发分块 fallback 时，quick 执行者无法同时满足两项指令；只遵循 quick 会遗漏“曾经发出请求但最终转写失败”等外发事实。
- **最小修复建议：** 改为“读取 `analysis.md`，并从 `analysis.json` 读取转写状态、覆盖及 egress receipt；跳过其余 extensive Markdown”。无需加载完整 extensive 路径。
- **复验建议：** 增加 quick 合同断言，确保其读取范围显式包含共享合同要求的回执。

### F4｜P2：交接只有可变路径，缺少分析批次身份和失效条件

- **位置：** `skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:229`、`:1121`、`:1412`；`skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:34`。
- **静态事实：** 默认输出按 source stem 固定定位，重跑替换快照并覆盖报告。manifest 和结构化结果没有明确的分析生成时间、批次身份或来源内容身份，也没有要求下游在使用旧 handoff 时核对新鲜度。会话的 `started_at` 是捕获时间，不是分析批次时间。
- **触发与后果：** 同名录制更新后重跑，或旧 handoff 跨会话恢复时，既有路径会指向新证据；旧问题描述和 moment ID 可能被错误地关联到新截图，仍表现为“链接可打开”。
- **最小修复建议：** 在现有 manifest/JSON 中记录分析时间及来源快照身份，并在 handoff 约定中声明“来源或该输出批次变化时需重新核对”。可使用轻量批次目录或来源摘要，不必新建全局状态机。
- **复验建议：** 用同 stem 的两份不同输入检查旧 handoff 能否识别失效，而不只是确认文件存在。

### F5｜P2：Python readiness 接受的版本范围大于脚本兼容范围

- **位置：** `skills/spec-riffrec-feedback-analysis/scripts/run-python.sh:10`、`:15`；`skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py:1343`。
- **静态事实：** wrapper 只检查 `sys.version_info.major == 3`；分析器无条件使用 `Path.is_relative_to()`，该 API 要求 Python 3.9 及以上。
- **触发与后果：** Python 3.8 会通过 readiness 探测，但在输出重叠检查处因缺少 API 报错，无法兑现“找到可运行解释器后执行”的前置条件。
- **最小修复建议：** 明确最低版本为 Python 3.9，并在所有候选探测中检查相同下限；保留现有候选顺序和缺失时退出 127 的行为。
- **复验建议：** 增加旧版候选被拒绝并继续选择满足版本下限解释器的测试。现有 `tests/unit/python-runtime-resolution-contracts.test.js:31` 仅约束候选顺序和执行式探测。

## 主责深挖面发现

### B01：入口与职责——保持现状成立

- `SKILL.md:3` 的正反例边界明确，不应因脚本能够处理一般音视频，就把公开 Skill 扩展为通用转写入口。
- setup 仅提供安装与捕获指导，不运行分析器：`references/install-riffrec.md:9`、`:27`。
- quick 发现更多问题只返回升级选项，不自动生成 durable extensive 产物：`references/quick-bug-report.md:38`。
- 未发现需要新增入口、强制接入完整研发主链路或自动调用 `spec-debug` 的理由。

### B02：输入输出——产物分层正确，但读取与 readiness 有两处断裂

- unpacked capture 应整体传入，保留同步 metadata/media：`references/analyzer.md:23`。
- quick 临时输出、extensive kickoff 与 brainstorm durable plan 的职责分离成立：`SKILL.md:47`、`references/extensive-analysis.md:34`。
- core/08 的拟议主链路 YAML 和数量门槛没有被该 Skill 采纳，不能据此要求它输出 `PRDSchema` 或补足固定数量的边界条件。
- 真正需要修正的是 F3 的最小必读证据冲突和 F5 的解释器兼容前置条件。

### B03：授权与信任——正文较强，生成产物不能反向削弱正文

- 转写外发与 worker dispatch 独立授权；环境凭据不等于同意，inline 不冒充独立分析：`SKILL.md:26`、`:41`。
- 录制、转写、屏幕和事件中的指令被明确视为不可信材料：`references/analyzer.md:35`。
- 不自动运行 brainstorm，也不把 analyzer 输出变为 `docs/plans/` 写权限：`references/extensive-analysis.md:38`、`:46`。
- **缺口集中在出口：** F1 是确定性文件写入边界，F2 是交接产物携带的越权暗示；不能仅因入口正文正确就判整个授权链通过。

### B04：source/runtime——保持现状成立

- analyzer 明确声明 canonical owner 与包内投射原因：`scripts/analyze_riffrec_zip.py:9`。
- 本轮执行 `cmp`，canonical analyzer 与 `skills/spec-sweep/scripts/analyze_riffrec_zip.py` 字节一致。
- consumer tests 同时约束 ownership 标记和副本一致性：`tests/unit/skill-flow-p2-closure-contracts.test.js:96`。
- 本轮未验证实际宿主 runtime 加载或漂移，也未据此判静态合同失败；后续修复应改 source 并同步包内投射，不手改 `.claude/` 等 generated mirror。

### X01—X04：扩展场景

- **X01：** 长会话完整捕获、区域拆分和串行 fallback 已有文本承诺。实现依赖顺序、共享产品写面和部署集成不属于该证据分析 Skill 的职责。
- **X02：** 不要求该 Skill 维护架构 ADR 或 provider 迁移框架；但自身依赖的 Python API 下限属于实际兼容合同，F5 成立。
- **X03：** 不承担高风险代码交付或生产操作，故整体不适用；隐私和文件覆盖风险并未因此豁免。
- **X04：** owner、source refs 和 limitations 已有，不能将它们等同于 freshness。F4 要补的是同路径证据变化后的可识别失效，不是增加一套中心化 handoff 协议。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：已尝试读取，工具返回未获读取权限；未绕过权限。后果是无法核对其中未在当前上下文展示的全局补充要求，不影响本轮已读被审源码的逐项静态取证。
- `skills/spec-riffrec-feedback-analysis/scripts/__pycache__/analyze_riffrec_zip.cpython-312.pyc`：未读生成的字节码缓存；当前 `.py` 已完整读取，缓存不作为源码真相源，也不用于声称实际 runtime 加载版本。
- **用户指定的必读材料无未读项。** 未运行测试、分析器和 eval；没有把测试文件存在、断言存在或旧记录当作本轮运行通过证据。

## 结论一句话

本轮静态审查已完成；该 Skill 的入口分工、语义判断和 source ownership 基本清晰，但最终报告写入隔离、manifest 隐私指令、quick 回执读取、交接新鲜度及 Python 版本前置条件存在可定位缺陷，当前静态合同不通过。


## 输出要求

对每个待仲裁维度输出一行：`| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |`，最后给修复建议（若有 fail）。只输出裁决表与建议。