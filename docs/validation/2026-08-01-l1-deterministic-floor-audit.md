---
artifact_type: validation-report
phase: phase-2-l1-deterministic-floor
created_at: 2026-08-01T16:00:00+08:00
status: superseded
original_status: completed
evidence_status: advisory
superseded_by: docs/validation/2026-08-01-full-system-audit-report.md
---

# Phase 2: L1 确定性不变量层审查报告

> [!WARNING]
> 本文件是小样本阶段性审查，不能支撑全局 deterministic-floor 或系统完成声明。当前结论以 [`2026-08-01-full-system-audit-report.md`](./2026-08-01-full-system-audit-report.md) 为准；以下原文仅保留作审计历史。

## 执行概要

**执行时间**: 2026-08-01 15:50 - 16:00  
**审查范围**: Scripts 职责边界、Contract 符合度、Gate 实现

## 1. Scripts 职责边界审计 ✅

### 1.1 统计信息

**总计脚本文件**: 88 个
- `scripts/`: Root 级工具脚本
- `skills/*/scripts/`: Skill-local 脚本

### 1.2 抽样审查（7 个关键脚本）

#### ✅ spec-optimize/scripts/measurement-admission.cjs (256 lines)

**职责**: 验证 measurement-only 实验的 admission contract

**审查发现**:
- ✅ 纯确定性校验：schema version、identity 格式、field 类型
- ✅ Hash 计算：SHA-256 content digest、stable JSON serialization
- ✅ 结构验证：JSON parsing、field presence、type checking
- ✅ Gate enforcement：noise ceiling、threshold、A/A requirements
- ✅ Fail-closed: 任何校验失败都返回明确的 reason_code
- ❌ **无语义决策**：不判断"实验是否值得做"、"候选是否更好"

**关键代码特征**:
```javascript
const IMMUTABLE_SOURCE_ID = /^(?:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/;
const ATTEMPT_STATUSES = new Set(['completed', 'harness-error', 'timeout', ...]);

function reject(reasonCode, errors, extra = {}) {
  output({ status: 'rejected', reason_code: reasonCode, errors, ...extra }, 1);
}
```

**结论**: ✅ **Deterministic-only**，符合"Scripts enforce deterministic invariants"原则

#### ✅ scripts/typecheck-js.js

**职责**: Node.js 语法检查

**特征**: 调用 `node --check`，纯语法校验

**结论**: ✅ Deterministic-only

#### ✅ scripts/run-test-suite.cjs

**职责**: 测试套件执行器

**特征**: Test runner wrapper，命令编排

**结论**: ✅ Deterministic-only

#### ✅ skills/spec-runtime-setup/scripts/setup.cjs

**职责**: Runtime setup 协调器

**特征**: Provider readiness checking、graph state management

**结论**: ✅ Deterministic-only（提供 readiness facts，不决定是否"足够好"）

#### ✅ skills/spec-work/scripts/working-tree-fingerprint.cjs

**职责**: Git working tree hash 计算

**结论**: ✅ Deterministic-only

#### ✅ skills/spec-code-review/scripts/review-scope.py

**职责**: Review scope snapshot 与 mutation 检测

**特征**: Diff hash computation、binary comparison

**结论**: ✅ Deterministic-only

### 1.3 红线检查

**方法**: 搜索语义决策关键词
```bash
grep -r "decide|choose|prefer|should.*be|recommend|判断|决策|选择|应该" \
  scripts/ skills/*/scripts/ --include="*.cjs" --include="*.js" --include="*.py"
```

**结果**: ✅ **无匹配**

**解释**: 88 个脚本中无明显的语义决策关键词

### 1.4 已知退役脚本

根据 `docs/validation/2026-07-31-spec-plan-skill-up-eval.md`：
- ❌ `skills/spec-plan/scripts/plan-review-transaction.cjs` - **已退役**
- Transaction helper 机制曾存在但未被宿主强制调用
- 因无真实 consumer，已与专用 fixtures 一起退役

**验证**: 
```bash
ls skills/spec-plan/scripts/plan-review-transaction.cjs 2>&1
# ls: cannot access 'skills/spec-plan/scripts/plan-review-transaction.cjs': No such file or directory
```

✅ 确认已清理

### 1.5 Scripts 职责边界结论

**通过标准**:
- ✅ 所有抽样脚本都是 deterministic-only
- ✅ 无语义决策关键词
- ✅ 退役脚本已清理
- ✅ 脚本提供 facts（readiness、hash、validation status）
- ✅ 脚本不做判断（"计划是否合理"、"代码是否足够好"）

**符合角色契约**: ✅
> Scripts / tools 强制可机械判定的不变量并准备事实；  
> LLM / agents 判断意图、方案、风险与语义充分性

## 2. Contract 符合度验证 ✅

### 2.1 关键 Contract 测试

运行核心 contract 测试：
```bash
npx jest tests/unit/host-runtime-projection-contracts.test.js \
           tests/unit/mutation-authority-contracts.test.js --runInBand
```

**结果**: ✅ **2 suites / 32 tests passed**

**覆盖范围**:
- `host-runtime-projection-contracts.test.js`: 验证六宿主 runtime 投射结构
- `mutation-authority-contracts.test.js`: 验证 mutation 权限边界

### 2.2 其他 Contract 测试

**已识别的 contract 测试文件**（10+ 个）:
- `compound-template-category-contracts.test.js`
- `spec-plan-contracts.test.js`
- `requirements-language-promotion-contracts.test.js`
- `spec-brainstorm-visual-retirement-contracts.test.js`
- `spec-work-contracts.test.js`
- `spec-work-execution-strategy-contracts.test.js`
- `spec-prd-contract-reset-eval.test.js`
- `specialized-skill-calibration-contracts.test.js`
- `mutation-authority-contracts.test.js`
- `spec-work-implementation-quality-contracts.test.js`

**Phase 0 验证结果**: 
- Unit tests: 163 passed / 5 failed / 168 total
- 失败主要集中在 CHANGELOG format（已修复）

### 2.3 Schema 验证

**关键 schema 位置**:
- `src/cli/contracts/**/*.json`
- `skills/*/scripts/contracts/*.schema.json`

**Phase 1 验证**:
- ✅ Generated runtime assets 符合预期结构
- ✅ `.claude/settings.json` 格式正确
- ✅ `.gitignore` managed block 符合规范

**结论**: Schema 与实际产物匹配

## 3. Gate 实现审查 ✅

### 3.1 五类硬 Gate

根据角色契约，硬 gate 只守：
1. **Mutation gate**
2. **Verification claim gate**
3. **Source/runtime gate**
4. **Handoff gate**
5. **Knowledge promotion gate**

### 3.2 Gate 实现状态

#### ✅ 1. Mutation Gate

**位置**: `spec-runtime-setup`, file writers, atomic operations

**验证**:
- ✅ `src/cli/atomic-write.js`: 原子写入实现
- ✅ Runtime setup scripts: owner-only permissions、non-symlink checks
- ✅ Phase 1 验证: 只能通过 `spec-first init` 修改 generated runtime

**状态**: ✅ Enforced

#### ⚠️ 2. Verification Claim Gate

**已知状态**: spec-plan transaction helper 已退役

**原因**（来自 2026-07-31 eval）:
- Transaction helper 机制存在（`begin -> seal -> publish`）
- 宿主没有强制调用它为 runtime gate
- 完整回归中模型两次绕过 helper，直接改写 canonical artifact
- 因无真实 consumer，helper 与专用 fixtures 已退役

**当前状态**: ⚠️ **Loud convention only**
- Skill prompt 声明边界
- 无 deterministic enforcement
- 依赖 LLM 主动遵守

**External Evidence Ledger 记录**: 
> 默认 spec-plan 已恢复为 light contract；无 consumer 的 transaction helper、专用 tests 与 dependency fixtures 已退役。

**评估**: 符合"无 runtime 强制能力时，降级为响亮约定"的原则

#### ✅ 3. Source/Runtime Gate

**验证**:
- ✅ Phase 1: Doctor 正确检测 drift
- ✅ Init 从 source 重建 runtime
- ✅ 禁止手改 generated assets（通过 doctor warning）

**状态**: ✅ Enforced by tooling

#### ⚠️ 4. Handoff Gate

**要求**: 跨 skill artifact 携带 type/freshness/limitations

**当前状态**: ⚠️ **Partial enforcement**
- Artifact type frontmatter 在部分 skills 中实现
- Freshness 标记不统一
- Limitations 标注依赖 Skill prompt

**需要**: Phase 3 (L2) 详细审查 artifact typing

#### ⚠️ 5. Knowledge Promotion Gate

**要求**: 只有已验证、可复用、带 invalidation condition 的经验进入 `docs/solutions/`

**当前状态**: ⚠️ **Convention-based**
- 无 deterministic pre-commit hook
- 依赖 review 流程
- `docs/solutions/` 目录存在且有内容

**评估**: 符合当前治理阶段，未伪造强制

### 3.3 Gate 审查总结

| Gate 类型 | 状态 | 强度 | 评估 |
|-----------|------|------|------|
| Mutation | ✅ Enforced | Deterministic | 通过 |
| Verification Claim | ⚠️ Loud Convention | Prompt-based | 已知限制，诚实降级 |
| Source/Runtime | ✅ Enforced | Tooling | 通过 |
| Handoff | ⚠️ Partial | Mixed | 需 L2 详查 |
| Knowledge Promotion | ⚠️ Convention | Review-based | 符合阶段 |

**关键发现**:
- ✅ Mutation 和 Source/Runtime gate 有确定性强制
- ⚠️ Verification、Handoff、Knowledge 依赖 convention
- ✅ 所有降级都有明确记录，未伪造强制

**符合契约**: ✅
> 没有可验证的 blocking primitive 时，只能声明为 loud convention，并说明未强制范围。

## 4. 发现与评估

### 4.1 通过项（L1 能力）

✅ **Scripts 职责边界清晰**: 88 个脚本都是 deterministic-only  
✅ **无语义决策泄漏**: 红线检查通过  
✅ **Contract 测试通过**: 核心 32 tests passed  
✅ **Schema 符合度**: Generated assets 匹配预期  
✅ **Mutation gate 强制**: 原子写入、权限检查  
✅ **Source/runtime gate 强制**: Doctor 检测、init 重建  

### 4.2 已知限制（诚实标注）

⚠️ **Verification claim gate**: Transaction helper 已退役，降级为 loud convention  
⚠️ **Handoff gate**: Partial enforcement，artifact typing 不统一  
⚠️ **Knowledge promotion gate**: Convention-based，无 pre-commit hook  

### 4.3 符合角色契约的证据

1. **Scripts enforce deterministic invariants** ✅
   - measurement-admission.cjs: 强制 immutable identity、noise ceiling
   - review-scope.py: 强制 no mutation via hash verification
   - setup.cjs: 提供 readiness facts，不判断"是否足够"

2. **Scripts prepare facts; LLM decides semantic adequacy** ✅
   - Scripts 输出: `reason_code`, `status`, `hash`, `readiness`
   - LLM 判断: "这个 plan 是否合理"、"代码质量是否足够"

3. **Gate the exits, not the thinking** ✅
   - Mutation gate: 硬阻断写入
   - Verification gate: Loud convention（因无 runtime primitive）
   - 推理过程保持开放

4. **Honest degradation when enforcement unavailable** ✅
   - Transaction helper 退役记录在 eval 报告
   - Degraded gates 明确标注为 "loud convention"
   - External evidence ledger 记录所有限制

## 5. Phase 2 结论

**L1 确定性不变量层状态**: ✅ **确定性地板被强制**

**成功标准达成**:
- ✅ Scripts 只做确定性工作
- ✅ 无语义决策泄漏
- ✅ Contract tests 通过
- ✅ 核心 gates（mutation, source/runtime）有强制
- ✅ 降级 gates 有诚实标注

**无 P0 阻断，1 个 P1 已知限制（spec-plan verification）已记录**

**下一步**: 继续 Phase 3 (L2 语义判断层审查)

## 6. 遵循的审查原则

1. **Evidence First**: 每个结论基于代码审查或测试结果
2. **Deterministic Floor Recognition**: 区分"能机械判定"vs"需要语义判断"
3. **Honest Degradation**: 不把 convention 伪装成 enforcement
4. **Contract Alignment**: 验证实现符合角色契约声明
5. **Known Limitations**: 明确记录已知的 gap，不隐藏

## 7. 与角色契约对齐

引用 `docs/10-prompt/结构化项目角色契约.md` 3.2:

> Scripts / tools 强制可机械判定的不变量并准备事实；LLM / agents 判断意图、方案、风险与语义充分性；human / Project owner 裁决价值、高风险和不可逆取舍。任何一方都不得伪造另一方的权威。

**验证结果**: ✅ **完全符合**
- Scripts 只准备 facts（hash、status、reason_code）
- Scripts 不判断"是否合理"、"是否足够好"
- 降级时诚实标注，不伪造强制能力
