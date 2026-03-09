# 建议文件结构

## 重构后目录结构

```
skills/spec-first/03-spec/
├── SKILL.md (~200 行)
└── references/
    ├── phase0-prd-workflow.md (~150 行)
    ├── steps-fr-ac-workflow.md (~200 行)
    ├── complexity-matrix.md (~80 行)
    ├── anti-rationalization-guards.md (~50 行)
    ├── cli-commands-reference.md (~100 行)
    └── quality-gates.md (~80 行)
```

**总行数**: ~860 行（vs 当前 725 行）
**SKILL.md**: ~200 行（vs 当前 725 行）

## 文件职责

### SKILL.md (~200 行)
- YAML Frontmatter
- 核心流程概览
- 复杂度自适应规则
- 关键约束摘要
- 引用链接

### references/phase0-prd-workflow.md (~150 行)
- Phase 0.0: Feature 快速初始化
- Phase 0.1: 任务锚定
- Phase 0.2: 质量扫描 + 上下文收集
- Phase 0.3: PRD 生成
- Phase 0.4: PRD 自检
- Phase 0.5: PRD 补全对话
- Phase 0.6: PRD 用户确认

### references/steps-fr-ac-workflow.md (~200 行)
- Step 0: Ensure Task Exists
- Step 1: Classify Complexity
- Step 2: Question Gate
- Step 3: Research-first Mode
- Step 4: Expansion Sweep
- Step 5: Q&A Loop
- Step 6: Propose Approaches + ADR
- Step 7: Final Confirmation + Gate Check

### references/complexity-matrix.md (~80 行)
- 四档判定标准表格
- 判定流程
- 边界情况说明
- 判定示例
- 跳过规则映射

### references/anti-rationalization-guards.md (~50 行)
- 字面即精神原则
- 反合理化守卫表
- 使用说明
- 违反示例

### references/cli-commands-reference.md (~100 行)
- ID 类型定义
- Matrix 状态定义
- CLI 命令列表
- 错误处理流程
- 使用示例

### references/quality-gates.md (~80 行)
- C-PRD 评分规则
- Phase 0.4 PRD 自检
- Step 7 Gate Check
- 格式校验规则
- 失败处理流程

## 加载策略

### 始终加载
- SKILL.md (~200 行)

### 按需加载
- Phase 0 执行时 → `phase0-prd-workflow.md`
- Step 0-7 执行时 → `steps-fr-ac-workflow.md`
- 复杂度判定时 → `complexity-matrix.md`
- 需要时 → 其他 references

## 优势分析

### Context Window 优化
- 初始加载：200 行（vs 725 行）
- 节省：72% context window

### 维护性提升
- 单文件职责清晰
- 修改影响范围小
- 版本控制 diff 清晰

### 可扩展性
- 新增流程变体：添加新 reference 文件
- 修改某个步骤：只修改对应 reference
- 不影响其他部分
