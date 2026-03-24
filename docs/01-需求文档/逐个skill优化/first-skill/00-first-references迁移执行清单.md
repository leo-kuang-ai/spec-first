# 00-first References 迁移执行清单

> 目标：把 `references/` 从“多份同构小文档”迁移到“少量主干文档 + 模板 + 决策指南”的结构。

## 1. 迁移目标

- 保留 `first` 的能力边界。
- 合并重复的主题文档。
- 删除被合并后失去独立价值的旧文档。
- 新增一个统一模板，减少后续重复编写。

## 2. 迁移顺序

### Phase 0：先确认保留对象

1. 保留 `SKILL.md`。
2. 保留执行主干文档。
3. 保留主线程契约主干文档。
4. 保留证据包规范主干文档。
5. 保留质量与验证主干文档。
6. 保留分类与映射主干文档。
7. 保留数据库能力主干文档。
8. 新增主题模板文档。

### Phase 1：合并主干契约

1. 合并 `execution-flow.md` 与 `subagent-architecture.md`。
2. 合并 `main-thread-contract.md`、`evidence-pack-spec.md`、`agent-output-schema.md`。
3. 合并 `quality-assurance-rules.md` 与 `testing-strategy.md`。

### Phase 2：合并分类与数据库

1. 合并 `detection-rules.md` 与 `platform-document-mapping.md`。
2. 合并 `agent-database.md`、`database-conditional-projection.md`、`database-config.md`。

### Phase 3：合并主题双文件

1. 合并 `agents-code-analysis.md` 与 `structure-analysis.md`。
2. 合并 `agents-api-deps.md` 与 `api-and-dependencies.md`。
3. 合并 `agent-guidelines-setup.md` 与 `conventions-and-setup.md`。
4. 合并 `agent-domain-model.md` 与 `domain-model-analysis.md`。

### Phase 4：更新交叉引用

1. 更新 `references/` 内部交叉引用，确保所有旧文件名都替换为新主文档名。
2. 重写 `SKILL.md` 的 `Reference 读取规则` 表格，使其与新目录结构一致。
3. 核对下列高风险引用链：
   - `platform-document-mapping.md` 的引用者：`api-and-dependencies.md`、`database-config.md`
   - `database-config.md` 的引用者：`database-conditional-projection.md`、`platform-document-mapping.md`
   - 各 `agent-*.md` 的引用者：对应的主题规范文件

### Phase 5：清理旧文件

1. 删除已被合并的新主文档之外的旧文件。
2. 仅保留最终主干和模板。

## 3. 最终目录树

```text
references/
  execution-and-agent-architecture.md
  main-thread-and-evidence-contract.md
  quality-and-verification.md
  project-classification-and-doc-mapping.md
  database-analysis-contract.md
  first-routing-guide.md
  topic-agent-template.md
```

可选：

```text
references/
  agent-output-schema.md
```

> 注：上面的目录树描述的是收敛后的目标层级。当前仓库里已落地的 canonical 文件名分别是 `quality-assurance-rules.md`、`platform-document-mapping.md`、`database-analysis.md`，逻辑职责与这里的目标层一致。

## 4. 文件级动作清单

### 4.1 execution-flow / subagent-architecture

- 新建 `execution-and-agent-architecture.md`
- 将主线程流程、Agent 分组、波次、并发上限、失败重试、交接边界写入同一文档
- 删除旧双文件

### 4.2 main-thread-contract / evidence-pack-spec / agent-output-schema

- 新建 `main-thread-and-evidence-contract.md`
- 合并主线程保留内容、证据包结构、输出 schema
- 若新文档已覆盖全部输出格式，可删除 `agent-output-schema.md`

### 4.3 quality-assurance-rules / testing-strategy

- 新建 `quality-and-verification.md`
- 合并证据标注、抽样验证、测试层次、回归触发、验收标准
- 删除旧双文件

### 4.4 detection-rules / platform-document-mapping

- 新建 `project-classification-and-doc-mapping.md`
- 合并项目识别、子类型、端类型影响、条件型文档策略
- 删除旧双文件

### 4.5 database 三件套

- 新建 `database-analysis-contract.md`
- 合并数据库识别、条件型产物、配置优先级、安全边界
- 删除旧三文件

### 4.6 主题分析双文件

- 每组保留一个统一主文档
- 统一采用“执行提示 + 主题范围 + 正式输出 + 证据来源 + 输出约束 + 降级策略”的结构
- 删除重复文件

### 4.7 交叉引用更新

- 先更新 `references/` 内部交叉引用，再删除旧文件。
- `SKILL.md` 的 `Reference 读取规则` 表格必须同步重写为新结构。
- 若某文件仍被其他 Skill 直接引用，必须先改引用，再允许删除旧文件。

## 5. 验收清单

重构完成后，检查以下项：

- `references/` 中不再保留成对的“执行提示 + 主题规范”重复结构。
- 主线程契约、证据包、输出 schema 不再散落多份。
- 质量规则与测试策略已收口。
- 分类识别与文档映射已收口。
- 数据库能力已收口。
- 新主题可以通过模板扩展，而不是复制现有文档。
- `references/` 内部交叉引用已全部更新。
- `SKILL.md` 的 `Reference 读取规则` 已改写为新文档结构。
- 旧文件删除前，所有引用者已切换到新主文档名。

## 6. 风险控制

- 合并时保留原有术语，避免一次性改动过大。
- 优先保证引用链不断裂，再清理旧文件。
- 若某文件仍被其他 Skill 直接引用，先更新引用再删除旧文件。

## 7. 推荐执行方式

1. 先创建新主文档。
2. 再迁移正文。
3. 再更新 `references/` 内部交叉引用。
4. 再更新 `SKILL.md` 的 `Reference 读取规则` 表格。
5. 最后删除旧文件。

这样能避免文档失联和引用断链。
