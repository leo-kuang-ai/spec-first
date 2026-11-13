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
