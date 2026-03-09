# 当前文件结构

## 目录结构

```
skills/spec-first/03-spec/
└── SKILL.md (725 行)
```

## SKILL.md 内容分布

| 行数范围 | 内容 | 行数 |
|---------|------|------|
| 1-9 | YAML Frontmatter | 9 |
| 10-25 | Skill 简介 + Announce | 16 |
| 26-47 | 反合理化守卫表 | 22 |
| 48-72 | CLI 硬约束 | 25 |
| 73-107 | 结构化歧义消解 | 35 |
| 108-122 | Dynamic Clarification Questions | 15 |
| 123-140 | 触发条件 + Feature 定位规则 | 18 |
| 141-344 | Phase 0: PRD 流程（0.0-0.6）| 204 |
| 345-377 | Step 0-1 | 33 |
| 378-409 | Step 2: 复杂度判定 | 32 |
| 410-430 | Step 3: Question Gate | 21 |
| 431-454 | Step 4: Research-first | 24 |
| 455-474 | Step 5: Expansion Sweep | 20 |
| 475-495 | Step 6: Q&A Loop | 21 |
| 496-563 | P1.5: 宪法权威检查 + Step 7 | 68 |
| 564-634 | Step 8: Final Confirmation | 71 |
| 635-661 | findings.md 状态头 | 27 |
| 662-681 | 节点跳过规则 | 20 |
| 682-725 | CLI 依赖 + 输出路径 + 成功标准 + 参考文档 | 44 |

## 问题分析

### 过长的章节

1. **Phase 0 流程（204 行）**
   - Phase 0.0-0.6 详细流程
   - 应拆分到 `references/phase0-prd-workflow.md`

2. **Step 8（71 行）**
   - 包含确认包格式、Gate Check、格式校验
   - 应拆分到 `references/steps-fr-ac-workflow.md`

3. **Step 7 + 宪法检查（68 行）**
   - ADR-lite 模板 + 宪法违反示例
   - 应拆分到 `references/steps-fr-ac-workflow.md`

### 重复内容

1. **CLI 硬约束（第 58-72 行）vs CLI 依赖（第 685-689 行）**
   - 应合并到 `references/cli-commands-reference.md`

2. **Phase 0.2 Step 2 vs Step 1**
   - 都做上下文收集
   - 应合并

### 可提取内容

1. **反合理化守卫表（22 行）**
   - 提取到 `references/anti-rationalization-guards.md`

2. **复杂度判定表（32 行）**
   - 提取到 `references/complexity-matrix.md`

3. **质量门禁（分散在多处）**
   - 提取到 `references/quality-gates.md`
