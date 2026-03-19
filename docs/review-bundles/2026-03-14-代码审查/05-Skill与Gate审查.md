# Skill 与 Gate 审查（校正版）

## 审查范围

本文件只覆盖仓库内 `skills/` 的 20 个 `SKILL.md`，不混入用户全局或外部技能目录。

## 已验证问题

### C-GT-01 [High] Gate 与 Skill 存在明确不一致

已确认的两处核心漂移：

| 条件 | Skill 文档 | 代码实现 |
|---|---|---|
| `G-IMPL-01` | C4 ≥ 80% | C4 ≥ 60% |
| `G-VERIFY-01` | C4 = 100% | C4 ≥ 80% |

这已经足以证明“规范即真理”当前没有落到单一事实源。

### SKILL-001 [Medium] Skill 版本字段未参与路由

证据：

- `src/core/skill-runtime/front-matter.ts` 支持 `version`
- `src/core/skill-runtime/dispatcher.ts` 的 `resolveSkillPath()` 仍按名称和 `NN-name` 目录寻找

影响：版本信息更多是展示字段，不是选择机制。

### SKILL-002 [Medium] `required_mcps` 校验时机偏后

现状：`auto-loop.ts` 在 `runPostWriteGuards()` 中校验 `required_mcps`

修正说明：

- 上一版写成“AI 输出写入后才发现 MCP 缺失”，表述过头
- 更准确的说法是：校验发生在执行后的守卫阶段，不是 pre-flight

### SKILL-003 [Medium] front matter 只有类型级校验，没有语义级校验

位置：`src/core/skill-runtime/front-matter.ts`

现状：

- `required_mcps` 只校验是不是数组
- `completion_markers` 只校验是不是数组

未校验：

- 空模式
- 负数
- 互斥/缺失字段组合

## 修正项

- “共有 21 个 Skill”不成立，仓库内是 20 个
- “4 处关键不一致”没有全部证据支撑，本版保留已明确验证的 2 处
- “G-IMPL-01 是 TDD RED 不可绕过门禁”不成立
  - 当前代码中的 `G-IMPL-01` 是 C4 覆盖率门禁，不是 TDD RED

## 建议

1. 为 Gate 条件建立自动一致性测试，直接比对 `SKILL.md` 与 `condition-registry.ts`
2. 将 `required_mcps` 提前到 pre-flight
3. 给 front matter 增加语义校验和契约测试
