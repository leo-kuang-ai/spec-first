---
date: 2026-04-13
topic: spec-first-sync-compound-engineering-updates
---

# Spec-First 同步 Compound Engineering 最新更新

## Problem Frame

`spec-first` 源于 `compound-engineering-plugin`，但当前已经形成了自己的产品边界：

- 核心链路仍然高度同构：`brainstorm -> plan -> work -> review -> compound`
- skill / agent 命名体系已从 `ce-*` 演化为 `spec-*`
- `spec-graph-bootstrap`、`spec-graph-bootstrap`、`spec-mcp-setup` 等能力已经形成当前项目独有的控制面
- 平台层、多宿主分发、converter / target / sync / release 等能力已经明显分叉

源项目在 2026-04-13 之前累积了大量更新，其中既包含：

- 对核心 workflow 的质量修复
- 对 review / spec-doc-review / resolve-pr-feedback 的稳定性增强
- 对 plan / brainstorm / work 的结构优化和 token 优化
- 也包含不适合直接引入当前项目的平台化能力和外围能力

当前需要的不是“把上游变更整包搬过来”，而是建立一条**可持续、可分批、可验证的同步升级路径**，使 `spec-first` 能持续吸收源项目核心链路的成熟经验，同时保持自身产品定位不被打散。

## Requirements

**同步基线与映射**
- R1. 必须先形成一份可复用的 skill / agent 全量映射基线，明确 `exact-same`、`exact-diff`、`rename-map`、`split-map`、`source-only`、`spec-only` 六种互斥映射类型。
- R2. 映射基线必须覆盖当前项目 `skills/` 与 `agents/` 的完整清单，以及源项目 `plugins/compound-engineering/skills/` 与 `plugins/compound-engineering/agents/` 的完整清单。
- R3. 映射基线必须能够直接服务后续同步矩阵生成，不能出现同一能力同时落入多个映射分类的情况。
- R4. 对 `ce-update` 必须明确判定为 `source-only`，并视为“当前没有，需要新立项”，不能误判为当前已有拆分映射。

**更新获取与分析输入**
- R5. 必须定义一套稳定的“源项目更新获取方式”，至少覆盖：
  - 基于 `ORIG_HEAD..HEAD` 的快速记录方式
  - 基于 `before..after` commit 范围的精确记录方式
- R6. 更新记录文件必须至少包含三个基础段落：
  - `=== 更新范围 ===` 或等价范围信息
  - `=== 提交记录（ID + 信息） ===`
  - `=== 改动的文件列表 ===`
- R7. 更新记录文件不能只停留在原始 git 输出，必须支持继续写入分析内容，作为后续同步升级的直接输入材料。
- R8. 更新记录文件必须支持追加最小分析骨架，至少包括：
  - `=== 初步分析 ===`
  - `=== 同步建议 ===`
- R9. 初步分析至少要能按主题区分：
  - 核心链路相关提交
  - review / spec-doc-review 相关提交
  - plan / brainstorm 相关提交
  - work / work-beta 相关提交
  - compound / compound-refresh 相关提交
  - 平台层 / 多宿主相关提交
  - 新能力提交
- R10. 同步建议至少要能输出四类结论：
  - 必跟
  - 选择性吸收
  - 暂缓
  - 需要新立项

**核心链路同步策略**
- R11. 必须将源项目更新拆分为“核心链路逐 commit 同步”和“外围能力按主题评估”两条轨道。
- R12. 核心链路同步范围至少包括：`spec-code-review`、`spec-doc-review`、`resolve-pr-feedback`、`spec-plan`、`spec-brainstorm`、`spec-ideate`、`spec-work`、`spec-work-beta`、`spec-compound`、`spec-compound-refresh`。
- R13. 核心链路同步必须逐 commit 形成矩阵，矩阵中必须记录：上游 commit、上游关键文件、当前项目落点、处理决策、说明。
- R14. 核心链路同步矩阵必须使用统一决策字段：`MUST`、`SELECTIVE`、`SKIP`、`NEW-TRACK`。

**批次化升级**
- R15. 核心链路同步必须至少拆成四个升级批次：
  - Review / Document Review / Resolve Feedback
  - Plan / Brainstorm / Ideate
  - Work / Work Beta
  - Compound / Compound Refresh
- R16. 每个批次必须有明确的纳入 commit、选择性处理项、批次目标和实施后预期结果。
- R17. 每个批次必须能独立推进，不能依赖一次性整包升级。
- R18. 批次排序必须优先保证质量门禁稳定，再推进 planning 与 execution 层，最后再推进知识沉淀层。

**定位保护**
- R19. 同步过程中不得因为上游更新而默认放宽当前产品边界，例如不得默认把 `spec-plan` / `spec-brainstorm` 泛化成面向非软件任务的通用 planning / brainstorming 系统。
- R20. 对 `ce-demo-reel`、`ce-sessions`、`ce-slack-research`、`ce-optimize`、`ce-update`、`ce-debug` 这类外围或新增能力，必须与核心链路同步分离处理。
- R21. 对 `ce-setup` 必须按职责迁移，不得把它简单等同为当前的 `setup` 单一 skill。
- R22. 对 `feature-video` 与 `ce-demo-reel`、`reproduce-bug` 与 `ce-debug` 这类“近邻但不等价”的能力，必须显式说明差异，防止错误映射。

**升级执行准备**
- R23. 每个核心链路 commit 在真正实施前，必须能补充三个执行字段：`当前状态`、`实施 PR / commit`、`验证方式`。
- R24. 同步矩阵必须能直接支持后续从 `批次 A` 开始分批实施，而不需要再次回到原始更新清单做人工重筛。
- R25. 对 `MUST` 项必须优先支持生成更细的实施清单，包括当前项目文件改动顺序和最小验证项。
- R26. 每个纳入核心链路矩阵的 commit，必须保留一条可回溯的上游证据，至少包括 `commit ID + source-subject`，来源应为更新清单或源仓库 git 记录。
- R27. 共享 commit 必须显式标注 `owner-batch` 与 `shared-with`，且 `owner-batch` 必须负责覆盖该 commit 在当前仓库中的全部真实文件落点。
- R28. 共享 commit 的 owner 完成后，必须在矩阵回写 `status / verification / notes`；其中 `notes` 至少包含：已覆盖文件、意图迁移语义、shared 批次核查点。

## Success Criteria

- 已形成一份可直接用于后续升级的全量映射基线文档。
- 已形成一份可直接用于后续升级的核心链路逐 commit 同步矩阵。
- 已形成一套可复用的更新获取与更新文件分析结构，后续每次源项目同步都能复用同一模板。
- 矩阵中的映射类型和处理决策互不冲突，能够直接转成执行表。
- 后续实施者可以在不重新阅读源项目全部更新记录的前提下，从矩阵直接选择一个批次开始升级。
- `ce-update`、`ce-debug` 等非主链路能力已被明确分流，不会混入核心链路批次。
- 所有纳入核心链路矩阵的 commit 都能追溯到上游 `source-subject`，不需要只凭短 SHA 猜测含义。
- 所有共享 commit 都具备 `owner-batch / shared-with / notes` 三类交接信息，shared 批次可据此做联动核查。

## Scope Boundaries

- 本需求文档只定义同步升级策略、分类方法和批次边界，不直接实施代码迁移。
- 本需求文档不要求在当前阶段补齐所有测试迁移；测试要求仅作为后续实施批次的验证字段存在。
- 本需求文档不覆盖多宿主平台化能力、converter / target / sync / release 系统的同步方案。
- 本需求文档不要求立即新增 `spec-debug`、`spec-update`、`spec-sessions` 等新入口，只要求先定义是否进入新立项轨道。
- 本需求文档不要求把更新获取脚本产品化为 CLI 命令；当前阶段只要求流程和文件结构标准化。

## Key Decisions

- 决定 1：核心链路采用“逐 commit 跟进”，外围能力采用“按主题评估”。
  - 理由：当前项目核心链路没有大改，适合保留上游修复顺序；外围能力已经明显分叉，不适合机械逐 commit 吸收。

- 决定 2：先做映射基线，再做逐 commit 同步矩阵。
  - 理由：没有稳定映射基线，后续矩阵会反复漂移，导致同一能力在不同批次中被重复判断。

- 决定 3：将 `ce-update` 视为 `source-only`，当前没有，需要新立项。
  - 理由：当前的 `version-reminder` / `doctor` 仅具弱近邻关系，不构成等价能力。

- 决定 4：更新获取文件必须同时承载“原始 git 输出”和“后续人工分析结论”。
  - 理由：如果只记录提交和文件列表，后续升级者仍需重新做一次分类；将分析骨架直接写入文件，才能让更新文件成为真正的同步输入。

- 决定 5：升级顺序优先 review，再 plan / brainstorm，再 work，再 compound。
  - 理由：质量门禁是其他链路升级的底座，优先稳定门禁可以降低后续返工成本。

- 决定 6：共享 commit 采用“owner 覆盖全部真实文件落点，shared 只做联动核查”的治理模型。
  - 理由：同一个上游 commit 若被多批次分别实现，极易出现重复迁移、漏迁次要落点，或 shared 批次与 owner 语义不一致的问题。

## Dependencies / Assumptions

- 假设源项目更新清单 `updated-files-2026-04-13.txt` 可作为本轮同步范围的可信输入。
- 假设当前仓库的 skill / agent 映射关系在本轮内保持稳定，不会再发生大规模命名或结构调整。
- 假设当前项目继续维持以 repo-grounded software workflow 为主的产品定位。
- 假设后续每次同步时都能稳定产出包含“提交记录 + 文件列表 + 初步分析 + 同步建议”的更新文件。

## Outstanding Questions

### Resolve Before Planning
- 无

### Deferred to Planning
- [Affects R19][Technical] 每个批次的最小验证项应如何标准化组织，是否要为 `MUST` 批次追加统一执行模板。
- [Affects R14][Technical] `ce-debug` 若新立项，是否应以 `spec-debug` 形式独立存在，还是扩展现有 `reproduce-bug`。
- [Affects R10][Technical] 批次实施文档是否继续放在 `docs/业界分析/`，还是转入 `docs/plans/` 形成正式实施计划。
- [Affects R5][Technical] 后续是否需要把“更新获取 + 更新文件分析骨架”进一步沉淀为脚本或 CLI 子命令。

## Next Steps

→ `spec-plan` 基于本需求文档，产出“批次 A 到批次 D 的实施计划”，至少先细化批次 A 的文件级迁移顺序与验证要求。
