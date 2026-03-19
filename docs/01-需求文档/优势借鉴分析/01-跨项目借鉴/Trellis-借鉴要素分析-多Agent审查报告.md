# Trellis 借鉴要素分析 - 多Agent审查报告

> **审查日期**: 2026-03-02 | **审查模式**: 三线并行（架构一致性 / 代码实现一致性 / 安全与可执行性）
> **审查对象**: `Spec-First 可借鉴 Trellis 的要素分析.md`

---

## 📋 审查结论总览

| 审查维度 | 总体评价 | 关键发现数 |
|----------|---------|-----------|
| **架构一致性** | ✅ 整体准确 | P0: 3 / P1: 3 / P2: 3 |
| **代码实现一致性** | ⚠️ 部分偏差 | P0: 2 / P1: 3 / P2: 2 |
| **安全与可执行性** | ⚠️ 存在风险 | P0: 2 / P1: 3 / P2: 2 |

**核心结论**：文档识别的 Trellis 借鉴要素价值明确，架构描述与实际代码高度一致，但存在以下关键问题需在实施前解决：

1. **"AI 永不提交" 缺少技术保障**（P0 阻塞）
2. **Spec-First 上下文机制描述偏悲观**（P0 文档修正）
3. **JSONL 注入与 context-pack 边界不清**（P0 设计决策）
4. **工作量估算偏乐观**（P1 风险）

---

## 🔍 一、架构一致性审查

### 1.1 Trellis 架构描述验证

| # | 要素 | 一致性 | 差异说明 |
|---|------|--------|---------|
| 1 | Code-Spec vs Guide 分离 | ✅ | 目录结构 `spec/frontend/`, `spec/backend/`, `spec/guides/` 与描述一致 |
| 2 | JSONL 分层注入 | ✅ | 实际支持更多 agent 类型（implement/check/debug/research/cr/finish） |
| 3 | "AI 永不提交" 原则 | ✅ | `onboard.md:258` 和 `inject-subagent-context.py:485` 明确声明 |
| 4 | Break-the-Loop 调试闭环 | ✅ | 五维度分析框架完整 |
| 5 | Cross-Layer Check | ⚠️ | 实际为 4 维度（A-D），文档暗示可能有 E |
| 6 | Brainstorm 流程 | ⚠️ | 实际是 9 步（Step 0-8），文档称"七步流程" |
| 7 | 任务复杂度分类 | ✅ | 四类分类准确 |
| 8 | Code-Spec 深度规则 | ✅ | 7 部分强制输出与描述一致 |
| 9 | trellis-meta vs local 分离 | ✅ | 分离原则和目录结构正确 |
| 10 | Onboard 新人引导 | ✅ | 三部分结构完整，比描述更详细 |

**准确率**: 8/10 完全一致，2/10 有细微偏差

### 1.2 Spec-First 架构描述验证

| # | 要素 | 一致性 | 差异说明 |
|---|------|--------|---------|
| 1 | 8+2 阶段状态机 | ✅ | Stage 枚举 00_init 到 09_cancelled 正确 |
| 2 | 19 个 Skill | ⚠️ | 实际目录包含 22 个子目录（00-first 到 21-analyze） |
| 3 | Gate 引擎 | ✅ | 条件定义 G-INIT-01 到 G-REL-02 完整 |
| 4 | Skill Runtime 三层路由 | ✅ | SEMANTIC_MAP → RUNTIME_COMMANDS → resolveSkillPath 正确 |
| 5 | Context Pack 机制 | ✅ | 双区结构 + STAGE_LAYERS 分层正确 |
| 6 | 无 Code-Spec vs Guide 分离 | ✅ | Gap 诊断准确，Skill 混合执行步骤和思考提示 |
| 7 | 上下文注入依赖 AI 主动加载 | ⚠️ | **描述偏悲观**，代码已有 STAGE_LAYERS 分层和 sliceContext 动态裁剪 |
| 8 | 无专门调试流程 | ⚠️ | 有基础调试流程，但缺乏结构化调试闭环 |
| 9 | 无"AI 永不提交"原则 | ✅ | Gap 诊断准确，07-code/SKILL.md 无明确声明 |
| 10 | 追溯 ID 体系 | ✅ | C1-C9 覆盖率计算正确 |

**准确率**: 6/10 完全一致，4/10 有细微偏差或补充

### 1.3 借鉴映射合理性

| # | 映射建议 | 合理性 | 优化建议 |
|---|----------|--------|---------|
| 1 | Code-Spec vs Guide 分离 → 全部 Skill | ✅ | 合理，需系统性重构 |
| 2 | JSONL 分层注入 → skill-runtime | ✅ | 合理，需扩展 context-pack |
| 3 | "AI 永不提交" → /spec-first:code | ✅ | 建议同时加入 SHARED.md |
| 4 | Break-Loop → 新增 skill | ✅ | 建议编号 22-break-loop |
| 5 | Cross-Check → 新增 skill | ✅ | 建议集成到 Gate 引擎 |
| 6 | Brainstorm → /spec-first:spec | ⚠️ | **建议独立为 /spec-first:brainstorm** |
| 7 | 任务复杂度分类 → orchestrate | ✅ | 可扩展 orchestrate-args.ts |
| 8 | Code-Spec 深度规则 → Gate 引擎 | ✅ | 需要静态分析支持 |
| 9 | Meta/Local 分离 → 版本管理 | ⚠️ | P2 优先级合理，可延后 |
| 10 | Onboard → 新增 skill | ✅ | 建议编号 23-onboard |

---

## 🔬 二、代码实现一致性审查

### 2.1 Trellis 代码验证

| 要素 | 代码证据位置 | 一致性 | 关键发现 |
|------|-------------|--------|---------|
| JSONL 分层注入 | `docs/.../Trellis/03-hooks/pre-tool-use.md:137-148` | 部分一致 | 原始 Python 代码不在本仓库，仅有分析文档 |
| Hook 机制 | `docs/.../Trellis/03-hooks/*.md` | 部分一致 | SessionStart/PreToolUse/SubagentStop 三层 Hook 架构正确 |
| Brainstorm 流程 | `docs/.../Trellis/01-commands/dev-commands.md:31-72` | 一致 | 流程描述完整 |
| Break-loop | `docs/.../Trellis/01-commands/check-commands.md:165-280` | 一致 | 五维度分析框架完整 |
| Cross-layer Check | `docs/.../Trellis/01-commands/check-commands.md:376-524` | 一致 | 维度 A/B/C/D 检查清单完整 |

**关键发现**：Trellis 原始代码（`.claude/hooks/*.py`）**不在本仓库**，文档基于源码分析。

### 2.2 Spec-First 代码验证

| 模块 | 代码位置 | 一致性 | 关键发现 |
|------|---------|--------|---------|
| Skill 分发 | `dispatcher.ts:26-39, 68-143` | 一致 | 三层路由完整实现 |
| 上下文注入 | `context-pack.ts:63-97, 102-156` | **部分不一致** | 文档说"依赖 AI 主动加载"，但代码已有 STAGE_LAYERS 分层 |
| 上下文裁剪 | `context-slicing.ts:42-110` | **文档遗漏** | 代码已实现动态裁剪（降级级别 0-3），文档未提及 |
| Gate 引擎 | `gate-evaluator.ts:39-100` | 一致 | 条件检查 + 豁免机制完整 |
| Hard-Gate | `hard-gate.ts:176-307` | 一致 | 阶段校验、高风险评估、Worktree First 已实现 |
| code skill | `07-code/SKILL.md:26-95` | **部分不一致** | **缺少 "AI 永不提交" 明确声明** |
| JSONL 使用 | `logger.ts:10-61`, `gate-evaluator.ts:388-389` | **用途不同** | Spec-First 用于审计日志，Trellis 用于上下文配置 |

### 2.3 落地建议可行性

| 建议项 | 改动范围准确性 | 工作量估算 | 风险点 |
|--------|--------------|-----------|--------|
| Code-Spec vs Guide 分离 | ✅ 准确 | ⚠️ 低估（2天→4天） | 需审查 22 个 Skill |
| JSONL 分层上下文注入 | ⚠️ 需澄清 | ✅ 合理（2天） | 与 context-pack 功能边界不清 |
| "AI 永不提交" 原则 | ✅ 准确 | ✅ 合理（0.5天） | 低风险 |
| Break-Loop skill | ✅ 准确 | ⚠️ 低估（1天→2天） | 需与 verify skill 协调 |
| Cross-Check skill | ✅ 准确 | ✅ 合理（1天） | 需与 gate-engine 集成 |
| Brainstorm 流程 | ✅ 准确 | ✅ 合理（1天） | 低风险 |
| 任务复杂度分类 | ✅ 准确 | ⚠️ 低估（1天→2天） | 可能影响编排流程 |
| Code-Spec 深度规则 | ✅ 准确 | ⚠️ 低估（1天→2天） | 需要静态分析支持 |

---

## 🔐 三、安全与可执行性审查

### 3.1 安全风险分析

| 风险类型 | 严重程度 | 风险描述 | 缓解建议 |
|----------|---------|---------|---------|
| **"AI 永不提交" 无技术保障** | 🔴 高 | 仅为约定原则，AI 可绕过执行 git commit | 在 hard-gate.ts 中增加 git commit/push 拦截 |
| **路径遍历** | 🟡 中 | JSONL `path` 字段未校验，可能读取 `../../../etc/passwd` | 实现路径白名单校验 |
| **命令注入** | 🟡 中 | Gate 的 `runCommandGate` 执行外部命令，命令来源可能被污染 | 命令白名单 + 特殊字符过滤 |
| **Hook 执行** | 🟡 中 | session-start.js 执行外部脚本，恶意目录可执行任意代码 | 验证脚本完整性（checksum） |
| **上下文注入污染** | 🟡 中 | JSONL 文件可被恶意修改，注入虚假规范 | JSONL 文件 checksum 校验 |
| **凭证泄露** | 🟡 中 | context-pack 读取文件时可能注入敏感信息 | 敏感文件黑名单过滤 |

### 3.2 可执行性评估

| 落地项 | 具体程度 | 可执行性评分 | 缺失项 |
|--------|---------|-------------|--------|
| P0-1: Code-Spec vs Guide 分离 | ✅ 明确 | 4/5 | 缺少现有 22 个 Skill 的分类清单 |
| P0-2: JSONL 分层注入 | ❌ 模糊 | **2/5** | 1) 存储位置 2) 与 context-pack 关系 3) Hook 触发机制 |
| P0-3: "AI 永不提交" | ✅ 明确 | **3/5** | **无技术保障方案** |
| P1-1: Break-Loop skill | ✅ 明确 | 4/5 | 缺少与 defect.ts 的集成方案 |
| P1-2: Cross-Check skill | ✅ 明确 | 3/5 | 缺少触发条件的技术实现 |
| P2-1: Meta/Local 分离 | ❌ 模糊 | **2/5** | 升级时合并策略未定义 |

### 3.3 兼容性检查

| 新增项 | 冲突项 | 冲突类型 | 解决方案 |
|--------|--------|---------|---------|
| JSONL 分层注入 | context-pack.ts | 功能重叠 | JSONL 作为 context-pack 输入源，而非替代 |
| 新增 4 个 skill | 现有 22 个 skill 编号 | 命名空间 | 使用 22+ 编号扩展 |
| Gate 规则扩展 | gate-evaluator.ts GATE_CONDITIONS | 结构兼容 | 新增条件向后兼容 |
| Brainstorm 七步流程 | 03-spec skill | 流程融合 | 建议独立为 /spec-first:brainstorm |

---

## 📝 四、文档修正建议

### 4.1 P0 - 必须修正

| # | 位置 | 问题 | 修正建议 |
|---|------|------|---------|
| 1 | Brainstorm 流程描述 | 称"七步流程"但实际是 9 步（Step 0-8） | 修正为"九步流程"或"Step 0-8 流程" |
| 2 | Spec-First 上下文机制 | 描述"依赖 AI 主动加载"、"没有分层机制" | 补充 STAGE_LAYERS 分层 + sliceContext 动态裁剪 |
| 3 | "AI 永不提交" | 仅描述原则，无技术保障方案 | 补充 hard-gate 拦截 + pre-commit hook 方案 |
| 4 | Skill 数量 | 称"19 个 Skill"但目录有 22 个 | 核实并更新数量 |

### 4.2 P1 - 建议修正

| # | 位置 | 问题 | 修正建议 |
|---|------|------|---------|
| 1 | Cross-Layer Check 维度 | 暗示有 E 维度，实际只有 A-D | 明确说明"四维度验证" |
| 2 | Brainstorm 映射位置 | 建议合并到 /spec-first:spec | 建议独立为 /spec-first:brainstorm |
| 3 | JSONL 用途说明 | 未区分 Spec-First 和 Trellis 的 JSONL 用途 | 补充说明：Spec-First 用于审计日志，Trellis 用于上下文配置 |
| 4 | 工作量估算 | 多项估算偏乐观 | 重估：P0 共 4.5 天 → 8.5 天，P1 共 5 天 → 8 天 |

### 4.3 P2 - 可选修正

| # | 位置 | 问题 | 修正建议 |
|---|------|------|---------|
| 1 | JSONL 支持的 agent 类型 | 仅提及 3 种，实际 6 种 | 补充完整列表：implement/check/debug/research/cr/finish |
| 2 | Meta/Local 分离方案 | 描述模糊 | 补充升级时定制保留的具体方案 |

---

## 🛠️ 五、落地建议修正

### 5.1 P0 行动项修正

| # | 原建议 | 修正后建议 | 工作量 |
|---|--------|----------|--------|
| 1 | 制定 Code-Spec vs Guide 分离规范（2天） | 同左 + 审查 22 个 Skill 并分类 | **4 天** |
| 2 | 实现 JSONL 分层上下文注入（2天） | **先完成设计决策**：JSONL 与 context-pack 边界 + 存储位置 + Hook 触发机制，再实现 | **3 天** |
| 3 | 在 /spec-first:code 中加入 "AI 永不提交" 原则（0.5天） | 同左 + **技术保障**（hard-gate 拦截 + pre-commit hook） | **1.5 天** |

### 5.2 P1 行动项修正

| # | 原建议 | 修正后建议 | 工作量 |
|---|--------|----------|--------|
| 1 | 创建 /spec-first:break-loop（1天） | 同左 + 与 defect.ts 和 verify skill 集成 | **2 天** |
| 2 | 创建 /spec-first:cross-check（1天） | 同左 + Gate 引擎触发条件 + 静态分析 | **2 天** |
| 3 | Brainstorm 流程引入 /spec-first:spec（1天） | **独立为 /spec-first:brainstorm**（编号 24） | **1.5 天** |
| 4 | 任务复杂度分类 → orchestrate（1天） | 同左 + Gate 引擎配合调整 | **2 天** |
| 5 | Code-Spec 深度规则 → Gate 引擎（1天） | 同左 + infra 变更检测机制 | **2 天** |

### 5.3 工作量重估

| 阶段 | 原估算 | 修正估算 | 增幅 |
|------|--------|---------|------|
| P0 | 4.5 天 | **8.5 天** | +89% |
| P1 | 5 天 | **9.5 天** | +90% |
| P2 | 3 天 | **4 天** | +33% |
| **总计** | **12.5 天** | **22 天** | +76% |

---

## ✅ 六、最终建议

### 6.1 实施前必须解决

1. **完成 JSONL 与 context-pack 设计决策**
   - JSONL 存储位置：`specs/{featureId}/context/{implement,check,debug}.jsonl`
   - 与 context-pack 关系：JSONL 作为 `buildReferences()` 输入源
   - Hook 触发：在 `skill-runtime.ts` 的 `assemblePrompt()` 阶段读取

2. **实现 "AI 永不提交" 技术保障**
   ```typescript
   // 在 hard-gate.ts 中增加
   const FORBIDDEN_COMMANDS = ['git commit', 'git push', 'git push --force'];
   export function detectForbiddenCommand(command: string): boolean {
     return FORBIDDEN_COMMANDS.some(cmd => command.includes(cmd));
   }
   ```

3. **更新文档反映 Spec-First 现有上下文机制**
   - 补充 STAGE_LAYERS 分层
   - 补充 sliceContext 动态裁剪
   - 修正 Skill 数量（22 个）

### 6.2 建议的执行顺序

```
Week 1: 设计决策 + 文档修正
  - JSONL 与 context-pack 设计评审
  - 文档 P0 修正（4 项）
  - "AI 永不提交" 技术保障方案

Week 2-3: P0 实施
  - Code-Spec vs Guide 分离规范 + 22 个 Skill 分类
  - JSONL 分层注入实现
  - "AI 永不提交" 原则 + 技术保障

Week 4-5: P1 实施
  - Break-Loop skill（22-break-loop）
  - Cross-Check skill（23-cross-check）
  - Brainstorm skill（24-brainstorm）← 独立而非合并
  - 任务复杂度分类
  - Code-Spec 深度规则

Week 6: P2 实施（可选）
  - Onboard skill（25-onboard）
  - Meta/Local 分离方案
```

### 6.3 文档价值评估

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构分析准确性 | ⭐⭐⭐⭐☆ | 8/10 要素描述准确 |
| Gap 诊断准确性 | ⭐⭐⭐⭐☆ | 核心诊断正确，部分描述偏悲观 |
| 落地建议可操作性 | ⭐⭐⭐☆☆ | 部分建议缺少具体实现路径 |
| 工作量估算准确性 | ⭐⭐☆☆☆ | 整体低估约 76% |
| 安全考虑完整性 | ⭐⭐⭐☆☆ | 缺少技术保障方案 |

**总体评价**：文档识别的 Trellis 借鉴要素价值明确，架构分析整体准确，是 Spec-First 改进的重要参考。建议在实施前完成设计决策和技术保障方案，并调整工作量预期。

---

> **审查完成** | 三线并行审查 | 2026-03-02
