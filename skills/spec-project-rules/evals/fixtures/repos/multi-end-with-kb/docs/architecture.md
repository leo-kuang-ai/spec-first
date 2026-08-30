---
generated_at: 2026-08-28
source_commit: eval0001
---
# Shop Monorepo 架构知识库
<!-- spec-project-rules-start -->

## 归属（own）
- apps/web 与 apps/admin 是两个独立前端；packages/ 只放与端无关的逻辑与组件 | confirmed | `README.md`（架构边界节）

## 依赖方向（dep）
- apps/admin 禁止依赖 apps/web 的业务代码，跨端复用一律走 packages/ | confirmed | `README.md`（admin 不得依赖 apps/web） | 例外: `apps/admin/src/legacy/OldPanel.ts` 为历史例外，不得扩大

## 复用（reuse）
- HTTP 客户端：住址 `packages/api-client/index.ts`，查法 `rg createClient apps packages` | inferred | `apps/web/src/order.ts` 等 3 文件

## 约定（rules）
- HTTP 请求必须走 createClient 封装，禁止直接 fetch/axios | inferred | `apps/web/src/order.ts`、`apps/web/src/cart.ts`、`apps/admin/src/stats.ts`

<!-- spec-project-rules-end -->
