# 实现方案：Dispatcher docs 降级（最小侵入式）

> **Feature**: FSREQ-20260310-SKILLREFINE-001
> **创建日期**: 2026-03-11
> **状态**: 待实现
> **方案**: 最小侵入式实现（方案 A）

---

## Context

基于审查报告的发现，需要实现：
- **runtime 缺失时自动读取 docs/first 作为降级来源**
- **维持现有 runtime notice 注入机制**
- **不新建文件，不修改类型，不破坏现有字段命名**

已确认策略：允许在 runtime 缺失时使用 docs/first 作为降级来源

---

## 设计决策

### 为什么选择最小侵入式方案？

| 维度 | 新建服务方案 | 最小侵入方案 |
|------|-------------|-------------|
| 新增文件 | ❌ 1 个 | ✅ 0 个 |
| 代码行数 | ❌ ~300 行 | ✅ ~50 行 |
| 类型变更 | ❌ 新增 3 个类型 | ✅ 0 个 |
| 字段命名变更 | ❌ 破坏性变更 | ✅ 保持现有 |
| docs 解析复杂度 | ❌ 高（完整解析） | ✅ 低（只解析摘要） |
| 维护成本 | ❌ 高 | ✅ 低 |
| 实现风险 | ❌ 高 | ✅ 低 |

### 关键发现

1. **已有函数可复用**：`first-runtime-store.ts` 已有 `readFirstStageViews`、`readFirstRuntimeIndex`
2. **docs 格式复杂**：实际是中英文混合格式，完整解析成本高
3. **字段命名已稳定**：现有 dispatcher 使用 snake_case，改为 camelCase 是破坏性变更

---

## Implementation Plan

### Phase 1: 添加 docs 解析辅助函数

**修改文件**: `src/core/skill-runtime/dispatcher.ts`

#### 1.1 新增导入

```typescript
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
```

#### 1.2 新增 docs 解析函数

```typescript
/**
 * 从 docs/first/stage-views.md 解析指定阶段的摘要
 * 支持中英文格式：
 * - **摘要**: ... (中文)
 * - - Summary: ... (英文)
 */
function parseStageSummaryFromDocs(
  projectRoot: string,
  stage: 'spec' | 'design' | 'code' | 'verify'
): string | null {
  try {
    const docsPath = join(projectRoot, 'docs/first/stage-views.md');
    if (!existsSync(docsPath)) return null;

    const content = readFileSync(docsPath, 'utf-8');

    // 阶段标题映射（中英文）
    const stagePatterns: Record<string, RegExp> = {
      spec: /##\s*(?:需求阶段视图|Spec View)/i,
      design: /##\s*(?:设计阶段视图|Design View)/i,
      code: /##\s*(?:代码阶段视图|Code View)/i,
      verify: /##\s*(?:验证阶段视图|Verify View)/i,
    };

    const stagePattern = stagePatterns[stage];
    if (!stagePattern) return null;

    // 找到阶段章节
    const stageMatch = content.match(stagePattern);
    if (!stageMatch) return null;

    const stageStart = stageMatch.index! + stageMatch[0].length;

    // 找到下一个章节（作为边界）
    const nextSectionMatch = content.slice(stageStart).match(/\n##\s/);
    const stageContent = nextSectionMatch
      ? content.slice(stageStart, stageStart + nextSectionMatch.index!)
      : content.slice(stageStart);

    // 匹配摘要（中英文）
    const summaryMatch = stageContent.match(/(?:\*\*摘要\*\*:\s*|-\s*Summary:\s*)(.+?)(?:\n|$)/);
    return summaryMatch ? summaryMatch[1].trim() : null;
  } catch {
    return null;
  }
}

/**
 * 从 docs/first/role-views.md 解析角色摘要
 */
function parseRoleSummaryFromDocs(
  projectRoot: string
): string | null {
  try {
    const docsPath = join(projectRoot, 'docs/first/role-views.md');
    if (!existsSync(docsPath)) return null;

    const content = readFileSync(docsPath, 'utf-8');

    // 匹配第一个 Summary（Developer 角色的摘要作为代表）
    const summaryMatch = content.match(/-\s*Summary:\s*(.+?)(?:\n|$)/);
    return summaryMatch ? summaryMatch[1].trim() : null;
  } catch {
    return null;
  }
}
```

---

### Phase 2: 修改 build*RuntimeNotice 函数

#### 2.1 修改策略

| 函数 | 修改内容 |
|------|----------|
| `buildSpecRuntimeNotice` | 添加 docs 降级，增加 `data_source` 字段 |
| `buildDesignRuntimeNotice` | 添加 docs 降级，增加 `data_source` 字段 |
| `buildCodeRuntimeNotice` | 添加 docs 降级，增加 `data_source` 字段 |
| `buildVerifyRuntimeNotice` | 添加 docs 降级，增加 `data_source` 字段 |
| `buildTaskRuntimeNotice` | 增加 `data_source` 字段 |
| `buildReviewRuntimeNotice` | 增加 `data_source` 字段 |
| `buildPlanRuntimeNotice` | 增加 `data_source` 字段 |
| `buildSpecReviewRuntimeNotice` | 增加 `data_source` 字段 |
| `buildOnboardingRuntimeNotice` | 添加 docs 降级，增加 `data_source` 字段 |

#### 2.2 修改模板（以 buildSpecRuntimeNotice 为例）

**修改前**（现有代码）:
```typescript
function buildSpecRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (!index || !stageViews?.spec) return undefined;

    const parts = ['<!-- spec-runtime-context -->', '## Spec View Available'];
    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`background_input_status: ${backgroundStatus}`);

    if (stageViews.spec.summary) {
      parts.push(`spec_view_summary: ${stageViews.spec.summary}`);
    }

    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /spec-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}
```

**修改后**:
```typescript
function buildSpecRuntimeNotice(projectRoot: string): string | undefined {
  try {
    // 1. 尝试 runtime
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (index && stageViews?.spec) {
      // runtime 成功，使用现有逻辑 + 新增 data_source
      const parts = ['<!-- spec-runtime-context -->', '## Spec View Available'];
      const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';

      parts.push(`background_input_status: ${backgroundStatus}`);
      parts.push(`data_source: runtime`);

      if (stageViews.spec.summary) {
        parts.push(`spec_view_summary: ${stageViews.spec.summary}`);
      }

      if (backgroundStatus === 'degraded') {
        const missing: string[] = [];
        if (!index.summary.healthy) missing.push('summary');
        if (!index.roleViews.healthy) missing.push('role-views');
        if (!index.stageViews.healthy) missing.push('stage-views');
        if (missing.length > 0) {
          parts.push(`missing_assets: ${missing.join(', ')}`);
          parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
        }
      }

      parts.push('<!-- /spec-runtime-context -->');
      return parts.join('\n');
    }

    // 2. 降级到 docs
    const docsSummary = parseStageSummaryFromDocs(projectRoot, 'spec');
    if (docsSummary) {
      const parts = ['<!-- spec-runtime-context -->', '## Spec View Available'];
      parts.push('background_input_status: degraded');
      parts.push('data_source: docs');
      parts.push(`spec_view_summary: ${docsSummary}`);
      parts.push('missing_assets: summary, role-views, stage-views');
      parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      parts.push('<!-- /spec-runtime-context -->');
      return parts.join('\n');
    }

    return undefined;
  } catch {
    return undefined;
  }
}
```

#### 2.3 字段命名规则

**保持现有 snake_case**（不破坏向后兼容）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `background_input_status` | enum | `full` / `degraded` |
| `data_source` | string | `runtime` / `docs`（新增） |
| `spec_view_summary` | string | Spec 阶段摘要 |
| `design_view_summary` | string | Design 阶段摘要 |
| `code_view_summary` | string | Code 阶段摘要 |
| `verify_view_summary` | string | Verify 阶段摘要 |
| `missing_assets` | string | 缺失的 runtime 资产 |

---

### Phase 3: 单元测试

**修改文件**: `tests/unit/dispatcher.test.ts`（如存在）

#### 测试用例

1. `buildSpecRuntimeNotice` - runtime 成功，返回 `data_source: runtime`
2. `buildSpecRuntimeNotice` - runtime 失败，docs 成功，返回 `data_source: docs`
3. `buildSpecRuntimeNotice` - 全部失败，返回 `undefined`
4. `parseStageSummaryFromDocs` - 中文格式解析
5. `parseStageSummaryFromDocs` - 英文格式解析
6. `parseStageSummaryFromDocs` - 文件不存在返回 null

---

## Critical Files

| 文件 | 操作 | 描述 |
|------|------|------|
| `src/core/skill-runtime/dispatcher.ts` | 修改 | 添加 docs 降级逻辑 |
| `src/core/skill-runtime/first-runtime-store.ts` | 参考 | 现有读取函数 |
| `docs/first/stage-views.md` | 参考 | docs 格式参考 |

---

## Verification

### 自动化测试
```bash
npm test
```

### 手动验证（非破坏）
```bash
# 1. 验证 runtime 优先
npx spec-first first --mode deep
npx spec-first spec 2>&1 | grep "data_source: runtime"

# 2. 验证降级到 docs（备份 runtime）
mv .spec-first/runtime /tmp/spec-first-runtime.bak
npx spec-first spec 2>&1 | grep "data_source: docs"
mv /tmp/spec-first-runtime.bak .spec-first/runtime

# 3. 验证字段命名（保持 snake_case）
npx spec-first spec 2>&1 | grep "background_input_status"
```

### 类型检查
```bash
npm run typecheck
```

### 构建验证
```bash
npm run build
```

---

## 实现进度

- [ ] Phase 1: 添加 docs 解析辅助函数
  - [ ] 新增导入
  - [ ] `parseStageSummaryFromDocs` 函数
  - [ ] `parseRoleSummaryFromDocs` 函数
- [ ] Phase 2: 修改 build*RuntimeNotice 函数
  - [ ] `buildSpecRuntimeNotice` - docs 降级
  - [ ] `buildDesignRuntimeNotice` - docs 降级
  - [ ] `buildCodeRuntimeNotice` - docs 降级
  - [ ] `buildVerifyRuntimeNotice` - docs 降级
  - [ ] `buildTaskRuntimeNotice` - data_source 字段
  - [ ] `buildReviewRuntimeNotice` - data_source 字段
  - [ ] `buildPlanRuntimeNotice` - data_source 字段
  - [ ] `buildSpecReviewRuntimeNotice` - data_source 字段
  - [ ] `buildOnboardingRuntimeNotice` - docs 降级
- [ ] Phase 3: 单元测试
  - [ ] runtime 成功测试
  - [ ] docs 降级测试
  - [ ] 解析函数测试
- [ ] 验证
  - [ ] 类型检查通过
  - [ ] 构建成功
  - [ ] 测试通过
  - [ ] 手动验证通过
