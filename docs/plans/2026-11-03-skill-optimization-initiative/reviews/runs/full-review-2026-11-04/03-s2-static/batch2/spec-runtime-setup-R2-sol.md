# spec-runtime-setup 评审（R2）

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-runtime-setup/SKILL.md:110-124, 139-156` | setup 的职责、mode、副作用和授权边界均有定位；未见需用流程补丁替代模型判断的明确证据。 |
| D02 | pass | `skills/spec-runtime-setup/SKILL.md:23, 36-40, 137` | 对 readiness facts 与语义判断分工明确，并声明只记录确定性存在事实、不裁决语义。 |
| D03 | pass | `skills/spec-runtime-setup/SKILL.md:143-156, 175-181` | 入口显式约束 host authority、路径安全、预览与验证范围，并规定不得超范围报告 ready。 |
| D04 | pass | `skills/spec-runtime-setup/SKILL.md:18-23, 285-304` | 输出 artifact、下游消费者和 handoff 条件有说明，且明确 setup facts 不是语义证据。 |
| D05 | fail | `skills/spec-runtime-setup/SKILL.md:67-92, 108-123, 147-211` | 面向操作者的 mode 规则、授权流程和 readiness scope 在多处重复铺陈，个别表述有不一致，增加选错 mode 的维护和理解成本。 |
| D06 | pass | `skills/spec-runtime-setup/SKILL.md:9, 42-52, 139-143` | 明确使用 loaded skill root 与 host-specific entry surface；按 Skill 自身能力假设，缺少 authority 时 fail closed。 |
| D07 | pass | `skills/spec-runtime-setup/SKILL.md:54, 165-173, 300-304` | readiness 事实与语义证据分离，未知/降级不被提升为成功；有可定位的维护 eval 与限制说明。 |
| D08 | fail | `skills/spec-runtime-setup/SKILL.md:9, 23, 54, 67-304` | 核心入口承载大量 workspace graph 生命周期、host 差异和边界细节；多数操作规则并非每次 setup 都需加载。 |
| B01 | pass | `skills/spec-runtime-setup/SKILL.md:15-16, 110-123` | 正向触发、普通开发/语义问题的负例及返回其他 owner 的职责均有说明。 |
| B02 | fail | `skills/spec-runtime-setup/SKILL.md:32, 54, 189-199` | 同一输入 `--verify-only` 的默认 scope 说法冲突：一处称普通 verify 为 installation，一处称无 `--only` 的 verify 默认 installation，模式矩阵另称 `--only` 时 verify 才是 artifact；需明确 requirement-workspace 等 flag 对默认 scope 的影响。 |
| B03 | pass | `skills/spec-runtime-setup/SKILL.md:110-124, 139-145, 149-156` | 明确区分只读请求、用户明确授权、工具建议和模型自拟 flag；host/facts 写入由确定性入口 gate。 |
| B04 | pass | `skills/spec-runtime-setup/SKILL.md:30-34, 42-52, 139-145` | registry 与 loaded skill support root 的 source/runtime 边界清楚，禁止以 cwd 或 source checkout 查找运行入口，也禁止手改 runtime mirror。 |
| B05 | pass | `skills/spec-runtime-setup/SKILL.md:20, 155-171, 205-211` | 覆盖冲突、unsafe path、partial scope、refresh 限制及失败后按 reason code 有界修复的处理方式。 |
| B06 | pass | `skills/spec-runtime-setup/SKILL.md:180-181, 283-304, 375-386` | 规定按实际验证范围报告，提供聚焦验证命令，并明确未就绪时不得给首次任务模板。 |
| X01 | pass | `skills/spec-runtime-setup/SKILL.md:213-270` | 多仓场景说明仓集确认、构建顺序、并发 lease、恢复和 cleanup 边界。 |
| X02 | pass | `skills/spec-runtime-setup/SKILL.md:30-40, 54, 163-173` | registry/schema 版本、Provider pin、状态兼容和宿主差异均可定位；未要求不相关 API/架构扩展。 |
| X03 | pass | `skills/spec-runtime-setup/SKILL.md:139-171, 233-268` | 高影响写入有 authority、containment、rollback/cleanup、失败状态和范围限制。 |
| X04 | pass | `skills/spec-runtime-setup/SKILL.md:18-23, 260-304` | 下游 consumer、机器 artifact、状态含义与 limitations 有声明；handoff 不把 ready 外推为语义正确。 |

## Findings

1. **B02 — `--verify-only` 的 scope 描述存在静态歧义**  
   **位置：** `skills/spec-runtime-setup/SKILL.md:189-199`  
   **后果：** 下游操作者可能误以为普通 `--verify-only` 会验证 CodeGraph/Graphify artifact，或错误地将 installation 验证描述为完整 setup ready。第 192 行将普通 `--verify-only` 列为 installation；第 194 行又表述图能力通过 `--only` 路径验证；第 199 行进一步称 `--verify-only --only <graph-id>` 才验证已有图。同时，`--requirement-workspace` 对 verify scope 的具体组合行为未在该矩阵中明确。  
   **最小修复建议：** 将矩阵和邻近说明合并为一个无歧义的 scope 决策表，逐项列出 `--installation-only`、无 scope flag、`--only`、`--requirement-workspace` 的 plan/verify/apply 行为；保持现有 CLI 语义，不以 prose 推断未实现行为。

2. **D05/D08 — 入口文档过度承载条件细节**  
   **位置：** `skills/spec-runtime-setup/SKILL.md:213-270`  
   **后果：** per-requirement workspace graph 的大型特例与一般 Runtime Setup 合同混排；操作者为普通单项目 setup 需要穿过大量低频分支，也使多处通用模式说明容易漂移。  
   **最小修复建议：** 在 source 中将 workspace graph 细节移入按需加载的 reference，入口仅保留触发条件、关键授权/隔离边界和引用链接；在重复调整前先核对该拆分是否符合已有 source/runtime 生成合同。

3. **D05 — mode 与授权规则重复陈述，且已出现口径漂移**  
   **位置：** `skills/spec-runtime-setup/SKILL.md:108-123`  
   **后果：** bare、check、verify、subset 的行为分别在 posture、Workflow Modes、Default Diagnostic Flow、安装与图能力矩阵中重复说明，修改时易出现不同段落不一致；B02 即为一个可见例子。  
   **最小修复建议：** 选一处作为简明 canonical mode/scope 表，其他章节只引用该表并保留各自特有的操作步骤。

## 主责深挖面发现

- **B01 入口职责：** 正向 setup 触发和不应进入 setup 的普通计划、实现、审查、调试、语义问题均有说明（`skills/spec-runtime-setup/SKILL.md:15-16, 110-123`）；examples 也覆盖普通源码编辑、语义问题和授权安装（`skills/spec-runtime-setup/evals/examples.json:28-39, 89-105`）。静态合同支持 pass。
- **B02 输入输出：** 入口声明 host、repo、registry、config、workspace facts 等输入及 readiness/artifact 输出（`skills/spec-runtime-setup/SKILL.md:17-21`），并给出机器字段与 scope 的含义。但 `--verify-only` 的 scope 文字存在前述歧义，因此判 fail。
- **B03 授权与信任：** 清晰区分用户请求授权、显式参数范围与工具建议（`skills/spec-runtime-setup/SKILL.md:110-124`）；host authority 需来自当前 runtime surface 与 `MCP_SETUP_HOST` pin，旧 facts 不得授予写权限（`skills/spec-runtime-setup/SKILL.md:139-145`）。静态合同支持 pass。
- **B04 source/runtime：** registry 是 source，loaded skill root 下的脚本作为 runtime projection 消费；不从 cwd/source checkout 找运行入口，也不手改生成镜像（`skills/spec-runtime-setup/SKILL.md:30-52`）。静态合同支持 pass。
- **X01：** 多仓工作区有独立的 build/status/clean lifecycle、确认仓集和失败处理说明（`skills/spec-runtime-setup/SKILL.md:213-270`）；静态合同支持 pass。
- **X02：** registry/schema 版本、Provider 版本及主机投射规则可定位（`skills/spec-runtime-setup/SKILL.md:30-40, 160-173`）；静态合同支持 pass。
- **X03：** 多仓图清理、子进程取消、lease、artifact promotion 和状态合同包含风险与恢复限制（`skills/spec-runtime-setup/SKILL.md:233-268`）；静态合同支持 pass。
- **X04：** artifact contract 与 consumers 有列示，handoff 限制 ready claim 的范围（`skills/spec-runtime-setup/SKILL.md:18-23, 260-304`）；静态合同支持 pass。

## 未读文件

- `skills/spec-runtime-setup/scripts/**`：未逐一阅读共置 Node 入口及其模块。原因是该 Skill 下存在大量实现模块，本轮按用户指定的静态合同盲评范围优先完成入口、相关 references、检查表、合同基线和消费者清单读取；因此无法确认脚本对 prose 的实际落实、失败恢复行为和副作用边界。
- `skills/spec-runtime-setup/scripts/contracts/**`：未阅读 workspace state/manifest schema；未覆盖 schema 与入口声明、消费者使用间的字段一致性。
- `skills/spec-runtime-setup/evals/eval.yaml`、`skills/spec-runtime-setup/evals/cases/*.yaml`：未读各 case 定义；已读 eval README 和 examples，未覆盖 case 本身的 fixture、执行方式和判据。
- 消费者清单所列全部 `src/`、`tests/` 文件：未逐项读取（清单见 `spec-runtime-setup.consumers.txt:2-73`）。未覆盖直接消费者是否按声明解释 readiness scope、宿主投射是否与 registry/入口一致，以及 unit/integration 测试实际覆盖的边界。
- `docs/contracts/workflows/scenario-capability-matrix.md`：入口引用该文件作为默认 scenario capability matrix（`skills/spec-runtime-setup/SKILL.md:25-28`），但未读取，未覆盖其对 setup 的附加要求。

## 结论一句话

入口静态合同整体边界较清楚，但 `--verify-only` scope 存在明确的文本歧义，且入口细节负载偏重；本轮对 scripts、cases 和消费者实现未完成核验，不能据此判断行为质量或下游一致性。
