# Review Scope

## Target

**Spec-First Skills Directory** - AI Agent 技能定义与共享上下文

### Description

包含 21 个 Skill 定义文件和共享的 AGENTS.md 上下文，每个 Skill 定义了 AI Agent 在研发流程各阶段的执行规范。

### Content Type

- Markdown 格式的 Skill 定义 (SKILL.md)
- 参考文档 (references/)
- 共享 Agent 指令 (AGENTS.md)

---

## Files

### 目录结构

```
skills/spec-first/
├── AGENTS.md (共享上下文，522 行)
├── 01-init/SKILL.md
├── 02-catchup/SKILL.md
├── 03-spec/SKILL.md + references/
│   ├── spec-review-checklist.md
│   └── test-level-glossary.md
├── 04-design/SKILL.md
├── 05-research/SKILL.md
├── 06-task/SKILL.md
├── 07-code/SKILL.md
├── 08-code-review/SKILL.md + references/
│   ├── solid-checklist.md
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   └── testing-checklist.md
├── 09-test/SKILL.md
├── 10-archive/SKILL.md
├── 11-plan/SKILL.md
├── 12-verify/SKILL.md
├── 13-orchestrate/SKILL.md
├── 14-status/SKILL.md
├── 15-doctor/SKILL.md
├── 16-sync/SKILL.md
├── 17-feature-list/SKILL.md
├── 18-feature-switch/SKILL.md
├── 19-feature-current/SKILL.md
├── 20-spec-review/SKILL.md
└── 21-analyze/SKILL.md
```

### 文件统计

| 类型 | 数量 |
|------|------|
| SKILL.md 文件 | 21 |
| 参考文档 | 6 |
| AGENTS.md | 1 |
| **总计** | **28 个 Markdown 文件** |

---

## Flags

- **Security Focus**: no
- **Performance Critical**: no
- **Strict Mode**: no
- **Framework**: Markdown/Documentation-based

---

## Review Phases

1. Code Quality & Architecture
2. Security & Performance
3. Testing & Documentation
4. Best Practices & Standards
5. Consolidated Report

---

## 特殊考虑

### Skill 定义文件特点

1. **格式**: Markdown with YAML frontmatter
2. **目的**: 定义 AI Agent 执行流程和约束
3. **结构**: 通常包含 P0-P5 阶段、确认策略、Next Steps
4. **依赖**: 所有 Skill 依赖 AGENTS.md 的共享上下文

### 审查重点

1. **一致性**: Skill 间结构是否一致
2. **完整性**: 是否遗漏必要章节
3. **准确性**: CLI 命令引用是否正确
4. **可维护性**: 更新成本、重复内容
5. **安全性**: 是否包含敏感信息或不当指令
