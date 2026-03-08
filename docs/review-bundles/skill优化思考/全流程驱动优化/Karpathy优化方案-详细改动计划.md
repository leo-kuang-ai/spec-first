# Karpathy 优化方案详细改动计划（修订版）

> **基于**: `Karpathy优化方案-综合审查.md` 修订结论  
> **目标**: 以最小文档增量，在不修改 runtime 的前提下，为 `07-code`、`08-review`、`03-spec` 补上可执行的质量守卫  
> **实施策略**: 先补 `07-code`，再补 `08-review` 与 `03-spec`，全部优先复用现有锚点与现有运行态文件  
> **预计工作量**: 2–3 天  
> **涉及文件**: 3 个 Skill 文档 + 3–5 个测试文件

---

## 1. 计划结论

本计划用于把 Karpathy 方向转化为 **可直接实施** 的文档治理改造，重点解决 4 个问题：

1. `07-code` 缺少“最小实现”约束
2. `07-code` 缺少“禁止顺手优化”约束
3. `08-review` 缺少 Stage 2 建议分级
4. `03-spec` 缺少隐含假设显性化

本计划明确采用以下边界：

- **不修改 runtime 代码**
- **不引入新文件承接物**（如 `tech-debt.md`）
- **不假设 `traceability-matrix.md` 有文件级追踪能力**
- **不新增大段共享层机制**（如强行把规则上提到 `SHARED.md`）
- **不一次性改 `04-design` / `13-orchestrate`**

---

## 2. 设计原则

### 2.1 最小补丁优先

所有改动都优先插入已有高权重锚点，而不是继续扩张新的大章节。

### 2.2 现有承接物优先

所有“超出本次范围”的问题，统一记录到：

- `findings.md`
- review 输出中的 `OUT_OF_SCOPE`

本轮 **不新增** `tech-debt.md`。

### 2.3 与当前实现一致

所有约束必须与当前代码实现保持一致：

- `dispatcher` 直接加载单个 `SKILL.md`
- `prompt-assembler` 存在前缀稳定性要求
- `context-pack` 存在 2KB control zone 约束
- `traceability-matrix.md` 当前只维护 ID 追踪关系，不维护文件清单

### 2.4 测试联动优先于文档扩张

每一类 Skill 文档治理改动，都必须同步考虑已有文档测试，不允许“只改文档、不改测试判断”。

---

## 3. 改造范围总览

| 批次 | 文件 | 改造类型 | 实施方式 | 风险 |
|------|------|----------|----------|------|
| Batch A | `skills/spec-first/07-code/SKILL.md` | 简洁性 + 边界守卫 | 小节 + 模板补丁 | 中 |
| Batch B | `skills/spec-first/08-review/SKILL.md` | Stage 2 范围分级 | 在现有 Stage 2 附近补丁 | 低 |
| Batch C | `skills/spec-first/03-spec/SKILL.md` | 假设显性化 | 并入 `Phase 0.2` 报告模板 | 低 |

**暂不纳入本轮**:

- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/SHARED.md`
- 任意 runtime / CLI 行为代码

---

## 4. Batch A：`07-code` 改造方案

### 4.1 改造目标

在保留现有 TDD / hard-gate / diff preview / findings 机制不变的前提下，补充两类行为约束：

1. **Simplicity First**：只写当前 TASK 明确要求的最小实现
2. **Surgical Changes**：只改当前 TASK 直接需要改的内容

### 4.2 修改文件

- `skills/spec-first/07-code/SKILL.md`
- `tests/unit/code-skill-docs.test.ts`

### 4.3 精确插入位置

#### 插入点 A1

**文件**: `skills/spec-first/07-code/SKILL.md`  
**位置**: `## When to Use` 与 `## Don't Skip Code Review When` 之间

当前锚点：

- `## When to Use`
- `## Don't Skip Code Review When`

这里适合加入一个 **短小的守卫块**，原因：

- 足够靠前，能影响后续生成行为
- 不会打断已有 TDD / 调试 / hard-gate 主流程
- 不会污染前面的 front matter 与 hooks 区域

#### 插入点 A2

**文件**: `skills/spec-first/07-code/SKILL.md`  
**位置**: `## P3 diff 预览模板（固定字段）` 下方，紧跟现有模板补一个“范围确认”子块

原因：

- 边界守卫最适合在“写入前确认”阶段再次显性化
- 可以直接把“是否超出范围”纳入 diff review
- 不需要新增新的阶段或命令

### 4.4 计划新增内容

#### A1. 简洁性守卫（短版）

建议新增一个 12–18 行的小节，内容不写成长篇案例，不设硬编码阈值（如“3 处以上才能抽取”），只保留可执行原则：

```markdown
## Simplicity First - 最小实现守卫

核心原则：只写当前 TASK 明确要求的最小实现，不为未来需求预埋抽象、配置或扩展点。

生成代码前必须自检：
- 这个抽象是否被当前 TASK 明确需要？
- 这个配置项是否在当前交付中立即使用？
- 这段逻辑是否只是为了“将来可能会用”？

默认禁止：
- 为单次使用场景创建抽象层
- 为未提出的 future case 增加配置项
- 为假想扩展提前拆分类、策略、插件结构
```

#### A2. 边界守卫（短版）

建议与上一个小节相邻，控制在 12–18 行：

```markdown
## Surgical Changes - 修改边界守卫

核心原则：只修改当前 TASK 直接需要改动的代码，不做顺手优化。

提交前必须自检：
- diff 中每个文件是否都能追溯到当前 TASK / FR / DS？
- 是否出现了与本次交付无关的重命名、重构、格式统一？
- 是否删除了与本次改动无关的历史遗留代码？

默认禁止：
- 顺手修无关模块
- 顺手统一风格
- 顺手清理历史 orphan

若发现范围外问题：记录到 `findings.md`，不在本次 TASK 中一并处理。
```

#### A3. P3 diff 模板补丁

在 `## P3 diff 预览模板（固定字段）` 中新增一个简短子块，而不是重写现有表头：

```markdown
### 范围确认

- 本次变更是否全部直接服务于当前 TASK？[是/否]
- 是否包含范围外修改？[否/列出并说明已回退]
- 若发现范围外问题，是否已记录到 `findings.md`？[是/不适用]
```

### 4.5 明确不做

本批次 **不做** 以下内容：

- 不新增基于文件列表的“TASK 允许修改文件集”规则
- 不要求从 `traceability-matrix.md` 推导文件清单
- 不新增 `tech-debt.md`
- 不引入大量示例代码块
- 不改 hooks / front matter / runtime notice

### 4.6 测试联动

建议更新 `tests/unit/code-skill-docs.test.ts`，新增断言：

- Skill 中包含 `Simplicity First`
- Skill 中包含 `Surgical Changes`
- Skill 中包含“记录到 `findings.md`”的范围外处理策略
- Skill 中的 diff 模板包含 `### 范围确认`

---

## 5. Batch B：`08-review` 改造方案

### 5.1 改造目标

让 Stage 2 输出具备明确边界分级，防止 review 把“当前必须修复的问题”和“长期优化建议”混在一起。

### 5.2 修改文件

- `skills/spec-first/08-review/SKILL.md`
- `tests/unit/phase1-enhancement-docs.test.ts`

### 5.3 精确插入位置

**文件**: `skills/spec-first/08-review/SKILL.md`  
**位置**: `### Stage 2: 质量审查（在 Stage 1 通过后执行）` 之后、`## 审查反合理化守卫（P1-14）` 之前

原因：

- 规则直接绑定 Stage 2
- 不影响 Stage 1 / Stage 2 两阶段结构
- 最符合“在质量审查前定义输出边界”的意图

### 5.4 计划新增内容

建议新增一个 10–16 行的小节：

```markdown
#### Stage 2 输出分级

Stage 2 的发现必须分为以下三类：

- `MUST FIX`：违反 TASK / FR / DS / Constitution / 新鲜证据要求，或会阻断当前交付的问题
- `SHOULD FIX`：不阻断当前交付，但明显影响质量、可维护性、性能或测试完备性的事项
- `OUT_OF_SCOPE`：与本次 TASK 无直接关系、适合后续单独处理的问题

输出要求：
- 不得把 `OUT_OF_SCOPE` 问题包装成当前阻断项
- `OUT_OF_SCOPE` 问题应记录到 `findings.md` 或审查结论中
- Stage 2 结论必须可被复核为“阻断 / 建议 / 范围外”三类
```

### 5.5 明确不做

- 不重写现有 checklist 文件
- 不引入新的 review 命令参数
- 不改 layer 选择机制
- 不引入 `Implementation Review` 英文新标题

### 5.6 测试联动

建议在 `tests/unit/phase1-enhancement-docs.test.ts` 中为 review 增加断言：

- 包含 `Stage 2 输出分级`
- 包含 `MUST FIX`
- 包含 `SHOULD FIX`
- 包含 `OUT_OF_SCOPE`

---

## 6. Batch C：`03-spec` 改造方案

### 6.1 改造目标

在不重构 spec 流程的前提下，把“隐含假设显性化”并入 `Phase 0.2` 质量扫描输出。

### 6.2 修改文件

- `skills/spec-first/03-spec/SKILL.md`
- `tests/unit/spec-skill-docs.test.ts`

### 6.3 精确插入位置

#### 插入点 C1

**文件**: `skills/spec-first/03-spec/SKILL.md`  
**位置**: `#### Phase 0.2: 质量扫描 + 自动上下文收集` 中，`Step 3: 生成质量报告` 的模板说明区域

#### 插入点 C2

**文件**: `skills/spec-first/03-spec/SKILL.md`  
**位置**: `## Phase 0.2 质量扫描报告` 模板中，建议插入在 `### 缺失项（按优先级）` 与 `### 自动收集的上下文` 之间

原因：

- 这是当前最自然的承载位置
- 与“质量扫描”目标一致
- 保持现有输出目标仍以 `findings.md` 为主，不强制新增 `spec.md` 章节结构

### 6.4 计划新增内容

建议新增一个简短模板块：

```markdown
### 隐含假设清单
- [ASSUMED] [类别] [假设内容]
- [NEEDS CLARIFICATION][TYPE] [需要确认的问题]
```

并补一段规则说明：

```markdown
若某个默认前提会影响 FR / AC / NFR 的结果，则不得保持隐含状态，必须：
- 标记为 `[ASSUMED]`，或
- 升级为 `[NEEDS CLARIFICATION][TYPE]`

出现“通常 / 一般 / 默认 / 预期会”这类表述时，必须检查是否应转化为假设条目。
```

### 6.5 明确不做

- 不要求 `spec.md` 新增固定 `## Assumptions` 章节
- 不引入技术 / 业务 / 环境三分法为硬格式
- 不把所有常识都写成假设
- 不改变现有多轮澄清机制

### 6.6 测试联动

建议更新 `tests/unit/spec-skill-docs.test.ts`，新增断言：

- 包含 `隐含假设清单`
- 包含 `[ASSUMED]`
- 包含 `[NEEDS CLARIFICATION]`
- 包含 `通常` / `默认` 需检查的约束说明

---

## 7. 不在本轮实施的内容

### 7.1 `04-design`

暂不实施，原因：

- 当前设计阶段已有系统级 HOW 边界
- 文件本身已有结构重复，需要先收敛再补 guard
- ROI 低于 `07-code`

### 7.2 `13-orchestrate`

暂不实施，原因：

- 已有证据推进、批次、检查点和风险分级
- 当前痛点不在编排，而在单 Skill 输出边界

### 7.3 `SHARED.md`

暂不实施，原因：

- 当前没有证据表明 runtime 自动拼装 `SHARED.md` 到各 Skill prompt
- 共享层治理应等 runtime 接线策略明确后再推进

---

## 8. 实施顺序

### Phase 1

1. 修改 `skills/spec-first/07-code/SKILL.md`
2. 修改 `tests/unit/code-skill-docs.test.ts`
3. 运行定向测试

### Phase 2

4. 修改 `skills/spec-first/08-review/SKILL.md`
5. 修改 `tests/unit/phase1-enhancement-docs.test.ts`
6. 运行定向测试

### Phase 3

7. 修改 `skills/spec-first/03-spec/SKILL.md`
8. 修改 `tests/unit/spec-skill-docs.test.ts`
9. 运行定向测试 + 全量测试

---

## 9. 验证命令

### 9.1 定向测试

```bash
pnpm test -- tests/unit/code-skill-docs.test.ts tests/unit/phase1-enhancement-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/skill-catalog.test.ts tests/unit/doc-governance-cleanup.test.ts
```

### 9.2 全量回归

```bash
pnpm test
```

### 9.3 变更审阅辅助命令

```bash
rg -n "Simplicity First|Surgical Changes|Stage 2 输出分级|隐含假设清单|\[ASSUMED\]|OUT_OF_SCOPE" skills/spec-first tests/unit -S
```

---

## 10. 验收标准

### 10.1 文档层

- `07-code` 新增最小实现守卫与边界守卫
- `07-code` 的 diff 模板新增“范围确认”
- `08-review` 的 Stage 2 明确分级
- `03-spec` 的 `Phase 0.2` 报告新增“隐含假设清单”

### 10.2 测试层

- 定向文档测试全部通过
- `skill-catalog` 未因新增文本破坏基础治理规则
- 全量测试通过

### 10.3 治理层

- 未新增新的运行态文件依赖
- 未引入与现有命令不一致的伪能力
- 未依赖 `traceability-matrix.md` 的文件级追踪能力

---

## 11. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| 守卫写得过长，导致 prompt 膨胀 | 中 | 中 | 每个新增块控制在 10–18 行，避免长案例 |
| 守卫写得过死，变成教条 | 中 | 中 | 只写原则，不写武断阈值 |
| 测试断言与新文案不一致 | 中 | 中 | 同步修改相关测试 |
| 把范围外问题导向不存在的承接物 | 高 | 高 | 统一使用 `findings.md` |
| 错误依赖矩阵文件能力 | 高 | 中 | 明确放弃“文件清单追踪”假设 |

---

## 12. 回滚方案

### 12.1 未提交前回滚

```bash
git restore -- skills/spec-first/07-code/SKILL.md \
  skills/spec-first/08-review/SKILL.md \
  skills/spec-first/03-spec/SKILL.md \
  tests/unit/code-skill-docs.test.ts \
  tests/unit/phase1-enhancement-docs.test.ts \
  tests/unit/spec-skill-docs.test.ts
```

### 12.2 已提交后回滚

```bash
git revert <commit_sha>
```

### 12.3 回滚后验证

```bash
pnpm test -- tests/unit/code-skill-docs.test.ts tests/unit/phase1-enhancement-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/skill-catalog.test.ts
```

---

## 13. 一句话总结

**本轮改造不是“继续加章节”，而是在 `07-code` / `08-review` / `03-spec` 的现有锚点内做最小补丁，用最小文档增量补上 Simplicity、Surgical、Scope、Assumptions 四类真实缺口。**
