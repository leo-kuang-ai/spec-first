# 数据库识别与条件型文档

> **当前正式 contract**：数据库能力是条件型能力。
> 正式真源是 `database-schema.json`；正式文档只有 `database-er.md`，且仅在 `databaseSchema.status === healthy` 时产出。
> 执行提示见 `references/agent-database.md`，两者分工不同。

## 1. 能力边界

### runtime truth

- `database-schema.json`（条件型）

### docs outputs

- `docs/first/database-er.md`（条件型）

### 不再承诺的产物

- 不产出 `database-index.md`
- 不产出 `database-{name}.md`
- 不产出任何未注册数据库专题文件

## 2. 状态语义

| 状态 | 含义 | 行为 |
|------|------|------|
| `healthy` | 检测到明确数据库 schema 且证据充分 | 产出 `database-schema.json` 与 `database-er.md` |
| `not_applicable` | 当前项目不适用数据库认知能力 | 不产出 `database-er.md` |
| `degraded` | 检测到数据库线索但证据不足 | 不产出正式文档，仅记录告警 |

## 3. 证据来源

- ORM schema（如 Prisma / TypeORM / Sequelize）
- migration 文件
- 数据库相关配置
- 代码中的 repository / model / entity 线索
- `.spec-first/meta/config.yaml` 中的数据库配置（如存在）

## 4. 输出约束

- 不得输出密码、完整连接串、令牌、私钥
- 不得因为检测到多个数据库就承诺额外文档
- 不得在 `not_applicable` 或 `degraded` 时输出正式 `database-er.md`
- Markdown 默认中文输出

## 5. 凭证防护执行规则（技术性，强制）

- 最小暴露：仅在执行即时连接探测时读取凭证，不写入产物正文、不写入长期缓存。
- 日志脱敏：日志中若出现连接串或口令字段，必须替换敏感片段为 `***`。
- 输出约束：禁止输出密码、完整连接串、长期访问令牌、私钥内容。
- 失败兜底：当 CLI 不可用或鉴权失败时，降级为结构化提示，不回显原始凭证内容。
- 会话清理：探测结束后清理临时环境变量与内存中的明文凭证引用。

## 6. 降级策略

- 无数据库项目：标记 `not_applicable`
- 仅有弱线索项目：标记 `degraded`
- 只有在结构化 schema 可确认时，才标记 `healthy`

## 7. 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
