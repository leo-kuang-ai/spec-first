# 阶段 B — 质量闭环补齐（P1）

> **目标**: Gate + AI + Metrics + Hook + Skill Runtime 联调，质量闭环完整可用
> **准出**: GL-01 ~ GL-04 全部通过
> **CLI 命令数**: 14 个 CLI 命令 + 1 个 Skill Runtime 入口（gate×3 + golive×1 + ai×3 + metrics×2 + feature×3 + commit×1 + doctor 完整×1 | skill runtime×1）
> **对齐技术方案**: v2-02, v2-06, v2-07, v2-08, v2-11, v2-12, code-review-integration

---

## 一、M3 GateEngine — 质量门禁（T-BM3-xxx）

> **对齐技术方案**: v2-06 质量门禁与豁免机制
> **对齐需求**: core-05-cross-cutting · core-03-traceability

### T-BM3-001 Gate 条件评估引擎

**描述**: 逐项评估阶段 Gate 条件，汇总三态结果

**输入**: v2-06 §2 Gate 模型 + §3 阶段 Gate 条件

**产出物**: `src/core/gate-engine/gate-evaluator.ts`

**功能**:
- `evaluateGate(featureId, stage?)` — 读取 stage-state.json → 获取当前阶段 Gate 条件 → 逐项评估
- 条件通过 → mark PASS
- 条件未通过 → 检查 known-exceptions.md → 有有效豁免 → WAIVER / 无豁免 → FAIL
- 汇总: 全 PASS → PASS / 有 WAIVER 无 FAIL → PASS_WITH_WAIVER / 有 FAIL → FAIL + 修复建议
- 写入 gate-history.jsonl

**验收标准**:
1. 8 个阶段的 Gate 条件均可评估
2. 三态结果语义正确
3. FAIL 时输出具体未通过条件 + 修复建议
4. 单测覆盖 PASS / PASS_WITH_WAIVER / FAIL 三种路径

**依赖**: T-AM2-004, T-AM2-005, T-AM2-006, T-AS-004

---

### T-BM3-002 SCA 规范一致性校验

**描述**: 基于追踪矩阵的规范一致性校验

**输入**: v2-06 §4 SCA

**产出物**: `src/core/gate-engine/sca.ts`

**功能**:
- `evaluateSCA(featureId, stage)` — 按阶段执行对应 SCA 校验
- 校验维度:
  - Specify 后: spec 内部一致性（FR/NFR ID 唯一、AC 完整）
  - Design 后: spec ↔ design（每个 FR 有 DS 映射）
  - Plan 后: spec ↔ tasks（每个 FR 有 TASK 映射）
  - Implement 后: spec ↔ code（TASK traces 完整）
  - Verify 后: spec ↔ test results（TC verifies FR/AC）
- SCA FAIL 等同 Gate FAIL，阻断阶段推进

**验收标准**:
1. 5 个阶段的 SCA 校验逻辑正确
2. SCA 结果写入 Gate 条件评估结果
3. 单测覆盖各阶段 SCA 通过/失败场景

**依赖**: T-AM2-004, T-BM3-001

---

### T-BM3-003 安全严重级别校验

**描述**: 汇总安全扫描结果，按 S1-S4 分级判定

**输入**: v2-06 §5 安全严重级别

**产出物**: `src/core/gate-engine/security.ts`

**功能**:
- `evaluateSecuritySeverity(featureId)` — 读取安全扫描报告 → 按 S1-S4 分级汇总
- S1（数据泄露/RCE/权限绕过）→ 强制 FAIL，禁止豁免
- S2（XSS/CSRF/注入）→ 默认 FAIL，仅紧急场景可豁免
- S3（信息泄露/配置不当）→ 可豁免放行
- S4（低风险/建议项）→ 不阻断
- "安全无高危"定义: 无 S1，且无未获批豁免的 S2

**验收标准**:
1. S1 强制 FAIL 且不可豁免
2. S2 默认 FAIL，有有效豁免时 WAIVER
3. S3/S4 不阻断
4. 单测覆盖各级别组合

**依赖**: T-BM3-001

---

### T-BM3-004 Gate CLI 命令实现

**描述**: 实现 gate（3 子命令）+ golive（1 子命令）共 4 个 CLI 命令

**输入**: v2-03 §2.4 gate + §2.13 golive

**产出物**:
- `src/cli/commands/gate.ts`（含 golive check 子命令）

**命令清单**:
```bash
spec-first gate check <featureId> [--stage <stageId>]
spec-first gate history <featureId>
spec-first gate conditions <featureId> [--stage <stageId>]
spec-first golive check
```

**功能**:
- `gate check` — 执行 Gate 评估，输出三态结果
- `gate history` — 读取 gate-history.jsonl，输出历史记录
- `gate conditions` — 列出指定阶段的所有 Gate 条件定义
- `golive check` — 评估 GL-01~GL-04 公司级上线准入门槛（非 Feature 级阶段 Gate），含外部指标源不可用时的 fallback 策略

**验收标准**:
1. 4 个命令均可通过 CLI 调用
2. gate check 输出结构化评估结果
3. golive check 逐项评估 GL-01（功能完整性）、GL-02（质量达标）、GL-03（安全合规）、GL-04（运维就绪），输出通过/未通过 + 修复建议
4. golive check 支持外部指标源不可用时的 fallback 策略
5. 参数校验 + ExitCode 正确

**依赖**: T-AS-005, T-BM3-001 ~ T-BM3-003

---

## 二、M5 AIOrchestrator — AI 编排（T-BM5-xxx）

> **对齐技术方案**: v2-08 Context Pack 与 Catchup
> **对齐需求**: aux-01-skill-system

### T-BM5-001 Context Pack 构建

**描述**: 构建双区结构的 Context Pack（control + references）

**输入**: v2-08 §2 Context Pack v2.0 + §3 Context Slicing

**产出物**: `src/core/ai-orchestrator/context-pack.ts`

**功能**:
- `buildContext(featureId, opts)` — 构建 Context Pack
- control 区: Feature 元数据 + 当前状态 + 产物指针（< 2KB 硬限制）
- references 区: 按需读取的产出物片段（含 path/selector/reason/checksum/mtime）
- 三层上下文: L1 核心（始终加载）+ L2 阶段（按阶段加载）+ L3 邻居（基于矩阵 depth=1）
- `validateConsistency(pack)` — 校验 Context Pack 一致性（checksum + mtime 验证），不一致时输出 warning 并标记 stale 引用

**验收标准**:
1. control 区 < 2KB，超限视为构建失败
2. 三层上下文按阶段正确加载
3. references 包含 checksum + mtime
4. validateConsistency 检测到 stale 引用时输出 warning
5. 单测覆盖各阶段的上下文映射 + 一致性校验通过/失败场景

**依赖**: T-AM2-004, T-AM1-006, T-AS-003

---

### T-BM5-002 Context Slicing 动态裁剪

**描述**: 按预算裁剪上下文，防止 token 膨胀

**输入**: v2-08 §3 Context Slicing

**产出物**: `src/core/ai-orchestrator/context-slicing.ts`

**功能**:
- `sliceContext(pack, budget)` — 按预算裁剪
- 默认预算: 16K tokens（L1 ≤ 20%, L2 ≤ 30%, L3 ≥ 50%）
- 可通过 `config.yaml` 中 `context.token_budget` 覆盖（合法范围 8K-64K）
- 超限降级顺序: 裁剪 L2 非强依赖 → L3 降为 Top-N → control 仅保留 ID 列表
- 规模策略: S=inline-first / M=hybrid / L=references-first
- 超限时输出 warning: `CONTEXT_BUDGET_EXCEEDED`

**验收标准**:
1. 裁剪后总 token 不超预算
2. 降级顺序正确（L2 → L3 → control）
3. 规模策略按 S/M/L 正确切换
4. 单测覆盖正常/超限/极端场景

**依赖**: T-BM5-001

---

### T-BM5-003 Session Catchup 恢复机制

**描述**: 实现 7 步恢复流程，解决 AI 会话断裂问题

**输入**: v2-08 §4 Session Catchup 机制

**产出物**: `src/core/ai-orchestrator/catchup.ts`

**功能**:
- `catchup(featureId)` — 7 步恢复流程:
  1. 读取 stage-state.json（当前阶段）
  2. 读取 task_plan.md（任务规划状态）
  3. 读取 progress.md（已完成进度）
  4. 读取 findings.md（已有发现）
  5. 定位当前阶段 + 当前 TASK
  6. 扫描必需文件缺失项
  7. 输出恢复摘要（含 missing_files 列表）
- 恢复后强制校验: current_phase 与 stage-state.json 一致、current_task 与 task_plan.md 一致
- 不一致时输出 warning（不阻断）
- 自动触发集成: 支持三档策略（auto/prompt/off），5 种触发场景（/clear 命令、上下文窗口截断、IDE 重启或网络中断后重连、跨 Agent 委派时、编排 Skill 检测到上下文缺失时自动调用）
- 60 秒并发保护: 防止短时间内重复触发
- 宿主不支持自动触发时降级为手动调用

**验收标准**:
1. 7 步恢复流程完整执行
2. missing_files 列表准确（为空也显式输出）
3. 一致性校验不通过时输出三类告警（缺文件、阶段不一致、关键文件过旧）
4. 自动触发三档策略正确切换
5. 60 秒内重复触发被拦截
6. 单测覆盖正常恢复/文件缺失/不一致/自动触发四种场景

**依赖**: T-AM1-006, T-AS-003, T-BM5-001

---

### T-BM5-004 AI 统计记录

**描述**: 记录每次 Skill 执行的 AI 调用统计

**输入**: v2-08 §5 AI 统计

**产出物**: `src/core/ai-orchestrator/ai-stats.ts`

**功能**:
- `recordStats(featureId, stats)` — 追加写入 `ai-stats.jsonl`
- 记录字段: timestamp, skill, taskId, tokensIn, tokensOut, duration
- 每次 Skill 执行完成后自动追加一行

**验收标准**:
1. 写入格式为合法 JSONL
2. 自动注入 timestamp
3. 单测验证追加写入行为

**依赖**: T-AS-004

---

### T-BM5-005 AI CLI 命令实现

**描述**: 实现 ai（3 子命令）共 3 个 CLI 命令

**输入**: v2-03 §2.7 ai

**产出物**: `src/cli/commands/ai.ts`

**命令清单**:
```bash
spec-first ai context <featureId> [--stage <stageId>] [--task <taskId>]
spec-first ai catchup <featureId>
spec-first ai stats <featureId>
```

**功能**:
- `ai context` — 构建并输出 Context Pack（YAML 格式）
- `ai catchup` — 执行 7 步恢复流程，输出恢复摘要
- `ai stats` — 读取 ai-stats.jsonl，输出统计摘要

**验收标准**:
1. 3 个命令均可通过 CLI 调用
2. context 输出合法 YAML
3. catchup 输出结构化恢复摘要
4. 参数校验 + ExitCode 正确

**依赖**: T-AS-005, T-BM5-001 ~ T-BM5-004

---

## 三、M6 MetricsEngine — 度量引擎（T-BM6-xxx）

> **对齐技术方案**: v2-11 度量与健康分
> **对齐需求**: aux-05-metrics

### T-BM6-001 健康分计算

**描述**: 基于 C1-C9 加权计算健康分 H1，含 E1 阶段耗时和 Q1 缺陷逃逸率计算

**输入**: v2-11 §3 计算规则 + §4 E1/Q1 定义

**产出物**: `src/core/metrics-engine/health-score.ts`

**功能**:
- `calculateHealthScore(featureId)` — 加权计算 H1
- `computeCycleTime(featureId)` — 基于 stage-state.json history 计算 E1 各阶段耗时
- `computeDefectEscapeRate(featureId)` — 基于缺陷记录计算 Q1 缺陷逃逸率
- 公式: `H1 = (w1×C1 + ... + w9×C9) × 100 - penalty(Q1)`
- 默认权重: w1=0.10, w2=0.10, w3=0.10, w4=0.15, w5=0.10, w6=0.15, w7=0.10, w8=0.10, w9=0.10
- 权重可通过 config.yaml 覆盖
- penalty(Q1): 缺陷逃逸率惩罚

**验收标准**:
1. 健康分计算结果为 0-100 整数
2. 权重覆盖机制正确
3. 单测覆盖满分/低分/惩罚场景

**依赖**: T-AM2-005

---

### T-BM6-002 瓶颈分析与度量报告

**描述**: 基于 12 项指标识别瓶颈阶段，生成度量报告

**输入**: v2-11 §5 瓶颈分析规则（R1-R5）

**产出物**: `src/core/metrics-engine/bottleneck.ts`

**功能**:
- `analyzeBottleneck(featureId)` — 基于 R1-R5 规则识别瓶颈
- R1 设计瓶颈: C1 < 80% 且阶段 ≥ 03_plan → 补充 DS 覆盖
- R2 测试瓶颈: C4 < 100% 且阶段 ≥ 05_verify → 补充 TC
- R3 实现滞后: C6 < 50% 且阶段停留超过 E1 中位数 ×2 → 检查任务拆解粒度
- R4 合规缺口: C7 或 C8 < 90% → 检查 PR/TASK 关联，补充 traces
- R5 缺陷逃逸: Q1 > 10% → 加强测试设计，增加边界用例
- `generateReport(featureId)` — 渲染健康度报告（使用 health-report.md.hbs）
- `computeReworkRate(featureId)` — 基于 gate-history.jsonl 计算返工率（目标 < 10%）【扩展指标，来源 core-03 §流程健康度，不在 v2-11 核心 12 项（C1-C9+E1+Q1+H1）之内】
- `computeGateFirstPassRate(featureId)` — 基于 gate-history.jsonl 计算 Gate 首次通过率（目标 > 85%）【扩展指标，来源同上】
- `getAcCoverageGaps(featureId)` — 基于追踪矩阵逐条检查 AC 覆盖状态，未覆盖 AC 记录到度量报告的 coverage-gaps 章节

**验收标准**:
1. R1-R5 规则按 v2-11 §5 定义正确触发
2. 报告包含 12 项指标 + 瓶颈分析 + 改进建议 + AC 覆盖缺口清单
3. 返工率和 Gate 首次通过率计算正确
4. AC 覆盖缺口逐条列出未覆盖 AC 及其关联 FR
5. 单测覆盖各规则触发/未触发场景

**依赖**: T-BM6-001, T-AM2-005, T-ATP-001

---

### T-BM6-003 Metrics CLI 命令补全

**描述**: 补全 metrics 命令组剩余 2 个子命令

**输入**: v2-03 §2.6 metrics

**产出物**: 扩展 `src/cli/commands/metrics.ts`

**命令清单**:
```bash
spec-first metrics report <featureId>
spec-first metrics health <featureId>
```

**功能**:
- `metrics report` — 生成完整度量报告（12 项指标 + 瓶颈分析 + 返工率/Gate首次通过率与目标值对比）
- `metrics health` — 输出健康分 H1 + 关键风险项 + 返工率（目标 < 10%）+ Gate 首次通过率（目标 > 85%）

**验收标准**:
1. 2 个命令均可通过 CLI 调用
2. report 输出完整度量报告，含目标值对比列
3. health 输出健康分 + 风险摘要 + 返工率/Gate首次通过率与目标值对比
4. 参数校验 + ExitCode 正确

**依赖**: T-AS-005, T-BM6-001, T-BM6-002

---

## 三-B、M4 ChangeMgr 补充 — 影响分析与同步（T-BM4-xxx）

> **对齐技术方案**: v2-07 §7 最小实现清单 #6-#7
> **对齐需求**: core-05-cross-cutting · core-03-traceability

### T-BM4-001 影响分析与查询接口

**描述**: 实现基于追踪链的影响分析 + RFC/Defect 查询接口

**输入**: v2-07 §7 接口清单 + v2-03 §3 M4 接口定义

**产出物**: 扩展 `src/core/change-mgr/` 相关文件

**功能**:
- `analyzeImpact(featureId, changedIds)` — 基于追踪矩阵分析变更影响范围，输出受影响的 DS/TASK/TC 列表
- `getRfc(rfcId, featureId)` — 查询单个 RFC 详情
- `getDefect(featureId, seq)` — 查询单个缺陷详情
- `getEscapeRate(featureId)` — 计算缺陷逃逸率

**验收标准**:
1. analyzeImpact 正确识别直接和间接影响的 ID
2. getRfc/getDefect 返回完整详情
3. getEscapeRate 计算逻辑与 v2-11 Q1 定义一致
4. 单测覆盖各接口正常/异常路径

**依赖**: T-AM4-002, T-AM4-004, T-AM2-004

---

### T-BM4-002 反向同步回填

**描述**: 实现 RFC 批准后的矩阵自动回填机制

**输入**: v2-07 §7 接口清单 #7 + §6.3 Sync 机制

**产出物**: 扩展 `src/core/change-mgr/sync.ts`

**功能**:
- `syncBackfill(featureId, filePath)` — 检测变更文件 → 反向查找关联 ID → 自动更新追踪矩阵中受影响行的 status
- RFC approved 后自动触发回填
- 回填结果写入 findings.md 审计记录

**验收标准**:
1. 回填后矩阵 status 正确更新
2. 审计记录写入 findings.md
3. 单测覆盖正常回填/无关联 ID/冲突场景

**依赖**: T-AM4-001, T-AM4-002, T-AM2-004

---

## 四、M7 ToolIntegration — 工具集成（T-BM7-xxx）

> **对齐技术方案**: v2-06 §7 Hook 双层执行
> **对齐需求**: core-05-cross-cutting

### T-BM7-001 Git Hook 安装与管理

**描述**: 实现 Layer B Git Hook 的安装、卸载、校验

**输入**: v2-06 §7.1-7.4 Hook 定义

**产出物**: `src/core/tool-integration/hook-installer.ts`

**功能**:
- `installHooks()` — 安装 4 个 Git Hook:
  - prepare-commit-msg: 从分支名或 `.spec-first/current` + `task_plan.md` 提取当前 TASK ID，自动预填前缀 + traces trailer
  - commit-msg: 校验 commit message 格式（至少一条合法 ID 标识），不通过时输出期望格式 + 当前可用 TASK ID 列表
  - pre-push: 增量 SCA（调用 `matrix check` 增量路径）
  - CI Pipeline: PR 创建/更新时全量校验
- `uninstallHooks()` — 卸载所有 Hook
- `checkHooks()` — 检查 Hook 安装状态

**验收标准**:
1. 4 个 Hook 正确安装到 `.git/hooks/`
2. prepare-commit-msg 自动预填 TASK ID
3. commit-msg 校验不通过时拒绝提交并输出修复提示
4. pre-push 增量 SCA 不通过时阻断 push
5. 单测覆盖安装/卸载/校验全路径

**依赖**: T-AM2-004, T-AM1-006

---

### T-BM7-002 Commit 命令实现

**描述**: 实现规范化 commit 命令

**输入**: v2-03 §2.12 commit

**产出物**: `src/cli/commands/commit.ts`

**命令**:
```bash
spec-first commit [--message "<msg>"] [--task <taskId>]
```

**功能**:
- `--message` 可选，未提供时打开编辑器
- `--task` 可选，未提供时从分支名或 `.spec-first/current` + `task_plan.md` 自动推断当前 TASK ID
- 自动注入 `[TASK-<FEAT>-NNN]` 前缀到 subject line
- 自动注入 `traces: TASK-<FEAT>-NNN` trailer
- 调用 `git commit` 执行提交
- 提交前校验 TASK ID 合法性

**验收标准**:
1. commit message 格式符合 Hook 校验规则
2. TASK ID 不合法时返回 VALIDATION_ERROR
3. 单测验证 message 格式化逻辑

**依赖**: T-AS-005, T-AM2-002

---

### T-BM7-003 Doctor 完整版

**描述**: 扩展 doctor 命令，补全 Hook 状态检查和 Gate 降级检测

**输入**: v2-03 §2.10 doctor

**产出物**: 扩展 `src/cli/commands/doctor.ts`

**功能**:
- 在基础版（T-ACL-002）基础上追加:
  - Hook 安装状态检查（4 个 Git Hook 是否就绪）
  - Gate 降级状态检测（pilot_mode 是否开启）
  - 模板版本差异检测（major 升级时输出迁移建议）
  - 运行态三文件容量检查（超 500 行提示归档）

**验收标准**:
1. 完整诊断报告包含所有检查项
2. 每项检查有 PASS/WARNING/ERROR 三级状态
3. 迁移建议可操作

**依赖**: T-ACL-002, T-BM7-001

---

### T-BM7-004 Feature CLI 命令实现

**描述**: 实现 feature（3 子命令）共 3 个 CLI 命令

**输入**: v2-03 §2.11 feature

**产出物**: `src/cli/commands/feature.ts`

**命令清单**:
```bash
spec-first feature list
spec-first feature current
spec-first feature switch <featureId>
```

**功能**:
- `feature list` — 列出所有 Feature
- `feature current` — 显示当前 Feature 详情
- `feature switch` — 切换当前 Feature（更新 `.spec-first/current`）

**验收标准**:
1. 3 个命令均可通过 CLI 调用
2. list 输出格式化摘要表（ID + 标题 + 阶段 + 更新时间）
3. switch 更新 current 文件
4. 参数校验 + ExitCode 正确

**依赖**: T-AS-005, T-AM1-006

---

### T-BM7-005 Layer A AI Runtime Hook

**描述**: 实现 AI Runtime Hook 注册与执行机制（PreToolUse / PostToolUse / Stop）

**输入**: core-05 §3.1 Hook 双层体系 · v2-06 §7 Hook 定义

**产出物**: `src/core/tool-integration/ai-runtime-hook.ts`

**功能**:
- `registerAIHooks()` — 注册三种 AI Runtime Hook 到宿主环境
- PreToolUse: 写操作前自动校验当前阶段 Gate 条件，不满足时软阻断并输出提示
- PostToolUse: 写操作后自动更新追踪矩阵（traces 注入）
- Stop: 会话结束时自动追加 progress.md 摘要
- Hook 不存在时降级: 所有 Gate 校验由 Layer B 承载，输出 warning

**验收标准**:
1. 三种 Hook 正确注册到 Claude Code Hooks 配置
2. PreToolUse 软阻断时输出修复建议
3. PostToolUse 自动注入 traces 到追踪矩阵
4. 宿主不支持 AI Hook 时优雅降级（warning + Layer B 兜底）
5. 单测覆盖注册/触发/降级三种场景

**依赖**: T-BM3-001, T-AM2-004, T-BM7-001

---

## 五、Skill Runtime — Skill 运行时（T-BSK-xxx）

> **对齐技术方案**: v2-02 Skill 运行时与路由
> **对齐需求**: aux-01-skill-system

### T-BSK-001 命令解析与路由分发

**描述**: 解析 `/spec-first:*` 命令，分发到 Skill 路由或 Runtime 路由

**输入**: v2-02 §2 路由模型

**产出物**: `src/core/skill-runtime/dispatcher.ts`

**功能**:
- 解析 `namespace:subcommand [args]` 格式
- Skill 路由: 加载 `.md` Skill 文件 → 进入 6 阶段模型
- Runtime 路由: 直接映射 CLI 原子命令
- 语义化子命令映射: `/spec-first:rfc approve` → `rfc transition <rfcId> approved`，`/spec-first:rfc reject` → `rfc transition <rfcId> rejected` 等便捷入口
- Skill 文件定位: 项目本地 `skills/` 优先 → 包内 `skills/` fallback → SKILL_NOT_FOUND

**验收标准**:
1. Skill 路由和 Runtime 路由正确分发
2. Skill 文件不存在时返回 SKILL_NOT_FOUND
3. 本地 Skill 优先于包内 Skill
4. 语义化子命令正确映射到 CLI 原子命令
5. 单测覆盖两种路由路径 + 语义映射

**依赖**: T-AS-005

---

### T-BSK-002 6 阶段执行状态机

**描述**: 实现 Skill 的 6 阶段执行模型（P0-P5）

**输入**: v2-02 §3 6 阶段执行模型

**产出物**: `src/core/skill-runtime/phase-machine.ts`

**功能**:
- Phase 状态定义: P0_LOCATE → P1_CONTEXT → P2_GENERATE → P3_CONFIRM → P4_WRITE → P5_SIDE_EFFECT → DONE / ABORTED
- 合法转换表（含 P3→P2 修改意见回退、P3→ABORTED 用户拒绝）
- `confirmationGuard` — Phase 3 确认守卫，未收到确认口令时阻断向 P4 转换
- P4_WRITE 前置守卫: 进入 P4 前自动检查运行态三文件（progress.md / findings.md / task_plan.md）行数，超 500 行时自动保留最近 200 行、历史归档到 `<filename>-YYYY-MM.md`（对齐 v2-10 §6.4 容量治理）
- 最大修订轮次: 5 轮，超过提示二选一

**验收标准**:
1. 所有合法转换通过
2. 非法转换阻断
3. confirmationGuard 正确阻断未确认的 P3→P4 转换
4. P4 前置归档: 超 500 行文件自动归档，保留最近 200 行
5. 参数化测试覆盖全部转换组合

**依赖**: T-AS-002

---

### T-BSK-003 confirm_policy 评估器

**描述**: 基于四维度输入自动判定确认策略

**输入**: v2-02 §4.1-4.3 三档策略 + 自动判定矩阵

**产出物**: `src/core/skill-runtime/confirm-policy.ts`

**功能**:
- `evaluatePolicy(mode, size, hasNfrSec, hasNewExternalApi)` — 四维度判定
- 判定矩阵:
  - Mode N → strict
  - Mode I + Size S + 无 NFR-SEC + 无新外部接口 → auto
  - Mode I + Size S + 有 NFR-SEC 或新外部接口 → strict
  - Mode I + Size M/L → assisted
- auto 执行后写入 findings.md 审计记录

**验收标准**:
1. 四维度组合判定正确
2. 安全关键/外部接口变更强制 strict
3. auto 审计记录写入 findings.md
4. 参数化测试覆盖全部组合

**依赖**: T-BSK-002, T-AS-003

---

### T-BSK-004 16 Skill 文件编写

**描述**: 编写 16 个 Skill 的 SKILL.md 文件

**输入**: v2-02 §2.1 路由分类表 + aux-01 Skill 系统

**产出物**:
```text
skills/spec-first/
├── 01-init/SKILL.md
├── 02-catchup/SKILL.md
├── 03-spec/SKILL.md
├── 04-design/SKILL.md
├── 05-research/SKILL.md
├── 06-task/SKILL.md
├── 07-code/SKILL.md
├── 08-code-review/SKILL.md
├── 09-test/SKILL.md
├── 10-archive/SKILL.md
├── 11-plan/SKILL.md
├── 12-verify/SKILL.md
├── 13-orchestrate/SKILL.md
├── 14-status/SKILL.md
├── 15-doctor/SKILL.md
└── 16-sync/SKILL.md
```

**Legacy Skill 说明**: 目录中另有 8 个 legacy Skill（00-session-catchup、01-spec-write、02-design-write、03-research、04-task-decompose、05-code-trace、06-test-design、07-archive），为 v1 时期遗留，已被上述 16 个 Skill 功能覆盖，后续版本清理移除。

**每个 Skill 文件包含**:
- 触发条件（对应阶段约束）
- 6 阶段执行指令（Phase 0-5 具体行为）
- 依赖的 CLI 命令列表
- 产出物写入路径
- confirm_policy 建议

**code-review Skill 额外要求**:
- `08-code-review/references/` 子目录包含 4 份审查参考清单:
  - `solid-checklist.md` — SOLID 原则检查清单
  - `security-checklist.md` — 安全审查清单
  - `performance-checklist.md` — 性能审查清单
  - `testing-checklist.md` — 测试覆盖审查清单

**验收标准**:
1. 16 个 Skill 文件均可被 Dispatcher 正确加载
2. 每个 Skill 的阶段约束与状态机一致
3. CLI 命令引用正确（无不存在的命令）
4. 编排 Skill（orchestrate/plan/verify）正确调度阶段 Skill
5. code-review Skill 的 references/ 目录包含 4 份审查清单

**依赖**: T-BSK-001 ~ T-BSK-003

---

### T-BSK-005 Skill 联调与集成测试

**描述**: 16 Skill 与 CLI 层的端到端联调

**输入**: v2-02 §6 Skill 编排关系

**产出物**: `tests/integration/skill-integration.test.ts`

**功能**:
- 验证日常最小路径: init → plan → code → code-review → verify
- 验证编排 Skill 调度: orchestrate 正确调度阶段 Skill
- 验证独立 Skill: catchup/status/doctor/sync 不受阶段约束
- 验证 Phase 3 交互: 确认/拒绝/修改意见闭环

**验收标准**:
1. 日常最小路径端到端走通
2. 编排 Skill 按正确顺序调度
3. Phase 3 交互协议正确（Y/N/修改意见）
4. 所有 CLI 命令调用返回预期 ExitCode
5. Codex CLI 环境下 Skill 文件可被正确加载和执行（兼容性验证）

**依赖**: T-BSK-004, 所有 CLI 命令任务

---

### T-BSK-006 Skill 构建与部署脚本

**描述**: 实现开发态 Skill 到部署态的自动展平构建

**输入**: aux-01 §Skill 文件规范

**产出物**: `scripts/build-skills.ts`

**功能**:
- 开发态路径: `skills/spec-first/<NN>-<cmd>/SKILL.md`
- 部署态路径: `.claude/commands/spec-first/<cmd>.md`
- 构建脚本自动展平: 去除序号前缀，复制到部署目录
- 同时复制 references/ 子目录（如有）
- 集成到 `pnpm run build` 流程

**验收标准**:
1. 构建后 16 个 Skill 文件正确展平到部署目录
2. references/ 子目录正确复制
3. 部署态文件可被 Claude Code 识别调用
4. 幂等性: 重复构建不产生差异

**依赖**: T-BSK-004, T-AS-001

---

### T-BM3-005 GoLive 降级策略

**描述**: 实现 GL-01~GL-04 未通过时的自动降级策略

**输入**: v2-12 §6 最小实现清单 #4

**产出物**: `src/core/gate-engine/golive.ts`

**功能**:
- `applyDegradation(glResult)` — GL 未通过时执行降级:
  - 修改 confirm_policy 为 strict（禁止 auto 确认）
  - 禁止 auto advance（需手动 --force 推进）
  - 写入 findings.md 降级审计记录
- 降级状态持久化到 stage-state.json

**验收标准**:
1. GL 未通过时 confirm_policy 自动切换为 strict
2. 降级后 advance 需 --force 才能推进
3. 降级审计记录写入 findings.md
4. 单测覆盖降级/恢复场景

**依赖**: T-BM3-004, T-BSK-003

---

### T-BM3-006 三级回退策略

**描述**: 实现 GoLive 失败时的三级回退触发逻辑

**输入**: v2-12 §6 最小实现清单 #5

**产出物**: `src/core/gate-engine/rollback.ts`

**功能**:
- L1 配置回退: 回滚配置变更（feature flag 关闭）
- L2 版本回退: 回滚到上一个稳定版本
- L3 数据回退: 回滚数据变更（需人工确认）
- `suggestRollback(glResult)` — 根据 GL 失败项推荐回退级别
- 回退操作记录写入 golive-history.jsonl

**验收标准**:
1. L1/L2/L3 三级回退策略正确触发
2. 回退建议与 GL 失败项匹配
3. 回退记录写入 golive-history.jsonl
4. 单测覆盖三级回退场景

**依赖**: T-BM3-004, T-AS-004

---

## 六、阶段 B 任务总览

### 任务统计

| 模块 | 任务数 | 编号范围 |
|------|--------|----------|
| M3 GateEngine | 6 | T-BM3-001 ~ T-BM3-006 |
| M4 ChangeMgr 补充 | 2 | T-BM4-001 ~ T-BM4-002 |
| M5 AIOrchestrator | 5 | T-BM5-001 ~ T-BM5-005 |
| M6 MetricsEngine | 3 | T-BM6-001 ~ T-BM6-003 |
| M7 ToolIntegration | 5 | T-BM7-001 ~ T-BM7-005 |
| Skill Runtime | 6 | T-BSK-001 ~ T-BSK-006 |
| **合计** | **27** | — |

### 关键路径

```text
T-BM3-001 → T-BM3-002
         → T-BM3-003
         → T-BM3-004 → T-BM3-005
                     → T-BM3-006

T-BM5-001 → T-BM5-002
         → T-BM5-003
T-AS-004 → T-BM5-004
T-BM5-001 ~ T-BM5-004 → T-BM5-005

T-BM6-001 → T-BM6-002 → T-BM6-003

T-BM7-001 → T-BM7-003
         → T-BM7-005
T-BM7-002（独立）
T-BM7-004（独立）

T-AM4-002 + T-AM4-004 → T-BM4-001
T-AM4-001 + T-AM4-002 → T-BM4-002

T-BSK-001 → T-BSK-002 → T-BSK-003 → T-BSK-004 → T-BSK-005
                                              → T-BSK-006
```

### CLI 命令清单（14 个 CLI 命令 + 1 个 Runtime 入口）

| # | 命令 | 来源任务 |
|---|------|----------|
| 1 | `gate check` | T-BM3-004 |
| 2 | `gate history` | T-BM3-004 |
| 3 | `gate conditions` | T-BM3-004 |
| 4 | `golive check` | T-BM3-004 |
| 5 | `ai context` | T-BM5-005 |
| 6 | `ai catchup` | T-BM5-005 |
| 7 | `ai stats` | T-BM5-005 |
| 8 | `metrics report` | T-BM6-003 |
| 9 | `metrics health` | T-BM6-003 |
| 10 | `feature list` | T-BM7-004 |
| 11 | `feature current` | T-BM7-004 |
| 12 | `feature switch` | T-BM7-004 |
| 13 | `commit` | T-BM7-002 |
| 14 | `doctor`（完整版） | T-BM7-003 |
| 15 | Skill Runtime 入口 | T-BSK-001 |

