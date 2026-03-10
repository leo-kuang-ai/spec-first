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

## Matrix 有效状态值

追踪矩阵支持的状态：
- `Planned` - 已规划（默认）
- `Implemented` - 已实现
- `Verified` - 已验证
- `Accepted` - 已验收
- `Deferred` - 已延期
- `Cancelled` - 已取消
- `Exception` - 例外处理

### 状态生命周期

**非终态 (Non-Terminal Status)**：
- `Planned` → `Implemented` → `Verified`
- `Deferred` - 暂缓实现

**终态 (Terminal Status)**：
- `Accepted` - 已验收通过（正常完成）
- `Cancelled` - 已取消（不再实现）
- `Exception` - 例外处理（特殊情况）

**重要**：06_wrap_up 阶段的 Gate Check 要求所有矩阵条目必须达到终态。`Verified` 状态需推进到 `Accepted` 才能通过归档门禁。

**注意**：
- 不支持 `pending` 状态，应使用 `Planned`
- 不支持 `InProgress`/`Completed`/`Blocked`，应分别使用 `Implemented`/`Verified`/`Deferred`

## CLI 命令示例

### 生成 ID
```bash
spec-first id next FR VIS --feature <featureId>
spec-first id next REQ VIS --feature <featureId>
```

### 更新矩阵
```bash
spec-first matrix update <featureId> <id> --title "标题" --yes
```

**注意**：`matrix update` 需要 `--yes` 确认（policy=strict）。
