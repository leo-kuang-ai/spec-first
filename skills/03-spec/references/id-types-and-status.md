# ID 类型与状态值参考

## 有效 ID 类型

CLI 支持的追踪 ID 类型：
- `FR` - 功能需求
- `DS` - 设计规格
- `TASK` - 任务
- `TC` - 测试用例
- `RFC` - 变更请求
- `REQ` - 通用需求（用于 PRD 需求项）
- `SYS` - 系统需求
- `ARCH` - 架构需求
- `MOD` - 模块需求
- `ATP` - 验收测试计划
- `STP` - 系统测试计划
- `ITP` - 集成测试计划
- `UTP` - 单元测试计划

**注意**：不存在 `REQ-PRD` 类型，PRD 需求项应使用 `REQ` 类型。

## 文档关联说明

文档关联索引不维护 Matrix 状态值，也不通过状态值表达关系强度。

- 状态请查看 `stage-state.json`
- 追踪关系请查看 `document-links.yaml`
- 过程结论请查看 `findings.md`

## CLI 命令示例

### 生成 ID
```bash
spec-first id next FR VIS --feature <featureId>
spec-first id next REQ VIS --feature <featureId>
```

### 查看文档关联
```bash
spec-first docs links validate <featureId>
```
