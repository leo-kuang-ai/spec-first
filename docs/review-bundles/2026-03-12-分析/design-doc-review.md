# Design Doc Review: First Context Dynamic Injection

> 审查时间: 2026-03-12
> 文档: `docs/plans/2026-03-12-first-context-dynamic-injection-design.md`

## 审查结论

**总体评价**: ✅ 设计方向正确，当前版本已经收敛到更合理的 V1 范围

**核心优点**:
1. 准确识别根本问题（宿主入口未接线）
2. 方案选择合理（方案 B）
3. 分阶段迁移策略清晰

**主要问题**:
1. 需要持续控制 V1 范围，不要再次膨胀
2. 宿主入口优先的迁移顺序已经是正确方向
3. 少量示例代码仍可继续收紧

---

## 详细审查

### 1. 问题识别 ✅

**正确点**:
- 准确指出宿主入口是静态文件（第 25-27 行）
- 识别出 `dispatcher.loadSkill()` 未被调用（第 26 行）

**建议**:
- 可补充具体代码位置（skill-commands.ts:224）

### 2. 方案选择 ✅

**方案 B 选择合理**:
- 直接修主链路断点
- 复用现有 runtime truth
- 风险可控

**方案 A 的缺点描述准确**:
- 只增强内容，不解决入口问题

### 3. Context Resolver 设计 ✅ 已收敛到更合理的 V1

修复后，`ResolvedSkillContext` 已缩成更合理的 V1 结构：

```typescript
interface ResolvedSkillContext {
  featureId?: string;
  skillName: string;
  source: 'runtime' | 'docs' | 'none';
  backgroundInputStatus: 'full' | 'degraded' | 'blind';
  stageViewSummary?: string;
  roleViewSummary?: string;
  firstSummaryLite?: { ... };
  missingAssets: string[];
  recommendedAction?: string;
}
```

结论：

- 相比初版，这个结构已经明显更适合 V1。
- 仍需约束：`firstSummaryLite` 不应在实现阶段继续膨胀成完整项目画像。

### 4. 实施顺序 ✅ 已调整为入口优先

修复后设计文档已经改成：

1. 先新增 `spec-first skill render`
2. 再切宿主入口到动态渲染
3. 然后新增 V1 `Context Resolver`
4. 最后接入 `backgroundInputStatus` 同步

这个顺序比初版明显更聚焦，也更符合“先打通主断点，再做内部收敛”。

### 5. 与现有代码的一致性 ⚠️

**问题 1**: Background Status Sync 的定义已经修正为“缓存刷新”（157-171 行）

设计文档说：
> `first` 成功执行后自动触发一次

**现实**:
- `backgroundInputStatus` 已经存储在 `specs/*/stage-state.json`
- 当前 `init` 也会基于项目级 `first` 资产写入这个字段
- 因此后续由 `first` 成功后刷新该缓存是可成立的

这部分现在是合理的，不再建议删除模块。

**问题 2**: skill 维度切片规则已缩成 V1 最小规则（172-227 行）

设计文档为每个 skill 定义了详细的注入规则，但：
- 当前代码已有 `build*RuntimeNotice()` 实现
- 这些规则大部分已存在
- 重复定义增加维护成本

这部分当前粒度是可接受的，后续只需防止再次膨胀。

### 6. 测试设计 ✅

**优点**:
- 覆盖单元、集成、E2E
- 场景回归清晰

**建议补充**:
- 宿主兼容性测试（Claude Code vs Codex）
- 降级路径测试（runtime 缺失时）

---

## 修正建议

### 最小化实施方案

**Phase 1（核心）**: 修复宿主入口（~100 行代码）

1. 新增 CLI 子命令 `spec-first skill render <name>`：

```typescript
// src/cli/commands/skill.ts
export function skillCommand(argv: string[]): void {
  const skillName = argv[0];
  const args = argv.slice(1);
  const projectRoot = process.cwd();

  const dispatch = dispatchCommand(`spec-first:${skillName} ${args.join(' ')}`, projectRoot);
  if (dispatch.route === 'skill') {
    const content = loadSkill(dispatch.skillPath, { projectRoot });
    console.log(content);
  }
}
```

2. 修改命令文件渲染：

```typescript
// src/shared/skill-commands.ts
function renderCommandFile(entry: SkillEntry): string {
  return `---
description: ${quoteYamlString(sanitizeDescription(entry.description))}
---

执行以下命令：

\`\`\`bash
npx spec-first skill render ${entry.skillName} $ARGUMENTS
\`\`\`
`;
}
```

**Phase 2（可选）**: 简化 resolver（~50 行代码）

```typescript
// src/core/skill-runtime/context-resolver.ts
export function resolveSkillContext(projectRoot: string, skillName: string) {
  const index = readFirstRuntimeIndex(projectRoot);
  const stageViews = readFirstStageViews(projectRoot);

  if (index && stageViews) {
    return {
      source: 'runtime',
      backgroundInputStatus: index.summary.healthy ? 'full' : 'degraded',
      summary: stageViews[skillName]?.summary,
      missingAssets: [],
    };
  }

  // 降级到 docs
  const docsSummary = parseStageSummaryFromDocs(projectRoot, skillName);
  return {
    source: 'docs',
    backgroundInputStatus: 'degraded',
    summary: docsSummary,
    missingAssets: ['runtime'],
  };
}
```

---

## 总结

**设计文档质量**: 7/10

**优点**:
- 问题识别准确
- 方案选择合理
- 分阶段策略清晰

**缺点**:
- Context Resolver 过度设计
- 实施顺序不够聚焦
- 部分模块与现有代码不一致

**建议**:
1. 保持当前 V1 范围，不再把 resolver 扩成“大而全”接口
2. 维持入口优先的迁移顺序
3. 在实现阶段持续验证 `background status sync` 只是缓存刷新

**预估工作量**:
- Phase 1: 入口打通，1-2 天
- Phase 2: resolver + dispatcher 收口，约 1 天
- 总计: 2-3 天
