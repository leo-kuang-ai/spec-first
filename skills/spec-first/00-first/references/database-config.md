# 数据库能力配置与适用性规范

> **当前正式 contract**：数据库认知是条件型能力，不是默认必选能力。
> 本文档约束 `database-schema.json` 的适用性判定、schema 来源优先级与 `database-er.md` 的条件生成规则。

## 1. 适用性判定

数据库能力只在以下场景进入正式分析：
- 检测到 ORM schema
- 检测到 migration / DDL
- 检测到明确数据库配置
- 检测到 repository / entity / model 等强证据

状态语义：
- `healthy`：证据充分，可生成 `database-schema.json`
- `degraded`：有数据库线索，但不足以形成正式 schema
- `not_applicable`：当前项目不适用数据库认知能力

## 2. 正式输出

### runtime truth

- `database-schema.json`

### projection docs

- `docs/first/database-er.md`

约束：
- 只有 `databaseSchema.status === healthy` 时才生成 `database-er.md`
- 不生成 `database-index.md`
- 不生成 `database-{name}.md`
- 不生成任何未注册数据库专题文件

## 3. schema 来源优先级

从高到低：
1. ORM schema：Prisma / TypeORM / Sequelize / Drizzle / Mongoose
2. migration / DDL
3. 数据库配置与连接声明
4. repository / entity / model 代码线索
5. `.spec-first/meta/config.yaml` 中的数据库配置

规则：
- 高优先级来源足够时，不依赖低优先级补全“想象中的结构”
- 低优先级只能补充证据，不能单独伪造完整 schema

## 4. 不适用场景

以下场景应直接判定为 `not_applicable`：
- 纯前端站点，无本地数据库或显式持久化层
- 纯库项目，无数据库接入语义
- 静态站点或文档仓库
- 仅有弱关键词但无实际 schema / config / code 证据

## 5. 降级场景

以下场景应判定为 `degraded`：
- 检测到数据库依赖，但没有 schema 级证据
- 只看到环境变量名，无法确认结构
- 只能识别数据库类型，无法识别表、集合、字段关系

降级行为：
- 允许写入 `database-schema.json`，但状态必须为 `degraded`
- 不生成正式 `database-er.md`
- 必须记录降级原因与证据不足点

## 6. 多数据库项目

多数据库场景的收口方式：
- 所有数据库事实统一汇总到同一份 `database-schema.json`
- 最终仍只有一个正式投影视图：`database-er.md`

约束：
- 不因数据库数量增加额外正式文档
- 不把数据库 `name` 当作文档命名入口

## 7. 安全与输出约束

- 不得输出密码、完整连接串、令牌、私钥
- 环境变量只允许保留名称，不允许保留敏感值
- 即时探测失败时，输出结构化原因，不回显原始凭证

## 8. 验收标准

- 能明确哪些项目不生成 `database-er.md`
- 能解释 `healthy / degraded / not_applicable` 的边界
- 能把多数据库项目收口到单一 `database-schema.json`
