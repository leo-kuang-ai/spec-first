# Gate 优化方案 - 渐进式实施路径

## 📋 总览

| Phase | 目标 | 工作量 | 优先级 | 状态 |
|-------|------|--------|--------|------|
| Phase 0 | 文档和模板 | 0h | 🔴 高 | ✅ 完成 |
| Phase 1 | CLI 体验优化 | 2-3h | 🟡 中 | ⏸️ 待定 |
| Phase 2 | 轻量级分层 | 4-6h | 🟢 低 | ⏸️ 待定 |
| Phase 3 | Profile 2.0 | 40-60h | ⚪ 未来 | ❌ 不做 |

---

## Phase 0：文档和模板（已完成）✅

### 交付物
- ✅ `.spec-first/profiles/frontend.yaml` - 前端项目模板
- ✅ `.spec-first/profiles/backend.yaml` - 后端项目模板
- ✅ `.spec-first/profiles/mobile.yaml` - 移动项目模板
- ✅ `.spec-first/profiles/README.md` - 使用指南

### 使用方式
```bash
# 1. 复制模板
cp .spec-first/profiles/frontend.yaml .spec-first/profile.yaml

# 2. 根据项目调整
vim .spec-first/profile.yaml

# 3. 验证配置
spec-first gate check <featureId>
```

### 收益
- 零代码改动
- 立即可用
- 解决 80% 的配置问题

---

## Phase 1：CLI 体验优化（可选）

### 目标
提升 Gate 检查的用户体验，让环境问题更清晰。

### 改动点

**1. 增强 CLI 输出提示（1h）**

文件：`src/cli/commands/gate.ts`

```typescript
function handleCheck(args: string[]): number {
  // ... 现有逻辑

  for (const c of result.conditions) {
    const icon = formatConditionStatus(c);
    console.log(`  ${icon} ${c.description}`);

    if (c.detail) {
      console.log(`     ${c.detail}`);

      // 新增：智能提示
      if (c.status === 'FAIL' && c.blocking === false) {
        if (/command not found/i.test(c.detail)) {
          console.log(`     💡 提示：工具未安装，这是环境问题`);
          console.log(`        - 安装工具，或`);
          console.log(`        - 在 Profile 中设置 blocking: false`);
        } else {
          console.log(`     ⚠️  这是非阻断警告，可以推进但建议修复`);
        }
      }
    }
  }
}
```

**2. 添加 Gate 配置检查命令（1h）**

```bash
# 新命令：检查 Profile 配置
spec-first gate validate-config

# 输出示例：
✓ Profile 配置有效
✓ 所有 Layer2 命令可执行
⚠ 建议：G-ANDROID-LINT 设为 blocking: false（工具未安装）
```

**3. 测试验证（1h）**

### 工作量
总计：2-3 小时

### 收益
- 用户体验提升
- 减少配置困惑
- 零架构改动

### 实施决策
⏸️ **建议暂缓**，等待用户反馈后再决定是否实施

---

## Phase 2：轻量级分层（按需）

### 目标
引入 category 字段，支持分组展示，但不改变核心逻辑。

### 改动点

**1. 类型定义（30min）**

文件：`src/shared/types.ts`

```typescript
// 新增
export type GateCategory = 'governance' | 'platform' | 'advisory';

// 扩展
export interface ConditionResult {
  id: string;
  description: string;
  category?: GateCategory;  // 新增（可选）
  status: 'PASS' | 'WAIVER' | 'FAIL';
  detail?: string;
  scopeFrIds?: string[];
  blocking?: boolean;
}
```

**2. Layer2 条件支持 category（1h）**

文件：`src/core/gate-engine/gate-evaluator.ts`

```typescript
const l2Conditions = (state.mergedRules?.gateConditions?.[stage] ?? []) as Array<{
  id: string;
  description: string;
  command?: string;
  category?: GateCategory;  // 新增
  blocking?: boolean;
}>;

for (const l2 of l2Conditions) {
  // ...
  conditions.push({
    id: l2.id,
    description: l2.description,
    category: l2.category || 'governance',  // 默认 governance
    status: cmdResult.pass ? 'PASS' : 'FAIL',
    detail: cmdResult.detail,
    blocking: l2.blocking ?? true,
  });
}
```

**3. CLI 分组展示（2h）**

文件：`src/cli/commands/gate.ts`

```typescript
function handleCheck(args: string[]): number {
  const result = evaluateGate(featureId, cwd);

  console.log(`\nGate 检查 — ${featureId} (${result.stage})`);
  console.log(`结果：${result.status}\n`);

  // 按 category 分组
  const groups = {
    governance: result.conditions.filter(c => c.category === 'governance'),
    platform: result.conditions.filter(c => c.category === 'platform'),
    advisory: result.conditions.filter(c => c.category === 'advisory'),
  };

  // 治理检查
  if (groups.governance.length > 0) {
    console.log('治理检查：');
    for (const c of groups.governance) {
      console.log(`  ${formatConditionStatus(c)} ${c.description}`);
      if (c.detail) console.log(`     ${c.detail}`);
    }
    console.log('');
  }

  // 平台检查
  if (groups.platform.length > 0) {
    console.log('平台检查：');
    for (const c of groups.platform) {
      console.log(`  ${formatConditionStatus(c)} ${c.description}`);
      if (c.detail) console.log(`     ${c.detail}`);
    }
    console.log('');
  }

  // 建议项
  if (groups.advisory.length > 0) {
    console.log('建议项：');
    for (const c of groups.advisory) {
      console.log(`  ${formatConditionStatus(c)} ${c.description}`);
    }
  }
}
```

**4. 更新 Profile 模板（30min）**

```yaml
gateConditions:
  04_implement:
    - id: G-FE-LINT
      command: "npm run lint"
      category: governance  # 新增
      blocking: true

    - id: G-ANDROID-LINT
      command: "ktlint"
      category: platform  # 新增
      blocking: false
```

**5. 测试验证（1h）**

### 工作量
总计：4-6 小时

### 收益
- 更清晰的分组展示
- 语义更明确
- 为未来扩展留空间

### 实施决策
⏸️ **建议按需实施**，仅当以下条件满足时：
1. 用户反馈需要更清晰的分组
2. 跨平台项目占比 > 30%
3. Phase 0 的模板无法满足需求

---

## Phase 3：Profile 2.0（长期战略）

### 目标
自动化平台适配，零配置体验。

### 核心特性
- 自动检测项目类型（通过文件特征）
- 自动生成适用的 Gate 条件
- 自动判断工具可用性
- 智能推荐配置

### 实施条件
需要满足以下**所有条件**：
1. 跨平台项目占比 > 50%
2. 用户持续反馈配置复杂
3. 有专门的开发资源（1-2 周）
4. Phase 0 和 Phase 1 已验证不足

### 工作量
总计：40-60 小时

### 实施决策
❌ **当前不做**，列入长期 Roadmap

---

## 🎯 推荐实施策略

### 立即执行
✅ **Phase 0**（已完成）
- 使用 Profile 模板
- 文档化最佳实践
- 观察用户反馈

### 3 个月后评估
根据以下指标决定是否实施 Phase 1：
- 用户反馈频率（> 5 次/月）
- 配置问题占比（> 30%）
- 环境问题误判率（> 20%）

### 6 个月后评估
根据以下指标决定是否实施 Phase 2：
- 跨平台项目占比（> 30%）
- Phase 0 模板覆盖率（< 70%）
- 用户要求分组展示（> 10 次）

### 1 年后评估
根据整体数据决定是否启动 Phase 3

---

## 📊 成功指标

### Phase 0
- ✅ 模板使用率 > 50%
- ✅ 配置相关问题减少 > 30%
- ✅ 用户满意度提升

### Phase 1（如果实施）
- CLI 提示有效性 > 80%
- 环境问题识别准确率 > 90%
- 用户配置时间减少 > 20%

### Phase 2（如果实施）
- 分组展示清晰度评分 > 4/5
- 跨平台项目配置时间减少 > 40%
- 新增 category 使用率 > 60%

---

## ✅ 总结

**当前最佳策略**：
1. ✅ 使用 Phase 0 的模板和文档
2. ⏸️ 观察 3-6 个月
3. 📊 收集数据和反馈
4. 🔄 按需渐进式演进

**核心原则**：
> "不要为未来可能的需求过度设计，
> 而要为当前真实的问题提供最简方案"

**下一步行动**：
1. 将 Profile 模板推广给用户
2. 收集使用反馈和痛点
3. 3 个月后重新评估是否需要 Phase 1
