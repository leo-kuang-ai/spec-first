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
