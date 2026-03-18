# 数据库执行提示

> 这是增强路径提示，不是主题规范正文。只在 CLI 输出证据不足时补数据库适用性、schema 证据和条件型投影判断。

## 适用场景

- 需要确认项目是否适用数据库认知能力
- `database-schema.json` 证据不足
- 需要判断是否允许生成 `docs/first/database-er.md`

## 对应 runtime 资产

- `database-schema.json`

## 最小执行责任

- 先判断数据库能力是否 `healthy` / `degraded` / `not_applicable`
- 把结构化 schema 事实写入 `database-schema.json`
- 只有 `databaseSchema.status === healthy` 时才允许生成 `docs/first/database-er.md`
- 不生成 `database-index.md` 或其他未注册数据库专题文件

## 凭证防护执行规则（技术性，强制）

- 最小暴露：仅在执行即时连接探测时读取凭证，不写入产物正文、不写入长期缓存
- 日志脱敏：日志中若出现连接串或口令字段，必须替换敏感片段为 `***`
- 输出约束：禁止输出密码、完整连接串、长期访问令牌、私钥内容
- 失败兜底：当 CLI 不可用或鉴权失败时，降级为结构化提示，不回显原始凭证内容
- 会话清理：探测结束后清理临时环境变量与内存中的明文凭证引用

## 工具与降级

- 优先使用 ORM schema、migration、配置和 repository / entity 线索
- 只有在必要且安全时才做即时连接探测
- 无数据库项目标记 `not_applicable`
- 仅有弱线索项目标记 `degraded`

## 质量保障

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
