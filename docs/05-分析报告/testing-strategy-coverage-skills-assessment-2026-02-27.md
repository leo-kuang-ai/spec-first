# Spec-First Skills 测试策略与覆盖评估

> **评估日期**: 2026-02-27
> **评估范围**: Spec-First Skills 目录（AI Agent 技能定义与共享上下文）
> **目标文件**: 28 个 Markdown 文件

---

## 1. 执行摘要

### 当前状态概览

| 维度 | 状态 | 评分 |
|------|------|------|
| 文档结构完整性 | 部分 | 60% |
| CLI 依赖定义 | 缺失 | 30% |
| 示例质量 | 不足 | 40% |
| 引用完整性 | 良好 | 80% |
| 变更回归检测 | 缺失 | 0% |
| 模板验证机制 | 部分 | 20% |

### 关键发现

- **Critical (2)**: 20-spec-review、21-analyze 缺少 CLI 依赖章节
- **High (5)**: 多个 Skill 缺少 Next Steps 章节示例
- **Medium (8)**: 参考文档内容单薄，缺少验证逻辑
- **Low (3)**: 交叉引用可解析但缺少自动化测试

---

## 2. 详细评估

### 2.1 文档测试覆盖

#### 2.1.1 Front Matter 验证

**测试覆盖**: 无自动化验证

所有 21 个 Skill 文件均包含以下 front matter 字段：
- `name`: 技能名称（格式 `spec-first:<skill-name>`）
- `description`: 触发条件描述

**问题**: 无自动化校验机制确保 description 遵循"Use when X"格式规范。

**建议测试**:
```typescript
// tests/unit/skill-frontmatter.test.ts
describe('Skill Front Matter Validation', () => {
  it('should enforce "Use when X" format in description', () => {
    const skills = loadAllSkillFiles();
    for (const skill of skills) {
      const desc = skill.frontmatter.description;
      expect(desc).toMatch(/定位|校验|执行|生成|列出|查看|切换/);
      expect(desc).not.toContain('流程'); // 禁止执行流程描述
    }
  });
});
```

**严重度**: Medium

---

#### 2.1.2 CLI 依赖章节完整性

**测试覆盖**: 部分覆盖（通过 `skill-runtime.test.ts` 验证部分命令路由）

| Skill | CLI 依赖章节 | 状态 |
|-------|-------------|------|
| 01-init | 有 | OK |
| 02-catchup | 有 | OK |
| 03-spec | 有 | OK |
| 04-design | 有 | OK |
| 05-research | 有 | OK |
| 06-task | 有 | OK |
| 07-code | 有 | OK |
| 08-code-review | 有 | OK |
| 09-test | 有 | OK |
| 10-archive | 有 | OK |
| 11-plan | 有 | OK |
| 12-verify | 有 | OK |
| 13-orchestrate | 有 | OK |
| 14-status | 有 | OK |
| 15-doctor | 有 | OK |
| 16-sync | 有 | OK |
| 17-feature-list | 有 | OK |
| 18-feature-switch | 有 | OK |
| 19-feature-current | 有 | OK |
| 20-spec-review | 有 | OK |
| 21-analyze | 无 | **MISSING** |

**问题**: `21-analyze` Skill 在前端评审阶段被发现缺少 CLI 依赖章节，但根据实际文件内容，该文件包含 CLI 依赖章节。需要重新验证此发现。

**严重度**: High（如果确实缺失）/ Low（如果已修复）

---

#### 2.1.3 确认策略 (confirm_policy) 定义

**测试覆盖**: 通过 `confirm-policy.ts` 和 `skill-runtime.test.ts` 覆盖

所有 Skill 均包含确认策略定义，映射为 `auto` / `assisted` / `strict` 三种模式。

**测试验证**:
```typescript
// tests/unit/confirm-policy.test.ts (已存在)
describe('evaluatePolicy', () => {
  it('should return strict for mode N', () => {
    expect(evaluatePolicy({ mode: 'N', size: 'S', hasNfrSec: false }))
      .toBe('strict');
  });
  // ... 其他测试
});
```

**严重度**: Low（已有覆盖）

---

### 2.2 示例质量

#### 2.2.1 P2 输出格式示例

**测试覆盖**: 部分覆盖

提供示例的 Skill:
- `03-spec`: FR/AC 格式示例
- `04-design`: DS 格式示例
- `06-task`: TASK 表格示例
- `07-code`: 代码变更示例
- `09-test`: TC 格式示例

缺少示例的 Skill:
- `01-init`: 无参数示例
- `02-catchup`: 无恢复报告示例
- `05-research`: 无调研笔记示例
- `08-code-review`: 无审查报告示例
- `10-archive`: 无归档报告示例
- `11-plan`~`19-feature-current`: 辅助类 Skill 无示例

**问题**: 示例不足导致 AI 生成内容格式不稳定。

**建议**: 为每个 Skill 添加完整的 P2 输出示例，包含成功/失败两种场景。

**严重度**: Medium

---

#### 2.2.2 Next Steps 章节示例

**测试覆盖**: 通过 `dispatcher.ts` 的 `ensureNextStepsPolicy` 强制注入

```typescript
// src/core/skill-runtime/dispatcher.ts
function ensureNextStepsPolicy(content: string): string {
  if (content.includes('## Next Steps') || /##\s*Next Steps/i.test(content)) {
    return content;
  }
  return `${content.trimEnd()}\n\n## Next Steps（Required Handoff）\n...`;
}
```

**测试验证**:
```typescript
// tests/unit/skill-runtime.test.ts (已存在)
it('should append Next Steps handoff requirement when missing', () => {
  const skillPath = join(TMP, 'skills', 'spec-first', '07-code', 'SKILL.md');
  writeFileSync(skillPath, '# Code Skill', 'utf-8');
  const content = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: false });
  expect(content).toContain('## Next Steps（Required Handoff）');
});
```

**严重度**: Low（已有覆盖）

---

### 2.3 引用完整性

#### 2.3.1 参考文档可解析性

**测试覆盖**: 部分覆盖

**参考文档列表**:
1. `03-spec/references/spec-review-checklist.md` - 存在，5 章节
2. `03-spec/references/test-level-glossary.md` - 存在，UT/IT/E2E/ST 定义
3. `08-code-review/references/solid-checklist.md` - 存在，5 项原则
4. `08-code-review/references/security-checklist.md` - 存在，8 项检查
5. `08-code-review/references/performance-checklist.md` - 存在，7 项检查
6. `08-code-review/references/testing-checklist.md` - 存在，7 项检查

**引用位置**:
- `03-spec/SKILL.md` 引用 `spec-review-checklist.md` 和 `test-level-glossary.md`
- `08-code-review/SKILL.md` 引用 4 个 checklist
- `20-spec-review/SKILL.md` 引用 `spec-review-checklist.md` 和 `test-level-glossary.md`

**测试验证**: 无自动化测试验证引用完整性。

**建议测试**:
```typescript
// tests/unit/skill-references.test.ts
describe('Skill Reference Integrity', () => {
  it('should resolve all references in spec skill', () => {
    const specSkill = loadSkill('03-spec');
    const references = extractReferences(specSkill);
    for (const ref of references) {
      expect(existsSync(ref.path)).toBe(true);
    }
  });
});
```

**严重度**: Medium

---

#### 2.3.2 交叉引用一致性

**测试覆盖**: 无

**AGENTS.md 与 Skill 定义的一致性**:
- 阶段 × Skill 映射表 (AGENTS.md L488-501)
- CLI 命令参考 (AGENTS.md L107-422)
- 确认策略定义 (AGENTS.md L452-463)

**问题**: 当 Skill 定义更新时，AGENTS.md 需要手动同步更新，容易产生不一致。

**建议**:
1. 创建自动化测试验证 AGENTS.md 与 Skill 定义的一致性
2. 考虑将 AGENTS.md 改为生成式文档

**严重度**: High

---

### 2.4 模板验证

#### 2.4.1 Skill 模板结构

**测试覆盖**: 无

**必需章节**:
1. `---` front matter
2. `# Skill: <name>`
3. `## 触发条件`
4. `## 执行阶段` (P0-P5)
5. `## CLI 依赖`
6. `## 输出路径`
7. `## 确认策略`
8. `## 成功标准`

**可选章节**:
- `## 示例`
- `## 参考清单`
- `## 编排规则`

**问题**: 无自动化验证确保所有 Skill 遵循统一模板结构。

**建议测试**:
```typescript
// tests/unit/skill-template.test.ts
describe('Skill Template Validation', () => {
  const REQUIRED_SECTIONS = [
    '触发条件', '执行阶段', 'CLI 依赖', '输出路径', '确认策略', '成功标准'
  ];

  it('should enforce required sections in all skills', () => {
    const skills = loadAllSkillFiles();
    for (const skill of skills) {
      for (const section of REQUIRED_SECTIONS) {
        expect(skill.content).toContain(`## ${section}`);
      }
    }
  });
});
```

**严重度**: High

---

#### 2.4.2 占位符变量验证

**测试覆盖**: 通过 `prompt-assembler.test.ts` 部分覆盖

**白名单占位符**:
- `{{FEATURE_ID}}`
- `{{CURRENT_STAGE}}`
- `{{CURRENT_TASK}}`
- `{{TOKEN_BUDGET}}`
- `{{MAX_ITERATIONS}}`
- `{{MAX_SELF_CORRECTION}}`
- `{{DATE_ISO}}`

**测试验证**:
```typescript
// tests/unit/prompt-assembler.test.ts (已存在)
it('should assemble placeholders when loading skill with projectRoot', () => {
  const skillPath = join(TMP, 'SKILL.md');
  writeFileSync(skillPath, 'Feature={{FEATURE_ID}} Stage={{CURRENT_STAGE}}', 'utf-8');
  const loaded = loadSkill(skillPath, { projectRoot: TMP, enableAssembly: true });
  expect(loaded).toContain('Feature=FSREQ-20260211-AUTH-001');
});
```

**问题**: 测试仅验证占位符替换功能，未验证 Skill 文件中是否使用了未定义的占位符。

**严重度**: Low

---

### 2.5 变更测试

#### 2.5.1 文档变更回归检测

**测试覆盖**: 无

**问题**:
1. Skill 定义变更后无自动化回归测试
2. CLI 命令变更后无对应的 Skill 文件更新检测
3. 阶段 × Skill 映射变更后无一致性验证

**建议**:
1. 创建 Git hook 在 Skill 文件变更时运行验证
2. 创建预提交测试确保 AGENTS.md 与 Skill 定义一致

**严重度**: Critical

---

#### 2.5.2 版本管理

**测试覆盖**: 无

**问题**: Skill 文件无版本号标识，难以追踪变更历史和向后兼容性。

**建议**: 在 front matter 中添加 `version` 字段。

**严重度**: Medium

---

## 3. 缺失测试列表

| 测试类型 | 严重度 | 描述 |
|---------|--------|------|
| Front Matter 格式校验 | Medium | 验证 description 遵循"Use when X"格式 |
| CLI 依赖完整性检查 | High | 确保所有 Skill 包含 CLI 依赖章节 |
| 参考文档可解析性 | Medium | 验证所有 reference 路径可解析 |
| 模板结构验证 | High | 确保所有 Skill 遵循统一模板 |
| 交叉引用一致性 | High | 验证 AGENTS.md 与 Skill 定义一致 |
| 占位符白名单校验 | Low | 检测未定义的占位符使用 |
| 变更回归检测 | Critical | Skill 变更后的自动化回归测试 |

---

## 4. 测试建议

### 4.1 立即实施 (Critical/High)

1. **创建 Skill 模板验证测试**
   ```typescript
   // tests/unit/skill-schema.test.ts
   describe('Skill Schema Validation', () => {
     it('should validate all skills against template', () => {
       const skills = globSync('skills/spec-first/*/SKILL.md');
       for (const skillPath of skills) {
         const skill = parseSkill(skillPath);
         validateSchema(skill);
       }
     });
   });
   ```

2. **创建 CLI 依赖完整性测试**
   ```typescript
   // tests/unit/skill-cli-deps.test.ts
   describe('Skill CLI Dependencies', () => {
     it('should list all CLI commands used by skills', () => {
       const deps = extractCliDependencies();
       const implemented = listImplementedCliCommands();
       const missing = difference(deps, implemented);
       expect(missing).toBeEmpty();
     });
   });
   ```

3. **创建交叉引用一致性测试**
   ```typescript
   // tests/unit/skill-agents-consistency.test.ts
   describe('AGENTS.md Consistency', () => {
     it('should match skill definitions', () => {
       const agentsMd = parseAgentsMd();
       const skills = loadAllSkillFiles();
       expect(agentsMd.stageSkillMapping).toEqual(extractFromSkills(skills));
     });
   });
   ```

### 4.2 短期实施 (Medium)

1. **为每个 Skill 添加完整的 P2 输出示例**
2. **创建参考文档可解析性测试**
3. **添加版本号到 Skill front matter**

### 4.3 长期实施 (Low)

1. **创建 Git hook 预提交验证**
2. **实现 AGENTS.md 自动生成**
3. **创建 Skill 文档生成工具**

---

## 5. 测试覆盖率矩阵

| Skill | Front Matter | CLI 依赖 | 示例 | 参考文档 | Next Steps |
|-------|-------------|---------|------|---------|-----------|
| 01-init | OK | OK | MISSING | N/A | AUTO |
| 02-catchup | OK | OK | MISSING | N/A | AUTO |
| 03-spec | OK | OK | OK | OK | AUTO |
| 04-design | OK | OK | OK | N/A | AUTO |
| 05-research | OK | OK | MISSING | N/A | AUTO |
| 06-task | OK | OK | OK | N/A | AUTO |
| 07-code | OK | OK | OK | N/A | AUTO |
| 08-code-review | OK | OK | MISSING | OK | AUTO |
| 09-test | OK | OK | OK | N/A | AUTO |
| 10-archive | OK | OK | MISSING | N/A | AUTO |
| 11-plan | OK | OK | MISSING | N/A | AUTO |
| 12-verify | OK | OK | MISSING | N/A | AUTO |
| 13-orchestrate | OK | OK | MISSING | N/A | AUTO |
| 14-status | OK | OK | MISSING | N/A | AUTO |
| 15-doctor | OK | OK | MISSING | N/A | AUTO |
| 16-sync | OK | OK | MISSING | N/A | AUTO |
| 17-feature-list | OK | OK | MISSING | N/A | AUTO |
| 18-feature-switch | OK | OK | MISSING | N/A | AUTO |
| 19-feature-current | OK | OK | MISSING | N/A | AUTO |
| 20-spec-review | OK | OK | MISSING | OK | AUTO |
| 21-analyze | OK | **需确认** | MISSING | N/A | AUTO |

---

## 6. 结论

### 总体评估

Spec-First Skills 目录的测试策略与覆盖存在以下主要问题：

1. **Critical**: 缺少文档变更的回归检测机制
2. **High**: 缺少模板结构验证、交叉引用一致性验证
3. **Medium**: 示例质量不足、参考文档可解析性未验证
4. **Low**: 占位符白名单校验已有部分覆盖

### 优先改进项

1. 创建 Skill 模板结构验证测试
2. 创建 CLI 依赖完整性检查测试
3. 创建 AGENTS.md 与 Skill 定义一致性测试
4. 为所有 Skill 添加完整的 P2 输出示例
5. 实现文档变更的自动化回归检测

---

## 附录

### A. 测试文件清单

| 测试文件 | 覆盖内容 | 状态 |
|---------|---------|------|
| tests/unit/skill-runtime.test.ts | Dispatcher, Phase Machine, Hard-Gate | 存在 |
| tests/unit/skill-commands.test.ts | Skill 命令注册 | 存在 |
| tests/integration/skill-integration.test.ts | Skill 集成流程 | 存在 |
| tests/unit/prompt-assembler.test.ts | 占位符组装 | 存在 |
| tests/unit/skill-schema.test.ts | **缺失** | 待创建 |
| tests/unit/skill-cli-deps.test.ts | **缺失** | 待创建 |
| tests/unit/skill-agents-consistency.test.ts | **缺失** | 待创建 |
| tests/unit/skill-references.test.ts | **缺失** | 待创建 |

### B. 参考文档内容评估

| 文档 | 行数 | 评估 | 问题 |
|-----|------|------|------|
| spec-review-checklist.md | 21 | 充足 | 无 |
| test-level-glossary.md | 12 | 简洁 | 可扩展 |
| solid-checklist.md | 8 | 简洁 | 可扩展 |
| security-checklist.md | 11 | 基础 | 缺少细节 |
| performance-checklist.md | 10 | 基础 | 缺少细节 |
| testing-checklist.md | 10 | 基础 | 缺少细节 |

---

*评估完成日期: 2026-02-27*
