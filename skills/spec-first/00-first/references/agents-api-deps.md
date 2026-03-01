# Agent B / C1 — API 与外部依赖

> 同波独立并行，无数据依赖。
> 输入上下文：P1a tech-stack 结果 + `serena_available` 状态。

---

## Agent B: API 接口文档（api-docs.md）

按框架自动提取 API 端点：

### RESTful API

| 框架 | 提取方式 |
|------|----------|
| Spring Boot | `@RequestMapping`/`@GetMapping`/`@PostMapping` 等注解 |
| Express/Koa/Fastify/NestJS | `router.get/post/put/delete` 或装饰器 |
| Django/Flask/FastAPI | `urlpatterns`/`@app.route`/`@router` |
| Gin | `r.GET/POST/PUT/DELETE` |
| Laravel | `routes/*.php` |
| Rails | `config/routes.rb` |
| Next.js | `app/api/**/route.ts`、`pages/api/**/*.ts` |

### 非 REST API 范式

| 范式 | 检测方式 | 提取方式 |
|------|----------|----------|
| GraphQL | `*.graphql`/`*.gql` 文件、`@apollo/server`/`graphql-yoga`/`graphene` 依赖 | Schema 定义中的 Query/Mutation/Subscription |
| gRPC | `*.proto` 文件、`@grpc/grpc-js`/`grpcio` 依赖 | `.proto` 中的 service 和 rpc 定义 |
| tRPC | `@trpc/server` in package.json | router 定义中的 procedure |

输出格式：按模块分组，每个端点列出 Method、Path、描述（如有注释）；非 REST 范式单独分节

**Serena 辅助**（如 P0 激活成功）：
- 使用 `serena:find_symbol` 按装饰器/注解模式定位 API handler 函数，提高端点提取准确率
- 使用 `serena:find_symbol`（`include_info=true`）获取 handler 参数类型信息，补充请求/响应类型
- 降级：Serena 不可用时，基于正则匹配提取路由定义

输出 → `docs/first/api-docs.md`

---

## Agent C1: 外部依赖与第三方服务（external-deps.md）

扫描代码和配置中的第三方服务与中间件引用：

| 类别 | 检测方式 |
|------|----------|
| 消息队列 | RabbitMQ/Kafka/RocketMQ 依赖或配置 |
| 缓存 | Redis/Memcached 连接配置 |
| 对象存储 | OSS/S3/MinIO SDK 引用 |
| 支付 | 支付宝/微信支付/Stripe SDK |
| 短信/邮件 | 短信网关、SMTP 配置 |
| 搜索引擎 | Elasticsearch/Solr 配置 |
| 注册中心/配置中心 | Nacos/Consul/Eureka/Apollo 配置 |
| 监控 | Prometheus/Grafana/Sentry SDK |

输出 → `docs/first/external-deps.md`（头部包含 `last_updated: YYYY-MM-DD`）

---

## 质量保障规则（B / C1 通用）

- 通用证据格式、抽样流程、违规判定：见 `references/quality-assurance-rules.md`
- B/C1 的“必须标注证据内容”与“抽样规模”：见统一规则文档中的 Agent 矩阵
- B/C1 若出现无法验证项，必须显式标记 `[待确认]`
