# 00-first 测试策略

> 覆盖 `spec-first:first` 的最终 runtime 资产、docs 输出、条件型能力与治理链约束。

## 1. 目标

- 验证 9 个正式 runtime 资产 contract 稳定
- 验证 14 个 docs 输出 contract 稳定
- 验证 runtime 真源与 docs 输出边界稳定
- 验证 Skill 直写最终文件、CLI 只做校验与宿主集成的主链稳定
- 验证条件型数据库能力、治理写回与增强路径不漂移
- 验证总并发上限 3 个 Agent 的编排约束稳定

## 2. 分层

### runtime 资产测试

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

### docs 输出测试

关注：
- 14 个 docs 输出
- `README.md` 对索引与导航关系的表达
- `database-er.md` 的条件产出语义

### 辅助 docs 索引测试

关注：
- `docs-index.json` 仅用于 docs 阅读路由与快速索引
- `docs-index.json` 不应影响 runtime 真源健康判定
- `docs-index.json` 可以缺省，但不应破坏 runtime / docs 主链

### CLI 校验测试

关注：
- 缺少最终 runtime/doc 文件时直接失败
- runtime 存在时可验证读取与摘要输出
- CLI 不再承担 runtime/docs 产出职责

### 条件产出测试

关注：
- `databaseSchema.status === healthy` 时 `database-er.md` 必须存在
- `not_applicable / degraded` 时不应把 `database-er.md` 当作必需产物

### 治理与更新测试

关注：
- 文件变更 -> runtime 资产影响
- runtime 资产 -> docs 输出影响
- writeback / update 只影响匹配资产与 docs 输出

### 增强路径测试

关注：
- 增强提示文件只服务补证据，不替代 Skill 主链
- 失败降级不应破坏 runtime truth 主链
- 默认路径必须保持 `spec-first first`

## 3. 核心用例

| ID | 类型 | 目标 | 推荐文件 |
|----|------|------|----------|
| T-SEC-01 | Security | 凭证与日志脱敏策略生效 | `tests/unit/first-command.test.ts` |
| T-AUG-05 | Enhancement | 增强路径不替代 Skill 主链 | `tests/unit/first-skill-docs.test.ts` |
| T-FIRST-00 | Validation | 缺少最终 runtime/docs 时直接失败 | `tests/integration/first-cli-real-flow.test.ts` |
| T-FIRST-01 | Runtime | Runtime assets 可被写入与读取 | `tests/unit/first-runtime-store.test.ts` |
| T-FIRST-02 | Docs Output | docs 输出可由 Skill 写入并校验存在 | `tests/unit/first-doc-projection.test.ts` |
| T-FIRST-03 | Conditional | `database-er.md` 的条件语义正确 | `tests/unit/first-governance.test.ts` |
| T-FIRST-04 | Governance | 治理更新只影响匹配资产与 docs 输出 | `tests/unit/first-governance.test.ts` |
| T-FIRST-05 | Docs Index | `docs-index.json` 仅作为辅助索引，不参与真源判定 | `tests/unit/first-bootstrap-validation.test.ts` |

说明：
- “推荐文件”表示主要覆盖位置，不要求一一对应
- 同一个测试文件可以覆盖多个用例 ID
- 若一个用例由多处断言共同覆盖，优先把主要断言所在文件标为推荐文件

## 4. 回归触发条件

- 修改 `SKILL.md`
- 修改 `first-runtime-types.ts`
- 修改 `first-runtime-store.ts`
- 修改 `first-artifact-mapping.ts`
- 修改 `first-doc-projection.ts`
- 修改 `first-bootstrap.ts`
- 修改任意增强提示文件或主题 reference
- 修改图示输出格式，尤其是 Mermaid -> ASCII 的迁移

## 5. 最低断言

- `.spec-first/runtime/first/index.json` 必须作为正式真索引
- Runtime assets 必须都能被识别
- `docs/first/*` 仅作为阅读输出，不作为 runtime 真相
- 不得再依赖临时中转目录
- Registry 中不得出现 ghost outputs 或未注册 docs

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
- `tests/unit/first-change-detection.test.ts`
- `tests/unit/first-command.test.ts`
- `tests/unit/first-skill-docs.test.ts`
- `tests/unit/first-governance.test.ts`
- `tests/unit/first-bootstrap-validation.test.ts`
- `tests/integration/first-cli-real-flow.test.ts`
- `tests/integration/first-governance-e2e.test.ts`

## 8. 验收标准

- 测试对象按 runtime assets 与 docs outputs 分层
- 条件型能力与专题文档有独立断言
- 文档测试与代码测试使用同一 contract 口径
- docs 输出中不得再出现 Mermaid 图块
