# 全量审查多 Agent 并审执行方案

**版本**：v1.3
**创建日期**：2026-11-04
**定位**：[FULL-REVIEW-ONE-PASS.md](FULL-REVIEW-ONE-PASS.md)（全量单次审查执行方案）的**执行架构特化**——对象范围、证据层承诺（前三层，`field_outcome` 不承诺）、S0-S5 骨架、收缩纪律全部沿用该文件与 [REVIEW-EXECUTION-WORKFLOW.md](REVIEW-EXECUTION-WORKFLOW.md) v2；本文件只定义一件事：**单个 Skill 由多个独立 agent 并审（K 层评审者）的架构、独立性保证、一致性度量与收敛协议**。
**授权**：owner 2026-11-04 指令「登记全量审查，规划支持多 agent 并审单个 skill」；三项登记决定经 AskUserQuestion 确认（见下表）。v1.1：owner 提供可用模型池，K 层评审者升级为跨模型盲评（见 2.5）。v1.2：CLI 目录实测（magpie 统一目录、双 CLI 通道、别名陷阱）。v1.3：**owner 收紧模型池为四 provider（zhipu / kiro / hst-2 / ai-qianxing2）——claude 系（packycode/imported）出池**，行为层 eval 与 R1/L1 由 claude-opus-5-5 改派池内模型（见 2.5）。

---

## 1. 启动登记（2026-11-04，一次性，运行中不再询问）

按 FULL-REVIEW-ONE-PASS 第 2 节登记表逐项填写。**本登记写在任何试点结果出现之前**（v2 第 3 节预先登记规则）。

| 决定 | 登记值 | 来源 |
|---|---|---|
| 范围 | **全部 38 个 Skill + `_shared` 消费面** | owner 指令「登记全量审查」 |
| 本地写入 | 只写本轮 run 目录与隔离 worktree | 文档默认，采纳 |
| Skill / runtime / 提交 / 推送 | **全部禁止；审查只报告**。并审 agent 一律只读 | 文档默认，采纳 |
| 模型调用 | engine `claude_code`；**行为层 eval 固定 `--model zhipu/glm-5.3`（v1.3 改派：原 claude-opus-5-5 因 provider 出池）**；`skill-up run` 并发 4；静态审查 K 层评审者按 2.5 模型分配表跨模型盲评，**逐 agent 记录所用模型**（报告披露）。**授权模型池（owner 2026-11-04）= 四 provider：zhipu / kiro / hst-2 / ai-qianxing2**；池外模型（含 claude 系、gemini 系、deepseek 主站系）禁用。通道已实测：magpie 统一目录，claude/codex 双 CLI 均可达 | owner 确认 + 实测核实 |
| 第二引擎 | **允许 codex 复核**。外发范围限定：被审 Skill 的源码文件 + 指定 run 日志片段，不发 repo 全量；用于全分歧项仲裁与抽检复核（比例登记于 S1 后定），不是每 Skill 必跑 | owner 确认（外发授权登记在案） |
| 超预算策略 | 收缩：重型与主链路跑全部 case，其余只跑结构层，未跑部分记 `not-run`；**agent 层同规则收缩**（K=3 对象优先保全） | 文档默认，采纳 |
| 失败重跑 | 只对失败 case 追加 `--iteration 3`，单独报告，不覆盖首轮 | 文档默认，采纳 |
| 停止条件 | 越权写入、破坏工作区、凭据泄露 → 立即停止 | 文档默认，采纳 |
| **并审强度 K（本方案新增）** | **分层：重型组 K=3，其余 K=2**。重型组初判 = 主链路 5（spec-prd / spec-plan / spec-work / spec-code-review / spec-commit-push-pr）+ spec-debug + spec-compound + spec-compound-refresh；S0 清点时可按「近 90 天有实质改动或挂已知 finding」增补，增补名单写入启动记录，不许运行中静默加 | owner 确认 |

---

## 2. 并审架构（单个 Skill 的审阅单元）

### 2.1 输入包（脚本确定性准备，S0 产出）

每个 Skill 一个标准输入包，由脚本（非 agent）组装，保证 K 个评审者拿到**逐字节相同**的材料：

1. manifest：该 Skill 文件清单 + SHA-256（S0 产出）
2. 源码路径：`SKILL.md`、必读 references、scripts、templates（agent 自行从冻结 worktree 读取）
3. `skills-governance.json` 中的入口类型（workflow_command / standalone_skill / internal_only）
4. 消费者清单：`rg -l "skills/<skill>/" tests src` 结果
5. 检查表：workflow v2 第 4 节 D01-D08 / B01-B06 / X01-X04 全表（逐行裁决用）
6. 合同基线：core/08-skill-contract-protocol.md 要点 + 该 Skill 相关 contract 测试路径

### 2.2 K 个独立评审者（fresh-source，互相不可见）

- 每个 reviewer 是**新会话只读 agent**：只读冻结 worktree 磁盘内容，不携带主会话上下文，不看到其他 reviewer 的任何输出（blind）。
- **独立性 ≠ 复制上下文**（v2 红线「不为凑多专家复制同一上下文」的合规方式）：K 个评审者评**同一份逐项 rubric**（第 4 节全表逐行：pass / fail / not-applicable / not-verified + 位置 file:line），各自独立完成**全量**裁决；另外各自分配一个**主责深挖面**（R1=D01-D05+D08 深挖、R2=B01-B04+X 条件面、R3=B05/B06 失败与交付质量），用于 findings 挖掘的深度分工——但 rubric 裁决不做切分，保证逐项可算一致性。
- findings 要求：每条带位置（file:line）、后果、最小修复建议或「保持现状成立」；禁止无位置的印象式结论。

### 2.3 一致性度量与收敛协议

1. **逐项一致率**：对 rubric 每一行计算 K 评审者裁决的一致情况。K=3 分三档：全一致 / 多数（2/3）/ 全分歧；K=2 分两档：一致 / 分歧。
2. **收敛规则**：
   - 全一致 / 多数 → 采多数结论，少数意见记入分歧附录
   - K=2 分歧 或 K=3 全分歧 → 进仲裁
3. **仲裁层**（逐级）：
   - L1 同模型仲裁：新上下文仲裁 agent，可见双方输出 + 源码，给裁决与理由
   - L2 跨引擎仲裁（gpt-6-astra，owner 已授权外发；刻意避开 R3 的 gpt-6.1-sol 避免同家族自复核）：L1 后仍不服或属重型组关键项，送独立裁决；结论标注引擎来源
   - 仲裁不设「必须收敛」压力：证据不足以收敛的项如实记 `not-verified`，不许强行判定
4. **收敛产物**（每 Skill 一份）：merged findings（并集 + 来源标注）、逐项 agreement 统计、仲裁记录、not-verified 清单。

### 2.4 调度拓扑

```
S0 脚本: 冻结worktree → 38输入包 → floor检查
S1 试点: spec-plan 单包走通 K=3 → 校准(成本/一致性/rubric) → 外推
S2 静态: 38包 × K fan-out（wave调度，重型组先行）→ 逐包收敛
S3 行为: skill-up run --model claude-opus-5-5 并发4（157 case）
         + 评审agent按rubric判定输出（评分者协议：rubric先行）
S4 汇总: 四层证据分层报告 + agreement汇总 + not-run如实
S5 field_outcome: 不承诺（登记在案）
```

Wave 调度：主会话并发受限时按 wave 分批，每 wave 的收敛产物**落盘**再进下一 wave，防主会话上下文瓶颈。

### 2.5 模型分配表（v1.1，owner 提供模型池：glm-5.3 / claude-opus-5-5 / glm-5.3-flash / gpt-6.1-sol / gpt-6-astra）

原则：**K 层评审者跨模型家族盲评**——同模型新上下文只能隔离上下文串扰，跨模型才能降低同源误差相关；仲裁模型避开评审者模型（不让某家模型复核自己家族的裁决）。

| 角色 | 模型（全名） | 说明 |
|---|---|---|
| 重型组 R1 | zhipu/glm-5.3 | 池内旗舰，判定质量优先 |
| 重型组 R2 | hst-2/gpt-6.1-sol | 跨家族第二票 |
| 重型组 R3 | kiro/kimi-k3 | 跨家族第三票（Moonshot 系） |
| K=2 组对子 | zhipu/glm-5.3 + hst-2/gpt-6.1-sol | 33 个非重型对象默认对子，与重型组 R1/R2 同款 |
| L1 新上下文仲裁 | hst-2/gpt-6-astra | 非评审者；**已知弱点：与 R2 同厂不同代**——涉及 R2 单方坚持的争议跳过 L1 直送 L2（如实标注） |
| L2 终裁 | codex CLI + kiro/qwen3-coder-next | 跨 CLI 跨厂（Alibaba 系）；仲裁强度由 S1 试点检验，不合格则登记换 kiro/minimax-m2.5 或降级 not-verified |
| 行为层 eval | zhipu/glm-5.3 | v1.3 改派（原 claude-opus-5-5 出池） |
| 收缩模式结构层扫描 | zhipu/glm-5.3-flash | 低成本预筛：超预算收缩时对 not-run 对象做 structure_contract 层 |
| 主会话/调度 | zhipu/glm-5.3 | fan-out 调度、输入包组装、收敛汇总 |
| 备用通道 | ai-qianxing2/gpt-6.1-sol、ai-qianxing2/gpt-6-astra | 主通道故障时同模型换 provider，替换披露 |

通道注记（2026-11-04 实测）：① magpie 统一目录 38 条目，`claude --model <全名>` 与 `codex -m <全名>` 双通道可达；② **别名陷阱**：宿主 sonnet/opus 别名已重映射至 zhipu/glm-5.3，评审者生成禁止依赖别名，必须全名；③ **授权池 = zhipu / kiro / hst-2 / ai-qianxing2 四 provider**，claude 系（packycode/imported）、gemini 系、deepseek 主站系出池禁用；④ 家族碰撞如实登记：L1(astra) 与 R2(sol) 同厂、对子含 R1/R2 同款模型——独立性主要靠 fresh-source 盲评 + K 第三票（kimi-k3）保底，碰撞点已逐处标注。

降级规则：某模型 S0 就绪检查不可用时，按「家族不同 + 强度就近」替换（如 gpt-6.1-sol 不可用→gpt-6-astra，两 gpt 均不可用→K 对子改 glm-5.3 + claude-opus-5-5），替换写入启动记录并报告披露；K=3 组不可凑满三个家族时降为 K=2 并如实记录。

---

## 3. 阶段执行（相对 FULL-REVIEW-ONE-PASS 的 delta）

| 阶段 | 沿用 | 本方案特化 |
|---|---|---|
| S0 冻结清点 | worktree、manifest 38 份、floor 检查、宿主加载隔离检查 | 追加产出 38 个标准输入包 |
| S1 试点 | spec-plan 先行、单位成本记录、规模外推 | 试点扩为 **K=3 完整闭环**（含一致性统计与 codex 仲裁试运行）；若试点逐项一致率低于预期，先修 rubric 再试点，**不是加 agent 数** |
| S2 静态审查 | 只读、manifest 全读、未读文件列路径理由 | 单 reviewer → K 并审 + 收敛协议（本文 2.2-2.4） |
| S3 行为层 | eval.yaml 157 case、固定模型、失败 `--iteration 3` | 判定环节引入评分者协议：rubric 先行、判定 agent 独立、争议升级仲裁 |
| S4 汇总 | 四层证据、回源、原始记录与汇总数一致 | 增加 agreement 汇总节与仲裁台账 |
| 收缩 | 超预算按登记策略 | agent 层同规则收缩，K=3 对象优先保全 |

---

## 4. 成本与收缩（不虚构数字）

- 行为层上界沿用 FULL-REVIEW 实测推算：串行约 39h，并发 4 约 10h（上界，S1 校准）。
- 静态层 agent 成本：**不预设**。S1 试点实测单包 K=3 成本后外推（按 references 行数 / 脚本数 / 消费者数分组，不按 Skill 个数平均——v2 规则）。
- 外推超登记预算 → 执行登记收缩策略（收缩对象的结构层由 glm-5.3-flash 低成本扫描，见 2.5），报告标题如实改「全量单次审查（收缩）」，列出未承诺对象与证据层。

## 5. 失败模式与红线

| 风险 | 处置 |
|---|---|
| agent 不可用 / 超时 | 同规格重派，事件记入 run 日志；同一包重派超 2 次该评审者记 `not-run` 并降级 K |
| 试点一致率过低 | 定性为 rubric 缺陷：修 rubric → 重新试点；禁止用加 agent 数掩盖 |
| codex 外发范围失控 | 只发被审 Skill 文件 + 指定日志片段；发送清单逐次落盘可审计 |
| 主会话上下文瓶颈 | wave 化 + 收敛产物落盘；主会话只持汇总 |
| runtime mirror 混入 | S0 隔离检查不豁免；确认不了逐结果标注「可能混入 runtime 副本」 |
| 结论漂移 | findings 无 file:line 不入册；advisory 不写为 confirmed；报告标题不得出现「完整审查通过」 |

## 6. 与 Option B 主链路批次的衔接（一项待 owner 定）

主链路 5 个 Skill 在本审查中为 K=3 对象，与 Option B WP1 深读对象重叠。两条路径二选一，S0 启动时定案：

- **路径甲**：本审查先跑——WP1 深读由本审查 K=3 完成并出 WP1 规定格式的 5 份产出，Option B 账目引用本审查结果；
- **路径乙**：Option B WP1 先跑——其产出登记为本审查主链路对象的既有 R 证据，本审查对这 5 个只做增量（K 降为 2，验证 WP1 结论）。

默认建议路径甲（避免同对象两轮深读重复投入）。

## 7. 失效条件

- `skills/` 数量或 governance 登记数与 38 不符（S0 三方一致性检查失败）
- v2 workflow 或 FULL-REVIEW-ONE-PASS 发生实质修订
- 试点一致率连续两轮低于预期且修 rubric 无效
- owner 撤销 codex 外发授权（仲裁层降级为仅同模型，报告披露）

---

**方案版本**：v1.3
**登记状态**：启动登记已填（2026-11-04），待执行 S0 冻结清点后正式开跑
**维护者**：本轮审查 owner + 执行架构师
