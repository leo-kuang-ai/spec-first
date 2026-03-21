# 数据库识别与条件型文档

> 数据库能力是条件型能力。
> 正式真源是 `database-schema.json`；执行提示见 `references/agent-database.md`；完整规则 owner 见 `references/database-config.md`。

## 1. 能力边界

### runtime truth

- `database-schema.json`（条件型）

### docs outputs

- `docs/first/database-er.md`（条件型）

### 不再承诺的产物

- 不产出 `database-index.md`
- 不产出 `database-{name}.md`
- 不产出任何未注册数据库专题文件

## 2. 简版状态表

| 状态 | 含义 | 行为 |
|------|------|------|
| `healthy` | 检测到明确数据库 schema 且证据充分 | 产出 `database-schema.json` 与 `database-er.md` |
| `not_applicable` | 当前项目不适用数据库认知能力 | 不产出 `database-er.md` |
| `degraded` | 检测到数据库线索但证据不足 | 不产出正式文档，仅记录告警 |

## 3. 输出约束

- 不得输出密码、完整连接串、令牌、私钥
- 不得因为检测到多个数据库就承诺额外文档
- 不得在 `not_applicable` 或 `degraded` 时输出正式 `database-er.md`
- Markdown 默认中文输出

更多状态语义、schema 来源优先级、凭证防护与多数据库收口规则，统一见 `references/database-config.md`。

## 4. 降级策略

- 无数据库项目：标记 `not_applicable`
- 仅有弱线索项目：标记 `degraded`
- 只有在结构化 schema 可确认时，才标记 `healthy`

## 5. 质量门禁引用

- 通用证据格式、抽样验证与违规判定统一遵循 `references/quality-assurance-rules.md`
