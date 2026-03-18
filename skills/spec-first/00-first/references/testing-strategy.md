# 00-first 测试策略（资产级）

> 覆盖 `spec-first:first` 的 runtime assets、docs projections、条件型能力、增量更新与增强路径约束。

## 1. 目标

- 验证 9 个正式 runtime 资产 contract 稳定
- 验证 9 个基础投影视图、4 个专题投影视图、1 个条件型投影视图 contract 稳定
- 验证 runtime truth 与 docs projection 一致
- 验证条件型数据库能力、增量刷新和增强路径不漂移

## 2. 分层

### 资产生成测试

关注：
- `summary.json`
- `steering.json`
- `conventions.json`
- `critical-flows.json`
- `entry-guide.json`
- `api-contracts.json`
- `structure-overview.json`
- `domain-model.json`
- `database-schema.json`

### 投影测试

关注：
- 16 个基础投影视图
- 5 个正式专题投影视图
- `README.md` 对 registry 与索引关系的表达

### 条件生成测试

关注：
- `databaseSchema.status === healthy` 时生成 `database-er.md`
- `not_applicable / degraded` 时不生成正式 `database-er.md`

### 增量更新测试

关注：
- 文件变更 -> runtime assets
- runtime assets -> docs projections
- `refresh-all` / `refresh-docs-from-runtime` 的行为

### 增强路径测试

关注：
- 增强提示文件只服务补证据，不替代 CLI 主链
- 失败降级不应破坏 runtime truth 主链
- 默认路径必须保持 `spec-first first`

## 3. 核心用例

| ID | 类型 | 目标 |
|----|------|------|
| T-SEC-01 | Security | 凭证与日志脱敏策略生效 |
| T-AUG-05 | Enhancement | 增强路径不替代 CLI 主链 |
| T-FIRST-01 | Runtime | Runtime assets 可被写入与读取 |
| T-FIRST-02 | Projection | 投影视图可由 runtime 重建 |
| T-FIRST-03 | Conditional | `database-er.md` 的条件生成语义正确 |
| T-FIRST-04 | Refresh | 增量刷新只影响匹配资产与投影视图 |

## 4. 回归触发条件

- 修改 `SKILL.md`
- 修改 `first-runtime-types.ts`
- 修改 `first-runtime-store.ts`
- 修改 `first-artifact-mapping.ts`
- 修改 `first-doc-projection.ts`
- 修改任意增强提示文件或主题 reference

## 5. 最低断言

- `.spec-first/runtime/first/index.json` 必须作为正式真索引
- Runtime assets 必须都能被识别
- `docs/first/*` 仅作为投影视图，不作为 runtime 真相
- Registry 中不得出现 ghost outputs 或未注册 docs
- 默认刷新策略优先走增量更新

## 6. 端类型与降级测试

- `T-TYPE-01`：backend 检测
- `T-TYPE-02`：frontend(admin) 检测
- `T-TYPE-03`：monorepo / mixed 识别
- `T-TYPE-04`：mobile 检测
- `T-GF-01`：空目录检测
- `T-DEG-01`：识别失败时仍保留标准模式正式产物集

## 7. 推荐测试文件

- `tests/unit/first-runtime-store.test.ts`
- `tests/unit/first-artifact-mapping.test.ts`
- `tests/unit/first-doc-projection.test.ts`
- `tests/unit/first-refresh.test.ts`
- `tests/unit/first-change-detector.test.ts`
- `tests/unit/first-command.test.ts`
- `tests/unit/first-skill-docs.test.ts`

## 8. 验收标准

- 测试对象按 runtime assets 与 docs projections 分层
- 条件型能力与专题文档有独立断言
- 文档测试与代码测试使用同一 contract 口径
